/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileText, Check, Send, AlertCircle } from 'lucide-react';
import { Prescription } from '../types';

interface PrescriptionModalProps {
  isOpen: boolean;
  prescription: Prescription | null;
  onClose: () => void;
  onSend?: (prescriptionId: string) => void; // For Doctors
  onDispense?: (prescriptionId: string) => void; // For Pharmacists
  role: 'ADMIN' | 'PATIENT' | 'DOCTOR' | 'PHARMACIST';
}

export const PrescriptionModal: React.FC<PrescriptionModalProps> = ({
  isOpen,
  prescription,
  onClose,
  onSend,
  onDispense,
  role
}) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !prescription) return null;

  const handleSend = async () => {
    if (!onSend) return;
    setLoading(true);
    await onSend(prescription.id);
    setLoading(false);
  };

  const handleDispense = async () => {
    if (!onDispense) return;
    setLoading(true);
    await onDispense(prescription.id);
    setLoading(false);
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

        {/* Modal content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-white rounded-lg shadow-xl overflow-hidden border border-slate-200 z-10 flex flex-col font-sans"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center gap-2 text-teal-600 font-semibold text-sm">
              <FileText className="w-4 h-4" />
              <span>Medical Prescription (Rx)</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Rx Body */}
          <div className="p-5 overflow-y-auto space-y-4 max-h-[75vh]">
            <div className="border border-slate-200 rounded p-5 bg-slate-50/50 relative">
              {/* Rx watermarked background symbol */}
              <div className="absolute top-3 right-5 text-7xl font-serif text-slate-100 select-none font-bold">
                Rx
              </div>

              {/* Clinic details */}
              <div className="border-b border-slate-200 pb-3 mb-3">
                <h4 className="font-bold text-slate-800 tracking-wide">DOUBLE SCENARIO HEALTH CARE</h4>
                <p className="text-[11px] text-slate-400">Department of Clinical Medicine | Rx Pharmacy Network</p>
              </div>

              {/* Patient & Doctor headers */}
              <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 border-b border-slate-200 pb-3 mb-3">
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase tracking-wider">Patient Name</span>
                  <span className="font-semibold text-slate-800">{prescription.patientName}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase tracking-wider">Prescribing Physician</span>
                  <span className="font-semibold text-slate-800">{prescription.doctorName}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase tracking-wider">Date Created</span>
                  <span className="font-semibold text-slate-800">{prescription.dateCreated}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase tracking-wider">Status</span>
                  <span className={`inline-flex items-center px-1.5 py-0.5 mt-0.5 rounded text-[10px] font-semibold uppercase ${
                    prescription.status === 'Completed' || prescription.status === 'Dispensed'
                      ? 'bg-teal-100 text-teal-800'
                      : prescription.status === 'Sent'
                      ? 'bg-sky-100 text-sky-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {prescription.status}
                  </span>
                </div>
              </div>

              {/* Prescription Items */}
              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <div className="text-xl font-bold font-serif text-teal-600 mt-0.5">Rx</div>
                  <div className="flex-1 space-y-1">
                    <p className="font-bold text-slate-800 text-sm">{prescription.medicineName}</p>
                    <div className="grid grid-cols-3 gap-2 text-xs text-slate-500 bg-white p-2 rounded border border-slate-200">
                      <div>
                        <span className="block text-[9px] text-slate-400 uppercase">Dosage</span>
                        <span className="font-medium text-slate-700">{prescription.dosage}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-slate-400 uppercase">Frequency</span>
                        <span className="font-medium text-slate-700">{prescription.frequency}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-slate-400 uppercase">Duration</span>
                        <span className="font-medium text-slate-700">{prescription.duration}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="text-xs space-y-1 bg-white p-2.5 rounded border border-slate-200">
                  <span className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider">Directions & Instructions</span>
                  <p className="text-slate-600 leading-relaxed italic">"{prescription.instructions}"</p>
                </div>
              </div>

              {/* Signatures */}
              <div className="mt-6 pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
                <div>
                  <span className="block uppercase tracking-wider">Rx Auth Code</span>
                  <span className="font-mono font-semibold text-slate-600">{prescription.id}</span>
                </div>
                <div className="text-right">
                  <div className="w-24 border-b border-slate-300 ml-auto mb-1 h-5 relative">
                    <span className="absolute bottom-0 right-1 italic font-serif text-[11px] text-teal-600">
                      {prescription.doctorName.replace('Dr. ', '')}
                    </span>
                  </div>
                  <span className="block uppercase tracking-wider">Doctor Electronic Signature</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions Footer */}
          <div className="flex items-center justify-end gap-2 px-5 py-3.5 bg-slate-50 border-t border-slate-200">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
            >
              Close
            </button>

            {role === 'DOCTOR' && prescription.status === 'Pending' && onSend && (
              <button
                onClick={handleSend}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-500 hover:bg-teal-600 rounded shadow transition-colors cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{loading ? 'Sending...' : 'Send Prescription to Patient'}</span>
              </button>
            )}

            {role === 'PHARMACIST' && prescription.status === 'Sent' && onDispense && (
              <button
                onClick={handleDispense}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-500 hover:bg-teal-600 rounded shadow transition-colors cursor-pointer disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{loading ? 'Dispensing...' : 'Dispense and Update Stock'}</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
