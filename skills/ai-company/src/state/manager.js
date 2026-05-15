import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { DEFAULT_STATE, DEFAULT_BUDGET } from './defaults.js';

export class StateManager {
  constructor(baseDir = join(process.env.HOME, '.ai-company')) {
    this.baseDir = baseDir;
  }

  #projectDir(project) {
    return join(this.baseDir, project);
  }

  async #ensureDir(project) {
    await mkdir(this.#projectDir(project), { recursive: true });
  }

  async loadState(project) {
    await this.#ensureDir(project);
    const file = join(this.#projectDir(project), 'state.json');
    try {
      const raw = await readFile(file, 'utf8');
      return JSON.parse(raw);
    } catch {
      return { ...DEFAULT_STATE, project, last_updated: new Date().toISOString() };
    }
  }

  async saveState(project, patch) {
    await this.#ensureDir(project);
    const current = await this.loadState(project);
    const next = { ...current, ...patch, last_updated: new Date().toISOString() };
    const file = join(this.#projectDir(project), 'state.json');
    await writeFile(file, JSON.stringify(next, null, 2), 'utf8');
    return next;
  }

  async loadBudget(project) {
    await this.#ensureDir(project);
    const file = join(this.#projectDir(project), 'budget.json');
    try {
      const raw = await readFile(file, 'utf8');
      return JSON.parse(raw);
    } catch {
      return structuredClone(DEFAULT_BUDGET);
    }
  }

  async consumeBudget(project, dept, tokens) {
    const budget = await this.loadBudget(project);
    budget[dept].used += tokens;
    budget.total.used += tokens;
    const file = join(this.#projectDir(project), 'budget.json');
    await writeFile(file, JSON.stringify(budget, null, 2), 'utf8');
    return budget;
  }

  async setBudget(project, allocations) {
    const budget = await this.loadBudget(project);
    for (const [dept, allocated] of Object.entries(allocations)) {
      if (budget[dept]) budget[dept].allocated = allocated;
    }
    const file = join(this.#projectDir(project), 'budget.json');
    await writeFile(file, JSON.stringify(budget, null, 2), 'utf8');
    return budget;
  }

  async listProjects() {
    const { readdir } = await import('fs/promises');
    try {
      const entries = await readdir(this.baseDir, { withFileTypes: true });
      return entries.filter(e => e.isDirectory()).map(e => e.name);
    } catch {
      return [];
    }
  }
}
