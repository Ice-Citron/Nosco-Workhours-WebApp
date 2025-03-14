// Example Admin Document Structure
{
  "admin789": {
    "email": "admin@company.com",
    "name": "Admin User",
    "profilePic": "https://firebasestorage.../admin-pic.jpg",
    "role": "admin",
    "department": "Operations", // Additional fields for admins
    "position": "Senior Operations Manager",
    "createdAt": Timestamp,
    "lastActive": Timestamp
  }
}

// Enhanced Worker Document Structure
{
  "GR5Fj3fglKZkr9fvhHKGfrhpi3b2": {
    "email": "shng2025@gmail.com",
    "name": "Shi Hao",
    "profilePic": "https://firebasestorage.../noodle-2.jpeg",
    "role": "worker",
    "department": "Engineering",
    "position": "Software Engineer",
    "joinedDate": Timestamp,
    "status": "active",
    "bankAccounts": [
      {
        "id": "bank1",
        "bankName": "Example Bank",
        "accountNumber": "XXXX-4321",
        "isDefault": true,
        "currency": "USD"
      }
    ],
    "emergencyContact": {
      "name": "Emergency Contact",
      "relationship": "Family",
      "phone": "+1234567890"
    }
  }
}


// Notification schema in Firestore
{
  id: string,
  userId: string,
  type: string, // 'expense' | 'payment' | 'project'
  title: string,
  message: string,
  read: boolean,
  link: string?, // Optional link to related entity
  createdAt: timestamp,
  entityId: string?, // ID of related entity (expense, payment, etc)
  entityType: string? // Type of related entity
}

---

// rewards collection
{
  userID: string,
  totalPoints: number,
  lastUpdated: timestamp,
  rank: number
}

// rewardHistory collection
{
  userID: string,
  points: number,
  change: number,
  reason: string,
  relatedEntityId: string?, // e.g., expenseId
  relatedEntityType: string?, // e.g., 'expense'
  createdAt: timestamp
}




interface Feedback {
  feedbackID: string;        // Auto-generated by Firestore
  userID: string;           // Reference to user who submitted
  subject: string;          // Feedback subject/title
  message: string;          // Main feedback content
  status: 'New' | 'In Progress' | 'Resolved';  // Feedback status
  createdAt: Timestamp;     // When feedback was submitted
  updatedAt: Timestamp;     // Last update timestamp
  adminResponse?: string;   // Optional admin response
  adminID?: string;        // Optional ID of admin who responded
  responseAt?: Timestamp;   // Optional timestamp of admin response
}

interface ProjectInvitation {
  userID: string;          // ID of worker being invited
  projectID: string;       // Reference to projects collection
  status: 'Pending' | 'Accepted' | 'Declined';  // Invitation status
  invitationDate: Timestamp;
  responseDate?: Timestamp;  // When worker accepts/declines
  role: 'worker';           // Consistent with your projectAssignments
}