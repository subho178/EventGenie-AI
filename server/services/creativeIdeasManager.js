/**
 * Creative Ideas Manager
 * Structures and categorizes event creative ideas, allows toggling saved/favorited ideas,
 * and maintains customized notes.
 */

export function processCreativeIdeas(ideas = {}) {
  if (!ideas || typeof ideas !== 'object') {
    ideas = {};
  }

  const normalizeList = (list) => {
    if (!Array.isArray(list)) return [];
    return list.map((item, index) => {
      if (typeof item === 'string') {
        return {
          id: `idea-${Math.random().toString(36).substring(2, 9)}`,
          title: item,
          description: '',
          saved: false
        };
      }
      return {
        id: item.id || `idea-${Math.random().toString(36).substring(2, 9)}`,
        title: item.title || 'Creative Suggestion',
        description: item.description || '',
        tag: item.tag || '',
        saved: Boolean(item.saved)
      };
    });
  };

  return {
    themeConcepts: normalizeList(ideas.themeConcepts),
    activitiesAndEntertainment: normalizeList(ideas.activitiesAndEntertainment),
    invitationWording: normalizeList(ideas.invitationWording),
    guestEngagement: normalizeList(ideas.guestEngagement),
    foodAndPresentation: normalizeList(ideas.foodAndPresentation),
    budgetFriendlyAlternatives: normalizeList(ideas.budgetFriendlyAlternatives),
    weatherBackupPlan: normalizeList(ideas.weatherBackupPlan)
  };
}
