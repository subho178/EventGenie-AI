/**
 * Timeline Calculator Service
 * Computes realistic milestone schedules, validates chronological ordering,
 * and calculates completion statistics for event preparation tasks.
 */

/**
 * Calculates preparation timeline statistics and enforces chronological consistency.
 * 
 * @param {Array} tasks - Array of task objects
 * @param {string|Date} eventDate - The main event date
 * @returns {object} Timeline summary and sorted, processed tasks
 */
export function processTimeline(tasks = [], eventDate = null) {
  if (!Array.isArray(tasks)) {
    tasks = [];
  }

  const parsedEventDate = eventDate ? new Date(eventDate) : null;
  const isEventDateValid = parsedEventDate && !isNaN(parsedEventDate.getTime());
  const now = new Date();

  let completedCount = 0;
  let inProgressCount = 0;
  let pendingCount = 0;
  let criticalCount = 0;

  const processedTasks = tasks.map((task, index) => {
    const id = task.id || `task-${index + 1}-${Date.now()}`;
    const title = (task.title || 'Untitled Preparation Task').trim();
    const description = (task.description || '').trim();
    const priority = ['Critical', 'High', 'Medium', 'Low'].includes(task.priority) 
      ? task.priority 
      : 'Medium';
    
    // Status normalization
    let status = 'pending';
    if (task.status === 'completed' || task.completed === true) {
      status = 'completed';
      completedCount++;
    } else if (task.status === 'in_progress' || task.status === 'in progress') {
      status = 'in_progress';
      inProgressCount++;
    } else {
      status = 'pending';
      pendingCount++;
    }

    if (priority === 'Critical') {
      criticalCount++;
    }

    // Suggested deadline validation
    let deadline = task.deadline || task.suggestedDeadline || '';
    let isPastDue = false;
    let daysUntilDeadline = null;

    if (deadline) {
      const parsedDeadline = new Date(deadline);
      if (!isNaN(parsedDeadline.getTime())) {
        deadline = parsedDeadline.toISOString().split('T')[0];
        const diffMs = parsedDeadline.getTime() - now.getTime();
        daysUntilDeadline = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        isPastDue = status !== 'completed' && daysUntilDeadline < 0;
      }
    }

    return {
      id,
      phase: task.phase || 'General Planning',
      title,
      description,
      suggestedDeadline: deadline,
      priority,
      status,
      assignedTo: task.assignedTo || '',
      isPastDue,
      daysUntilDeadline
    };
  });

  // Sort tasks chronologically by deadline, placing tasks without deadline at the end
  const sortedTasks = [...processedTasks].sort((a, b) => {
    if (!a.suggestedDeadline) return 1;
    if (!b.suggestedDeadline) return -1;
    return new Date(a.suggestedDeadline) - new Date(b.suggestedDeadline);
  });

  const totalTasks = processedTasks.length;
  const progressPercent = totalTasks > 0 
    ? Math.round((completedCount / totalTasks) * 100) 
    : 0;

  let daysUntilEvent = null;
  if (isEventDateValid) {
    const diffMs = parsedEventDate.getTime() - now.getTime();
    daysUntilEvent = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  return {
    tasks: sortedTasks,
    totalTasks,
    completedCount,
    inProgressCount,
    pendingCount,
    criticalCount,
    progressPercent,
    daysUntilEvent,
    eventDate: isEventDateValid ? parsedEventDate.toISOString().split('T')[0] : null
  };
}

/**
 * Helper to generate default realistic milestone deadlines relative to an event date.
 * @param {string|Date} eventDate 
 * @param {number} daysBefore 
 * @returns {string} ISO Date string YYYY-MM-DD
 */
export function getRelativeDeadline(eventDate, daysBefore) {
  const target = eventDate ? new Date(eventDate) : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
  const deadline = new Date(target.getTime() - daysBefore * 24 * 60 * 60 * 1000);
  return deadline.toISOString().split('T')[0];
}
