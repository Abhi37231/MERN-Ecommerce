import { useEffect, useState } from 'react';
import { Ticket, Plus, Trash2, X } from 'lucide-react';
import api from '../../utils/axios';
import toast from 'react-hot-toast';

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage',
    discountAmount: '',
    minOrderAmount: '0',
    expiresAt: '',
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/coupons');
      const data = res.data?.data || res.data || {};
      setCoupons(data.coupons || res.data?.coupons || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/coupons', formData);
      toast.success('Coupon created successfully');
      setIsModalOpen(false);
      setFormData({ code: '', discountType: 'percentage', discountAmount: '', minOrderAmount: '0', expiresAt: '' });
      fetchCoupons();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create coupon');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete coupon?')) return;
    try {
      await api.delete(`/coupons/${id}`);
      toast.success('Coupon deleted');
      fetchCoupons();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete coupon');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Coupon Management</h1>
          <p className="text-sm text-gray-500">Create and manage discount promo codes</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary flex items-center gap-2 py-2 px-4">
          <Plus size={18} /> Create Coupon
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((c) => (
            <div key={c._id} className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 flex justify-between items-start bg-gray-50/50 dark:bg-gray-800/40">
              <div>
                <span className="font-bold text-lg text-primary-600 tracking-wider">{c.code}</span>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                  Discount: {c.discountType === 'percentage' ? `${c.discountAmount}%` : `₹${c.discountAmount}`}
                </p>
                <p className="text-[10px] text-gray-400 mt-1">Min Order: ₹{c.minOrderAmount}</p>
              </div>
              <button onClick={() => handleDelete(c._id)} className="text-gray-400 hover:text-red-500 p-1">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 max-w-md w-full border border-gray-100 dark:border-gray-800 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">Create Coupon</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-600">Coupon Code *</label>
                <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} className="input-field py-2 text-sm" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600">Type</label>
                  <select value={formData.discountType} onChange={(e) => setFormData({ ...formData, discountType: e.target.value })} className="input-field py-2 text-sm">
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600">Amount *</label>
                  <input type="number" value={formData.discountAmount} onChange={(e) => setFormData({ ...formData, discountAmount: e.target.value })} className="input-field py-2 text-sm" required />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">Min Order Amount (₹)</label>
                <input type="number" value={formData.minOrderAmount} onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })} className="input-field py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">Expiration Date *</label>
                <input type="date" value={formData.expiresAt} onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })} className="input-field py-2 text-sm" required />
              </div>
              <button type="submit" className="btn btn-primary w-full py-2.5">
                Create Coupon
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;
