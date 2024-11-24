// ExpenseTypeTable.jsx
import React, { useState, useEffect } from 'react';
import { adminExpenseService } from '../../../../services/adminExpenseService';
import ExpenseTypeModal from './ExpenseTypeModal';

const ExpenseTypeTable = () => {
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState(null);

  useEffect(() => {
    loadExpenseTypes();
  }, []);

  const loadExpenseTypes = async () => {
    try {
      setIsLoading(true);
      const types = await adminExpenseService.getExpenseTypes();
      setExpenseTypes(types);
    } catch (error) {
      console.error('Error loading expense types:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (type) => {
    setSelectedType(type);
    setIsModalOpen(true);
  };

  const handleArchive = async (typeId, currentStatus) => {
    try {
      await adminExpenseService.updateExpenseTypeStatus(typeId, !currentStatus);
      loadExpenseTypes();
    } catch (error) {
      console.error('Error updating expense type status:', error);
    }
  };

  const handleModalClose = () => {
    setSelectedType(null);
    setIsModalOpen(false);
    loadExpenseTypes();
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Expense Types</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add New Expense Type
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Policy Limit</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {expenseTypes.map((type) => (
              <tr key={type.id}>
                <td className="px-6 py-4 whitespace-nowrap">{type.name}</td>
                <td className="px-6 py-4">{type.description}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {type.policyLimit.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{type.currency}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {type.isGeneralExpense ? 'Company' : 'Worker'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded text-sm ${type.isArchived ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    {type.isArchived ? 'Archived' : 'Active'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleEdit(type)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleArchive(type.id, type.isArchived)}
                    className={`${type.isArchived ? 'text-green-600 hover:text-green-900' : 'text-red-600 hover:text-red-900'}`}
                  >
                    {type.isArchived ? 'Unarchive' : 'Archive'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <ExpenseTypeModal
          expenseType={selectedType}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

export default ExpenseTypeTable;