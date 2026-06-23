// src/App.jsx
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';

const Login = lazy(() => import('./pages/Login'));
const ViewerLogin = lazy(() => import('./pages/ViewerLogin'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Institutions = lazy(() => import('./pages/Institutions'));
const Contracts = lazy(() => import('./pages/Contracts'));
const ContractForm = lazy(() => import('./pages/ContractForm'));
const ContractDetail = lazy(() => import('./pages/ContractDetail'));
const Payments = lazy(() => import('./pages/Payments'));
const Alerts = lazy(() => import('./pages/Alerts'));
const Reports = lazy(() => import('./pages/Reports'));
const RouteList = lazy(() => import('./pages/Routes'));
const Vehicles = lazy(() => import('./pages/Vehicles'));
const AuditLogs = lazy(() => import('./pages/AuditLogs'));
const Settings = lazy(() => import('./pages/Settings'));

export default function App() {
  return (
    <Suspense fallback={<LoadingSpinner message="Loading page..." />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/viewer-login" element={<ViewerLogin />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="institutions" element={<Institutions />} />
          <Route path="contracts" element={<Contracts />} />
          <Route path="contracts/new" element={<ContractForm />} />
          <Route path="contracts/:id" element={<ContractDetail />} />
          <Route path="contracts/:id/edit" element={<ContractForm />} />
          <Route path="routes" element={<RouteList />} />
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="payments" element={<Payments />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="reports" element={<Reports />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Suspense>
  );
}


