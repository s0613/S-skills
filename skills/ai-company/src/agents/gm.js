import { spawn } from 'child_process';
import { DEPT_PROMPTS } from './prompts.js';

function callAgent(dept, task, context = '') {
  return new Promise((resolve, reject) => {
    const systemPrompt = DEPT_PROMPTS[dept];
    const userMessage = context ? `컨텍스트:\n${context}\n\n지시:\n${task}` : task;

    const args = [
      '-p', userMessage,
      '--system-prompt', systemPrompt,
      '--tools', '',
      '--model', 'sonnet',
      '--output-format', 'json',
      '--bare',
      '--no-session-persistence',
    ];

    const proc = spawn('claude', args);
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', chunk => { stdout += chunk.toString(); });
    proc.stderr.on('data', chunk => { stderr += chunk.toString(); });

    proc.on('close', code => {
      if (code !== 0) {
        reject(new Error(`claude CLI 오류 (exit ${code}): ${stderr.slice(0, 200)}`));
        return;
      }

      let text = stdout.trim();
      try {
        const cliOutput = JSON.parse(stdout);
        text = cliOutput.result ?? stdout.trim();
      } catch {
        // output-format이 text인 경우 그대로 사용
      }

      // token 사용량 추정 (4자 ≈ 1 토큰)
      const used = Math.round(text.length / 4);

      try {
        resolve({ result: JSON.parse(text), raw: text, used });
      } catch {
        resolve({ result: { raw: text }, raw: text, used });
      }
    });

    proc.on('error', reject);
  });
}

export async function orchestrate({ userMessage, projectContext, onUpdate, onRequestApproval, currentBudget }) {
  // 1. GM이 작업 분석 + 계획 수립
  onUpdate({ dept: 'GM', status: 'in_progress', message: '요청 분석 중...' });

  const contextStr = projectContext ? JSON.stringify(projectContext, null, 2) : '';
  const gmResult = await callAgent('GM', userMessage, contextStr);
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
          const deptResult = await callAgent(dept, task, sharedContext);
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
      const deptResult = await callAgent(dept, task, sharedContext);
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
