export const DEFAULT_STATE = {
  project: '',
  active_task: null,
  phase: 'idle',
  departments: {
    PM:     { status: 'idle', tasks_done: 0, tasks_total: 0, output: null },
    Dev:    { status: 'idle', tasks_done: 0, tasks_total: 0, output: null },
    Design: { status: 'idle', tasks_done: 0, tasks_total: 0, output: null },
    QA:     { status: 'idle', tasks_done: 0, tasks_total: 0, output: null },
  },
  last_updated: null,
};

export const DEFAULT_BUDGET = {
  total:   { allocated: 100000, used: 0 },
  PM:      { allocated: 20000,  used: 0 },
  Dev:     { allocated: 40000,  used: 0 },
  Design:  { allocated: 20000,  used: 0 },
  QA:      { allocated: 20000,  used: 0 },
};
