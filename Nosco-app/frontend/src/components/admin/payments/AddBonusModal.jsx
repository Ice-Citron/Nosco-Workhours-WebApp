// src/components/admin/payments/AddBonusModal.jsx
import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import Modal from '../../common/Modal';
import Button from '../../common/Button';
import { adminPaymentService } from '../../../services/adminPaymentService';
import { firestore } from '../../../firebase/firebase_config';

const AddBonusModal = ({
  isOpen,
  onClose,
  worker,       // e.g. { id, name }
  adminUser,    // e.g. { uid, ... }
}) => {
  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');
  // Currency state (default "USD")
  const [currency, setCurrency] = useState('USD');
  const [loading, setLoading] = useState(false);
  // State for exchange rates (expected structure: { rates: { MYR: 4.393, GBP: 0.8041, ... } })
  const [exchangeRates, setExchangeRates] = useState(null);

  // Fetch the exchange rates from the settings collection (document id: "exchangeRates")
  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        const ratesDocRef = doc(firestore, 'settings', 'exchangeRates');
        const docSnap = await getDoc(ratesDocRef);
        if (docSnap.exists()) {
          setExchangeRates(docSnap.data());
          console.log("Exchange rates loaded:", docSnap.data());
        } else {
          console.warn('No exchange rates document found in settings.');
        }
      } catch (error) {
        console.error('Error fetching exchange rates:', error);
      }
    };
    fetchExchangeRates();
  }, []);

  if (!worker) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const now = new Date();
      // Parse the entered bonus amount as a number
      let bonusAmount = parseFloat(amount);
      console.log("Parsed bonusAmount:", bonusAmount, "Currency:", currency, "ExchangeRates:", exchangeRates);
      
      // If currency is not USD and exchangeRates are loaded, convert the amount.
      if (currency !== 'USD' && exchangeRates && exchangeRates.rates && exchangeRates.rates[currency]) {
        const rate = exchangeRates.rates[currency];
        console.log(`Using exchange rate for ${currency}: ${rate}`);
        bonusAmount = bonusAmount / rate;
        console.log("Converted bonusAmount in USD:", bonusAmount);
      } else if (currency !== 'USD') {
        // This branch should not happen because we disable submission until rates are loaded.
        console.warn("Exchange rates not available. Conversion did not occur.");
      }

      // Create the payment document (all values stored in USD)
      await adminPaymentService.createPayment({
        description: `Bonus for ${worker.name}`,
        paymentType: 'bonus',
        status: 'processing',   // New bonus doc is created with processing status
        amount: bonusAmount,
        currency: 'USD',        // Stored in USD
        userID: worker.id,
        projectID: '',          // Adjust if needed
        referenceNumber: `BON-${Date.now()}`,
        paymentMethod: '',      // Fill in if needed
        createdBy: adminUser?.uid || 'unknownAdmin',
        comments: {
          text: `${amount} ${currency}`, // Optionally store the original input for reference
          userID: adminUser?.uid || 'unknownAdmin',
          createdAt: now,
        },
        date: now.toISOString(),
      });

      // Reset fields and close modal
      setAmount('');
      setComment('');
      setCurrency('USD');
      onClose();
    } catch (err) {
      console.error('Error creating bonus payment:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Bonus">
      <div className="p-6 space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Add Bonus</h2>
        <p className="text-sm text-gray-500">
          Enter the bonus details for <strong>{worker.name}</strong> below.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Worker Name (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Worker Name</label>
            <input
              type="text"
              value={worker.name}
              readOnly
              className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 focus:outline-none"
            />
          </div>

          {/* Bonus Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bonus Amount</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="0"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Currency Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              required
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
              <option value="EUR">EUR</option>
              <option value="MYR">MYR</option>
            </select>
          </div>

          {/* Comments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Reason for bonus, etc."
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex justify-end gap-2">
            <Button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !amount.trim() || (currency !== 'USD' && !exchangeRates)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Saving...' : 'Confirm Bonus'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default AddBonusModal;
