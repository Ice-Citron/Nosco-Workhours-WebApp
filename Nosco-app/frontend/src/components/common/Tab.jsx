const Tab = ({ children, isActive, onClick }) => {
    return (
      <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors
          ${isActive 
            ? 'border-nosco-red text-nosco-red' 
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
      >
        {children}
      </button>
    );
  };
  
  export default Tab;