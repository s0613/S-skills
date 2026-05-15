import React, { useState, useCallback } from 'react';
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

  const handleCommand = useCallback(async (cmd) => {
    if (cmd === 'q' || cmd === ':q') { exit(); return; }

    addMessage('user', cmd);
    setBusy(true);

    try {
      const state = await stateManager.loadState(project);
      await stateManager.saveState(project, { active_task: cmd, phase: 'planning' });

      await orchestrate({
        userMessage: cmd,
        projectContext: state,
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
            const total = plan.reduce((s, p) => s + (p.budget || 0), 0);
            await stateManager.setBudget(project, Object.fromEntries(
              plan.map(p => [p.dept, p.budget || 8000])
            ));
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
    }

    setBusy(false);
  }, [project, exit]);

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
