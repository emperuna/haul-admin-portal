import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin on component mount
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        
        if (!user) {
          console.error("No user is signed in");
          setError("You must be signed in to view this page");
          setLoading(false);
          return;
        }
        
        // Check if user has admin role
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().roles?.includes('admin')) {
          setIsAdmin(true);
          fetchDashboardStats();
        } else {
          console.error("User is not an admin");
          setError("You don't have permission to view this page");
          setLoading(false);
        }
      } catch (err) {
        console.error("Error checking admin status:", err);
        setError("Authentication error. Please try again.");
        setLoading(false);
      }
    };
    
    checkAdminStatus();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Direct Firestore queries - much simpler!
      const userCount = (await getDocs(collection(db, "users"))).size;
      const productCount = (await getDocs(collection(db, "products"))).size;
      const orderCount = (await getDocs(collection(db, "orders"))).size;
      const sellerCount = (await getDocs(collection(db, "sellers"))).size;
      
      // Get active products count
      const activeProductsSnapshot = await getDocs(
        query(collection(db, "products"), where("isActive", "==", true))
      );
      const activeProductCount = activeProductsSnapshot.size;
      
      // Get low stock products count
      const lowStockSnapshot = await getDocs(
        query(collection(db, "products"), where("currentStock", "<=", 5))
      );
      const lowStockCount = lowStockSnapshot.size;
      
      // Get pending seller requests
      const pendingSellerRequestsSnapshot = await getDocs(
        query(collection(db, "sellers"), where("status", "==", "pending"))
      );
      const pendingSellerRequests = pendingSellerRequestsSnapshot.size;
      
      // Get approved sellers
      const approvedSellersSnapshot = await getDocs(
        query(collection(db, "sellers"), where("status", "==", "approved"))
      );
      const approvedSellers = approvedSellersSnapshot.size;
      
      setStats({
        userCount,
        productCount,
        activeProductCount,
        lowStockCount,
        orderCount,
        sellerCount,
        pendingSellerRequests,
        approvedSellers
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
      setError("Failed to load dashboard data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    fetchDashboardStats();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={handleRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>
      
      {stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-500 text-sm">Total Users</div>
            <div className="text-3xl font-bold mt-2">{stats.userCount || 0}</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-500 text-sm">Total Products</div>
            <div className="text-3xl font-bold mt-2">{stats.productCount || 0}</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-500 text-sm">Total Orders</div>
            <div className="text-3xl font-bold mt-2">{stats.orderCount || 0}</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-500 text-sm">Total Sellers</div>
            <div className="text-3xl font-bold mt-2">{stats.sellerCount || 0}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-500 text-sm">Active Products</div>
            <div className="text-3xl font-bold mt-2">{stats.activeProductCount || 0}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-500 text-sm">Low Stock Items</div>
            <div className="text-3xl font-bold mt-2 text-red-600">{stats.lowStockCount || 0}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-500 text-sm">Pending Seller Requests</div>
            <div className="text-3xl font-bold mt-2 text-orange-600">{stats.pendingSellerRequests || 0}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-500 text-sm">Approved Sellers</div>
            <div className="text-3xl font-bold mt-2 text-green-600">{stats.approvedSellers || 0}</div>
          </div>
        </div>
      ) : (
        <div className="text-center">No dashboard data available</div>
      )}
    </div>
  );
};

export default Dashboard;