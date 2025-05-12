import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

const fetchRecentActivity = async () => {
  const activityQuery = query(
    collection(db, "activity_logs"),
    limit(10) // Fetch the 10 most recent activities
  );
  const activitySnapshot = await getDocs(activityQuery);
  return activitySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white overflow-hidden shadow rounded-lg">
    <div className="p-5">
      <div className="flex items-center">
        <div className={`flex-shrink-0 rounded-md p-3 ${color}`}>
          <span className="material-icons text-white">{icon}</span>
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd>
              <div className="text-lg font-semibold text-gray-900">{value}</div>
            </dd>
          </dl>
        </div>
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    pendingRequests: 0,
    totalSellers: 0,
    totalUsers: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch pending seller requests
        const pendingRequestsQuery = query(
          collection(db, "sellers"), 
          where("status", "==", "pending")
        );
        const pendingRequestsSnapshot = await getDocs(pendingRequestsQuery);

        // Fetch approved sellers
        const sellersQuery = query(
          collection(db, "sellers"),
          where("status", "==", "approved")
        );
        const sellersSnapshot = await getDocs(sellersQuery);

        // Fetch total users
        const usersQuery = query(collection(db, "users"));
        const usersSnapshot = await getDocs(usersQuery);

        // Fetch recent activity
        const activityQuery = query(
          collection(db, "activity_logs"),
          limit(10)
        );
        const activitySnapshot = await getDocs(activityQuery);
        const recentActivity = activitySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setStats({
          pendingRequests: pendingRequestsSnapshot.size,
          totalSellers: sellersSnapshot.size,
          totalUsers: usersSnapshot.size,
          recentActivity
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        alert("Failed to load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard</h2>
      
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard 
          title="Pending Seller Requests" 
          value={stats.pendingRequests} 
          icon="store" 
          color="bg-orange-500"
        />
        <StatCard 
          title="Total Sellers" 
          value={stats.totalSellers} 
          icon="shopping_bag" 
          color="bg-blue-500"
        />
        <StatCard 
          title="Total Users" 
          value={stats.totalUsers} 
          icon="people" 
          color="bg-green-500"
        />
      </div>
      
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Recent Activity</h3>
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {stats.recentActivity.length === 0 ? (
            <div className="px-4 py-5 text-center text-gray-500">
              No recent activity
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {stats.recentActivity.map((activity, index) => (
                <li key={index} className="px-4 py-4">
                  <div className="flex items-center">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.description}
                      </p>
                      <p className="text-sm text-gray-500">
                        {activity.timestamp?.toDate().toLocaleString()}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;