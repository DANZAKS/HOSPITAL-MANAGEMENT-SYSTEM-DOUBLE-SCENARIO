/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  LayoutDashboard, Users, User, Stethoscope, Calendar, CreditCard, 
  Receipt, Pill, FileText, Settings, Bell, ChevronLeft, LogOut, Activity 
} from 'lucide-react';
import { Role } from '../types';

interface SidebarProps {
  role: Role;
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  onLogout: () => void;
  isOpen: boolean;
  onToggle: () => void;
  userFullName: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  role,
  activeTab,
  onSelectTab,
  onLogout,
  isOpen,
  onToggle,
  userFullName
}) => {
  // Navigation mapping based on role
  const getNavItems = () => {
    switch (role) {
      case 'ADMIN':
        return [
          { id: 'admin-dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
          { id: 'admin-patients', label: 'Manage Patients', icon: <Users className="w-4 h-4" /> },
          { id: 'admin-doctors', label: 'Manage Doctors', icon: <Stethoscope className="w-4 h-4" /> },
          { id: 'admin-appointments', label: 'Appointments', icon: <Calendar className="w-4 h-4" /> },
          { id: 'admin-payments', label: 'Payments', icon: <CreditCard className="w-4 h-4" /> },
          { id: 'admin-receipts', label: 'Receipts', icon: <Receipt className="w-4 h-4" /> },
          { id: 'admin-pharmacy', label: 'Pharmacy Stock', icon: <Pill className="w-4 h-4" /> },
          { id: 'admin-prescriptions', label: 'Prescriptions', icon: <FileText className="w-4 h-4" /> },
          { id: 'admin-settings', label: 'System Settings', icon: <Settings className="w-4 h-4" /> }
        ];
      case 'PATIENT':
        return [
          { id: 'patient-dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
          { id: 'patient-profile', label: 'My Profile', icon: <User className="w-4 h-4" /> },
          { id: 'patient-book', label: 'Book Appointment', icon: <Calendar className="w-4 h-4" /> },
          { id: 'patient-appointments', label: 'My Appointments', icon: <Calendar className="w-4 h-4" /> },
          { id: 'patient-payments', label: 'Payments', icon: <CreditCard className="w-4 h-4" /> },
          { id: 'patient-receipts', label: 'Receipts', icon: <Receipt className="w-4 h-4" /> },
          { id: 'patient-history', label: 'Medical History', icon: <Users className="w-4 h-4" /> },
          { id: 'patient-prescriptions', label: 'My Prescriptions', icon: <FileText className="w-4 h-4" /> },
          { id: 'patient-notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> }
        ];
      case 'DOCTOR':
        return [
          { id: 'doctor-dashboard', label: 'Doctor Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
          { id: 'doctor-appointments', label: 'My Appointments', icon: <Calendar className="w-4 h-4" /> },
          { id: 'doctor-patients', label: 'Patient Profiles', icon: <Users className="w-4 h-4" /> },
          { id: 'doctor-history', label: 'Patient History', icon: <Users className="w-4 h-4" /> },
          { id: 'doctor-gen-rx', label: 'Generate Prescription', icon: <FileText className="w-4 h-4" /> },
          { id: 'doctor-sent-rx', label: 'Sent Prescriptions', icon: <FileText className="w-4 h-4" /> }
        ];
      case 'PHARMACIST':
        return [
          { id: 'pharmacist-dashboard', label: 'Pharmacist Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
          { id: 'pharmacist-inventory', label: 'Medicine Inventory', icon: <Pill className="w-4 h-4" /> },
          { id: 'pharmacist-low-stock', label: 'Low Stock Medicines', icon: <Pill className="w-4 h-4" /> },
          { id: 'pharmacist-prescriptions', label: 'Prescriptions', icon: <FileText className="w-4 h-4" /> }
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const rolePillStyles = {
    ADMIN: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    DOCTOR: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    PHARMACIST: 'bg-rose-100 text-rose-800 border-rose-200',
    PATIENT: 'bg-sky-100 text-sky-800 border-sky-200'
  };

  return (
    <aside 
      className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-slate-900 text-slate-300 border-r border-slate-800 transition-all duration-300 ${
        isOpen ? 'w-64' : 'w-0 lg:w-20'
      } overflow-hidden`}
    >
      {/* Brand logo */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800 bg-slate-900 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-teal-500 rounded flex items-center justify-center text-white font-bold shrink-0 shadow-sm">
            <Activity className="w-5 h-5" />
          </div>
          {isOpen && (
            <div className="flex flex-col">
              <span className="text-white font-bold tracking-tight text-sm leading-tight whitespace-nowrap">Double Scenario</span>
              <span className="text-[10px] text-teal-400 font-semibold tracking-wider uppercase mt-0.5">Health Care</span>
            </div>
          )}
        </div>
        {isOpen && (
          <button 
            onClick={onToggle} 
            className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 lg:hidden"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Logged in role label */}
      <div className="p-4 border-b border-slate-800/60 bg-slate-900/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-slate-800 flex items-center justify-center text-white font-bold shrink-0 shadow-sm border border-slate-700 uppercase text-xs">
            {userFullName.charAt(0)}
          </div>
          {isOpen && (
            <div className="flex flex-col min-w-0">
              <p className="text-xs font-semibold text-white truncate leading-tight">{userFullName}</p>
              <div className="mt-1 self-start">
                <span className={`inline-block text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${rolePillStyles[role]}`}>
                  {role}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 py-2">
          {isOpen ? 'Main Management' : 'Menu'}
        </div>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 cursor-pointer ${
                isActive 
                  ? 'bg-teal-500 text-white font-semibold shadow-sm' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`}>
                {item.icon}
              </span>
              {isOpen && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Logout Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-900 shrink-0">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0 text-red-400" />
          {isOpen && <span>Log Out Portal</span>}
        </button>
      </div>
    </aside>
  );
};
