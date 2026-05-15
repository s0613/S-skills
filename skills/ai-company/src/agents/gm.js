import Anthropic from '@anthropic-ai/sdk';
import { DEPT_PROMPTS } from './prompts.js';

const client = new Anthropic();

async function callAgent(dept, task, budgetTokens, context = '') {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: Math.min(budgetTokens, 8192),
    system: DEPT_PROMPTS[dept],
    messages: [
      { role: 'user', content: context ? `컨텍스트:\n${context}\n\n지시:\n${task}` : task }
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const used = response.usage.input_tokens + response.usage.output_tokens;

  try {
    return { result: JSON.parse(text), used, raw: text };
  } catch {
    return { result: { raw: text }, used, raw: text };
  }
}

export async function orchestrate({ userMessage, projectContext, onUpdate, onRequestApproval, currentBudget }) {
  // 1. GM이 작업 분석 + 계획 수립
  onUpdate({ dept: 'GM', status: 'in_progress', message: '요청 분석 중...' });

  const contextStr = projectContext ? JSON.stringify(projectContext, null, 2) : '';
  const gmResult = await callAgent('GM', userMessage, 4000, contextStr);
  const plan = gmResult.result;

  onUpdate({
    dept: 'GM',
    status: 'completed',
    message: plan.message_to_user || '계획 수립 완료',
    plan: plan.plan,
  });

  if (!plan.plan || plan.plan.length === 0) {
    return { success: false, error: 'GM이 계획을 수립하지 못했습니다.' };
  }

  // 2. 병렬 그룹으로 묶어서 실행
  const results = {};

  // consecutive parallel:true steps → same group
  const groups = [];
  let i = 0;
  while (i < plan.plan.length) {
    if (plan.plan[i].parallel) {
      const group = [];
      while (i < plan.plan.length && plan.plan[i].parallel) {
        group.push(plan.plan[i]);
        i++;
      }
      groups.push(group);
    } else {
      groups.push([plan.plan[i]]);
      i++;
    }
  }

  let sharedContext = '';

  for (const group of groups) {
    if (group.length > 1) {
      // 병렬 실행
      for (const step of group) {
        onUpdate({ dept: step.dept, status: 'in_progress', message: `${step.dept} 작업 시작... (병렬)` });
      }
      const groupResults = await Promise.all(
        group.map(async ({ dept, task, budget: stepBudget }) => {
          // 예산 초과 체크 (병렬)
          if (currentBudget && onRequestApproval) {
            const deptBudget = currentBudget[dept];
            if (deptBudget) {
              const needed = stepBudget || 8000;
              const remaining = deptBudget.allocated - deptBudget.used;
              if (needed > remaining) {
                const approved = await onRequestApproval(dept, needed, remaining);
                if (!approved) {
                  onUpdate({ dept, status: 'failed', message: `${dept} 작업 취소됨 (예산 초과 거부)` });
                  return '';
                }
              }
            }
          }
          const deptResult = await callAgent(dept, task, stepBudget || 8000, sharedContext);
          results[dept] = deptResult.result;
          onUpdate({
            dept,
            status: 'completed',
            message: `${dept} 완료 (병렬)`,
            tokensUsed: deptResult.used,
            result: deptResult.result,
          });
          return deptResult.raw;
        })
      );
      sharedContext = groupResults.join('\n---\n');
    } else {
      // 순차 실행
      const { dept, task, budget: stepBudget } = group[0];

      // 예산 초과 체크
      if (currentBudget && onRequestApproval) {
        const deptBudget = currentBudget[dept];
        if (deptBudget) {
          const needed = stepBudget || 8000;
          const remaining = deptBudget.allocated - deptBudget.used;
          if (needed > remaining) {
            const approved = await onRequestApproval(dept, needed, remaining);
            if (!approved) {
              onUpdate({ dept, status: 'failed', message: `${dept} 작업 취소됨 (예산 초과 거부)` });
              continue;
            }
          }
        }
      }

      onUpdate({ dept, status: 'in_progress', message: `${dept} 작업 시작...` });
      const deptResult = await callAgent(dept, task, stepBudget || 8000, sharedContext);
      results[dept] = deptResult.result;
      sharedContext = deptResult.raw;
      onUpdate({
        dept,
        status: 'completed',
        message: `${dept} 완료`,
        tokensUsed: deptResult.used,
        result: deptResult.result,
      });
    }
  }

  return { success: true, plan, results };
}
