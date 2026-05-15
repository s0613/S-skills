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
