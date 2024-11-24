import React from 'react';
import Modal from '../../common/Modal';
import { format } from 'date-fns';
import { Clock, DollarSign, FileText, Download, ExternalLink } from 'lucide-react';

const PaymentDetailsModal = ({ isOpen, onClose, payment }) => {
  if (!payment) return null;

  const formatDate = (date) => {
    try {
      return format(date.toDate(), 'MMM dd, yyyy HH:mm');
    } catch (error) {
      return format(new Date(date), 'MMM dd, yyyy HH:mm');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Payment Details"
    >
      <div className="p-6 space-y-6">
        {/* Payment Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-500">Reference</div>
            <div className="font-medium">{payment.reference}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Payment Date</div>
            <div className="font-medium">{formatDate(payment.paymentDate)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Total Amount</div>
            <div className="font-medium">${payment.totalAmount.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Status</div>
            <div className="inline-flex px-2 py-1 rounded-full text-sm bg-green-100 text-green-800">
              Completed
            </div>
          </div>
        </div>

        {/* Work Hours Breakdown */}
        <div>
          <h3 className="text-lg font-medium mb-3">Work Hours Breakdown</h3>
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Regular</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">OT 1.5x</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">OT 2.0x</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payment.workHours.map((hour) => (
                <tr key={hour.id}>
                  <td className="px-3 py-2">{formatDate(hour.date)}</td>
                  <td className="px-3 py-2">{hour.regularHours || 0}</td>
                  <td className="px-3 py-2">{hour.overtime15x || 0}</td>
                  <td className="px-3 py-2">{hour.overtime20x || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Payment Proofs */}
        {payment.attachments && payment.attachments.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-3">Payment Proofs</h3>
            <div className="grid grid-cols-2 gap-4">
              {payment.attachments.map((attachment, index) => (
                <a
                  key={index}
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50"
                >
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{attachment.name}</span>
                  <ExternalLink className="h-4 w-4 ml-auto text-gray-400" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Comments */}
        {payment.comments && (
          <div>
            <h3 className="text-lg font-medium mb-3">Comments</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700">{payment.comments}</p>
              <div className="mt-2 text-sm text-gray-500">
                Added by {payment.processedBy} on {formatDate(payment.processedAt)}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default PaymentDetailsModal;