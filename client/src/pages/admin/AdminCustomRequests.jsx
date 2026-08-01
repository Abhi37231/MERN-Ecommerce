import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllRequests, updateRequestStatus, deleteRequest, addMessage } from '../../redux/slices/customRequestSlice';
import { toast } from 'react-hot-toast';

const AdminCustomRequests = () => {
  const dispatch = useDispatch();
  const { requests, loading } = useSelector((state) => state.customRequests);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [quoteData, setQuoteData] = useState({ priceQuote: '', adminNotes: '', status: '' });
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    dispatch(fetchAllRequests());
  }, [dispatch]);

  const handleOpenModal = (request) => {
    setSelectedRequest(request);
    setQuoteData({
      priceQuote: request.priceQuote || '',
      adminNotes: request.adminNotes || '',
      status: request.status,
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await dispatch(updateRequestStatus({
        id: selectedRequest._id,
        priceQuote: Number(quoteData.priceQuote),
        adminNotes: quoteData.adminNotes,
        status: quoteData.status,
      })).unwrap();
      toast.success('Request updated successfully');
      setSelectedRequest(null);
    } catch (error) {
      toast.error(error || 'Failed to update request');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this request?')) return;
    try {
      await dispatch(deleteRequest(id)).unwrap();
      toast.success('Request deleted successfully');
      if (selectedRequest && selectedRequest._id === id) {
        setSelectedRequest(null);
      }
    } catch (error) {
      toast.error(error || 'Failed to delete request');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      await dispatch(addMessage({ id: selectedRequest._id, text: newMessage })).unwrap();
      setNewMessage('');
      toast.success('Message sent');
      
      // Update selectedRequest locally to show the new message immediately
      const updatedReq = requests.find(r => r._id === selectedRequest._id);
      if (updatedReq) setSelectedRequest(updatedReq);
    } catch (error) {
      toast.error(error || 'Failed to send message');
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'quoted': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'ordered': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Custom Requests</h2>
      </div>

      <div className="bg-white dark:bg-dark-light shadow-sm rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Request ID / Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Specs</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status / Quote</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark-light divide-y divide-gray-200 dark:divide-gray-700">
              {loading && requests.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">Loading requests...</td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">No custom requests found.</td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr key={request._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">#{request._id.toString().substring(18).toUpperCase()}</div>
                      <div className="text-sm text-gray-500">{new Date(request.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{request.user?.firstName} {request.user?.lastName}</div>
                      <div className="text-sm text-gray-500">{request.user?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-500">
                        Color: {request.specifications?.color || 'N/A'}<br/>
                        Size: {request.specifications?.size || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                      {request.priceQuote && (
                        <div className="text-sm text-gray-900 dark:text-white mt-1">₹{request.priceQuote}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleOpenModal(request)}
                        className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-4"
                      >
                        Manage Quote
                      </button>
                      <button
                        onClick={() => handleDelete(request._id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Manage Custom Request</h3>
                <button onClick={() => setSelectedRequest(null)} className="text-gray-400 hover:text-gray-500">
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div><strong>Color:</strong> {selectedRequest.specifications.color}</div>
                <div><strong>Size:</strong> {selectedRequest.specifications.size}</div>
                <div><strong>Material:</strong> {selectedRequest.specifications.material}</div>
                <div className="col-span-2"><strong>Notes:</strong> {selectedRequest.specifications.notes}</div>
              </div>

              <div className="mb-6 flex gap-2 overflow-x-auto">
                {selectedRequest.referenceImages?.map((img, idx) => (
                  <img key={idx} src={img.url} alt="Reference" className="h-24 object-cover rounded shadow-sm border border-gray-200" />
                ))}
              </div>

              {/* Chat Thread */}
              <div className="mb-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 max-h-60 overflow-y-auto">
                <h4 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Conversation</h4>
                <div className="space-y-3">
                  {selectedRequest.messages?.length > 0 ? (
                    selectedRequest.messages.map((msg, idx) => (
                      <div key={idx} className={`flex flex-col ${msg.isAdmin ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${msg.isAdmin ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500'}`}>
                          <p>{msg.text}</p>
                          <span className="text-[10px] opacity-75 mt-1 block">{new Date(msg.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500 text-center">No messages yet.</p>
                  )}
                </div>
                
                <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Ask customer for details..."
                    className="input-field text-sm py-1.5 flex-1"
                  />
                  <button type="submit" className="btn btn-primary px-3 py-1.5 text-sm">Send</button>
                </form>
              </div>

              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quote Price (₹)</label>
                  <input
                    type="number"
                    value={quoteData.priceQuote}
                    onChange={(e) => setQuoteData({ ...quoteData, priceQuote: e.target.value })}
                    className="input-field"
                    placeholder="Enter price..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Admin Notes (Message to customer)</label>
                  <textarea
                    value={quoteData.adminNotes}
                    onChange={(e) => setQuoteData({ ...quoteData, adminNotes: e.target.value })}
                    className="input-field"
                    rows="3"
                    placeholder="Details about timeline, adjustments, etc..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                  <select
                    value={quoteData.status}
                    onChange={(e) => setQuoteData({ ...quoteData, status: e.target.value })}
                    className="input-field"
                  >
                    <option value="pending">Pending</option>
                    <option value="quoted">Quoted (Sent to customer)</option>
                    <option value="accepted">Accepted (Customer agreed)</option>
                    <option value="rejected">Rejected (Cannot fulfill)</option>
                    <option value="ordered">Ordered (Paid & In Progress)</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => setSelectedRequest(null)} className="btn btn-secondary">Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomRequests;
