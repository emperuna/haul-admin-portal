import { useState, useEffect } from 'react';
import Login from './pages/Login';
import SellerRequests from './pages/SellerRequests';
import UserManagement from './pages/UserManagement';
import Dashboard from './pages/Dashboard';
import DashboardLayout from './components/layout/DashboardLayout';
import { auth } from './services/firebase';
import './index.css';

/**
 * Main application component that manages authentication state and page routing.
 *
 * Renders the login page if the user is not authenticated. Once authenticated, displays the dashboard layout and routes to the appropriate page component based on the current selection.
 */
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
    });
    
    return () => unsubscribe();
  }, []);
  
  // Complete routing logic
  const renderPage = () => {
    if (!isAuthenticated) {
      return <Login setIsAuthenticated={setIsAuthenticated} />;
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
  
  return (
    isAuthenticated ? (
      <DashboardLayout currentPage={currentPage} setCurrentPage={setCurrentPage}>
        {renderPage()}
      </DashboardLayout>
    ) : (
      <Login setIsAuthenticated={setIsAuthenticated} />
    )
  );
}

export default App;
