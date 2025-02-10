// src/services/workerProjectService.js

import { firestore as db } from '../firebase/firebase_config';
import { collection, query, getDocs, doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';

console.log('workerProjectService module loaded');


export const getWorkerProjects = async (userId) => {
  try {
    const projectsRef = collection(db, 'projects');
    const q = query(projectsRef);
    const snapshot = await getDocs(q);
    console.log('Service: Fetched', snapshot.docs.length, 'documents from projects collection');
    const projects = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.workers && data.workers[userId]) {
        projects.push({ id: docSnap.id, ...data });
      } else {
      }
    });
    return projects;
  } catch (error) {
    console.error('Service: Error fetching worker projects:', error);
    throw error;
  }
};

export const setCurrentActiveProject = async (userId, projectId) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      currentActiveProject: projectId,
      updatedAt: serverTimestamp()
    });
    return { userId, currentActiveProject: projectId };
  } catch (error) {
    console.error('Service: Error setting current active project:', error);
    throw error;
  }
};

export const getCurrentUserProject = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return null;
    const userData = userSnap.data();
    if (!userData.currentActiveProject) return null;
    const projectRef = doc(db, 'projects', userData.currentActiveProject);
    const projectSnap = await getDoc(projectRef);
    if (!projectSnap.exists()) return null;
    return { id: projectSnap.id, ...projectSnap.data() };
  } catch (error) {
    console.error('Service: Error fetching current user project:', error);
    throw error;
  }
};

export default { getWorkerProjects, setCurrentActiveProject, getCurrentUserProject };
