import React, { forwardRef } from 'react';
import QRCode from 'react-qr-code';
import Barcode from 'react-barcode';

const ShippingLabel = forwardRef(({ order, settings }, ref) => {
  if (!order) return null;

  const {
    storeLogo, storeName, storeAddress, storePhone, storeEmail, storeWebsite,
    showLogo, showQrCode, showBarcode, showCodBox, defaultCourier, footerText
  } = settings || {};

  const { shippingAddress, user, payment } = order;
  const isCOD = payment?.method === 'cod';

  // Special instructions logic
  const notes = (order.customerNote || order.adminNote || '').toLowerCase();
  const showFragile = notes.includes('fragile') || notes.includes('care');
  const showGift = notes.includes('gift');
  const showUpright = notes.includes('upright');

  // QR Code Payload (Condensed for scanning efficiency)
  const qrPayload = `ID:${order.orderNumber || order._id.slice(-6).toUpperCase()}|N:${shippingAddress?.fullName}|P:${shippingAddress?.phone}|PIN:${shippingAddress?.pincode}|TRK:${order.trackingNumber || 'N/A'}`;

  // Barcode Payload
  const barcodePayload = order.trackingNumber || order.orderNumber || order._id.slice(-6).toUpperCase();

  return (
    <div 
      ref={ref} 
      className="bg-white text-black font-sans box-border mx-auto border border-gray-400 print:border-none flex flex-col justify-between overflow-hidden relative" 
      style={{ width: '100mm', height: '150mm', padding: '4mm' }}
    >
      
      {/* 1. Header (Logo & Ship To) */}
      <div className="border-b-[3px] border-black pb-2 mb-2 flex justify-between items-start">
        <div className="w-[70%] pr-2">
          {showLogo && storeLogo ? (
             <img src={storeLogo} alt={storeName || 'Store Logo'} className="h-8 max-w-full object-contain mb-1 grayscale" style={{ WebkitFilter: 'grayscale(100%)' }} />
          ) : (
             <h1 className="text-xl font-extrabold uppercase tracking-tight leading-none mb-1">{storeName || 'Craftora'}</h1>
          )}
          <div className="mt-2">
             <p className="text-[10px] font-bold uppercase tracking-widest text-black mb-0.5 border-b border-black inline-block">Ship To</p>
             <h2 className="text-lg font-bold leading-none mt-1">{shippingAddress?.fullName || `${user?.firstName} ${user?.lastName}`}</h2>
             <p className="text-sm font-bold mt-1 leading-none">{shippingAddress?.phone}</p>
             <p className="text-[11px] leading-tight mt-1 line-clamp-3 font-medium">
               {shippingAddress?.addressLine1} {shippingAddress?.addressLine2 && `, ${shippingAddress?.addressLine2}`}
               <br />
               {shippingAddress?.city}, {shippingAddress?.state} - <span className="font-extrabold text-sm">{shippingAddress?.pincode}</span>
             </p>
          </div>
        </div>
        <div className="w-[30%] flex flex-col items-end">
          {showQrCode && (
            <div className="border-2 border-black p-1 bg-white">
              <QRCode value={qrPayload} size={70} level="M" />
            </div>
          )}
        </div>
      </div>

      {/* 2. Order Info & Courier Details */}
      <div className="flex border-b-[3px] border-black pb-2 mb-2 text-[9px] uppercase font-extrabold tracking-wider">
         <div className="w-1/2 pr-2 border-r-2 border-black">
            <div className="flex justify-between mb-1"><span className="text-gray-700">Order:</span> <span className="text-[11px] text-black truncate max-w-[70px]">{order.orderNumber || order._id.slice(-6).toUpperCase()}</span></div>
            <div className="flex justify-between mb-1"><span className="text-gray-700">Date:</span> <span className="text-black">{new Date(order.createdAt).toLocaleDateString()}</span></div>
            <div className="flex justify-between mb-1"><span className="text-gray-700">Items:</span> <span className="text-black">{order.items?.length || 0}</span></div>
            <div className="flex justify-between"><span className="text-gray-700">Weight:</span> <span className="text-black">{order.weight || '0.5 KG'}</span></div>
         </div>
         <div className="w-1/2 pl-2">
            <div className="flex justify-between mb-1"><span className="text-gray-700">Courier:</span> <span className="text-[11px] text-black truncate max-w-[70px]">{order.shippingProvider || defaultCourier || 'STANDARD'}</span></div>
            <div className="flex justify-between mb-1"><span className="text-gray-700">Payment:</span> <span className="text-black">{payment?.method}</span></div>
            <div className="flex justify-between mb-1"><span className="text-gray-700">Total:</span> <span className="text-black">₹{order.totalAmount}</span></div>
            <div className="flex justify-between"><span className="text-gray-700">Service:</span> <span className="text-black bg-black text-white px-1 -mr-1">EXPRESS</span></div>
         </div>
      </div>

      {/* 3. Barcode Section */}
      {showBarcode && (
        <div className="border-b-[3px] border-black pb-2 mb-2 flex flex-col items-center justify-center text-center">
          <div className="w-full flex justify-center overflow-hidden">
             <Barcode 
                value={barcodePayload} 
                format="CODE128" 
                width={1.8} 
                height={55} 
                fontSize={14} 
                margin={0} 
                displayValue={true} 
                fontOptions="bold"
                background="#ffffff"
                lineColor="#000000"
             />
          </div>
          <p className="text-[9px] font-bold mt-1 uppercase tracking-widest text-gray-800">AWB / Tracking Number</p>
        </div>
      )}

      {/* 4. COD Box & Special Instructions */}
      <div className="flex gap-2 flex-1 min-h-0 mb-2">
         {(isCOD && (showCodBox !== false)) ? (
            <div className="w-1/2 border-[4px] border-black p-1 flex flex-col items-center justify-center text-center">
               <span className="text-xl font-black tracking-widest leading-none mb-1">COD</span>
               <span className="text-[9px] font-extrabold uppercase border-y border-black w-full py-0.5 mb-1">Collect Amount</span>
               <span className="text-2xl font-black leading-none tracking-tighter">₹{order.totalAmount}</span>
            </div>
         ) : (
            <div className="w-1/2 border-[4px] border-black bg-black text-white p-1 flex flex-col items-center justify-center text-center" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
               <span className="text-xl font-black tracking-widest leading-none">PREPAID</span>
               <span className="text-[9px] uppercase font-bold mt-2">Do not collect cash</span>
            </div>
         )}
         
         <div className="w-1/2 border-2 border-black p-2 flex flex-col text-[10px] font-extrabold uppercase bg-gray-50 print:bg-transparent justify-center" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
             <span className="border-b border-black w-max mb-1 text-gray-700">Instructions</span>
             {(showFragile || showGift || showUpright) ? (
                <ul className="list-disc pl-3 text-[9px] leading-tight flex-1 flex flex-col justify-center space-y-1">
                   {showFragile && <li>FRAGILE</li>}
                   {showUpright && <li>KEEP UPRIGHT</li>}
                   {showGift && <li>GIFT ITEM</li>}
                </ul>
             ) : (
                <div className="text-center text-gray-400 my-auto text-lg leading-none">N/A</div>
             )}
         </div>
      </div>

      {/* 5. Footer */}
      <div className="border-t-[3px] border-black pt-2 text-center text-[8px] uppercase font-bold tracking-wider relative">
         <p className="text-sm font-black mb-1 leading-none">{footerText || 'Thank you for shopping!'}</p>
         <div className="flex flex-wrap justify-center gap-x-2 gap-y-0.5 text-gray-800 leading-none mb-1">
            {storeWebsite && <span>{storeWebsite.replace(/^https?:\/\//, '')}</span>}
            {storeWebsite && storePhone && <span className="opacity-50">|</span>}
            {storePhone && <span>{storePhone}</span>}
            {(storeWebsite || storePhone) && storeEmail && <span className="opacity-50">|</span>}
            {storeEmail && <span>{storeEmail}</span>}
         </div>
         <p className="text-[7px] text-gray-600 leading-none truncate max-w-full">Return to: {storeAddress}</p>
      </div>

    </div>
  );
});

ShippingLabel.displayName = 'ShippingLabel';
export default ShippingLabel;
