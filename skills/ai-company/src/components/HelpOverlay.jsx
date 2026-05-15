import React from 'react';
import { Box, Text, useInput } from 'ink';

const SHORTCUTS = [
  { keys: '↑ / ↓',       action: '채팅 스크롤',              condition: '입력창 비어있을 때' },
  { keys: '↑ / ↓',       action: '명령 히스토리',             condition: '입력창에 텍스트 있을 때' },
  { keys: 'PgUp / PgDn', action: '채팅 5줄 단위 스크롤',      condition: '항상' },
  { keys: 'Tab',          action: '포커스 전환 (채팅↔로그)',   condition: '항상' },
  { keys: 'Ctrl+K',       action: '입력 초기화',               condition: '항상' },
  { keys: 'Ctrl+C',       action: '실행 중 태스크 취소',       condition: 'busy일 때' },
  { keys: '?',            action: '이 도움말',                 condition: '항상' },
  { keys: 'q / :q',       action: '종료',                     condition: '입력창 비어있을 때' },
];

const KEY_W  = 10;
const ACT_W  = 22;
const COND_W = 20;

function pad(str, width) {
  // CJK characters are double-width; approximate by counting them
  let visual = 0;
  for (const ch of str) {
    visual += ch.charCodeAt(0) > 0x7f ? 2 : 1;
  }
  const spaces = Math.max(0, width - visual);
  return str + ' '.repeat(spaces);
}

export function HelpOverlay({ showHelp, onClose }) {
  useInput((_input, _key) => {
    if (showHelp) {
      onClose?.();
    }
  });

  if (!showHelp) return null;

  const header = `${pad('키', KEY_W)}${pad('동작', ACT_W)}조건`;
  const divider = '─'.repeat(KEY_W + ACT_W + COND_W);

  return (
    <Box
      position="absolute"
      flexDirection="column"
      borderStyle="double"
      borderColor="cyan"
      paddingX={3}
      paddingY={1}
      alignSelf="center"
    >
      <Box justifyContent="center" marginBottom={1}>
        <Text bold color="cyan"> 단축키 도움말 </Text>
      </Box>

      <Text color="gray">{header}</Text>
      <Text color="gray">{divider}</Text>

      {SHORTCUTS.map(({ keys, action, condition }, i) => (
        <Box key={i}>
          <Text color="yellow">{pad(keys, KEY_W)}</Text>
          <Text>{pad(action, ACT_W)}</Text>
          <Text color="gray">{condition}</Text>
        </Box>
      ))}

      <Text color="gray">{divider}</Text>
      <Box justifyContent="center" marginTop={1}>
        <Text color="gray" dimColor>아무 키나 누르면 닫힙니다</Text>
      </Box>
    </Box>
  );
}
