/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Menu, Bell, CheckCircle, RefreshCw, X, User as UserIcon } from 'lucide-react';
import { db } from '../db';
import { Notification, User } from '../types';

interface TopBarProps {
  onToggleSidebar: () => void;
  currentUser: User;
  onLogout: () => void;
  onQuickRoleSwitch?: (email: string, role: string) => void;
  activeTab: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  onToggleSidebar,
  currentUser,
  onLogout,
  activeTab
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  useEffect(() => {
    // Fetch notifications for the active user
    const fetchNotifs = () => {
      const all = db.getNotifications();
      const filtered = all.filter(n => n.userId === currentUser.id);
      setNotifications(filtered);
    };

    fetchNotifs();
    // Refresh every 5 seconds or keep updated on component mounts
    const interval = setInterval(fetchNotifs, 5000);
    return () => clearInterval(interval);
  }, [currentUser.id]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = () => {
    const all = db.getNotifications();
    const updated = all.map(n => {
      if (n.userId === currentUser.id) {
        return { ...n, read: true };
      }
      return n;
    });
    db.saveNotifications(updated);
    setNotifications(updated.filter(n => n.userId === currentUser.id));
  };

  const handleNotifClick = (notifId: string) => {
    const all = db.getNotifications();
    const updated = all.map(n => {
      if (n.id === notifId) {
        return { ...n, read: true };
      }
      return n;
    });
    db.saveNotifications(updated);
    setNotifications(updated.filter(n => n.userId === currentUser.id));
  };

  // Human friendly page title parsing
  const getPageTitle = () => {
    const parts = activeTab.split('-');
    if (parts.length < 2) return 'Portal Dashboard';
    
    const viewName = parts.slice(1).join(' ');
    return viewName.charAt(0).toUpperCase() + viewName.slice(1);
  };

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 md:px-8 bg-white border-b border-slate-200 shadow-sm font-sans shrink-0">
      
      {/* Title & Menu trigger */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 -ml-2 text-slate-500 hover:text-slate-800 rounded-md hover:bg-slate-50 cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:block">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block -mb-0.5">Double Scenario Health Care</span>
          <h2 className="text-base font-bold text-slate-900 tracking-tight capitalize">
            {getPageTitle()}
          </h2>
        </div>
      </div>

      {/* Right Edge: Notifications, Emergency Mode, and User Info */}
      <div className="flex items-center gap-4 relative">
        
        {/* Emergency Mode status from Design HTML */}
        <div className="hidden lg:flex items-center px-3 py-1 bg-amber-50 border border-amber-200 rounded-full">
          <span className="w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Emergency Mode Off</span>
        </div>

        {/* NOTIFICATIONS BELL */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifDropdown(!showNotifDropdown);
            }}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-md hover:bg-slate-50 relative cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-teal-500 text-white rounded-full text-[9px] font-extrabold flex items-center justify-center border-2 border-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowNotifDropdown(false)} />
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-lg z-20 overflow-hidden flex flex-col max-h-96">
                <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-slate-50">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Inbox Alerts ({unreadCount})</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[10px] font-bold text-teal-600 hover:underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-50 text-xs">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                      <p>No active notifications</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          handleNotifClick(notif.id);
                          setShowNotifDropdown(false);
                        }}
                        className={`p-3 cursor-pointer hover:bg-slate-50 transition-colors flex items-start gap-2 ${
                          notif.read ? 'opacity-65' : 'bg-slate-50/50 border-l-2 border-teal-500'
                        }`}
                      >
                        <div className="flex-1 space-y-0.5">
                          <p className="font-bold text-slate-850">{notif.title}</p>
                          <p className="text-slate-500 leading-normal text-[11px]">{notif.message}</p>
                          <span className="text-[9px] text-slate-400 font-medium block pt-1">{notif.date}</span>
                        </div>
                        {!notif.read && (
                          <div className="w-1.5 h-1.5 bg-teal-500 rounded-full shrink-0 mt-1.5" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* COMPACT AVATAR */}
        <div className="flex items-center gap-2.5 border-l border-slate-200 pl-4">
          <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-700 font-bold flex items-center justify-center shadow-inner uppercase border border-slate-200 text-xs">
            {currentUser.fullName.charAt(0)}
          </div>
          <div className="hidden lg:block">
            <span className="block text-xs font-bold text-slate-850 truncate max-w-28 leading-none">
              {currentUser.fullName.split(' ')[0]}
            </span>
            <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-semibold mt-1">
              Portal Account
            </span>
          </div>
        </div>

      </div>
    </header>
  );
};
