import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { processTimeline } from '../services/timelineCalculator.js';

describe('Timeline Calculator - Milestone and Chronological Logic Tests', () => {
  it('should compute task counts and progress percentage accurately', () => {
    const tasks = [
      { id: '1', title: 'Task 1', status: 'completed' },
      { id: '2', title: 'Task 2', status: 'completed' },
      { id: '3', title: 'Task 3', status: 'in_progress' },
      { id: '4', title: 'Task 4', status: 'pending' }
    ];

    const result = processTimeline(tasks, '2026-12-31');

    assert.equal(result.totalTasks, 4);
    assert.equal(result.completedCount, 2);
    assert.equal(result.inProgressCount, 1);
    assert.equal(result.pendingCount, 1);
    assert.equal(result.progressPercent, 50);
  });

  it('should sort tasks in chronological order by suggestedDeadline', () => {
    const tasks = [
      { id: 't3', title: 'Late Task', suggestedDeadline: '2026-12-01' },
      { id: 't1', title: 'Early Task', suggestedDeadline: '2026-06-01' },
      { id: 't2', title: 'Mid Task', suggestedDeadline: '2026-09-01' }
    ];

    const result = processTimeline(tasks, '2026-12-25');
    assert.equal(result.tasks[0].id, 't1');
    assert.equal(result.tasks[1].id, 't2');
    assert.equal(result.tasks[2].id, 't3');
  });

  it('should handle empty task list without errors', () => {
    const result = processTimeline([], '2026-10-15');
    assert.equal(result.totalTasks, 0);
    assert.equal(result.progressPercent, 0);
    assert.equal(result.tasks.length, 0);
  });
});
