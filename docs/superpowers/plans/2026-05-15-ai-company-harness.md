# AI Company Harness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Claude CLI 안에서 `/ai-company` 스킬로 진입하면 Ink TUI 대시보드가 열리고, GM AI 에이전트가 PM·Dev·Design·QA 부서 에이전트를 조율하며 작업을 수행하는 AI SI 회사 하네스를 구축한다.

**Architecture:** SKILL.md가 Node.js Ink 앱을 Bash로 실행하는 런처 역할을 한다. Ink 앱은 Anthropic SDK로 GM 에이전트를 직접 호출하고, GM이 부서별 서브에이전트를 순차/병렬로 spawn한다. 상태는 `~/.ai-company/<project>/` JSON 파일에 저장되어 세션 간 유지된다.

**Tech Stack:** Node.js v22, Ink v4 (React for CLI), React v18, @anthropic-ai/sdk, ink-spinner

---

## File Map

```
skills/ai-company/
├── SKILL.md                     # Claude 스킬 진입점 - Node 앱 실행
├── package.json                 # 의존성
├── src/
│   ├── index.jsx                # Ink 렌더 진입점
│   ├── App.jsx                  # 메인 레이아웃 (Header + ChatPanel + SidePanel)
│   ├── components/
│   │   ├── Header.jsx           # 프로젝트명 + 세션 타이머
│   │   ├── ChatPanel.jsx        # GM 대화 패널 (왼쪽)
│   │   ├── DeptTable.jsx        # 부서 상태 테이블 (오른쪽 상단)
│   │   ├── BudgetBar.jsx        # 토큰 예산 바 (오른쪽 하단)
│   │   └── CmdBar.jsx           # 명령어 입력 바 (하단)
│   ├── agents/
│   │   ├── gm.js                # GM 오케스트레이터 (Anthropic SDK 호출)
│   │   └── prompts.js           # PM/Dev/Design/QA 시스템 프롬프트
│   └── state/
│       ├── manager.js           # ~/.ai-company/<project>/ 읽기/쓰기
│       └── defaults.js          # 기본 state/budget 스키마
└── tests/
    ├── state.test.js
    └── budget.test.js
```

**Modified files:**
- `.claude-plugin/marketplace.json` — 스킬 등록 확인 (이미 `./` 로 로컬 로드 중, 수정 불필요)

---

## Task 1: 프로젝트 스캐폴딩

**Files:**
- Create: `skills/ai-company/package.json`
- Create: `skills/ai-company/src/` (디렉토리 구조)

- [ ] **Step 1: package.json 작성**

```json
{
  "name": "ai-company",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "start": "node src/index.jsx",
    "test": "node --experimental-vm-modules node_modules/.bin/jest"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.39.0",
    "ink": "^4.4.1",
    "ink-spinner": "^5.0.0",
    "react": "^18.3.1"
  },
  "devDependencies": {
    "jest": "^29.7.0"
  },
  "jest": {
    "testEnvironment": "node",
    "transform": {}
  }
}
```

- [ ] **Step 2: 의존성 설치**

```bash
cd skills/ai-company && npm install
```

Expected: `node_modules/` 생성, ink + react + @anthropic-ai/sdk 설치 완료

- [ ] **Step 3: 디렉토리 구조 생성**

```bash
mkdir -p skills/ai-company/src/components
mkdir -p skills/ai-company/src/agents
mkdir -p skills/ai-company/src/state
mkdir -p skills/ai-company/tests
```

- [ ] **Step 4: Commit**

```bash
git add skills/ai-company/package.json skills/ai-company/package-lock.json
git commit -m "feat(ai-company): 프로젝트 스캐폴딩"
```

---

## Task 2: 상태 관리 레이어

**Files:**
- Create: `skills/ai-company/src/state/defaults.js`
- Create: `skills/ai-company/src/state/manager.js`
- Create: `skills/ai-company/tests/state.test.js`

- [ ] **Step 1: 기본 스키마 정의**

`skills/ai-company/src/state/defaults.js`:

```js
export const DEFAULT_STATE = {
  project: '',
  active_task: null,
  phase: 'idle',
  departments: {
    PM:     { status: 'idle', tasks_done: 0, tasks_total: 0, output: null },
    Dev:    { status: 'idle', tasks_done: 0, tasks_total: 0, output: null },
    Design: { status: 'idle', tasks_done: 0, tasks_total: 0, output: null },
    QA:     { status: 'idle', tasks_done: 0, tasks_total: 0, output: null },
  },
  last_updated: null,
};

export const DEFAULT_BUDGET = {
  total:   { allocated: 100000, used: 0 },
  PM:      { allocated: 20000,  used: 0 },
  Dev:     { allocated: 40000,  used: 0 },
  Design:  { allocated: 20000,  used: 0 },
  QA:      { allocated: 20000,  used: 0 },
};
```

- [ ] **Step 2: 실패하는 테스트 작성**

`skills/ai-company/tests/state.test.js`:

```js
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { StateManager } from '../src/state/manager.js';

let dir;
let manager;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'ai-company-test-'));
  manager = new StateManager(dir);
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

test('loadState returns default when no file exists', async () => {
  const state = await manager.loadState('test-project');
  expect(state.project).toBe('test-project');
  expect(state.phase).toBe('idle');
});

test('saveState and loadState round-trips correctly', async () => {
  await manager.saveState('test-project', { phase: 'dev', active_task: 'fix login' });
  const loaded = await manager.loadState('test-project');
  expect(loaded.phase).toBe('dev');
  expect(loaded.active_task).toBe('fix login');
});

test('loadBudget returns default when no file exists', async () => {
  const budget = await manager.loadBudget('test-project');
  expect(budget.total.allocated).toBe(100000);
  expect(budget.total.used).toBe(0);
});

test('consumeBudget increments used for dept and total', async () => {
  await manager.consumeBudget('test-project', 'Dev', 5000);
  const budget = await manager.loadBudget('test-project');
  expect(budget.Dev.used).toBe(5000);
  expect(budget.total.used).toBe(5000);
});
```

- [ ] **Step 3: 테스트 실행 → 실패 확인**

```bash
cd skills/ai-company && npm test -- tests/state.test.js
```

Expected: `Cannot find module '../src/state/manager.js'`

- [ ] **Step 4: StateManager 구현**

`skills/ai-company/src/state/manager.js`:

```js
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { DEFAULT_STATE, DEFAULT_BUDGET } from './defaults.js';

export class StateManager {
  constructor(baseDir = join(process.env.HOME, '.ai-company')) {
    this.baseDir = baseDir;
  }

  #projectDir(project) {
    return join(this.baseDir, project);
  }

  async #ensureDir(project) {
    await mkdir(this.#projectDir(project), { recursive: true });
  }

  async loadState(project) {
    await this.#ensureDir(project);
    const file = join(this.#projectDir(project), 'state.json');
    try {
      const raw = await readFile(file, 'utf8');
      return JSON.parse(raw);
    } catch {
      return { ...DEFAULT_STATE, project, last_updated: new Date().toISOString() };
    }
  }

  async saveState(project, patch) {
    await this.#ensureDir(project);
    const current = await this.loadState(project);
    const next = { ...current, ...patch, last_updated: new Date().toISOString() };
    const file = join(this.#projectDir(project), 'state.json');
    await writeFile(file, JSON.stringify(next, null, 2), 'utf8');
    return next;
  }

  async loadBudget(project) {
    await this.#ensureDir(project);
    const file = join(this.#projectDir(project), 'budget.json');
    try {
      const raw = await readFile(file, 'utf8');
      return JSON.parse(raw);
    } catch {
      return structuredClone(DEFAULT_BUDGET);
    }
  }

  async consumeBudget(project, dept, tokens) {
    const budget = await this.loadBudget(project);
    budget[dept].used += tokens;
    budget.total.used += tokens;
    const file = join(this.#projectDir(project), 'budget.json');
    await writeFile(file, JSON.stringify(budget, null, 2), 'utf8');
    return budget;
  }

  async setBudget(project, allocations) {
    const budget = await this.loadBudget(project);
    for (const [dept, allocated] of Object.entries(allocations)) {
      if (budget[dept]) budget[dept].allocated = allocated;
    }
    const file = join(this.#projectDir(project), 'budget.json');
    await writeFile(file, JSON.stringify(budget, null, 2), 'utf8');
    return budget;
  }

  async listProjects() {
    const { readdir } = await import('fs/promises');
    try {
      const entries = await readdir(this.baseDir, { withFileTypes: true });
      return entries.filter(e => e.isDirectory()).map(e => e.name);
    } catch {
      return [];
    }
  }
}
```

- [ ] **Step 5: 테스트 실행 → 통과 확인**

```bash
cd skills/ai-company && npm test -- tests/state.test.js
```

Expected: 4 tests pass

- [ ] **Step 6: Commit**

```bash
git add skills/ai-company/src/state/ skills/ai-company/tests/state.test.js
git commit -m "feat(ai-company): 상태 관리 레이어 구현"
```

---

## Task 3: 에이전트 프롬프트 + GM 오케스트레이터

**Files:**
- Create: `skills/ai-company/src/agents/prompts.js`
- Create: `skills/ai-company/src/agents/gm.js`

- [ ] **Step 1: 부서별 시스템 프롬프트 작성**

`skills/ai-company/src/agents/prompts.js`:

```js
export const DEPT_PROMPTS = {
  GM: `당신은 AI SI 회사의 총괄 관리자입니다.
사용자의 요청을 받아 작업을 분석하고, 적절한 부서(PM/Dev/Design/QA)에 태스크를 배분합니다.

응답 형식 — 반드시 JSON으로만 응답하세요:
{
  "analysis": "작업 분석 요약",
  "plan": [
    { "dept": "PM"|"Dev"|"Design"|"QA", "task": "구체적 지시", "budget": 숫자(토큰) }
  ],
  "message_to_user": "사용자에게 보여줄 자연어 설명"
}

원칙:
- 버그 수정: PM(분석) → Dev(수정) → QA(검증) 순서로
- 신규 기능: PM(요구사항) → Design+Dev(병렬) → QA 순서로
- 각 부서 예산은 작업 복잡도에 비례해 배분`,

  PM: `당신은 AI SI 회사의 PM(프로젝트 매니저)입니다.
요구사항을 분석하고 구체적인 태스크 목록을 만드세요.

응답 형식 — 반드시 JSON으로만 응답하세요:
{
  "summary": "분석 요약",
  "tasks": ["태스크1", "태스크2"],
  "risks": ["리스크1"],
  "recommendation": "Dev/QA에 전달할 핵심 지침"
}`,

  Dev: `당신은 AI SI 회사의 시니어 개발자입니다.
PM의 분석을 받아 실제 구현 방법을 제안하거나 코드를 작성하세요.

응답 형식 — 반드시 JSON으로만 응답하세요:
{
  "approach": "구현 접근법",
  "files_to_change": ["파일경로1", "파일경로2"],
  "implementation": "구체적 구현 내용 또는 코드",
  "concerns": ["우려사항"]
}`,

  Design: `당신은 AI SI 회사의 설계 담당자입니다.
시스템 구조, UI 명세, API 설계를 담당합니다.

응답 형식 — 반드시 JSON으로만 응답하세요:
{
  "design_summary": "설계 요약",
  "structure": "구조 설명",
  "specifications": ["명세1", "명세2"],
  "deliverable": "산출물 설명"
}`,

  QA: `당신은 AI SI 회사의 QA 엔지니어입니다.
구현 결과를 검증하고 테스트 계획을 수립하세요.

응답 형식 — 반드시 JSON으로만 응답하세요:
{
  "test_plan": ["테스트케이스1", "테스트케이스2"],
  "edge_cases": ["엣지케이스1"],
  "verdict": "PASS"|"FAIL"|"CONDITIONAL",
  "issues": ["발견된 이슈"]
}`,
};
```

- [ ] **Step 2: GM 오케스트레이터 구현**

`skills/ai-company/src/agents/gm.js`:

```js
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
```

- [ ] **Step 3: Commit**

```bash
git add skills/ai-company/src/agents/
git commit -m "feat(ai-company): GM 오케스트레이터 + 부서 프롬프트 구현"
```

---

## Task 4: Ink TUI 컴포넌트

**Files:**
- Create: `skills/ai-company/src/components/Header.jsx`
- Create: `skills/ai-company/src/components/DeptTable.jsx`
- Create: `skills/ai-company/src/components/BudgetBar.jsx`
- Create: `skills/ai-company/src/components/ChatPanel.jsx`
- Create: `skills/ai-company/src/components/CmdBar.jsx`

- [ ] **Step 1: Header 컴포넌트**

`skills/ai-company/src/components/Header.jsx`:

```jsx
import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';

export function Header({ project, startTime }) {
  const [elapsed, setElapsed] = useState('0m');

  useEffect(() => {
    const id = setInterval(() => {
      const secs = Math.floor((Date.now() - startTime) / 1000);
      const h = Math.floor(secs / 3600);
      const m = Math.floor((secs % 3600) / 60);
      const s = secs % 60;
      setElapsed(h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`);
    }, 1000);
    return () => clearInterval(id);
  }, [startTime]);

  return (
    <Box borderStyle="single" paddingX={1} justifyContent="space-between">
      <Text bold color="cyan">AI Company HQ</Text>
      <Text color="yellow">PROJECT: {project || '(없음)'}</Text>
      <Text color="gray">세션: {elapsed}</Text>
    </Box>
  );
}
```

- [ ] **Step 2: BudgetBar 컴포넌트**

`skills/ai-company/src/components/BudgetBar.jsx`:

```jsx
import React from 'react';
import { Box, Text } from 'ink';

function Bar({ used, allocated, width = 12 }) {
  const ratio = allocated > 0 ? Math.min(used / allocated, 1) : 0;
  const filled = Math.round(ratio * width);
  const empty = width - filled;
  const color = ratio >= 1 ? 'red' : ratio >= 0.8 ? 'yellow' : 'green';
  return (
    <Text color={color}>{'▓'.repeat(filled)}{'░'.repeat(empty)}</Text>
  );
}

function fmt(n) {
  return n >= 1000 ? `${Math.round(n / 1000)}k` : String(n);
}

export function BudgetBar({ budget }) {
  if (!budget) return null;
  const depts = ['PM', 'Dev', 'Design', 'QA'];
  return (
    <Box flexDirection="column" paddingX={1}>
      <Text bold>토큰 예산</Text>
      <Box>
        <Text color="gray">전체  </Text>
        <Bar used={budget.total.used} allocated={budget.total.allocated} />
        <Text color="gray">  {fmt(budget.total.used)} / {fmt(budget.total.allocated)}</Text>
      </Box>
      {depts.map(d => (
        <Box key={d}>
          <Text color="gray">{d.padEnd(7)}</Text>
          <Bar used={budget[d]?.used ?? 0} allocated={budget[d]?.allocated ?? 0} />
          <Text color="gray">  {fmt(budget[d]?.used ?? 0)} / {fmt(budget[d]?.allocated ?? 0)}</Text>
        </Box>
      ))}
    </Box>
  );
}
```

- [ ] **Step 3: DeptTable 컴포넌트**

`skills/ai-company/src/components/DeptTable.jsx`:

```jsx
import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';

const STATUS_ICON = {
  idle:        { icon: '○', color: 'gray'   },
  in_progress: { icon: '●', color: 'cyan'   },
  completed:   { icon: '✓', color: 'green'  },
  failed:      { icon: '✗', color: 'red'    },
};

export function DeptTable({ departments }) {
  const depts = ['PM', 'Dev', 'Design', 'QA'];
  return (
    <Box flexDirection="column" paddingX={1}>
      <Text bold>부서 현황</Text>
      <Box>
        <Text color="gray">{'부서'.padEnd(8)}{'상태'.padEnd(10)}{'태스크'.padEnd(8)}진행률</Text>
      </Box>
      {depts.map(dept => {
        const info = departments?.[dept] ?? { status: 'idle', tasks_done: 0, tasks_total: 0 };
        const { icon, color } = STATUS_ICON[info.status] ?? STATUS_ICON.idle;
        const ratio = info.tasks_total > 0
          ? Math.round((info.tasks_done / info.tasks_total) * 5)
          : 0;
        const bar = '▓'.repeat(ratio) + '░'.repeat(5 - ratio);
        return (
          <Box key={dept}>
            {info.status === 'in_progress'
              ? <Text color="cyan"><Spinner type="dots" /> </Text>
              : <Text color={color}>{icon} </Text>
            }
            <Text>{dept.padEnd(7)}</Text>
            <Text color="gray">{info.tasks_done}/{info.tasks_total}  </Text>
            <Text color={color}>{bar}</Text>
          </Box>
        );
      })}
    </Box>
  );
}
```

- [ ] **Step 4: ChatPanel 컴포넌트**

`skills/ai-company/src/components/ChatPanel.jsx`:

```jsx
import React from 'react';
import { Box, Text } from 'ink';

const ROLE_STYLE = {
  user:   { prefix: '[나]    ', color: 'white'  },
  GM:     { prefix: '[총괄]  ', color: 'cyan'   },
  PM:     { prefix: '[PM]    ', color: 'yellow' },
  Dev:    { prefix: '[Dev]   ', color: 'green'  },
  Design: { prefix: '[Design]', color: 'magenta'},
  QA:     { prefix: '[QA]    ', color: 'blue'   },
  system: { prefix: '[시스템]', color: 'gray'   },
};

export function ChatPanel({ messages, height = 20 }) {
  const visible = messages.slice(-height);
  return (
    <Box flexDirection="column" paddingX={1} flexGrow={1}>
      <Text bold>총괄 대화</Text>
      {visible.map((msg, i) => {
        const style = ROLE_STYLE[msg.role] ?? ROLE_STYLE.system;
        return (
          <Box key={i}>
            <Text color={style.color}>{style.prefix} </Text>
            <Text wrap="wrap">{msg.content}</Text>
          </Box>
        );
      })}
    </Box>
  );
}
```

- [ ] **Step 5: CmdBar 컴포넌트**

`skills/ai-company/src/components/CmdBar.jsx`:

```jsx
import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

export function CmdBar({ onSubmit, disabled }) {
  const [input, setInput] = useState('');

  useInput((char, key) => {
    if (disabled) return;
    if (key.return) {
      if (input.trim()) onSubmit(input.trim());
      setInput('');
    } else if (key.backspace || key.delete) {
      setInput(prev => prev.slice(0, -1));
    } else if (!key.ctrl && !key.meta && char) {
      setInput(prev => prev + char);
    }
  });

  return (
    <Box borderStyle="single" paddingX={1}>
      <Text color="cyan">{'> '}</Text>
      <Text>{input}</Text>
      <Text color="gray">_</Text>
      <Box flexGrow={1} />
      <Text color="gray">[Tab] 패널전환  [Q] 종료</Text>
    </Box>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add skills/ai-company/src/components/
git commit -m "feat(ai-company): Ink TUI 컴포넌트 5종 구현"
```

---

## Task 5: 메인 App + 진입점

**Files:**
- Create: `skills/ai-company/src/App.jsx`
- Create: `skills/ai-company/src/index.jsx`

- [ ] **Step 1: App.jsx 작성**

`skills/ai-company/src/App.jsx`:

```jsx
import React, { useState, useCallback } from 'react';
import { Box, useApp, useInput } from 'ink';
import { Header } from './components/Header.jsx';
import { ChatPanel } from './components/ChatPanel.jsx';
import { DeptTable } from './components/DeptTable.jsx';
import { BudgetBar } from './components/BudgetBar.jsx';
import { CmdBar } from './components/CmdBar.jsx';
import { orchestrate } from './agents/gm.js';
import { StateManager } from './state/manager.js';

const stateManager = new StateManager();

export function App({ project: initialProject }) {
  const { exit } = useApp();
  const [project, setProject] = useState(initialProject || '');
  const [messages, setMessages] = useState([
    { role: 'GM', content: `안녕하세요. 프로젝트명을 입력하거나 바로 작업을 요청해주세요.` }
  ]);
  const [departments, setDepts] = useState(null);
  const [budget, setBudget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [startTime] = useState(Date.now());

  const addMessage = (role, content) =>
    setMessages(prev => [...prev, { role, content }]);

  useInput((_, key) => {
    if (key.ctrl && key.name === 'c') exit();
  });

  const handleCommand = useCallback(async (cmd) => {
    if (cmd === 'q' || cmd === ':q') { exit(); return; }

    // 프로젝트 미설정 시 첫 입력을 프로젝트명으로
    let currentProject = project;
    if (!currentProject) {
      currentProject = cmd;
      setProject(cmd);
      const state = await stateManager.loadState(cmd);
      const bgt = await stateManager.loadBudget(cmd);
      setDepts(state.departments);
      setBudget(bgt);

      if (state.phase !== 'idle' && state.active_task) {
        addMessage('GM', `'${cmd}' 프로젝트의 진행 중인 작업을 발견했습니다: ${state.active_task}. 이어서 진행할까요? (y/n)`);
      } else {
        addMessage('GM', `'${cmd}' 프로젝트를 시작합니다. 무엇을 도와드릴까요?`);
      }
      return;
    }

    addMessage('user', cmd);
    setBusy(true);

    try {
      const state = await stateManager.loadState(currentProject);
      await stateManager.saveState(currentProject, { active_task: cmd, phase: 'planning' });

      await orchestrate({
        userMessage: cmd,
        projectContext: state,
        onUpdate: async ({ dept, status, message, tokensUsed, plan }) => {
          addMessage(dept || 'GM', message);

          if (dept && dept !== 'GM') {
            setDepts(prev => ({
              ...prev,
              [dept]: { ...prev?.[dept], status },
            }));
          }

          if (tokensUsed && dept) {
            const newBudget = await stateManager.consumeBudget(currentProject, dept, tokensUsed);
            setBudget(newBudget);
          }

          if (plan) {
            const total = plan.reduce((s, p) => s + (p.budget || 0), 0);
            await stateManager.setBudget(currentProject, Object.fromEntries(
              plan.map(p => [p.dept, p.budget || 8000])
            ));
            const newBudget = await stateManager.loadBudget(currentProject);
            setBudget(newBudget);

            const initDepts = {};
            for (const p of plan) {
              initDepts[p.dept] = { status: 'idle', tasks_done: 0, tasks_total: 1 };
            }
            setDepts(prev => ({ ...prev, ...initDepts }));
          }
        },
      });

      await stateManager.saveState(currentProject, { phase: 'idle', active_task: null });
    } catch (err) {
      addMessage('system', `오류 발생: ${err.message}`);
    }

    setBusy(false);
  }, [project, exit]);

  return (
    <Box flexDirection="column" height="100%">
      <Header project={project} startTime={startTime} />
      <Box flexGrow={1}>
        <Box width="60%" flexDirection="column">
          <ChatPanel messages={messages} height={20} />
        </Box>
        <Box width="40%" flexDirection="column">
          <DeptTable departments={departments} />
          <BudgetBar budget={budget} />
        </Box>
      </Box>
      <CmdBar onSubmit={handleCommand} disabled={busy} />
    </Box>
  );
}
```

- [ ] **Step 2: index.jsx 작성**

`skills/ai-company/src/index.jsx`:

```jsx
import React from 'react';
import { render } from 'ink';
import { App } from './App.jsx';

const project = process.argv[2] || '';
render(<App project={project} />, { fullscreen: true });
```

- [ ] **Step 3: 로컬 실행 테스트**

```bash
cd skills/ai-company && ANTHROPIC_API_KEY=<your-key> node src/index.jsx test-project
```

Expected: TUI가 열리고 헤더, 부서 테이블, 예산 바, 명령 입력창이 보임

- [ ] **Step 4: Commit**

```bash
git add skills/ai-company/src/App.jsx skills/ai-company/src/index.jsx
git commit -m "feat(ai-company): 메인 App + 진입점 구현"
```

---

## Task 6: SKILL.md 진입점

**Files:**
- Create: `skills/ai-company/SKILL.md`

- [ ] **Step 1: SKILL.md 작성**

`skills/ai-company/SKILL.md`:

```markdown
---
name: s-skills
version: 1.0.0
description: |
  AI Company 하네스. Claude CLI에서 /ai-company로 진입하면
  Ink TUI 대시보드를 실행한다. GM AI가 PM/Dev/Design/QA를 조율한다.
allowed-tools:
  - Bash
  - Read
triggers:
  - /ai-company
---

# AI Company Harness

AI SI 회사 TUI를 실행한다.

## 실행

1. ANTHROPIC_API_KEY 환경변수 확인:

```bash
if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "오류: ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다."
  echo "export ANTHROPIC_API_KEY=your-key-here"
  exit 1
fi
```

2. 의존성 설치 확인 및 TUI 실행:

```bash
SKILL_DIR="$(dirname "$(realpath "$0")")"
cd "$SKILL_DIR"

if [ ! -d "node_modules" ]; then
  echo "의존성 설치 중..."
  npm install --silent
fi

PROJECT="${1:-}"
node src/index.jsx "$PROJECT"
```

## 사용법

- `/ai-company` — 새 세션 시작 (프로젝트명 TUI에서 입력)
- `/ai-company my-app` — 특정 프로젝트로 바로 진입

## 단축키

- `q` 또는 `:q` — 종료
- `Ctrl+C` — 강제 종료
```

- [ ] **Step 2: SKILL.md는 Claude에게 Bash 명령으로 실행하도록 지시하는 구조이므로, 실제 Claude CLI에서 스킬을 호출하는 방식 확인**

```bash
# 스킬 등록 확인 (이미 ./ 로 로컬 로드 중)
cat /Users/songseungju/S-skills/.claude-plugin/marketplace.json
```

Expected: `"source": "./"` 확인

- [ ] **Step 3: Commit**

```bash
git add skills/ai-company/SKILL.md
git commit -m "feat(ai-company): Claude CLI 스킬 진입점 SKILL.md 추가"
```

---

## Task 7: 통합 검증

- [ ] **Step 1: 전체 테스트 실행**

```bash
cd skills/ai-company && npm test
```

Expected: state.test.js 4개 테스트 모두 통과

- [ ] **Step 2: TUI 수동 실행 검증 체크리스트**

```bash
cd skills/ai-company && ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY node src/index.jsx
```

확인 사항:
- [ ] 헤더에 "AI Company HQ" 표시, 세션 타이머 1초마다 업데이트
- [ ] 프로젝트명 입력 시 `~/.ai-company/<name>/` 디렉토리 생성
- [ ] 작업 입력 시 부서 상태 `idle → in_progress → completed` 전환
- [ ] 토큰 소진 시 예산 바 실시간 업데이트
- [ ] `q` 입력 시 정상 종료
- [ ] 재진입 시 state.json 로드하여 진행 중 작업 안내

- [ ] **Step 3: 버그 수정 시나리오 검증**

TUI에서 입력:
```
> 로그인 후 세션이 1분 만에 만료되는 버그를 수정해줘
```

Expected 흐름:
1. `[총괄]` 분석 메시지 출력
2. 부서 테이블에서 PM `● 진행중` 표시
3. `[PM]` 분석 결과 출력
4. Dev `● 진행중` 표시
5. `[Dev]` 구현 결과 출력
6. QA `● 진행중` → `✓ 완료`
7. `[총괄]` 최종 요약 출력
8. 토큰 예산 바 업데이트 확인

- [ ] **Step 4: 최종 커밋**

```bash
git add -A
git commit -m "feat(ai-company): AI Company 하네스 v0.1.0 완성"
```

---

## 이후 개선 사항 (v0.2)

- `[Ctrl+L]` 로그 패널 토글 — 각 부서의 상세 JSON 결과 표시
- 프로젝트 선택 화면 — `~/.ai-company/` 내 기존 프로젝트 목록
- `history/` 폴더에 작업 결과 자동 저장 (Markdown)
- 병렬 에이전트 실행 (Design + Dev 동시)
- 토큰 예산 초과 시 사용자 승인 프롬프트
