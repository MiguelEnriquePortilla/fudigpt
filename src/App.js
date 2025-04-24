import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Placeholder temporal (lo reemplazaremos pronto)
const FudiGPTInterface = () => (
  <div className="flex items-center justify-center h-screen bg-gray-100">
    <div className="text-center p-8 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold text-orange-600 mb-4">FudiGPT</h1>
      <p className="text-gray-600">Cargando interfaz...</p>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<FudiGPTInterface />} />
      </Routes>
    </Router>
  );
}

export default App;