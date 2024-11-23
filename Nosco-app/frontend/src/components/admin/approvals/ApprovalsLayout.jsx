// src/components/admin/approvals/ApprovalsLayout.jsx
import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const ApprovalsLayout = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="border-b">
        <nav className="flex gap-6">
          <NavLink
            to="/admin/approvals/work-hours"
            className={({ isActive }) => `
              pb-4 px-2 text-sm font-medium
              ${isActive 
                ? 'border-b-2 border-nosco-red text-nosco-red' 
                : 'text-gray-500 hover:text-gray-700'
              }
            `}
          >
            Work Hours
          </NavLink>
          <NavLink
            to="/admin/approvals/expenses"
            className={({ isActive }) => `
              pb-4 px-2 text-sm font-medium
              ${isActive 
                ? 'border-b-2 border-nosco-red text-nosco-red' 
                : 'text-gray-500 hover:text-gray-700'
              }
            `}
          >
            Expenses
          </NavLink>
        </nav>
      </div>

      <Outlet />
    </div>
  );
};

export default ApprovalsLayout;