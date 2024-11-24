import React, { useState } from 'react';
import Modal from '../../common/Modal';
import Button from '../../common/Button';
import InputField from '../../common/InputField';
import { FileUpload } from 'lucide-react';

const PaymentCompletionModal = ({ isOpen, onClose, onComplete, amount }) => {
  const [comment, setComment] = useState('');
  const [files, setFiles] = useState([]);
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Upload files if any
      const fileUrls = [];
      for (const file of files) {
        const url = await uploadPaymentProof(file); // You'll need to implement this
        fileUrls.push(url);
      }

      await onComplete({
        comment,
        reference,
        attachments: fileUrls
      });
      onClose();
    } catch (error) {
      console.error('Error completing payment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Complete Payment"
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        <div className="text-lg font-medium text-gray-900 mb-4">
          Amount: ${amount.toLocaleString()}
        </div>

        <InputField
          label="Payment Reference"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Comments
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required
            rows={3}
            className="w-full p-2 border rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Attach Screenshots/Proofs
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <FileUpload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label className="relative cursor-pointer bg-white rounded-md font-medium text-nosco-red hover:text-nosco-red-dark">
                  <span>Upload files</span>
                  <input
                    type="file"
                    className="sr-only"
                    multiple
                    onChange={(e) => setFiles(Array.from(e.target.files))}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button 
            type="button"
            onClick={onClose}
            className="bg-gray-500"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || !reference || !comment}
          >
            {loading ? 'Processing...' : 'Complete Payment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default PaymentCompletionModal;