import { useEffect, useState, useRef } from 'react';
import { 
  ShoppingCart, CheckCircle2, Clock, Truck, XCircle, Search, Filter, 
  Download, Printer, ChevronDown, ChevronUp, Package, CreditCard,
  MessageCircle, Phone, Mail, Edit, Trash2, Calendar, User, LayoutList, RefreshCw, FileText, ArrowLeft, X
} from 'lucide-react';
import api from '../../utils/axios';
import toast from 'react-hot-toast';
import ShippingLabel from '../../components/admin/ShippingLabel';
import html2pdf from 'html2pdf.js';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  
  const [analytics, setAnalytics] = useState(null);
  const [siteSettings, setSiteSettings] = useState(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  
  // Edit Address State
  const [isEditAddressModalOpen, setIsEditAddressModalOpen] = useState(false);
  const [editAddressForm, setEditAddressForm] = useState(null);
  const [isSubmittingAddress, setIsSubmittingAddress] = useState(false);
  
  const printLabelRef = useRef(null);
  
  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortOption, setSortOption] = useState('newest');

  // Bulk Selection
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);

  useEffect(() => {
    fetchOrders();
    fetchAnalytics();
    fetchSettings();
  }, [currentPage, statusFilter, paymentFilter, dateFilter, sortOption]);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      const settingsData = res.data?.settings || res.settings;
      setSiteSettings(settingsData);
    } catch (err) {
      console.error('Failed to fetch settings');
    }
  };

  // Debounce Search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (currentPage !== 1) setCurrentPage(1);
      else fetchOrders();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/orders', {
        params: {
          page: currentPage,
          limit: 20,
          search: searchTerm,
          status: statusFilter,
          paymentMethod: paymentFilter,
          dateFilter: dateFilter,
          sort: sortOption
        }
      });
      const data = res.data?.data || res.data;
      setOrders(data.orders || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalOrders(data.pagination?.totalItems || data.orders?.length || 0);
    } catch (err) {
      toast.error('Failed to fetch orders');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/orders/analytics');
      setAnalytics(res.data?.analytics || res.analytics);
    } catch (err) {
      console.error('Failed to fetch analytics', err);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    if(!window.confirm(`Are you sure you want to mark this order as ${newStatus}?`)) return;
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders();
      fetchAnalytics();
      if(selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder(prev => ({...prev, status: newStatus}));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update order status');
    }
  };
  
  const handleBulkUpdate = async (status) => {
    if(!selectedOrderIds.length) return;
    if(!window.confirm(`Update ${selectedOrderIds.length} orders to ${status}?`)) return;
    try {
      await api.patch(`/orders/bulk-update`, { orderIds: selectedOrderIds, status });
      toast.success(`${selectedOrderIds.length} orders updated to ${status}`);
      setSelectedOrderIds([]);
      fetchOrders();
      fetchAnalytics();
    } catch (err) {
      toast.error('Failed to bulk update orders');
    }
  };
  
  const handleSaveAdminNote = async () => {
    if(!selectedOrder) return;
    try {
      await api.patch(`/orders/${selectedOrder._id}/admin-note`, { adminNote });
      toast.success('Admin note saved');
      fetchOrders();
    } catch (err) {
      toast.error('Failed to save note');
    }
  };

  const handleDeleteOrder = async () => {
    if(!selectedOrder) return;
    if(!window.confirm('Are you sure you want to permanently delete this order? This action cannot be undone.')) return;
    try {
      await api.delete(`/orders/${selectedOrder._id}`);
      toast.success('Order deleted successfully');
      setSelectedOrder(null);
      fetchOrders();
      fetchAnalytics();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete order');
    }
  };

  const openEditAddressModal = () => {
    setEditAddressForm({ ...selectedOrder.shippingAddress });
    setIsEditAddressModalOpen(true);
  };

  const handleUpdateAddress = async (e) => {
    e.preventDefault();
    try {
      setIsSubmittingAddress(true);
      const res = await api.put(`/orders/${selectedOrder._id}`, { shippingAddress: editAddressForm });
      toast.success('Shipping address updated');
      setSelectedOrder(res.data.data?.order || res.data.order);
      setIsEditAddressModalOpen(false);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update address');
    } finally {
      setIsSubmittingAddress(false);
    }
  };

  const exportCSV = () => {
    if(!orders.length) return;
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Order ID,Date,Customer,Email,Phone,Total,Payment,Status\n";
    
    const itemsToExport = selectedOrderIds.length > 0 
      ? orders.filter(o => selectedOrderIds.includes(o._id))
      : orders;
      
    itemsToExport.forEach(o => {
      const date = new Date(o.createdAt).toLocaleDateString();
      const customer = `${o.user?.firstName || ''} ${o.user?.lastName || ''}`.trim() || o.shippingAddress?.fullName || 'Unknown';
      const email = o.user?.email || 'N/A';
      const phone = o.shippingAddress?.phone || '';
      csvContent += `${o.orderNumber || o._id},${date},${customer},${email},${phone},${o.totalAmount},${o.payment?.method},${o.status}\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `orders_export_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      processing: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
      packed: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      shipped: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${colors[status] || colors.pending}`}>
        {status}
      </span>
    );
  };

  const getPaymentBadge = (payment) => {
    if(!payment) return null;
    const isPaid = payment.status === 'paid';
    return (
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase">{payment.method}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded w-max font-bold ${isPaid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
          {payment.status}
        </span>
      </div>
    );
  };

  const toggleOrderSelection = (id) => {
    setSelectedOrderIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };
  
  const toggleAllSelection = () => {
    if(selectedOrderIds.length === orders.length) setSelectedOrderIds([]);
    else setSelectedOrderIds(orders.map(o => o._id));
  };
  
  const openOrderDrawer = (order) => {
      setSelectedOrder(order);
      setAdminNote(order.adminNote || '');
  };

  const handlePrintLabel = () => {
    const printContent = printLabelRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write('<html><head><title>Print Shipping Label</title>');
    // Include tailwind via CDN for print window styling
    printWindow.document.write('<script src="https://cdn.tailwindcss.com"></script>');
    
    const isA4 = siteSettings?.labelSize === 'A4';
    const isA5 = siteSettings?.labelSize === 'A5';
    let pageSize = '100mm 150mm'; // Default 4x6
    if (isA4) pageSize = 'A4 portrait';
    if (isA5) pageSize = 'A5 portrait';

    printWindow.document.write(`<style>@media print { @page { size: ${pageSize}; margin: 0; } body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; } }</style>`);
    printWindow.document.write('</head><body class="flex justify-center bg-gray-100 print:bg-white items-start print:items-center min-h-screen p-8 print:p-0">');
    printWindow.document.write(printContent.innerHTML);
    printWindow.document.write('</body></html>');
    
    // Wait for tailwind to process before printing
    setTimeout(() => {
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 1000);
  };

  const handleDownloadPdf = () => {
    const element = printLabelRef.current;
    if (!element) return;
    
    // clone the element to temporarily remove hidden class for PDF generation
    const clone = element.cloneNode(true);
    clone.style.display = 'block';
    document.body.appendChild(clone);

    const opt = {
      margin: 10,
      filename: `ShippingLabel_${selectedOrder?.orderNumber || 'order'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: siteSettings?.labelSize === '4x6' ? [101.6, 152.4] : (siteSettings?.labelSize === 'A5' ? 'a5' : 'a4'), orientation: 'portrait' }
    };

    html2pdf().from(clone).set(opt).save().then(() => {
        document.body.removeChild(clone);
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Analytics */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Orders Dashboard</h1>
          <p className="text-sm text-gray-500">Manage and process customer orders</p>
        </div>
        <div className="flex gap-2">
            <button onClick={exportCSV} className="btn bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 shadow-sm flex items-center gap-2">
                <Download size={16} /> Export CSV
            </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {[
          { label: 'Total', count: totalOrders, icon: LayoutList, color: 'text-gray-600', bg: 'bg-gray-100' },
          { label: 'Pending', count: analytics?.statusCounts?.pending || 0, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
          { label: 'Processing', count: analytics?.statusCounts?.processing || 0, icon: RefreshCw, color: 'text-indigo-600', bg: 'bg-indigo-100' },
          { label: 'Packed', count: analytics?.statusCounts?.packed || 0, icon: Package, color: 'text-purple-600', bg: 'bg-purple-100' },
          { label: 'Shipped', count: analytics?.statusCounts?.shipped || 0, icon: Truck, color: 'text-orange-600', bg: 'bg-orange-100' },
          { label: 'Delivered', count: analytics?.statusCounts?.delivered || 0, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100' },
          { label: 'Cancelled', count: analytics?.statusCounts?.cancelled || 0, icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
        ].map((card, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center text-center group hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-full ${card.bg} flex items-center justify-center mb-2`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{card.count}</h3>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96 flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search Order ID, Name, Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>
        
        <div className="flex flex-wrap gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field py-2 text-sm min-w-[120px]">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="packed">Packed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          
          <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="input-field py-2 text-sm min-w-[120px]">
            <option value="all">All Payments</option>
            <option value="cod">COD</option>
            <option value="razorpay">Razorpay</option>
          </select>
          
          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="input-field py-2 text-sm min-w-[120px]">
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last7days">Last 7 Days</option>
            <option value="last30days">Last 30 Days</option>
            <option value="thisMonth">This Month</option>
          </select>
          
          <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="input-field py-2 text-sm min-w-[120px]">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Amount</option>
            <option value="lowest">Lowest Amount</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedOrderIds.length > 0 && (
        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-3 flex justify-between items-center animate-fade-in">
          <span className="text-primary-700 dark:text-primary-300 font-medium text-sm">
            {selectedOrderIds.length} orders selected
          </span>
          <div className="flex gap-2">
            <select onChange={(e) => { if(e.target.value) handleBulkUpdate(e.target.value); e.target.value=''; }} className="input-field py-1 text-sm bg-white dark:bg-gray-800 w-auto">
              <option value="">Bulk Update Status...</option>
              <option value="processing">Mark Processing</option>
              <option value="packed">Mark Packed</option>
              <option value="shipped">Mark Shipped</option>
              <option value="delivered">Mark Delivered</option>
              <option value="cancelled">Cancel Orders</option>
            </select>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs font-semibold text-gray-500 uppercase border-b border-gray-100 dark:border-gray-800 sticky top-0 z-10">
              <tr>
                <th className="p-4 w-12">
                  <input type="checkbox" onChange={toggleAllSelection} checked={orders.length > 0 && selectedOrderIds.length === orders.length} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                </th>
                <th className="p-4">Order</th>
                <th className="p-4">Date</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="p-4"><div className="skeleton h-12 w-full rounded"></div></td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr><td colSpan={7} className="p-16 text-center text-gray-400">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="text-lg font-medium">No orders found</p>
                </td></tr>
              ) : (
                orders.map((ord) => (
                  <tr key={ord._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 group transition-colors">
                    <td className="p-4">
                      <input type="checkbox" checked={selectedOrderIds.includes(ord._id)} onChange={() => toggleOrderSelection(ord._id)} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                    </td>
                    <td className="p-4">
                      <button onClick={() => openOrderDrawer(ord)} className="font-bold text-primary-600 hover:underline">
                        #{ord.orderNumber || ord._id.slice(-6)}
                      </button>
                    </td>
                    <td className="p-4 whitespace-nowrap text-xs">
                        {new Date(ord.createdAt).toLocaleDateString()}<br/>
                        <span className="text-gray-400">{new Date(ord.createdAt).toLocaleTimeString()}</span>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {(ord.user?.firstName || ord.user?.lastName) 
                          ? `${ord.user?.firstName || ''} ${ord.user?.lastName || ''}`.trim() 
                          : ord.shippingAddress?.fullName || 'Unknown Customer'}
                      </p>
                      <p className="text-xs text-gray-400">{ord.user?.email || 'No email available'}</p>
                    </td>
                    <td className="p-4">{getPaymentBadge(ord.payment)}</td>
                    <td className="p-4">
                      {getStatusBadge(ord.status)}
                    </td>
                    <td className="p-4 text-right font-bold text-gray-900 dark:text-white">
                        ₹{ord.totalAmount}
                        <p className="text-xs text-gray-400 font-normal">{ord.items?.length || 0} items</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                <span className="text-sm text-gray-500">Page {currentPage} of {totalPages}</span>
                <div className="flex gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="btn bg-white border border-gray-200 text-sm px-3 py-1.5 disabled:opacity-50">Prev</button>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="btn bg-white border border-gray-200 text-sm px-3 py-1.5 disabled:opacity-50">Next</button>
                </div>
            </div>
        )}
      </div>

      {/* Modern Side Drawer for Order Details */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
          
          {/* Drawer */}
          <div className="relative w-full max-w-xl bg-white dark:bg-gray-900 h-full shadow-2xl flex flex-col transform transition-transform duration-300">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col gap-4">
              <button 
                onClick={() => setSelectedOrder(null)} 
                className="flex items-center text-sm font-medium text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors w-max"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Orders
              </button>
              <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    Order #{selectedOrder.orderNumber || selectedOrder._id.slice(-6)}
                    {getStatusBadge(selectedOrder.status)}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center flex-wrap gap-2">
                  <button onClick={handlePrintLabel} className="btn bg-gray-900 text-white hover:bg-gray-800 shadow-sm flex items-center justify-center gap-2 px-3 py-1.5 text-sm" title="Print Shipping Label">
                      <Printer size={16} /> Print Label
                  </button>
                  <button onClick={handleDownloadPdf} className="btn bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm flex items-center justify-center gap-2 px-3 py-1.5 text-sm" title="Download PDF">
                      <FileText size={16} /> PDF
                  </button>
                  <button onClick={handleDeleteOrder} className="btn bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 shadow-sm flex items-center justify-center gap-2 px-3 py-1.5 text-sm" title="Delete Order">
                      <Trash2 size={16} /> Delete
                  </button>
                  <button onClick={() => setSelectedOrder(null)} className="p-2 ml-2 text-gray-400 hover:text-red-500 transition-colors bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-200 dark:border-gray-700">
                    <XCircle size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                
                {/* Actions */}
                <div className="grid grid-cols-2 gap-4">
                    <select
                        value={selectedOrder.status}
                        onChange={(e) => handleUpdateStatus(selectedOrder._id, e.target.value)}
                        className="input-field py-2.5 text-sm font-semibold border-primary-200 focus:ring-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300"
                    >
                        <option value="pending">⏳ Pending</option>
                        <option value="confirmed">✅ Confirmed</option>
                        <option value="processing">⚙️ Processing</option>
                        <option value="packed">📦 Packed</option>
                        <option value="shipped">🚚 Shipped</option>
                        <option value="delivered">🎉 Delivered</option>
                        <option value="cancelled">❌ Cancelled</option>
                    </select>
                    <a href={`mailto:${selectedOrder.user?.email}`} className="btn bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm flex items-center justify-center gap-2">
                        <Mail size={16} /> Email Customer
                    </a>
                </div>

                {/* Customer & Shipping */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="bg-gray-50 dark:bg-gray-800/30 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                            <User size={16} className="text-primary-500" /> Customer
                        </h3>
                        <p className="font-semibold text-sm">
                            {(selectedOrder.user?.firstName || selectedOrder.user?.lastName) 
                              ? `${selectedOrder.user?.firstName || ''} ${selectedOrder.user?.lastName || ''}`.trim() 
                              : selectedOrder.shippingAddress?.fullName || 'Unknown Customer'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">{selectedOrder.user?.email || 'No email available'}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/30 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Truck size={16} className="text-primary-500" /> Shipping
                            </h3>
                            <button onClick={openEditAddressModal} className="text-gray-400 hover:text-primary-600 transition-colors"><Edit size={16} /></button>
                        </div>
                        <p className="font-semibold text-sm">{selectedOrder.shippingAddress?.fullName}</p>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {selectedOrder.shippingAddress?.addressLine1}, 
                            {selectedOrder.shippingAddress?.tal && ` ${selectedOrder.shippingAddress.tal},`}
                            {selectedOrder.shippingAddress?.dist && ` ${selectedOrder.shippingAddress.dist},`}
                            {` ${selectedOrder.shippingAddress?.city}, ${selectedOrder.shippingAddress?.state} - ${selectedOrder.shippingAddress?.pincode}`}
                        </p>
                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                            <Phone size={12} /> {selectedOrder.shippingAddress?.phone}
                        </p>
                    </div>
                </div>

                {/* Items */}
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4">Order Items</h3>
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                        {selectedOrder.items?.map((item, i) => (
                            <div key={i} className="p-4 flex justify-between items-center">
                                <div className="flex gap-4 items-center">
                                    <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                                        <img src={item.image || 'https://placehold.co/48'} alt={item.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm line-clamp-1">{item.name}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {item.variant?.size && `Size: ${item.variant.size} `}
                                            {item.variant?.color && `Color: ${item.variant.color}`}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0 ml-4">
                                    <p className="font-bold text-sm">₹{item.price * item.quantity}</p>
                                    <p className="text-xs text-gray-500">{item.quantity} × ₹{item.price}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="mt-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700 space-y-2 text-sm">
                        <div className="flex justify-between text-gray-600 dark:text-gray-400">
                            <span>Subtotal</span>
                            <span>₹{selectedOrder.subtotal}</span>
                        </div>
                        <div className="flex justify-between text-gray-600 dark:text-gray-400">
                            <span>Shipping</span>
                            <span>{selectedOrder.shippingCost === 0 ? 'Free' : `₹${selectedOrder.shippingCost}`}</span>
                        </div>
                        {selectedOrder.couponDiscount > 0 && (
                            <div className="flex justify-between text-green-600">
                                <span>Discount ({selectedOrder.couponCode})</span>
                                <span>-₹{selectedOrder.couponDiscount}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold text-lg text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700 mt-2">
                            <span>Total</span>
                            <span className="text-primary-600">₹{selectedOrder.totalAmount}</span>
                        </div>
                    </div>
                </div>

                {/* Admin Note */}
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Edit size={16} /> Admin Notes (Private)
                    </h3>
                    <div className="relative">
                        <textarea
                            value={adminNote}
                            onChange={(e) => setAdminNote(e.target.value)}
                            placeholder="Add internal notes about this order... (e.g. Gift wrapping requested)"
                            className="input-field w-full h-24 p-3 text-sm resize-none"
                        ></textarea>
                        <button onClick={handleSaveAdminNote} className="absolute bottom-3 right-3 btn btn-primary py-1.5 px-3 text-xs">Save Note</button>
                    </div>
                </div>

                {/* Timeline */}
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Clock size={16} /> Order Timeline
                    </h3>
                    <div className="space-y-4 pl-2">
                        {selectedOrder.statusHistory?.slice().reverse().map((history, i) => (
                            <div key={i} className="relative pl-6 pb-4 border-l-2 border-gray-200 dark:border-gray-700 last:border-l-0 last:pb-0">
                                <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white dark:border-gray-900 ${i === 0 ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white capitalize">{history.status}</h4>
                                <p className="text-xs text-gray-500 mt-0.5">{new Date(history.updatedAt).toLocaleString()}</p>
                                {history.comment && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 bg-gray-50 dark:bg-gray-800 p-2 rounded inline-block">{history.comment}</p>}
                            </div>
                        ))}
                    </div>
                </div>

            </div>
          </div>
        </div>
      )}

      {/* Edit Address Modal */}
      {isEditAddressModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsEditAddressModalOpen(false)}></div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md relative z-10 animate-fade-in-up">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Edit Shipping Address</h3>
            </div>
            
            <form onSubmit={handleUpdateAddress} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <input type="text" required value={editAddressForm?.fullName || ''} onChange={e => setEditAddressForm({...editAddressForm, fullName: e.target.value})} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                <input type="text" required value={editAddressForm?.phone || ''} onChange={e => setEditAddressForm({...editAddressForm, phone: e.target.value})} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address Line 1</label>
                <input type="text" required value={editAddressForm?.addressLine1 || ''} onChange={e => setEditAddressForm({...editAddressForm, addressLine1: e.target.value})} className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                  <input type="text" required value={editAddressForm?.city || ''} onChange={e => setEditAddressForm({...editAddressForm, city: e.target.value})} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State</label>
                  <input type="text" required value={editAddressForm?.state || ''} onChange={e => setEditAddressForm({...editAddressForm, state: e.target.value})} className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pincode</label>
                <input type="text" required value={editAddressForm?.pincode || ''} onChange={e => setEditAddressForm({...editAddressForm, pincode: e.target.value})} className="input-field" />
              </div>
              
              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
                <button type="button" onClick={() => setIsEditAddressModalOpen(false)} className="btn bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300">Cancel</button>
                <button type="submit" disabled={isSubmittingAddress} className="btn btn-primary disabled:opacity-50">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hidden Printable Shipping Label */}
      <div className="hidden">
        <div ref={printLabelRef}>
           <ShippingLabel order={selectedOrder} settings={siteSettings} />
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;
