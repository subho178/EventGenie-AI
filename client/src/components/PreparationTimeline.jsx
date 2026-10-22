import React, { useState } from 'react';
import { 
  Calendar, CheckCircle2, Clock, Plus, Trash2, 
  RefreshCw, Filter, Check, AlertCircle, User 
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function PreparationTimeline({ event, onUpdateEvent, onRegenerateSection, isRegenerating }) {
  const timeline = event.timeline || {};
  const tasks = timeline.tasks || [];

  const [filter, setFilter] = useState('all'); // all, pending, completed, critical
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPhase, setNewTaskPhase] = useState('Vendor Coordination');
  const [newTaskDeadline, setNewTaskDeadline] = useState(event.eventDate || '');
  const [newTaskPriority, setNewTaskPriority] = useState('Medium');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch (e) {
      // safe fallback if canvas not available
    }
  };

  const toggleTaskStatus = (taskId) => {
    let justCompleted = false;
    const updatedTasks = tasks.map(t => {
      if (t.id === taskId) {
        const nextStatus = t.status === 'completed' ? 'pending' : 'completed';
        if (nextStatus === 'completed') {
          justCompleted = true;
        }
        return { ...t, status: nextStatus };
      }
      return t;
    });

    if (justCompleted) {
      triggerConfetti();
    }

    recalculateTimeline(updatedTasks);
  };

  const handleDeadlineChange = (taskId, newDate) => {
    const updatedTasks = tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, suggestedDeadline: newDate };
      }
      return t;
    });
    recalculateTimeline(updatedTasks);
  };

  const handleAssigneeChange = (taskId, newAssignee) => {
    const updatedTasks = tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, assignedTo: newAssignee };
      }
      return t;
    });
    recalculateTimeline(updatedTasks);
  };

  const handleDeleteTask = (taskId) => {
    const updatedTasks = tasks.filter(t => t.id !== taskId);
    recalculateTimeline(updatedTasks);
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask = {
      id: `task-custom-${Date.now()}`,
      phase: newTaskPhase,
      title: newTaskTitle.trim(),
      description: 'Custom preparation task',
      suggestedDeadline: newTaskDeadline,
      priority: newTaskPriority,
      status: 'pending',
      assignedTo: newTaskAssignee.trim()
    };

    const updatedTasks = [...tasks, newTask];
    setNewTaskTitle('');
    setNewTaskAssignee('');
    setShowAddTask(false);
    recalculateTimeline(updatedTasks);
  };

  const recalculateTimeline = (updatedTasks) => {
    const totalTasks = updatedTasks.length;
    let completedCount = 0;
    let inProgressCount = 0;
    let pendingCount = 0;
    let criticalCount = 0;

    updatedTasks.forEach(t => {
      if (t.status === 'completed') completedCount++;
      else if (t.status === 'in_progress') inProgressCount++;
      else pendingCount++;

      if (t.priority === 'Critical') criticalCount++;
    });

    // Sort chronologically by deadline
    const sorted = [...updatedTasks].sort((a, b) => {
      if (!a.suggestedDeadline) return 1;
      if (!b.suggestedDeadline) return -1;
      return new Date(a.suggestedDeadline) - new Date(b.suggestedDeadline);
    });

    const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

    onUpdateEvent({
      timeline: {
        ...timeline,
        tasks: sorted,
        totalTasks,
        completedCount,
        inProgressCount,
        pendingCount,
        criticalCount,
        progressPercent
      }
    });
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'pending') return task.status !== 'completed';
    if (filter === 'completed') return task.status === 'completed';
    if (filter === 'critical') return task.priority === 'Critical';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Calendar size={24} color="var(--color-secondary)" />
            <span>Preparation Timeline Generator</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Chronological milestone schedule leading up to {event.eventDate}. Track completion and edit deadlines.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onRegenerateSection('timeline')}
            disabled={isRegenerating}
            id="btn-regenerate-timeline"
          >
            <RefreshCw size={14} className={isRegenerating ? 'spin' : ''} />
            <span>AI Regenerate Schedule</span>
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowAddTask(true)}
            id="btn-add-task"
          >
            <Plus size={14} />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Progress Card */}
      <div className="glass-card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              {timeline.progressPercent || 0}% Preparation Complete
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {timeline.completedCount || 0} completed • {timeline.pendingCount || 0} pending • {timeline.criticalCount || 0} critical tasks
            </div>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <button
              className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('all')}
            >
              All ({tasks.length})
            </button>
            <button
              className={`btn btn-sm ${filter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('pending')}
            >
              Pending ({timeline.pendingCount || 0})
            </button>
            <button
              className={`btn btn-sm ${filter === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('completed')}
            >
              Completed ({timeline.completedCount || 0})
            </button>
            <button
              className={`btn btn-sm ${filter === 'critical' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('critical')}
            >
              Critical ({timeline.criticalCount || 0})
            </button>
          </div>
        </div>

        <div className="progress-container" style={{ height: '10px', marginTop: '1rem' }}>
          <div 
            className="progress-fill" 
            style={{ 
              width: `${timeline.progressPercent || 0}%`, 
              background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))' 
            }} 
          />
        </div>
      </div>

      {/* Add Task Form Modal / Inline */}
      {showAddTask && (
        <div className="glass-card" style={{ border: '1px solid var(--color-primary)' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.85rem' }}>Add Milestone Task</h3>
          <form onSubmit={handleAddTask} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 240px' }}>
              <label className="form-label" htmlFor="newTaskTitle">Task Title</label>
              <input
                id="newTaskTitle"
                type="text"
                className="form-control"
                placeholder="e.g. Schedule final cake tasting"
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                required
              />
            </div>

            <div style={{ width: '180px' }}>
              <label className="form-label" htmlFor="newTaskPhase">Phase</label>
              <select
                id="newTaskPhase"
                className="form-control"
                value={newTaskPhase}
                onChange={e => setNewTaskPhase(e.target.value)}
              >
                <option value="Phase 1: Foundations">Phase 1: Foundations</option>
                <option value="Phase 2: Vendors">Phase 2: Vendors</option>
                <option value="Phase 3: Invitations & RSVPs">Phase 3: Invitations & RSVPs</option>
                <option value="Phase 4: Final Confirmations">Phase 4: Final Confirmations</option>
                <option value="Event Day Execution">Event Day Execution</option>
              </select>
            </div>

            <div style={{ width: '150px' }}>
              <label className="form-label" htmlFor="newTaskDeadline">Deadline</label>
              <input
                id="newTaskDeadline"
                type="date"
                className="form-control"
                value={newTaskDeadline}
                onChange={e => setNewTaskDeadline(e.target.value)}
                required
              />
            </div>

            <div style={{ width: '120px' }}>
              <label className="form-label" htmlFor="newTaskPriority">Priority</label>
              <select
                id="newTaskPriority"
                className="form-control"
                value={newTaskPriority}
                onChange={e => setNewTaskPriority(e.target.value)}
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div style={{ width: '150px' }}>
              <label className="form-label" htmlFor="newTaskAssignee">Assignee</label>
              <input
                id="newTaskAssignee"
                type="text"
                className="form-control"
                placeholder="Name or role"
                value={newTaskAssignee}
                onChange={e => setNewTaskAssignee(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-primary btn-sm">Add Task</button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddTask(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Task Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {filteredTasks.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <Calendar size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
            <div style={{ fontWeight: 600, fontSize: '1rem' }}>No tasks found for this filter</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.35rem' }}>
              Change the filter or click "Add Task" to create a new milestone.
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isCompleted = task.status === 'completed';
            return (
              <div
                key={task.id}
                className="glass-card"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  padding: '1.15rem 1.25rem',
                  opacity: isCompleted ? 0.75 : 1,
                  borderLeft: task.priority === 'Critical' ? '4px solid var(--color-danger)' : undefined
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', flex: 1 }}>
                  {/* Checkbox */}
                  <button
                    type="button"
                    onClick={() => toggleTaskStatus(task.id)}
                    aria-label={`Mark task ${task.title} as ${isCompleted ? 'pending' : 'completed'}`}
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: 'var(--radius-sm)',
                      background: isCompleted ? 'var(--color-success)' : 'transparent',
                      border: isCompleted ? 'none' : '2px solid var(--border-glass-hover)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      cursor: 'pointer',
                      marginTop: '0.2rem',
                      flexShrink: 0
                    }}
                  >
                    {isCompleted && <Check size={14} strokeWidth={3} />}
                  </button>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                      <span style={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        textDecoration: isCompleted ? 'line-through' : 'none',
                        color: isCompleted ? 'var(--text-muted)' : 'var(--text-main)'
                      }}>
                        {task.title}
                      </span>
                      <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                        {task.phase || 'General'}
                      </span>
                      <span className={`badge ${
                        task.priority === 'Critical' ? 'badge-danger' : 
                        task.priority === 'High' ? 'badge-warning' : 'badge-neutral'
                      }`}>
                        {task.priority}
                      </span>
                    </div>

                    {task.description && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.65rem', lineHeight: 1.45 }}>
                        {task.description}
                      </p>
                    )}

                    {/* Deadline and Assignee controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)' }}>
                        <Clock size={14} />
                        <label htmlFor={`deadline-${task.id}`} style={{ marginRight: '0.2rem' }}>Due:</label>
                        <input
                          id={`deadline-${task.id}`}
                          type="date"
                          className="form-control"
                          style={{ width: '135px', padding: '0.25rem 0.5rem', fontSize: '0.775rem' }}
                          value={task.suggestedDeadline || ''}
                          onChange={(e) => handleDeadlineChange(task.id, e.target.value)}
                        />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)' }}>
                        <User size={14} />
                        <label htmlFor={`assignee-${task.id}`} style={{ marginRight: '0.2rem' }}>Assignee:</label>
                        <input
                          id={`assignee-${task.id}`}
                          type="text"
                          className="form-control"
                          style={{ width: '140px', padding: '0.25rem 0.5rem', fontSize: '0.775rem' }}
                          placeholder="Assign someone"
                          value={task.assignedTo || ''}
                          onChange={(e) => handleAssigneeChange(task.id, e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  className="btn btn-secondary btn-icon"
                  style={{ width: '30px', height: '30px', color: 'var(--color-danger)', flexShrink: 0 }}
                  onClick={() => handleDeleteTask(task.id)}
                  title="Delete task"
                  aria-label={`Delete task ${task.title}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
