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

  // Firestore Timestamp => .toDate()
  if (typeof dateValue.toDate === 'function') {
    return dateValue.toDate();
  }

  // { seconds, nanoseconds }
  if (typeof dateValue === 'object' && dateValue.seconds !== undefined) {
    return new Date(dateValue.seconds * 1000 + Math.floor(dateValue.nanoseconds / 1000000));
  }

  // If it's a string
  if (typeof dateValue === 'string') {
    return new Date(dateValue);
  }

  return null;
}

/* ----------------------------------------------------------------
   1) getWorkerHoursByProjectReport
   SINGLE worker, MULTI projects, date range
   Columns:
     "Worker Name", "Date", "Location", "Project Name",
     "Regular Hours", "Overtime 1.5", "Overtime 2.0", 
     "Status", "Approved By", "Remarks"
   Sort:
     Worker Name -> Date -> Location -> Project Name
----------------------------------------------------------------*/
export async function getWorkerHoursByProjectReport(filters) {
  // 1) fetch from adminWorkHoursService
  const rawDocs = await adminWorkHoursService.getWorkHours('all', {});

  // 2) In-memory filter
  let results = [...rawDocs];

  // (A) date range
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

  // (B) single worker
  if (filters.workerID) {
    results = results.filter((item) => item.userID === filters.workerID);
  }

  // (C) multi projects
  if (filters.projectIDs?.length > 0) {
    results = results.filter(
      (item) => item.projectID && filters.projectIDs.includes(item.projectID)
    );
  }

  // 3) Build projectMap => { projectID: { name, location } }
  const projectMap = {};
  {
    const snap = await getDocs(collection(db, 'projects'));
    snap.forEach((pDoc) => {
      const pData = pDoc.data();
      projectMap[pDoc.id] = {
        name: pData.name || pDoc.id,
        location: pData.location || '',
      };
    });
  }

  // 4) Build userMap => { userID -> userName }
  const userIDs = new Set();
  results.forEach((item) => {
    if (item.userID) userIDs.add(item.userID);
    if (item.approvedBy) userIDs.add(item.approvedBy);
  });

  const userMap = {};
  if (userIDs.size > 0) {
    const userSnap = await getDocs(collection(db, 'users'));
    userSnap.forEach((uDoc) => {
      const uData = uDoc.data();
      userMap[uDoc.id] = uData.name || uDoc.id;
    });
  }

  // 5) Transform => new columns
  const final = results.map((item) => {
    const dateObj = toDateObj(item.date);
    const dateStr = dateObj ? dateObj.toISOString().slice(0, 10) : '';
    const workerName = userMap[item.userID] || '';
    const approvedName = item.approvedBy ? (userMap[item.approvedBy] || '') : '';

    const projInfo = projectMap[item.projectID] || { name: '', location: '' };
    const locationStr = projInfo.location;
    const projectNameStr = projInfo.name;

    return {
      'Worker Name': workerName,
      'Date': dateStr,
      'Location': locationStr,
      'Project Name': projectNameStr,
      'Regular Hours': item.regularHours || 0,
      'Overtime 1.5': item.overtime15x || 0,
      'Overtime 2.0': item.overtime20x || 0,
      'Status': item.status || '',
      'Approved By': approvedName,
      'Remarks': item.remarks || '',
    };
  });

  // 6) Sort => Worker Name -> Date -> Location -> Project Name
  final.sort((a, b) => {
    // Worker Name
    if (a['Worker Name'] !== b['Worker Name']) {
      return a['Worker Name'].localeCompare(b['Worker Name']);
    }
    // Date
    if (a['Date'] !== b['Date']) {
      return a['Date'].localeCompare(b['Date']);
    }
    // Location
    if (a['Location'] !== b['Location']) {
      return a['Location'].localeCompare(b['Location']);
    }
    // Project Name
    return a['Project Name'].localeCompare(b['Project Name']);
  });

  return final;
}

/* ----------------------------------------------------------------
   2) getExpensesForCsv
   columns:
     Location, Project Name, Date, Expense Type, Amount,
     Worker Name, Approved Status, Approved By, Description
   sort => location -> project name -> date -> expense type -> amount
----------------------------------------------------------------*/
export async function getExpensesForCsv(filters) {
  // 1) fetch all expense docs
  const rawDocs = await adminExpenseService.getAllExpenses();
  let results = [...rawDocs];

  // 2) in-memory filter
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

  // 3) Build projectMap => get location + name?
  const projectMap = {};
  {
    const projSnap = await getDocs(collection(db, 'projects'));
    projSnap.forEach((pDoc) => {
      const pData = pDoc.data();
      projectMap[pDoc.id] = {
        name: pData.name || pDoc.id,
        location: pData.location || '',
      };
    });
  }

  // 4) userMap => for worker name & approvedBy name
  const userIDs = new Set();
  results.forEach((exp) => {
    if (exp.userID) userIDs.add(exp.userID);
    if (exp.approvedBy) userIDs.add(exp.approvedBy);
  });
  const userMap = {};
  if (userIDs.size > 0) {
    const userSnap = await getDocs(collection(db, 'users'));
    userSnap.forEach((uDoc) => {
      const uData = uDoc.data();
      userMap[uDoc.id] = uData.name || uDoc.id;
    });
  }

  // 5) Transform => location, project name, date, expense type, amount, ...
  const final = results.map((exp) => {
    const dateObj = toDateObj(exp.date);
    const dateStr = dateObj ? dateObj.toISOString().slice(0, 10) : '';

    const projInfo = projectMap[exp.projectID] || { name: '', location: '' };
    const locationStr = projInfo.location;
    const projectName = projInfo.name;

    const workerName = exp.userID ? (userMap[exp.userID] || '') : '';
    const approvedName = exp.approvedBy ? (userMap[exp.approvedBy] || '') : '';

    return {
      Location: locationStr,
      'Project Name': projectName,
      Date: dateStr,
      'Expense Type': exp.expenseType || '',
      Amount: exp.amount || 0,
      'Worker Name': workerName,
      'Approved Status': exp.status || '',
      'Approved By': approvedName,
      Description: exp.description || '',
    };
  });

  // 6) Sort => location -> project name -> date -> expense type -> amount
  final.sort((a, b) => {
    // location
    if (a.Location !== b.Location) {
      return a.Location.localeCompare(b.Location);
    }
    // project
    if (a['Project Name'] !== b['Project Name']) {
      return a['Project Name'].localeCompare(b['Project Name']);
    }
    // date
    if (a.Date !== b.Date) {
      return a.Date.localeCompare(b.Date);
    }
    // expense type
    if (a['Expense Type'] !== b['Expense Type']) {
      return a['Expense Type'].localeCompare(b['Expense Type']);
    }
    // amount
    return a.Amount - b.Amount;
  });

  return final;
}

/* ----------------------------------------------------------------
   3) getProjectWorkerHoursCsv
   columns:
     Location, Project Name, Date, Worker Name,
     Regular Hours, Overtime 1.5, Overtime 2.0,
     Status, Approved By, Remarks
   sorted => location -> project name -> date -> worker name
----------------------------------------------------------------*/
export async function getProjectWorkerHoursCsv(filters) {
  // 1) filter the projects by statuses, location, etc.
  const projSnap = await getDocs(collection(db, 'projects'));
  let projectsArr = [];
  projSnap.forEach((pDoc) => {
    const pData = pDoc.data();
    projectsArr.push({ id: pDoc.id, ...pData });
  });

  // Filter by statuses
  if (filters.statuses?.length) {
    projectsArr = projectsArr.filter((p) => p.status && filters.statuses.includes(p.status));
  }
  // Filter by locations
  if (filters.locations?.length) {
    projectsArr = projectsArr.filter(
      (p) => p.location && filters.locations.includes(p.location)
    );
  }
  // date range if needed for project-level date

  // 2) fetch all hours
  const allHours = await adminWorkHoursService.getWorkHours('all', {});

  // build user set
  const userIDs = new Set();
  allHours.forEach((wh) => {
    if (wh.userID) userIDs.add(wh.userID);
    if (wh.approvedBy) userIDs.add(wh.approvedBy);
  });

  // userMap
  const userMap = {};
  if (userIDs.size > 0) {
    const userSnap = await getDocs(collection(db, 'users'));
    userSnap.forEach((uDoc) => {
      const uData = uDoc.data();
      userMap[uDoc.id] = uData.name || uDoc.id;
    });
  }

  // 3) build final
  const final = [];

  for (const proj of projectsArr) {
    const locationStr = proj.location || '';
    const projectNameStr = proj.name || proj.id;

    // filter hours with projectID=proj.id
    const matchingHours = allHours.filter((wh) => wh.projectID === proj.id);

    // optional: further filter by date range from the hours doc if needed

    // transform each hour
    for (const wh of matchingHours) {
      const dateObj = toDateObj(wh.date);
      const dateStr = dateObj ? dateObj.toISOString().slice(0, 10) : '';
      const workerName = wh.userID ? (userMap[wh.userID] || '') : '';
      const approvedName = wh.approvedBy ? (userMap[wh.approvedBy] || '') : '';

      final.push({
        Location: locationStr,
        'Project Name': projectNameStr,
        Date: dateStr,
        'Worker Name': workerName,
        'Regular Hours': wh.regularHours || 0,
        'Overtime 1.5': wh.overtime15x || 0,
        'Overtime 2.0': wh.overtime20x || 0,
        Status: wh.status || '',
        'Approved By': approvedName,
        Remarks: wh.remarks || '',
      });
    }
  }

  // 4) sort => location -> project name -> date -> worker name
  final.sort((a, b) => {
    if (a.Location !== b.Location) {
      return a.Location.localeCompare(b.Location);
    }
    if (a['Project Name'] !== b['Project Name']) {
      return a['Project Name'].localeCompare(b['Project Name']);
    }
    if (a.Date !== b.Date) {
      return a.Date.localeCompare(b.Date);
    }
    return a['Worker Name'].localeCompare(b['Worker Name']);
  });

  return final;
}

/* ----------------------------------------------------------------
   4) getProjectExpensesCsv
   columns:
     Location, Project Name, Date, Expense Type, Amount,
     Worker Name, Status, Approved By, Description
   sort => location -> project name -> date -> expense type -> amount
----------------------------------------------------------------*/
export async function getProjectExpensesCsv(filters) {
  // 1) filter projects
  const projSnap = await getDocs(collection(db, 'projects'));
  let projectsArr = [];
  projSnap.forEach((pDoc) => {
    const pData = pDoc.data();
    projectsArr.push({ id: pDoc.id, ...pData });
  });

  if (filters.statuses?.length) {
    projectsArr = projectsArr.filter((p) => p.status && filters.statuses.includes(p.status));
  }
  if (filters.locations?.length) {
    projectsArr = projectsArr.filter((p) => p.location && filters.locations.includes(p.location));
  }
  // date range if you want to filter project-level date

  // 2) fetch all expenses
  const allExpenses = await adminExpenseService.getAllExpenses();

  // build user set
  const userIDs = new Set();
  allExpenses.forEach((exp) => {
    if (exp.userID) userIDs.add(exp.userID);
    if (exp.approvedBy) userIDs.add(exp.approvedBy);
  });
  const userMap = {};
  if (userIDs.size > 0) {
    const userSnap = await getDocs(collection(db, 'users'));
    userSnap.forEach((uDoc) => {
      const uData = uDoc.data();
      userMap[uDoc.id] = uData.name || uDoc.id;
    });
  }

  // 3) build final
  const final = [];
  for (const proj of projectsArr) {
    const locationStr = proj.location || '';
    const projectNameStr = proj.name || proj.id;

    // filter expenses with projectID = proj.id
    const matchingExpenses = allExpenses.filter(
      (exp) => exp.projectID === proj.id
    );

    // optionally filter by date range inside each expense doc

    // transform each expense
    for (const exp of matchingExpenses) {
      const dateObj = toDateObj(exp.date);
      const dateStr = dateObj ? dateObj.toISOString().slice(0, 10) : '';

      const workerName = exp.userID ? (userMap[exp.userID] || '') : '';
      const approvedName = exp.approvedBy ? (userMap[exp.approvedBy] || '') : '';

      final.push({
        Location: locationStr,
        'Project Name': projectNameStr,
        Date: dateStr,
        'Expense Type': exp.expenseType || '',
        Amount: exp.amount || 0,
        'Worker Name': workerName,
        Status: exp.status || '',
        'Approved By': approvedName,
        Description: exp.description || '',
      });
    }
  }

  // 4) sort => location -> project name -> date -> expense type -> amount
  final.sort((a, b) => {
    // location
    if (a.Location !== b.Location) {
      return a.Location.localeCompare(b.Location);
    }
    // project
    if (a['Project Name'] !== b['Project Name']) {
      return a['Project Name'].localeCompare(b['Project Name']);
    }
    // date
    if (a.Date !== b.Date) {
      return a.Date.localeCompare(b.Date);
    }
    // expense type
    if (a['Expense Type'] !== b['Expense Type']) {
      return a['Expense Type'].localeCompare(b['Expense Type']);
    }
    // amount
    return a.Amount - b.Amount;
  });

  return final;
}
