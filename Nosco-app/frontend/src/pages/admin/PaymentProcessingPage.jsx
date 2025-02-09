// src/pages/admin/PaymentProcessingPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminPaymentService } from '../../services/adminPaymentService';
import Table from '../../components/common/Table';
import Tab from '../../components/common/Tab';
import Card from '../../components/common/Card';
import { Clock, DollarSign, Building } from 'lucide-react';
import PaymentHistorySection from '../../components/admin/payments/PaymentHistorySection';
import ProcessingPaymentsSection from '../../components/admin/payments/ProcessingPaymentsSection';

const PaymentProcessingPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('toBePaid');
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Table columns for the "Payment" (toBePaid) tab
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
      header: "Unpaid Hours",
      accessorKey: "unpaidHoursCount",
      cell: ({ getValue }) => {
        const count = getValue() || 0;
        return (
          <div className="flex items-center">
            <Clock className="h-4 w-4 text-gray-500 mr-2" />
            <span>{count} hrs</span>
          </div>
        );
      }
    },
    {
      header: "Amount Due",
      accessorKey: "unpaidAmount",
      cell: ({ getValue }) => {
        const amt = getValue() || 0;
        return (
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 text-gray-500 mr-2" />
            <span>${amt.toFixed(2)}</span>
          </div>
        );
      }
    },
    {
      header: "Projects",
      accessorKey: "projects",
      cell: ({ row }) => {
        const projectCount = row.original.projects ? row.original.projects.length : 0;
        return (
          <div className="flex items-center">
            <Building className="h-4 w-4 text-gray-500 mr-2" />
            <span>{projectCount} projects</span>
          </div>
        );
      }
    }
  ];

  // When the Payment tab is active, load the workers data with aggregated unpaid amounts
  useEffect(() => {
    if (activeTab === 'toBePaid') {
      (async () => {
        setLoading(true);
        setError(null);
        try {
          // Call the updated method that aggregates both work hours and expense reimbursements
          const data = await adminPaymentService.getAllWorkersUnpaidData();
          setWorkers(data);
        } catch (err) {
          console.error('Error loading worker data:', err);
          setError('Failed to load workers');
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [activeTab]);

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
                isActive={activeTab === 'toBePaid'}
                onClick={() => setActiveTab('toBePaid')}
              >
                Payment
              </Tab>
              <Tab
                isActive={activeTab === 'processing'}
                onClick={() => setActiveTab('processing')}
              >
                Processing
              </Tab>
              <Tab
                isActive={activeTab === 'history'}
                onClick={() => setActiveTab('history')}
              >
                Payment History
              </Tab>
            </div>
          </div>
        </div>

        <div className="p-4">
          {activeTab === 'toBePaid' && (
            <>
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">{error}</div>
              ) : (
                <Table
                  data={workers}
                  columns={columns}
                  emptyMessage="No workers found"
                  onRowClick={(worker) => {
                    // Navigate to the worker's detailed payment page
                    navigate(`/admin/payments/worker/${worker.id}`);
                  }}
                />
              )}
            </>
          )}

          {activeTab === 'processing' && <ProcessingPaymentsSection />}
          {activeTab === 'history' && <PaymentHistorySection />}
        </div>
      </Card>
    </div>
  );
};

export default PaymentProcessingPage;
