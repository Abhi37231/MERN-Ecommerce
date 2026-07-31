import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createCustomRequest } from '../redux/slices/customRequestSlice';
import { toast } from 'react-hot-toast';

const CustomRequest = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.customRequests);

  const [formData, setFormData] = useState({
    color: '',
    size: '',
    material: '',
    notes: '',
  });
  const [images, setImages] = useState([]);
  const [preview, setPreview] = useState([]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);

    const filePreviews = files.map((file) => URL.createObjectURL(file));
    setPreview(filePreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (images.length === 0) {
      toast.error('Please upload at least one reference image');
      return;
    }

    const data = new FormData();
    data.append('color', formData.color);
    data.append('size', formData.size);
    data.append('material', formData.material);
    data.append('notes', formData.notes);
    images.forEach((img) => data.append('referenceImages', img));

    try {
      await dispatch(createCustomRequest(data)).unwrap();
      toast.success('Custom request submitted successfully! We will get back to you with a quote soon.');
      navigate('/my-custom-requests');
    } catch (error) {
      toast.error(error || 'Failed to submit request');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-serif text-gray-900 dark:text-white mb-4 tracking-tight">
          Commission a Custom Masterpiece
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto font-light">
          Have a unique vision? Share your inspiration, and our artisans will bring it to life with unparalleled craftsmanship.
        </p>
      </div>

      <div className="bg-white dark:bg-dark-light rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-8 md:p-12">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column: Specs */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preferred Colors</label>
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  className="input-field bg-gray-50/50 focus:bg-white transition-colors"
                  placeholder="e.g. Muted Gold, Terracotta, Sage Green..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Dimensions / Size</label>
                <input
                  type="text"
                  name="size"
                  value={formData.size}
                  onChange={handleChange}
                  className="input-field bg-gray-50/50 focus:bg-white transition-colors"
                  placeholder="e.g. 24x36 inches, Medium, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Desired Materials</label>
                <input
                  type="text"
                  name="material"
                  value={formData.material}
                  onChange={handleChange}
                  className="input-field bg-gray-50/50 focus:bg-white transition-colors"
                  placeholder="e.g. Linen, Reclaimed Wood, Ceramic..."
                />
              </div>
            </div>

            {/* Right Column: Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reference Images <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-xl hover:border-primary-500 dark:hover:border-primary-400 transition-colors">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-transparent rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                    >
                      <span>Upload files</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        multiple
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-500">PNG, JPG, GIF up to 10MB</p>
                </div>
              </div>

              {preview.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {preview.map((src, idx) => (
                    <img key={idx} src={src} alt="Preview" className="h-24 w-full object-cover rounded-lg shadow-sm" />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Additional Notes / Story</label>
            <textarea
              name="notes"
              rows={4}
              value={formData.notes}
              onChange={handleChange}
              className="input-field bg-gray-50/50 focus:bg-white transition-colors"
              placeholder="Tell us the story behind this piece. Who is it for? What feelings should it evoke?"
            />
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary px-8 py-3 text-lg font-serif tracking-wide shadow-lg hover:shadow-xl transition-all w-full md:w-auto"
            >
              {loading ? 'Submitting...' : 'Request Quote'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomRequest;
