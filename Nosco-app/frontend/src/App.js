import React, { useState } from 'react';
import './App.css';

function App() {
  const [number, setNumber] = useState('');
  const [result, setResult] = useState(null);

  const handleCalculate = async () => {
    try {
      const response = await fetch(`https://<your-region>-<nosco-app-b5be4>.cloudfunctions.net/calculateFactorial?number=${number}`);
      const data = await response.json();
      setResult(data.result);
    } catch (error) {
      console.error('Error:', error);
      setResult('Error calculating factorial');
    }
  };

  return (
    <div className="App">
      <input 
        type="number" 
        value={number} 
        onChange={(e) => setNumber(e.target.value)} 
      />
      <button onClick={handleCalculate}>Calculate Factorial</button>
      {result !== null && <p>Result: {result}</p>}
    </div>
  );
}

export default App;