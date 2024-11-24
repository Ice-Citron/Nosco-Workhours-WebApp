import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns'; // Added this import
import { adminWorkHoursService } from '../../services/adminWorkHoursService';
import { useAuth } from '../../context/AuthContext'; // Added this import
import { doc, getDoc } from 'firebase/firestore'; // Added these imports
import { firestore } from '../../firebase/firebase_config';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import { ArrowLeft, Clock, DollarSign } from 'lucide-react';


const WorkerPaymentDetailsPage = () => {
    const { workerId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth(); // Added this hook
    const [workerData, setWorkerData] = useState(null);
    const [unpaidHours, setUnpaidHours] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedEntries, setSelectedEntries] = useState({});
  
    useEffect(() => {
      const loadWorkerDetails = async () => {
        try {
          setLoading(true);
          // Get worker details
          const workerRef = doc(firestore, 'users', workerId);
          const workerSnap = await getDoc(workerRef);
          
          if (!workerSnap.exists()) {
            throw new Error('Worker not found');
          }
          
          const workerDetails = workerSnap.data();
          setWorkerData(workerDetails);
  
          // Get unpaid hours
          const hours = await adminWorkHoursService.getWorkerUnpaidHours(workerId);
          setUnpaidHours(hours);
        } catch (error) {
          console.error('Error loading worker details:', error);
        } finally {
          setLoading(false);
        }
      };
  
      loadWorkerDetails();
    }, [workerId]);
  
    const calculateTotalAmount = () => {
      let total = 0;
      Object.entries(selectedEntries).forEach(([projectId, entries]) => {
        entries.forEach(entry => {
          if (entry.selected) {
            const rates = workerData?.rates || {};
            total += (entry.regularHours || 0) * (rates.regular || 0);
            total += (entry.overtime15x || 0) * (rates.ot1_5 || 0);
            total += (entry.overtime20x || 0) * (rates.ot2_0 || 0);
          }
        });
      });
      return total;
    };
  
    const handleProcessPayment = async () => {
      // Get all selected entry IDs
      const selectedIds = Object.values(selectedEntries)
        .flatMap(entries => 
          entries
            .filter(entry => entry.selected)
            .map(entry => entry.id)
        );
  
      if (selectedIds.length === 0) return;
  
      try {
        const reference = `PAY-${Date.now()}`;
        await adminWorkHoursService.markHoursAsPaid(selectedIds, {
          reference,
          amount: calculateTotalAmount(),
          processedBy: user.uid,
          processedAt: new Date()
        });
  
        // Redirect back to payment processing page
        navigate('/admin/payments');
      } catch (error) {
        console.error('Error processing payment:', error);
      }
    };
  
    if (loading) {
      return (
        <div className="p-6">
          <Card>Loading...</Card>
        </div>
      );
    }
  
    if (!workerData) {
      return (
        <div className="p-6">
          <Card>Worker not found</Card>
        </div>
      );
    }
  
    const formatDate = (date) => {
      try {
        const dateObj = date?.toDate?.() ? date.toDate() : new Date(date);
        return format(dateObj, 'MMM dd, yyyy');
      } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid date';
      }
    };
  
    return (
      <div className="p-6">
        <button 
          onClick={() => navigate('/admin/payments')}
          className="mb-4 flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Payments
        </button>
  
        <Card className="mb-4">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <img 
                  src={workerData.profilePic || '/api/placeholder/64/64'} 
                  alt={workerData.name}
                  className="h-16 w-16 rounded-full"
                />
                <div className="ml-4">
                  <h2 className="text-2xl font-semibold">{workerData.name}</h2>
                  <p className="text-gray-500">{workerData.position}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Total Selected Amount</div>
                <div className="text-2xl font-bold">
                  ${calculateTotalAmount().toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </Card>
  
        {Object.entries(unpaidHours).map(([projectId, projectHours]) => (
          <Card key={projectId} className="mb-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Project: {projectId}</h3>
              <Table
                data={projectHours.entries}
                columns={[
                  {
                    header: "Date",
                    accessorKey: "date",
                    cell: ({ getValue }) => formatDate(getValue())
                  },
                  {
                    header: "Regular Hours",
                    accessorKey: "regularHours",
                    cell: ({ getValue }) => getValue() || 0
                  },
                  {
                    header: "OT 1.5x",
                    accessorKey: "overtime15x",
                    cell: ({ getValue }) => getValue() || 0
                  },
                  {
                    header: "OT 2.0x",
                    accessorKey: "overtime20x",
                    cell: ({ getValue }) => getValue() || 0
                  },
                  {
                    header: "Select",
                    accessorKey: "id",
                    cell: ({ row }) => (
                      <input
                        type="checkbox"
                        checked={selectedEntries[projectId]?.find(e => e.id === row.original.id)?.selected || false}
                        onChange={(e) => {
                          setSelectedEntries(prev => ({
                            ...prev,
                            [projectId]: [
                              ...(prev[projectId] || []).filter(entry => entry.id !== row.original.id),
                              { id: row.original.id, selected: e.target.checked, ...row.original }
                            ]
                          }));
                        }}
                      />
                    )
                  }
                ]}
              />
            </div>
          </Card>
        ))}
  
        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleProcessPayment}
            disabled={calculateTotalAmount() === 0}
          >
            Process Payment (${calculateTotalAmount().toLocaleString()})
          </Button>
        </div>
      </div>
    );
  };
  
  export default WorkerPaymentDetailsPage;