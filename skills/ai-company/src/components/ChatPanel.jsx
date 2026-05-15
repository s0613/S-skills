import React from 'react';
import { Box, Text } from 'ink';

const ROLE_STYLE = {
  user:   { prefix: '[나]    ', color: 'white'  },
  GM:     { prefix: '[총괄]  ', color: 'cyan'   },
  PM:     { prefix: '[PM]    ', color: 'yellow' },
  Dev:    { prefix: '[Dev]   ', color: 'green'  },
  Design: { prefix: '[Design]', color: 'magenta'},
  QA:     { prefix: '[QA]    ', color: 'blue'   },
  system: { prefix: '[시스템]', color: 'gray'   },
};

export function ChatPanel({ messages, height = 20 }) {
  const visible = messages.slice(-height);
  return (
    <Box flexDirection="column" paddingX={1} flexGrow={1}>
      <Text bold>총괄 대화</Text>
      {visible.map((msg, i) => {
        const style = ROLE_STYLE[msg.role] ?? ROLE_STYLE.system;
        return (
          <Box key={i}>
            <Text color={style.color}>{style.prefix} </Text>
            <Text wrap="wrap">{msg.content}</Text>
          </Box>
        );
      })}
    </Box>
  );
}
