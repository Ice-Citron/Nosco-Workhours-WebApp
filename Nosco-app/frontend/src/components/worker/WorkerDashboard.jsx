import React from 'react';
import { useNavigate } from 'react-router-dom';
import SummaryCard from './SummaryCard';
import NotificationList from '../common/NotificationList';

const WorkerDashboard = () => {
  const navigate = useNavigate();
  const employeeName = "John Doe"; // Placeholder name

  const summaryData = [
    { title: "Regular Hours", value: "32", unit: "hours" },
    { title: "Overtime Hours", value: "8", unit: "hours" },
    { title: "Pending Claims", value: "2", unit: "claims" },
    { title: "Reward Points", value: "150", unit: "points" },
  ];

  const notifications = [
    { id: 1, message: "Your work hours for last week have been approved." },
    { id: 2, message: "New expense claim policy update. Please review." },
    { id: 3, message: "Reminder: Submit your expense claims by Friday." },
  ];

  const quickActions = [
    { title: "Log Work Hours", path: "/worker/log-work-hours" },
    { title: "Submit Expense Claim", path: "/worker/submit-expense-claim" },
    { title: "View Work Hours History", path: "/worker/work-hours-history" },
    { title: "View Expense Claims History", path: "/worker/expense-claims-history" },
    { title: "View Rewards", path: "/worker/rewards" },
    { title: "Submit Feedback", path: "/worker/feedback" },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-nosco-red mb-8">Welcome, {employeeName}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {summaryData.map((data, index) => (
          <SummaryCard key={index} {...data} />
        ))}
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => navigate(action.path)}
              className="bg-nosco-red text-white py-2 px-4 rounded hover:bg-nosco-red-dark transition duration-300"
            >
              {action.title}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Recent Notifications</h2>
        <NotificationList notifications={notifications} />
      </div>
    </div>
  );
};

export default WorkerDashboard;