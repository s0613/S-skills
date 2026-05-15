import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

export function CmdBar({ onSubmit, disabled, focused = false, commandHistory = [] }) {
  const [input, setInput] = useState('');
  const [histIdx, setHistIdx] = useState(-1);

  useInput((char, key) => {
    if (disabled) return;

    if (key.return) {
      if (input.trim()) {
        onSubmit(input.trim());
      }
      setInput('');
      setHistIdx(-1);
      return;
    }

    // ↑ — 히스토리 이전 (input 비어있거나 히스토리 탐색 중일 때)
    if (key.upArrow && (input === '' || histIdx >= 0)) {
      const next = histIdx + 1;
      if (next < commandHistory.length) {
        setHistIdx(next);
        setInput(commandHistory[next]);
      }
      return;
    }

    // ↓ — 히스토리 다음
    if (key.downArrow && histIdx >= 0) {
      const next = histIdx - 1;
      if (next < 0) {
        setHistIdx(-1);
        setInput('');
      } else {
        setHistIdx(next);
        setInput(commandHistory[next]);
      }
      return;
    }

    // Ctrl+K — 입력 초기화
    if (key.ctrl && key.name === 'k') {
      setInput('');
      setHistIdx(-1);
      return;
    }

    if (key.backspace || key.delete) {
      setInput(prev => prev.slice(0, -1));
      setHistIdx(-1);
      return;
    }

    if (!key.ctrl && !key.meta && char) {
      setInput(prev => prev + char);
      setHistIdx(-1);
    }
  });

  return (
    <Box borderStyle="single" paddingX={1}>
      <Text color="cyan" bold={focused}>{'> '}</Text>
      <Text>{input}</Text>
      <Text color="gray">_</Text>
      <Box flexGrow={1} />
      <Text color="gray">PgUp/PgDn스크롤  Tab포커스  Ctrl+K초기화  ?도움말  q종료</Text>
    </Box>
  );
}
