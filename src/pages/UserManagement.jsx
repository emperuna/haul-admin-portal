import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc, where, orderBy, limit, startAfter } from 'firebase/firestore';
import { db } from '../services/firebase';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [editingUser, setEditingUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  
  // Pagination
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [lastVisible, setLastVisible] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [pageSize]);

  // Apply filters whenever users, searchTerm, or roleFilter changes
  useEffect(() => {
    applyFilters();
  }, [users, searchTerm, roleFilter]);

  const fetchUsers = async (startAfterDoc = null) => {
    try {
      setLoading(true);
      let q;
      
      if (startAfterDoc) {
        q = query(
          collection(db, "users"),
          orderBy("email"),
          startAfter(startAfterDoc),
          limit(pageSize)
        );
      } else {
        q = query(
          collection(db, "users"),
          orderBy("email"),
          limit(pageSize)
        );
      }
      
      const querySnapshot = await getDocs(q);
      
      // Get total count for pagination
      const totalCountSnapshot = await getDocs(collection(db, "users"));
      setTotalUsers(totalCountSnapshot.size);
      
      if (!querySnapshot.empty) {
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      }
      
      // Map documents to user objects
      const userData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Remove duplicates by using a Map with user.id as key
      const uniqueUsers = Array.from(
        new Map(userData.map(user => [user.id, user])).values()
      );
      
      setUsers(uniqueUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNextPage = () => {
    if (lastVisible) {
      setCurrentPage(currentPage + 1);
      fetchUsers(lastVisible);
    }
  };

  const fetchPrevPage = () => {
    if (currentPage > 1) {
      // Need to reset and fetch from beginning to page-1
      setCurrentPage(currentPage - 1);
      fetchUsers();
    }
  };

  const applyFilters = () => {
    let filtered = [...users];
    
    // Apply search term filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        (user.email && user.email.toLowerCase().includes(lowerSearchTerm)) ||
        (user.displayName && user.displayName.toLowerCase().includes(lowerSearchTerm))
      );
    }
    
    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => 
        user.roles && user.roles.includes(roleFilter)
      );
    }
    
    setFilteredUsers(filtered);
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        disabled: !currentStatus,
        updatedAt: new Date()
      });
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, disabled: !currentStatus }
          : user
      ));
      
      // Close any open modal
      setShowModal(false);
      setConfirmAction(null);
    } catch (error) {
      console.error("Error toggling user status:", error);
    }
  };

  const toggleEmailVerification = async (userId, currentStatus) => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        emailVerified: !currentStatus,
        updatedAt: new Date()
      });

      // Update local state
      setUsers(users.map(user =>
        user.id === userId
          ? { ...user, emailVerified: !currentStatus }
          : user
      ));

    } catch (error) {
      console.error("Error toggling email verification:", error);
    }
  };

  const updateUserRoles = async (userId, newRoles) => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        roles: newRoles,
        updatedAt: new Date()
      });
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, roles: newRoles }
          : user
      ));
      
      // Close modal
      setShowModal(false);
      setEditingUser(null);
    } catch (error) {
      console.error("Error updating user roles:", error);
    }
  };

  const openEditModal = (user) => {
    setEditingUser({
      ...user,
      roles: user.roles || []
    });
    setShowModal(true);
  };

  const openConfirmModal = (action, user) => {
    setConfirmAction({
      action,
      user
    });
    setShowModal(true);
  };
  
  const handleRoleToggle = (role) => {
    const currentRoles = [...(editingUser.roles || [])];
    const roleIndex = currentRoles.indexOf(role);
    
    if (roleIndex >= 0) {
      // Remove role
      currentRoles.splice(roleIndex, 1);
    } else {
      // Add role
      currentRoles.push(role);
    }
    
    setEditingUser({
      ...editingUser,
      roles: currentRoles
    });
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const totalPages = Math.ceil(totalUsers / pageSize);

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">User Management</h2>
      
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="w-full md:w-1/3">
          <label htmlFor="search" className="sr-only">Search</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-icons text-gray-400">search</span>
            </div>
            <input
              id="search"
              type="text"
              placeholder="Search by name or email"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {/* Role Filter */}
        <div className="w-full md:w-1/4">
          <label htmlFor="role-filter" className="sr-only">Filter by role</label>
          <select
            id="role-filter"
            className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admins</option>
            <option value="seller">Sellers</option>
            <option value="user">Regular Users</option>
          </select>
        </div>
        
        {/* Page Size */}
        <div className="w-full md:w-1/5">
          <label htmlFor="page-size" className="sr-only">Items per page</label>
          <select
            id="page-size"
            className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            <option value="5">5 per page</option>
            <option value="10">10 per page</option>
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
          </select>
        </div>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roles</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email Verified</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.length === 0 && !loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                  {searchTerm || roleFilter !== 'all' ? 'No users match the current filters' : 'No users found'}
                </td>
              </tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {user.displayName || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {user.roles?.includes('admin') && (
                        <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                          Admin
                        </span>
                      )}
                      {user.roles?.includes('seller') && (
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          Seller
                        </span>
                      )}
                      {(!user.roles || user.roles.length === 0 || (user.roles.length === 1 && user.roles.includes('user'))) && (
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                          User
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {user.createdAt?.toDate ? 
                        user.createdAt.toDate().toLocaleDateString() : 
                        user.metadata?.creationTime ? 
                          new Date(user.metadata.creationTime).toLocaleDateString() : 
                          'Unknown'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.emailVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {user.emailVerified ? 'Verified' : 'Not Verified'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.disabled ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {user.disabled ? 'Disabled' : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button 
                      onClick={() => openEditModal(user)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Edit Roles
                    </button>
                    <button 
                      onClick={() => toggleEmailVerification(user.id, user.emailVerified)}
                      className="text-purple-600 hover:text-purple-900 mr-3"
                      title={user.emailVerified ? "Mark as unverified" : "Mark as verified"}
                    >
                      {user.emailVerified ? "Unverify" : "Verify"}
                    </button>
                    <button 
                      onClick={() => openConfirmModal(user.disabled ? 'enable' : 'disable', user)}
                      className={user.disabled ? 'text-green-600 hover:text-green-900' : 'text-red-600 hover:text-red-900'}
                    >
                      {user.disabled ? 'Enable' : 'Disable'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {totalUsers > pageSize && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
            <span className="font-medium">{Math.min(currentPage * pageSize, totalUsers)}</span> of{' '}
            <span className="font-medium">{totalUsers}</span> users
          </div>
          <div className="flex space-x-2">
            <button
              onClick={fetchPrevPage}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Previous
            </button>
            <div className="text-gray-700 py-2">
              Page {currentPage} of {totalPages}
            </div>
            <button
              onClick={fetchNextPage}
              disabled={currentPage * pageSize >= totalUsers}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                currentPage * pageSize >= totalUsers ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showModal && editingUser && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Edit User Roles
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 mb-4">
                        User: <span className="font-semibold">{editingUser.email}</span>
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <input 
                            id="role-admin"
                            type="checkbox" 
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            checked={editingUser.roles?.includes('admin') || false}
                            onChange={() => handleRoleToggle('admin')}
                          />
                          <label htmlFor="role-admin" className="ml-2 block text-sm text-gray-900">
                            Admin
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input 
                            id="role-seller"
                            type="checkbox" 
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            checked={editingUser.roles?.includes('seller') || false}
                            onChange={() => handleRoleToggle('seller')}
                          />
                          <label htmlFor="role-seller" className="ml-2 block text-sm text-gray-900">
                            Seller
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input 
                            id="role-user"
                            type="checkbox" 
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            checked={editingUser.roles?.includes('user') || false}
                            onChange={() => handleRoleToggle('user')}
                          />
                          <label htmlFor="role-user" className="ml-2 block text-sm text-gray-900">
                            Regular User
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button 
                  type="button" 
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => updateUserRoles(editingUser.id, editingUser.roles)}
                >
                  Save Changes
                </button>
                <button 
                  type="button" 
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => {
                    setShowModal(false);
                    setEditingUser(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showModal && confirmAction && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${
                    confirmAction.action === 'disable' ? 'bg-red-100' : 'bg-green-100'
                  } sm:mx-0 sm:h-10 sm:w-10`}>
                    <span className={`material-icons ${
                      confirmAction.action === 'disable' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {confirmAction.action === 'disable' ? 'block' : 'check_circle'}
                    </span>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {confirmAction.action === 'disable' ? 'Disable User Account' : 'Enable User Account'}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to {confirmAction.action} the account for <span className="font-semibold">{confirmAction.user.email}</span>?
                        {confirmAction.action === 'disable' && " This will prevent them from logging in."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button 
                  type="button" 
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 ${
                    confirmAction.action === 'disable' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                  } text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    confirmAction.action === 'disable' ? 'focus:ring-red-500' : 'focus:ring-green-500'
                  } sm:ml-3 sm:w-auto sm:text-sm`}
                  onClick={() => toggleUserStatus(confirmAction.user.id, confirmAction.user.disabled)}
                >
                  {confirmAction.action === 'disable' ? 'Disable' : 'Enable'}
                </button>
                <button 
                  type="button" 
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => {
                    setShowModal(false);
                    setConfirmAction(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;