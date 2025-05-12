import { useState, useEffect } from 'react';
import Login from './pages/Login';
import SellerRequests from './pages/SellerRequests';
import UserManagement from './pages/UserManagement';
import Dashboard from './pages/Dashboard';
import DashboardLayout from './components/layout/DashboardLayout';
import { auth } from './services/firebase';
import './index.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
    });
    
    return () => unsubscribe();
  }, []);
  
  // Simple routing logic
  const renderPage = () => {
    if (!isAuthenticated) {
      return <Login />;
    }
    
    switch (currentPage) {
      case 'seller-requests':
        return <SellerRequests />;
      case 'users':
        return <UserManagement />;
      case 'dashboard':
      default:
        return <Dashboard />;
    }
  };
  
  // Listen for navigation events
  useEffect(() => {
    const handleNavigation = () => {
      const path = window.location.pathname;
      if (path.includes('seller-requests')) {
        setCurrentPage('seller-requests');
      } else if (path.includes('users')) {
        setCurrentPage('users');
      } else {
        setCurrentPage('dashboard');
      }
    };
    
    window.addEventListener('popstate', handleNavigation);
    handleNavigation();
    
    return () => window.removeEventListener('popstate', handleNavigation);
  }, []);
  
  return isAuthenticated ? (
    <DashboardLayout>
      {renderPage()}
    </DashboardLayout>
  ) : (
    <Login setIsAuthenticated={setIsAuthenticated} />
  );
}

export default App;
