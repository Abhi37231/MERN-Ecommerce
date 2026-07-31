import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Package, MapPin, CreditCard, Clock, ArrowLeft, CheckCircle2, MessageSquarePlus } from 'lucide-react';
import api from '../utils/axios';
import WriteReviewModal from '../components/reviews/WriteReviewModal';

const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedProductToReview, setSelectedProductToReview] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/orders/${id}`);
        const data = res.data?.data || res.data || {};
        setOrder(data.order || res.data?.order);
      } catch (err) {
        console.error('Failed to fetch order:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) return;
    
    setIsCancelling(true);
    try {
      await api.patch(`/orders/${id}/cancel`);
      // Update local state to reflect cancellation
      setOrder(prev => ({ ...prev, status: 'cancelled' }));
    } catch (err) {
      console.error('Failed to cancel order:', err);
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="skeleton h-64 rounded-2xl"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <h2 className="text-xl font-bold mb-4">Order Not Found</h2>
        <Link to="/orders" className="btn btn-primary">Back to Orders</Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-dark-deep min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/orders" className="text-sm font-medium text-gray-500 hover:text-primary-600 flex items-center gap-1 mb-6">
          <ArrowLeft size={16} /> Back to Orders
        </Link>

        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 border border-gray-100 dark:border-gray-800 shadow-sm space-y-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                Order #{order.orderNumber || order._id}
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                Placed on {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`capitalize text-xs font-bold px-3 py-1 rounded-full ${
                order.status === 'delivered' ? 'bg-green-50 text-green-600 dark:bg-green-900/30' :
                order.status === 'cancelled' ? 'bg-red-50 text-red-600 dark:bg-red-900/30' :
                'bg-primary-50 text-primary-600 dark:bg-primary-900/30'
              }`}>
                Status: {order.status}
              </span>
              
              {/* Cancel Button */}
              {(order.status === 'pending' || order.status === 'confirmed') && (
                <button
                  onClick={handleCancelOrder}
                  disabled={isCancelling}
                  className="text-xs font-bold px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-full transition-colors disabled:opacity-50"
                >
                  {isCancelling ? 'Cancelling...' : 'Cancel Order'}
                </button>
              )}
            </div>
          </div>

          {/* Items */}
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Items Ordered</h3>
            <div className="divide-y divide-gray-100 dark:divide-gray-800 border-y border-gray-100 dark:border-gray-800">
              {order.items?.map((item) => (
                <div key={item._id} className="py-4 flex gap-4 items-center">
                  <img src={item.image} alt={item.name} className="w-16 h-20 object-cover rounded-xl bg-gray-100" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-white truncate">{item.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">Qty: {item.quantity}</p>
                    <p className="text-xs font-bold text-primary-600 mt-1">₹{item.price}</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <span className="font-bold text-sm">₹{(item.price * item.quantity).toFixed(2)}</span>
                    {order.status === 'delivered' && item.product && (
                      <button
                        onClick={() => {
                          setSelectedProductToReview({
                            _id: item.product,
                            name: item.name
                          });
                          setReviewModalOpen(true);
                        }}
                        className="text-xs font-medium flex items-center gap-1 text-primary-600 bg-primary-50 dark:bg-primary-900/20 px-2 py-1.5 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors"
                      >
                        <MessageSquarePlus size={14} /> Write Review
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            
            {/* Shipping Address */}
            <div className="bg-gray-50 dark:bg-gray-800/40 p-5 rounded-2xl space-y-2">
              <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <MapPin size={16} className="text-primary-600" /> Shipping Address
              </h4>
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{order.shippingAddress?.fullName}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{order.shippingAddress?.street}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.postalCode}
              </p>
              <p className="text-xs text-gray-500 mt-1">Phone: {order.shippingAddress?.phone}</p>
            </div>

            {/* Payment Summary */}
            <div className="bg-gray-50 dark:bg-gray-800/40 p-5 rounded-2xl space-y-2">
              <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <CreditCard size={16} className="text-primary-600" /> Payment Summary
              </h4>
              
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>Payment Method</span>
                <span className="font-semibold uppercase">{order.payment?.method}</span>
              </div>
              
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>Payment Status</span>
                <span className={`font-bold capitalize ${
                  order.payment?.status === 'paid' ? 'text-green-600' :
                  order.payment?.status === 'failed' ? 'text-red-600' :
                  'text-yellow-600'
                }`}>
                  {order.payment?.status}
                </span>
              </div>

              {order.payment?.transactionId && (
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span>Transaction ID</span>
                  <span className="font-mono text-[10px]">{order.payment.transactionId}</span>
                </div>
              )}

              {order.payment?.paidAt && (
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span>Paid At</span>
                  <span>{new Date(order.payment.paidAt).toLocaleString()}</span>
                </div>
              )}

              {order.payment?.method === 'razorpay' && order.razorpayOrderId && (
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span>Razorpay Order ID</span>
                  <span className="font-mono text-[10px]">{order.razorpayOrderId}</span>
                </div>
              )}

              {order.payment?.method === 'razorpay' && order.razorpayPaymentId && (
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span>Razorpay Payment ID</span>
                  <span className="font-mono text-[10px]">{order.razorpayPaymentId}</span>
                </div>
              )}

              <div className="my-2 border-b border-gray-200 dark:border-gray-700"></div>

              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>Subtotal</span>
                <span>₹{order.subtotal?.toFixed(2)}</span>
              </div>
              {order.couponDiscount > 0 && (
                <div className="flex justify-between text-xs text-green-600">
                  <span>Discount</span>
                  <span>-₹{order.couponDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>Shipping</span>
                <span>₹{order.shippingCost?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700">
                <span>Total Amount</span>
                <span className="text-primary-600">₹{order.totalAmount?.toFixed(2)}</span>
              </div>
            </div>

          </div>

        </div>
      </div>

      <WriteReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        product={selectedProductToReview}
        onSuccess={() => {
          // Optional: You could reload the order here if you wanted to track which items have been reviewed
        }}
      />
    </div>
  );
};

export default OrderDetail;
