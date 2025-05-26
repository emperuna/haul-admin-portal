import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, where, orderBy, limit, startAfter, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { getAuth } from "firebase/auth";

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingProduct, setEditingProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  
  // Pagination
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [lastVisible, setLastVisible] = useState(null);

  useEffect(() => {
    checkAdminAndFetchProducts();
  }, [pageSize]);
  
  // Apply filters whenever products, searchTerm, or filters change
  useEffect(() => {
    applyFilters();
  }, [products, searchTerm, categoryFilter, statusFilter]);

  const checkAdminAndFetchProducts = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        console.error("No user is signed in");
        alert("You must be signed in to view this page");
        setLoading(false);
        return;
      }
      
      // Check if user has admin role
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists() && userDoc.data().roles?.includes('admin')) {
        fetchProducts();
      } else {
        console.error("User is not an admin");
        alert("You don't have permission to view this page");
        setLoading(false);
      }
    } catch (err) {
      console.error("Error checking admin status:", err);
      alert("Authentication error. Please try again.");
      setLoading(false);
    }
  };

  const fetchProducts = async (startAfterDoc = null) => {
    try {
      setLoading(true);
      
      // Create query
      let productsQuery = query(
        collection(db, "products"),
        orderBy("createdAt", "desc"),
        limit(pageSize)
      );
      
      // If we have a starting document for pagination
      if (startAfterDoc) {
        const docRef = doc(db, "products", startAfterDoc);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          productsQuery = query(
            collection(db, "products"),
            orderBy("createdAt", "desc"),
            startAfter(docSnap),
            limit(pageSize)
          );
        }
      }
      
      // Execute query
      const querySnapshot = await getDocs(productsQuery);
      
      // Get total count
      const totalSnapshot = await getDocs(collection(db, "products"));
      const total = totalSnapshot.size;
      
      // Process results
      const productData = [];
      querySnapshot.forEach((doc) => {
        productData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Update state
      setProducts(productData);
      setFilteredProducts(productData);
      setTotalProducts(total);
      
      // Set last visible document for pagination
      const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      setLastVisible(lastDoc?.id || null);
      
      // Update page number
      setCurrentPage(startAfterDoc ? currentPage + 1 : 1);
      
    } catch (error) {
      console.error("Error fetching products:", error);
      alert("Failed to load products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...products];
    
    // Apply search term filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(product => 
        (product.name && product.name.toLowerCase().includes(searchLower)) ||
        (product.description && product.description.toLowerCase().includes(searchLower)) ||
        (product.brand && product.brand.toLowerCase().includes(searchLower)) ||
        (product.sku && product.sku.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => 
        product.category && product.category.toLowerCase() === categoryFilter.toLowerCase()
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter(product => product.isActive === true);
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter(product => product.isActive === false);
      } else if (statusFilter === 'lowstock') {
        filtered = filtered.filter(product => product.currentStock <= (product.minimumStock || 5));
      } else if (statusFilter === 'outofstock') {
        filtered = filtered.filter(product => product.currentStock === 0);
      }
    }
    
    setFilteredProducts(filtered);
  };

  const toggleProductStatus = async (productId, currentStatus) => {
    try {
      const productRef = doc(db, "products", productId);
      await updateDoc(productRef, {
        isActive: !currentStatus,
        updatedAt: new Date()
      });
      
      // Update local state
      setProducts(products.map(product => 
        product.id === productId 
          ? { ...product, isActive: !currentStatus }
          : product
      ));
      
      // Close any open modal
      setShowModal(false);
      setConfirmAction(null);
    } catch (error) {
      console.error("Error toggling product status:", error);
      alert("Failed to update product status: " + error.message);
    }
  };

  const deleteProduct = async (productId) => {
    try {
      await deleteDoc(doc(db, "products", productId));
      
      // Remove from local state
      setProducts(products.filter(product => product.id !== productId));
      
      // Close modal
      setShowModal(false);
      setConfirmAction(null);
      
      alert("Product deleted successfully");
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product: " + error.message);
    }
  };

  const updateProductStock = async (productId, newStock) => {
    try {
      const productRef = doc(db, "products", productId);
      await updateDoc(productRef, {
        currentStock: newStock,
        updatedAt: new Date()
      });
      
      // Update local state
      setProducts(products.map(product => 
        product.id === productId 
          ? { ...product, currentStock: newStock }
          : product
      ));
      
      // Close modal
      setShowModal(false);
      setEditingProduct(null);
    } catch (error) {
      console.error("Error updating stock:", error);
      alert("Failed to update stock: " + error.message);
    }
  };

  const openEditModal = (product) => {
    setEditingProduct({
      ...product,
      newStock: product.currentStock
    });
    setShowModal(true);
  };

  const openConfirmModal = (action, product) => {
    setConfirmAction({
      action,
      product
    });
    setShowModal(true);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(price || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStockStatus = (product) => {
    if (product.currentStock === 0) return { status: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    if (product.currentStock <= (product.minimumStock || 5)) return { status: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    return { status: 'In Stock', color: 'bg-green-100 text-green-800' };
  };

  const fetchNextPage = () => {
    if (lastVisible) {
      setCurrentPage(currentPage + 1);
      fetchProducts(lastVisible);
    }
  };

  const fetchPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      fetchProducts();
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const totalPages = Math.ceil(totalProducts / pageSize);

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Product Management</h2>
      
      {/* Filters */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="w-full md:w-1/3">
          <input
            type="text"
            placeholder="Search products..."
            className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Category Filter */}
        <div className="w-full md:w-1/4">
          <select
            className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="clothing">Clothing</option>
            <option value="electronics">Electronics</option>
            <option value="accessories">Accessories</option>
            <option value="home">Home & Garden</option>
            <option value="books">Books</option>
            <option value="sports">Sports</option>
          </select>
        </div>
        
        {/* Status Filter */}
        <div className="w-full md:w-1/4">
          <select
            className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="lowstock">Low Stock</option>
            <option value="outofstock">Out of Stock</option>
          </select>
        </div>
        
        {/* Page Size */}
        <div className="w-full md:w-1/6">
          <select
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
      
      {/* Products Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProducts.length === 0 && !loading ? (
              <tr>
                <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                  {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' ? 'No products match the current filters' : 'No products found'}
                </td>
              </tr>
            ) : (
              filteredProducts.map(product => {
                const stockStatus = getStockStatus(product);
                return (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          {product.images && product.images.length > 0 ? (
                            <img className="h-12 w-12 rounded-md object-cover" src={product.images[0]} alt={product.name} />
                          ) : (
                            <div className="h-12 w-12 rounded-md bg-gray-100 flex items-center justify-center">
                              <span className="text-gray-400 text-xs">No Image</span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.sku || 'No SKU'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatPrice(product.sellingPrice)}</div>
                      {product.salePrice && (
                        <div className="text-sm text-green-600">Sale: {formatPrice(product.salePrice)}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${stockStatus.color}`}>
                        {product.currentStock} {stockStatus.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.category || 'Uncategorized'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.sellerId ? product.sellerId.substring(0, 8) + '...' : 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(product.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button 
                        onClick={() => openEditModal(product)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit Stock
                      </button>
                      <button 
                        onClick={() => openConfirmModal(product.isActive ? 'deactivate' : 'activate', product)}
                        className={product.isActive ? 'text-yellow-600 hover:text-yellow-900 mr-3' : 'text-green-600 hover:text-green-900 mr-3'}
                      >
                        {product.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button 
                        onClick={() => openConfirmModal('delete', product)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {totalProducts > pageSize && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
            <span className="font-medium">{Math.min(currentPage * pageSize, totalProducts)}</span> of{' '}
            <span className="font-medium">{totalProducts}</span> products
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
              disabled={currentPage * pageSize >= totalProducts}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                currentPage * pageSize >= totalProducts ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Edit Stock Modal */}
      {showModal && editingProduct && (
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
                      Update Stock
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 mb-4">
                        Product: <span className="font-semibold">{editingProduct.name}</span>
                      </p>
                      <div className="mt-4">
                        <label htmlFor="stock" className="block text-sm font-medium text-gray-700">
                          Current Stock: {editingProduct.currentStock}
                        </label>
                        <input
                          type="number"
                          id="stock"
                          min="0"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          value={editingProduct.newStock}
                          onChange={(e) => setEditingProduct({
                            ...editingProduct,
                            newStock: parseInt(e.target.value) || 0
                          })}
                          placeholder="Enter new stock quantity"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button 
                  type="button" 
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => updateProductStock(editingProduct.id, editingProduct.newStock)}
                >
                  Update Stock
                </button>
                <button 
                  type="button" 
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => {
                    setShowModal(false);
                    setEditingProduct(null);
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
                    confirmAction.action === 'delete' ? 'bg-red-100' : 'bg-yellow-100'
                  } sm:mx-0 sm:h-10 sm:w-10`}>
                    <span className={`material-icons ${
                      confirmAction.action === 'delete' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {confirmAction.action === 'delete' ? 'delete' : 'edit'}
                    </span>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {confirmAction.action === 'delete' ? 'Delete Product' : 
                       confirmAction.action === 'activate' ? 'Activate Product' : 'Deactivate Product'}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to {confirmAction.action} <span className="font-semibold">{confirmAction.product.name}</span>?
                        {confirmAction.action === 'delete' && " This action cannot be undone."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button 
                  type="button" 
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 ${
                    confirmAction.action === 'delete' ? 'bg-red-600 hover:bg-red-700' : 
                    confirmAction.action === 'activate' ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'
                  } text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    confirmAction.action === 'delete' ? 'focus:ring-red-500' : 
                    confirmAction.action === 'activate' ? 'focus:ring-green-500' : 'focus:ring-yellow-500'
                  } sm:ml-3 sm:w-auto sm:text-sm`}
                  onClick={() => {
                    if (confirmAction.action === 'delete') {
                      deleteProduct(confirmAction.product.id);
                    } else {
                      toggleProductStatus(confirmAction.product.id, confirmAction.product.isActive);
                    }
                  }}
                >
                  {confirmAction.action === 'delete' ? 'Delete' : 
                   confirmAction.action === 'activate' ? 'Activate' : 'Deactivate'}
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

export default ProductManagement;