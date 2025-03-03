import { app } from '../firebase/firebase_config'; // auth, firestore, storage, app <-- full module
import { getFirestore, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import emailjs from '@emailjs/browser';

const db = getFirestore(app);
const auth = getAuth(app);

// Replace these with your actual EmailJS credentials
const EMAILJS_SERVICE_ID = 'service_hyudouh';  // From your EmailJS dashboard
const EMAILJS_TEMPLATE_ID = 'template_ec25lfd'; // From your EmailJS dashboard
const EMAILJS_PUBLIC_KEY = 'x79I4B5lifhvNyXSY'; // From your EmailJS account page

export const sendSupportInquiry = async (inquiryData) => {
  try {
    // Check if user is authenticated
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("You must be logged in to send feedback");
    }
    
    // Check for rate limiting (e.g., max 5 feedback submissions per day)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const feedbackQuery = query(
      collection(db, "feedback"),
      where("userID", "==", currentUser.uid),
      where("createdAt", ">=", yesterday)
    );
    
    const feedbackSnapshot = await getDocs(feedbackQuery);
    if (feedbackSnapshot.size >= 5) {
      throw new Error("You've reached the maximum number of feedback submissions for today");
    }
    
    // Add the feedback
    const docRef = await addDoc(collection(db, "feedback"), {
      subject: inquiryData.subject,
      message: inquiryData.message,
      userID: currentUser.uid,
      createdAt: new Date(),
      status: 'New',
      updatedAt: new Date()
    });
    
    console.log("Feedback sent with ID: ", docRef.id);
    
    // Find all admin emails for notification
    try {
      const adminQuery = query(collection(db, "users"), where("role", "==", "admin"));
      const adminSnapshot = await getDocs(adminQuery);
      const adminEmails = adminSnapshot.docs.map(doc => doc.data().email).filter(email => email);
      
      if (adminEmails.length > 0) {
        // Format emails for EmailJS template
        const adminEmailsStr = adminEmails.join(', ');
        
        // Setup EmailJS parameters
        const templateParams = {
          to_email: adminEmailsStr,
          from_name: currentUser.displayName || 'User',
          from_email: currentUser.email,
          subject: inquiryData.subject,
          message: inquiryData.message,
          feedback_id: docRef.id
        };
        
        // Send email via EmailJS
        const response = await emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID, 
          templateParams,
          EMAILJS_PUBLIC_KEY
        );
        
        console.log('Email notification sent successfully:', response);
      }
    } catch (emailError) {
      // Log email error but don't fail the whole operation
      console.error("Error sending email notification: ", emailError);
    }
    
    return docRef.id;
  } catch (error) {
    console.error("Error sending feedback: ", error);
    throw error;
  }
};