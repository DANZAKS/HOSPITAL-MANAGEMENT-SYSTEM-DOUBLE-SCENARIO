/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from './db';
import { User, Receipt, Prescription, Role } from './types';
import { LandingPage } from './components/LandingPage';
import { AuthPages } from './components/AuthPages';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { AdminPages } from './components/AdminPages';
import { PatientPages } from './components/PatientPages';
import { DoctorPages } from './components/DoctorPages';
import { PharmacistPages } from './components/PharmacistPages';
import { ReceiptModal } from './components/ReceiptModal';
import { PrescriptionModal } from './components/PrescriptionModal';

export default function App() {
  // Authentication & Navigation View states
  const [currentUser, setCurrentUser] = useState<User | null>(() => db.getCurrentUser());
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => !!db.getCurrentUser());
  const [authView, setAuthView] = useState<'login' | 'signup' | 'forgot' | 'landing'>('landing');

  // Sidebar Layout state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Active sub-page tab state
  const [activeTab, setActiveTab] = useState<string>('admin-dashboard');

  // Toast / System Notifications State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Deep inspection modal states
  const [inspectedReceipt, setInspectedReceipt] = useState<Receipt | null>(null);
  const [inspectedPrescription, setInspectedPrescription] = useState<Prescription | null>(null);

  // Initialize layout & tabs on reload or user changes
  useEffect(() => {
    if (currentUser) {
      setIsLoggedIn(true);
      // Auto assign initial tab based on role
      switch (currentUser.role) {
        case 'ADMIN':
          setActiveTab('admin-dashboard');
          break;
        case 'PATIENT':
          setActiveTab('patient-dashboard');
          break;
        case 'DOCTOR':
          setActiveTab('doctor-dashboard');
          break;
        case 'PHARMACIST':
          setActiveTab('pharmacist-dashboard');
          break;
      }
    } else {
      setIsLoggedIn(false);
      setAuthView('landing');
    }
  }, [currentUser]);

  // Handle toast alert notifications
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Actions
  const handleNavigateAuth = (view: 'login' | 'signup' | 'forgot' | 'landing') => {
    setAuthView(view);
  };

  const handleLoginSuccess = () => {
    const user = db.getCurrentUser();
    setCurrentUser(user);
    if (user) {
      triggerToast(`Authenticated successfully. Welcome back, ${user.fullName}!`);
    }
  };

  const handleLogout = () => {
    db.setCurrentUser(null);
    setCurrentUser(null);
    setIsLoggedIn(false);
    setAuthView('landing');
    triggerToast('Logged out of system securely.');
  };

  const handleOpenReceipt = (receipt: Receipt) => {
    setInspectedReceipt(receipt);
  };

  const handleOpenPrescription = (prescription: Prescription) => {
    setInspectedPrescription(prescription);
  };

  // Admin and Clinician sub-actions triggered within details modals
  const handleCancelReceipt = (receiptId: string) => {
    db.cancelReceipt(receiptId, currentUser?.fullName || 'System Admin');
    // Refresh modal content
    const updated = db.getReceipts().find(r => r.id === receiptId);
    if (updated) setInspectedReceipt(updated);
    triggerToast('Receipt canceled successfully.');
  };

  const handleSendPrescriptionFromModal = (prescriptionId: string) => {
    db.sendPrescriptionToPatient(prescriptionId);
    const updated = db.getPrescriptions().find(p => p.id === prescriptionId);
    if (updated) setInspectedPrescription(updated);
    triggerToast('Authorized & dispatched prescription.');
  };

  const handleDispensePrescriptionFromModal = (prescriptionId: string) => {
    db.dispensePrescription(prescriptionId, currentUser?.fullName || 'Hospital Pharmacist');
    const updated = db.getPrescriptions().find(p => p.id === prescriptionId);
    if (updated) setInspectedPrescription(updated);
    triggerToast('Dispensed medicines successfully. Stock levels adjusted.');
  };

  // --- RENDERING ROUTER ---

  // 1. PUBLIC LANDING VIEW
  if (!isLoggedIn && authView === 'landing') {
    return (
      <LandingPage
        onNavigateToLogin={() => handleNavigateAuth('login')}
        onNavigateToSignup={() => handleNavigateAuth('signup')}
      />
    );
  }

  // 2. PUBLIC AUTH/REGISTRATION VIEW
  if (!isLoggedIn) {
    return (
      <AuthPages
        view={authView as 'login' | 'signup' | 'forgot'}
        onNavigate={handleNavigateAuth}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // 3. SECURE AUTHENTICATED SYSTEM DASHBOARDS (ROLES)
  if (currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex font-sans">
        
        {/* Sidebar Nav */}
        <Sidebar
          role={currentUser.role}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onLogout={handleLogout}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          userFullName={currentUser.fullName}
        />

        {/* Core Layout page */}
        <div className={`flex-1 flex flex-col transition-all duration-300 min-w-0 ${isSidebarOpen ? 'pl-0 lg:pl-64' : 'pl-0 lg:pl-20'}`}>
          
          {/* Header */}
          <TopBar
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            currentUser={currentUser}
            onLogout={handleLogout}
            activeTab={activeTab}
          />

          {/* Tab contents router */}
          <main className="flex-1 p-4 md:p-6 overflow-y-auto max-w-7xl w-full mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="w-full"
              >
                {/* ADMIN MODULE */}
                {currentUser.role === 'ADMIN' && (
                  <AdminPages
                    activeTab={activeTab}
                    onOpenReceipt={handleOpenReceipt}
                    onOpenPrescription={handleOpenPrescription}
                    toast={triggerToast}
                  />
                )}

                {/* PATIENT MODULE */}
                {currentUser.role === 'PATIENT' && (
                  <PatientPages
                    activeTab={activeTab}
                    currentUser={currentUser}
                    onOpenReceipt={handleOpenReceipt}
                    onOpenPrescription={handleOpenPrescription}
                    toast={triggerToast}
                  />
                )}

                {/* DOCTOR MODULE */}
                {currentUser.role === 'DOCTOR' && (
                  <DoctorPages
                    activeTab={activeTab}
                    currentUser={currentUser}
                    onOpenPrescription={handleOpenPrescription}
                    toast={triggerToast}
                  />
                )}

                {/* PHARMACIST MODULE */}
                {currentUser.role === 'PHARMACIST' && (
                  <PharmacistPages
                    activeTab={activeTab}
                    onOpenPrescription={handleOpenPrescription}
                    toast={triggerToast}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        {/* GLOBAL SYSTEM TOAST BANNER OVERLAY */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="fixed bottom-6 right-6 z-50 max-w-sm bg-slate-900 text-white rounded-lg shadow-2xl border border-slate-800 p-4 flex items-center justify-between gap-3 text-xs font-sans"
            >
              <div className="flex-1 pr-2">
                <span className="text-[10px] text-teal-400 font-bold uppercase tracking-widest block mb-0.5">DOUBLE SCENARIO ALERT</span>
                <p className="font-semibold text-slate-200">{toastMessage}</p>
              </div>
              <button 
                onClick={() => setToastMessage(null)} 
                className="text-slate-500 hover:text-white font-bold px-1 text-lg"
              >
                &times;
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SHARED SYSTEM MODALS */}
        <ReceiptModal
          isOpen={!!inspectedReceipt}
          receipt={inspectedReceipt}
          onClose={() => setInspectedReceipt(null)}
          onCancelReceipt={handleCancelReceipt}
          isAdmin={currentUser.role === 'ADMIN'}
        />

        <PrescriptionModal
          isOpen={!!inspectedPrescription}
          prescription={inspectedPrescription}
          onClose={() => setInspectedPrescription(null)}
          onSend={handleSendPrescriptionFromModal}
          onDispense={handleDispensePrescriptionFromModal}
          role={currentUser.role}
        />

      </div>
    );
  }

  return null;
}
