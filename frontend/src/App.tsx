import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import AddDebt from './pages/AddDebt';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import DebtDetail from './pages/DebtDetail';
import Clients from './pages/Clients';
import Customers from './pages/Customers';

function AppContent() {
  const { user } = useAuth();
  const [authPage, setAuthPage] = useState<'login' | 'register'>('login');
  const [page, setPage] = useState('home');
  const [selectedDebtId, setSelectedDebtId] = useState<number | null>(null);

  const handleSetPage = (p: string) => {
    if (p.startsWith('debt:')) {
      setSelectedDebtId(parseInt(p.split(':')[1]));
      setPage('debt');
    } else {
      setPage(p);
    }
  };

  if (!user) {
    return authPage === 'login'
      ? <Login onSwitch={() => setAuthPage('register')} />
      : <Register onSwitch={() => setAuthPage('login')} />;
  }

  if (page === 'add') return <AddDebt setPage={handleSetPage} />;
  if (page === 'clients') return <Clients setPage={handleSetPage} />;
  if (page === 'customers') return <Customers setPage={handleSetPage} />;
  if (page === 'dashboard') return <Dashboard setPage={handleSetPage} />;
  if (page === 'settings') return <Settings setPage={handleSetPage} />;
  if (page === 'debt' && selectedDebtId) return <DebtDetail debtId={selectedDebtId} setPage={handleSetPage} />;
  return <Home setPage={handleSetPage} />;
}

export default function App() {
  return <AuthProvider><AppContent /></AuthProvider>;
}
