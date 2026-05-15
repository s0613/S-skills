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

export function ChatPanel({ messages, scrollOffset = 0, visibleHeight = 20 }) {
  // Calculate visible messages based on scroll offset
  const total = messages.length;
  const end = Math.max(0, total - scrollOffset);
  const start = Math.max(0, end - visibleHeight);
  const visible = messages.slice(start, end);

  // Display scroll indicator in header
  const headerText = scrollOffset > 0 ? `총괄 대화  ↑ ${scrollOffset}줄 위` : '총괄 대화';

  return (
    <Box flexDirection="column" paddingX={1} flexGrow={1}>
      <Text bold>{headerText}</Text>
      {visible.map((msg, i) => {
        const style = ROLE_STYLE[msg.role] ?? ROLE_STYLE.system;
        return (
          <Box key={start + i}>
            <Text color={style.color}>{style.prefix} </Text>
            <Text wrap="wrap">{msg.content}</Text>
          </Box>
        );
      })}
    </Box>
  );
}
