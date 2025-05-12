// filepath: d:\repos\haul-admin-portal\src\components\layout\Header.jsx
import { auth } from '../../services/firebase';

const Header = ({ onMenuButtonClick }) => {
  const handleLogout = async () => {
    try {
      await auth.signOut();
      window.location.reload();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <header className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow">
      <button
        type="button"
        className="px-4 md:hidden"
        onClick={onMenuButtonClick}
      >
        <span className="material-icons">menu</span>
      </button>
      <div className="flex-1 px-4 flex justify-between">
        <div className="flex-1"></div>
        <div className="ml-4 flex items-center md:ml-6">
          <button
            onClick={handleLogout}
            className="flex items-center p-2 text-gray-500 hover:text-gray-700"
          >
            <span className="material-icons mr-2">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;