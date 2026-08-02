import { Outlet, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-dark-deep transition-colors duration-300">
      {/* Left Side - Form Container */}
      <div className="w-full md:w-1/2 lg:w-1/3 flex flex-col justify-center px-8 py-12 sm:px-12 lg:px-16 shadow-2xl z-10 bg-white dark:bg-gray-900">
        
        {/* Back to Home Link */}
        <Link 
          to="/" 
          className="absolute top-8 left-8 flex items-center text-sm font-medium text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Store
        </Link>

        {/* Form Outlet */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md mx-auto"
        >
          <div className="mb-8">
            <Link to="/" className="inline-block">
              <span className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                Craft<span className="text-primary-600 dark:text-primary-500">ora</span>.
              </span>
            </Link>
          </div>
          
          <Outlet />
        </motion.div>
      </div>

      {/* Right Side - Branding/Image (Hidden on Mobile) */}
      <div className="hidden md:flex w-full md:w-1/2 lg:w-2/3 bg-primary-600 dark:bg-dark items-center justify-center relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-primary-800 dark:from-dark dark:to-dark-deep opacity-90"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-20"></div>
        
        <div className="relative z-10 text-center px-8">
          <motion.h2 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-4xl lg:text-5xl font-bold text-white mb-6"
          >
            Handcrafted with Love.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-lg text-primary-100 max-w-xl mx-auto"
          >
            Join the ultimate shopping destination. Premium products, seamless experience, and unparalleled customer service.
          </motion.p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
