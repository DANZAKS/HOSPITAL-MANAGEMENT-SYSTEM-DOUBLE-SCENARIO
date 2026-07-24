/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Activity, Mail, Lock, User as UserIcon, Phone, Calendar, MapPin, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { db } from '../db';

interface AuthPagesProps {
  view: 'login' | 'signup' | 'forgot';
  onNavigate: (newView: 'login' | 'signup' | 'forgot' | 'landing') => void;
  onLoginSuccess: () => void;
  onQuickLogin?: (email: string, role: string) => void;
}

export const AuthPages: React.FC<AuthPagesProps> = ({
  view,
  onNavigate,
  onLoginSuccess
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Registration state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [address, setAddress] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // General validation
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const users = db.getUsers();
      let user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
      
      if (!user) {
        setError('Invalid email or password combination.');
        setLoading(false);
        return;
      }

      if (user.email.toLowerCase() === 'danzaks001@gmail.com') {
        user.role = 'ADMIN';
        user.department = 'Hospital Administration';
      } else if (user.email.toLowerCase() === 'faruk@gmail.com') {
        user.role = 'PHARMACIST';
        user.department = 'Central Pharmacy';
      }

      if (user.status === 'Inactive') {
        setError('This user account has been deactivated. Please contact administration.');
        setLoading(false);
        return;
      }

      db.setCurrentUser(user);
      setLoading(false);
      onLoginSuccess();
    }, 800);
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Form validations
    if (!fullName || !email || !phone || !dob || !gender || !address || !password || !confirmPassword) {
      setError('All fields are mandatory for Patient Registration.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password fields do not match.');
      return;
    }

    if (password.length < 5) {
      setError('Password must be at least 5 characters long for security purposes.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const users = db.getUsers();
      if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        setError('An account with this email address is already registered.');
        setLoading(false);
        return;
      }

      // Add to database
      const isDanzaksAdmin = email.toLowerCase() === 'danzaks001@gmail.com';
      const isFarukPharm = email.toLowerCase() === 'faruk@gmail.com';
      const newPatient = db.addUser({
        email,
        fullName,
        phone,
        role: isDanzaksAdmin ? 'ADMIN' : isFarukPharm ? 'PHARMACIST' : 'PATIENT',
        department: isDanzaksAdmin ? 'Hospital Administration' : isFarukPharm ? 'Central Pharmacy' : undefined,
        password,
        dob,
        gender,
        address,
        status: 'Active'
      });

      // Seed default medical history for the brand-new patient
      db.addHistoryRecord(newPatient.id, {
        type: 'Consultation',
        title: 'Patient Account Created',
        description: 'Completed onboarding registration. General medical file is active and prepared.',
        doctorName: 'System Registration System'
      });

      setLoading(false);
      setSuccess('Account registered successfully! You can now log in.');
      // Auto fill and navigate
      setEmail(email);
      setPassword(password);
      setTimeout(() => {
        onNavigate('login');
        setSuccess(null);
      }, 1500);
    }, 1000);
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email) {
      setError('Please provide your registered email address.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(`A password reset link has been dispatched to ${email}. If the account exists, you will receive instructions shortly.`);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 font-sans">
      
      {/* Top Brand Logo */}
      <div 
        onClick={() => onNavigate('landing')} 
        className="flex items-center gap-2.5 mb-8 cursor-pointer hover:opacity-85 select-none"
      >
        <div className="bg-teal-500 text-white p-2 rounded shadow-sm">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-slate-900 tracking-tight text-base leading-none block">Double Scenario</span>
          <span className="text-[10px] block text-teal-600 font-bold uppercase tracking-wider mt-0.5">Health Care</span>
        </div>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-8 bg-white rounded-lg shadow border border-slate-200 p-6 sm:p-8">
        
        {/* Left Column: Form Section */}
        <div className="md:col-span-7 space-y-6">
          {view === 'login' && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold font-display text-slate-800">Welcome Back</h2>
                <p className="text-xs text-slate-400">Please enter your hospital portal credentials below to sign in.</p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g., doctor.house@hospital.com"
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-teal-500 rounded-md text-sm text-slate-700 outline-none transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
                    <button
                      type="button"
                      onClick={() => onNavigate('forgot')}
                      className="text-[10px] font-semibold text-teal-600 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 focus:border-teal-500 rounded-md text-sm text-slate-700 outline-none transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white font-semibold text-xs rounded-md shadow-sm transition-colors cursor-pointer uppercase tracking-wider"
                >
                  {loading ? 'Authenticating...' : 'Sign In to Portal'}
                </button>
              </form>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-400">New patient? </span>
                <button
                  onClick={() => onNavigate('signup')}
                  className="text-xs font-bold text-teal-600 hover:underline"
                >
                  Register an account
                </button>
              </div>
            </div>
          )}

          {view === 'signup' && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold font-display text-slate-800">Patient Registration</h2>
                <p className="text-xs text-slate-400">Create your personal Double Scenario clinical profile securely.</p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-md text-xs text-red-600 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-3 bg-teal-50 border border-teal-100 rounded-md text-xs text-teal-600">
                  {success}
                </div>
              )}

              <form onSubmit={handleSignup} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-0.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-teal-500 rounded-md text-xs outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john.doe@email.com"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-teal-500 rounded-md text-xs outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 012-3456"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-teal-500 rounded-md text-xs outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Date of Birth</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-teal-500 rounded-md text-xs outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-teal-500 rounded-md text-xs outline-none"
                    >
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div className="space-y-0.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Residential Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="742 Evergreen Terrace"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-teal-500 rounded-md text-xs outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-teal-500 rounded-md text-xs outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-teal-500 rounded-md text-xs outline-none"
                        required
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white font-semibold text-xs rounded-md shadow-sm transition-colors cursor-pointer mt-2 uppercase tracking-wider"
                >
                  {loading ? 'Creating Account...' : 'Complete Registration'}
                </button>
              </form>

              <div className="text-center">
                <span className="text-[11px] text-slate-400">Already registered? </span>
                <button
                  onClick={() => onNavigate('login')}
                  className="text-[11px] font-bold text-teal-600 hover:underline"
                >
                  Sign In here
                </button>
              </div>
            </div>
          )}

          {view === 'forgot' && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold font-display text-slate-800">Password Recovery</h2>
                <p className="text-xs text-slate-400">Provide your account email to dispatch a verification recovery link.</p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-md text-xs text-red-600 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-3 bg-teal-50 border border-teal-100 rounded-md text-xs text-teal-600">
                  {success}
                </div>
              )}

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g., patient@hospital.com"
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-teal-500 rounded-md text-sm text-slate-700 outline-none transition-colors"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white font-semibold text-xs rounded-md shadow-sm transition-colors cursor-pointer uppercase tracking-wider"
                >
                  {loading ? 'Processing...' : 'Send Recovery Instructions'}
                </button>
              </form>

              <div className="text-center">
                <button
                  onClick={() => onNavigate('login')}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 hover:underline"
                >
                  Return to Sign In
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Hospital Portal System Overview */}
        <div className="md:col-span-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-lg p-6 flex flex-col justify-between space-y-6 shadow-md">
          <div className="space-y-4">
            <div>
              <span className="text-[9px] font-bold text-teal-400 uppercase tracking-widest block mb-1">Double Scenario Health</span>
              <h3 className="text-base font-bold text-white">Integrated Care Platform</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Empowering healthcare professionals and patients with real-time digital clinical operations.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 p-2.5 bg-white/5 rounded border border-white/10">
                <div className="w-2 h-2 rounded-full bg-teal-400 mt-1.5 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-white">Admin Management Portal</h4>
                  <p className="text-[10px] text-slate-300">Staff onboarding, financial revenue tracking, and official invoice verification.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 bg-white/5 rounded border border-white/10">
                <div className="w-2 h-2 rounded-full bg-teal-400 mt-1.5 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-white">Physicians & Pharmacy</h4>
                  <p className="text-[10px] text-slate-300">Digital prescription generation, dosage guidance, and real-time depot stock tracking.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 bg-white/5 rounded border border-white/10">
                <div className="w-2 h-2 rounded-full bg-teal-400 mt-1.5 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-white">Patient Self-Service</h4>
                  <p className="text-[10px] text-slate-300">Direct booking, automated Naira billing, digital receipt generation, and medical file access.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 text-center leading-normal pt-3 border-t border-white/10">
            Secure Encrypted Health Network &bull; <span className="font-mono text-teal-300">Double Scenario HMS</span>
          </div>
        </div>
      </div>
    </div>
  );
};
