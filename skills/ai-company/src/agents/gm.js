import { spawn } from 'child_process';
import { DEPT_PROMPTS } from './prompts.js';

const VALID_DEPTS = new Set(['PM', 'Dev', 'Design', 'QA']);
const MAX_CONTEXT_CHARS = 20000;

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
      '--no-session-persistence',
    ];

    const proc = spawn('claude', args, { stdio: ['ignore', 'pipe', 'pipe'] });
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
      let used = 0;
      try {
        const cliOutput = JSON.parse(stdout);
        text = cliOutput.result ?? stdout.trim();
        // CLI JSON에 실제 토큰 수가 있으면 사용
        if (cliOutput.usage) {
          used = (cliOutput.usage.input_tokens || 0) + (cliOutput.usage.output_tokens || 0);
        }
      } catch {
        // text 형식이면 그대로 사용
      }
      if (!used) used = Math.round(text.length / 4);

      try {
        resolve({ result: JSON.parse(text), raw: text, used });
      } catch {
        resolve({ result: { raw: text }, raw: text, used });
      }
    });

    proc.on('error', reject);
  });
}

function validatePlan(plan) {
  if (!Array.isArray(plan?.plan) || plan.plan.length === 0) {
    return 'GM이 유효한 계획을 반환하지 않았습니다.';
  }
  for (const step of plan.plan) {
    if (!VALID_DEPTS.has(step.dept)) {
      return `알 수 없는 부서: "${step.dept}" (허용: ${[...VALID_DEPTS].join(', ')})`;
    }
    if (typeof step.task !== 'string' || !step.task.trim()) {
      return `${step.dept} 단계에 task가 없습니다.`;
    }
  }
  return null;
}

export async function orchestrate({ userMessage, projectContext, onUpdate, onRequestApproval, currentBudget }) {
  // 1. GM이 작업 분석 + 계획 수립
  await onUpdate({ dept: 'GM', status: 'in_progress', message: '요청 분석 중...' });

  const contextStr = projectContext ? JSON.stringify(projectContext, null, 2) : '';
  const gmResult = await callAgent('GM', userMessage, contextStr);
  const plan = gmResult.result;

  const planError = validatePlan(plan);
  if (planError) {
    await onUpdate({ dept: 'GM', status: 'failed', message: planError });
    return { success: false, error: planError };
  }

  await onUpdate({
    dept: 'GM',
    status: 'completed',
    message: plan.message_to_user || '계획 수립 완료',
    plan: plan.plan,
  });

  // 2. 병렬 그룹으로 묶어서 실행
  const results = {};

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
        await onUpdate({ dept: step.dept, status: 'in_progress', message: `${step.dept} 작업 시작... (병렬)` });
      }
      const groupResults = await Promise.all(
        group.map(async ({ dept, task, budget: stepBudget }) => {
          if (currentBudget && onRequestApproval) {
            const deptBudget = currentBudget[dept];
            if (deptBudget) {
              const needed = stepBudget || 8000;
              const remaining = deptBudget.allocated - deptBudget.used;
              if (needed > remaining) {
                const approved = await onRequestApproval(dept, needed, remaining);
                if (!approved) {
                  await onUpdate({ dept, status: 'failed', message: `${dept} 작업 취소됨 (예산 초과 거부)` });
                  return '';
                }
              }
            }
          }
          const deptResult = await callAgent(dept, task, sharedContext);
          results[dept] = deptResult.result;
          await onUpdate({
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

      if (currentBudget && onRequestApproval) {
        const deptBudget = currentBudget[dept];
        if (deptBudget) {
          const needed = stepBudget || 8000;
          const remaining = deptBudget.allocated - deptBudget.used;
          if (needed > remaining) {
            const approved = await onRequestApproval(dept, needed, remaining);
            if (!approved) {
              await onUpdate({ dept, status: 'failed', message: `${dept} 작업 취소됨 (예산 초과 거부)` });
              continue;
            }
          }
        }
      }

      await onUpdate({ dept, status: 'in_progress', message: `${dept} 작업 시작...` });
      const deptResult = await callAgent(dept, task, sharedContext);
      results[dept] = deptResult.result;
      sharedContext = deptResult.raw;
      await onUpdate({
        dept,
        status: 'completed',
        message: `${dept} 완료`,
        tokensUsed: deptResult.used,
        result: deptResult.result,
      });
    }

    // 컨텍스트 누적 방지
    if (sharedContext.length > MAX_CONTEXT_CHARS) {
      sharedContext = sharedContext.slice(-MAX_CONTEXT_CHARS);
    }
  }

  return { success: true, plan, results };
}
