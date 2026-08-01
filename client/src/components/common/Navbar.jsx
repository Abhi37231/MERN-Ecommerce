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
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { openCart } from '../../redux/slices/cartSlice';
import { logout } from '../../redux/slices/authSlice';
import toast from 'react-hot-toast';
import api from '../../utils/axios';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { totalItems } = useSelector((state) => state.cart);
  
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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const closeDropdowns = (e) => {
      if (isProfileDropdownOpen && !e.target.closest('.profile-dropdown-container')) {
        setIsProfileDropdownOpen(false);
      }
    };
    
    document.addEventListener('click', closeDropdowns);
    return () => document.removeEventListener('click', closeDropdowns);
  }, [isProfileDropdownOpen]);

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
                Shop<span className="text-primary-600 dark:text-primary-500">Sphere</span>.
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
                <form onSubmit={handleSearch} className="relative w-full max-w-2xl mx-auto">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
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
