import { TaskStore } from './task-store.mjs';

const owner = { subject: 'user-42', tenant: 'acme' };
const store = new TaskStore();
const task = store.create({ owner, ttl: 60_000, pollInterval: 1_000, statusMessage: 'Export queued' });
console.log('create', task);
console.log('poll', store.get(task.taskId, owner));
store.complete(task.taskId, owner, {
  content: [{ type: 'text', text: 's3://exports/report.csv' }],
  structuredContent: { uri: 's3://exports/report.csv', rows: 1200 },
  isError: false,
});
console.log('result', store.result(task.taskId, owner));
