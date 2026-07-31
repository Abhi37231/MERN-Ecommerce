import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { User, Key, MapPin, Plus, Trash2, Check, Lock } from 'lucide-react';
import api from '../utils/axios';
import toast from 'react-hot-toast';
import { updateUser } from '../redux/slices/authSlice';

const Profile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [addresses, setAddresses] = useState([]);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    addressLine1: '',
    tal: '',
    dist: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    isDefault: false,
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const res = await api.get('/users/address');
      const data = res.data?.data || res.data || {};
      setAddresses(data.addresses || res.data?.addresses || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put('/auth/update-details', profileData);
      const data = res.data?.data || res.data || {};
      dispatch(updateUser(data.user || res.data?.user));
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      await api.put('/auth/update-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Password updated successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users/address', newAddress);
      toast.success('Address added!');
      setIsAddingAddress(false);
      fetchAddresses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add address');
    }
  };

  const handleDeleteAddress = async (id) => {
    try {
      await api.delete(`/users/address/${id}`);
      toast.success('Address deleted');
      fetchAddresses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete address');
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-dark-deep min-h-screen py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-8">My Account</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Tabs Navigation */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm h-fit space-y-2">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'profile'
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <User size={18} /> Edit Profile
            </button>
            <button
              onClick={() => setActiveTab('addresses')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'addresses'
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <MapPin size={18} /> Saved Addresses
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'password'
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <Key size={18} /> Change Password
            </button>
          </div>

          {/* Content Area */}
          <div className="md:col-span-3">
            {activeTab === 'profile' && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 sm:p-8 border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Profile Details</h2>
                <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-lg">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">First Name</label>
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                      className="input-field mt-1 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Last Name</label>
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                      className="input-field mt-1 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Email (Read only)</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      readOnly
                      className="input-field mt-1 py-2 text-sm bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Phone Number</label>
                    <input
                      type="text"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="input-field mt-1 py-2 text-sm"
                    />
                  </div>
                  <button type="submit" className="btn btn-primary px-6 py-2.5 mt-2">
                    Save Changes
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'addresses' && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 sm:p-8 border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Saved Addresses</h2>
                  <button
                    onClick={() => setIsAddingAddress(!isAddingAddress)}
                    className="btn btn-primary text-xs py-2 px-4 flex items-center gap-1"
                  >
                    <Plus size={14} /> Add Address
                  </button>
                </div>

                {isAddingAddress && (
                  <form onSubmit={handleAddAddress} className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={newAddress.fullName}
                        onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                        className="input-field py-2 text-sm"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Phone"
                        value={newAddress.phone}
                        onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                        className="input-field py-2 text-sm"
                        required
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Street Address"
                      value={newAddress.addressLine1}
                      onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
                      className="input-field py-2 text-sm"
                      required
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Taluka"
                        value={newAddress.tal}
                        onChange={(e) => setNewAddress({ ...newAddress, tal: e.target.value })}
                        className="input-field py-2 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="District"
                        value={newAddress.dist}
                        onChange={(e) => setNewAddress({ ...newAddress, dist: e.target.value })}
                        className="input-field py-2 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <input
                        type="text"
                        placeholder="City"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        className="input-field py-2 text-sm"
                        required
                      />
                      <input
                        type="text"
                        placeholder="State"
                        value={newAddress.state}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        className="input-field py-2 text-sm"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Postal Code"
                        value={newAddress.pincode}
                        onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                        className="input-field py-2 text-sm"
                        required
                      />
                    </div>
                    <button type="submit" className="btn btn-primary text-xs py-2 px-4">
                      Save Address
                    </button>
                  </form>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div key={addr._id} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 relative">
                      <h4 className="font-bold text-gray-900 dark:text-white">{addr.fullName}</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{addr.addressLine1}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        {addr.tal && `${addr.tal}, `}{addr.dist && `${addr.dist}, `}{addr.city}, {addr.state} - {addr.pincode}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">Phone: {addr.phone}</p>
                      <button
                        onClick={() => handleDeleteAddress(addr._id)}
                        className="absolute top-3 right-3 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'password' && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 sm:p-8 border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Change Password</h2>
                <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-lg">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Current Password</label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="input-field mt-1 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">New Password</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="input-field mt-1 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="input-field mt-1 py-2 text-sm"
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary px-6 py-2.5 mt-2">
                    Update Password
                  </button>
                </form>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;
