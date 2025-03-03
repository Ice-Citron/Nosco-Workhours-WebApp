// components/admin/notifications/PendingSummaryCards.jsx
import React from 'react';

const PendingSummaryCards = ({ pendingItems }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900">Work Hours</h3>
          <p className="mt-2 text-3xl font-bold text-nosco-red">{pendingItems.workHours}</p>
          <p className="text-sm text-gray-500">Pending approvals</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900">Expenses</h3>
          <p className="mt-2 text-3xl font-bold text-nosco-red">{pendingItems.expenses}</p>
          <p className="text-sm text-gray-500">Pending approvals</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900">Amount Due</h3>
          <p className="mt-2 text-3xl font-bold text-nosco-red">${pendingItems.amountDue.toFixed(2)}</p>
          <p className="text-sm text-gray-500">Approved, not paid</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900">Payment Processing</h3>
          <p className="mt-2 text-3xl font-bold text-nosco-red">${pendingItems.paymentAmount.toFixed(2)}</p>
          <p className="text-sm text-gray-500">{pendingItems.payments} payments</p>
        </div>
      </div>
  );
};

export default PendingSummaryCards;
