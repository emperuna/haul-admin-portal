import { useState, useEffect } from 'react';
import { db } from '../../../services/firebase';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

const SellerRequestsList = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      
      // Get ALL documents to see if any exist
      const q = query(collection(db, "sellers"), where("status", "==", "pending"));
      
      const querySnapshot = await getDocs(q);
      console.log(`Found ${querySnapshot.size} documents`);
      
      // Log each document to inspect data
      querySnapshot.forEach((doc) => {
        console.log("Document ID:", doc.id);
        console.log("Document data:", doc.data());
      });
      
      const sellerRequests = [];
      
      querySnapshot.forEach((doc) => {
        sellerRequests.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setRequests(sellerRequests);
      setError(null);
    } catch (err) {
      console.error("Error fetching seller requests:", err);
      setError("Failed to load seller requests. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const approveRequest = async (requestId, userId) => {
    try {
      // 1. Update the seller document status
      const requestRef = doc(db, "sellers", requestId);
      await updateDoc(requestRef, {
        status: "approved",
        verificationStatus: "approved",
        updatedAt: new Date()
      });
      
      // 2. Update the user's roles in users collection
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        roles: ["seller", "user"],
        updatedAt: new Date()
      });
      
      // No need for step 3 (create new entry) since we're reusing the same document
      // Just refresh the list after approval
      fetchRequests();
      
    } catch (error) {
      console.error("Error approving request:", error);
      setError("Failed to approve seller request. Please try again.");
    }
  };

  const rejectRequest = async (requestId, userId) => {
    try {
      // Update the seller document status
      const requestRef = doc(db, "sellers", requestId);
      await updateDoc(requestRef, {
        status: "rejected",
        verificationStatus: "rejected",
        updatedAt: new Date()
      });
      
      // Refresh the list
      fetchRequests();
    } catch (error) {
      console.error("Error rejecting request:", error);
      setError("Failed to reject seller request. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4">
        <p className="text-red-700">{error}</p>
        <button 
          onClick={fetchRequests}
          className="mt-2 text-sm text-red-700 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div>
      {requests.length === 0 ? (
        <p className="text-center py-4 text-gray-500">No pending seller applications</p>
      ) : (
        <div className="space-y-6">
          {requests.map(request => (
            <div key={request.id} className="border rounded-lg overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <h3 className="text-lg font-semibold text-gray-900">{request.businessName || 'Unnamed Business'}</h3>
                <p className="text-sm text-gray-500">Submitted: {request.verificationSubmittedAt?.toDate?.() ? 
                  request.verificationSubmittedAt.toDate().toLocaleDateString() : 'Unknown'}</p>
              </div>
              
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Personal Information */}
                <div className="md:col-span-2">
                  <h4 className="font-medium text-gray-900 mb-2">Personal Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium">{request.firstName} {request.lastName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{request.phoneNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date of Birth</p>
                      <p className="font-medium">
                        {request.dateOfBirth?.toDate?.() ? 
                          request.dateOfBirth.toDate().toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">SSN (Last 4)</p>
                      <p className="font-medium">xxx-xx-{request.ssnLast4}</p>
                    </div>
                  </div>
                </div>
                
                {/* Business Information */}
                <div className="md:col-span-2 mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Business Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm text-gray-500">Business Name</p>
                      <p className="font-medium">{request.businessName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">User ID</p>
                      <p className="font-medium">{request.userId}</p>
                    </div>
                  </div>
                </div>
                
                {/* Address */}
                <div className="md:col-span-2 mt-2">
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium">
                    {request.addressLine1}, {request.city}, {request.province}, {request.region}, {request.country}, {request.zipCode}
                  </p>
                </div>
                
                {/* ID Verification */}
                <div className="md:col-span-2 mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">ID Verification</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">ID Front</p>
                      {request.idFrontUrl && (
                        <a href={request.idFrontUrl} target="_blank" rel="noopener noreferrer" 
                          className="block border rounded overflow-hidden">
                          <img src={request.idFrontUrl} alt="ID Front" 
                            className="w-full h-40 object-cover hover:opacity-90 transition-opacity" />
                        </a>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">ID Back</p>
                      {request.idBackUrl && (
                        <a href={request.idBackUrl} target="_blank" rel="noopener noreferrer" 
                          className="block border rounded overflow-hidden">
                          <img src={request.idBackUrl} alt="ID Back" 
                            className="w-full h-40 object-cover hover:opacity-90 transition-opacity" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 flex justify-end space-x-3 border-t">
                <button 
                  onClick={() => rejectRequest(request.id, request.userId)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Reject
                </button>
                <button 
                  onClick={() => approveRequest(request.id, request.userId)}
                  className="px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700"
                >
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SellerRequestsList;
