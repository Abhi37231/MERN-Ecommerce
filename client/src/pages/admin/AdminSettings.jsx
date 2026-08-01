import { useState, useEffect } from 'react';
import { Save, Store, Truck, LayoutTemplate, Link } from 'lucide-react';
import api from '../../utils/axios';
import toast from 'react-hot-toast';

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    storeLogo: '',
    storeName: '',
    storeAddress: '',
    storePhone: '',
    storeEmail: '',
    showLogo: true,
    showBarcode: true,
    labelSize: '4x6',
    footerText: '',
    shippingCost: 50,
    freeShippingThreshold: 1000,
    gstPercentage: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/settings');
      const settingsData = res.data?.settings || res.settings;
      if (settingsData) {
        setSettings(settingsData);
      }
    } catch (err) {
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await api.put('/settings', settings);
      toast.success('Settings saved successfully!');
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading settings...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Store Settings</h1>
        <p className="text-sm text-gray-500">Configure global settings and shipping label preferences</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Store Details Section */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex items-center gap-2 font-bold text-gray-900 dark:text-white">
            <Store size={18} className="text-primary-600" /> General Store Details
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Store Name</label>
              <input type="text" name="storeName" value={settings.storeName} onChange={handleChange} className="input-field" />
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                Store Logo (URL) <Link size={12}/>
              </label>
              <input type="url" name="storeLogo" value={settings.storeLogo} onChange={handleChange} placeholder="https://example.com/logo.png" className="input-field" />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Support Email</label>
              <input type="email" name="storeEmail" value={settings.storeEmail} onChange={handleChange} className="input-field" />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Support Phone</label>
              <input type="text" name="storePhone" value={settings.storePhone} onChange={handleChange} className="input-field" />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Store Physical Address</label>
              <textarea name="storeAddress" value={settings.storeAddress} onChange={handleChange} className="input-field h-24 resize-none"></textarea>
            </div>
          </div>
        </div>

        {/* Checkout Settings Section */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex items-center gap-2 font-bold text-gray-900 dark:text-white">
            <Truck size={18} className="text-primary-600" /> Checkout Settings
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Base Shipping Cost (₹)</label>
              <input type="number" name="shippingCost" value={settings.shippingCost} onChange={handleChange} min="0" className="input-field" required />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Free Shipping Threshold (₹)</label>
              <input type="number" name="freeShippingThreshold" value={settings.freeShippingThreshold} onChange={handleChange} min="0" className="input-field" required />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">GST Percentage (%)</label>
              <input type="number" name="gstPercentage" value={settings.gstPercentage} onChange={handleChange} min="0" max="100" step="0.1" className="input-field" required />
            </div>
          </div>
        </div>

        {/* Shipping Label Settings Section */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex items-center gap-2 font-bold text-gray-900 dark:text-white">
            <LayoutTemplate size={18} className="text-primary-600" /> Shipping Label Settings
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Label Paper Size</label>
              <select name="labelSize" value={settings.labelSize} onChange={handleChange} className="input-field">
                <option value="4x6">4x6 Thermal (Standard)</option>
                <option value="A4">A4 Print</option>
                <option value="A5">A5 Print</option>
              </select>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Label Footer Text</label>
              <input type="text" name="footerText" value={settings.footerText} onChange={handleChange} placeholder="Thank you for shopping with us!" className="input-field" />
            </div>

            <div className="space-y-4 md:col-span-2 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-sm mb-2">Display Toggles</h3>
              <div className="flex flex-col sm:flex-row gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="showLogo" checked={settings.showLogo} onChange={handleChange} className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                    <span className="text-sm font-medium">Show Logo</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="showQrCode" checked={settings.showQrCode} onChange={handleChange} className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                    <span className="text-sm font-medium">Show QR Code</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="showBarcode" checked={settings.showBarcode} onChange={handleChange} className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                    <span className="text-sm font-medium">Show Barcode</span>
                  </label>
              </div>
            </div>

          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={isSaving} className="btn btn-primary flex items-center gap-2 px-6">
            <Save size={18} /> {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default AdminSettings;
