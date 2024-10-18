import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SummaryCard from './SummaryCard';
import NotificationList from '../common/NotificationList';

const WorkerDashboard = () => {
  const navigate = useNavigate();
  const workerName = "John Doe"; // Placeholder name, replace with actual data later
  const currentProject = {
    name: "Project Alpha",
    summary: "A brief description of Project Alpha goes here.",
    status: "Active" // or "Ended"
  };

  const summaryData = [
    { title: "Total Hours Worked This Month", value: "160", unit: "hours" },
    { title: "Pending Approvals", value: "2", unit: "" },
    { title: "Total Reward Points", value: "500", unit: "points" },
    { title: "Latest Payment", value: "$2,500", unit: "USD" },
  ];

  const notifications = [
    { id: 1, message: "Your work hours for last week have been approved." },
    { id: 2, message: "New expense claim policy update. Please review." },
    { id: 3, message: "Reminder: Submit your expense claims by Friday." },
  ];

  const navLinks = [
    { title: "Home", path: "/worker/dashboard" },
    { title: "Profile", path: "/worker/profile" },
    { title: "Work Hours", path: "/worker/work-hours" },
    { title: "Expenses", path: "/worker/expenses" },
    { title: "Payments", path: "/worker/payments" },
    { title: "Notifications", path: "/worker/notifications" },
    { title: "Rewards", path: "/worker/rewards" },
    { title: "Feedback", path: "/worker/feedback" },
    { title: "Project Invitations", path: "/worker/project-invitations" },
  ];

  return (
    <>
      {/* Navigation Menu */}
      <nav className="flex justify-center flex-wrap gap-2 mb-8">
        {navLinks.map((link, index) => (
          <Link
            key={index}
            to={link.path}
            className="px-4 py-2 bg-white text-nosco-red border border-nosco-red rounded-full hover:bg-nosco-red hover:text-white transition duration-300 no-underline"
          >
            {link.title}
          </Link>
        ))}
      </nav>

      {/* Welcome Banner */}
      <h1 className="text-3xl font-bold text-nosco-red mb-8">Welcome, {workerName}</h1>
      
      {/* Current Project Section */}
      <section className="mb-8 p-4 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-2">Current Project</h2>
        <h3 className="text-xl font-medium">{currentProject.name}</h3>
        <p className="mb-2">{currentProject.summary}</p>
        <p className={`font-semibold ${currentProject.status === 'Active' ? 'text-green-600' : 'text-red-600'}`}>
          Status: {currentProject.status}
        </p>
      </section>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {summaryData.map((data, index) => (
          <SummaryCard key={index} {...data} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
        <div className="flex space-x-4">
          {currentProject.status === 'Active' && (
            <button
              onClick={() => navigate('/worker/log-work-hours')}
              className="bg-nosco-red text-white py-2 px-4 rounded hover:bg-nosco-red-dark transition duration-300"
            >
              Log Work Hours
            </button>
          )}
          <button
            onClick={() => navigate('/worker/submit-expense')}
            className="bg-nosco-red text-white py-2 px-4 rounded hover:bg-nosco-red-dark transition duration-300"
          >
            Submit Expense Claim
          </button>
        </div>
      </div>

      {/* Recent Notifications */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Recent Notifications</h2>
        <NotificationList notifications={notifications} />
      </div>
    </>
  );
};

export default WorkerDashboard;