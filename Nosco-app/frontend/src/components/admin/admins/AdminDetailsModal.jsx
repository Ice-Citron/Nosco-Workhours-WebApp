// src/components/admin/workers/AdminDetailsModal.jsx
import React from 'react';
import Modal from '../../common/Modal';

const AdminDetailsModal = ({ admin, onClose }) => {
  if (!admin) return null;

  return (
    <Modal 
      isOpen={true} 
      onClose={onClose}
      title="Admin Details"
    >
      {/* Add padding inside the modal content */}
      <div className="p-6 text-left space-y-4">
        
        {/* Basic info */}
        <p>
          <strong>Name:</strong> {admin.name}
        </p>
        <p>
          <strong>Email:</strong> {admin.email}
        </p>
        <p>
          <strong>Department:</strong> {admin.department}
        </p>
        <p>
          <strong>Position:</strong> {admin.position}
        </p>
        
        {/* Conditionally show phone if it exists */}
        {admin.phoneNumber && (
          <p>
            <strong>Phone:</strong> {admin.phoneNumber}
          </p>
        )}

        {/* Close button, aligned right */}
        <div className="pt-4 flex justify-end">
          <button 
            onClick={onClose} 
            className="px-6 py-2 bg-nosco-red text-white rounded hover:bg-nosco-red-dark"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AdminDetailsModal;
