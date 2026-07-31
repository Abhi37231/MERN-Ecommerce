import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Package, ArrowRight, Home } from 'lucide-react';
import api from '../utils/axios';

const OrderSuccess = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/orders/${id}`);
        const data = res.data?.data || res.data || {};
        setOrder(data.order || res.data?.order);
      } catch (err) {
        console.error('Failed to load order:', err);
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchOrder();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="skeleton h-64 w-96 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-dark-deep min-h-screen py-16 flex items-center justify-center">
      <div className="max-w-lg mx-auto px-4 w-full">
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-100 dark:border-gray-800 shadow-xl text-center space-y-6">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={48} />
          </div>

          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Order Confirmed!</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Thank you for your purchase. Your order has been placed successfully.
            </p>
          </div>

          {order && (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 text-left space-y-2 border border-gray-100 dark:border-gray-800">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Order Number:</span>
                <span className="font-bold text-gray-900 dark:text-white">{order.orderNumber || order._id}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Payment Method:</span>
                <span className="font-semibold uppercase">{order.payment?.method}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Total Amount:</span>
                <span className="font-bold text-primary-600">₹{order.totalAmount}</span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link to="/orders" className="btn btn-secondary flex-1 py-3 justify-center">
              <Package size={18} className="mr-2" /> View My Orders
            </Link>
            <Link to="/" className="btn btn-primary flex-1 py-3 justify-center">
              <Home size={18} className="mr-2" /> Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
