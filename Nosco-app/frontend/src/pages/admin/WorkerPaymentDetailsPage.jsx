// src/pages/admin/WorkerPaymentDetailsPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { adminWorkHoursService } from '../../services/adminWorkHoursService';
import { adminExpenseService } from '../../services/adminExpenseService';
import { adminPaymentService } from '../../services/adminPaymentService';
import { useAuth } from '../../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../firebase/firebase_config';

import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import { ArrowLeft } from 'lucide-react';

import AddBonusModal from '../../components/admin/payments/AddBonusModal'; 

/**
 * Helper to calculate the cost of a single hour entry
 * using worker's baseRate and applying 1.5x or 2.0x for overtime.
 */
function calculateHourCost(entry, compensation) {
  const baseRate = compensation?.baseRate || 0;
  const regularCost = (entry.regularHours || 0) * baseRate;
  const ot15Cost = (entry.overtime15x || 0) * (baseRate * 1.5);
  const ot20Cost = (entry.overtime20x || 0) * (baseRate * 2.0);
  return regularCost + ot15Cost + ot20Cost;
}

const WorkerPaymentDetailsPage = () => {
  const { workerId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [workerData, setWorkerData] = useState(null);
  const [projectMap, setProjectMap] = useState({});
  // projectMap: { [projectId]: { name: string, hours: [...], expenses: [...] } }
  const [loading, setLoading] = useState(true);
  const [bonusModalOpen, setBonusModalOpen] = useState(false);

  // For selected items
  const [selectedHours, setSelectedHours] = useState({});
  const [selectedExpenses, setSelectedExpenses] = useState({});

  // NEW: State for project names mapping: { projectId: projectName }
  const [projectNames, setProjectNames] = useState({});

  const handleAddBonus = () => {
    setBonusModalOpen(true);
  };

  // Load project names from the projects collection
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const projects = await adminExpenseService.getProjects();
        const mapping = {};
        projects.forEach((proj) => {
          mapping[proj.id] = proj.name;
        });
        setProjectNames(mapping);
      } catch (error) {
        console.error('Error loading projects:', error);
      }
    };
    loadProjects();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // 1) Fetch worker doc
        const workerRef = doc(firestore, 'users', workerId);
        const workerSnap = await getDoc(workerRef);
        if (!workerSnap.exists()) {
          throw new Error('Worker not found');
        }
        const workerDetails = workerSnap.data();
        setWorkerData(workerDetails);

        // 2) Fetch all UNPAID work hours for this worker
        const hoursResult = await adminWorkHoursService.getWorkerUnpaidHours(workerId);

        // 3) Fetch all UNPAID expenses for this worker
        const expensesResult = await adminExpenseService.getWorkerUnpaidExpenses(workerId);

        // 4) Merge work hours and expenses into a single projectMap
        const map = {};

        // a) Incorporate work hours
        Object.keys(hoursResult).forEach((pid) => {
          map[pid] = {
            // Default name is the project ID; later we update using projectNames
            name: projectNames[pid] || pid,
            hours: hoursResult[pid].entries || [],
            expenses: []
          };
        });

        // b) Incorporate expenses and update project name if available
        expensesResult.forEach((exp) => {
          const pid = exp.projectID || '__GENERAL__'; // Fallback if no projectID
          // Determine the display name:
          // If no projectID then it's "General Expenses"
          // Otherwise, if expense object includes a project with a name, use it;
          // else try the projectNames mapping; if not found, fallback to the id.
          let displayName = pid === '__GENERAL__'
            ? 'General Expenses'
            : (exp.project && exp.project.name)
            ? exp.project.name
            : (projectNames[pid] || pid);
          
          if (!map[pid]) {
            map[pid] = {
              name: displayName,
              hours: [],
              expenses: [exp]
            };
          } else {
            // If the stored name is still the raw id, update it.
            if (!map[pid].name || map[pid].name === pid) {
              map[pid].name = displayName;
            }
            map[pid].expenses.push(exp);
          }
        });

        setProjectMap(map);
      } catch (error) {
        console.error('Error loading worker data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [workerId, projectNames]); // re-run when projectNames update

  // Utility: format date
  const formatDate = (val) => {
    if (!val) return 'N/A';
    try {
      return format(val, 'MMM dd, yyyy');
    } catch (err) {
      return 'Invalid date';
    }
  };

  // Sum of selected hour items
  const calculateSelectedHoursTotal = () => {
    if (!workerData) return 0;
    const compensation = workerData.compensation || { baseRate: 0 };
    let total = 0;
    Object.values(selectedHours).forEach((arr) => {
      arr.forEach((entry) => {
        if (entry.selected) {
          total += calculateHourCost(entry, compensation);
        }
      });
    });
    return total;
  };

  // Sum of selected expense items
  const calculateSelectedExpensesTotal = () => {
    let total = 0;
    Object.values(selectedExpenses).forEach((arr) => {
      arr.forEach((item) => {
        if (item.selected) {
          total += item.amount || 0;
        }
      });
    });
    return total;
  };

  // Combined total
  const calculateTotalAmount = () => {
    return calculateSelectedHoursTotal() + calculateSelectedExpensesTotal();
  };

  // Processing payment
  const handleProcessPayment = async () => {
    const totalAmt = calculateTotalAmount();
    if (totalAmt <= 0) return;

    // Gather selected hour IDs
    const selectedHourIds = [];
    Object.values(selectedHours).forEach((arr) => {
      arr.forEach((entry) => {
        if (entry.selected) {
          selectedHourIds.push(entry.id);
        }
      });
    });

    // Gather selected expense IDs
    const selectedExpenseIds = [];
    Object.values(selectedExpenses).forEach((arr) => {
      arr.forEach((exp) => {
        if (exp.selected) {
          selectedExpenseIds.push(exp.id);
        }
      });
    });

    if (selectedHourIds.length === 0 && selectedExpenseIds.length === 0) return;

    const reference = `PAY-${Date.now()}`;

    try {
      if (selectedHourIds.length > 0) {
        await adminWorkHoursService.markHoursAsPaid(selectedHourIds, {
          reference,
          amount: totalAmt,
          processedBy: user.uid,
          processedAt: new Date()
        });
      }
      if (selectedExpenseIds.length > 0) {
        await adminExpenseService.markExpensesAsPaid(selectedExpenseIds, {
          reference,
          amount: totalAmt,
          processedBy: user.uid,
          processedAt: new Date()
        });
      }

      let paymentType;
      if (selectedExpenseIds.length > 0 && selectedHourIds.length > 0) {
        paymentType = "combined";
      } else if (selectedExpenseIds.length > 0) {
        paymentType = "expenseReimbursement";
      } else if (selectedHourIds.length > 0) {
        paymentType = "salary";
      }

      const paymentData = {
        description: "Payment for selected work hours and/or expenses",
        paymentType,
        userID: workerId,
        amount: totalAmt,
        currency: workerData.currency || "USD",
        projectID: "",
        date: new Date().toISOString(),
        referenceNumber: reference,
        status: "processing",
        createdBy: user.uid,
        comments: {
          text: "Payment created from worker payment details page",
          userID: user.uid,
          createdAt: new Date()
        }
      };

      if (selectedExpenseIds.length > 0) {
        paymentData.relatedExpenseIDs = selectedExpenseIds;
      }
      if (selectedHourIds.length > 0) {
        paymentData.relatedWorkHoursIDs = selectedHourIds;
      }

      await adminPaymentService.createPayment(paymentData);
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

  return (
    <div className="p-6">
      <button
        onClick={() => navigate('/admin/payments')}
        className="mb-4 flex items-center text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Payments
      </button>

      {/* Worker Card */}
      <Card className="mb-4">
        <div className="p-6 flex items-center justify-between">
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
      </Card>

      {Object.keys(projectMap).length === 0 && (
        <Card className="mb-4">
          <div className="p-6">
            <p className="text-gray-500">No unpaid items found for this worker.</p>
          </div>
        </Card>
      )}

      {Object.entries(projectMap).map(([projectId, data]) => {
        const { hours, expenses } = data;
        return (
          <Card key={projectId} className="mb-6">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Project: {data.name}
              </h3>

              {/* HOURS TABLE */}
              {hours.length > 0 && (
                <>
                  <h4 className="text-md font-medium mb-2">Work Hours</h4>
                  <Table
                    data={hours}
                    columns={[
                      {
                        header: "Date",
                        accessorKey: "date",
                        cell: ({ getValue }) => formatDate(getValue())
                      },
                      {
                        header: "Regular",
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
                        header: "Cost",
                        id: "cost",
                        cell: ({ row }) => {
                          const entry = row.original;
                          const cost = calculateHourCost(entry, workerData.compensation);
                          return `$${cost.toFixed(2)}`;
                        }
                      },
                      {
                        header: "Select",
                        id: "selectHour",
                        cell: ({ row }) => {
                          const entry = row.original;
                          const isChecked = selectedHours[projectId]?.some(i => i.id === entry.id && i.selected);
                          return (
                            <input
                              type="checkbox"
                              checked={!!isChecked}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setSelectedHours((prev) => {
                                  const oldArr = prev[projectId] || [];
                                  const filtered = oldArr.filter(i => i.id !== entry.id);
                                  if (checked) {
                                    filtered.push({ ...entry, selected: true });
                                  }
                                  return {
                                    ...prev,
                                    [projectId]: filtered
                                  };
                                });
                              }}
                            />
                          );
                        }
                      }
                    ]}
                  />
                  <div className="my-4" />
                </>
              )}

              {/* EXPENSES TABLE */}
              {expenses.length > 0 && (
                <>
                  <h4 className="text-md font-medium mb-2">Expenses</h4>
                  <Table
                    data={expenses}
                    columns={[
                      {
                        header: "Date",
                        accessorKey: "date",
                        cell: ({ getValue }) => formatDate(getValue())
                      },
                      {
                        header: "Type",
                        accessorKey: "expenseType",
                        cell: ({ row }) => row.original.expenseType || 'N/A'
                      },
                      {
                        header: "Amount",
                        accessorKey: "amount",
                        cell: ({ row }) => {
                          const amt = row.original.amount || 0;
                          const cur = row.original.currency || 'USD';
                          return `${amt.toFixed(2)} ${cur}`;
                        }
                      },
                      {
                        header: "Select",
                        id: "selectExpense",
                        cell: ({ row }) => {
                          const exp = row.original;
                          const isChecked = selectedExpenses[projectId]?.some(i => i.id === exp.id && i.selected);
                          return (
                            <input
                              type="checkbox"
                              checked={!!isChecked}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setSelectedExpenses((prev) => {
                                  const oldArr = prev[projectId] || [];
                                  const filtered = oldArr.filter(i => i.id !== exp.id);
                                  if (checked) {
                                    filtered.push({ ...exp, selected: true });
                                  }
                                  return {
                                    ...prev,
                                    [projectId]: filtered
                                  };
                                });
                              }}
                            />
                          );
                        }
                      }
                    ]}
                  />
                </>
              )}

              {hours.length === 0 && expenses.length === 0 && (
                <p className="text-gray-500">No unpaid items for this project.</p>
              )}
            </div>
          </Card>
        );
      })}

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" onClick={handleAddBonus}>
          Add Bonus
        </Button>
        <Button onClick={handleProcessPayment} disabled={calculateTotalAmount() <= 0}>
          Process Payment (${calculateTotalAmount().toLocaleString()})
        </Button>
      </div>

      <AddBonusModal
        isOpen={bonusModalOpen}
        onClose={() => setBonusModalOpen(false)}
        worker={{
          id: workerId,
          name: workerData?.name || 'Unknown',
        }}
        adminUser={user}
      />
    </div>
  );
};

export default WorkerPaymentDetailsPage;
