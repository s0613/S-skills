import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

export function CmdBar({ onSubmit, disabled, focused = false }) {
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
      <Text color="cyan" bold={focused}>{'> '}</Text>
      <Text>{input}</Text>
      <Text color="gray">_</Text>
      <Box flexGrow={1} />
      <Text color="gray">↑↓스크롤  Tab포커스  Ctrl+K초기화  ?도움말  q종료</Text>
    </Box>
  );
}
