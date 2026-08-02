import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  ShoppingBag, 
  Search, 
  User, 
  Heart, 
  Menu, 
  X, 
  LogOut,
  LayoutDashboard,
  Settings,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { openCart } from '../../redux/slices/cartSlice';
import { logout } from '../../redux/slices/authSlice';
import { fetchNotifications, markAsRead, markAllAsRead, deleteNotification } from '../../redux/slices/notificationSlice';
import toast from 'react-hot-toast';
import api from '../../utils/axios';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { totalItems } = useSelector((state) => state.cart);
  const { notifications } = useSelector((state) => state.notifications);
  
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const unreadCount = notifications?.filter(n => !n.read)?.length || 0;
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchNotifications());
    }
  }, [dispatch, isAuthenticated]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const closeDropdowns = (e) => {
      if (isProfileDropdownOpen && !e.target.closest('.profile-dropdown-container')) {
        setIsProfileDropdownOpen(false);
      }
      if (isNotificationsOpen && !e.target.closest('.notifications-dropdown-container')) {
        setIsNotificationsOpen(false);
      }
      if (showSuggestions && !e.target.closest('.search-container')) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('click', closeDropdowns);
    return () => document.removeEventListener('click', closeDropdowns);
  }, [isProfileDropdownOpen, isNotificationsOpen, showSuggestions]);

  // Handle search suggestions
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await api.get(`/products?search=${encodeURIComponent(searchQuery.trim())}&limit=5`);
        const data = res.data?.data || res.data || {};
        const products = data.products || res.data?.products || [];
        setSuggestions(products);
        setShowSuggestions(true);
      } catch (err) {
        console.error(err);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      dispatch(markAsRead(notification._id));
    }
    setIsNotificationsOpen(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleDeleteNotification = (e, id) => {
    e.stopPropagation();
    dispatch(deleteNotification(id));
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      dispatch(logout());
      setIsProfileDropdownOpen(false);
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/products' },
    { name: 'Categories', path: '/categories' },
    { name: 'Custom Orders', path: '/custom-request' },
  ];

  return (
    <>
      <nav 
        className={`fixed top-0 left-0 right-0 z-[110] transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm py-3' 
            : 'bg-white dark:bg-dark-deep py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            
            {/* Logo */}
            <Link to="/" className="flex-shrink-0 flex items-center z-50">
              <span className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                Craft<span className="text-primary-600 dark:text-primary-500">ora</span>.
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-8">
              {navLinks.map((link) => (
                <NavLink
                  key={link.name}
                  to={link.path}
                  className={({ isActive }) => 
                    `text-sm font-medium transition-colors hover:text-primary-600 dark:hover:text-primary-400 ${
                      isActive 
                        ? 'text-primary-600 dark:text-primary-400' 
                        : 'text-gray-600 dark:text-gray-300'
                    }`
                  }
                >
                  {link.name}
                </NavLink>
              ))}
            </div>

            {/* Right Side Icons */}
            <div className="flex items-center space-x-4 md:space-x-6 z-50">
              {/* Search Icon */}
              <button 
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 transition-colors"
              >
                {isSearchOpen ? <X size={20} /> : <Search size={20} />}
              </button>

              {/* Wishlist Icon (Auth only) */}
              {isAuthenticated && (
                <Link to="/wishlist" className="hidden sm:block text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 transition-colors">
                  <Heart size={20} />
                </Link>
              )}

              {/* Notification Icon (Auth only) */}
              {isAuthenticated && (
                <div className="relative notifications-dropdown-container">
                  <button 
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className="relative text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 transition-colors mt-1"
                  >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-white dark:border-gray-900">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {isNotificationsOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="origin-top-right absolute right-0 mt-2 w-80 rounded-xl shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden flex flex-col max-h-[80vh]"
                      >
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
                          {unreadCount > 0 && (
                            <button onClick={() => dispatch(markAllAsRead())} className="text-xs text-primary-600 hover:text-primary-700 font-medium">Mark all as read</button>
                          )}
                        </div>
                        <div className="overflow-y-auto flex-1">
                          {notifications?.length > 0 ? (
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                              {notifications.map((notification) => (
                                <div 
                                  key={notification._id} 
                                  onClick={() => handleNotificationClick(notification)}
                                  className={`px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group relative ${!notification.read ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}
                                >
                                  <button
                                    onClick={(e) => handleDeleteNotification(e, notification._id)}
                                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                                    title="Remove notification"
                                  >
                                    <X size={14} />
                                  </button>
                                  <div className="flex justify-between items-start mb-1 pr-6">
                                    <h4 className={`text-sm ${!notification.read ? 'font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                                      {notification.title}
                                    </h4>
                                    {!notification.read && <span className="w-2 h-2 rounded-full bg-primary-600 mt-1.5 flex-shrink-0"></span>}
                                  </div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                                    {notification.message}
                                  </p>
                                  <p className="text-[10px] text-gray-400 mt-1">
                                    {new Date(notification.createdAt).toLocaleString()}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="px-4 py-8 text-center text-sm text-gray-500">
                              No notifications yet
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Cart Icon */}
              <button 
                onClick={() => dispatch(openCart())}
                className="relative text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 transition-colors"
              >
                <ShoppingBag size={20} />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-primary-600 rounded-full">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </button>

              {/* User Profile / Login */}
              {isAuthenticated ? (
                <div className="relative profile-dropdown-container">
                  <button 
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="flex text-sm border-2 border-transparent rounded-full focus:outline-none focus:border-primary-500 transition-all"
                  >
                    {user?.avatar?.url ? (
                      <img 
                        className="h-8 w-8 rounded-full object-cover" 
                        src={user.avatar.url} 
                        alt={user.firstName} 
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 flex items-center justify-center font-bold text-sm">
                        {user?.firstName?.charAt(0) || 'U'}
                      </div>
                    )}
                  </button>

                  {/* Profile Dropdown */}
                  <AnimatePresence>
                    {isProfileDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="origin-top-right absolute right-0 mt-2 w-48 rounded-xl shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 dark:divide-gray-700 focus:outline-none"
                      >
                        <div className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {user.fullName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {user.email}
                          </p>
                        </div>
                        <div className="py-1">
                          <Link to="/profile" onClick={() => setIsProfileDropdownOpen(false)} className="group flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                            <User className="mr-3 h-4 w-4 text-gray-400 group-hover:text-primary-500" />
                            My Profile
                          </Link>
                          <Link to="/orders" onClick={() => setIsProfileDropdownOpen(false)} className="group flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                            <ShoppingBag className="mr-3 h-4 w-4 text-gray-400 group-hover:text-primary-500" />
                            My Orders
                          </Link>
                          <Link to="/my-custom-requests" onClick={() => setIsProfileDropdownOpen(false)} className="group flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                            <Heart className="mr-3 h-4 w-4 text-gray-400 group-hover:text-primary-500" />
                            My Commissions
                          </Link>
                          {user.role === 'admin' && (
                            <>
                              <Link to="/admin" onClick={() => setIsProfileDropdownOpen(false)} className="group flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                <LayoutDashboard className="mr-3 h-4 w-4 text-gray-400 group-hover:text-primary-500" />
                                Admin Dashboard
                              </Link>
                              <Link to="/admin/custom-requests" onClick={() => setIsProfileDropdownOpen(false)} className="group flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                <LayoutDashboard className="mr-3 h-4 w-4 text-gray-400 group-hover:text-primary-500" />
                                Admin Commissions
                              </Link>
                            </>
                          )}
                        </div>
                        <div className="py-1">
                          <button
                            onClick={handleLogout}
                            className="group flex w-full items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <LogOut className="mr-3 h-4 w-4 text-red-500 group-hover:text-red-600" />
                            Logout
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="hidden sm:flex items-center space-x-4">
                  <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 transition-colors">
                    Log in
                  </Link>
                  <Link to="/register" className="btn btn-primary px-4 py-1.5 text-sm">
                    Sign up
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
              <div className="flex md:hidden items-center">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="text-gray-600 hover:text-primary-600 dark:text-gray-300 transition-colors focus:outline-none"
                >
                  {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar Dropdown */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-dark-deep overflow-hidden"
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <form onSubmit={handleSearch} className="relative w-full max-w-2xl mx-auto search-container">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => { if(searchQuery.trim()) setShowSuggestions(true); }}
                    placeholder="Search for products..."
                    className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
                    autoFocus
                  />
                  <button 
                    type="submit" 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-600"
                  >
                    <Search size={20} />
                  </button>

                  {/* Dropdown for suggestions */}
                  <AnimatePresence>
                    {showSuggestions && suggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50 divide-y divide-gray-100 dark:divide-gray-700"
                      >
                        {suggestions.map((product) => (
                          <div 
                            key={product._id} 
                            onClick={() => {
                              navigate(`/products/${product.slug}`);
                              setIsSearchOpen(false);
                              setSearchQuery('');
                              setShowSuggestions(false);
                            }}
                            className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                          >
                            {product.images?.[0]?.url && (
                              <img src={product.images[0].url} alt={product.name} className="w-10 h-10 object-cover rounded-md" />
                            )}
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">{product.name}</h4>
                              <p className="text-xs text-primary-600 font-semibold">₹{product.discountedPrice || product.price}</p>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Mobile Menu (Overlay) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: '100vh' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] pt-20 bg-white dark:bg-gray-900 md:hidden overflow-y-auto"
          >
            <div className="px-4 pt-2 pb-6 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-4 text-base font-medium text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800"
                >
                  {link.name}
                </Link>
              ))}
              
              {isAuthenticated ? (
                <>
                  <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-4 text-base font-medium text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800">
                    My Profile
                  </Link>
                  <Link to="/orders" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-4 text-base font-medium text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800">
                    My Orders
                  </Link>
                  <Link to="/my-custom-requests" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-4 text-base font-medium text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800">
                    My Commissions
                  </Link>
                  <Link to="/wishlist" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-4 text-base font-medium text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800">
                    My Wishlist
                  </Link>
                  {user.role === 'admin' && (
                    <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-4 text-base font-medium text-primary-600 border-b border-gray-100 dark:border-gray-800">
                      Admin Dashboard
                    </Link>
                  )}
                  <button onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }} className="block w-full text-left px-3 py-4 text-base font-medium text-red-600">
                    Logout
                  </button>
                </>
              ) : (
                <div className="mt-6 flex flex-col space-y-3 px-3">
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="btn btn-secondary w-full justify-center">
                    Log in
                  </Link>
                  <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} className="btn btn-primary w-full justify-center">
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
