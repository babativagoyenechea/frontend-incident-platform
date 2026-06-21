import React from 'react';
import { DashboardProvider } from './context/DashboardContext';
import { Dashboard } from './pages/Dashboard';

export default function App() {
  return (
    <DashboardProvider>
      <Dashboard />
    </DashboardProvider>
  );
}