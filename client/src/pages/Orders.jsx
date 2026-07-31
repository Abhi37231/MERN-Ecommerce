import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight, Clock, CheckCircle2, Truck, XCircle } from 'lucide-react';
import api from '../utils/axios';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders/my-orders');
        const data = res.data?.data || res.data || {};
        setOrders(data.orders || res.data?.orders || []);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1">
            <CheckCircle2 size={12} /> Delivered
          </span>
        );
      case 'shipped':
        return (
          <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1">
            <Truck size={12} /> Shipped
          </span>
        );
      case 'cancelled':
        return (
          <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1">
            <XCircle size={12} /> Cancelled
          </span>
        );
      default:
        return (
          <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1">
            <Clock size={12} /> Processing
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-4">
        <div className="skeleton h-8 w-48 rounded mb-6"></div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton h-32 rounded-2xl"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-dark-deep min-h-screen py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-8 flex items-center gap-3">
          <Package className="text-primary-600" /> My Orders
        </h1>

        {orders.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-12 text-center border border-gray-100 dark:border-gray-800 shadow-sm">
            <Package size={48} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No orders yet</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              When you place an order, it will appear here.
            </p>
            <Link to="/products" className="btn btn-primary px-6 py-2.5">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((ord) => (
              <div
                key={ord._id}
                className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-bold text-gray-900 dark:text-white text-lg">
                      Order #{ord.orderNumber || ord._id.slice(-8)}
                    </span>
                    {getStatusBadge(ord.status)}
                  </div>
                  <p className="text-xs text-gray-500">
                    Placed on {new Date(ord.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    {ord.items?.length} {ord.items?.length === 1 ? 'item' : 'items'} • Total: <span className="font-bold text-gray-900 dark:text-white">₹{ord.totalAmount}</span>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    to={`/orders/${ord._id}`}
                    className="btn btn-secondary text-sm py-2 px-4 flex items-center gap-1"
                  >
                    View Details <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
