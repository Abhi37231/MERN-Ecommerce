import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, Tag, Check, X } from 'lucide-react';
import { updateCartItem, removeFromCart, clearCart, applyCoupon, removeCoupon } from '../redux/slices/cartSlice';
import toast from 'react-hot-toast';

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, subtotal, couponDiscount, couponCode, total } = useSelector((state) => state.cart);
  const [couponInput, setCouponInput] = useState('');

  const handleUpdateQty = (itemId, newQty) => {
    if (newQty < 1) {
      dispatch(removeFromCart(itemId));
    } else {
      dispatch(updateCartItem({ itemId, quantity: newQty }));
    }
  };

  const handleRemove = (itemId) => {
    dispatch(removeFromCart(itemId));
    toast.success('Item removed from cart');
  };

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    try {
      await dispatch(applyCoupon(couponInput.trim())).unwrap();
      toast.success('Coupon applied successfully!');
      setCouponInput('');
    } catch (err) {
      toast.error(err || 'Failed to apply coupon');
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      await dispatch(removeCoupon()).unwrap();
      toast.success('Coupon removed');
    } catch (err) {
      toast.error(err || 'Failed to remove coupon');
    }
  };

  if (!items || items.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-dark-deep min-h-screen py-16 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="w-24 h-24 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Your Shopping Cart is Empty</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            Looks like you haven't added anything to your cart yet. Explore our products and start shopping!
          </p>
          <Link to="/products" className="btn btn-primary px-8 py-3">
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  const calculatedTotal = total || subtotal - couponDiscount;

  return (
    <div className="bg-gray-50 dark:bg-dark-deep min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
              <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-100 dark:border-gray-800">
                <h2 className="font-bold text-lg text-gray-900 dark:text-white">Cart Items ({items.length})</h2>
                <button
                  onClick={() => dispatch(clearCart())}
                  className="text-sm text-red-500 hover:underline flex items-center gap-1"
                >
                  <Trash2 size={14} /> Clear Cart
                </button>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {items.map((item) => (
                  <div key={item._id} className="py-4 flex gap-4 items-center">
                    <img
                      src={item.image || 'https://via.placeholder.com/150'}
                      alt={item.name}
                      className="w-20 h-24 object-cover rounded-xl bg-gray-100 dark:bg-gray-800 flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {item.name}
                      </h3>
                      {item.variant && Object.keys(item.variant).length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {Object.entries(item.variant).map(([k, v]) => `${v}`).join(', ')}
                        </p>
                      )}
                      <p className="text-sm font-bold text-primary-600 mt-1">
                        ₹{item.discountedPrice || item.price}
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg">
                      <button
                        onClick={() => handleUpdateQty(item._id, item.quantity - 1)}
                        className="p-1 px-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-l-lg"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="px-3 text-sm font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQty(item._id, item.quantity + 1)}
                        className="p-1 px-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-r-lg"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <button
                      onClick={() => handleRemove(item._id)}
                      className="text-gray-400 hover:text-red-500 p-2"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Summary & Checkout */}
          <div className="space-y-6">
            
            {/* Coupon Box */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Tag size={18} className="text-primary-600" /> Apply Coupon
              </h3>

              {couponCode ? (
                <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-3 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Check size={18} />
                    <span className="font-bold">{couponCode}</span>
                  </div>
                  <button onClick={handleRemoveCoupon} className="text-red-500 hover:underline text-xs">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    className="input-field py-2 text-sm"
                  />
                  <button type="submit" className="btn btn-secondary px-4 py-2 text-sm">
                    Apply
                  </button>
                </form>
              )}
            </div>

            {/* Order Summary */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">Order Summary</h3>

              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900 dark:text-white">₹{subtotal.toFixed(2)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600 dark:text-green-400 font-medium">
                    <span>Coupon Discount</span>
                    <span>-₹{couponDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{subtotal > 1000 ? 'Free' : '₹50.00'}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-lg font-bold text-gray-900 dark:text-white">
                <span>Total</span>
                <span className="text-primary-600 dark:text-primary-400">₹{calculatedTotal.toFixed(2)}</span>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="btn btn-primary w-full py-3.5 text-base flex justify-center items-center gap-2 mt-4"
              >
                Proceed to Checkout <ArrowRight size={18} />
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
