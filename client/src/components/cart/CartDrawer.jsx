import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { closeCart, removeFromCart, updateCartItem } from '../../redux/slices/cartSlice';
import toast from 'react-hot-toast';

const CartDrawer = () => {
  const { isOpen, items, total, subtotal } = useSelector((state) => state.cart);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Prevent background scrolling when cart is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClose = () => {
    dispatch(closeCart());
  };

  const handleCheckout = () => {
    handleClose();
    navigate('/checkout');
  };

  const updateQuantity = async (itemId, newQty) => {
    try {
      if (newQty < 1) {
        await dispatch(removeFromCart(itemId)).unwrap();
      } else {
        await dispatch(updateCartItem({ itemId, quantity: newQty })).unwrap();
      }
    } catch (err) {
      toast.error(err || 'Failed to update cart');
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await dispatch(removeFromCart(itemId)).unwrap();
    } catch (err) {
      toast.error(err || 'Failed to remove item');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-50 w-full md:w-[400px] bg-white dark:bg-gray-900 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="w-5 h-5 text-gray-900 dark:text-white" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Your Cart ({items?.length || 0})
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {!items || items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                  <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <ShoppingBag className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Your cart is empty</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                    Looks like you haven't added anything to your cart yet.
                  </p>
                  <button 
                    onClick={handleClose}
                    className="btn btn-primary mt-4"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item._id || item.product} className="flex gap-4 py-2 border-b border-gray-100 dark:border-gray-800 pb-4">
                    {/* Item Image */}
                    <div className="w-20 h-24 bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden flex-shrink-0">
                      <img
                        src={item.image || 'https://via.placeholder.com/150'}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Item Details */}
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <div className="flex justify-between">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                            {item.name}
                          </h4>
                          <button 
                            onClick={() => handleRemoveItem(item._id)}
                            className="text-gray-400 hover:text-red-500 ml-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {item.variant && Object.keys(item.variant).length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            {Object.entries(item.variant).map(([k, v]) => `${v}`).join(', ')}
                          </p>
                        )}
                        <p className="text-sm font-semibold text-primary-600 mt-1">
                          ₹{item.discountedPrice || item.price}
                        </p>
                      </div>

                      {/* Quantity Control */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-md">
                          <button 
                            className="p-1 px-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                            onClick={() => updateQuantity(item._id, item.quantity - 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm px-2 text-gray-900 dark:text-white font-medium">
                            {item.quantity}
                          </span>
                          <button 
                            className="p-1 px-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                            onClick={() => updateQuantity(item._id, item.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Summary */}
            {items && items.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-900">
                <div className="flex justify-between text-base font-medium text-gray-900 dark:text-white mb-4">
                  <p>Subtotal</p>
                  <p>₹{subtotal}</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  Shipping and taxes calculated at checkout.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={handleCheckout}
                    className="w-full btn btn-primary flex justify-center items-center py-3"
                  >
                    Checkout <ArrowRight className="ml-2 w-4 h-4" />
                  </button>
                  <Link 
                    to="/cart"
                    onClick={handleClose}
                    className="w-full btn btn-secondary flex justify-center py-3"
                  >
                    View Full Cart
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
