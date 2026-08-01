import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { MapPin, CreditCard, Truck, Check, ShieldCheck, ArrowRight } from 'lucide-react';
import api from '../utils/axios';
import toast from 'react-hot-toast';
import { fetchCart, clearCartState } from '../redux/slices/cartSlice';

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { items, subtotal, couponDiscount, couponCode, total } = useSelector((state) => state.cart);

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerNote, setCustomerNote] = useState('');
  const [settings, setSettings] = useState(null);

  const [newAddress, setNewAddress] = useState({
    fullName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
    phone: user?.phone || '',
    addressLine1: '',
    tal: '',
    dist: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    isDefault: true,
  });

  useEffect(() => {
    dispatch(fetchCart());
    const fetchAddresses = async () => {
      try {
        const res = await api.get('/users/address');
        const list = res.data?.data?.addresses || res.data?.addresses || [];
        setAddresses(list);
        if (list.length > 0) {
          const defaultAddr = list.find((a) => a.isDefault) || list[0];
          setSelectedAddressId(defaultAddr._id);
        } else {
          setIsAddingNewAddress(true);
        }
      } catch (err) {
        console.error('Failed to fetch addresses:', err);
        setIsAddingNewAddress(true);
      }
    };
    
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings?t=' + new Date().getTime());
        const settingsData = res.data?.settings || res.settings;
        if (settingsData) {
          setSettings(settingsData);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    };

    fetchAddresses();
    fetchSettings();
  }, [dispatch]);

  const handleAddressInputChange = (e) => {
    const { name, value } = e.target;
    setNewAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = async () => {
    let shippingAddress = null;

    if (isAddingNewAddress || addresses.length === 0) {
      if (!newAddress.addressLine1 || !newAddress.city || !newAddress.state || !newAddress.pincode || !newAddress.phone) {
        toast.error('Please fill in all required address fields');
        return;
      }
      try {
        const addrRes = await api.post('/users/address', newAddress);
        shippingAddress = addrRes.data?.data?.address || addrRes.data?.address || addrRes.address;
      } catch (err) {
        toast.error(err.message || 'Failed to save address');
        return;
      }
    } else {
      const selected = addresses.find((a) => a._id === selectedAddressId);
      if (!selected) {
        toast.error('Please select a shipping address');
        return;
      }
      shippingAddress = selected;
    }

    try {
      setIsSubmitting(true);

      if (paymentMethod === 'razorpay') {
        const res = await api.post('/payment/create-order', {
          shippingAddress,
          paymentMethod,
          customerNote,
        });

        const data = res.data?.data || res.data || {};
        const { order, razorpay } = data;

        const options = {
          key: razorpay.keyId,
          amount: razorpay.amount,
          currency: razorpay.currency,
          name: 'ShopSphere',
          description: 'Order Payment',
          order_id: razorpay.orderId,
          handler: async function (response) {
            try {
              setIsSubmitting(true); // Re-set in case it was false
              const verifyRes = await api.post('/payment/verify', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId: order._id,
              });

              dispatch(clearCartState());
              toast.success('Payment successful & Order placed!');
              navigate(`/order-success/${order._id}`);
            } catch (err) {
              toast.error(err.response?.data?.message || err.message || 'Payment verification failed');
              setIsSubmitting(false);
            }
          },
          prefill: {
            name: newAddress.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
            email: user?.email || '',
            contact: shippingAddress.phone || newAddress.phone,
          },
          theme: {
            color: '#4f46e5',
          },
          modal: {
            ondismiss: function () {
              setIsSubmitting(false);
              toast.error('Payment cancelled');
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          toast.error(response.error.description || 'Payment failed');
          setIsSubmitting(false);
        });
        rzp.open();
      } else {
        const res = await api.post('/orders', {
          shippingAddress,
          paymentMethod,
          customerNote,
        });

        const data = res.data?.data || res.data || {};
        const order = data.order;
        dispatch(clearCartState());
        toast.success('Order placed successfully!');
        navigate(`/order-success/${order._id}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to place order');
      setIsSubmitting(false);
    }
  };

  if (!items || items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <button onClick={() => navigate('/products')} className="btn btn-primary">
          Shop Now
        </button>
      </div>
    );
  }

  const discountedSubtotal = Math.max(0, subtotal - couponDiscount);
  const baseShippingCost = settings?.shippingCost ?? 50;
  const freeShippingThreshold = settings?.freeShippingThreshold ?? 1000;
  const gstRate = settings?.gstPercentage ?? 0;

  const dynamicShippingCost = discountedSubtotal > freeShippingThreshold ? 0 : baseShippingCost;
  const dynamicGstAmount = discountedSubtotal * (gstRate / 100);
  const calculatedTotal = discountedSubtotal + dynamicShippingCost + dynamicGstAmount;

  return (
    <div className="bg-gray-50 dark:bg-dark-deep min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Checkout Form */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* 1. Shipping Address */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <MapPin className="text-primary-600" /> 1. Shipping Address
                </h2>
                {addresses.length > 0 && (
                  <button
                    onClick={() => setIsAddingNewAddress(!isAddingNewAddress)}
                    className="text-sm text-primary-600 hover:underline font-medium"
                  >
                    {isAddingNewAddress ? 'Select Saved Address' : '+ Add New Address'}
                  </button>
                )}
              </div>

              {!isAddingNewAddress && addresses.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div
                      key={addr._id}
                      onClick={() => setSelectedAddressId(addr._id)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedAddressId === addr._id
                          ? 'border-primary-600 bg-primary-50/50 dark:bg-primary-900/10'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-gray-900 dark:text-white">{addr.fullName}</h4>
                        {selectedAddressId === addr._id && (
                          <span className="w-5 h-5 bg-primary-600 text-white rounded-full flex items-center justify-center">
                            <Check size={12} />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300">{addr.street}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        {addr.tal && `${addr.tal}, `}{addr.dist && `${addr.dist}, `}{addr.city}, {addr.state} - {addr.pincode}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">Phone: {addr.phone}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Full Name *</label>
                    <input
                      type="text"
                      name="fullName"
                      value={newAddress.fullName}
                      onChange={handleAddressInputChange}
                      className="input-field mt-1 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Phone Number *</label>
                    <input
                      type="text"
                      name="phone"
                      value={newAddress.phone}
                      onChange={handleAddressInputChange}
                      className="input-field mt-1 py-2 text-sm"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Street Address *</label>
                    <input
                      type="text"
                      name="addressLine1"
                      value={newAddress.addressLine1}
                      onChange={handleAddressInputChange}
                      placeholder="House No., Building, Street Name"
                      className="input-field mt-1 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Taluka</label>
                    <input
                      type="text"
                      name="tal"
                      value={newAddress.tal}
                      onChange={handleAddressInputChange}
                      className="input-field mt-1 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">District</label>
                    <input
                      type="text"
                      name="dist"
                      value={newAddress.dist}
                      onChange={handleAddressInputChange}
                      className="input-field mt-1 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">City *</label>
                    <input
                      type="text"
                      name="city"
                      value={newAddress.city}
                      onChange={handleAddressInputChange}
                      className="input-field mt-1 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">State *</label>
                    <input
                      type="text"
                      name="state"
                      value={newAddress.state}
                      onChange={handleAddressInputChange}
                      className="input-field mt-1 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Pincode / Postal Code *</label>
                    <input
                      type="text"
                      name="pincode"
                      value={newAddress.pincode}
                      onChange={handleAddressInputChange}
                      className="input-field mt-1 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Country</label>
                    <input
                      type="text"
                      name="country"
                      value={newAddress.country}
                      readOnly
                      className="input-field mt-1 py-2 text-sm bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 2. Payment Method */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <CreditCard className="text-primary-600" /> 2. Payment Method
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-4 rounded-xl border-2 cursor-pointer flex items-center gap-3 transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-primary-600 bg-primary-50/50 dark:bg-primary-900/10'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <Truck size={24} className="text-primary-600" />
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white">Cash on Delivery (COD)</h4>
                    <p className="text-xs text-gray-500">Pay when your order arrives</p>
                  </div>
                </div>

                <div
                  onClick={() => setPaymentMethod('razorpay')}
                  className={`p-4 rounded-xl border-2 cursor-pointer flex items-center gap-3 transition-all ${
                    paymentMethod === 'razorpay'
                      ? 'border-primary-600 bg-primary-50/50 dark:bg-primary-900/10'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <CreditCard size={24} className="text-primary-600" />
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white">Online Payment</h4>
                    <p className="text-xs text-gray-500">UPI, Cards, NetBanking</p>
                  </div>
                </div>
              </div>

              {/* Customer Note */}
              <div className="mt-6">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Delivery Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Special instructions for delivery..."
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  className="input-field mt-1 py-2 text-sm"
                />
              </div>
            </div>

          </div>

          {/* Sidebar Summary */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3">
                Order Items ({items.length})
              </h3>

              <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-60 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item._id} className="py-2.5 flex items-center gap-3">
                    <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-lg bg-gray-100" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate text-gray-900 dark:text-white">{item.name}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-xs font-bold">₹{((item.discountedPrice || item.price) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900 dark:text-white">₹{subtotal.toFixed(2)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Coupon ({couponCode})</span>
                    <span>-₹{couponDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{dynamicShippingCost === 0 ? 'FREE' : `₹${dynamicShippingCost.toFixed(2)}`}</span>
                </div>
                {gstRate > 0 && (
                  <div className="flex justify-between">
                    <span>Estimated GST ({gstRate}%)</span>
                    <span>₹{dynamicGstAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-gray-900 dark:text-white pt-2 border-t">
                  <span>Total Amount</span>
                  <span className="text-primary-600 dark:text-primary-400">₹{calculatedTotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={isSubmitting}
                className="btn btn-primary w-full py-3.5 text-base flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
              >
                {isSubmitting ? 'Processing Order...' : 'Confirm & Place Order'} <ArrowRight size={18} />
              </button>

              <div className="flex items-center justify-center gap-2 text-xs text-gray-400 pt-2">
                <ShieldCheck size={16} /> 256-bit Encrypted & Secure Checkout
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Checkout;
