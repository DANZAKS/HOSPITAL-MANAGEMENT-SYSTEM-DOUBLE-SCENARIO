/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Calendar, Users, FileText, CheckCircle, XCircle, Search, Plus, 
  Activity, ArrowRight, BookOpen, Clock, Heart, Clipboard, Trash
} from 'lucide-react';
import { db } from '../db';
import { User, Appointment, Prescription, MedicalHistory } from '../types';
import { ConfirmationModal } from './ConfirmationModal';

interface DoctorPagesProps {
  activeTab: string;
  currentUser: User;
  onOpenPrescription: (prescription: Prescription) => void;
  toast: (msg: string) => void;
}

export const DoctorPages: React.FC<DoctorPagesProps> = ({
  activeTab,
  currentUser,
  onOpenPrescription,
  toast
}) => {
  // DB States
  const [appointments, setAppointments] = useState<Appointment[]>(() => db.getAppointments().filter(a => a.doctorId === currentUser.id));
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(() => db.getPrescriptions().filter(p => p.doctorId === currentUser.id));
  const patients = db.getUsers().filter(u => u.role === 'PATIENT');

  // Selected patient details drilldown state
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || '');
  const [patientHistory, setPatientHistory] = useState<MedicalHistory[]>(() => 
    db.getMedicalHistory().filter(h => h.patientId === selectedPatientId)
  );

  // Generate Prescription Form State
  const medicines = db.getMedicines();
  const [rxPatientId, setRxPatientId] = useState(patients[0]?.id || '');
  const [rxMedicine, setRxMedicine] = useState(medicines[0]?.name || '');
  const [rxDosage, setRxDosage] = useState('1 Tablet');
  const [rxFrequency, setRxFrequency] = useState('Twice daily');
  const [rxDuration, setRxDuration] = useState('7 Days');
  const [rxInstructions, setRxInstructions] = useState('Take after meals with warm water.');

  // Confirmation modals
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
    setAppointments(db.getAppointments().filter(a => a.doctorId === currentUser.id));
    setPrescriptions(db.getPrescriptions().filter(p => p.doctorId === currentUser.id));
    setPatientHistory(db.getMedicalHistory().filter(h => h.patientId === selectedPatientId));
  };

  const handlePatientSelect = (patId: string) => {
    setSelectedPatientId(patId);
    setPatientHistory(db.getMedicalHistory().filter(h => h.patientId === patId));
  };

  const handleApproveAppointment = (apptId: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Approve Clinic Appointment',
      message: `Do you want to confirm and approve this appointment booking for ${name}?`,
      type: 'success',
      action: () => {
        db.setAppointmentStatus(apptId, 'Approved', currentUser.fullName);
        toast(`Approved appointment for ${name}.`);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        syncData();
      }
    });
  };

  const handleCancelAppointment = (apptId: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Decline Appointment Slot',
      message: `Are you sure you want to decline/cancel this appointment request for ${name}? This will free up the calendar.`,
      type: 'danger',
      action: () => {
        db.setAppointmentStatus(apptId, 'Cancelled', currentUser.fullName);
        toast(`Declined appointment slot for ${name}.`);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        syncData();
      }
    });
  };

  const handleGeneratePrescription = (e: React.FormEvent) => {
    e.preventDefault();
    const pat = patients.find(p => p.id === rxPatientId);
    if (!pat || !rxMedicine) {
      toast('Please verify patient selection and drug names.');
      return;
    }

    db.generatePrescription({
      patientId: pat.id,
      patientName: pat.fullName,
      doctorId: currentUser.id,
      doctorName: currentUser.fullName,
      medicineName: rxMedicine,
      dosage: rxDosage,
      frequency: rxFrequency,
      duration: rxDuration,
      instructions: rxInstructions
    });

    toast(`Prescription draft created successfully for ${pat.fullName}!`);
    syncData();
  };

  const handleSendPrescription = (presId: string, patName: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Send Prescription (Rx)',
      message: `Send this digital prescription sheet directly to patient ${patName}? This forwards a secure record to the portal and Central Pharmacy network.`,
      type: 'success',
      action: () => {
        db.sendPrescriptionToPatient(presId);
        toast(`Authorized & Dispatched Rx prescription sheet directly to ${patName}.`);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        syncData();
      }
    });
  };

  // Human-friendly age helper
  const calculateAge = (dobString?: string) => {
    if (!dobString) return 'N/A';
    try {
      const birthDate = new Date(dobString);
      const diff = Date.now() - birthDate.getTime();
      const ageDate = new Date(diff);
      return Math.abs(ageDate.getUTCFullYear() - 1970) + ' yrs';
    } catch {
      return 'N/A';
    }
  };

  // --- RENDERING VIEWS ---

  if (activeTab === 'doctor-dashboard') {
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = appointments.filter(a => a.date === today && a.status === 'Approved');
    const pendingAppointments = appointments.filter(a => a.status === 'Pending');
    const approvedAppointments = appointments.filter(a => a.status === 'Approved');
    
    // Derived patients
    const patientIds = Array.from(new Set(appointments.map(a => a.patientId)));
    const totalPatientsCount = patientIds.length;

    const stats = [
      { label: 'Visits Today', val: todayAppointments.length, icon: <Clock className="w-5 h-5 text-teal-600" />, bg: 'bg-teal-50 border-teal-100' },
      { label: 'Pending Slots', val: pendingAppointments.length, icon: <Calendar className="w-5 h-5 text-amber-600" />, bg: 'bg-amber-50 border-amber-100' },
      { label: 'Active Approved', val: approvedAppointments.length, icon: <CheckCircle className="w-5 h-5 text-cyan-600" />, bg: 'bg-cyan-50 border-cyan-100' },
      { label: 'Assigned Patients', val: totalPatientsCount, icon: <Users className="w-5 h-5 text-slate-600" />, bg: 'bg-slate-100 border-slate-200' }
    ];

    return (
      <div className="space-y-4">
        
        {/* Banner */}
        <div className="p-5 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">Clinician Console Workspace</h3>
            <p className="text-xs text-slate-400 mt-1">Hello {currentUser.fullName} ({currentUser.department}). Inspect patient logs, verify appointments, and manage clinical drug files.</p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 border border-teal-100 rounded text-teal-700 text-xs font-semibold">
            <Activity className="w-4 h-4 animate-pulse" />
            <span>Clinic Live</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, idx) => (
            <div key={idx} className={`p-4 rounded-lg border ${s.bg} flex items-center justify-between shadow-sm`}>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{s.label}</span>
                <span className="text-xl font-black text-slate-800 leading-none">{s.val}</span>
              </div>
              <div className="p-2.5 bg-white rounded shadow-sm">
                {s.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Pending booking list */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Pending Visit Approvals</h4>
            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded uppercase">Review Queue</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold bg-slate-50">
                  <th className="py-2 px-3">Appt Ref</th>
                  <th className="py-2 px-3">Patient Name</th>
                  <th className="py-2 px-3">Requested slot</th>
                  <th className="py-2 px-3">Indication / Symptoms</th>
                  <th className="py-2 px-3 text-right">Confirmation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingAppointments.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-3 font-mono font-semibold text-slate-400">{a.id}</td>
                    <td className="py-3 px-3 font-bold text-slate-800">{a.patientName}</td>
                    <td className="py-3 px-3 text-slate-600 font-semibold">{a.date} ({a.time})</td>
                    <td className="py-3 px-3 text-slate-500 italic max-w-sm truncate" title={a.reason}>"{a.reason}"</td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApproveAppointment(a.id, a.patientName)}
                          className="px-2.5 py-1 bg-teal-500 hover:bg-teal-600 text-white text-[10px] font-bold rounded shadow-sm transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleCancelAppointment(a.id, a.patientName)}
                          className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold rounded transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Decline</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {pendingAppointments.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 italic">All appointment requests verified and approved.</td>
                  </tr>
                )}
              </tbody>
            </table>
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

  if (activeTab === 'doctor-appointments') {
    return (
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">My Consultation Schedule</h3>
          <p className="text-xs text-slate-400">Total history of patient bookings allocated to your clinic credentials.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold bg-slate-50">
                <th className="py-2.5 px-3">Unique Ref</th>
                <th className="py-2.5 px-3">Patient Full Name</th>
                <th className="py-2.5 px-3">Scheduled Date / Time</th>
                <th className="py-2.5 px-3">Purpose / Complaint</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Calendar Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {appointments.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-slate-400">{a.id}</td>
                  <td className="py-3 px-3 font-bold text-slate-800">{a.patientName}</td>
                  <td className="py-3 px-3 text-slate-500 font-medium">{a.date} at {a.time}</td>
                  <td className="py-3 px-3 text-slate-400 italic max-w-xs truncate" title={a.reason}>"{a.reason}"</td>
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
                    {a.status === 'Pending' ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApproveAppointment(a.id, a.patientName)}
                          className="px-2 py-0.5 bg-teal-500 hover:bg-teal-600 text-white text-[10px] font-bold rounded cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleCancelAppointment(a.id, a.patientName)}
                          className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded cursor-pointer"
                        >
                          Decline
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400">Archived Record</span>
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

  if (activeTab === 'doctor-patients' || activeTab === 'doctor-history') {
    const selectedPatient = patients.find(p => p.id === selectedPatientId);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Side: Select patient list */}
        <div className="lg:col-span-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-3">
          <div className="space-y-1">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Active Patients Directory</h3>
            <p className="text-[11px] text-slate-400">Select any patient record to inspect details and history files.</p>
          </div>

          <div className="space-y-1.5 max-h-96 overflow-y-auto">
            {patients.map(p => (
              <button
                key={p.id}
                onClick={() => handlePatientSelect(p.id)}
                className={`w-full text-left p-2.5 rounded border transition-all flex items-center justify-between group cursor-pointer ${
                  selectedPatientId === p.id 
                    ? 'bg-teal-50 border-teal-200 shadow-sm' 
                    : 'bg-white border-slate-100 hover:bg-slate-50'
                }`}
              >
                <div>
                  <p className={`text-xs font-bold ${selectedPatientId === p.id ? 'text-teal-900' : 'text-slate-800'}`}>
                    {p.fullName}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">{p.id}</p>
                </div>
                <ArrowRight className={`w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 ${
                  selectedPatientId === p.id ? 'text-teal-600' : 'text-slate-400'
                }`} />
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Patient Detail lookup and Clinical Health History */}
        <div className="lg:col-span-8 space-y-4">
          {selectedPatient ? (
            <>
              {/* Profile Card */}
              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-slate-100 text-slate-600 font-bold text-base flex items-center justify-center border border-slate-200">
                      {selectedPatient.fullName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">{selectedPatient.fullName}</h4>
                      <p className="text-[11px] text-slate-400 font-mono">Patient File Code: {selectedPatient.id}</p>
                    </div>
                  </div>
                  <span className="self-start sm:self-auto inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-teal-100 text-teal-800">
                    Active File
                  </span>
                </div>

                {/* Grid metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600">
                  <div className="p-2.5 bg-slate-50 border border-slate-100 rounded">
                    <span className="text-[9px] text-slate-400 block uppercase font-medium">Age Profile</span>
                    <span className="font-bold text-slate-700">{calculateAge(selectedPatient.dob)}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-100 rounded">
                    <span className="text-[9px] text-slate-400 block uppercase font-medium">Biological Gender</span>
                    <span className="font-bold text-slate-700">{selectedPatient.gender || 'N/A'}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-100 rounded">
                    <span className="text-[9px] text-slate-400 block uppercase font-medium">Phone Number</span>
                    <span className="font-bold text-slate-700">{selectedPatient.phone}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-100 rounded">
                    <span className="text-[9px] text-slate-400 block uppercase font-medium">Email Address</span>
                    <span className="font-bold text-slate-700 font-mono truncate block">{selectedPatient.email}</span>
                  </div>
                </div>

                <div className="text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Residential Address</span>
                  <p className="text-slate-600 font-semibold mt-0.5">{selectedPatient.address || 'No address on file.'}</p>
                </div>
              </div>

              {/* Treatment log History */}
              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Clinical Treatment Log Book</h4>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Restricted Medical access</span>
                </div>

                <div className="relative border-l border-slate-200 pl-5 ml-1 space-y-4">
                  {patientHistory.map((h) => (
                    <div key={h.id} className="relative">
                      <div className="absolute -left-[24.5px] top-1 w-2 h-2 rounded-full bg-teal-600 ring-4 ring-teal-50 border border-white" />
                      <div className="space-y-1 text-xs">
                        <span className="text-[9px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded font-bold uppercase">
                          {h.type}
                        </span>
                        <p className="text-[10px] text-slate-400 block font-medium">Date: {h.date} | Clinician: {h.doctorName}</p>
                        <p className="font-bold text-slate-800">{h.title}</p>
                        <p className="text-slate-500 leading-relaxed italic bg-slate-50 p-3 rounded border border-slate-100">
                          "{h.description}"
                        </p>
                      </div>
                    </div>
                  ))}
                  {patientHistory.length === 0 && (
                    <p className="text-xs text-slate-400 italic">No health history log sheets active for this patient.</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400 italic bg-white rounded-lg border border-slate-200">
              No patient selected. Choose a patient from the list.
            </div>
          )}
        </div>

      </div>
    );
  }

  if (activeTab === 'doctor-gen-rx') {
    return (
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm max-w-2xl font-sans">
        <div className="pb-4 border-b border-slate-200 mb-6">
          <h3 className="text-base font-bold text-slate-800">Generate Digital Prescription (Rx)</h3>
          <p className="text-xs text-slate-400 mt-1">Draft a clinical prescription order sheet. You can send it immediately from the sent tab.</p>
        </div>

        <form onSubmit={handleGeneratePrescription} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Patient file</label>
              <select
                value={rxPatientId}
                onChange={(e) => setRxPatientId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded outline-none text-slate-700 font-semibold focus:border-teal-500"
              >
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.fullName} ({calculateAge(p.dob)})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Medicine / Drug Name</label>
              <select
                value={rxMedicine}
                onChange={(e) => setRxMedicine(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded outline-none text-slate-700 font-semibold focus:border-teal-500"
              >
                {medicines.map(m => (
                  <option key={m.id} value={m.name}>{m.name} ({m.category})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Intake Dosage (e.g. tablet quantity)</label>
              <input
                type="text"
                value={rxDosage}
                onChange={(e) => setRxDosage(e.target.value)}
                placeholder="e.g., 1 Tablet"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded outline-none text-slate-700 focus:border-teal-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Intake Frequency</label>
              <input
                type="text"
                value={rxFrequency}
                onChange={(e) => setRxFrequency(e.target.value)}
                placeholder="e.g., Once daily at bedtime"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded outline-none text-slate-700 focus:border-teal-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Course Duration</label>
              <input
                type="text"
                value={rxDuration}
                onChange={(e) => setRxDuration(e.target.value)}
                placeholder="e.g., 30 Days"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded outline-none text-slate-700 focus:border-teal-500"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clinical Intake Instructions</label>
            <textarea
              value={rxInstructions}
              onChange={(e) => setRxInstructions(e.target.value)}
              placeholder="e.g., Take with food. Avoid grapefruit juice during course..."
              rows={3}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded outline-none text-slate-700 focus:border-teal-500"
              required
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded shadow transition-colors cursor-pointer text-xs uppercase tracking-wider"
            >
              Generate Rx Draft
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (activeTab === 'doctor-sent-rx') {
    return (
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">Prescription Dispatch Board</h3>
          <p className="text-xs text-slate-400">Dispatch clinical Rx prescription sheets to active patients and Pharmacists.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold bg-slate-50">
                <th className="py-2.5 px-3">Unique Ref</th>
                <th className="py-2.5 px-3">Patient Name</th>
                <th className="py-2.5 px-3">Medicine Ordered</th>
                <th className="py-2.5 px-3">Dosage & Frequency</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Action Dispatches</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {prescriptions.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-teal-700">{p.id}</td>
                  <td className="py-3 px-3 font-bold text-slate-800">{p.patientName}</td>
                  <td className="py-3 px-3 font-semibold text-slate-700">{p.medicineName}</td>
                  <td className="py-3 px-3 text-slate-400">{p.dosage}, {p.frequency} ({p.duration})</td>
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                      p.status === 'Completed' || p.status === 'Dispensed' ? 'bg-teal-100 text-teal-800' :
                      p.status === 'Sent' ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-800 animate-pulse'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onOpenPrescription(p)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold rounded cursor-pointer"
                      >
                        Inspect Rx Sheet
                      </button>
                      {p.status === 'Pending' && (
                        <button
                          onClick={() => handleSendPrescription(p.id, p.patientName)}
                          className="px-2.5 py-1 bg-teal-500 hover:bg-teal-600 text-white text-[10px] font-bold rounded shadow-sm transition-colors cursor-pointer"
                        >
                          Send to Patient Portal
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

  return null;
};
