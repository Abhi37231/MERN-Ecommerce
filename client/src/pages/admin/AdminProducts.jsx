import { useEffect, useState } from 'react';
import { Package, Plus, Search, Trash2, Edit2, Check, X, Bell, CheckCircle2 } from 'lucide-react';
import api from '../../utils/axios';
import toast from 'react-hot-toast';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // New Product Modal Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockRequests, setRestockRequests] = useState([]);
  const [editingProductId, setEditingProductId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shortDescription: '',
    price: '',
    discountPercentage: '0',
    category: '',
    brand: '',
    stock: '',
    sku: '',
  });
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [retainedImages, setRetainedImages] = useState([]);

  const resetForm = () => {
    setFormData({
      name: '', description: '', shortDescription: '', price: '',
      discountPercentage: '0', category: '', brand: '', stock: '', sku: ''
    });
    setImages([]);
    setExistingImages([]);
    setRetainedImages([]);
    setEditingProductId(null);
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/products?limit=50');
      const data = res.data?.data || res.data || {};
      setProducts(data.products || res.data?.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data.data?.categories || res.data.categories || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted');
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete product');
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!formData.category) {
      toast.error('Please select a category');
      return;
    }
    
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      data.append(key, formData[key]);
    });
    
    // Append images
    if (images) {
      for (let i = 0; i < images.length; i++) {
        data.append('images', images[i]);
      }
    }
    
    // Append retained images if editing
    if (editingProductId) {
      data.append('retainedImages', JSON.stringify(retainedImages));
    }

    try {
      if (editingProductId) {
        await api.put(`/products/${editingProductId}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Product updated successfully!');
      } else {
        await api.post('/products', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Product created successfully!');
      }
      setIsModalOpen(false);
      resetForm();
      fetchProducts();
    } catch (err) {
      toast.error(err.message || 'Failed to save product');
    }
  };

  const handleEditClick = (product) => {
    setFormData({
      name: product.name || '',
      description: product.description || '',
      shortDescription: product.shortDescription || '',
      price: product.price || '',
      discountPercentage: product.discountPercentage || '0',
      category: product.category?._id || product.category || '',
      brand: product.brand || '',
      stock: product.stock || '',
      sku: product.sku || '',
    });
    
    if (product.images) {
      setExistingImages(product.images);
      setRetainedImages(product.images.map(img => img.publicId));
    } else {
      setExistingImages([]);
      setRetainedImages([]);
    }
    
    setEditingProductId(product._id);
    setIsModalOpen(true);
  };

  const handleRemoveExistingImage = (publicId) => {
    setExistingImages(prev => prev.filter(img => img.publicId !== publicId));
    setRetainedImages(prev => prev.filter(id => id !== publicId));
  };

  const fetchRestockRequests = async () => {
    try {
      const res = await api.get('/products/restock-requests');
      const data = res.data?.data || res.data || {};
      setRestockRequests(data.requests || res.data?.requests || []);
    } catch (err) {
      toast.error('Failed to fetch restock requests');
    }
  };

  const handleResolveRestockRequest = async (id) => {
    try {
      await api.delete(`/products/restock-requests/${id}`);
      toast.success('Request marked as resolved');
      fetchRestockRequests();
    } catch (err) {
      toast.error('Failed to resolve request');
    }
  };

  useEffect(() => {
    if (isRestockModalOpen) {
      fetchRestockRequests();
    }
  }, [isRestockModalOpen]);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Product Management</h1>
          <p className="text-sm text-gray-500">Manage store inventory, prices, and products</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsRestockModalOpen(true)}
            className="btn bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center gap-2 py-2.5 px-4"
          >
            <Bell size={18} /> Restock Requests
          </button>
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="btn btn-primary flex items-center gap-2 py-2.5 px-4"
          >
            <Plus size={18} /> Add New Product
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-4 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by title or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pr-10 py-2 text-sm"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs font-semibold text-gray-500 uppercase border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="p-4">Product</th>
                <th className="p-4">Category</th>
                <th className="p-4">Price</th>
                <th className="p-4">Stock</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">Loading products...</td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">No products found</td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                    <td className="p-4 flex items-center gap-3">
                      <img src={p.images?.[0]?.url || 'https://via.placeholder.com/50'} alt={p.name} className="w-12 h-12 object-cover rounded-xl bg-gray-100" />
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white line-clamp-1">{p.name}</p>
                        <p className="text-xs text-gray-400">SKU: {p.sku || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="p-4 font-medium">{p.category?.name || 'General'}</td>
                    <td className="p-4 font-bold text-gray-900 dark:text-white">₹{p.price}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${p.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {p.stock} units
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleEditClick(p)} className="p-2 text-gray-400 hover:text-primary-500 mr-2">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(p._id)} className="p-2 text-gray-400 hover:text-red-500">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 max-w-lg w-full border border-gray-100 dark:border-gray-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                {editingProductId ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-600">Product Name *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field py-2 text-sm" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600">Price (₹) *</label>
                  <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="input-field py-2 text-sm" required />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600">Stock *</label>
                  <input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} className="input-field py-2 text-sm" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600">Category *</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="input-field py-2 text-sm" required>
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600">Brand</label>
                  <input type="text" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} className="input-field py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">Description *</label>
                <textarea rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input-field py-2 text-sm" required />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-2 block">Product Images</label>
                
                {/* Existing Images Display */}
                {existingImages.length > 0 && (
                  <div className="flex flex-wrap gap-3 mb-3">
                    {existingImages.map((img) => (
                      <div key={img.publicId} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                        <img src={img.url} alt="existing" className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => handleRemoveExistingImage(img.publicId)}
                          className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <input 
                  type="file" 
                  multiple 
                  accept="image/*"
                  onChange={(e) => setImages(e.target.files)} 
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" 
                />
              </div>
              <div className="pt-4 flex gap-3 border-t border-gray-100 dark:border-gray-800">
                <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }} className="btn bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white flex-1 py-2">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1 py-2 flex justify-center items-center gap-2">
                  <Check size={18} /> {editingProductId ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restock Requests Modal */}
      {isRestockModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 max-w-3xl w-full border border-gray-100 dark:border-gray-800 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <Bell size={20} className="text-primary-600" /> Restock Requests
              </h3>
              <button onClick={() => setIsRestockModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1">
              {restockRequests.length === 0 ? (
                <div className="text-center text-gray-500 py-12">No pending restock requests</div>
              ) : (
                <div className="space-y-4">
                  {restockRequests.map((req) => (
                    <div key={req._id} className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <img src={req.product?.images?.[0]?.url || 'https://via.placeholder.com/50'} className="w-12 h-12 object-cover rounded-lg" />
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{req.product?.name}</p>
                          <p className="text-xs text-gray-500">Requested by: {req.user?.firstName} {req.user?.lastName} ({req.user?.email})</p>
                          <p className="text-xs text-gray-500 mt-1">Current Stock: <span className="font-bold">{req.product?.stock}</span></p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleResolveRestockRequest(req._id)}
                        className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                        title="Mark as resolved/notified"
                      >
                        <CheckCircle2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
