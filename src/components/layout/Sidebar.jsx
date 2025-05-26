import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';

const navigation = [
  { name: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
  { name: 'User Management', path: '/users', icon: 'people' },
  { name: 'Product Management', path: '/products', icon: 'inventory_2' },
  { name: 'Seller Requests', path: '/seller-requests', icon: 'store' }, // Add this line
];

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-gray-600 bg-opacity-75 lg:hidden" 
          onClick={toggleSidebar}
        ></div>
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-30 
        w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-16'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 bg-blue-600">
          <h1 className={`text-xl font-bold text-white transition-opacity duration-300 ${
            isOpen ? 'opacity-100' : 'lg:opacity-0 lg:hidden'
          }`}>
            Haul Admin
          </h1>
          
          {/* Close button for mobile */}
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-md text-white hover:bg-blue-700"
          >
            <span className="material-icons">close</span>
          </button>
          
          {/* Collapsed logo for desktop */}
          {!isOpen && (
            <div className="hidden lg:flex items-center justify-center w-full">
              <span className="material-icons text-white text-2xl">admin_panel_settings</span>
            </div>
          )}
        </div>
        
        {/* Navigation */}
        <nav className="mt-5 px-2">
          <div className="space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } ${!isOpen ? 'lg:justify-center lg:px-2' : ''}`
                }
                title={!isOpen ? item.name : ''}
              >
                <span className={`material-icons text-gray-400 group-hover:text-gray-500 ${
                  isOpen ? 'mr-3' : 'lg:mr-0'
                }`}>
                  {item.icon}
                </span>
                <span className={`transition-opacity duration-300 ${
                  isOpen ? 'opacity-100' : 'lg:opacity-0 lg:hidden'
                }`}>
                  {item.name}
                </span>
              </NavLink>
            ))}
          </div>
        </nav>
        
        {/* Sign Out Button */}
        <div className={`absolute bottom-0 w-full p-4 ${!isOpen ? 'lg:p-2' : ''}`}>
          <button
            onClick={handleSignOut}
            className={`w-full flex items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 ${
              !isOpen ? 'lg:justify-center lg:px-2' : ''
            }`}
            title={!isOpen ? 'Sign Out' : ''}
          >
            <span className={`material-icons text-gray-400 ${isOpen ? 'mr-3' : 'lg:mr-0'}`}>
              logout
            </span>
            <span className={`transition-opacity duration-300 ${
              isOpen ? 'opacity-100' : 'lg:opacity-0 lg:hidden'
            }`}>
              Sign Out
            </span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;