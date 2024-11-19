// Example Admin Document Structure
{
  "admin789": {
    "email": "admin@company.com",
    "name": "Admin User",
    "profilePic": "https://firebasestorage.../admin-pic.jpg",
    "role": "admin",
    "department": "Operations", // Additional fields for admins
    "permissions": ["approve_expenses", "manage_payments", "manage_users"],
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