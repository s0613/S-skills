import React from 'react';
import { render } from 'ink';
import { App } from './App.jsx';

const project = process.argv[2] || '';
render(<App project={project} />, { fullscreen: true });
