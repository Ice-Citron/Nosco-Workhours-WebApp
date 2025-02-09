// src/pages/admin/WorkerDetailsPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Added useNavigate here
import { ArrowLeft } from 'lucide-react'; // Import the ArrowLeft icon
import { adminUserService } from '../../services/adminUserService';
import {
  getExchangeRatesSettings,
  convertBetweenCurrencies
} from '../../services/adminSettingsService';

import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';

import { adminPaymentService } from '../../services/adminPaymentService';
import { expenseService } from '../../services/expenseService';
import { adminExpenseService } from '../../services/adminExpenseService';

import WorkerPaymentHistoryTab from '../../components/admin/workers/WorkerPaymentHistoryTab';
import WorkerExpenseHistoryTab from '../../components/admin/workers/WorkerExpenseHistoryTab';

import { updateDoc, doc } from 'firebase/firestore';
import { firestore } from '../../firebase/firebase_config';


// Simple Tab component
function Tab({ tabs, activeTab, onChange }) {
  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`py-2 px-4 text-sm font-medium border-b-2
              ${activeTab === tab.id
                ? 'border-nosco-red text-nosco-red'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

export default function WorkerDetailsPage() {
  const { workerId } = useParams();
  const navigate = useNavigate(); // Initialize navigate

  // Worker data
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // “Modify” mode
  const [editMode, setEditMode] = useState(false);

  // Tabs: “overview”, “payments”, “expenses”
  const [activeTab, setActiveTab] = useState('overview');

  // Multi-currency fields for the overview’s compensation
  const [compCurrency, setCompCurrency] = useState('USD');
  const [baseRateDisplay, setBaseRateDisplay] = useState(0);
  const [perDiemDisplay, setPerDiemDisplay] = useState(0);
  const [availableCurrencies, setAvailableCurrencies] = useState(['USD']);

  // Payment & expense data
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  const [expenses, setExpenses] = useState([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);

  // Add this near the top of your component function (WorkerDetailsPage)
  const [currentProjects, setCurrentProjects] = useState([]);

  // 1) Fetch worker details
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await adminUserService.getWorkerDetails(workerId);
        setWorker(data);

        // If you have an exchangeRates doc
        const exSettings = await getExchangeRatesSettings();
        if (exSettings?.selectedCurrencies) {
          setAvailableCurrencies(exSettings.selectedCurrencies);
        }

        // Convert compensation to chosen currency
        const docCur = data?.compensation?.currency || 'USD';
        setCompCurrency(docCur);

        const br = Number(data?.compensation?.baseRate) || 0;
        const pd = Number(data?.compensation?.perDiem) || 0;

        if (docCur !== 'USD') {
          const brConverted = await convertBetweenCurrencies(br, 'USD', docCur);
          const pdConverted = await convertBetweenCurrencies(pd, 'USD', docCur);
          setBaseRateDisplay(brConverted);
          setPerDiemDisplay(pdConverted);
        } else {
          setBaseRateDisplay(br);
          setPerDiemDisplay(pd);
        }

        setError(null);
      } catch (err) {
        console.error('Error fetching worker details:', err);
        setError('Failed to load worker data');
      } finally {
        setLoading(false);
      }
    })();
  }, [workerId]);

  // 2) If user switches to “payments” or “expenses,” fetch data
  useEffect(() => {
    if (!worker?.id) return;

    if (activeTab === 'payments') {
      (async () => {
        try {
          setLoadingPayments(true);
          const result = await adminPaymentService.getPaymentsForWorker(worker.id);
          setPayments(result);
        } catch (err) {
          console.error('Error loading payments:', err);
          setError('Failed to load payments');
        } finally {
          setLoadingPayments(false);
        }
      })();
    } else if (activeTab === 'expenses') {
      (async () => {
        try {
          setLoadingExpenses(true);
          const result = await expenseService.getExpensesForWorker(worker.id);
          setExpenses(result);
        } catch (err) {
          console.error('Error loading expenses:', err);
          setError('Failed to load expenses');
        } finally {
          setLoadingExpenses(false);
        }
      })();
    }
  }, [activeTab, worker]);

  useEffect(() => {
    const loadCurrentProjects = async () => {
      try {
        // Fetch all projects (assumes getProjects returns an array of { id, data } objects)
        const projects = await adminExpenseService.getProjects();
        console.log('All projects:', projects);
        const now = new Date();
  
        // Loop through projects and update status to "ended" if the endDate is in the past
        await Promise.all(
          projects.map(async (proj, index) => {
            // Use proj.data if it exists; otherwise, use proj itself
            const data = proj.data || proj;
            if (data.endDate && data.endDate.seconds) {
              const endDate = new Date(data.endDate.seconds * 1000);
              // If end date is in the past and the status is not "ended", update it
              if (endDate < now && data.status !== 'ended') {
                console.log(`Updating project ${proj.id} status to ended.`);
                // Update the project document in Firestore
                await updateDoc(doc(firestore, 'projects', proj.id), { status: 'ended' });
                // Update our local data as well
                data.status = 'ended';
              }
            }
          })
        );
  
        // Now filter projects for current ones:
        const filtered = projects
          .filter((proj, index) => {
            const data = proj.data || proj;
            if (!data) {
              console.log(`Project at index ${index} has no data.`);
              return false;
            }
            if (!data.status) {
              console.log(`Project ${proj.id} is missing a status.`);
              return false;
            }
            // Only include projects with status "active" or "draft" (not "ended")
            if (!(data.status === 'active' || data.status === 'draft')) {
              console.log(`Project ${proj.id} status (${data.status}) is not active or draft.`);
              return false;
            }
            // Ensure the project has a workers object and that our workerId is in it
            if (!data.workers) {
              console.log(`Project ${proj.id} has no workers object.`);
              return false;
            }
            if (!Object.keys(data.workers).includes(workerId)) {
              console.log(`Project ${proj.id} does not include worker ${workerId}.`);
              return false;
            }
            return true;
          })
          .map((proj) => {
            const data = proj.data || proj;
            return {
              id: proj.id,
              name: data.name || 'Unknown',
              status: data.status || 'N/A',
              startDate: data.startDate || null,
              endDate: data.endDate || null,  // New: include the end date
              worker_status: data.workers?.[workerId]?.status || 'N/A'
            };
          });
  
        console.log('Filtered current projects:', filtered);
        setCurrentProjects(filtered);
      } catch (error) {
        console.error('Error loading current projects:', error);
      }
    };
  
    loadCurrentProjects();
  }, [workerId]);   
  

  // Toggle edit mode
  const handleEditToggle = () => setEditMode((prev) => !prev);

  // Archive/Re-Activate
  const handleArchiveToggle = async () => {
    if (!worker) return;
    try {
      setLoading(true);
      const newStatus = worker.status === 'active' ? 'archived' : 'active';
      await adminUserService.updateWorkerStatus(worker.id, newStatus);

      const updated = await adminUserService.getWorkerDetails(worker.id);
      setWorker(updated);
    } catch (err) {
      console.error('Error updating worker status:', err);
      setError('Failed to update worker status');
    } finally {
      setLoading(false);
    }
  };

  // Save (Overview changes)
  const handleSave = async () => {
    if (!worker) return;
    try {
      setLoading(true);

      const brUSD = await convertBetweenCurrencies(baseRateDisplay, compCurrency, 'USD');
      const pdUSD = await convertBetweenCurrencies(perDiemDisplay, compCurrency, 'USD');

      const updatedWorker = {
        ...worker,
        compensation: {
          ...worker.compensation,
          baseRate: brUSD,
          perDiem: pdUSD,
          currency: compCurrency,
        },
      };

      await adminUserService.updateWorkerDetails(worker.id, updatedWorker);
      setWorker(updatedWorker);
      setEditMode(false);
    } catch (err) {
      console.error('Error saving worker changes:', err);
      setError('Failed to save');
    } finally {
      setLoading(false);
    }
  };

  // Cancel changes
  const handleCancel = async () => {
    setEditMode(false);
    if (!worker) return;

    const docCur = worker.compensation?.currency || 'USD';
    const br = Number(worker.compensation?.baseRate) || 0;
    const pd = Number(worker.compensation?.perDiem) || 0;

    if (docCur !== 'USD') {
      const brConverted = await convertBetweenCurrencies(br, 'USD', docCur);
      const pdConverted = await convertBetweenCurrencies(pd, 'USD', docCur);
      setBaseRateDisplay(brConverted);
      setPerDiemDisplay(pdConverted);
      setCompCurrency(docCur);
    } else {
      setBaseRateDisplay(br);
      setPerDiemDisplay(pd);
      setCompCurrency('USD');
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!worker) return <div className="p-6">No worker data found.</div>;

  const { name = '', status, department = '', position = '', email = '', bankAccounts = [], emergencyContact = {} } = worker;
  const joinedDateStr = worker.joinedDate
    ? new Date(worker.joinedDate.seconds * 1000).toLocaleDateString()
    : '';

  // Our three tabs
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'payments', label: 'Payment History' },
    { id: 'expenses', label: 'Expense History' },
  ];

  return (
    <div className="p-6">
      {/* Back Arrow Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Go Back to Worker Management Table
      </button>

      {/* Page Title */}
      <h1 className="text-2xl font-semibold mb-4">
        Worker Details: {name}
      </h1>

      {/* Tabs */}
      <Tab tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 2x2 Grid for the 4 cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="bg-white p-4 rounded shadow space-y-4">
              <h2 className="text-xl font-semibold">Basic Info</h2>
              <div>
                <strong>Name:</strong>
                {editMode ? (
                  <input
                    className="ml-2 border rounded p-1"
                    value={name}
                    onChange={(e) => {
                      setWorker((prev) => ({ ...prev, name: e.target.value }));
                    }}
                  />
                ) : (
                  <span className="ml-2">{name}</span>
                )}
              </div>
              <div>
                <strong>Email:</strong>
                {editMode ? (
                  <input
                    className="ml-2 border rounded p-1"
                    value={email}
                    onChange={(e) => {
                      setWorker((prev) => ({ ...prev, email: e.target.value }));
                    }}
                  />
                ) : (
                  <span className="ml-2">{email}</span>
                )}
              </div>
              <div>
                <strong>Department:</strong>
                {editMode ? (
                  <input
                    className="ml-2 border rounded p-1"
                    value={department}
                    onChange={(e) => {
                      setWorker((prev) => ({ ...prev, department: e.target.value }));
                    }}
                  />
                ) : (
                  <span className="ml-2">{department}</span>
                )}
              </div>
              <div>
                <strong>Position:</strong>
                {editMode ? (
                  <input
                    className="ml-2 border rounded p-1"
                    value={position}
                    onChange={(e) => {
                      setWorker((prev) => ({ ...prev, position: e.target.value }));
                    }}
                  />
                ) : (
                  <span className="ml-2">{position}</span>
                )}
              </div>
              <div>
                <strong>Joined Date:</strong>{' '}
                <span className="ml-2">{joinedDateStr || 'N/A'}</span>
              </div>
              <div>
                <strong>Status:</strong>{' '}
                <span
                  className={`px-2 py-1 rounded ${
                    status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {status}
                </span>
              </div>
            </div>

            {/* Compensation */}
            <div className="bg-white p-4 rounded shadow space-y-4">
              <h2 className="text-xl font-semibold">Compensation</h2>
              <div>
                <strong>Base Rate:</strong>
                {editMode ? (
                  <input
                    className="ml-2 border rounded p-1"
                    type="number"
                    step="0.01"
                    value={baseRateDisplay}
                    onChange={(e) => setBaseRateDisplay(parseFloat(e.target.value) || 0)}
                  />
                ) : (
                  <span className="ml-2">
                    {Number(worker.compensation?.baseRate || 0).toFixed(2)} USD
                  </span>
                )}
              </div>
              <div>
                <strong>Per Diem:</strong>
                {editMode ? (
                  <input
                    className="ml-2 border rounded p-1"
                    type="number"
                    step="0.01"
                    value={perDiemDisplay}
                    onChange={(e) => setPerDiemDisplay(parseFloat(e.target.value) || 0)}
                  />
                ) : (
                  <span className="ml-2">
                    {Number(worker.compensation?.perDiem || 0).toFixed(2)} USD
                  </span>
                )}
              </div>
              <div>
                <strong>Compensation Currency:</strong>
                {editMode ? (
                  <select
                    className="ml-2 border rounded p-1"
                    value={compCurrency}
                    onChange={async (e) => {
                      const newCur = e.target.value;
                      const brConverted = await convertBetweenCurrencies(
                        baseRateDisplay,
                        compCurrency,
                        newCur
                      );
                      const pdConverted = await convertBetweenCurrencies(
                        perDiemDisplay,
                        compCurrency,
                        newCur
                      );
                      setBaseRateDisplay(brConverted);
                      setPerDiemDisplay(pdConverted);
                      setCompCurrency(newCur);
                    }}
                  >
                    {availableCurrencies.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="ml-2">{worker.compensation?.currency || 'USD'}</span>
                )}
              </div>
            </div>

            {/* Bank Accounts */}
            <div className="bg-white p-4 rounded shadow space-y-4">
              <h2 className="text-xl font-semibold">Bank Accounts</h2>
              {Array.isArray(bankAccounts) && bankAccounts.length > 0 ? (
                bankAccounts.map((acct, idx) => (
                  <div
                    key={acct.id || idx}
                    className="p-3 border border-gray-200 rounded mb-2"
                  >
                    <div>
                      <strong>Account ID:</strong> {acct.id}
                    </div>
                    <div>
                      <strong>Bank Name:</strong>{' '}
                      {editMode ? (
                        <input
                          className="ml-1 border rounded p-1"
                          value={acct.bankName || ''}
                          onChange={(e) => {
                            const newArr = [...bankAccounts];
                            newArr[idx] = {
                              ...newArr[idx],
                              bankName: e.target.value,
                            };
                            setWorker((prev) => ({
                              ...prev,
                              bankAccounts: newArr,
                            }));
                          }}
                        />
                      ) : (
                        <span>{acct.bankName}</span>
                      )}
                    </div>
                    <div>
                      <strong>Account Number:</strong>{' '}
                      {editMode ? (
                        <input
                          className="ml-1 border rounded p-1"
                          value={acct.accountNumber || ''}
                          onChange={(e) => {
                            const newArr = [...bankAccounts];
                            newArr[idx] = {
                              ...newArr[idx],
                              accountNumber: e.target.value,
                            };
                            setWorker((prev) => ({
                              ...prev,
                              bankAccounts: newArr,
                            }));
                          }}
                        />
                      ) : (
                        <span>{acct.accountNumber}</span>
                      )}
                    </div>
                    <div>
                      <strong>Currency:</strong>{' '}
                      {editMode ? (
                        <input
                          className="ml-1 border rounded p-1"
                          value={acct.currency || ''}
                          onChange={(e) => {
                            const newArr = [...bankAccounts];
                            newArr[idx] = {
                              ...newArr[idx],
                              currency: e.target.value,
                            };
                            setWorker((prev) => ({
                              ...prev,
                              bankAccounts: newArr,
                            }));
                          }}
                        />
                      ) : (
                        <span>{acct.currency}</span>
                      )}
                    </div>
                    <div>
                      <strong>Routing Number:</strong>{' '}
                      {editMode ? (
                        <input
                          className="ml-1 border rounded p-1"
                          value={acct.routingNumber || ''}
                          onChange={(e) => {
                            const newArr = [...bankAccounts];
                            newArr[idx] = {
                              ...newArr[idx],
                              routingNumber: e.target.value,
                            };
                            setWorker((prev) => ({
                              ...prev,
                              bankAccounts: newArr,
                            }));
                          }}
                        />
                      ) : (
                        <span>{acct.routingNumber}</span>
                      )}
                    </div>
                    <div>
                      <strong>SWIFT/BIC:</strong>{' '}
                      {editMode ? (
                        <input
                          className="ml-1 border rounded p-1"
                          value={acct.swiftBic || ''}
                          onChange={(e) => {
                            const newArr = [...bankAccounts];
                            newArr[idx] = {
                              ...newArr[idx],
                              swiftBic: e.target.value,
                            };
                            setWorker((prev) => ({
                              ...prev,
                              bankAccounts: newArr,
                            }));
                          }}
                        />
                      ) : (
                        <span>{acct.swiftBic}</span>
                      )}
                    </div>
                    <div>
                      <strong>Is Default?</strong>{' '}
                      {editMode ? (
                        <input
                          type="checkbox"
                          checked={!!acct.isDefault}
                          onChange={(e) => {
                            const newArr = [...bankAccounts];
                            newArr[idx] = {
                              ...newArr[idx],
                              isDefault: e.target.checked,
                            };
                            setWorker((prev) => ({
                              ...prev,
                              bankAccounts: newArr,
                            }));
                          }}
                        />
                      ) : (
                        <span>{acct.isDefault ? 'Yes' : 'No'}</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div>No bank accounts found.</div>
              )}
            </div>

            {/* Emergency Contact */}
            <div className="bg-white p-4 rounded shadow space-y-4">
              <h2 className="text-xl font-semibold">Emergency Contact</h2>
              <div>
                <strong>Name:</strong>
                {editMode ? (
                  <input
                    className="ml-2 border rounded p-1"
                    value={emergencyContact.name || ''}
                    onChange={(e) => {
                      setWorker((prev) => ({
                        ...prev,
                        emergencyContact: {
                          ...prev.emergencyContact,
                          name: e.target.value,
                        },
                      }));
                    }}
                  />
                ) : (
                  <span className="ml-2">{emergencyContact.name || ''}</span>
                )}
              </div>
              <div>
                <strong>Relationship:</strong>
                {editMode ? (
                  <input
                    className="ml-2 border rounded p-1"
                    value={emergencyContact.relationship || ''}
                    onChange={(e) => {
                      setWorker((prev) => ({
                        ...prev,
                        emergencyContact: {
                          ...prev.emergencyContact,
                          relationship: e.target.value,
                        },
                      }));
                    }}
                  />
                ) : (
                  <span className="ml-2">{emergencyContact.relationship || ''}</span>
                )}
              </div>
              <div>
                <strong>Phone:</strong>
                {editMode ? (
                  <input
                    className="ml-2 border rounded p-1"
                    value={emergencyContact.phone || ''}
                    onChange={(e) => {
                      setWorker((prev) => ({
                        ...prev,
                        emergencyContact: {
                          ...prev.emergencyContact,
                          phone: e.target.value,
                        },
                      }));
                    }}
                  />
                ) : (
                  <span className="ml-2">{emergencyContact.phone || ''}</span>
                )}
              </div>
            </div>
          </div>

          <Card className="p-4 rounded shadow-lg mb-4">
            <h2 className="text-xl font-semibold mb-4">Current Projects</h2>
            {currentProjects.length === 0 ? (
              <p className="text-gray-500">No active projects found for this worker.</p>
            ) : (
              <Table
                data={currentProjects}
                columns={[
                  {
                    header: "Project Name",
                    accessorKey: "name"
                  },
                  {
                    header: "Status",
                    accessorKey: "status"
                  },
                  {
                    header: "Worker Status",
                    accessorKey: "worker_status"
                  },
                  {
                    header: "Start Date",
                    accessorKey: "startDate",
                    cell: ({ getValue }) => {
                      const d = getValue();
                      return d && d.seconds ? new Date(d.seconds * 1000).toLocaleDateString() : 'N/A';
                    }
                  },
                  {
                    header: "End Date",
                    accessorKey: "endDate",
                    cell: ({ getValue }) => {
                      const d = getValue();
                      return d && d.seconds ? new Date(d.seconds * 1000).toLocaleDateString() : 'N/A';
                    }
                  }
                ]}
              />
            )}
          </Card>


          {/* Buttons row */}
          <div className="flex gap-4 mt-6">
            {status === 'active' && (
              <button
                className="px-4 py-2 bg-red-600 text-white rounded opacity-75"
                onClick={handleArchiveToggle}
              >
                Archive
              </button>
            )}
            {status === 'archived' && (
              <button
                className="px-4 py-2 bg-yellow-500 text-white rounded opacity-75"
                onClick={handleArchiveToggle}
              >
                Re-Activate
              </button>
            )}
            {!editMode && (
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded opacity-75"
                onClick={handleEditToggle}
              >
                Modify
              </button>
            )}
            {editMode && (
              <>
                <button
                  className="px-4 py-2 bg-green-600 text-white rounded opacity-75"
                  onClick={handleSave}
                >
                  Save
                </button>
                <button
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded opacity-75"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <WorkerPaymentHistoryTab workerId={worker.id} />
      )}

      {activeTab === 'expenses' && worker && (
        <WorkerExpenseHistoryTab workerId={worker.id} />
      )}
    </div>
  );
}
