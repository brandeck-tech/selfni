import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import AddDebt from './pages/AddDebt';
import Groups from './pages/Groups';

function AppContent() {
  const { user } = useAuth();
  const [authPage, setAuthPage] = useState<'login' | 'register'>('login');
  const [page, setPage] = useState('home');

  if (!user) {
    return authPage === 'login'
      ? <Login onSwitch={() => setAuthPage('register')} />
      : <Register onSwitch={() => setAuthPage('login')} />;
  }

  if (page === 'add') return <AddDebt setPage={setPage} />;
  if (page === 'groups') return <Groups setPage={setPage} />;
  return <Home setPage={setPage} />;
}

export default function App() {
  return <AuthProvider><AppContent /></AuthProvider>;
}
