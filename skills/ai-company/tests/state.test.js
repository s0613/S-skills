import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { StateManager } from '../src/state/manager.js';

let dir;
let manager;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'ai-company-test-'));
  manager = new StateManager(dir);
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

test('loadState returns default when no file exists', async () => {
  const state = await manager.loadState('test-project');
  expect(state.project).toBe('test-project');
  expect(state.phase).toBe('idle');
});

test('saveState and loadState round-trips correctly', async () => {
  await manager.saveState('test-project', { phase: 'dev', active_task: 'fix login' });
  const loaded = await manager.loadState('test-project');
  expect(loaded.phase).toBe('dev');
  expect(loaded.active_task).toBe('fix login');
});

test('loadBudget returns default when no file exists', async () => {
  const budget = await manager.loadBudget('test-project');
  expect(budget.total.allocated).toBe(100000);
  expect(budget.total.used).toBe(0);
});

test('consumeBudget increments used for dept and total', async () => {
  await manager.consumeBudget('test-project', 'Dev', 5000);
  const budget = await manager.loadBudget('test-project');
  expect(budget.Dev.used).toBe(5000);
  expect(budget.total.used).toBe(5000);
});
