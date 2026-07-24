/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Calendar, Activity, Pill, ChevronRight, LayoutDashboard, Stethoscope, ArrowRight } from 'lucide-react';
import { User } from '../types';

interface LandingPageProps {
  onNavigateToLogin: () => void;
  onNavigateToSignup: () => void;
  onQuickLogin?: (email: string, role: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigateToLogin,
  onNavigateToSignup
}) => {
  const features = [
    {
      icon: <Activity className="w-5 h-5 text-teal-500" />,
      title: "Real-Time Administration",
      description: "Complete overview of patients, active staff, doctors, stock statuses, and payments with a robust admin dashboard."
    },
    {
      icon: <Calendar className="w-5 h-5 text-sky-500" />,
      title: "Smart Appointment Booking",
      description: "Patients can easily request appointments; doctors can accept or reschedule. Real-time notifications keep everyone in sync."
    },
    {
      icon: <Stethoscope className="w-5 h-5 text-indigo-500" />,
      title: "Clinical Prescriptions",
      description: "Doctors generate medical prescriptions (Rx) digitally, send them directly to patient portals, and dispatch them to the pharmacy."
    },
    {
      icon: <Pill className="w-5 h-5 text-rose-500" />,
      title: "Active Stock & Dispensing",
      description: "Pharmacists monitor active medicine quantities, get low stock alerts, and securely dispense items directly against digital prescriptions."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-200 z-40 h-16 flex items-center">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-teal-500 text-white p-2 rounded flex items-center justify-center shadow-sm">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 tracking-tight text-base leading-none block">Double Scenario</span>
              <span className="text-[10px] block text-teal-600 font-bold uppercase tracking-wider mt-0.5">Health Care</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onNavigateToLogin}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 cursor-pointer transition-colors uppercase tracking-wider"
            >
              Sign In
            </button>
            <button
              onClick={onNavigateToSignup}
              className="text-xs font-bold text-white bg-teal-500 hover:bg-teal-600 px-4 py-2.5 rounded shadow-sm cursor-pointer transition-all uppercase tracking-wider"
            >
              Register Account
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden py-16 sm:py-20 bg-gradient-to-b from-white via-slate-50 to-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left column info */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 border border-teal-200 rounded-full text-teal-700 text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
                  <span>Clinical Governance System v2.6</span>
                </div>
                
                <h1 className="text-4xl sm:text-5xl lg:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
                  Advanced Clinic & <span className="text-teal-500">Hospital Administration</span> Portal.
                </h1>
                
                <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">
                  A comprehensive, modular dashboard system supporting active clinicians, pharmacists, administrative managers, and patients with integrated scheduling, payment verifications, and digital prescriptions.
                </p>

                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={onNavigateToSignup}
                    className="flex items-center gap-2 text-xs font-bold text-white bg-teal-500 hover:bg-teal-600 px-6 py-3.5 rounded shadow transition-all cursor-pointer uppercase tracking-wider group"
                  >
                    <span>Create Patient Account</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                  <button
                    onClick={onNavigateToLogin}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-6 py-3.5 rounded transition-colors cursor-pointer uppercase tracking-wider"
                  >
                    <span>Staff Portal Sign In</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Right column Portal Access */}
              <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-lg shadow-sm border border-slate-200 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 border border-teal-100 rounded-full text-teal-700 text-[10px] font-bold uppercase tracking-wider">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Secure Access Portal</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">Clinical Portal Sign In</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Access your account using real registered credentials. Patients, Doctors, Pharmacists, and System Administrators can sign in below.
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={onNavigateToLogin}
                    className="w-full py-3 bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs rounded-md shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                  >
                    <span>Sign In to Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={onNavigateToSignup}
                    className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-md border border-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                  >
                    <span>Register New Patient Account</span>
                  </button>
                </div>

                <div className="p-3 bg-slate-50 rounded border border-slate-200/80 text-[11px] text-slate-500 space-y-2">
                  <div>
                    <span className="font-bold text-slate-700 block">System Administrator Profile:</span>
                    <p className="text-[10px] text-slate-500 font-mono">danzaks001@gmail.com</p>
                  </div>
                  <div className="pt-2 border-t border-slate-200/60">
                    <span className="font-bold text-slate-700 block">Lead Pharmacist Profile:</span>
                    <p className="text-[10px] text-slate-500 font-mono">faruk@gmail.com (Pass: 12345678)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section className="py-16 bg-white border-y border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
              <h2 className="text-3xl font-black font-display text-slate-900 tracking-tight">
                Designed for Comprehensive Medical Operations
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Empowering clinical staffs, pharmacists, and billing managers with highly specialized tools in a cohesive responsive interface.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feat, idx) => (
                <div key={idx} className="p-5 rounded-md bg-slate-50 border border-slate-200 flex flex-col space-y-3 shadow-sm">
                  <div className="p-2.5 bg-white rounded border border-slate-200 shadow-sm self-start">
                    {feat.icon}
                  </div>
                  <h4 className="font-bold text-slate-900 text-base">{feat.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{feat.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="bg-teal-500 text-white p-1.5 rounded">
              <Activity className="w-4 h-4" />
            </div>
            <span className="font-bold text-white text-sm tracking-tight">Double Scenario Health Care</span>
          </div>
          <p>© 2026 Double Scenario Health Care Management System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
