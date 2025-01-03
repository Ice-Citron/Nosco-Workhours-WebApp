// src/services/adminReportService.js

import adminExpenseService from './adminExpenseService';
import { adminWorkHoursService } from './adminWorkHoursService';
import { firestore as db } from '../firebase/firebase_config';
import { collection, getDocs } from 'firebase/firestore';

/**
 * Utility: convert Firestore Timestamps or strings to JS Date
 */
function toDateObj(dateValue) {
  if (!dateValue) return null;

  // If Firestore Timestamp => .toDate()
  if (typeof dateValue.toDate === 'function') {
    return dateValue.toDate();
  }

  // If { seconds, nanoseconds }
  if (typeof dateValue === 'object' && dateValue.seconds !== undefined) {
    return new Date(
      dateValue.seconds * 1000 + Math.floor(dateValue.nanoseconds / 1000000)
    );
  }

  // If it's a string
  if (typeof dateValue === 'string') {
    return new Date(dateValue);
  }

  return null;
}

/* ----------------------------------------------------------------
   1) For SINGLE worker, MULTI projects, date range 
   => getWorkerHoursByProjectReport
   ----------------------------------------------------------------*/

   export async function getWorkerHoursByProjectReport(filters) {
    // 1) fetch everything from adminWorkHoursService
    //    Possibly pass 'all' or 'approved'. We do 'all' here:
    const rawDocs = await adminWorkHoursService.getWorkHours('all', {});
      // rawDocs likely has shape: [{ id, date, userID, projectID, status, ... }, ...]
  
    // 2) in-memory filtering
    let results = [...rawDocs];
  
    // A) date range
    if (filters.dateRange?.start || filters.dateRange?.end) {
      const startMs = filters.dateRange.start
        ? new Date(filters.dateRange.start).getTime()
        : 0;
      const endMs = filters.dateRange.end
        ? new Date(filters.dateRange.end).getTime()
        : Number.MAX_SAFE_INTEGER;
  
      results = results.filter((item) => {
        const d = toDateObj(item.date);
        if (!d) return false;
        const t = d.getTime();
        return t >= startMs && t <= endMs;
      });
    }
  
    // B) single worker
    if (filters.workerID) {
      results = results.filter((item) => item.userID === filters.workerID);
    }
  
    // C) multi projects
    if (filters.projectIDs?.length) {
      results = results.filter((item) =>
        item.projectID && filters.projectIDs.includes(item.projectID)
      );
    }
  
    // D) build projectMap => { projectID -> projectName }
    let projectMap = {};
    if (filters.projectIDs?.length > 0) {
      const snap = await getDocs(collection(db, 'projects'));
      snap.forEach((pDoc) => {
        const pData = pDoc.data();
        projectMap[pDoc.id] = pData.name || pDoc.id;
      });
    }
  
    // E) flatten or transform for CSV
    const final = results.map((item) => {
      const dateObj = toDateObj(item.date);
      const dateStr = dateObj ? dateObj.toISOString().slice(0, 10) : '';
      const projName = projectMap[item.projectID] || item.projectID || '';
  
      return {
        projectName: projName,
        projectID: item.projectID || '',
        date: dateStr,
        status: item.status || '',
        regularHours: item.regularHours || 0,
        overtime15x: item.overtime15x || 0,
        overtime20x: item.overtime20x || 0,
        remarks: item.remarks || '',
      };
    });
  
    // F) sort by projectName, then date
    final.sort((a, b) => {
      if (a.projectName !== b.projectName) {
        return a.projectName.localeCompare(b.projectName);
      }
      return a.date.localeCompare(b.date);
    });
  
    return final;
  }
  

/* ----------------------------------------------------------------
   2) Work Hours (multi worker, multi project, date range)
   => getWorkHoursForReport
   ----------------------------------------------------------------*/

export async function getWorkHoursForReport(filters) {
  // fetch e.g. 'approved' from adminWorkHoursService
  const rawDocs = await adminWorkHoursService.getWorkHours('approved', {});
  let results = [...rawDocs];

  // date range
  if (filters.dateRange?.start || filters.dateRange?.end) {
    const startMs = filters.dateRange.start
      ? new Date(filters.dateRange.start).getTime()
      : 0;
    const endMs = filters.dateRange.end
      ? new Date(filters.dateRange.end).getTime()
      : Number.MAX_SAFE_INTEGER;

    results = results.filter((doc) => {
      const d = toDateObj(doc.date);
      if (!d) return false;
      const t = d.getTime();
      return t >= startMs && t <= endMs;
    });
  }

  // projectIDs
  if (filters.projectIDs?.length) {
    results = results.filter(
      (doc) => doc.projectID && filters.projectIDs.includes(doc.projectID)
    );
  }

  // workerIDs
  if (filters.workerIDs?.length) {
    results = results.filter(
      (doc) => doc.userID && filters.workerIDs.includes(doc.userID)
    );
  }

  return results;
}

/* ----------------------------------------------------------------
   3) Expenses => getExpensesForReport
   => multi projectIDs, multi workerIDs, expenseTypes, date range
   ----------------------------------------------------------------*/

export async function getExpensesForReport(filters) {
  // 1) fetch all from adminExpenseService
  const allExpenses = await adminExpenseService.getAllExpenses();
  let results = [...allExpenses];

  // date range
  if (filters.dateRange?.start || filters.dateRange?.end) {
    const startMs = filters.dateRange.start
      ? new Date(filters.dateRange.start).getTime()
      : 0;
    const endMs = filters.dateRange.end
      ? new Date(filters.dateRange.end).getTime()
      : Number.MAX_SAFE_INTEGER;

    results = results.filter((exp) => {
      const d = toDateObj(exp.date);
      if (!d) return false;
      const t = d.getTime();
      return t >= startMs && t <= endMs;
    });
  }

  // projectIDs
  if (filters.projectIDs?.length) {
    results = results.filter(
      (exp) => exp.projectID && filters.projectIDs.includes(exp.projectID)
    );
  }

  // workerIDs
  if (filters.workerIDs?.length) {
    results = results.filter(
      (exp) => exp.userID && filters.workerIDs.includes(exp.userID)
    );
  }

  // expenseTypes
  if (filters.expenseTypes?.length) {
    results = results.filter(
      (exp) => exp.expenseType && filters.expenseTypes.includes(exp.expenseType)
    );
  }

  return results;
}

/* ----------------------------------------------------------------
   4) Projects => getProjectsForReport
   => if you want to do date range (start/end) or status, location, etc.
   ----------------------------------------------------------------*/

export async function getProjectsForReport(filters) {
  // fetch all projects
  const snap = await getDocs(collection(db, 'projects'));
  let results = snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // filter by status
  if (filters.status) {
    results = results.filter((proj) => proj.status === filters.status);
  }

  // filter by location
  if (filters.location) {
    results = results.filter((proj) => proj.location === filters.location);
  }

  // date range if you store createdAt, etc.
  if (filters.dateRange?.start || filters.dateRange?.end) {
    // e.g., if proj has proj.createdAt
    // parse it => compare to startMs/endMs
  }

  return results;
}
