import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  LayoutDashboard, 
  Package, 
  Tags, 
  Users, 
  ShoppingCart, 
  MessageSquare,
  Ticket,
  LogOut,
  Menu,
  X,
  Settings,
  ChevronLeft
} from 'lucide-react';
import { logout } from '../redux/slices/authSlice';
import toast from 'react-hot-toast';
import api from '../utils/axios';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { user } = useSelector((state) => state.auth);

  // Check if admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast.error('Unauthorized access. Admin privileges required.');
      navigate('/');
    }
  }, [user, navigate]);

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsMobile(true);
        setIsSidebarOpen(false);
      } else {
        setIsMobile(false);
        setIsSidebarOpen(true);
      }
    };
    
    // Initial check
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on mobile route change
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      dispatch(logout());
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const menuItems = [
    { path: '/admin', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/admin/products', icon: <Package size={20} />, label: 'Products' },
    { path: '/admin/categories', icon: <Tags size={20} />, label: 'Categories' },
    { path: '/admin/orders', icon: <ShoppingCart size={20} />, label: 'Orders' },
    { path: '/admin/users', icon: <Users size={20} />, label: 'Customers' },
    { path: '/admin/reviews', icon: <MessageSquare size={20} />, label: 'Reviews' },
    { path: '/admin/coupons', icon: <Ticket size={20} />, label: 'Coupons' },
    { path: '/admin/settings', icon: <Settings size={20} />, label: 'Settings' },
  ];

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-dark-deep font-sans">
      
      {/* Mobile Sidebar Overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-transform duration-300 ease-in-out transform flex flex-col ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-20'
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 lg:px-6 border-b border-gray-200 dark:border-gray-800">
          <Link to="/" className={`flex items-center ${!isSidebarOpen && !isMobile ? 'lg:hidden' : ''}`}>
            <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              Shop<span className="text-primary-600">Sphere</span>
              <span className="ml-2 text-xs font-normal px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full">Admin</span>
            </span>
          </Link>
          
          {/* Logo icon only (when collapsed on desktop) */}
          {!isSidebarOpen && !isMobile && (
            <Link to="/" className="mx-auto font-bold text-xl text-primary-600">
              S.
            </Link>
          )}

          {isMobile && (
            <button onClick={() => setIsSidebarOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-white">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 py-2.5 rounded-lg transition-colors group ${
                  isActive 
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                } ${!isSidebarOpen && !isMobile ? 'lg:justify-center' : ''}`}
                title={(!isSidebarOpen && !isMobile) ? item.label : ""}
              >
                <span className={`${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`}>
                  {item.icon}
                </span>
                
                {/* Text (hidden when collapsed on desktop) */}
                <span className={`ml-3 ${!isSidebarOpen && !isMobile ? 'lg:hidden' : ''}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer (User Info & Logout) */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className={`flex items-center ${!isSidebarOpen && !isMobile ? 'lg:justify-center' : ''}`}>
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
              {user?.firstName?.charAt(0) || 'A'}
            </div>
            
            <div className={`ml-3 overflow-hidden ${!isSidebarOpen && !isMobile ? 'lg:hidden' : ''}`}>
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.fullName || 'Admin User'}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className={`mt-4 w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors ${!isSidebarOpen && !isMobile ? 'lg:justify-center' : ''}`}
            title={(!isSidebarOpen && !isMobile) ? "Logout" : ""}
          >
            <LogOut size={18} />
            <span className={`ml-2 ${!isSidebarOpen && !isMobile ? 'lg:hidden' : ''}`}>
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm z-10">
          <div className="flex items-center">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 mr-4 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            >
              <span className="sr-only">Open sidebar</span>
              {isSidebarOpen && !isMobile ? <ChevronLeft size={24} /> : <Menu size={24} />}
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
              {location.pathname.split('/').pop() || 'Dashboard'}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <Link to="/" className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
              View Store
            </Link>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-dark-deep">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
