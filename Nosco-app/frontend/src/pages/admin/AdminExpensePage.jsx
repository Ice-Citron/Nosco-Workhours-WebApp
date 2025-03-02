import React, { useState } from 'react';
import Tab from '../../components/common/Tab';
import ExpenseApprovalSection from '../../components/admin/expenses/ExpenseApprovalSection/ExpenseApprovalSection';
import ExpenseTypeSection from '../../components/admin/expenses/ExpenseTypeSection/ExpenseTypeSection';
import GeneralExpenseSection from '../../components/admin/expenses/GeneralExpenseSection/GeneralExpenseSection';

const AdminExpensePage = () => {
  const [activeTab, setActiveTab] = useState('approvals');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'approvals':
        return <ExpenseApprovalSection />;
      case 'types':
        return <ExpenseTypeSection />;
      case 'general':
        return <GeneralExpenseSection />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200">
        <nav className="flex gap-4" aria-label="Tabs">
          <Tab
            isActive={activeTab === 'approvals'}
            onClick={() => setActiveTab('approvals')}
          >
            Expense Approvals
          </Tab>
          <Tab
            isActive={activeTab === 'types'}
            onClick={() => setActiveTab('types')}
          >
            Expense Types
          </Tab>
          <Tab
            isActive={activeTab === 'general'}
            onClick={() => setActiveTab('general')}
          >
            General Expenses
          </Tab>
        </nav>
      </div>

      {renderTabContent()}
    </div>
  );
};

export default AdminExpensePage;