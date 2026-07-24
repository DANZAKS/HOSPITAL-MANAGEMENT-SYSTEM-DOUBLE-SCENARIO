/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Info, CheckCircle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'success' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  const colorMap = {
    danger: {
      bg: 'bg-red-50 text-red-600',
      border: 'border-red-100',
      button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      icon: <AlertTriangle className="w-6 h-6 text-red-600" />
    },
    warning: {
      bg: 'bg-amber-50 text-amber-600',
      border: 'border-amber-100',
      button: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
      icon: <AlertTriangle className="w-6 h-6 text-amber-600" />
    },
    success: {
      bg: 'bg-emerald-50 text-emerald-600',
      border: 'border-emerald-100',
      button: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500',
      icon: <CheckCircle className="w-6 h-6 text-emerald-600" />
    },
    info: {
      bg: 'bg-sky-50 text-sky-600',
      border: 'border-sky-100',
      button: 'bg-sky-600 hover:bg-sky-700 focus:ring-sky-500',
      icon: <Info className="w-6 h-6 text-sky-600" />
    }
  };

  const config = colorMap[type];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md overflow-hidden bg-white rounded-2xl shadow-2xl border border-slate-100 z-10"
        >
          {/* Header & Body */}
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl shrink-0 ${config.bg} ${config.border} border`}>
                {config.icon}
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold font-display text-slate-900">{title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{message}</p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors cursor-pointer ${config.button}`}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
