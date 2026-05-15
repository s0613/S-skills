import React, { useState, useCallback, useRef } from 'react';
import { Box, useApp, useInput } from 'ink';
import { Header } from './components/Header.jsx';
import { ChatPanel } from './components/ChatPanel.jsx';
import { DeptTable } from './components/DeptTable.jsx';
import { BudgetBar } from './components/BudgetBar.jsx';
import { CmdBar } from './components/CmdBar.jsx';
import { LogPanel } from './components/LogPanel.jsx';
import { ProjectSelect } from './components/ProjectSelect.jsx';
import { HelpOverlay } from './components/HelpOverlay.jsx';
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
  const [logs, setLogs] = useState([]);
  const [startTime] = useState(Date.now());

  // 스크롤 & 포커스
  const [chatScrollOffset, setChatScrollOffset] = useState(0);
  const [logScrollOffset, setLogScrollOffset] = useState(0);
  const [focusPanel, setFocusPanel] = useState('chat'); // 'chat' | 'log'

  // 명령 히스토리
  const [commandHistory, setCommandHistory] = useState([]);

  // 도움말 오버레이
  const [showHelp, setShowHelp] = useState(false);

  // CmdBar input 추적 (? 단축키 가드)
  const cmdInputRef = useRef('');

  const addMessage = useCallback((role, content) => {
    setMessages(prev => [...prev, { role, content }]);
    setChatScrollOffset(0); // 새 메시지 → 자동 최하단
  }, []);

  useInput((char, key) => {
    // Tab — 패널 포커스 전환
    if (key.tab) {
      setFocusPanel(prev => prev === 'chat' ? 'log' : 'chat');
      return;
    }

    // ? — 도움말 토글 (입력창이 비어있을 때만)
    if (char === '?' && cmdInputRef.current === '') {
      setShowHelp(prev => !prev);
      return;
    }

    // Ctrl+C — busy일 때 태스크 취소, 아닐 때 종료
    if (key.ctrl && key.name === 'c') {
      if (busy) {
        if (approvalResolver.current) {
          approvalResolver.current(false);
          approvalResolver.current = null;
          setAwaitingApproval(false);
        }
        addMessage('system', '태스크가 취소되었습니다.');
      } else {
        exit();
      }
      return;
    }

    // PgUp / PgDn — 포커스 패널 5줄 스크롤
    if (key.pageUp) {
      if (focusPanel === 'chat') setChatScrollOffset(prev => prev + 5);
      else setLogScrollOffset(prev => prev + 5);
      return;
    }
    if (key.pageDown) {
      if (focusPanel === 'chat') setChatScrollOffset(prev => Math.max(0, prev - 5));
      else setLogScrollOffset(prev => Math.max(0, prev - 5));
      return;
    }
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
  }, [addMessage]);

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

    // 히스토리 추가 (최신이 앞, 중복 제거, 최대 50개)
    setCommandHistory(prev => {
      const filtered = prev.filter(h => h !== cmd);
      return [cmd, ...filtered].slice(0, 50);
    });

    addMessage('user', cmd);
    setChatScrollOffset(0); // 채팅 자동 최하단
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
      if (approvalResolver.current) {
        approvalResolver.current(false);
        approvalResolver.current = null;
        setAwaitingApproval(false);
      }
    } finally {
      setBusy(false);
    }
  }, [project, exit, awaitingApproval, requestApproval, budget, addMessage]);

  if (screen === 'select') {
    return <ProjectSelect stateManager={stateManager} onSelect={handleProjectSelect} />;
  }

  return (
    <Box flexDirection="column" height="100%">
      <Header project={project} startTime={startTime} />
      <HelpOverlay showHelp={showHelp} onClose={() => setShowHelp(false)} />
      <Box flexGrow={1}>
        {/* 채팅 50% */}
        <Box width="50%" flexDirection="column">
          <ChatPanel
            messages={messages}
            scrollOffset={chatScrollOffset}
            visibleHeight={20}
          />
        </Box>
        {/* 부서현황+예산 25% */}
        <Box width="25%" flexDirection="column">
          <DeptTable departments={departments} />
          <BudgetBar budget={budget} />
        </Box>
        {/* 로그 25% */}
        <Box width="25%" flexDirection="column">
          <LogPanel
            logs={logs}
            scrollOffset={logScrollOffset}
            visibleCount={8}
            focused={focusPanel === 'log'}
          />
        </Box>
      </Box>
      <CmdBar
        onSubmit={handleCommand}
        disabled={busy}
        focused={focusPanel === 'chat'}
        commandHistory={commandHistory}
        onInputChange={val => { cmdInputRef.current = val; }}
      />
    </Box>
  );
}
