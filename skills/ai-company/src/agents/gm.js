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

export async function orchestrate({ userMessage, projectContext, onUpdate }) {
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

  // 2. 부서별 순차 실행
  const results = {};
  let previousOutput = '';

  for (const step of plan.plan) {
    const { dept, task, budget } = step;

    onUpdate({ dept, status: 'in_progress', message: `${dept} 작업 시작...` });

    const deptResult = await callAgent(dept, task, budget || 8000, previousOutput);
    results[dept] = deptResult.result;
    previousOutput = deptResult.raw;

    onUpdate({
      dept,
      status: 'completed',
      message: `${dept} 완료`,
      tokensUsed: deptResult.used,
      result: deptResult.result,
    });
  }

  return { success: true, plan, results };
}
