// src/services/adminAnalyticsService.js

import { getDocs, collection } from 'firebase/firestore';
import { firestore as db } from '../firebase/firebase_config';

import adminExpenseService from './adminExpenseService'; 
import { adminWorkHoursService } from './adminWorkHoursService';

/** 
 * Convert Firestore Timestamp or {seconds, nanoseconds} or string into a JS Date.
 */
function toDateObj(dateValue) {
  if (!dateValue) return null;
  if (typeof dateValue.toDate === 'function') {
    return dateValue.toDate();
  }
  if (typeof dateValue === 'object' && dateValue.seconds !== undefined) {
    return new Date(dateValue.seconds * 1000 + Math.floor(dateValue.nanoseconds / 1000000));
  }
  if (typeof dateValue === 'string') {
    return new Date(dateValue);
  }
  return null;
}

/* ------------------------------------------------------------------
   1) Shared In-Memory Filtering for Expenses
   ------------------------------------------------------------------ */
async function getAllExpensesInMemory(filters) {
  // 1) Fetch *all* expenses (or minimal) from adminExpenseService
  //    We ignore the built-in single-field filters, calling it with no args or minimal args:
  const allExpenses = await adminExpenseService.getAllExpenses(); 
    // This returns an array of expense docs with .expenseType, .userID, .projectID, .date, .amount, etc.

  let results = [...allExpenses];

  // 2) In-memory filter

  // A) Date Range
  if (filters.dateRange?.start || filters.dateRange?.end) {
    const startMs = filters.dateRange.start ? new Date(filters.dateRange.start).getTime() : 0;
    const endMs = filters.dateRange.end ? new Date(filters.dateRange.end).getTime() : Number.MAX_SAFE_INTEGER;

    results = results.filter((exp) => {
      const d = toDateObj(exp.date);
      if (!d) return false;
      const t = d.getTime();
      return t >= startMs && t <= endMs;
    });
  }

  // B) projectIDs
  if (filters.projectIDs && filters.projectIDs.length > 0) {
    results = results.filter((exp) => {
      if (!exp.projectID) return false;
      return filters.projectIDs.includes(exp.projectID);
    });
  }

  // C) workerIDs
  if (filters.workerIDs && filters.workerIDs.length > 0) {
    results = results.filter((exp) => {
      if (!exp.userID) return false;
      return filters.workerIDs.includes(exp.userID);
    });
  }

  // D) expenseTypes
  if (filters.expenseTypes && filters.expenseTypes.length > 0) {
    results = results.filter((exp) => {
      if (!exp.expenseType) return false;
      return filters.expenseTypes.includes(exp.expenseType);
    });
  }

  return results;
}

/* ------------------------------------------------------------------
   2) "Expenses Over Time", "By Project", "By Type"
   ------------------------------------------------------------------ */

/**
 * getExpensesOverTime(filters):
 * Groups total expense amounts by date (YYYY-MM-DD).
 */
export async function getExpensesOverTime(filters) {
  const expenses = await getAllExpensesInMemory(filters);

  const grouped = {};
  for (const exp of expenses) {
    const d = toDateObj(exp.date);
    if (!d) continue;
    const dayKey = d.toISOString().slice(0, 10);
    if (!grouped[dayKey]) grouped[dayKey] = 0;
    grouped[dayKey] += exp.amount || 0;
  }

  return Object.entries(grouped).map(([dateKey, total]) => ({ dateKey, total }));
}

/**
 * getExpensesByProject(filters):
 * Groups total expense amounts by projectID, then fetches project name from Firestore.
 */
export async function getExpensesByProject(filters) {
  const expenses = await getAllExpensesInMemory(filters);

  // Group amounts by projectID
  const grouped = {};
  for (const exp of expenses) {
    const pID = exp.projectID || 'no_project';
    if (!grouped[pID]) grouped[pID] = 0;
    grouped[pID] += exp.amount || 0;
  }

  // fetch project docs for names
  const projectIDs = Object.keys(grouped).filter((id) => id !== 'no_project');
  const allProjSnap = await getDocs(collection(db, 'projects'));
  const projectMap = {};
  allProjSnap.forEach((snap) => {
    if (!snap.exists()) return;
    const docData = snap.data();
    projectMap[snap.id] = docData.name || 'Unknown Project';
  });

  // Convert to array
  return Object.entries(grouped).map(([projectID, total]) => {
    if (projectID === 'no_project') {
      return { projectID, projectName: 'No Project', total };
    }
    const projectName = projectMap[projectID] || 'Unknown Project';
    return { projectID, projectName, total };
  });
}

/**
 * getExpensesByType(filters):
 * Groups total expense amounts by expenseType
 */
export async function getExpensesByType(filters) {
  const expenses = await getAllExpensesInMemory(filters);

  const grouped = {};
  for (const exp of expenses) {
    const t = exp.expenseType || 'Unknown Type';
    if (!grouped[t]) grouped[t] = 0;
    grouped[t] += exp.amount || 0;
  }

  return Object.entries(grouped).map(([expenseType, total]) => ({ expenseType, total }));
}

/* ------------------------------------------------------------------
   3) "Worker" side: Hours, Wages, ClaimedExpenses
   ------------------------------------------------------------------ */

/** 
 * Worker Hours Stats (like totalRegular, totalOT15, totalOT20).
 */
export async function getWorkerHoursStats(filters) {
  // Build "advFilters" for adminWorkHoursService
  const adv = {};
  if (filters?.dateRange?.start) adv.dateFrom = filters.dateRange.start;
  if (filters?.dateRange?.end) adv.dateTo = filters.dateRange.end;
  // If arrays exist, we do in-memory or we pass single fields. 
  // The current adminWorkHoursService doesn't handle arrays, so let's do in-memory ourselves.
  // We'll fetch all "approved" hours with minimal Firestore constraints, then filter in memory.

  // 1) Step: fetch "approved" hours with no advanced constraints
  const allApproved = await adminWorkHoursService.getWorkHours('approved', {}); 
    // ignoring workerId or projectId to get everything

  // 2) In-memory filter by projectIDs, workerIDs, date
  let results = [...allApproved];

  // Already got date range? Actually, we could have used dateFrom/dateTo, but let's stay consistent.
  if (filters.projectIDs?.length) {
    results = results.filter((wh) => wh.projectID && filters.projectIDs.includes(wh.projectID));
  }
  if (filters.workerIDs?.length) {
    results = results.filter((wh) => wh.userID && filters.workerIDs.includes(wh.userID));
  }
  if (filters.dateRange?.start || filters.dateRange?.end) {
    const startMs = filters.dateRange.start ? new Date(filters.dateRange.start).getTime() : 0;
    const endMs = filters.dateRange.end ? new Date(filters.dateRange.end).getTime() : Number.MAX_SAFE_INTEGER;

    results = results.filter((wh) => {
      if (!wh.date) return false;
      const d = wh.date.toDate ? wh.date.toDate() : new Date(wh.date);
      const t = d.getTime();
      return t >= startMs && t <= endMs;
    });
  }

  // 3) Group by userID
  const grouped = {};
  results.forEach((wh) => {
    const uID = wh.userID;
    if (!grouped[uID]) {
      grouped[uID] = { workerID: uID, totalRegular: 0, totalOT15: 0, totalOT20: 0 };
    }
    grouped[uID].totalRegular += wh.regularHours || 0;
    grouped[uID].totalOT15 += wh.overtime15x || 0;
    grouped[uID].totalOT20 += wh.overtime20x || 0;
  });

  // 4) Load user docs to get name
  const workerIDs = Object.keys(grouped);
  const workerMap = {};
  if (workerIDs.length > 0) {
    const snap = await getDocs(collection(db, 'users'));
    snap.forEach((docSnap) => {
      if (!docSnap.exists()) return;
      const data = docSnap.data();
      workerMap[docSnap.id] = data.name || 'Unknown Worker';
    });
  }

  // 5) Convert to array
  return Object.values(grouped).map((obj) => {
    return {
      ...obj,
      workerName: workerMap[obj.workerID] || 'Unknown Worker',
    };
  });
}

/** 
 * Worker Wages Stats
 * Summarize wages = baseRate*(regular) + 1.5*(OT15)*baseRate + 2.0*(OT20)*baseRate
 */
export async function getWorkerWagesStats(filters) {
  // 1) fetch "approved" hours, ignoring adv filters so we can do in-memory
  const allApproved = await adminWorkHoursService.getWorkHours('approved', {});

  // 2) in-memory filter
  let results = [...allApproved];

  if (filters.projectIDs?.length) {
    results = results.filter((wh) => wh.projectID && filters.projectIDs.includes(wh.projectID));
  }
  if (filters.workerIDs?.length) {
    results = results.filter((wh) => wh.userID && filters.workerIDs.includes(wh.userID));
  }
  if (filters.dateRange?.start || filters.dateRange?.end) {
    const startMs = filters.dateRange.start ? new Date(filters.dateRange.start).getTime() : 0;
    const endMs = filters.dateRange.end ? new Date(filters.dateRange.end).getTime() : Number.MAX_SAFE_INTEGER;
    results = results.filter((wh) => {
      const d = wh.date?.toDate ? wh.date.toDate() : new Date(wh.date);
      const t = d.getTime();
      return t >= startMs && t <= endMs;
    });
  }

  // 3) Group by userID
  const grouped = {};
  results.forEach((wh) => {
    const uID = wh.userID;
    if (!grouped[uID]) {
      grouped[uID] = { 
        workerID: uID,
        totalRegularHours: 0,
        totalOT15Hours: 0,
        totalOT20Hours: 0,
      };
    }
    grouped[uID].totalRegularHours += wh.regularHours || 0;
    grouped[uID].totalOT15Hours += wh.overtime15x || 0;
    grouped[uID].totalOT20Hours += wh.overtime20x || 0;
  });

  // 4) For wages, fetch user docs to get baseRate
  const userMap = {};
  const userSnap = await getDocs(collection(db, 'users'));
  userSnap.forEach((docSnap) => {
    const data = docSnap.data();
    userMap[docSnap.id] = {
      name: data.name || 'Unknown Worker',
      baseRate: data.compensation?.baseRate || 0,
    };
  });

  // 5) Build result array
  const final = [];
  for (const uID of Object.keys(grouped)) {
    const item = grouped[uID];
    const baseRate = userMap[uID]?.baseRate || 0;
    const totalWages =
      item.totalRegularHours * baseRate +
      item.totalOT15Hours * baseRate * 1.5 +
      item.totalOT20Hours * baseRate * 2.0;

    final.push({
      workerID: uID,
      workerName: userMap[uID]?.name || 'Unknown Worker',
      totalRegularHours: item.totalRegularHours,
      totalOT15Hours: item.totalOT15Hours,
      totalOT20Hours: item.totalOT20Hours,
      totalWages,
      baseRate,
    });
  }

  return final;
}

/**
 * Worker Claimed Expenses
 * Groups expenses by userID + expenseType
 */
export async function getWorkerClaimedExpenses(filters) {
  // 1) fetch *all* expenses from your new in-memory function
  const allExpenses = await getAllExpensesInMemory(filters);

  // 2) group by worker + expenseType
  const grouped = {};
  for (const exp of allExpenses) {
    const uID = exp.userID || 'no_user';
    const t = exp.expenseType || 'Unknown';
    if (!grouped[uID]) {
      grouped[uID] = {};
    }
    if (!grouped[uID][t]) {
      grouped[uID][t] = 0;
    }
    grouped[uID][t] += exp.amount || 0;
  }

  // 3) fetch user docs to get name
  const userMap = {};
  const userSnap = await getDocs(collection(db, 'users'));
  userSnap.forEach((docSnap) => {
    const data = docSnap.data();
    userMap[docSnap.id] = data.name || 'Unknown Worker';
  });

  // 4) build array
  const results = [];
  for (const uID of Object.keys(grouped)) {
    if (uID === 'no_user') {
      results.push({
        workerID: 'no_user',
        workerName: 'No User',
        totalsByType: grouped[uID],
      });
    } else {
      results.push({
        workerID: uID,
        workerName: userMap[uID] || 'Unknown Worker',
        totalsByType: grouped[uID],
      });
    }
  }
  return results;
}
