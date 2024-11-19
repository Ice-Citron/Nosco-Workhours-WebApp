// src/services/adminService.js (or wherever your admin approval logic lives)
import { adminRewardService } from './adminRewardService';

// Example integration with expense approval
export const approveExpense = async (expenseID, adminNotes = '') => {
  try {
    // Your existing expense approval logic...
    
    // After successful approval, add points
    const expenseDoc = await getDoc(doc(firestore, 'expense', expenseID));
    const { userID, amount, description } = expenseDoc.data();
    
    await adminRewardService.addUserPoints(
      userID,
      50, // points to add
      'Expense Approved',
      {
        relatedEntityType: 'expense',
        relatedEntityID: expenseID,
        adminNotes,
        expenseAmount: amount,
        expenseDescription: description
      }
    );

    return true;
  } catch (error) {
    console.error('Error in expense approval:', error);
    return false;
  }
};

// Similar integration for other admin actions...