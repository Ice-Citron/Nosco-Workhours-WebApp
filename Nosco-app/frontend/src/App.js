import React, { useEffect } from 'react';
import { db } from './firebase/firebase_config';
import { collection, addDoc } from 'firebase/firestore';
import './App.css';

function App() {
  useEffect(() => {
    const testFirebase = async () => {
      try {
        const docRef = await addDoc(collection(db, "test"), {
          message: "Hello Firebase!"
        });
        console.log("Document written with ID: ", docRef.id);
      } catch (e) {
        console.error("Error adding document: ", e);
      }
    };

    testFirebase();
  }, []);

  return (
    <div className="App">
      <h1>My Firebase App</h1>
      <p>Check the console to see if the Firebase test was successful.</p>
    </div>
  );
}

export default App;