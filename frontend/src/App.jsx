import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import CustomerList from './pages/CustomerList'
import CustomerProfile from './pages/CustomerProfile'
import PredictChurn from './pages/PredictChurn'
import Segmentation from './pages/Segmentation'
import PredictionHistory from './pages/PredictionHistory'
import Reports from './pages/Reports'
import Settings from './pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="customers" element={<CustomerList />} />
          <Route path="customers/:id" element={<CustomerProfile />} />
          <Route path="predict" element={<PredictChurn />} />
          <Route path="segmentation" element={<Segmentation />} />
          <Route path="predictions" element={<PredictionHistory />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
