import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';

const ExpensesLayout = () => {
    return (
        <div className="max-w-6xl mx-auto p-4">
            <div className="bg-white rounded-lg shadow mb-6">
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-4" aria-label="Expenses">
                        <NavLink
                            to="submit"
                            className={({ isActive }) =>
                                `py-4 px-1 border-b-2 text-sm font-medium ${
                                    isActive
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`
                            }
                        >
                            Submit Expense
                        </NavLink>
                        <NavLink
                            to="history"
                            className={({ isActive }) =>
                                `py-4 px-1 border-b-2 text-sm font-medium ${
                                    isActive
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`
                            }
                        >
                            Expense History
                        </NavLink>
                    </nav>
                </div>
            </div>

            <Outlet />
        </div>
    );
};

export default ExpensesLayout;