import React from 'react';
import SellerRequestsList from '../components/features/sellers/SellerRequestsList';

const SellerRequests = () => {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Seller Applications</h2>
      <div className="bg-white shadow rounded-lg p-6">
        <SellerRequestsList />
      </div>
    </div>
  );
};

export default SellerRequests;
