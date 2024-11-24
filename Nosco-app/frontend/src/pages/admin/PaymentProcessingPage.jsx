import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminWorkHoursService } from '../../services/adminWorkHoursService';
import Table from '../../components/common/Table';
import Tab from '../../components/common/Tab';
import Card from '../../components/common/Card';
import { Clock, DollarSign, Building } from 'lucide-react';
import PaymentHistorySection from '../../components/admin/payments/PaymentHistorySection';

const PaymentProcessingPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('unpaid');
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (activeTab === 'unpaid') {
      const loadWorkers = async () => {
        try {
          setLoading(true);
          setError(null);
          const data = await adminWorkHoursService.getUnpaidApprovedHours();
          console.log('Fetched workers:', data);
          setWorkers(data);
        } catch (error) {
          console.error('Error loading workers:', error);
          setError('Failed to load unpaid hours');
        } finally {
          setLoading(false);
        }
      };

      loadWorkers();
    }
  }, [activeTab]);

  const columns = [
    {
      header: "Worker",
      accessorKey: "name",
      cell: ({ row }) => (
        <div className="flex items-center">
          <img 
            src={row.original.profilePic || '/api/placeholder/40/40'} 
            alt={row.original.name}
            className="h-10 w-10 rounded-full"
          />
          <div className="ml-4">
            <div className="font-medium">{row.original.name}</div>
            <div className="text-sm text-gray-500">{row.original.position}</div>
          </div>
        </div>
      )
    },
    {
      header: "Hours",
      accessorKey: "unpaidHours",
      cell: ({ row }) => {
        const totalHours = Object.values(row.original.unpaidHours).reduce(
          (acc, proj) => acc + proj.regularHours + proj.overtime15x + proj.overtime20x,
          0
        );
        return (
          <div className="flex items-center">
            <Clock className="h-4 w-4 text-gray-500 mr-2" />
            <span>{totalHours.toFixed(1)} hours</span>
          </div>
        );
      }
    },
    {
      header: "Amount Due",
      accessorKey: "unpaidHours",
      cell: ({ row }) => {
        const totalAmount = Object.values(row.original.unpaidHours).reduce(
          (acc, proj) => 
            acc + 
            (proj.regularHours * row.original.rates.regular) +
            (proj.overtime15x * row.original.rates.ot1_5) +
            (proj.overtime20x * row.original.rates.ot2_0),
          0
        );
        return (
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 text-gray-500 mr-2" />
            <span>${totalAmount.toLocaleString()}</span>
          </div>
        );
      }
    },
    {
      header: "Projects",
      accessorKey: "projects",
      cell: ({ row }) => (
        <div className="flex items-center">
          <Building className="h-4 w-4 text-gray-500 mr-2" />
          <span>{row.original.projects.length} projects</span>
        </div>
      )
    }
  ];

  return (
    <div className="p-6">
      <Card>
        <div className="border-b border-gray-200">
          <div className="p-4">
            <div className="mb-4">
              <h1 className="text-2xl font-semibold text-gray-900">Payment Processing</h1>
            </div>
            <div className="flex">
              <Tab
                isActive={activeTab === 'unpaid'}
                onClick={() => setActiveTab('unpaid')}
              >
                Unpaid Hours
              </Tab>
              <Tab
                isActive={activeTab === 'paid'}
                onClick={() => setActiveTab('paid')}
              >
                Payment History
              </Tab>
            </div>
          </div>
        </div>

        <div className="p-4">
          {activeTab === 'unpaid' ? (
            <>
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">{error}</div>
              ) : (
                <Table
                  data={workers}
                  columns={columns}
                  emptyMessage="No unpaid hours found"
                  onRowClick={(worker) => navigate(`/admin/payments/worker/${worker.id}`)}
                />
              )}
            </>
          ) : (
            <PaymentHistorySection />
          )}
        </div>
      </Card>
    </div>
  );
};

export default PaymentProcessingPage;