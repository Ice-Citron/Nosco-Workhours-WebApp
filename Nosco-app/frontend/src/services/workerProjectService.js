// File: src/services/workerProjectService.js

import { firestore as db } from '../firebase/firebase_config';
import {
  collection,
  query,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';

console.log('workerProjectService module loaded');

//
// 1) getWorkerProjects
//
// Returns an array of project docs in which the user is a worker.
// We look at project.workers[userId] existence.
//
export const getWorkerProjects = async (userId) => {
  try {
    const projectsRef = collection(db, 'projects');
    const snapshot = await getDocs(query(projectsRef));
    console.log(
      'Service: Fetched',
      snapshot.docs.length,
      'documents from projects collection'
    );

    const projects = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.workers && data.workers[userId]) {
        projects.push({ id: docSnap.id, ...data });
      }
    });
    return projects;
  } catch (error) {
    console.error('Service: Error fetching worker projects:', error);
    throw error;
  }
};

//
// 2) setCurrentActiveProject
//
// Updates user doc: { currentActiveProject: projectId, updatedAt: serverTimestamp() }
//
export const setCurrentActiveProject = async (userId, projectId) => {
  try {
    const userRef = doc(db, 'users', userId);
    // 1) Update
    await updateDoc(userRef, {
      currentActiveProject: projectId,
      updatedAt: serverTimestamp()
    });
    // 2) Immediately re‐fetch
    const snap = await getDoc(userRef);
    return snap.exists() ? snap.data() : null;
  } catch (error) {
    console.error('Error setting current active project:', error);
    throw error;
  }
};

//
// 3) getProjectDetails
//
// Fetches a single project doc by ID.
// Optionally pass userId to verify that the worker is in the project’s workers map (if you want).
//
export const getProjectDetails = async (projectId, userId) => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    const snap = await getDoc(projectRef);

    if (!snap.exists()) {
      throw new Error(`Project ${projectId} not found`);
    }

    const data = snap.data();

    // Optional: if we need to verify the worker is assigned
    if (userId && (!data.workers || !data.workers[userId])) {
      console.warn(
        `Project ${projectId} does not contain user ${userId} in workers map`
      );
      // You could throw an error if you want to block them
      // or just return the data if your Firestore rules already handle security
    }

    return { id: snap.id, ...data };
  } catch (error) {
    console.error('Service: Error fetching project details:', error);
    throw error;
  }
};

//
// 4) getCurrentUserProject
//
// Reads user doc => obtains currentActiveProject => loads that project doc
//
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

export default {
  getWorkerProjects,
  setCurrentActiveProject,
  getProjectDetails,
  getCurrentUserProject
};
