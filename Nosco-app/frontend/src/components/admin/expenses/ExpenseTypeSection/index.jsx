import React, { useState, useEffect } from 'react';
import Card from '../../../common/Card';
import { adminExpenseService } from '../../../../services/adminExpenseService';
import ExpenseTypeModal from './ExpenseTypeModal';

const ExpenseTypeSection = () => {
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const activeTypes = expenseTypes.filter(type => !type.isArchived);
  const archivedTypes = expenseTypes.filter(type => type.isArchived);

  const renderTypeTable = (types, isArchived = false) => (
    <table className="min-w-full bg-white border">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Policy Limit</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Currency</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {types.map((type) => (
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
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(type)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleArchive(type.id, type.isArchived)}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    isArchived 
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {isArchived ? 'Unarchive' : 'Archive'}
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  if (isLoading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Expense Types</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage expense categories and policies
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedType(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-[#8B0000] text-white rounded-lg text-sm hover:bg-[#A52A2A] transition-colors"
        >
          Add New Type
        </button>
      </div>

      <div className="space-y-8">
        {/* Active Types */}
        <Card>
          <div className="p-4">
            <h3 className="text-lg font-medium mb-4">Active Types</h3>
            <div className="overflow-x-auto">
              {renderTypeTable(activeTypes)}
            </div>
          </div>
        </Card>

        {/* Archived Types */}
        {archivedTypes.length > 0 && (
          <Card>
            <div className="p-4">
              <h3 className="text-lg font-medium mb-4">Archived Types</h3>
              <div className="overflow-x-auto">
                {renderTypeTable(archivedTypes, true)}
              </div>
            </div>
          </Card>
        )}
      </div>

      {isModalOpen && (
        <ExpenseTypeModal
          expenseType={selectedType}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedType(null);
            loadExpenseTypes();
          }}
          isOpen={isModalOpen}
        />
      )}
    </div>
  );
};

export default ExpenseTypeSection;