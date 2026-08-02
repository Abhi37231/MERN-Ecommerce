import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import api from '../../utils/axios';
import toast from 'react-hot-toast';

const AdminBrandSettings = () => {
  const [settings, setSettings] = useState({
    brandName: 'Craftora',
    tagline: 'Handcrafted with Love',
    logo: '',
    favicon: '',
    primaryColor: '#10b981',
    secondaryColor: '#0f172a'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/brand');
      if (res.data.data) {
        setSettings(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch brand settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await api.put('/brand', settings);
      toast.success('Brand settings updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update brand settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading settings...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Brand Settings</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Brand Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Brand Name</label>
                <input
                  type="text"
                  name="brandName"
                  value={settings.brandName || ''}
                  onChange={handleChange}
                  className="input-field w-full"
                  required
                />
              </div>

              {/* Tagline */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tagline</label>
                <input
                  type="text"
                  name="tagline"
                  value={settings.tagline || ''}
                  onChange={handleChange}
                  className="input-field w-full"
                />
              </div>

              {/* Logo URL */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Logo URL</label>
                <input
                  type="text"
                  name="logo"
                  value={settings.logo || ''}
                  onChange={handleChange}
                  className="input-field w-full"
                  placeholder="https://..."
                />
              </div>

              {/* Favicon URL */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Favicon URL</label>
                <input
                  type="text"
                  name="favicon"
                  value={settings.favicon || ''}
                  onChange={handleChange}
                  className="input-field w-full"
                  placeholder="https://..."
                />
              </div>

              {/* Primary Color */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Primary Color</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    name="primaryColor"
                    value={settings.primaryColor || '#10b981'}
                    onChange={handleChange}
                    className="h-10 w-10 rounded border border-gray-300 p-0"
                  />
                  <input
                    type="text"
                    name="primaryColor"
                    value={settings.primaryColor || '#10b981'}
                    onChange={handleChange}
                    className="input-field flex-1"
                  />
                </div>
              </div>

              {/* Secondary Color */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Secondary Color</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    name="secondaryColor"
                    value={settings.secondaryColor || '#0f172a'}
                    onChange={handleChange}
                    className="h-10 w-10 rounded border border-gray-300 p-0"
                  />
                  <input
                    type="text"
                    name="secondaryColor"
                    value={settings.secondaryColor || '#0f172a'}
                    onChange={handleChange}
                    className="input-field flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="btn btn-primary flex items-center px-6 py-2.5"
              >
                <Save className="w-5 h-5 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminBrandSettings;
