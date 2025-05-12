import { Fragment } from 'react';

const navigation = [
  { name: 'Dashboard', path: 'dashboard', icon: 'dashboard' },
  { name: 'Seller Requests', path: 'seller-requests', icon: 'store' },
  { name: 'User Management', path: 'users', icon: 'person' },
];

const Sidebar = ({ isOpen, setIsOpen, currentPage, setCurrentPage }) => {
  
  // Handle navigation without page reload
  const handleNavigation = (path) => {
    setCurrentPage(path);
    setIsOpen(false); // Close mobile sidebar after navigation
  };
  
  return (
    <>
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 md:hidden ${isOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsOpen(false)}></div>
        <div className="fixed inset-y-0 left-0 flex max-w-xs w-full bg-white">
          <div className="h-full w-full flex flex-col">
            <div className="flex-shrink-0 flex items-center px-4 h-16 bg-gray-900">
              <h1 className="text-xl font-bold text-white">Haul Admin</h1>
            </div>
            <div className="flex-1 flex flex-col overflow-y-auto">
              <nav className="flex-1 px-2 py-4 bg-gray-800 space-y-1">
                {navigation.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => handleNavigation(item.path)}
                    className={`text-left w-full ${
                      currentPage === item.path 
                        ? 'bg-gray-900 text-white' 
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    } group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                  >
                    <span className="material-icons mr-3">{item.icon}</span>
                    {item.name}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-col flex-grow bg-gray-800 overflow-y-auto">
          <div className="flex items-center h-16 flex-shrink-0 px-4 bg-gray-900">
            <h1 className="text-xl font-bold text-white">Haul Admin</h1>
          </div>
          <div className="mt-5 flex-1 flex flex-col">
            <nav className="flex-1 px-2 pb-4 space-y-1">
              {navigation.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.path)}
                  className={`text-left w-full ${
                    currentPage === item.path 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                >
                  <span className="material-icons mr-3 text-gray-400">{item.icon}</span>
                  {item.name}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;