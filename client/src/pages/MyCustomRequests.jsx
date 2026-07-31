import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyRequests, acceptQuote } from '../redux/slices/customRequestSlice';
import { toast } from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';

const MyCustomRequests = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { requests, loading } = useSelector((state) => state.customRequests);

  useEffect(() => {
    dispatch(fetchMyRequests());
  }, [dispatch]);

  const handleAcceptQuote = async (id) => {
    try {
      await dispatch(acceptQuote(id)).unwrap();
      toast.success('Quote accepted! Proceeding to checkout...');
      // Normally we would redirect to a specific checkout flow for this dummy order
      // navigate(`/checkout?customRequestId=${id}`);
    } catch (error) {
      toast.error(error || 'Failed to accept quote');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      quoted: 'bg-blue-100 text-blue-800 border-blue-200',
      accepted: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      ordered: 'bg-purple-100 text-purple-800 border-purple-200',
    };
    return `px-3 py-1 rounded-full text-xs font-medium border ${statusConfig[status] || 'bg-gray-100 text-gray-800'}`;
  };

  if (loading && requests.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-64 bg-gray-200 rounded mb-8"></div>
          <div className="w-full max-w-4xl h-64 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex justify-between items-end mb-8 border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h1 className="text-3xl font-serif text-gray-900 dark:text-white mb-2">My Custom Requests</h1>
          <p className="text-gray-500 dark:text-gray-400 font-light">Track the status of your bespoke commissions.</p>
        </div>
        <Link to="/custom-request" className="btn btn-secondary shadow-sm hover:shadow">
          New Request
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-24 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No custom requests yet</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 mb-6">Have an idea? Let's build it together.</p>
          <Link to="/custom-request" className="btn btn-primary px-6">
            Start a Commission
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {requests.map((request) => (
            <div key={request._id} className="bg-white dark:bg-dark-light rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-all hover:shadow-md">
              <div className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  
                  {/* Images */}
                  <div className="flex-shrink-0 w-full md:w-48 h-48 rounded-lg overflow-hidden bg-gray-100">
                    {request.referenceImages && request.referenceImages[0] ? (
                      <img src={request.referenceImages[0].url} alt="Reference" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-grow flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-xs text-gray-500 mb-1 block">
                          Requested on {new Date(request.createdAt).toLocaleDateString()}
                        </span>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          Commission #{request._id.toString().substring(18).toUpperCase()}
                        </h3>
                      </div>
                      <span className={getStatusBadge(request.status)}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-300 mb-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                      <div><strong className="text-gray-900 dark:text-gray-100">Color:</strong> {request.specifications.color || 'N/A'}</div>
                      <div><strong className="text-gray-900 dark:text-gray-100">Size:</strong> {request.specifications.size || 'N/A'}</div>
                      <div><strong className="text-gray-900 dark:text-gray-100">Material:</strong> {request.specifications.material || 'N/A'}</div>
                    </div>
                    
                    {request.specifications.notes && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic mb-4 line-clamp-2">"{request.specifications.notes}"</p>
                    )}

                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                      <div>
                        {request.priceQuote ? (
                          <div className="text-lg font-serif text-gray-900 dark:text-white">
                            Quote: <span className="text-primary-600 font-semibold">₹{request.priceQuote.toLocaleString()}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Awaiting artisan's quote...</span>
                        )}
                      </div>

                      {request.status === 'quoted' && (
                        <button
                          onClick={() => handleAcceptQuote(request._id)}
                          className="btn btn-primary"
                        >
                          Accept & Pay
                        </button>
                      )}
                      
                      {request.adminNotes && (
                        <div className="text-sm text-gray-600 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded ml-4 border border-yellow-100 dark:border-yellow-800/50 flex-grow">
                          <strong>Note from Artisan:</strong> {request.adminNotes}
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCustomRequests;
