import React from 'react';
import SelectDropdown from '../common/SelectDropdown';
import { PAYMENT_TYPES } from '../../utils/constants';

const PaymentTypeFilter = ({ value, onChange }) => {
  const typeOptions = [
    { value: 'all', label: 'All Types' },
    ...Object.entries(PAYMENT_TYPES).map(([key, value]) => ({
      value: value,
      label: value.charAt(0).toUpperCase() + value.slice(1).replace(/([A-Z])/g, ' $1')
    }))
  ];

  return (
    <SelectDropdown
      label="Payment Type"
      options={typeOptions}
      value={value}
      onChange={onChange}
    />
  );
};

export default PaymentTypeFilter;