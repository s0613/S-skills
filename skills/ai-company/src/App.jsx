import React, { useState, useCallback, useRef } from 'react';
import { Box, useApp, useInput } from 'ink';
import { Header } from './components/Header.jsx';
import { ChatPanel } from './components/ChatPanel.jsx';
import { DeptTable } from './components/DeptTable.jsx';
import { BudgetBar } from './components/BudgetBar.jsx';
import { CmdBar } from './components/CmdBar.jsx';
import { LogPanel } from './components/LogPanel.jsx';
import { ProjectSelect } from './components/ProjectSelect.jsx';
import { orchestrate } from './agents/gm.js';
import { StateManager } from './state/manager.js';

const stateManager = new StateManager();

export function App({ project: initialProject }) {
  const { exit } = useApp();
  const [project, setProject] = useState(initialProject || '');
  const [screen, setScreen] = useState(initialProject ? 'main' : 'select');
  const [messages, setMessages] = useState([
    { role: 'GM', content: `안녕하세요. 프로젝트명을 입력하거나 바로 작업을 요청해주세요.` }
  ]);
  const [departments, setDepts] = useState(null);
  const [budget, setBudget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [awaitingApproval, setAwaitingApproval] = useState(false);
  const approvalResolver = useRef(null);
  const [showLog, setShowLog] = useState(false);
  const [logs, setLogs] = useState([]);
  const [startTime] = useState(Date.now());

  const addMessage = (role, content) =>
    setMessages(prev => [...prev, { role, content }]);

  useInput((char, key) => {
    if (key.ctrl && key.name === 'c') exit();
    if (key.ctrl && char === 'l') setShowLog(prev => !prev);
  });

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

  const requestApproval = useCallback((dept, needed, remaining) => {
    const fmt = n => n >= 1000 ? `${Math.round(n / 1000)}k` : String(n);
    addMessage('system',
      `⚠️ ${dept} 예산 초과: ${fmt(needed)} 토큰 필요, ${fmt(remaining)} 남음. 계속할까요? (y / n) [60초 후 자동 거부]`
    );
    setAwaitingApproval(true);
    return new Promise(resolve => {
      let timer;
      approvalResolver.current = (val) => {
        clearTimeout(timer);
        resolve(val);
      };
      timer = setTimeout(() => {
        if (approvalResolver.current) {
          approvalResolver.current = null;
          setAwaitingApproval(false);
          addMessage('system', '시간 초과로 자동 거부되었습니다.');
          resolve(false);
        }
      }, 60000);
    });
  }, []);

  const handleCommand = useCallback(async (cmd) => {
    if (awaitingApproval) {
      setAwaitingApproval(false);
      const approved = cmd.toLowerCase() === 'y' || cmd.toLowerCase() === 'yes';
      approvalResolver.current?.(approved);
      approvalResolver.current = null;
      addMessage('system', approved ? '승인됨. 계속 진행합니다.' : '거부됨. 해당 부서 작업을 건너뜁니다.');
      return;
    }

    if (cmd === 'q' || cmd === ':q') { exit(); return; }

    addMessage('user', cmd);
    setBusy(true);

    try {
      const state = await stateManager.loadState(project);
      await stateManager.saveState(project, { active_task: cmd, phase: 'planning' });

      await orchestrate({
        userMessage: cmd,
        projectContext: state,
        currentBudget: budget,
        onRequestApproval: requestApproval,
        onUpdate: async ({ dept, status, message, tokensUsed, plan, result }) => {
          addMessage(dept || 'GM', message);

          if (result && dept) {
            setLogs(prev => [...prev, {
              dept,
              result,
              timestamp: new Date().toLocaleTimeString('ko-KR'),
            }]);
          }

          if (dept && dept !== 'GM') {
            setDepts(prev => ({
              ...prev,
              [dept]: { ...prev?.[dept], status },
            }));
          }

          if (tokensUsed && dept) {
            const newBudget = await stateManager.consumeBudget(project, dept, tokensUsed);
            setBudget(newBudget);
          }

          if (plan) {
            // used > 0이면 이미 실행 중인 라운드 — 예산 재설정 금지 (자기 승인 방지)
            const currentBudget = await stateManager.loadBudget(project);
            const hasUsage = Object.values(currentBudget).some(b => b?.used > 0);
            if (!hasUsage) {
              await stateManager.setBudget(project, Object.fromEntries(
                plan.map(p => [p.dept, p.budget || 8000])
              ));
            }
            const newBudget = await stateManager.loadBudget(project);
            setBudget(newBudget);

            const initDepts = {};
            for (const p of plan) {
              initDepts[p.dept] = { status: 'idle', tasks_done: 0, tasks_total: 1 };
            }
            setDepts(prev => ({ ...prev, ...initDepts }));
          }
        },
      });

      await stateManager.saveState(project, { phase: 'idle', active_task: null });
    } catch (err) {
      addMessage('system', `오류 발생: ${err.message}`);
      // 오케스트레이션 중단 시 대기 중인 승인 해제
      if (approvalResolver.current) {
        approvalResolver.current(false);
        approvalResolver.current = null;
        setAwaitingApproval(false);
      }
    }

    setBusy(false);
  }, [project, exit, awaitingApproval, requestApproval, budget]);

  if (screen === 'select') {
    return <ProjectSelect stateManager={stateManager} onSelect={handleProjectSelect} />;
  }

  return (
    <Box flexDirection="column" height="100%">
      <Header project={project} startTime={startTime} />
      <Box flexGrow={1}>
        <Box width="60%" flexDirection="column">
          <ChatPanel messages={messages} height={20} />
        </Box>
        <Box width="40%" flexDirection="column">
          {showLog
            ? <LogPanel logs={logs} />
            : <>
                <DeptTable departments={departments} />
                <BudgetBar budget={budget} />
              </>
          }
        </Box>
      </Box>
      <CmdBar onSubmit={handleCommand} disabled={busy} />
    </Box>
  );
}
