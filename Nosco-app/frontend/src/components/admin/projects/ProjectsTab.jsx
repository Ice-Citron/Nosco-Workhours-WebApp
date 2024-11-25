// src/components/common/Tab.jsx
import React from 'react';

const Tab = ({ tabs, activeTab, onChange }) => {
  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm
              ${activeTab === tab.id
                ? 'border-nosco-red text-nosco-red'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`ml-2 rounded-full px-2.5 py-0.5 text-xs font-medium
                ${activeTab === tab.id
                  ? 'bg-red-100 text-red-600'
                  : 'bg-gray-100 text-gray-900'
                }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Tab;