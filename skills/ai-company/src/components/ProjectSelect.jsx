import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';

export function ProjectSelect({ stateManager, onSelect }) {
  const [projects, setProjects] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    stateManager.listProjects().then(list => {
      setProjects(list);
      setLoading(false);
    });
  }, [stateManager]);

  useInput((char, key) => {
    if (key.upArrow) {
      setSelectedIndex(prev => Math.max(0, prev - 1));
      return;
    }
    if (key.downArrow) {
      const total = projects.length + (input.trim() ? 1 : 0);
      setSelectedIndex(prev => Math.min(total - 1, prev + 1));
      return;
    }
    if (key.return) {
      const isNewProject = selectedIndex >= projects.length;
      const name = isNewProject ? input.trim() : projects[selectedIndex];
      if (name) onSelect(name);
      return;
    }
    if (key.backspace || key.delete) {
      setInput(prev => prev.slice(0, -1));
      setSelectedIndex(projects.length);
      return;
    }
    if (!key.ctrl && !key.meta && char) {
      setInput(prev => prev + char);
      setSelectedIndex(projects.length);
    }
  });

  if (loading) {
    return (
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Text color="gray">프로젝트 목록 로딩 중...</Text>
      </Box>
    );
  }

  const showNewOption = input.trim().length > 0;
  const total = projects.length + (showNewOption ? 1 : 0);

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Text bold color="cyan">AI Company HQ — 프로젝트 선택</Text>
      <Text color="gray">↑↓ 이동  Enter 선택  새 이름 입력 후 Enter</Text>
      <Box marginTop={1} flexDirection="column">
        {projects.map((p, i) => (
          <Box key={p}>
            <Text color={selectedIndex === i ? 'cyan' : 'gray'}>
              {selectedIndex === i ? '▶ ' : '  '}{p}
            </Text>
          </Box>
        ))}
        {showNewOption && (
          <Box>
            <Text color={selectedIndex === projects.length ? 'green' : 'gray'}>
              {selectedIndex === projects.length ? '▶ ' : '  '}
              <Text color="green">[새 프로젝트] </Text>{input}
            </Text>
          </Box>
        )}
        {projects.length === 0 && !showNewOption && (
          <Text color="gray">저장된 프로젝트가 없습니다. 새 이름을 입력하세요.</Text>
        )}
      </Box>
      <Box marginTop={1}>
        <Text color="cyan">{'> '}</Text>
        <Text>{input}</Text>
        <Text color="gray">_</Text>
      </Box>
    </Box>
  );
}
