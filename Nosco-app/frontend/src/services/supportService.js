import { app } from '../firebase/firebase_config';
import { getFirestore, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import emailjs from '@emailjs/browser';

const db = getFirestore(app);
const auth = getAuth(app);

// EmailJS credentials
const EMAILJS_SERVICE_ID = 'service_hyudouh';
const EMAILJS_TEMPLATE_ID = 'template_ec25lfd';
const EMAILJS_PUBLIC_KEY = 'x79I4B5lifhvNyXSY';

// Hardcoded admin emails for anonymous user notifications
const ADMIN_EMAILS = [
  'shng2025@gmail.com',
  'asiansticker6969@gmail.com', 
  'soonlee.ng@noscoasia.com'
];

export const sendSupportInquiry = async (inquiryData) => {
  try {
    // Check if user is authenticated
    const currentUser = auth.currentUser;
    let feedbackData;
    
    if (currentUser) {
      // Authenticated user feedback
      feedbackData = {
        subject: inquiryData.subject,
        message: inquiryData.message,
        userID: currentUser.uid,
        email: currentUser.email, // Store email for reference
        name: currentUser.displayName || 'User',
        phone: inquiryData.phone || '',
        createdAt: new Date(),
        status: 'New',
        updatedAt: new Date(),
        anonymous: false
      };
    } else {
      // Anonymous user feedback
      if (!inquiryData.email) {
        throw new Error("Email is required for feedback");
      }
      
      feedbackData = {
        subject: inquiryData.subject,
        message: inquiryData.message,
        name: inquiryData.name || 'Anonymous',
        email: inquiryData.email,
        phone: inquiryData.phone || '',
        createdAt: new Date(),
        status: 'New',
        updatedAt: new Date(),
        anonymous: true // Critical field for anonymous submissions
      };
    }
    
    // Add the feedback document
    const docRef = await addDoc(collection(db, "feedback"), feedbackData);
    console.log("Feedback sent with ID: ", docRef.id);
    
    // Notify admins via email
    try {
      let adminEmails = [];
      
      // For authenticated users, try to get admin emails from the database
      if (currentUser) {
        try {
          const adminQuery = query(collection(db, "users"), where("role", "==", "admin"));
          const adminSnapshot = await getDocs(adminQuery);
          adminEmails = adminSnapshot.docs.map(doc => doc.data().email).filter(email => email);
        } catch (error) {
          console.log("Could not query admin emails, falling back to hardcoded emails", error);
          adminEmails = ADMIN_EMAILS;
        }
      } else {
        // For anonymous users, use hardcoded admin emails
        adminEmails = ADMIN_EMAILS;
      }
      
      if (adminEmails.length > 0) {
        const adminEmailsStr = adminEmails.join(', ');
        
        // Setup EmailJS parameters
        const templateParams = {
          to_email: adminEmailsStr,
          from_name: feedbackData.name,
          from_email: feedbackData.email,
          subject: feedbackData.subject,
          message: feedbackData.message,
          feedback_id: docRef.id,
          phone: feedbackData.phone || 'Not provided'
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