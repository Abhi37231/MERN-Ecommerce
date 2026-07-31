import { Outlet } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import CartDrawer from '../components/cart/CartDrawer';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const RootLayout = () => {
  const { pathname } = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-dark-deep transition-colors duration-300">
      {/* Navigation Bar */}
      <Navbar />

      {/* Slide-in Cart Drawer */}
      <CartDrawer />

      {/* Main Content Area */}
      <main className="flex-grow pt-16">
        {/* pt-16 offsets the fixed navbar height */}
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default RootLayout;
