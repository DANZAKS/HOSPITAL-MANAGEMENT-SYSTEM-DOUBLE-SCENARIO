/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Appointment, Payment, Receipt, Medicine, Prescription, MedicalHistory, Notification } from './types';

// Helper to generate unique IDs
export function generateId(): string {
  return Math.random().toString(36).substring(2, 11).toUpperCase();
}

// Default seeded data - Fresh system with Danzaks Admin & Faruk Pharmacist
const DEFAULT_USERS: User[] = [
  {
    id: 'ADMIN-DANZAKS',
    email: 'danzaks001@gmail.com',
    fullName: 'Danzaks (System Admin)',
    phone: '+234 800 000 0000',
    role: 'ADMIN',
    password: 'password',
    createdAt: new Date('2026-01-01').toISOString(),
    updatedAt: new Date('2026-01-01').toISOString(),
    department: 'Hospital Administration',
    status: 'Active',
    dateAdded: '2026-01-01'
  },
  {
    id: 'PHARM-FARUK',
    email: 'faruk@gmail.com',
    fullName: 'Faruk (Lead Pharmacist)',
    phone: '+234 800 111 2222',
    role: 'PHARMACIST',
    password: '12345678',
    createdAt: new Date('2026-01-01').toISOString(),
    updatedAt: new Date('2026-01-01').toISOString(),
    department: 'Central Pharmacy',
    status: 'Active',
    dateAdded: '2026-01-01'
  }
];

const DEFAULT_MEDICINES: Medicine[] = [];
const DEFAULT_APPOINTMENTS: Appointment[] = [];
const DEFAULT_PAYMENTS: Payment[] = [];
const DEFAULT_RECEIPTS: Receipt[] = [];
const DEFAULT_PRESCRIPTIONS: Prescription[] = [];
const DEFAULT_MEDICAL_HISTORY: MedicalHistory[] = [];
const DEFAULT_NOTIFICATIONS: Notification[] = [];

// Database class that hooks into localStorage
class HospitalDatabase {
  constructor() {
    this.init();
  }

  private init() {
    const demoEmails = [
      'admin@hospital.com',
      'doctor.house@hospital.com',
      'doctor.grey@hospital.com',
      'doctor.strange@hospital.com',
      'pharmacist@hospital.com',
      'staff.jane@hospital.com',
      'patient@hospital.com',
      'alice.smith@hospital.com'
    ];

    // Wipe demo data on version upgrade to clean state
    const isCleanVersion = localStorage.getItem('hms_clean_v2');
    if (!isCleanVersion) {
      localStorage.removeItem('hms_medicines');
      localStorage.removeItem('hms_appointments');
      localStorage.removeItem('hms_payments');
      localStorage.removeItem('hms_receipts');
      localStorage.removeItem('hms_prescriptions');
      localStorage.removeItem('hms_medical_history');
      localStorage.removeItem('hms_notifications');
      localStorage.setItem('hms_clean_v2', 'true');
    }

    let users: User[] = [];
    try {
      const stored = localStorage.getItem('hms_users');
      if (stored) {
        users = JSON.parse(stored);
      }
    } catch (e) {
      console.error(e);
    }

    // Filter out previous seed demo accounts
    users = users.filter(u => !demoEmails.includes(u.email.toLowerCase()));

    // Ensure danzaks001@gmail.com is present as ADMIN
    let danzaks = users.find(u => u.email.toLowerCase() === 'danzaks001@gmail.com');
    if (!danzaks) {
      danzaks = {
        id: 'ADMIN-DANZAKS',
        email: 'danzaks001@gmail.com',
        fullName: 'Danzaks (System Admin)',
        phone: '+234 800 000 0000',
        role: 'ADMIN',
        password: 'password',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        department: 'Hospital Administration',
        status: 'Active',
        dateAdded: new Date().toISOString().split('T')[0]
      };
      users.unshift(danzaks);
    } else {
      danzaks.role = 'ADMIN';
      danzaks.department = 'Hospital Administration';
    }

    // Ensure faruk@gmail.com is present as PHARMACIST
    let faruk = users.find(u => u.email.toLowerCase() === 'faruk@gmail.com');
    if (!faruk) {
      faruk = {
        id: 'PHARM-FARUK',
        email: 'faruk@gmail.com',
        fullName: 'Faruk (Lead Pharmacist)',
        phone: '+234 800 111 2222',
        role: 'PHARMACIST',
        password: '12345678',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        department: 'Central Pharmacy',
        status: 'Active',
        dateAdded: new Date().toISOString().split('T')[0]
      };
      users.push(faruk);
    } else {
      faruk.role = 'PHARMACIST';
      faruk.password = '12345678';
      faruk.department = 'Central Pharmacy';
      faruk.status = 'Active';
    }

    localStorage.setItem('hms_users', JSON.stringify(users));

    // Sync current user session if logged in
    try {
      const cur = localStorage.getItem('hms_current_user');
      if (cur) {
        const userObj = JSON.parse(cur);
        if (demoEmails.includes(userObj.email?.toLowerCase())) {
          localStorage.removeItem('hms_current_user');
        } else if (userObj.email && userObj.email.toLowerCase() === 'danzaks001@gmail.com') {
          userObj.role = 'ADMIN';
          userObj.department = 'Hospital Administration';
          localStorage.setItem('hms_current_user', JSON.stringify(userObj));
        } else if (userObj.email && userObj.email.toLowerCase() === 'faruk@gmail.com') {
          userObj.role = 'PHARMACIST';
          userObj.password = '12345678';
          userObj.department = 'Central Pharmacy';
          localStorage.setItem('hms_current_user', JSON.stringify(userObj));
        }
      }
    } catch (e) {
      console.error(e);
    }

    if (!localStorage.getItem('hms_medicines')) {
      localStorage.setItem('hms_medicines', JSON.stringify(DEFAULT_MEDICINES));
    }
    if (!localStorage.getItem('hms_appointments')) {
      localStorage.setItem('hms_appointments', JSON.stringify(DEFAULT_APPOINTMENTS));
    }
    if (!localStorage.getItem('hms_payments')) {
      localStorage.setItem('hms_payments', JSON.stringify(DEFAULT_PAYMENTS));
    }
    if (!localStorage.getItem('hms_receipts')) {
      localStorage.setItem('hms_receipts', JSON.stringify(DEFAULT_RECEIPTS));
    }
    if (!localStorage.getItem('hms_prescriptions')) {
      localStorage.setItem('hms_prescriptions', JSON.stringify(DEFAULT_PRESCRIPTIONS));
    }
    if (!localStorage.getItem('hms_medical_history')) {
      localStorage.setItem('hms_medical_history', JSON.stringify(DEFAULT_MEDICAL_HISTORY));
    }
    if (!localStorage.getItem('hms_notifications')) {
      localStorage.setItem('hms_notifications', JSON.stringify(DEFAULT_NOTIFICATIONS));
    }
  }

  // --- GENERIC GETTERS & SETTERS ---
  getUsers(): User[] {
    return JSON.parse(localStorage.getItem('hms_users') || '[]');
  }

  saveUsers(users: User[]) {
    localStorage.setItem('hms_users', JSON.stringify(users));
  }

  getMedicines(): Medicine[] {
    return JSON.parse(localStorage.getItem('hms_medicines') || '[]');
  }

  saveMedicines(medicines: Medicine[]) {
    localStorage.setItem('hms_medicines', JSON.stringify(medicines));
  }

  getAppointments(): Appointment[] {
    return JSON.parse(localStorage.getItem('hms_appointments') || '[]');
  }

  saveAppointments(appointments: Appointment[]) {
    localStorage.setItem('hms_appointments', JSON.stringify(appointments));
  }

  getPayments(): Payment[] {
    return JSON.parse(localStorage.getItem('hms_payments') || '[]');
  }

  savePayments(payments: Payment[]) {
    localStorage.setItem('hms_payments', JSON.stringify(payments));
  }

  getReceipts(): Receipt[] {
    return JSON.parse(localStorage.getItem('hms_receipts') || '[]');
  }

  saveReceipts(receipts: Receipt[]) {
    localStorage.setItem('hms_receipts', JSON.stringify(receipts));
  }

  getPrescriptions(): Prescription[] {
    return JSON.parse(localStorage.getItem('hms_prescriptions') || '[]');
  }

  savePrescriptions(prescriptions: Prescription[]) {
    localStorage.setItem('hms_prescriptions', JSON.stringify(prescriptions));
  }

  getMedicalHistory(): MedicalHistory[] {
    return JSON.parse(localStorage.getItem('hms_medical_history') || '[]');
  }

  saveMedicalHistory(history: MedicalHistory[]) {
    localStorage.setItem('hms_medical_history', JSON.stringify(history));
  }

  getNotifications(): Notification[] {
    return JSON.parse(localStorage.getItem('hms_notifications') || '[]');
  }

  saveNotifications(notifications: Notification[]) {
    localStorage.setItem('hms_notifications', JSON.stringify(notifications));
  }

  // --- AUTH OPERATIONS ---
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('hms_current_user');
    if (!userStr) return null;
    const basic = JSON.parse(userStr);
    // Fetch latest fields from users array
    const users = this.getUsers();
    const latest = users.find(u => u.id === basic.id || (basic.email && u.email.toLowerCase() === basic.email.toLowerCase()));
    const finalUser = latest || basic;
    if (finalUser.email && finalUser.email.toLowerCase() === 'danzaks001@gmail.com') {
      finalUser.role = 'ADMIN';
      finalUser.department = 'Hospital Administration';
    } else if (finalUser.email && finalUser.email.toLowerCase() === 'faruk@gmail.com') {
      finalUser.role = 'PHARMACIST';
      finalUser.department = 'Central Pharmacy';
    }
    return finalUser;
  }

  setCurrentUser(user: User | null) {
    if (user) {
      localStorage.setItem('hms_current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('hms_current_user');
    }
  }

  // --- NOTIFICATION UTILITY ---
  addNotification(userId: string, title: string, message: string) {
    const notifications = this.getNotifications();
    const newNot: Notification = {
      id: 'NOT-' + generateId(),
      userId,
      title,
      message,
      date: new Date().toISOString().split('T')[0],
      read: false,
      createdAt: new Date().toISOString()
    };
    notifications.unshift(newNot);
    this.saveNotifications(notifications);
  }

  // --- STAFF / DOCTOR CRUD ---
  addUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User {
    const users = this.getUsers();
    const isDanzaksAdmin = user.email.toLowerCase() === 'danzaks001@gmail.com';
    const isFarukPharmacist = user.email.toLowerCase() === 'faruk@gmail.com';
    const effectiveRole = isDanzaksAdmin ? 'ADMIN' : isFarukPharmacist ? 'PHARMACIST' : user.role;
    const effectiveDept = isDanzaksAdmin ? 'Hospital Administration' : isFarukPharmacist ? 'Central Pharmacy' : user.department;
    
    const newUser: User = {
      ...user,
      role: effectiveRole,
      department: effectiveDept,
      id: (effectiveRole === 'DOCTOR' ? 'DOC-' : effectiveRole === 'ADMIN' ? 'ADMIN-' : effectiveRole === 'PHARMACIST' ? 'PHARM-' : 'USER-') + generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dateAdded: new Date().toISOString().split('T')[0],
      status: 'Active'
    };
    users.push(newUser);
    this.saveUsers(users);

    // Notify Admins
    const admins = users.filter(u => u.role === 'ADMIN');
    admins.forEach(admin => {
      this.addNotification(admin.id, `New Staff Added`, `${newUser.fullName} has been added as a ${newUser.role} in ${newUser.department || 'General'}.`);
    });

    return newUser;
  }

  deleteUser(userId: string): boolean {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) return false;
    
    const user = users[index];
    users.splice(index, 1);
    this.saveUsers(users);

    // If current user, logout
    const current = this.getCurrentUser();
    if (current && current.id === userId) {
      this.setCurrentUser(null);
    }
    return true;
  }

  // --- PATIENT PROFILE UPDATE ---
  updatePatientProfile(patientId: string, updates: Partial<User>): User {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === patientId);
    if (index === -1) throw new Error('Patient not found');
    
    const updated = {
      ...users[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    users[index] = updated;
    this.saveUsers(users);
    
    const current = this.getCurrentUser();
    if (current && current.id === patientId) {
      this.setCurrentUser(updated);
    }
    return updated;
  }

  // --- APPOINTMENT OPERATIONS ---
  bookAppointment(appt: {
    patientId: string;
    patientName: string;
    doctorId: string;
    doctorName: string;
    department: string;
    date: string;
    time: string;
    reason: string;
    notes?: string;
  }): Appointment {
    const appointments = this.getAppointments();
    const newAppt: Appointment = {
      ...appt,
      id: 'APP-' + generateId(),
      status: 'Pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    appointments.unshift(newAppt);
    this.saveAppointments(appointments);

    // Notify Doctor
    this.addNotification(appt.doctorId, 'New Appointment Request', `Patient ${appt.patientName} has booked a new appointment for ${appt.date} at ${appt.time}.`);
    
    // Notify Patient
    this.addNotification(appt.patientId, 'Appointment Booked', `Your appointment request with ${appt.doctorName} is submitted and pending approval.`);

    // Add Medical History Record
    this.addHistoryRecord(appt.patientId, {
      type: 'Appointment',
      title: 'Appointment Booked (Pending)',
      description: `Appointment booked with ${appt.doctorName} in ${appt.department} for ${appt.date} at ${appt.time}. Reason: ${appt.reason}`,
      doctorName: appt.doctorName,
      referenceId: newAppt.id
    });

    return newAppt;
  }

  setAppointmentStatus(appointmentId: string, status: 'Approved' | 'Cancelled' | 'Completed', actorName: string): Appointment | null {
    const appointments = this.getAppointments();
    const apptIndex = appointments.findIndex(a => a.id === appointmentId);
    if (apptIndex === -1) return null;

    const appt = appointments[apptIndex];
    appt.status = status;
    appt.updatedAt = new Date().toISOString();
    this.saveAppointments(appointments);

    // Notify Patient
    this.addNotification(appt.patientId, `Appointment ${status}`, `Your appointment with ${appt.doctorName} on ${appt.date} has been ${status.toLowerCase()} by ${actorName}.`);

    // Add History
    this.addHistoryRecord(appt.patientId, {
      type: 'Appointment',
      title: `Appointment ${status}`,
      description: `Appointment with ${appt.doctorName} on ${appt.date} at ${appt.time} was marked as ${status.toLowerCase()} by ${actorName}.`,
      doctorName: appt.doctorName,
      referenceId: appt.id
    });

    return appt;
  }

  // --- PAYMENT & RECEIPT OPERATIONS ---
  makePayment(pay: {
    patientId: string;
    patientName: string;
    amount: number;
    purpose: string;
  }): Payment {
    const payments = this.getPayments();
    const reference = 'TXN-' + generateId() + '-P';
    const newPay: Payment = {
      id: 'PAY-' + generateId(),
      patientId: pay.patientId,
      patientName: pay.patientName,
      reference,
      amount: pay.amount,
      purpose: pay.purpose,
      date: new Date().toISOString().split('T')[0],
      status: 'Pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    payments.unshift(newPay);
    this.savePayments(payments);

    // Notify Admins
    const admins = this.getUsers().filter(u => u.role === 'ADMIN');
    admins.forEach(admin => {
      this.addNotification(admin.id, `New Payment Submitted`, `Patient ${pay.patientName} has submitted a payment of ₦${pay.amount.toFixed(2)} for: ${pay.purpose}.`);
    });

    // Notify Patient
    this.addNotification(pay.patientId, 'Payment Submitted', `Your payment of ₦${pay.amount.toFixed(2)} is pending Admin verification.`);

    return newPay;
  }

  verifyPayment(paymentId: string, verifierName: string): Payment | null {
    const payments = this.getPayments();
    const payIndex = payments.findIndex(p => p.id === paymentId);
    if (payIndex === -1) return null;

    const pay = payments[payIndex];
    pay.status = 'Verified';
    pay.updatedAt = new Date().toISOString();
    this.savePayments(payments);

    // Generate receipt automatically
    const receipts = this.getReceipts();
    const receiptNum = 'DS-REC-2026-' + generateId();
    const newReceipt: Receipt = {
      id: 'REC-' + generateId(),
      paymentId: pay.id,
      hospitalName: 'Double Scenario Health Care',
      receiptNumber: receiptNum,
      patientName: pay.patientName,
      reference: pay.reference,
      amountPaid: pay.amount,
      purpose: pay.purpose,
      date: new Date().toISOString().split('T')[0],
      status: 'Active',
      authorizedBy: verifierName,
      createdAt: new Date().toISOString()
    };
    receipts.unshift(newReceipt);
    this.saveReceipts(receipts);

    // Notify Patient
    this.addNotification(pay.patientId, 'Payment Verified & Receipt Generated', `Your payment reference ${pay.reference} has been verified. Receipt ${receiptNum} is ready to view.`);

    // Add to Medical History
    this.addHistoryRecord(pay.patientId, {
      type: 'Payment',
      title: 'Payment Verified & Receipt Issued',
      description: `Verified ₦${pay.amount.toFixed(2)} for ${pay.purpose}. Receipt Number: ${receiptNum}`,
      doctorName: verifierName,
      referenceId: pay.id
    });

    return pay;
  }

  rejectPayment(paymentId: string): Payment | null {
    const payments = this.getPayments();
    const payIndex = payments.findIndex(p => p.id === paymentId);
    if (payIndex === -1) return null;

    const pay = payments[payIndex];
    pay.status = 'Failed';
    pay.updatedAt = new Date().toISOString();
    this.savePayments(payments);

    // Notify Patient
    this.addNotification(pay.patientId, 'Payment Rejected', `Your payment reference ${pay.reference} was rejected as invalid. Please contact Administration.`);
    
    return pay;
  }

  cancelReceipt(receiptId: string, cancellerName: string): Receipt | null {
    const receipts = this.getReceipts();
    const index = receipts.findIndex(r => r.id === receiptId);
    if (index === -1) return null;

    const receipt = receipts[index];
    receipt.status = 'Cancelled';
    this.saveReceipts(receipts);

    // Notify Patient
    const payments = this.getPayments();
    const pay = payments.find(p => p.id === receipt.paymentId);
    if (pay) {
      this.addNotification(pay.patientId, 'Receipt Cancelled', `Your receipt ${receipt.receiptNumber} has been cancelled by ${cancellerName}.`);
    }

    return receipt;
  }

  // --- MEDICINE / PHARMACY OPERATIONS ---
  addMedicine(med: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt' | 'stockStatus'>): Medicine {
    const medicines = this.getMedicines();
    
    let stockStatus: 'In Stock' | 'Low Stock' | 'Out of Stock' = 'In Stock';
    if (med.quantity === 0) stockStatus = 'Out of Stock';
    else if (med.quantity <= 20) stockStatus = 'Low Stock';

    const newMed: Medicine = {
      ...med,
      id: 'MED-' + generateId(),
      stockStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    medicines.push(newMed);
    this.saveMedicines(medicines);

    return newMed;
  }

  updateMedicineStock(medicineId: string, quantity: number): Medicine | null {
    const medicines = this.getMedicines();
    const index = medicines.findIndex(m => m.id === medicineId);
    if (index === -1) return null;

    let stockStatus: 'In Stock' | 'Low Stock' | 'Out of Stock' = 'In Stock';
    if (quantity === 0) stockStatus = 'Out of Stock';
    else if (quantity <= 20) stockStatus = 'Low Stock';

    medicines[index].quantity = quantity;
    medicines[index].stockStatus = stockStatus;
    medicines[index].updatedAt = new Date().toISOString();
    this.saveMedicines(medicines);

    // If stock reaches low/out-of-stock, trigger alert notification for Admin and Pharmacist
    if (stockStatus === 'Low Stock' || stockStatus === 'Out of Stock') {
      const alertedUsers = this.getUsers().filter(u => u.role === 'ADMIN' || u.role === 'PHARMACIST');
      alertedUsers.forEach(u => {
        this.addNotification(u.id, 'Critical stock Alert', `Medicine "${medicines[index].name}" is currently ${stockStatus.toUpperCase()} (Qty: ${quantity}). Please re-order immediately.`);
      });
    }

    return medicines[index];
  }

  deleteMedicine(medicineId: string): boolean {
    const medicines = this.getMedicines();
    const index = medicines.findIndex(m => m.id === medicineId);
    if (index === -1) return false;

    medicines.splice(index, 1);
    this.saveMedicines(medicines);
    return true;
  }

  // --- PRESCRIPTION OPERATIONS ---
  generatePrescription(pres: {
    patientId: string;
    patientName: string;
    doctorId: string;
    doctorName: string;
    medicineName: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }): Prescription {
    const prescriptions = this.getPrescriptions();
    const newPres: Prescription = {
      ...pres,
      id: 'PRES-' + generateId(),
      dateCreated: new Date().toISOString().split('T')[0],
      status: 'Pending' // Initial state is Pending
    };
    prescriptions.unshift(newPres);
    this.savePrescriptions(prescriptions);

    // Also automatically log in history that doctor generated a prescription
    this.addHistoryRecord(pres.patientId, {
      type: 'Prescription',
      title: 'Prescription Drafted',
      description: `Drafted prescription for ${pres.medicineName} (${pres.dosage}, ${pres.frequency} for ${pres.duration}). Instructions: ${pres.instructions}`,
      doctorName: pres.doctorName,
      referenceId: newPres.id
    });

    return newPres;
  }

  sendPrescriptionToPatient(prescriptionId: string): Prescription | null {
    const prescriptions = this.getPrescriptions();
    const index = prescriptions.findIndex(p => p.id === prescriptionId);
    if (index === -1) return null;

    const pres = prescriptions[index];
    pres.status = 'Sent';
    this.savePrescriptions(prescriptions);

    // Notify Patient
    this.addNotification(pres.patientId, 'New Prescription Received', `Dr. ${pres.doctorName} has issued a prescription for ${pres.medicineName}. Check details in your portal.`);

    // Notify Pharmacists
    const pharmacists = this.getUsers().filter(u => u.role === 'PHARMACIST');
    pharmacists.forEach(p => {
      this.addNotification(p.id, 'New Pending Prescription', `New prescription sent for patient ${pres.patientName} (${pres.medicineName}) ready for dispensing.`);
    });

    // Update patient history
    this.addHistoryRecord(pres.patientId, {
      type: 'Prescription',
      title: 'Prescription Sent & Activated',
      description: `Prescription for ${pres.medicineName} sent by Dr. ${pres.doctorName} to Patient portal & Hospital Pharmacy.`,
      doctorName: pres.doctorName,
      referenceId: pres.id
    });

    return pres;
  }

  dispensePrescription(prescriptionId: string, pharmacistName: string): Prescription | null {
    const prescriptions = this.getPrescriptions();
    const index = prescriptions.findIndex(p => p.id === prescriptionId);
    if (index === -1) return null;

    const pres = prescriptions[index];
    pres.status = 'Dispensed';
    this.savePrescriptions(prescriptions);

    // Try to auto-deduct from stock if medicine matches
    const medicines = this.getMedicines();
    const medIndex = medicines.findIndex(m => m.name.toLowerCase().includes(pres.medicineName.toLowerCase()) || pres.medicineName.toLowerCase().includes(m.name.toLowerCase()));
    if (medIndex !== -1) {
      const currentQty = medicines[medIndex].quantity;
      if (currentQty > 0) {
        this.updateMedicineStock(medicines[medIndex].id, Math.max(0, currentQty - 1));
      }
    }

    // Notify Patient
    this.addNotification(pres.patientId, 'Prescription Dispensed', `Your prescription for ${pres.medicineName} has been dispensed by pharmacist ${pharmacistName}.`);

    // Add History
    this.addHistoryRecord(pres.patientId, {
      type: 'Prescription',
      title: 'Prescription Dispensed',
      description: `Prescription for ${pres.medicineName} was packed and dispensed by Pharmacist ${pharmacistName}.`,
      doctorName: pres.doctorName,
      referenceId: pres.id
    });

    return pres;
  }

  completePrescription(prescriptionId: string): Prescription | null {
    const prescriptions = this.getPrescriptions();
    const index = prescriptions.findIndex(p => p.id === prescriptionId);
    if (index === -1) return null;

    const pres = prescriptions[index];
    pres.status = 'Completed';
    this.savePrescriptions(prescriptions);

    return pres;
  }

  // --- MEDICAL HISTORY WRITING ---
  addHistoryRecord(patientId: string, record: {
    type: 'Appointment' | 'Consultation' | 'Diagnosis' | 'Prescription' | 'Payment';
    title: string;
    description: string;
    doctorName: string;
    referenceId?: string;
  }): MedicalHistory {
    const history = this.getMedicalHistory();
    const newRecord: MedicalHistory = {
      id: 'HIST-' + generateId(),
      patientId,
      date: new Date().toISOString().split('T')[0],
      ...record,
      createdAt: new Date().toISOString()
    };
    history.unshift(newRecord);
    this.saveMedicalHistory(history);
    return newRecord;
  }
}

export const db = new HospitalDatabase();
