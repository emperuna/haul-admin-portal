import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

function SellerRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "sellers"), 
        where("status", "==", "pending")
      );
      
      const querySnapshot = await getDocs(q);
      const requestsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setRequests(requestsData);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const approveRequest = async (requestId, userId) => {
    try {
      // Update seller status
      await updateDoc(doc(db, "sellers", userId), {
        status: "approved",
        approvedAt: new Date()
      });
      
      // Update user roles
      await updateDoc(doc(db, "users", userId), {
        roles: ["user", "seller"],
        sellerStatus: "approved"
      });
      
      // Refresh requests list
      fetchRequests();
    } catch (error) {
      console.error("Error approving request:", error);
    }
  };

  const rejectRequest = async (requestId, userId) => {
    try {
      await updateDoc(doc(db, "sellers", userId), {
        status: "rejected",
        rejectedAt: new Date()
      });
      
      await updateDoc(doc(db, "users", userId), {
        sellerStatus: "rejected"
      });
      
      fetchRequests();
    } catch (error) {
      console.error("Error rejecting request:", error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="seller-requests">
      <h2>Pending Seller Requests</h2>
      {requests.length === 0 ? (
        <p>No pending requests</p>
      ) : (
        <div className="requests-list">
          {requests.map(request => (
            <div key={request.id} className="request-card">
              <h3>{request.businessName}</h3>
              <div className="user-details">
                <p><strong>User ID:</strong> {request.userId}</p>
                <p><strong>Address:</strong> {request.addressLine1}, {request.city}</p>
                <p><strong>Region:</strong> {request.region}</p>
                <p><strong>Country:</strong> {request.country}</p>
                <p><strong>Date Requested:</strong> {request.createdAt?.toDate().toLocaleDateString()}</p>
              </div>
              
              <div className="request-actions">
                <button 
                  className="reject-btn"
                  onClick={() => rejectRequest(request.id, request.userId)}
                >
                  Reject
                </button>
                <button 
                  className="approve-btn"
                  onClick={() => approveRequest(request.id, request.userId)}
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
}

export default SellerRequests;
