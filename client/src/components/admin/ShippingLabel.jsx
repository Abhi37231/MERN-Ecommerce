import React, { forwardRef } from 'react';
import QRCode from 'react-qr-code';
import Barcode from 'react-barcode';

const ShippingLabel = forwardRef(({ order, settings }, ref) => {
  if (!order) return null;

  const {
    storeLogo, storeName, storeAddress, storePhone, storeEmail,
    showLogo, showQrCode, showBarcode, labelSize, footerText
  } = settings || {};

  const { shippingAddress, user, payment } = order;

  // Determine size classes (roughly translating A4, A5, 4x6 to css dimensions for the container)
  // For standard printing, the browser handles @page sizes, but we can style the container to look correct.
  let sizeClass = 'w-[4in] min-h-[6in] p-4 text-xs'; // default 4x6
  
  if (labelSize === 'A4') {
    sizeClass = 'w-[8.27in] min-h-[11.69in] p-8 text-sm';
  } else if (labelSize === 'A5') {
    sizeClass = 'w-[5.83in] min-h-[8.27in] p-6 text-sm';
  }

  return (
    <div ref={ref} className={`bg-white text-black font-sans box-border ${sizeClass} border border-gray-300 mx-auto print:border-none print:w-full print:h-full`}>
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-4">
        <div>
          {showLogo && storeLogo ? (
            <img src={storeLogo} alt={storeName || 'Store Logo'} className="h-12 object-contain mb-2" />
          ) : (
            <h1 className="text-2xl font-bold uppercase tracking-tight">{storeName || 'ShopSphere'}</h1>
          )}
          <div className="text-gray-700 leading-tight mt-2">
            <p>{storeAddress || '123 Store St, City, Country'}</p>
            <p>Phone: {storePhone || 'N/A'}</p>
            <p>Email: {storeEmail || 'N/A'}</p>
          </div>
        </div>
        {showQrCode && (
          <div className="flex-shrink-0">
            <QRCode value={order.orderNumber || order._id} size={64} level="L" />
          </div>
        )}
      </div>

      {/* Order Info Bar */}
      <div className="flex justify-between items-center bg-gray-100 p-2 border-y border-black font-bold mb-6 text-sm">
        <div>ORDER: {order.orderNumber || order._id.slice(-6).toUpperCase()}</div>
        <div>DATE: {new Date(order.createdAt).toLocaleDateString()}</div>
      </div>

      {/* Addresses */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <h2 className="font-bold border-b border-gray-300 mb-2 uppercase tracking-wide">Ship To</h2>
          <p className="font-bold text-base">{shippingAddress?.fullName || `${user?.firstName} ${user?.lastName}`}</p>
          <p>{shippingAddress?.addressLine1}</p>
          {shippingAddress?.addressLine2 && <p>{shippingAddress?.addressLine2}</p>}
          {(shippingAddress?.tal || shippingAddress?.dist) && (
             <p>
               {shippingAddress?.tal && `Tal: ${shippingAddress.tal} `}
               {shippingAddress?.dist && `Dist: ${shippingAddress.dist}`}
             </p>
          )}
          <p>{shippingAddress?.city}, {shippingAddress?.state}</p>
          <p className="font-bold">{shippingAddress?.pincode}</p>
          <p className="mt-1">Phone: <span className="font-bold">{shippingAddress?.phone}</span></p>
        </div>
        
        <div>
          <h2 className="font-bold border-b border-gray-300 mb-2 uppercase tracking-wide">Order Details</h2>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Items:</span>
              <span className="font-bold">{order.items?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Payment:</span>
              <span className="font-bold uppercase">{payment?.method}</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="font-bold uppercase">{payment?.status}</span>
            </div>
            <div className="flex justify-between border-t border-gray-300 pt-1 mt-1">
              <span>Total:</span>
              <span className="font-bold">₹{order.totalAmount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Optional Tracking Info */}
      <div className="mb-6 p-3 border-2 border-black rounded-lg">
        <h3 className="font-bold uppercase text-center mb-1 tracking-widest bg-black text-white -mt-3 -mx-3 p-1 rounded-t-sm">Routing Details</h3>
        <div className="grid grid-cols-2 gap-2 mt-2 text-center font-mono">
           <div>
               <p className="text-gray-500 uppercase text-[10px]">Courier</p>
               <p className="font-bold">{order.shippingProvider || 'STANDARD'}</p>
           </div>
           <div>
               <p className="text-gray-500 uppercase text-[10px]">Tracking Number</p>
               <p className="font-bold">{order.trackingNumber || 'N/A'}</p>
           </div>
        </div>
      </div>

      {/* Customer Note */}
      {(order.customerNote || order.adminNote) && (
        <div className="mb-6 p-2 border border-dashed border-gray-500">
          <p className="font-bold mb-1">Notes / Instructions:</p>
          <p>{order.customerNote}</p>
        </div>
      )}

      {/* Barcode & Footer */}
      <div className="mt-auto pt-6 flex flex-col items-center justify-end text-center">
        {showBarcode && (
          <div className="mb-4">
            <Barcode value={order.orderNumber || order._id.slice(-6).toUpperCase()} format="CODE128" width={labelSize === 'A4' ? 2 : 1.5} height={40} fontSize={12} margin={0} displayValue={true} />
          </div>
        )}
        <p className="text-gray-500 font-medium italic border-t border-gray-300 w-full pt-2">
          {footerText || 'Thank you for shopping with us!'}
        </p>
      </div>
    </div>
  );
});

ShippingLabel.displayName = 'ShippingLabel';
export default ShippingLabel;
