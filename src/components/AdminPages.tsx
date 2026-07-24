/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Users, Stethoscope, ShieldAlert, Calendar, CreditCard, Receipt as ReceiptIcon, 
  Pill, FileText, Settings, Plus, Search, CheckCircle, XCircle, Trash2, ShieldCheck, RefreshCw, AlertTriangle
} from 'lucide-react';
import { db } from '../db';
import { User, Appointment, Payment, Receipt, Medicine, Prescription } from '../types';
import { ConfirmationModal } from './ConfirmationModal';

interface AdminPagesProps {
  activeTab: string;
  onOpenReceipt: (receipt: Receipt) => void;
  onOpenPrescription: (prescription: Prescription) => void;
  toast: (msg: string) => void;
}

export const AdminPages: React.FC<AdminPagesProps> = ({
  activeTab,
  onOpenReceipt,
  onOpenPrescription,
  toast
}) => {
  // Database retrieval states
  const [users, setUsers] = useState<User[]>(() => db.getUsers());
  const [appointments, setAppointments] = useState<Appointment[]>(() => db.getAppointments());
  const [payments, setPayments] = useState<Payment[]>(() => db.getPayments());
  const [receipts, setReceipts] = useState<Receipt[]>(() => db.getReceipts());
  const [medicines, setMedicines] = useState<Medicine[]>(() => db.getMedicines());
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(() => db.getPrescriptions());

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');

  // Modal forms states
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddMedModal, setShowAddMedModal] = useState(false);
  const [showUpdateStockModal, setShowUpdateStockModal] = useState(false);
  const [selectedMed, setSelectedMed] = useState<Medicine | null>(null);

  // New User form state
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserRole, setNewUserRole] = useState<'ADMIN' | 'DOCTOR'>('DOCTOR');
  const [newUserDept, setNewUserDept] = useState('Cardiology');

  // New Medicine form state
  const [newMedName, setNewMedName] = useState('');
  const [newMedCat, setNewMedCat] = useState('Antibiotics');
  const [newMedQty, setNewMedQty] = useState(50);
  const [newMedPrice, setNewMedPrice] = useState(10.0);
  const [newMedExp, setNewMedExp] = useState('2027-12-31');
  const [newMedSupplier, setNewMedSupplier] = useState('Pfizer');

  // Stock Quantity Update State
  const [updateStockQty, setUpdateStockQty] = useState(0);

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

  const triggerConfirm = (title: string, message: string, type: 'danger' | 'warning' | 'success' | 'info', action: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      type,
      action
    });
  };

  const syncAllData = () => {
    setUsers(db.getUsers());
    setAppointments(db.getAppointments());
    setPayments(db.getPayments());
    setReceipts(db.getReceipts());
    setMedicines(db.getMedicines());
    setPrescriptions(db.getPrescriptions());
  };

  // --- ACTIONS ---

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail || !newUserPhone) {
      toast('Please fill out all staff fields.');
      return;
    }

    db.addUser({
      email: newUserEmail,
      fullName: newUserName,
      phone: newUserPhone,
      role: newUserRole,
      password: newUserRole === 'ADMIN' ? 'admin' : 'doctor',
      department: newUserDept
    });

    toast(`Successfully added ${newUserName} as ${newUserRole}!`);
    setShowAddUserModal(false);
    
    // Clear state
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPhone('');
    
    syncAllData();
  };

  const handleDeleteUser = (userId: string, name: string) => {
    triggerConfirm(
      'Remove Staff Member',
      `Are you absolutely sure you want to delete ${name} from the system? This action is permanent and will suspend their login credentials.`,
      'danger',
      () => {
        db.deleteUser(userId);
        toast(`Removed ${name} from Double Scenario staff rosters.`);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        syncAllData();
      }
    );
  };

  const handleApproveAppointment = (apptId: string, patientName: string) => {
    triggerConfirm(
      'Approve Appointment Request',
      `Would you like to approve this clinic appointment request for ${patientName}? This will notify the patient and block the doctor's calendar.`,
      'success',
      () => {
        const currentUser = db.getCurrentUser();
        const adminName = currentUser ? currentUser.fullName : 'Hospital Admin';
        db.setAppointmentStatus(apptId, 'Approved', adminName);
        toast(`Appointment for ${patientName} is now Approved!`);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        syncAllData();
      }
    );
  };

  const handleCancelAppointment = (apptId: string, patientName: string) => {
    triggerConfirm(
      'Cancel Appointment Request',
      `Are you sure you want to decline/cancel this appointment request for ${patientName}?`,
      'danger',
      () => {
        const currentUser = db.getCurrentUser();
        const adminName = currentUser ? currentUser.fullName : 'Hospital Admin';
        db.setAppointmentStatus(apptId, 'Cancelled', adminName);
        toast(`Cancelled appointment for ${patientName}.`);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        syncAllData();
      }
    );
  };

  const handleVerifyPayment = (paymentId: string, amount: number) => {
    triggerConfirm(
      'Verify Payment',
      `Verify receipt of $${amount.toFixed(2)}? This action marks the payment as secure and automatically triggers an official digital receipt copy.`,
      'success',
      () => {
        const currentUser = db.getCurrentUser();
        const adminName = currentUser ? currentUser.fullName : 'Hospital Admin';
        db.verifyPayment(paymentId, adminName);
        toast(`Verified payment of $${amount.toFixed(2)}. Receipt generated!`);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        syncAllData();
      }
    );
  };

  const handleRejectPayment = (paymentId: string) => {
    triggerConfirm(
      'Reject Billing Ledger',
      'Mark this patient payment submission as rejected/failed? This will alert the patient portal.',
      'danger',
      () => {
        db.rejectPayment(paymentId);
        toast('Rejected payment transaction.');
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        syncAllData();
      }
    );
  };

  const handleCancelReceipt = (receiptId: string, receiptNum: string) => {
    triggerConfirm(
      'Revoke Official Receipt',
      `Are you sure you want to VOID and Cancel Receipt ${receiptNum}? This action represents critical clinical billing audit changes.`,
      'danger',
      () => {
        const currentUser = db.getCurrentUser();
        const adminName = currentUser ? currentUser.fullName : 'Hospital Admin';
        db.cancelReceipt(receiptId, adminName);
        toast(`Receipt ${receiptNum} has been voided.`);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        syncAllData();
      }
    );
  };

  const handleAddMedicine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName || !newMedSupplier) {
      toast('Please input the medicine name and supplier.');
      return;
    }

    db.addMedicine({
      name: newMedName,
      category: newMedCat,
      quantity: Number(newMedQty),
      unitPrice: Number(newMedPrice),
      expiryDate: newMedExp,
      supplier: newMedSupplier
    });

    toast(`Successfully added "${newMedName}" to pharmaceutical stock!`);
    setShowAddMedModal(false);
    
    setNewMedName('');
    setNewMedQty(50);
    setNewMedPrice(10);
    
    syncAllData();
  };

  const handleOpenUpdateStock = (med: Medicine) => {
    setSelectedMed(med);
    setUpdateStockQty(med.quantity);
    setShowUpdateStockModal(true);
  };

  const handleUpdateStockQty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMed) return;

    db.updateMedicineStock(selectedMed.id, updateStockQty);
    toast(`Replenished stock of ${selectedMed.name} to ${updateStockQty} units.`);
    setShowUpdateStockModal(false);
    setSelectedMed(null);
    syncAllData();
  };

  const handleDeleteMedicine = (medId: string, name: string) => {
    triggerConfirm(
      'Deplete Medicine stock',
      `Delete ${name} from pharmacy catalogs permanently?`,
      'danger',
      () => {
        db.deleteMedicine(medId);
        toast(`Removed "${name}" from stock catalog.`);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        syncAllData();
      }
    );
  };

  // --- RENDERING VIEWS ---

  if (activeTab === 'admin-dashboard') {
    const totalPatients = users.filter(u => u.role === 'PATIENT').length;
    const totalDoctors = users.filter(u => u.role === 'DOCTOR').length;
    const totalStaff = users.filter(u => u.role === 'ADMIN').length - 1; // excluding main admin
    const pendingAppts = appointments.filter(a => a.status === 'Pending').length;
    const approvedAppts = appointments.filter(a => a.status === 'Approved').length;
    
    const verifiedPayments = payments.filter(p => p.status === 'Verified');
    const totalRevenue = verifiedPayments.reduce((acc, curr) => acc + curr.amount, 0);
    const lowStockMeds = medicines.filter(m => m.stockStatus !== 'In Stock').length;
    
    const stats = [
      { label: 'Active Patients', val: totalPatients, icon: <Users className="w-5 h-5 text-teal-600" />, bg: 'bg-teal-50 border-teal-100' },
      { label: 'Licensed Doctors', val: totalDoctors, icon: <Stethoscope className="w-5 h-5 text-slate-600" />, bg: 'bg-slate-100 border-slate-200' },
      { label: 'Emergency Staff', val: totalStaff, icon: <Users className="w-5 h-5 text-cyan-600" />, bg: 'bg-cyan-50 border-cyan-100' },
      { label: 'Pending Visits', val: pendingAppts, icon: <Calendar className="w-5 h-5 text-amber-600" />, bg: 'bg-amber-50 border-amber-100' },
      { label: 'Active Receipts', val: approvedAppts, icon: <CheckCircle className="w-5 h-5 text-teal-600" />, bg: 'bg-teal-50 border-teal-100' },
      { label: 'Hospital Revenue', val: `₦${totalRevenue.toFixed(2)}`, icon: <CreditCard className="w-5 h-5 text-teal-600" />, bg: 'bg-teal-50/70 border-teal-100/60' },
      { label: 'Low Stock Rx', val: lowStockMeds, icon: <Pill className="w-5 h-5 text-red-600" />, bg: 'bg-red-50 border-red-100' }
    ];

    return (
      <div className="space-y-4 font-sans">
        {/* Banner greeting */}
        <div className="p-5 bg-white rounded-lg border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div>
            <h3 className="text-base font-bold text-slate-800">Hospital Command Center</h3>
            <p className="text-xs text-slate-400 mt-1">Hello {db.getCurrentUser()?.fullName || 'System Admin'}. Monitor admissions, verified medical receipts, and system users.</p>
          </div>
          <button
            onClick={() => {
              syncAllData();
              toast('Refreshed real-time clinical parameters!');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 text-xs font-semibold rounded transition-colors self-start cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Stats</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, idx) => (
            <div key={idx} className={`p-4 rounded-lg border ${s.bg} flex items-center justify-between shadow-sm`}>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{s.label}</span>
                <span className="text-xl font-black text-slate-800 leading-none">{s.val}</span>
              </div>
              <div className="p-2 bg-white rounded shadow-sm">
                {s.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Action highlights */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Quick Tasks */}
          <div className="lg:col-span-4 bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">Administrative Shortcuts</h4>
            <div className="space-y-2">
              <button 
                onClick={() => setShowAddUserModal(true)} 
                className="w-full py-2 px-3 text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-xs font-bold text-slate-700 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>Add Medical Specialist</span>
                <Plus className="w-4 h-4 text-teal-600" />
              </button>
              <button 
                onClick={() => setShowAddMedModal(true)} 
                className="w-full py-2 px-3 text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-xs font-bold text-slate-700 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>Add New Medicine Stock</span>
                <Plus className="w-4 h-4 text-teal-600" />
              </button>
            </div>

            {/* Low stock indicators */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stock Warning Alerts</h5>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {medicines.filter(m => m.stockStatus !== 'In Stock').map(med => (
                  <div key={med.id} className="p-2.5 bg-red-50/50 border border-red-100 rounded flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{med.name}</p>
                      <p className="text-[10px] text-slate-400">Supplier: {med.supplier}</p>
                    </div>
                    <span className="text-red-600 font-bold bg-white px-2 py-0.5 rounded border border-red-100 font-mono">
                      {med.quantity} Left
                    </span>
                  </div>
                ))}
                {medicines.filter(m => m.stockStatus !== 'In Stock').length === 0 && (
                  <p className="text-xs text-slate-400 italic">All medicines fully stocked.</p>
                )}
              </div>
            </div>
          </div>

          {/* Recent Operations */}
          <div className="lg:col-span-8 bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-3">Pending Consultations Queue</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-semibold bg-slate-50">
                      <th className="py-2 px-3">Patient</th>
                      <th className="py-2 px-3">Assigned MD</th>
                      <th className="py-2 px-3">Date/Time</th>
                      <th className="py-2 px-3">Purpose</th>
                      <th className="py-2 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {appointments.filter(a => a.status === 'Pending').slice(0, 4).map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-700">{a.patientName}</td>
                        <td className="py-2.5 px-3 text-slate-500">{a.doctorName}</td>
                        <td className="py-2.5 px-3 text-slate-500 font-medium">{a.date} ({a.time})</td>
                        <td className="py-2.5 px-3 text-slate-400 italic line-clamp-1 max-w-32">{a.reason}</td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleApproveAppointment(a.id, a.patientName)}
                              className="p-1 bg-teal-50 text-teal-600 hover:bg-teal-600 hover:text-white rounded transition-colors cursor-pointer"
                              title="Approve Visit"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleCancelAppointment(a.id, a.patientName)}
                              className="p-1 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded transition-colors cursor-pointer"
                              title="Decline Visit"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {appointments.filter(a => a.status === 'Pending').length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 italic">No pending appointments in queue.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>

        {/* MODALS HOOKS */}
        {showAddUserModal && renderAddUserModal()}
        {showAddMedModal && renderAddMedModal()}
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

  if (activeTab === 'admin-patients') {
    const patients = users.filter(u => u.role === 'PATIENT');
    const filtered = patients.filter(p => p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || p.email.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4 font-sans">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">Master Patients Database</h3>
            <p className="text-xs text-slate-400">Search and explore demographic information for registered patients.</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-teal-500 rounded text-xs outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold bg-slate-50">
                <th className="py-2.5 px-3">Unique Patient ID</th>
                <th className="py-2.5 px-3">Patient Full Name</th>
                <th className="py-2.5 px-3">Email Address</th>
                <th className="py-2.5 px-3">Phone Number</th>
                <th className="py-2.5 px-3">Date of Birth</th>
                <th className="py-2.5 px-3">Gender</th>
                <th className="py-2.5 px-3">Address</th>
                <th className="py-2.5 px-3 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-3 font-mono font-semibold text-slate-400">{p.id}</td>
                  <td className="py-3 px-3 font-bold text-slate-800">{p.fullName}</td>
                  <td className="py-3 px-3 text-slate-500 font-mono">{p.email}</td>
                  <td className="py-3 px-3 text-slate-500">{p.phone}</td>
                  <td className="py-3 px-3 text-slate-500">{p.dob || 'N/A'}</td>
                  <td className="py-3 px-3 text-slate-500">{p.gender || 'N/A'}</td>
                  <td className="py-3 px-3 text-slate-400 truncate max-w-44" title={p.address}>{p.address || 'N/A'}</td>
                  <td className="py-3 px-3 text-right">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-teal-100 text-teal-800">
                      Active File
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 italic">No patients match the filter queries.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (activeTab === 'admin-doctors') {
    const specialists = users.filter(u => u.role === 'DOCTOR' || u.role === 'ADMIN').filter(u => u.id !== 'ADMIN-1');
    const filtered = specialists.filter(s => {
      const matchSearch = s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || s.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDept = deptFilter === 'All' || s.department === deptFilter;
      return matchSearch && matchDept;
    });

    const depts = ['All', 'Cardiology', 'General Surgery', 'Neurosurgery', 'Central Pharmacy', 'Emergency Medicine'];

    return (
      <div className="space-y-4 font-sans">
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">Hospital Medical Specialists</h3>
              <p className="text-xs text-slate-400">Onboard new clinicians or manage credentials of active staff rosters.</p>
            </div>
            <div className="flex items-center gap-3 self-end sm:self-auto">
              <button
                onClick={() => setShowAddUserModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold rounded shadow transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Onboard Clinician</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            {/* Filter tags */}
            <div className="flex flex-wrap gap-1.5">
              {depts.map((d) => (
                <button
                  key={d}
                  onClick={() => setDeptFilter(d)}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                    deptFilter === d 
                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm' 
                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            {/* Search box */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 focus:border-teal-500 rounded text-[11px] outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold bg-slate-50">
                  <th className="py-2.5 px-3">Onboarded ID</th>
                  <th className="py-2.5 px-3">Staff Name</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Hospital Department</th>
                  <th className="py-2.5 px-3">Email Address</th>
                  <th className="py-2.5 px-3">Contact phone</th>
                  <th className="py-2.5 px-3">Date Added</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-3 font-mono text-slate-400">{s.id}</td>
                    <td className="py-3 px-3 font-bold text-slate-800">{s.fullName}</td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                        s.role === 'ADMIN' ? 'bg-amber-100 text-amber-800' : 'bg-teal-100 text-teal-800'
                      }`}>
                        {s.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-semibold">{s.department || 'General Practice'}</td>
                    <td className="py-3 px-3 text-slate-500 font-mono">{s.email}</td>
                    <td className="py-3 px-3 text-slate-500">{s.phone}</td>
                    <td className="py-3 px-3 text-slate-400">{s.dateAdded || 'Historical'}</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleDeleteUser(s.id, s.fullName)}
                        className="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer border border-transparent"
                        title="Remove Specialist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 italic">No specialist records found matching filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showAddUserModal && renderAddUserModal()}
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

  if (activeTab === 'admin-appointments') {
    return (
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4 font-sans">
        <div>
          <h3 className="text-base font-bold text-slate-800">Hospital Appointment Ledger</h3>
          <p className="text-xs text-slate-400">Monitor scheduling compliance, approve incoming visits, and track cancelled slots.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold bg-slate-50">
                <th className="py-2.5 px-3">Appt Reference</th>
                <th className="py-2.5 px-3">Patient Name</th>
                <th className="py-2.5 px-3">Assigned specialist</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3">Date / Time Slot</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Administrative Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {appointments.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-3 font-mono font-semibold text-slate-400">{a.id}</td>
                  <td className="py-3 px-3 font-bold text-slate-800">{a.patientName}</td>
                  <td className="py-3 px-3 text-slate-600 font-medium">{a.doctorName}</td>
                  <td className="py-3 px-3 text-slate-500">{a.department}</td>
                  <td className="py-3 px-3 text-slate-500 font-medium">{a.date} at {a.time}</td>
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      a.status === 'Approved' ? 'bg-teal-100 text-teal-800' :
                      a.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                      a.status === 'Completed' ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    {a.status === 'Pending' ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApproveAppointment(a.id, a.patientName)}
                          className="px-2.5 py-1 bg-teal-500 hover:bg-teal-600 text-white text-[10px] font-bold rounded shadow transition-colors cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleCancelAppointment(a.id, a.patientName)}
                          className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold rounded transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400">No pending action</span>
                    )}
                  </td>
                </tr>
              ))}
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

  if (activeTab === 'admin-payments') {
    return (
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4 font-sans">
        <div>
          <h3 className="text-base font-bold text-slate-800">Financial Payments Log</h3>
          <p className="text-xs text-slate-400">Verify submitted bank ledger reference and authorize automated receipt files.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold bg-slate-50">
                <th className="py-2.5 px-3">Transaction ID</th>
                <th className="py-2.5 px-3">Patient Name</th>
                <th className="py-2.5 px-3">Ledger Reference</th>
                <th className="py-2.5 px-3">Purpose of Billing</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Submission Date</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Verification Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-3 font-mono font-semibold text-slate-400">{p.id}</td>
                  <td className="py-3 px-3 font-bold text-slate-800">{p.patientName}</td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-600">{p.reference}</td>
                  <td className="py-3 px-3 text-slate-500">{p.purpose}</td>
                  <td className="py-3 px-3 text-slate-800 font-bold">₦{p.amount.toFixed(2)}</td>
                  <td className="py-3 px-3 text-slate-400">{p.date}</td>
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      p.status === 'Verified' ? 'bg-teal-100 text-teal-800' :
                      p.status === 'Failed' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    {p.status === 'Pending' ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleVerifyPayment(p.id, p.amount)}
                          className="px-2.5 py-1 bg-teal-500 hover:bg-teal-600 text-white text-[10px] font-bold rounded shadow transition-colors cursor-pointer"
                        >
                          Verify Ledger
                        </button>
                        <button
                          onClick={() => handleRejectPayment(p.id)}
                          className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold rounded transition-colors cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium">Verified by Sarah J.</span>
                    )}
                  </td>
                </tr>
              ))}
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

  if (activeTab === 'admin-receipts') {
    return (
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4 font-sans">
        <div>
          <h3 className="text-base font-bold text-slate-800">Official Billings Receipt Registry</h3>
          <p className="text-xs text-slate-400">View active patient clinical receipts, download audit templates, or cancel invoices when needed.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold bg-slate-50">
                <th className="py-2.5 px-3">Receipt Number</th>
                <th className="py-2.5 px-3">Associated Patient</th>
                <th className="py-2.5 px-3">Bank Reference</th>
                <th className="py-2.5 px-3">Charge Purpose</th>
                <th className="py-2.5 px-3">Value Paid</th>
                <th className="py-2.5 px-3">Authorized Signatory</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Audit Options</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {receipts.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-teal-700">{r.receiptNumber}</td>
                  <td className="py-3 px-3 font-bold text-slate-800">{r.patientName}</td>
                  <td className="py-3 px-3 font-mono text-slate-400">{r.reference}</td>
                  <td className="py-3 px-3 text-slate-500">{r.purpose}</td>
                  <td className="py-3 px-3 font-bold text-slate-800">₦{r.amountPaid.toFixed(2)}</td>
                  <td className="py-3 px-3 text-slate-400 italic">{r.authorizedBy}</td>
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      r.status === 'Active' ? 'bg-teal-100 text-teal-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onOpenReceipt(r)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded transition-colors cursor-pointer"
                      >
                        Inspect Invoice
                      </button>
                      {r.status === 'Active' && (
                        <button
                          onClick={() => handleCancelReceipt(r.id, r.receiptNumber)}
                          className="px-2.5 py-1 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 text-[10px] font-bold rounded transition-all cursor-pointer"
                        >
                          Void
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
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

  if (activeTab === 'admin-pharmacy') {
    return (
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4 font-sans">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800">Pharmaceutical Stock Catalog</h3>
            <p className="text-xs text-slate-400">Monitor quantities, suppliers, and trigger stock alerts.</p>
          </div>
          <button
            onClick={() => setShowAddMedModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold rounded shadow transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Onboard Medicine</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold bg-slate-50">
                <th className="py-2.5 px-3">Medicine Name</th>
                <th className="py-2.5 px-3">Therapeutic Category</th>
                <th className="py-2.5 px-3">Available units</th>
                <th className="py-2.5 px-3">Unit Price</th>
                <th className="py-2.5 px-3">Expiry Date</th>
                <th className="py-2.5 px-3">Registered Supplier</th>
                <th className="py-2.5 px-3 text-center">Inventory Status</th>
                <th className="py-2.5 px-3 text-right">Replenishment Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {medicines.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-3 font-bold text-slate-800">{m.name}</td>
                  <td className="py-3 px-3 text-slate-500 font-semibold">{m.category}</td>
                  <td className="py-3 px-3 text-slate-800 font-bold font-mono">{m.quantity} Units</td>
                  <td className="py-3 px-3 text-slate-500">₦{m.unitPrice.toFixed(2)}</td>
                  <td className="py-3 px-3 text-slate-400 font-mono">{m.expiryDate}</td>
                  <td className="py-3 px-3 text-slate-400">{m.supplier}</td>
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                      m.stockStatus === 'In Stock' ? 'bg-teal-100 text-teal-800' :
                      m.stockStatus === 'Low Stock' ? 'bg-amber-100 text-amber-800 animate-pulse' : 'bg-red-100 text-red-800'
                    }`}>
                      {m.stockStatus}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenUpdateStock(m)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold rounded transition-colors cursor-pointer"
                      >
                        Adjust stock
                      </button>
                      <button
                        onClick={() => handleDeleteMedicine(m.id, m.name)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer"
                        title="Delete medicine record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showAddMedModal && renderAddMedModal()}
        {showUpdateStockModal && renderUpdateStockModal()}
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

  if (activeTab === 'admin-prescriptions') {
    return (
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4 font-sans">
        <div>
          <h3 className="text-base font-bold text-slate-800">Global Clinical Prescriptions Register</h3>
          <p className="text-xs text-slate-400">Review generated digital prescriptions and delivery logs across clinics.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold bg-slate-50">
                <th className="py-2.5 px-3">Prescription Code</th>
                <th className="py-2.5 px-3">Patient Name</th>
                <th className="py-2.5 px-3">Prescribing Physician</th>
                <th className="py-2.5 px-3">Medicine Ordered</th>
                <th className="py-2.5 px-3">Dosage & Frequency</th>
                <th className="py-2.5 px-3">Date Dispatched</th>
                <th className="py-2.5 px-3 text-center">Pharmacy Status</th>
                <th className="py-2.5 px-3 text-right">Receipt Sheet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {prescriptions.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-teal-700">{p.id}</td>
                  <td className="py-3 px-3 font-bold text-slate-800">{p.patientName}</td>
                  <td className="py-3 px-3 text-slate-500 font-medium">{p.doctorName}</td>
                  <td className="py-3 px-3 font-semibold text-slate-700">{p.medicineName}</td>
                  <td className="py-3 px-3 text-slate-400">{p.dosage}, {p.frequency} ({p.duration})</td>
                  <td className="py-3 px-3 text-slate-400">{p.dateCreated}</td>
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                      p.status === 'Completed' || p.status === 'Dispensed' ? 'bg-teal-100 text-teal-800' :
                      p.status === 'Sent' ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => onOpenPrescription(p)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold rounded transition-colors cursor-pointer"
                    >
                      View Sheet
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (activeTab === 'admin-settings') {
    return (
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm max-w-2xl space-y-4 font-sans">
        <div>
          <h3 className="text-base font-bold text-slate-800">Hospital Administration Settings</h3>
          <p className="text-xs text-slate-400 mt-1">Configure regulatory, metadata, and system backup presets.</p>
        </div>

        <div className="space-y-4 pt-2 border-t border-slate-100">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hospital Legal Corporate Name</label>
            <input
              type="text"
              defaultValue="Double Scenario Health Care Group Inc."
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs outline-none text-slate-700 focus:border-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Default Consultation Rate (USD)</label>
              <input
                type="number"
                defaultValue={150.0}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs outline-none text-slate-700 focus:border-teal-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Authorized billing Signatory</label>
              <input
                type="text"
                defaultValue={db.getCurrentUser()?.fullName || "System Admin"}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs outline-none text-slate-700 focus:border-teal-500"
              />
            </div>
          </div>

          <div className="space-y-1.5 bg-slate-50 p-3 border border-slate-200 rounded">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Clinical Database Safety Backup</span>
            <p className="text-[11px] text-slate-400 leading-normal">
              Double Scenario Health Care clinical records are synchronized securely inside regional storage containers. Create immediate snap-point file dumps below:
            </p>
            <button
              onClick={() => toast('Created full-system SQL backup dump! (DS-HMS-DUMP-2026.sql)')}
              className="mt-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-bold rounded shadow transition-colors cursor-pointer"
            >
              Export System DB Dump (.sql)
            </button>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={() => toast('Administrative parameters successfully saved.')}
            className="px-4 py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold rounded shadow transition-colors cursor-pointer"
          >
            Save Admin Parameters
          </button>
        </div>
      </div>
    );
  }

  return null;

  // --- SUB-MODAL RENDERS ---

  function renderAddUserModal() {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowAddUserModal(false)} />
        <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden border border-slate-200 z-10 p-5 font-sans">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h4 className="font-bold text-slate-800 text-sm">Onboard Medical Specialist</h4>
            <button onClick={() => setShowAddUserModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">&times;</button>
          </div>

          <form onSubmit={handleAddUser} className="space-y-3.5 pt-3.5 text-xs">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Full Name & Title</label>
              <input
                type="text"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="e.g., Dr. Allison Cameron"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded outline-none focus:border-teal-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Corporate Email Address</label>
              <input
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="e.g., cameron@hospital.com"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded outline-none font-mono focus:border-teal-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Contact Phone</label>
                <input
                  type="tel"
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(e.target.value)}
                  placeholder="+1 (555) 019-2233"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded outline-none focus:border-teal-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Portal Access Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as 'ADMIN' | 'DOCTOR')}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded outline-none focus:border-teal-500"
                >
                  <option value="DOCTOR">DOCTOR (Physician)</option>
                  <option value="ADMIN">ADMIN (Staff Manager)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Medical Department</label>
              <select
                value={newUserDept}
                onChange={(e) => setNewUserDept(e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded outline-none focus:border-teal-500"
              >
                <option value="Cardiology">Cardiology</option>
                <option value="General Surgery">General Surgery</option>
                <option value="Neurosurgery">Neurosurgery</option>
                <option value="Central Pharmacy">Central Pharmacy</option>
                <option value="Emergency Medicine">Emergency Medicine</option>
              </select>
            </div>

            <div className="bg-slate-50 p-2.5 border border-slate-200 rounded">
              <span className="block text-[8px] font-bold uppercase tracking-wider text-amber-600 mb-1">Temporary Security PIN</span>
              <p className="text-[10px] text-slate-400 leading-normal">
                By default, doctors log in with password <span className="font-mono font-bold text-slate-700">"doctor"</span> and staff log in with <span className="font-mono font-bold text-slate-700">"admin"</span>. They will be prompted to replace this pin on first access.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-teal-500 text-white font-bold rounded shadow hover:bg-teal-600 transition-colors cursor-pointer"
              >
                Confirm Onboarding
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  function renderAddMedModal() {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowAddMedModal(false)} />
        <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden border border-slate-200 z-10 p-5 font-sans">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h4 className="font-bold text-slate-800 text-sm">Onboard Pharmaceutical Medicine</h4>
            <button onClick={() => setShowAddMedModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">&times;</button>
          </div>

          <form onSubmit={handleAddMedicine} className="space-y-3.5 pt-3.5 text-xs">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Medicine Name</label>
              <input
                type="text"
                value={newMedName}
                onChange={(e) => setNewMedName(e.target.value)}
                placeholder="e.g., Paracetamol 500mg"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded outline-none text-slate-700 font-semibold focus:border-teal-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Therapeutic Category</label>
                <select
                  value={newMedCat}
                  onChange={(e) => setNewMedCat(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded outline-none focus:border-teal-500"
                >
                  <option value="Antibiotics">Antibiotics</option>
                  <option value="Cardiovascular">Cardiovascular</option>
                  <option value="Analgesics">Analgesics</option>
                  <option value="Antidiabetics">Antidiabetics</option>
                  <option value="Anesthetics">Anesthetics</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Expiry Date</label>
                <input
                  type="date"
                  value={newMedExp}
                  onChange={(e) => setNewMedExp(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded outline-none font-mono focus:border-teal-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Initial Stock quantity</label>
                <input
                  type="number"
                  value={newMedQty}
                  onChange={(e) => setNewMedQty(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded outline-none focus:border-teal-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Unit Cost Price (NGN)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newMedPrice}
                  onChange={(e) => setNewMedPrice(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded outline-none focus:border-teal-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Registered Pharmaceutical Supplier</label>
              <input
                type="text"
                value={newMedSupplier}
                onChange={(e) => setNewMedSupplier(e.target.value)}
                placeholder="e.g., Pfizer Wholesale"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded outline-none focus:border-teal-500"
                required
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddMedModal(false)}
                className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-teal-500 text-white font-bold rounded shadow hover:bg-teal-600 transition-colors cursor-pointer"
              >
                Complete Onboarding
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  function renderUpdateStockModal() {
    if (!selectedMed) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowUpdateStockModal(false)} />
        <div className="relative w-full max-w-sm bg-white rounded-lg shadow-xl overflow-hidden border border-slate-200 z-10 p-5 font-sans">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h4 className="font-bold text-slate-800 text-sm">Adjust Inventory Stock</h4>
            <button onClick={() => setShowUpdateStockModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">&times;</button>
          </div>

          <form onSubmit={handleUpdateStockQty} className="space-y-4 pt-4 text-xs">
            <div className="bg-slate-50 p-2.5 border border-slate-200 rounded space-y-1">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase">Selected Medicine</span>
              <p className="font-bold text-sm text-slate-800">{selectedMed.name}</p>
              <p className="text-[10px] text-slate-400">Current stock: {selectedMed.quantity} units ({selectedMed.stockStatus})</p>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">New Available quantity</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="500"
                  value={updateStockQty}
                  onChange={(e) => setUpdateStockQty(Number(e.target.value))}
                  className="flex-1 accent-teal-600 cursor-pointer"
                />
                <input
                  type="number"
                  value={updateStockQty}
                  onChange={(e) => setUpdateStockQty(Number(e.target.value))}
                  className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-center font-bold text-slate-800 outline-none focus:border-teal-500"
                  required
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowUpdateStockModal(false)}
                className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-teal-500 text-white font-bold rounded shadow hover:bg-teal-600 transition-colors cursor-pointer"
              >
                Apply Adjusted Stock
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
};
