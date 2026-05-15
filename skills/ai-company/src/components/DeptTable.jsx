import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';

const STATUS_ICON = {
  idle:        { icon: '○', color: 'gray'   },
  in_progress: { icon: '●', color: 'cyan'   },
  completed:   { icon: '✓', color: 'green'  },
  failed:      { icon: '✗', color: 'red'    },
};

export function DeptTable({ departments }) {
  const depts = ['PM', 'Dev', 'Design', 'QA'];
  return (
    <Box flexDirection="column" paddingX={1}>
      <Text bold>부서 현황</Text>
      <Box>
        <Text color="gray">{'부서'.padEnd(8)}{'상태'.padEnd(10)}{'태스크'.padEnd(8)}진행률</Text>
      </Box>
      {depts.map(dept => {
        const info = departments?.[dept] ?? { status: 'idle', tasks_done: 0, tasks_total: 0 };
        const { icon, color } = STATUS_ICON[info.status] ?? STATUS_ICON.idle;
        const ratio = info.tasks_total > 0
          ? Math.round((info.tasks_done / info.tasks_total) * 5)
          : 0;
        const bar = '▓'.repeat(ratio) + '░'.repeat(5 - ratio);
        return (
          <Box key={dept}>
            {info.status === 'in_progress'
              ? <Text color="cyan"><Spinner type="dots" /> </Text>
              : <Text color={color}>{icon} </Text>
            }
            <Text>{dept.padEnd(7)}</Text>
            <Text color="gray">{info.tasks_done}/{info.tasks_total}  </Text>
            <Text color={color}>{bar}</Text>
          </Box>
        );
      })}
    </Box>
  );
}
