// src/services/timesheetService.js
import { firestore } from '../firebase/firebase_config';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  Timestamp,
  orderBy,
  limit
} from 'firebase/firestore';

export const timesheetService = {

  // If you really want to fetch "projectAssignments" (optional)
  async getActiveAssignment(userID) {
    try {
      const assignmentsRef = collection(firestore, 'projectAssignments');
      const q = query(
        assignmentsRef,
        where('userID', '==', userID),  // use userID to match Firestore
        where('status', '==', 'active'),
        limit(1)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    } catch (error) {
      console.error('Error fetching active assignment:', error);
      throw error;
    }
  },

  // Submit new work hours
  async submitWorkHours(data) {
    // data should have userID, projectID, date, etc.
    try {
      const workHoursRef = collection(firestore, 'workHours');
      const docRef = await addDoc(workHoursRef, {
        userID: data.userID,                     // match Firestore naming
        projectID: data.projectID,
        date: Timestamp.fromDate(data.date),
        regularHours: parseFloat(data.regularHours) || 0,
        overtime15x: parseFloat(data.overtime15x) || 0,
        overtime20x: parseFloat(data.overtime20x) || 0,
        remarks: data.remarks || '',
        status: 'pending',
        createdAt: Timestamp.now(),
        paid: false,
        // You can add any other fields as needed (paid=false, paymentAmount=0, etc.)
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error submitting work hours:', error);
      throw error;
    }
  },

  // Example: get recent work hours if you want a summary
  async getRecentWorkHours(userID, limitCount = 7) {
    try {
      const workHoursRef = collection(firestore, 'workHours');
      const q = query(
        workHoursRef,
        where('userID', '==', userID),
        orderBy('date', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate() || new Date(),
      }));
    } catch (error) {
      console.error('Error fetching work hours:', error);
      throw error;
    }
  },
};
