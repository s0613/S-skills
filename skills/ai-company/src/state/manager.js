import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, basename } from 'path';
import { DEFAULT_STATE, DEFAULT_BUDGET } from './defaults.js';

const VALID_PROJECT_RE = /^[a-zA-Z0-9가-힣._-]+$/;

export class StateManager {
  #writeLocks = new Map();

  constructor(baseDir = join(process.env.HOME, '.ai-company')) {
    this.baseDir = baseDir;
  }

  #projectDir(project) {
    const safe = basename(project);
    if (!safe || safe !== project || !VALID_PROJECT_RE.test(safe)) {
      throw new Error(`유효하지 않은 프로젝트명: "${project}"`);
    }
    return join(this.baseDir, safe);
  }

  // 프로젝트별 직렬 쓰기 보장
  async #withLock(project, fn) {
    const prev = this.#writeLocks.get(project) ?? Promise.resolve();
    const next = prev.then(fn);
    this.#writeLocks.set(project, next.catch(() => {}));
    return next;
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
    } catch (err) {
      if (err.code === 'ENOENT') {
        return { ...DEFAULT_STATE, project, last_updated: new Date().toISOString() };
      }
      throw new Error(`상태 파일 손상 (프로젝트: "${project}"): ${err.message}`);
    }
  }

  async saveState(project, patch) {
    return this.#withLock(project, async () => {
      await this.#ensureDir(project);
      const current = await this.loadState(project);
      const next = { ...current, ...patch, last_updated: new Date().toISOString() };
      const file = join(this.#projectDir(project), 'state.json');
      await writeFile(file, JSON.stringify(next, null, 2), 'utf8');
      return next;
    });
  }

  async loadBudget(project) {
    await this.#ensureDir(project);
    const file = join(this.#projectDir(project), 'budget.json');
    try {
      const raw = await readFile(file, 'utf8');
      return JSON.parse(raw);
    } catch (err) {
      if (err.code === 'ENOENT') return structuredClone(DEFAULT_BUDGET);
      throw new Error(`예산 파일 손상 (프로젝트: "${project}"): ${err.message}`);
    }
  }

  async consumeBudget(project, dept, tokens) {
    return this.#withLock(project, async () => {
      const budget = await this.loadBudget(project);
      if (!budget[dept]) {
        throw new Error(`알 수 없는 부서: "${dept}"`);
      }
      budget[dept].used += tokens;
      budget.total.used += tokens;
      const file = join(this.#projectDir(project), 'budget.json');
      await writeFile(file, JSON.stringify(budget, null, 2), 'utf8');
      return budget;
    });
  }

  async setBudget(project, allocations) {
    return this.#withLock(project, async () => {
      const budget = await this.loadBudget(project);
      for (const [dept, allocated] of Object.entries(allocations)) {
        if (budget[dept]) budget[dept].allocated = allocated;
      }
      const file = join(this.#projectDir(project), 'budget.json');
      await writeFile(file, JSON.stringify(budget, null, 2), 'utf8');
      return budget;
    });
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
