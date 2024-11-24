import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  DollarSign, 
  Building, 
  ChevronRight, 
  Briefcase 
} from 'lucide-react';

const WorkerPaymentList = ({ workers, loading }) => {
  const navigate = useNavigate();

  const calculateTotalAmount = (worker) => {
    let total = 0;
    Object.entries(worker.unpaidHours || {}).forEach(([projectId, hours]) => {
      total += hours.regular * worker.rates.regular;
      total += hours.ot1_0 * worker.rates.ot1_0;
      total += hours.ot1_5 * worker.rates.ot1_5;
      total += hours.ot2_0 * worker.rates.ot2_0;
    });
    return total;
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Workers with Unpaid Hours</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Worker
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Unpaid Hours
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Amount Due
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Projects
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : workers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                  No workers with unpaid hours
                </td>
              </tr>
            ) : (
              workers.map((worker) => (
                <tr 
                  key={worker.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/admin/payments/worker/${worker.id}`)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img 
                        src={worker.profilePic || '/api/placeholder/40/40'} 
                        alt={worker.name}
                        className="h-10 w-10 rounded-full"
                      />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {worker.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {worker.position}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Clock className="h-4 w-4 text-gray-500 mr-2" />
                      <div>
                        <div className="font-medium">
                          {Object.values(worker.unpaidHours || {}).reduce((total, hours) => 
                            total + hours.regular + hours.ot1_0 + hours.ot1_5 + hours.ot2_0, 0
                          )} hours
                        </div>
                        <div className="text-xs text-gray-500">
                          Across {Object.keys(worker.unpaidHours || {}).length} projects
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm">
                      <DollarSign className="h-4 w-4 text-gray-500 mr-2" />
                      <div className="font-medium text-gray-900">
                        ${calculateTotalAmount(worker).toLocaleString()}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Building className="h-4 w-4 text-gray-500 mr-2" />
                      <div className="text-sm">
                        {Object.entries(worker.unpaidHours || {}).map(([projectId], index) => (
                          <div key={projectId} className="text-gray-500">
                            Project {projectId}
                            {index < Object.keys(worker.unpaidHours).length - 1 && ', '}
                          </div>
                        ))}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 inline-flex items-center">
                      View Details
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WorkerPaymentList;