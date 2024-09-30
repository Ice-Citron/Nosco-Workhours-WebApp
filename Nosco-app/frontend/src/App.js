import React, { useState } from 'react';
import { db } from './firebase/firebase_config';
import { collection, addDoc } from 'firebase/firestore';
import './App.css';


function App() {
  const [number, setNumber] = useState('');
  const [result, setResult] = useState(null);

  const handleCalculate = async () => {
    const response = await fetch(`/api/calculate_factorial/?number=${number}`);
    const data = await response.json();
    setResult(data.result);
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