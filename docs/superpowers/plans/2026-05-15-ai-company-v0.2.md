# AI Company Harness v0.2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** AI Company Harness에 4가지 기능을 추가한다: 로그 패널, 프로젝트 선택 화면, 병렬 에이전트 실행, 토큰 예산 초과 승인.

**Architecture:** 각 기능은 독립적이며 순서대로 구현한다. Feature 3(병렬)은 gm.js + prompts.js 수정. Feature 4(예산 승인)는 gm.js에 onRequestApproval 콜백 추가 + App.jsx에 Promise 기반 승인 흐름 추가.

**Tech Stack:** Node.js v22, Ink v4, React v18, ES modules

---

## File Map

```
skills/ai-company/src/
├── components/
│   ├── LogPanel.jsx          # NEW — 부서별 JSON 로그 패널 (Feature 1)
│   └── ProjectSelect.jsx     # NEW — 프로젝트 선택 화면 (Feature 2)
├── agents/
│   ├── gm.js                 # MODIFY — 병렬 실행 + 예산 승인 콜백 (Feature 3, 4)
│   └── prompts.js            # MODIFY — GM 프롬프트에 parallel 필드 추가 (Feature 3)
└── App.jsx                   # MODIFY — 로그 토글 + 프로젝트 선택 + 예산 승인 (Feature 1, 2, 4)
```

---

## Task 1: [Ctrl+L] 로그 패널

**Files:**
- Create: `skills/ai-company/src/components/LogPanel.jsx`
- Modify: `skills/ai-company/src/App.jsx`

### LogPanel.jsx

- [ ] **Step 1: LogPanel 컴포넌트 생성**

Create `skills/ai-company/src/components/LogPanel.jsx`:

```jsx
import React from 'react';
import { Box, Text } from 'ink';

const DEPT_COLOR = {
  GM:     'cyan',
  PM:     'yellow',
  Dev:    'green',
  Design: 'magenta',
  QA:     'blue',
};

export function LogPanel({ logs }) {
  if (!logs || logs.length === 0) {
    return (
      <Box flexDirection="column" paddingX={1} flexGrow={1}>
        <Text bold>부서 로그</Text>
        <Text color="gray">(아직 로그가 없습니다)</Text>
      </Box>
    );
  }

  const visible = logs.slice(-15);

  return (
    <Box flexDirection="column" paddingX={1} flexGrow={1}>
      <Text bold>부서 로그 <Text color="gray">[Ctrl+L 토글]</Text></Text>
      {visible.map((entry, i) => (
        <Box key={i} flexDirection="column" marginBottom={1}>
          <Text color={DEPT_COLOR[entry.dept] ?? 'white'} bold>
            [{entry.dept}] {entry.timestamp}
          </Text>
          <Text color="gray" wrap="wrap">
            {JSON.stringify(entry.result, null, 2).slice(0, 300)}
            {JSON.stringify(entry.result, null, 2).length > 300 ? '...' : ''}
          </Text>
        </Box>
      ))}
    </Box>
  );
}
```

- [ ] **Step 2: App.jsx 수정 — showLog 상태 + 로그 수집 + Ctrl+L 토글**

Read `skills/ai-company/src/App.jsx` first, then apply these changes:

**Add import:**
```jsx
import { LogPanel } from './components/LogPanel.jsx';
```

**Add state (after `const [busy, setBusy] = useState(false);`):**
```jsx
const [showLog, setShowLog] = useState(false);
const [logs, setLogs] = useState([]);
```

**Update useInput to handle Ctrl+L (replace existing useInput):**
```jsx
useInput((char, key) => {
  if (key.ctrl && key.name === 'c') exit();
  if (key.ctrl && char === 'l') setShowLog(prev => !prev);
});
```

**Add log collection in onUpdate (inside the orchestrate call, after `addMessage(dept || 'GM', message);`):**
```jsx
if (result && dept) {
  setLogs(prev => [...prev, {
    dept,
    result,
    timestamp: new Date().toLocaleTimeString('ko-KR'),
  }]);
}
```

**Update right panel in return JSX (replace `<DeptTable ... /><BudgetBar ... />`):**
```jsx
{showLog
  ? <LogPanel logs={logs} />
  : <>
      <DeptTable departments={departments} />
      <BudgetBar budget={budget} />
    </>
}
```

- [ ] **Step 3: Commit**

```bash
git add skills/ai-company/src/components/LogPanel.jsx skills/ai-company/src/App.jsx
git commit -m "feat(ai-company): Ctrl+L 로그 패널 추가"
```

---

## Task 2: 프로젝트 선택 화면

**Files:**
- Create: `skills/ai-company/src/components/ProjectSelect.jsx`
- Modify: `skills/ai-company/src/App.jsx`

- [ ] **Step 1: ProjectSelect 컴포넌트 생성**

Create `skills/ai-company/src/components/ProjectSelect.jsx`:

```jsx
import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';

export function ProjectSelect({ stateManager, onSelect }) {
  const [projects, setProjects] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    stateManager.listProjects().then(list => {
      setProjects(list);
      setLoading(false);
    });
  }, [stateManager]);

  useInput((char, key) => {
    if (key.upArrow) {
      setSelectedIndex(prev => Math.max(0, prev - 1));
      return;
    }
    if (key.downArrow) {
      const total = projects.length + (input.trim() ? 1 : 0);
      setSelectedIndex(prev => Math.min(total - 1, prev + 1));
      return;
    }
    if (key.return) {
      const isNewProject = selectedIndex >= projects.length;
      const name = isNewProject ? input.trim() : projects[selectedIndex];
      if (name) onSelect(name);
      return;
    }
    if (key.backspace || key.delete) {
      setInput(prev => prev.slice(0, -1));
      setSelectedIndex(projects.length);
      return;
    }
    if (!key.ctrl && !key.meta && char) {
      setInput(prev => prev + char);
      setSelectedIndex(projects.length);
    }
  });

  if (loading) {
    return (
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Text color="gray">프로젝트 목록 로딩 중...</Text>
      </Box>
    );
  }

  const showNewOption = input.trim().length > 0;
  const total = projects.length + (showNewOption ? 1 : 0);

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Text bold color="cyan">AI Company HQ — 프로젝트 선택</Text>
      <Text color="gray">↑↓ 이동  Enter 선택  새 이름 입력 후 Enter</Text>
      <Box marginTop={1} flexDirection="column">
        {projects.map((p, i) => (
          <Box key={p}>
            <Text color={selectedIndex === i ? 'cyan' : 'gray'}>
              {selectedIndex === i ? '▶ ' : '  '}{p}
            </Text>
          </Box>
        ))}
        {showNewOption && (
          <Box>
            <Text color={selectedIndex === projects.length ? 'green' : 'gray'}>
              {selectedIndex === projects.length ? '▶ ' : '  '}
              <Text color="green">[새 프로젝트] </Text>{input}
            </Text>
          </Box>
        )}
        {projects.length === 0 && !showNewOption && (
          <Text color="gray">저장된 프로젝트가 없습니다. 새 이름을 입력하세요.</Text>
        )}
      </Box>
      <Box marginTop={1}>
        <Text color="cyan">{'> '}</Text>
        <Text>{input}</Text>
        <Text color="gray">_</Text>
      </Box>
    </Box>
  );
}
```

- [ ] **Step 2: App.jsx 수정 — screen 상태 + ProjectSelect 분기**

Read `skills/ai-company/src/App.jsx`, then apply changes:

**Add import:**
```jsx
import { ProjectSelect } from './components/ProjectSelect.jsx';
```

**Add `screen` state (after other useState declarations):**
```jsx
const [screen, setScreen] = useState(initialProject ? 'main' : 'select');
```

**Add handleProjectSelect function (before handleCommand):**
```jsx
const handleProjectSelect = useCallback(async (name) => {
  setProject(name);
  const state = await stateManager.loadState(name);
  const bgt = await stateManager.loadBudget(name);
  setDepts(state.departments);
  setBudget(bgt);
  if (state.phase !== 'idle' && state.active_task) {
    setMessages(prev => [...prev, {
      role: 'GM',
      content: `'${name}' 프로젝트의 진행 중인 작업을 발견했습니다: ${state.active_task}. 이어서 진행할까요? (y/n)`
    }]);
  } else {
    setMessages(prev => [...prev, {
      role: 'GM',
      content: `'${name}' 프로젝트를 시작합니다. 무엇을 도와드릴까요?`
    }]);
  }
  setScreen('main');
}, []);
```

**In handleCommand, remove the "프로젝트 미설정 시 첫 입력을 프로젝트명으로" block** (the `if (!currentProject)` early return block). The ProjectSelect screen handles project selection now. Keep only the part that starts with `addMessage('user', cmd);`.

**Update the return JSX — add screen conditional at the top of the render:**
```jsx
if (screen === 'select') {
  return <ProjectSelect stateManager={stateManager} onSelect={handleProjectSelect} />;
}
```

Place this before the main `return (` statement.

- [ ] **Step 3: Commit**

```bash
git add skills/ai-company/src/components/ProjectSelect.jsx skills/ai-company/src/App.jsx
git commit -m "feat(ai-company): 프로젝트 선택 화면 추가"
```

---

## Task 3: 병렬 에이전트 실행

**Files:**
- Modify: `skills/ai-company/src/agents/prompts.js`
- Modify: `skills/ai-company/src/agents/gm.js`

- [ ] **Step 1: GM 프롬프트에 parallel 필드 추가**

In `skills/ai-company/src/agents/prompts.js`, update the GM prompt string inside `DEPT_PROMPTS.GM`. Replace the response format section with:

```
응답 형식 — 반드시 JSON으로만 응답하세요:
{
  "analysis": "작업 분석 요약",
  "plan": [
    { "dept": "PM"|"Dev"|"Design"|"QA", "task": "구체적 지시", "budget": 숫자(토큰), "parallel": false }
  ],
  "message_to_user": "사용자에게 보여줄 자연어 설명"
}

원칙:
- 버그 수정: PM(분석) → Dev(수정) → QA(검증) 순서로, 모두 parallel: false
- 신규 기능: PM(요구사항, parallel:false) → Design+Dev(병렬, parallel:true) → QA(parallel:false)
- parallel:true인 연속된 스텝들은 동시에 실행됨
- 각 부서 예산은 작업 복잡도에 비례해 배분
```

Keep the rest of the GM prompt unchanged (role description, 각 부서 예산 설명).

- [ ] **Step 2: gm.js 병렬 실행 로직 추가**

Read `skills/ai-company/src/agents/gm.js`, then replace the "2. 부서별 순차 실행" section with this parallel-aware implementation:

```js
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
```

- [ ] **Step 3: Commit**

```bash
git add skills/ai-company/src/agents/prompts.js skills/ai-company/src/agents/gm.js
git commit -m "feat(ai-company): 병렬 에이전트 실행 지원 (Design+Dev 동시)"
```

---

## Task 4: 토큰 예산 초과 승인

**Files:**
- Modify: `skills/ai-company/src/agents/gm.js`
- Modify: `skills/ai-company/src/App.jsx`

- [ ] **Step 1: gm.js에 onRequestApproval 콜백 추가**

Read `skills/ai-company/src/agents/gm.js`. Update the `orchestrate` function signature and add budget check before each department call.

**Update function signature:**
```js
export async function orchestrate({ userMessage, projectContext, onUpdate, onRequestApproval, currentBudget }) {
```

**In the sequential execution branch (`} else {`), add budget check before `callAgent`:**
```js
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
```

**In the parallel execution branch (inside `group.map`), add budget check before `callAgent`:**
```js
          // 예산 초과 체크 (병렬에서는 시작 전 체크)
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
```

- [ ] **Step 2: App.jsx에 예산 승인 흐름 추가**

Read `skills/ai-company/src/App.jsx`. Apply these changes:

**Add import at top:**
```jsx
import { useRef } from 'react';
```

**Add state + ref (after other useState declarations):**
```jsx
const [awaitingApproval, setAwaitingApproval] = useState(false);
const approvalResolver = useRef(null);
```

**Add requestApproval function (before handleCommand):**
```jsx
const requestApproval = useCallback((dept, needed, remaining) => {
  const fmt = n => n >= 1000 ? `${Math.round(n / 1000)}k` : String(n);
  addMessage('system',
    `⚠️ ${dept} 예산 초과: ${fmt(needed)} 토큰 필요, ${fmt(remaining)} 남음. 계속할까요? (y / n)`
  );
  setAwaitingApproval(true);
  return new Promise(resolve => {
    approvalResolver.current = resolve;
  });
}, []);
```

**At the top of handleCommand, add approval intercept (before `if (cmd === 'q' || cmd === ':q')`):**
```jsx
    if (awaitingApproval) {
      setAwaitingApproval(false);
      const approved = cmd.toLowerCase() === 'y' || cmd.toLowerCase() === 'yes';
      approvalResolver.current?.(approved);
      approvalResolver.current = null;
      addMessage('system', approved ? '승인됨. 계속 진행합니다.' : '거부됨. 해당 부서 작업을 건너뜁니다.');
      return;
    }
```

**Update orchestrate call to pass new params:**
```jsx
      await orchestrate({
        userMessage: cmd,
        projectContext: state,
        currentBudget: budget,
        onRequestApproval: requestApproval,
        onUpdate: async ({ dept, status, message, tokensUsed, plan, result }) => {
```

(Note: add `result` to the destructuring in onUpdate if not already there)

- [ ] **Step 3: Commit**

```bash
git add skills/ai-company/src/agents/gm.js skills/ai-company/src/App.jsx
git commit -m "feat(ai-company): 토큰 예산 초과 시 사용자 승인 프롬프트"
```

---

## Task 5: 통합 검증

- [ ] **Step 1: 테스트 실행**

```bash
cd skills/ai-company && npm test
```

Expected: 4 tests pass (state.test.js)

- [ ] **Step 2: Import chain 검증**

```bash
cd skills/ai-company && node --input-type=module <<'EOF'
import { StateManager } from './src/state/manager.js';
import { DEPT_PROMPTS } from './src/agents/prompts.js';
import { orchestrate } from './src/agents/gm.js';
console.log('orchestrate params:', orchestrate.length);
console.log('GM prompt has parallel:', DEPT_PROMPTS.GM.includes('parallel'));
console.log('All imports OK');
EOF
```

Expected:
```
orchestrate params: 0
GM prompt has parallel: true
All imports OK
```

- [ ] **Step 3: 파일 검증**

```bash
ls skills/ai-company/src/components/
```

Expected: BudgetBar.jsx  ChatPanel.jsx  CmdBar.jsx  DeptTable.jsx  Header.jsx  **LogPanel.jsx  ProjectSelect.jsx**

- [ ] **Step 4: Git log**

```bash
git -C /Users/songseungju/S-skills log --oneline -6
```

Expected: 4 v0.2 feature commits + 1 validation commit

- [ ] **Step 5: 최종 커밋 (필요 시)**

```bash
git -C /Users/songseungju/S-skills add -A && git -C /Users/songseungju/S-skills status
```

Only commit if there are changes.
