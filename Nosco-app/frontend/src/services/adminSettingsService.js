// src/services/adminSettingsService.js
export const getRewardPoints = async (actionType) => {
    // This could be expanded later to fetch from a settings collection
    const DEFAULT_POINTS = {
      EXPENSE_APPROVED: 50,
      WORK_HOURS_APPROVED: 100,
      // etc
    };
    
    return DEFAULT_POINTS[actionType] || 0;
  };
  