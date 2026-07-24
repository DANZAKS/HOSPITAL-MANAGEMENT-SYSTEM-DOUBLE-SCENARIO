/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'ADMIN' | 'PATIENT' | 'DOCTOR' | 'PHARMACIST';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: Role;
  password?: string;
  createdAt: string;
  updatedAt: string;
  
  // Specific role fields
  department?: string; // For Doctors & Staff
  status?: 'Active' | 'Inactive'; // For Doctors, Staff, Patients
  dateAdded?: string; // For Doctors, Staff
  
  // Patient specific fields
  dob?: string;
  gender?: string;
  address?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  department: string;
  date: string;
  time: string;
  reason: string;
  notes?: string;
  status: 'Pending' | 'Approved' | 'Cancelled' | 'Completed';
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  patientId: string;
  patientName: string;
  reference: string;
  amount: number;
  purpose: string;
  date: string;
  status: 'Pending' | 'Successful' | 'Failed' | 'Verified';
  createdAt: string;
  updatedAt: string;
}

export interface Receipt {
  id: string;
  paymentId: string;
  hospitalName: string;
  receiptNumber: string;
  patientName: string;
  reference: string;
  amountPaid: number;
  purpose: string;
  date: string;
  status: 'Active' | 'Cancelled';
  authorizedBy: string;
  createdAt: string;
}

export interface Medicine {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
  expiryDate: string;
  supplier: string;
  stockStatus: 'In Stock' | 'Low Stock' | 'Out of Stock';
  createdAt: string;
  updatedAt: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  dateCreated: string;
  status: 'Pending' | 'Sent' | 'Dispensed' | 'Completed';
}

export interface MedicalHistory {
  id: string;
  patientId: string;
  date: string;
  type: 'Appointment' | 'Consultation' | 'Diagnosis' | 'Prescription' | 'Payment';
  title: string;
  description: string;
  doctorName: string;
  referenceId?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  createdAt: string;
}
