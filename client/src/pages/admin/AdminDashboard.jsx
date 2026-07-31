import { useEffect, useState } from 'react';
import { ShoppingBag, Users, DollarSign, Package, TrendingUp, AlertTriangle } from 'lucide-react';
import api from '../../utils/axios';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [ordersRes, productsRes, usersRes, lowStockRes] = await Promise.all([
          api.get('/orders?limit=5'),
          api.get('/products?limit=1'),
          api.get('/users?limit=1'),
          api.get('/products/low-stock?threshold=10'),
        ]);

        const orders = ordersRes.data?.data?.orders || ordersRes.data?.orders || [];
        const totalSales = orders
          .filter((o) => o.status !== 'cancelled')
          .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

        setStats({
          totalSales,
          totalOrders: ordersRes.data?.data?.pagination?.totalItems || ordersRes.data?.pagination?.totalItems || orders.length,
          totalProducts: productsRes.data?.data?.pagination?.totalItems || productsRes.data?.pagination?.totalItems || 0,
          totalUsers: usersRes.data?.data?.pagination?.totalItems || usersRes.data?.pagination?.totalItems || 0,
        });

        setRecentOrders(orders);
        setLowStockProducts(lowStockRes.data?.data?.products || lowStockRes.data?.products || []);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-32 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-sm text-gray-500">Overview of store performance and management</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 flex items-center justify-center">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500">Recent Revenue</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">₹{stats.totalSales.toFixed(2)}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center">
            <ShoppingBag size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Orders</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalOrders}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 flex items-center justify-center">
            <Package size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Products</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalProducts}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-600 flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500">Registered Users</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalUsers}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Recent Orders */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <ShoppingBag size={18} className="text-primary-600" /> Recent Orders
          </h3>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-gray-500">No recent orders</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {recentOrders.map((ord) => (
                <div key={ord._id} className="py-3 flex justify-between items-center text-sm">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">#{ord.orderNumber || ord._id.slice(-6)}</p>
                    <p className="text-xs text-gray-500">{ord.user?.email || 'Customer'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary-600">₹{ord.totalAmount}</p>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800">
                      {ord.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Warning */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" /> Low Stock Alerts
          </h3>
          {lowStockProducts.length === 0 ? (
            <p className="text-sm text-gray-500">All products are adequately stocked.</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {lowStockProducts.map((p) => (
                <div key={p._id} className="py-3 flex justify-between items-center text-sm">
                  <div className="flex items-center gap-3">
                    <img src={p.images?.[0]?.url || 'https://via.placeholder.com/50'} alt={p.name} className="w-10 h-10 object-cover rounded-lg bg-gray-100" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white truncate max-w-xs">{p.name}</p>
                      <p className="text-xs text-gray-500">SKU: {p.sku || 'N/A'}</p>
                    </div>
                  </div>
                  <span className="font-bold text-xs text-red-500 px-2 py-1 bg-red-50 dark:bg-red-900/20 rounded-md">
                    {p.stock} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
