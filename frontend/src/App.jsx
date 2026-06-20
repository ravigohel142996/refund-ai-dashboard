import { Routes, Route } from 'react-router-dom';
import CustomerPortal from './CustomerPortal';
import AdminDashboard from './AdminDashboard';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<CustomerPortal />} />
      <Route path="/admin" element={<AdminDashboard />} />
    </Routes>
  );
}
