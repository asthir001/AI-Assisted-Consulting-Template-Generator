import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import TemplatePage from './pages/TemplatePage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/template" element={<TemplatePage />} />
      </Routes>
    </Router>
  );
}

export default App;
