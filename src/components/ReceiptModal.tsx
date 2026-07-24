/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Printer, Download, Receipt as ReceiptIcon, ShieldCheck, Trash2 } from 'lucide-react';
import { Receipt } from '../types';

interface ReceiptModalProps {
  isOpen: boolean;
  receipt: Receipt | null;
  onClose: () => void;
  onCancelReceipt?: (receiptId: string) => void; // Available for Admin users
  isAdmin?: boolean;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  receipt,
  onClose,
  onCancelReceipt,
  isAdmin = false
}) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || !receipt) return null;

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      setIsPrinting(false);
      alert(`Sent receipt ${receipt.receiptNumber} to system print queue!`);
    }, 1500);
  };

  const handleDownload = () => {
    setIsDownloading(true);
    setTimeout(() => {
      setIsDownloading(false);
      // Create a simulation of downloading a file
      const blob = new Blob([JSON.stringify(receipt, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${receipt.receiptNumber}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }, 1200);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-white rounded-lg shadow-xl overflow-hidden border border-slate-200 z-10 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center gap-2 text-teal-600 font-semibold font-sans text-sm">
              <ReceiptIcon className="w-4 h-4" />
              <span>Digital Invoice & Receipt</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Receipt Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="p-5 bg-slate-50 border border-dashed border-slate-200 rounded relative overflow-hidden font-sans">
              {/* Canceled Watermark */}
              {receipt.status === 'Cancelled' && (
                <div className="absolute inset-0 flex items-center justify-center rotate-12 select-none pointer-events-none z-10">
                  <span className="px-5 py-2 border-4 border-red-500 rounded text-red-500 text-2xl font-extrabold uppercase tracking-widest bg-white/90 shadow-md">
                    Cancelled
                  </span>
                </div>
              )}

              {/* Hospital details */}
              <div className="text-center pb-4 border-b border-slate-200">
                <h3 className="text-base font-bold text-slate-800 tracking-wide uppercase">
                  {receipt.hospitalName}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">100 Health Science Blvd, Suite 400</p>
                <p className="text-xs text-slate-400">Tel: +1 (555) 010-0099 | billing@doublescenariohealth.com</p>
              </div>

              {/* Receipt metadata */}
              <div className="grid grid-cols-2 gap-3 py-3 text-xs text-slate-500 border-b border-slate-200">
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase tracking-wider">Receipt Number</span>
                  <span className="font-mono font-semibold text-slate-700">{receipt.receiptNumber}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase tracking-wider">Date Issued</span>
                  <span className="font-semibold text-slate-700">{receipt.date}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase tracking-wider">Payment Reference</span>
                  <span className="font-mono font-semibold text-slate-700">{receipt.reference}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase tracking-wider">Billing Status</span>
                  <span className={`inline-flex items-center px-1.5 py-0.5 mt-0.5 rounded text-[10px] font-semibold uppercase ${
                    receipt.status === 'Active' ? 'bg-teal-100 text-teal-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {receipt.status}
                  </span>
                </div>
              </div>

              {/* Patient Details */}
              <div className="py-3 border-b border-slate-200 text-xs">
                <span className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1.5">Patient Details</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400">Full Name:</span>
                    <p className="font-medium text-slate-800">{receipt.patientName}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Payer Account:</span>
                    <p className="font-medium text-slate-800">Hospital General Ledger</p>
                  </div>
                </div>
              </div>

              {/* Charge Breakdown */}
              <div className="py-3 space-y-2 text-xs">
                <span className="block text-[10px] text-slate-400 uppercase tracking-wider">Transaction Breakdown</span>
                <div className="flex items-center justify-between text-slate-600 bg-white p-2.5 rounded border border-slate-200">
                  <span>{receipt.purpose}</span>
                  <span className="font-semibold text-slate-800">₦{receipt.amountPaid.toFixed(2)}</span>
                </div>
                
                <div className="pt-2 flex items-center justify-between text-sm font-bold text-slate-800 border-t border-slate-200">
                  <span>TOTAL AMOUNT PAID</span>
                  <span className="text-teal-600 text-base">₦{receipt.amountPaid.toFixed(2)}</span>
                </div>
              </div>

              {/* Verification Stamp */}
              <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-200">
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <ShieldCheck className="w-5 h-5 text-teal-500" />
                  <div>
                    <span className="block font-semibold uppercase tracking-wider text-teal-600">Verified Secure</span>
                    <span>Admin Approved</span>
                  </div>
                </div>
                <div className="text-right text-[10px] text-slate-400">
                  <span className="block uppercase tracking-wider">Authorized Signatory</span>
                  <span className="font-medium text-slate-700 italic">{receipt.authorizedBy}</span>
                </div>
              </div>

              {/* Simulated Barcode */}
              <div className="mt-4 flex flex-col items-center justify-center space-y-1">
                <div className="h-6 w-44 bg-[repeating-linear-gradient(90deg,#1e293b,#1e293b_2px,#fff_2px,#fff_6px)] opacity-80" />
                <span className="text-[9px] font-mono text-slate-400 tracking-widest uppercase">{receipt.id}</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-t border-slate-200">
            {isAdmin && receipt.status === 'Active' && onCancelReceipt ? (
              <button
                onClick={() => onCancelReceipt(receipt.id)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:text-white hover:bg-red-600 border border-red-200 hover:border-red-600 rounded transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Cancel Receipt</span>
              </button>
            ) : (
              <div className="w-1" />
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                disabled={isPrinting}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded transition-colors cursor-pointer disabled:opacity-50"
              >
                <Printer className={`w-3.5 h-3.5 ${isPrinting ? 'animate-bounce' : ''}`} />
                <span>{isPrinting ? 'Printing...' : 'Print'}</span>
              </button>
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-500 hover:bg-teal-600 rounded shadow transition-colors cursor-pointer disabled:opacity-50"
              >
                <Download className={`w-3.5 h-3.5 ${isDownloading ? 'animate-spin' : ''}`} />
                <span>{isDownloading ? 'Downloading...' : 'Download'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
