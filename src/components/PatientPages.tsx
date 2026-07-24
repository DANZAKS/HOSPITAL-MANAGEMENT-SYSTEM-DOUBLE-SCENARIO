/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Calendar, CreditCard, Receipt as ReceiptIcon, FileText, User as UserIcon, Bell, 
  Clock, Plus, Search, CheckCircle, XCircle, Info, Phone, MapPin, Heart, ChevronRight
} from 'lucide-react';
import { db } from '../db';
import { User, Appointment, Payment, Receipt, Prescription, MedicalHistory, Notification } from '../types';
import { ConfirmationModal } from './ConfirmationModal';

interface PatientPagesProps {
  activeTab: string;
  currentUser: User;
  onOpenReceipt: (receipt: Receipt) => void;
  onOpenPrescription: (prescription: Prescription) => void;
  toast: (msg: string) => void;
}

export const PatientPages: React.FC<PatientPagesProps> = ({
  activeTab,
  currentUser,
  onOpenReceipt,
  onOpenPrescription,
  toast
}) => {
  // DB states (auto-updates dynamically)
  const [appointments, setAppointments] = useState<Appointment[]>(() => db.getAppointments().filter(a => a.patientId === currentUser.id));
  const [payments, setPayments] = useState<Payment[]>(() => db.getPayments().filter(p => p.patientId === currentUser.id));
  const [receipts, setReceipts] = useState<Receipt[]>(() => db.getReceipts().filter(r => r.patientName === currentUser.fullName));
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(() => db.getPrescriptions().filter(p => p.patientId === currentUser.id));
  const [history, setHistory] = useState<MedicalHistory[]>(() => db.getMedicalHistory().filter(h => h.patientId === currentUser.id));
  const [notifications, setNotifications] = useState<Notification[]>(() => db.getNotifications().filter(n => n.userId === currentUser.id));

  // Profile forms
  const [fullName, setFullName] = useState(currentUser.fullName);
  const [email, setEmail] = useState(currentUser.email);
  const [phone, setPhone] = useState(currentUser.phone);
  const [dob, setDob] = useState(currentUser.dob || '');
  const [gender, setGender] = useState(currentUser.gender || 'Male');
  const [address, setAddress] = useState(currentUser.address || '');
  const [password, setPassword] = useState('');

  // Booking Form State
  const doctors = db.getUsers().filter(u => u.role === 'DOCTOR');
  const [selectedDocId, setSelectedDocId] = useState(doctors[0]?.id || '');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('09:00 AM');
  const [bookingReason, setBookingReason] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');

  // Payment Form State
  const [payService, setPayService] = useState('General Consultation Fee');
  const [payAmount, setPayAmount] = useState(150);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'danger' | 'warning' | 'success' | 'info';
    action: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    action: () => {}
  });

  const syncData = () => {
    setAppointments(db.getAppointments().filter(a => a.patientId === currentUser.id));
    setPayments(db.getPayments().filter(p => p.patientId === currentUser.id));
    setReceipts(db.getReceipts().filter(r => r.patientName === currentUser.fullName));
    setPrescriptions(db.getPrescriptions().filter(p => p.patientId === currentUser.id));
    setHistory(db.getMedicalHistory().filter(h => h.patientId === currentUser.id));
    setNotifications(db.getNotifications().filter(n => n.userId === currentUser.id));
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updates: Partial<User> = {
      fullName,
      email,
      phone,
      dob,
      gender,
      address
    };
    if (password) {
      updates.password = password;
    }

    db.updatePatientProfile(currentUser.id, updates);
    toast('Clinical profile successfully updated.');
    setPassword('');
    syncData();
  };

  const handleBookAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingDate || !bookingReason) {
      toast('Please supply appointment date and clinical reason.');
      return;
    }

    const doc = doctors.find(d => d.id === selectedDocId);
    if (!doc) return;

    db.bookAppointment({
      patientId: currentUser.id,
      patientName: currentUser.fullName,
      doctorId: doc.id,
      doctorName: doc.fullName,
      department: doc.department || 'General Practice',
      date: bookingDate,
      time: bookingTime,
      reason: bookingReason,
      notes: bookingNotes
    });

    toast(`Successfully booked appointment with ${doc.fullName}! Pending approval.`);
    setBookingReason('');
    setBookingNotes('');
    
    syncData();
    // Auto redirect active tab
    setTimeout(() => {
      // Trigger navigation click callback in App.tsx via simple state change helper (handled in App.tsx)
    }, 100);
  };

  const handleCancelAppointment = (apptId: string, docName: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Cancel Scheduled Appointment',
      message: `Are you sure you want to cancel your scheduled medical appointment with ${docName}? This action cannot be undone.`,
      type: 'danger',
      action: () => {
        db.setAppointmentStatus(apptId, 'Cancelled', 'Patient Request');
        toast(`Cancelled appointment with ${docName}.`);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        syncData();
      }
    });
  };

  const handleMakePayment = (e: React.FormEvent) => {
    e.preventDefault();
    db.makePayment({
      patientId: currentUser.id,
      patientName: currentUser.fullName,
      amount: payAmount,
      purpose: payService
    });

    toast(`Payment submission of ₦${payAmount.toFixed(2)} recorded. Pending admin verification.`);
    syncData();
  };

  const handleMarkNotifRead = (notifId: string) => {
    const all = db.getNotifications();
    const updated = all.map(n => {
      if (n.id === notifId) return { ...n, read: true };
      return n;
    });
    db.saveNotifications(updated);
    syncData();
  };

  const servicePrices: Record<string, number> = {
    'General Consultation Fee': 150.0,
    'Surgical Consult and Screening': 250.0,
    'Cardiology Diagnostics Suite': 350.0,
    'Urgent care Lab Analysis': 85.0,
    'Central Pharmacy Rx Refill': 45.0
  };

  const handleServiceChange = (service: string) => {
    setPayService(service);
    setPayAmount(servicePrices[service] || 150.0);
  };

  // --- RENDERING SUBTAB VIEWS ---

  if (activeTab === 'patient-dashboard') {
    const upcoming = appointments.filter(a => a.status === 'Approved' || a.status === 'Pending').slice(0, 2);
    const activeRx = prescriptions.filter(p => p.status === 'Sent');
    const recentHistory = history.slice(0, 3);
    const unreadNotifications = notifications.filter(n => !n.read);

    return (
      <div className="space-y-6">
        {/* Hero Alert card */}
        <div className="p-5 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg border border-transparent shadow flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-bold leading-tight">Patient Clinical Portal</h3>
            <p className="text-xs text-teal-50 max-w-2xl">
              Welcome back, {currentUser.fullName}. Access your clinical prescriptions, manage medical consults, book upcoming check-ups, and review secure invoice receipt files.
            </p>
          </div>
          <div className="bg-white/10 px-3 py-1.5 rounded border border-white/10 shrink-0 flex items-center gap-2">
            <Heart className="w-3.5 h-3.5 text-rose-300 animate-pulse" />
            <span className="text-[10px] font-bold font-mono tracking-wider">Patient ID: {currentUser.id}</span>
          </div>
        </div>

        {/* Dynamic Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Left Column (Appointments & History) */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Appointments */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-3">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600" />
                <span>Upcoming Scheduled Visits</span>
              </h4>
              <div className="space-y-2">
                {upcoming.map(a => (
                  <div key={a.id} className="p-3 bg-slate-50 border border-slate-200 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-xs">{a.doctorName}</span>
                        <span className="text-[10px] font-semibold text-slate-400">({a.department})</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">Scheduled: {a.date} at {a.time}</p>
                      <p className="text-[11px] text-slate-400 italic">"Reason: {a.reason}"</p>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        a.status === 'Approved' ? 'bg-teal-100 text-teal-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {a.status}
                      </span>
                      {a.status === 'Pending' && (
                        <button
                          onClick={() => handleCancelAppointment(a.id, a.doctorName)}
                          className="text-[10px] text-red-500 hover:underline font-bold"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {upcoming.length === 0 && (
                  <div className="py-6 text-center text-slate-400 text-xs italic">No scheduled appointments. Book a check-up below!</div>
                )}
              </div>
            </div>

            {/* Medical History */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-3">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Recent Medical Histories & Logs</h4>
              <div className="relative border-l border-slate-200 pl-4 space-y-4">
                {recentHistory.map((h, idx) => (
                  <div key={h.id} className="relative">
                    <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-teal-500 border-2 border-white ring-4 ring-teal-50" />
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 font-medium">{h.date} | Clinician {h.doctorName}</span>
                      <p className="font-bold text-xs text-slate-800">{h.title}</p>
                      <p className="text-xs text-slate-500 leading-normal">{h.description}</p>
                    </div>
                  </div>
                ))}
                {recentHistory.length === 0 && (
                  <p className="text-xs text-slate-400 italic">No medical history logs found.</p>
                )}
              </div>
            </div>

          </div>

          {/* Right Column (Prescriptions & Notifications) */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Active Prescriptions */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-3">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600" />
                <span>Active Prescriptions (Rx)</span>
              </h4>
              <div className="space-y-2">
                {activeRx.map(rx => (
                  <div key={rx.id} className="p-3 bg-indigo-50/50 border border-indigo-100 rounded space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-xs text-slate-800">{rx.medicineName}</p>
                        <p className="text-[10px] text-slate-400 font-medium">Physician: {rx.doctorName}</p>
                      </div>
                      <span className="text-[9px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">Sent</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono">Dosage: {rx.dosage} / {rx.frequency}</p>
                    <button
                      onClick={() => onOpenPrescription(rx)}
                      className="w-full py-1.5 bg-white hover:bg-slate-50 text-indigo-600 text-[10px] font-bold rounded border border-indigo-100 transition-colors cursor-pointer text-center"
                    >
                      Inspect Sheet
                    </button>
                  </div>
                ))}
                {activeRx.length === 0 && (
                  <p className="text-xs text-slate-400 italic text-center py-4">No pending prescriptions active.</p>
                )}
              </div>
            </div>

            {/* Quick Alerts Notification */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-3">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-teal-600" />
                <span>Alert Notification inbox ({unreadNotifications.length})</span>
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {unreadNotifications.map(n => (
                  <div key={n.id} className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1 relative text-xs">
                    <p className="font-bold text-slate-800">{n.title}</p>
                    <p className="text-slate-500 leading-snug text-[11px]">{n.message}</p>
                    <button
                      onClick={() => handleMarkNotifRead(n.id)}
                      className="text-[9px] text-teal-600 font-bold hover:underline"
                    >
                      Mark as read
                    </button>
                  </div>
                ))}
                {unreadNotifications.length === 0 && (
                  <p className="text-xs text-slate-400 italic text-center py-4">Your inbox is clean!</p>
                )}
              </div>
            </div>

          </div>

        </div>

        <ConfirmationModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          type={confirmModal.type}
          onConfirm={confirmModal.action}
          onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        />
      </div>
    );
  }

  if (activeTab === 'patient-profile') {
    return (
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm max-w-2xl font-sans">
        <div className="pb-4 border-b border-slate-100 mb-6">
          <h3 className="text-base font-bold text-slate-800">My Clinical Profile File</h3>
          <p className="text-xs text-slate-400 mt-1">Review demographic records or modify contact data on file.</p>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Patient Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-teal-500 rounded outline-none text-slate-700 font-semibold"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-teal-500 rounded outline-none text-slate-700 font-mono"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-teal-500 rounded outline-none text-slate-700"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date of Birth</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-teal-500 rounded outline-none text-slate-700"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gender Profile</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-teal-500 rounded outline-none text-slate-700 font-semibold"
              >
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Update Security Pin (Optional)</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to retain password"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-teal-500 rounded outline-none text-slate-700"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Residential Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-teal-500 rounded outline-none text-slate-700"
              required
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded shadow transition-colors cursor-pointer text-xs uppercase tracking-wider"
            >
              Save Demographic Profile
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (activeTab === 'patient-book') {
    return (
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm max-w-2xl font-sans">
        <div className="pb-4 border-b border-slate-200 mb-6">
          <h3 className="text-base font-bold text-slate-800">Book Medical Consultations</h3>
          <p className="text-xs text-slate-400 mt-1">Select your clinic physician, booking date, and describe symptoms.</p>
        </div>

        <form onSubmit={handleBookAppointment} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Hospital Physician</label>
              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-teal-500 rounded outline-none text-slate-700 font-semibold"
              >
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>{d.fullName} ({d.department})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Appointment date</label>
              <input
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-teal-500 rounded outline-none text-slate-700"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pre-booked Time Slot</label>
              <select
                value={bookingTime}
                onChange={(e) => setBookingTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-teal-500 rounded outline-none text-slate-700 font-semibold"
              >
                <option>09:00 AM</option>
                <option>10:00 AM</option>
                <option>11:15 AM</option>
                <option>02:00 PM</option>
                <option>03:30 PM</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reason for Clinical Visit</label>
            <input
              type="text"
              value={bookingReason}
              onChange={(e) => setBookingReason(e.target.value)}
              placeholder="e.g., Annual heart bypass follow-up, chest pressure, migraines"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-teal-500 rounded outline-none text-slate-700"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Additional clinical Notes (Optional)</label>
            <textarea
              value={bookingNotes}
              onChange={(e) => setBookingNotes(e.target.value)}
              placeholder="List current prescription medications, allergies, or previous surgical scans..."
              rows={3}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-teal-500 rounded outline-none text-slate-700"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded shadow transition-colors cursor-pointer text-xs uppercase tracking-wider"
            >
              Request Appointment Approval
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (activeTab === 'patient-appointments') {
    return (
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">My Medical Bookings Ledger</h3>
          <p className="text-xs text-slate-400">Review status, pending approval codes, or cancel scheduled visits.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold bg-slate-50">
                <th className="py-2.5 px-3">Unique Ref</th>
                <th className="py-2.5 px-3">Physician Name</th>
                <th className="py-2.5 px-3">Hospital Department</th>
                <th className="py-2.5 px-3">Date / Time Slot</th>
                <th className="py-2.5 px-3">Purpose for check-up</th>
                <th className="py-2.5 px-3 text-center">Calendar Status</th>
                <th className="py-2.5 px-3 text-right">Self Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {appointments.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-3 font-mono font-semibold text-slate-400">{a.id}</td>
                  <td className="py-3 px-3 font-bold text-slate-800">{a.doctorName}</td>
                  <td className="py-3 px-3 text-slate-500">{a.department}</td>
                  <td className="py-3 px-3 text-slate-500 font-medium">{a.date} at {a.time}</td>
                  <td className="py-3 px-3 text-slate-400 italic">{a.reason}</td>
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      a.status === 'Approved' ? 'bg-teal-100 text-teal-800' :
                      a.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                      a.status === 'Completed' ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    {a.status === 'Pending' || a.status === 'Approved' ? (
                      <button
                        onClick={() => handleCancelAppointment(a.id, a.doctorName)}
                        className="px-2.5 py-1 text-red-600 bg-red-50 hover:bg-red-600 hover:text-white text-[10px] font-bold rounded transition-colors cursor-pointer"
                      >
                        Cancel Booking
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400">Archived</span>
                    )}
                  </td>
                </tr>
              ))}
              {appointments.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 italic">No historical visits logged.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <ConfirmationModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          type={confirmModal.type}
          onConfirm={confirmModal.action}
          onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        />
      </div>
    );
  }

  if (activeTab === 'patient-payments') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Make Payment Form */}
        <div className="lg:col-span-5 bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4 h-fit">
          <div>
            <h3 className="text-base font-bold text-slate-800">Secure Billing Terminal</h3>
            <p className="text-xs text-slate-400">Select outstanding clinic bills and dispatch bank-transfer references.</p>
          </div>

          <form onSubmit={handleMakePayment} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Hospital Service Charged</label>
              <select
                value={payService}
                onChange={(e) => handleServiceChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded outline-none text-slate-700 font-semibold"
              >
                <option value="General Consultation Fee">Cardiology Consultation (₦150.00)</option>
                <option value="Surgical Consult and Screening">Surgical screening (₦250.00)</option>
                <option value="Cardiology Diagnostics Suite">Cardiac scans (₦350.00)</option>
                <option value="Urgent care Lab Analysis">Lab screening (₦85.00)</option>
                <option value="Central Pharmacy Rx Refill">Refill meds (₦45.00)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Value Charged (NGN)</label>
              <div className="text-lg font-black text-teal-600 bg-slate-50 p-2 border border-slate-200 rounded text-center">
                ₦{payAmount.toFixed(2)}
              </div>
            </div>

            <div className="space-y-1.5 bg-slate-50 p-3 border border-slate-200 rounded">
              <span className="text-[9px] font-bold text-teal-600 uppercase tracking-wider block mb-1">Simulated Credit Gateway</span>
              <p className="text-[10px] text-slate-400 leading-normal">
                Double Scenario Health Care utilizes instant clinical transfers. Pressing checkout creates a simulated ledger transaction reference which Admins verify immediately.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded shadow transition-colors cursor-pointer text-xs uppercase tracking-wider"
            >
              Authorize secure ₦{payAmount.toFixed(2)} Transfer
            </button>
          </form>
        </div>

        {/* History of Payments */}
        <div className="lg:col-span-7 bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">My Clinical Payments ledger</h3>
            <p className="text-xs text-slate-400">Status logs for clinical charges and verified transaction tokens.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold bg-slate-50">
                  <th className="py-2.5 px-3">Unique Ref</th>
                  <th className="py-2.5 px-3">Charge Purpose</th>
                  <th className="py-2.5 px-3">Value</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-center">Billing status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-600">{p.reference}</td>
                    <td className="py-3 px-3 text-slate-500 font-medium">{p.purpose}</td>
                    <td className="py-3 px-3 text-slate-800 font-bold">₦{p.amount.toFixed(2)}</td>
                    <td className="py-3 px-3 text-slate-400">{p.date}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        p.status === 'Verified' ? 'bg-teal-100 text-teal-800' :
                        p.status === 'Failed' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800 animate-pulse'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 italic">No payments recorded.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    );
  }

  if (activeTab === 'patient-receipts') {
    return (
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">My Clinical receipts registry</h3>
          <p className="text-xs text-slate-400">View or download official PDF invoice receipts verified by hospital audit desks.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold bg-slate-50">
                <th className="py-2.5 px-3">Receipt Number</th>
                <th className="py-2.5 px-3">Billing Reference</th>
                <th className="py-2.5 px-3">Service Charged</th>
                <th className="py-2.5 px-3">Total Paid</th>
                <th className="py-2.5 px-3">Authorized Signatory</th>
                <th className="py-2.5 px-3">Date Issued</th>
                <th className="py-2.5 px-3 text-right">Invoices</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {receipts.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-teal-700">{r.receiptNumber}</td>
                  <td className="py-3 px-3 font-mono text-slate-400">{r.reference}</td>
                  <td className="py-3 px-3 text-slate-500">{r.purpose}</td>
                  <td className="py-3 px-3 font-bold text-slate-800">₦{r.amountPaid.toFixed(2)}</td>
                  <td className="py-3 px-3 text-slate-400 italic">{r.authorizedBy}</td>
                  <td className="py-3 px-3 text-slate-400 font-mono">{r.date}</td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => onOpenReceipt(r)}
                      className="px-3 py-1.5 bg-teal-50 hover:bg-teal-600 hover:text-white text-teal-700 text-[10px] font-bold rounded transition-all cursor-pointer"
                    >
                      Inspect Invoice
                    </button>
                  </td>
                </tr>
              ))}
              {receipts.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 italic">No receipts issued yet. Payments must be verified by a Hospital Admin to generate receipt templates.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (activeTab === 'patient-history') {
    return (
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4 max-w-3xl">
        <div>
          <h3 className="text-base font-bold text-slate-800">My Clinical Health & Treatment File</h3>
          <p className="text-xs text-slate-400">Secure clinical logs containing diagnoses, physician check-ins, scans, and past prescriptions.</p>
        </div>

        <div className="relative border-l-2 border-teal-500/20 pl-6 ml-2 space-y-6 pt-2">
          {history.map((h) => (
            <div key={h.id} className="relative">
              {/* Dot wrapper */}
              <div className="absolute -left-[31px] top-1.5 w-4 h-4 bg-white border-2 border-teal-500 rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-ping" />
              </div>

              <div className="space-y-1 text-xs">
                <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-teal-50 text-teal-800 mb-1">
                  {h.type} Log
                </span>
                <span className="text-[10px] text-slate-400 block font-medium">Recorded: {h.date} | Clinician: {h.doctorName}</span>
                <h4 className="font-bold text-sm text-slate-800">{h.title}</h4>
                <p className="text-slate-500 leading-relaxed italic bg-slate-50 p-3 border border-slate-200 rounded">
                  "{h.description}"
                </p>
                {h.referenceId && (
                  <span className="text-[9px] font-mono text-slate-400">Internal Code reference: {h.referenceId}</span>
                )}
              </div>
            </div>
          ))}
          {history.length === 0 && (
            <p className="text-xs text-slate-400 italic">No health history logs available yet.</p>
          )}
        </div>
      </div>
    );
  }

  if (activeTab === 'patient-prescriptions') {
    return (
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">My Digital Prescriptions (Rx)</h3>
          <p className="text-xs text-slate-400">Browse current medical sheets sent by hospital doctors and active pharmacy dispensing states.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {prescriptions.map((p) => (
            <div key={p.id} className="p-4 bg-slate-50 border border-slate-200 rounded space-y-3 relative overflow-hidden flex flex-col justify-between">
              {/* Rx backdrop symbol */}
              <div className="absolute top-2 right-4 text-5xl font-bold font-serif text-slate-200/50 select-none">Rx</div>
              
              <div className="space-y-1.5 z-10">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono font-bold text-slate-400">{p.id}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                    p.status === 'Completed' || p.status === 'Dispensed' ? 'bg-teal-100 text-teal-800' :
                    p.status === 'Sent' ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {p.status}
                  </span>
                </div>
                <h4 className="font-black text-slate-800 text-sm leading-tight">{p.medicineName}</h4>
                <p className="text-[10px] text-slate-400">Issued by: {p.doctorName}</p>
                <div className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-100 font-medium">
                  <p>Dosage: {p.dosage}</p>
                  <p>Frequency: {p.frequency}</p>
                  <p>Duration: {p.duration}</p>
                </div>
                <p className="text-[11px] text-slate-400 italic">"Instructions: {p.instructions}"</p>
              </div>

              <button
                onClick={() => onOpenPrescription(p)}
                className="w-full mt-4 py-2 bg-white hover:bg-slate-100 text-indigo-600 hover:text-indigo-700 text-xs font-bold border border-indigo-100 rounded shadow-sm transition-colors cursor-pointer text-center"
              >
                Inspect Official Rx Sheet
              </button>
            </div>
          ))}
          {prescriptions.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 italic text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No prescriptions sent yet.
            </div>
          )}
        </div>
      </div>
    );
  }

  if (activeTab === 'patient-notifications') {
    return (
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm max-w-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800">Notifications alert Box</h3>
            <p className="text-xs text-slate-400">Complete historical log of inbox communications.</p>
          </div>
          <button
            onClick={() => {
              const all = db.getNotifications();
              const updated = all.map(n => {
                if (n.userId === currentUser.id) return { ...n, read: true };
                return n;
              });
              db.saveNotifications(updated);
              toast('Cleared inbox unread badges.');
              syncData();
            }}
            className="text-[10px] font-bold text-teal-600 hover:underline cursor-pointer"
          >
            Clear all unread
          </button>
        </div>

        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
          {notifications.map((n) => (
            <div key={n.id} className={`py-3 flex items-start justify-between gap-4 ${n.read ? 'opacity-60' : 'font-bold'}`}>
              <div className="space-y-0.5 text-xs">
                <span className="text-[10px] text-slate-400 font-medium block">{n.date}</span>
                <p className="text-slate-800">{n.title}</p>
                <p className="text-slate-500 font-normal leading-normal">{n.message}</p>
              </div>
              {!n.read && (
                <button
                  onClick={() => handleMarkNotifRead(n.id)}
                  className="text-[9px] text-teal-600 font-bold hover:underline shrink-0"
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
          {notifications.length === 0 && (
            <p className="text-xs text-slate-400 italic text-center py-6">Your inbox is empty.</p>
          )}
        </div>
      </div>
    );
  }

  return null;
};
