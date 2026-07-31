import { useEffect, useState } from 'react';
import { MessageSquare, Star, Trash2, Edit2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/axios';
import toast from 'react-hot-toast';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingReview, setEditingReview] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', comment: '', rating: 5 });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/reviews');
      const data = res.data?.data || res.data || {};
      setReviews(data.reviews || res.data?.reviews || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete review?')) return;
    try {
      await api.delete(`/reviews/${id}`);
      toast.success('Review deleted');
      fetchReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete review');
    }
  };

  const openEditModal = (review) => {
    setEditingReview(review);
    setEditForm({
      title: review.title || '',
      comment: review.comment || '',
      rating: review.rating || 5
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.put(`/reviews/${editingReview._id}`, editForm);
      toast.success('Review updated successfully');
      setEditingReview(null);
      fetchReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Review Management</h1>
        <p className="text-sm text-gray-500">Moderate product reviews and customer ratings</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
        {isLoading ? (
          <p className="text-center text-gray-400 py-8">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No customer reviews yet.</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {reviews.map((r) => (
              <div key={r._id} className="py-4 flex justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900 dark:text-white text-sm">
                      {r.user?.firstName} {r.user?.lastName}
                    </span>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={12} className={i < r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
                      ))}
                    </div>
                  </div>
                  {r.product && (
                    <p className="text-xs text-gray-500 mb-2">Product: {r.product.name}</p>
                  )}
                  <h5 className="font-semibold text-xs text-primary-600">{r.title || 'Review'}</h5>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{r.comment}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEditModal(r)} className="text-gray-400 hover:text-blue-500 p-1">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(r._id)} className="text-gray-400 hover:text-red-500 p-1">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <h3 className="text-lg font-bold">Edit Review</h3>
                <button onClick={() => setEditingReview(null)} className="text-gray-400 hover:text-gray-900">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Rating</label>
                  <select 
                    value={editForm.rating}
                    onChange={(e) => setEditForm({...editForm, rating: Number(e.target.value)})}
                    className="input-field w-full"
                  >
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} Stars</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input 
                    type="text" 
                    value={editForm.title}
                    onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Comment</label>
                  <textarea 
                    value={editForm.comment}
                    onChange={(e) => setEditForm({...editForm, comment: e.target.value})}
                    className="input-field w-full min-h-[100px]"
                    required
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <button type="button" onClick={() => setEditingReview(null)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminReviews;
