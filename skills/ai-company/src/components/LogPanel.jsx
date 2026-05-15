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
