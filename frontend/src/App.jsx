import { Routes, Route, Navigate } from 'react-router-dom';
import CustomerPortal from './CustomerPortal';
import AdminDashboard from './AdminDashboard';
import AdminLogin from './AdminLogin';

function ProtectedAdmin() {
  const isAuth = sessionStorage.getItem('admin_auth') === '1';
  return isAuth ? <AdminDashboard /> : <Navigate to="/admin/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/"             element={<CustomerPortal />} />
      <Route path="/admin/login"  element={<AdminLogin />} />
      <Route path="/admin"        element={<ProtectedAdmin />} />
    </Routes>
  );
}
