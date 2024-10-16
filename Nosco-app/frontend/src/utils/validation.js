// src/utils/validation.js
import * as Yup from 'yup';

// Example validation schema for expense submission
export const expenseSchema = Yup.object().shape({
  amount: Yup.number().positive('Amount must be positive').required('Amount is required'),
  type: Yup.string().required('Expense type is required'),
  receipts: Yup.array()
    .of(Yup.mixed().required('Receipt is required'))
    .min(1, 'At least one receipt is required'),
});

// Example validation schema for logging hours
export const logHoursSchema = Yup.object().shape({
  regularHours: Yup.number().min(0, 'Cannot be negative').required('Regular hours are required'),
  overtimeHours: Yup.number().min(0, 'Cannot be negative').required('Overtime hours are required'),
  projectIds: Yup.array().of(Yup.string().required()).min(1, 'Select at least one project'),
});
