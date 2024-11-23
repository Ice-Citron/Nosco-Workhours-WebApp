// src/components/admin/approvals/ApprovalsLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';

const ApprovalsLayout = () => {
  return (
    <div className="p-6">
      <Outlet />
    </div>
  );
};

export default ApprovalsLayout;