import { useState } from "react";
import Login from "./components/Login";
import SellerRequests from "./components/SellerRequests";
import "./App.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <div className="app">
      <header>
        <h1>Haul Admin Portal</h1>
        {isAuthenticated && (
          <button 
            className="logout-btn" 
            onClick={() => setIsAuthenticated(false)}
          >
            Logout
          </button>
        )}
      </header>
      
      <main>
        {isAuthenticated ? (
          <SellerRequests />
        ) : (
          <Login setIsAuthenticated={setIsAuthenticated} />
        )}
      </main>
    </div>
  );
}

export default App;
