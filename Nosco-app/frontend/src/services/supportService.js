import { app } from '../firebase/firebase_config'; // auth, firestore, storage, app <-- full module
import { getFirestore, collection, addDoc } from 'firebase/firestore';

const db = getFirestore(app);

export const sendSupportInquiry = async (inquiryData) => {
  try {
    const docRef = await addDoc(collection(db, "supportInquiries"), {
      ...inquiryData,
      createdAt: new Date()
    });
    console.log("Support inquiry sent with ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error sending support inquiry: ", error);
    throw error;
  }
};