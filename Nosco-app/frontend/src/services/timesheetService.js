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
  async getCurrentProject(userId) {
    try {
      const assignmentsRef = collection(firestore, 'projectAssignments');
      const q = query(
        assignmentsRef,
        where('userId', '==', userId),
        where('status', '==', 'active'),
        limit(1)
      );
      const snapshot = await getDocs(q);
      return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    } catch (error) {
      console.error('Error fetching current project:', error);
      throw error;
    }
  },

  async submitWorkHours(data) {
    try {
      const workHoursRef = collection(firestore, 'workHours');
      const docRef = await addDoc(workHoursRef, {
        userId: data.userId,
        projectId: data.project,
        date: Timestamp.fromDate(data.date),
        regularHours: parseFloat(data.regularHours),
        overtime15x: parseFloat(data.overtime15x || 0),
        overtime20x: parseFloat(data.overtime20x || 0),
        remarks: data.remarks,
        status: 'pending',
        createdAt: Timestamp.now()
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error submitting work hours:', error);
      throw error;
    }
  },

  async getRecentWorkHours(userId, limit = 7) {
    try {
      const workHoursRef = collection(firestore, 'workHours');
      const q = query(
        workHoursRef,
        where('userId', '==', userId),
        orderBy('date', 'desc'),
        limit(limit)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate() // Ensure date is converted to JS Date object
      }));
    } catch (error) {
      console.error('Error fetching work hours:', error);
      throw error;
    }
  }
};