// src/services/firebaseService.js
import { firestore, storage } from '../firebase/firebase_config';

// Generic function to fetch data from a collection
export const fetchCollection = async (collectionName) => {
  try {
    const snapshot = await firestore.collection(collectionName).get();
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return data;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Generic function to add data to a collection
export const addToCollection = async (collectionName, data) => {
  try {
    const docRef = await firestore.collection(collectionName).add(data);
    return docRef.id;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Generic function to update a document
export const updateDocument = async (collectionName, docId, updatedData) => {
  try {
    await firestore.collection(collectionName).doc(docId).update(updatedData);
  } catch (error) {
    throw new Error(error.message);
  }
};

// Generic function to delete a document
export const deleteDocument = async (collectionName, docId) => {
  try {
    await firestore.collection(collectionName).doc(docId).delete();
  } catch (error) {
    throw new Error(error.message);
  }
};

// Function to upload a file to Firebase Storage and get its URL
export const uploadFile = async (file, path) => {
  try {
    const storageRef = storage.ref(`${path}/${file.name}_${Date.now()}`);
    await storageRef.put(file);
    const url = await storageRef.getDownloadURL();
    return url;
  } catch (error) {
    throw new Error(error.message);
  }
};
