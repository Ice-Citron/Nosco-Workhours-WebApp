// Nosco-app/frontend/src/components/common/CurrencyInput.jsx

import React, { useState, useEffect } from 'react';
import InputField from './InputField';
import SelectDropdown from './SelectDropdown';
import currencyService from '../../services/currencyService';

const CurrencyInput = ({
  label,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  className = ''
}) => {
  const [currencies, setCurrencies] = useState([]);
  const [amount, setAmount] = useState(value?.amount || '');
  const [currency, setCurrency] = useState(value?.currency || 'USD');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeCurrencies = async () => {
      try {
        setLoading(true);
        await currencyService.initialize();
        setCurrencies(currencyService.getCurrencies());
      } catch (error) {
        console.error('Failed to load currencies:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeCurrencies();
  }, []);

  useEffect(() => {
    if (value) {
      setAmount(value.amount || '');
      setCurrency(value.currency || 'USD');
    }
  }, [value]);

  const handleAmountChange = (e) => {
    const newAmount = e.target.value;
    setAmount(newAmount);
    
    if (onChange) {
      // Convert to USD for storage
      const amountValue = parseFloat(newAmount);
      const convertedAmount = currencyService.convertCurrency(amountValue, currency, 'USD');
      
      onChange({
        amount: amountValue,
        currency,
        convertedAmount
      });
    }
  };

  const handleCurrencyChange = (e) => {
    const newCurrency = e.target.value;
    setCurrency(newCurrency);
    
    if (onChange) {
      // Convert to USD for storage
      const amountValue = parseFloat(amount);
      const convertedAmount = currencyService.convertCurrency(amountValue, newCurrency, 'USD');
      
      onChange({
        amount: amountValue,
        currency: newCurrency,
        convertedAmount
      });
    }
  };

  return (
    <div className={`grid grid-cols-2 gap-4 ${className}`}>
      <InputField
        label={label}
        type="number"
        step="0.01"
        min="0"
        value={amount}
        onChange={handleAmountChange}
        disabled={disabled || loading}
        required={required}
        error={error?.amount}
      />

      {currencies.length > 0 ? (
        <SelectDropdown
          label="Currency"
          options={currencies}
          value={currency}
          onChange={handleCurrencyChange}
          disabled={disabled || loading}
          required={required}
          error={error?.currency}
        />
      ) : (
        <div className="flex items-end">
          <p className="text-gray-600">{loading ? 'Loading currencies...' : 'No currencies available'}</p>
        </div>
      )}
    </div>
  );
};

export default CurrencyInput;