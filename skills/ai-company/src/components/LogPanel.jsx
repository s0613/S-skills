import React from 'react';
import { Box, Text } from 'ink';

const DEPT_COLOR = {
  GM:     'cyan',
  PM:     'yellow',
  Dev:    'green',
  Design: 'magenta',
  QA:     'blue',
};

export function LogPanel({ logs, scrollOffset = 0, visibleCount = 5, focused = false }) {
  if (!logs || logs.length === 0) {
    return (
      <Box flexDirection="column" paddingX={1} flexGrow={1}>
        <Text bold color={focused ? 'cyan' : undefined}>부서 로그</Text>
        <Text color="gray">(아직 로그가 없습니다)</Text>
      </Box>
    );
  }

  const total = logs.length;
  const end = total - scrollOffset;
  const start = Math.max(0, end - visibleCount);
  const visible = logs.slice(start, end);

  const headerColor = focused ? 'cyan' : undefined;
  const headerText = scrollOffset > 0 ? `부서 로그 ↑ ${scrollOffset}개 위` : '부서 로그';

  return (
    <Box flexDirection="column" paddingX={1} flexGrow={1}>
      <Text bold color={headerColor}>{headerText}</Text>
      {visible.map((entry, i) => (
        <Box key={start + i} flexDirection="column" marginBottom={1}>
          <Text color={DEPT_COLOR[entry.dept] ?? 'white'} bold>
            [{entry.dept}] {entry.timestamp}
          </Text>
          <Text color="gray" wrap="wrap">
            {(() => { const s = JSON.stringify(entry.result, null, 2); return s.length > 300 ? s.slice(0, 300) + '...' : s; })()}
          </Text>
        </Box>
      ))}
    </Box>
  );
}
