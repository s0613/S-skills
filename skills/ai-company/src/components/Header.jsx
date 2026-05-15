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
