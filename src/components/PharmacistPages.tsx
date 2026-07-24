/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Pill, AlertTriangle, CheckCircle, Search, Plus, Trash2, 
  RefreshCw, Layers, ShieldCheck, Clipboard, FileText
} from 'lucide-react';
import { db } from '../db';
import { Medicine, Prescription } from '../types';
import { ConfirmationModal } from './ConfirmationModal';

interface PharmacistPagesProps {
  activeTab: string;
  onOpenPrescription: (prescription: Prescription) => void;
  toast: (msg: string) => void;
}

export const PharmacistPages: React.FC<PharmacistPagesProps> = ({
  activeTab,
  onOpenPrescription,
  toast
}) => {
  // DB states
  const [medicines, setMedicines] = useState<Medicine[]>(() => db.getMedicines());
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(() => 
    db.getPrescriptions().filter(p => p.status === 'Sent' || p.status === 'Dispensed')
  );

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');

  // Modal forms
  const [showAddMedModal, setShowAddMedModal] = useState(false);
  const [showUpdateStockModal, setShowUpdateStockModal] = useState(false);
  const [selectedMed, setSelectedMed] = useState<Medicine | null>(null);
  const [updateQty, setUpdateQty] = useState(0);

  // Add Medicine Form
  const [newMedName, setNewMedName] = useState('');
  const [newMedCat, setNewMedCat] = useState('Antibiotics');
  const [newMedQty, setNewMedQty] = useState(50);
  const [newMedPrice, setNewMedPrice] = useState(12.50);
  const [newMedExp, setNewMedExp] = useState('2028-06-30');
  const [newMedSupplier, setNewMedSupplier] = useState('Pfizer Dist.');

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
    setMedicines(db.getMedicines());
    setPrescriptions(
      db.getPrescriptions().filter(p => p.status === 'Sent' || p.status === 'Dispensed')
    );
  };

  const handleAddMedicine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName) return;

    db.addMedicine({
      name: newMedName,
      category: newMedCat,
      quantity: Number(newMedQty),
      unitPrice: Number(newMedPrice),
      expiryDate: newMedExp,
      supplier: newMedSupplier
    });

    toast(`Successfully added "${newMedName}" to central pharmacy catalog!`);
    setShowAddMedModal(false);
    
    setNewMedName('');
    setNewMedQty(50);
    setNewMedPrice(12.50);
    
    syncData();
  };

  const handleOpenAdjustStock = (med: Medicine) => {
    setSelectedMed(med);
    setUpdateQty(med.quantity);
    setShowUpdateStockModal(true);
  };

  const handleAdjustStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMed) return;

    db.updateMedicineStock(selectedMed.id, updateQty);
    toast(`Replenished stock of ${selectedMed.name} to ${updateQty} units.`);
    setShowUpdateStockModal(false);
    setSelectedMed(null);
    syncData();
  };

  const handleDeleteMedicine = (medId: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Dispose Drug Inventory',
      message: `Are you absolutely sure you want to remove "${name}" from the Double Scenario database catalogs permanently?`,
      type: 'danger',
      action: () => {
        db.deleteMedicine(medId);
        toast(`Removed drug ${name} from catalog files.`);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        syncData();
      }
    });
  };

  const handleDispensePrescription = (presId: string, patName: string, drugName: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Dispense Active Prescription',
      message: `Confirm packing and dispensing ${drugName} for Patient ${patName}? This auto-deducts one pack from hospital inventory and logs clinical completion.`,
      type: 'success',
      action: () => {
        const currentUser = db.getCurrentUser();
        const pharmacistName = currentUser ? currentUser.fullName : 'Hospital Pharmacist';
        db.dispensePrescription(presId, pharmacistName);
        toast(`Dispensed ${drugName} to ${patName}. Stock metrics updated!`);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        syncData();
      }
    });
  };

  // --- RENDERING TAB VIEWS ---

  if (activeTab === 'pharmacist-dashboard') {
    const totalDrugs = medicines.length;
    const lowStock = medicines.filter(m => m.stockStatus === 'Low Stock').length;
    const outOfStock = medicines.filter(m => m.stockStatus === 'Out of Stock').length;
    const activePrescripts = prescriptions.filter(p => p.status === 'Sent');

    const stats = [
      { label: 'Active Catalog items', val: totalDrugs, icon: <Layers className="w-5 h-5 text-teal-600" />, bg: 'bg-teal-50 border-teal-100' },
      { label: 'Low Stock Warnings', val: lowStock, icon: <AlertTriangle className="w-5 h-5 text-amber-600 animate-bounce" />, bg: 'bg-amber-50 border-amber-100' },
      { label: 'Out Of Stock', val: outOfStock, icon: <AlertTriangle className="w-5 h-5 text-red-600" />, bg: 'bg-red-50 border-red-100' },
      { label: 'Rx Dispense Queue', val: activePrescripts.length, icon: <FileText className="w-5 h-5 text-cyan-600" />, bg: 'bg-cyan-50 border-cyan-100' }
    ];

    return (
      <div className="space-y-4 font-sans">
        
        {/* Banner */}
        <div className="p-5 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">Hospital Pharmacy Operations</h3>
            <p className="text-xs text-slate-400 mt-1">Hello {db.getCurrentUser()?.fullName || 'Pharmacist'}. Adjust drug inventory limits, audit expiry metrics, and dispense digital clinician prescriptions.</p>
          </div>
          <button
            onClick={() => {
              syncData();
              toast('Pharmacy database parameters synced!');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 text-xs font-semibold rounded transition-colors self-start cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Inventory</span>
          </button>
        </div>

        {/* Stats */}
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

        {/* Quick Dispense Table */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Active Prescriptions Dispensing Queue</h4>
            <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-2.5 py-0.5 rounded uppercase">Action Required</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold bg-slate-50">
                  <th className="py-2.5 px-3">Rx Reference</th>
                  <th className="py-2.5 px-3">Patient Name</th>
                  <th className="py-2.5 px-3">Prescribing Doctor</th>
                  <th className="py-2.5 px-3">Medicine requested</th>
                  <th className="py-2.5 px-3">Dosage Specifications</th>
                  <th className="py-2.5 px-3 text-right font-semibold">Immediate Dispensing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activePrescripts.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-teal-700">{p.id}</td>
                    <td className="py-3 px-3 font-bold text-slate-800">{p.patientName}</td>
                    <td className="py-3 px-3 text-slate-500 font-semibold">{p.doctorName}</td>
                    <td className="py-3 px-3 font-bold text-slate-700">{p.medicineName}</td>
                    <td className="py-3 px-3 text-slate-400 font-mono">{p.dosage} ({p.frequency})</td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onOpenPrescription(p)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold rounded cursor-pointer"
                        >
                          Inspect Sheet
                        </button>
                        <button
                          onClick={() => handleDispensePrescription(p.id, p.patientName, p.medicineName)}
                          className="px-3 py-1 bg-teal-500 hover:bg-teal-600 text-white text-[10px] font-bold rounded shadow transition-all cursor-pointer"
                        >
                          Dispense Rx
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {activePrescripts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 italic">No prescriptions currently pending package dispatches.</td>
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

  if (activeTab === 'pharmacist-inventory' || activeTab === 'pharmacist-low-stock') {
    const isLowStockTab = activeTab === 'pharmacist-low-stock';
    const filtered = medicines.filter(m => {
      const matchSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchLowStock = !isLowStockTab || m.stockStatus !== 'In Stock';
      return matchSearch && matchLowStock;
    });

    return (
      <div className="space-y-4">
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {isLowStockTab ? 'Pharmacy Critical Reorder Desk' : 'Active Pharmaceutical Inventory'}
              </h3>
              <p className="text-xs text-slate-400">
                {isLowStockTab ? 'Isolated view highlighting drugs matching low stock flags or out of stock levels.' : 'Complete roster of therapeutic items stocked in the central depot.'}
              </p>
            </div>
            
            {!isLowStockTab && (
              <button
                onClick={() => setShowAddMedModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold rounded shadow transition-colors self-end sm:self-auto cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Onboard New Medicine</span>
              </button>
            )}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search drug names..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-teal-500 rounded text-xs outline-none"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold bg-slate-50">
                  <th className="py-2.5 px-3">Unique ID</th>
                  <th className="py-2.5 px-3">Medicine Generic/Brand</th>
                  <th className="py-2.5 px-3">Therapeutic Category</th>
                  <th className="py-2.5 px-3">Depot quantity</th>
                  <th className="py-2.5 px-3">Unit Price</th>
                  <th className="py-2.5 px-3">Expiry date</th>
                  <th className="py-2.5 px-3">Authorized Supplier</th>
                  <th className="py-2.5 px-3 text-center">Depot Status</th>
                  <th className="py-2.5 px-3 text-right">Replenishments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-3 font-mono text-slate-400">{m.id}</td>
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
                          onClick={() => handleOpenAdjustStock(m)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold rounded cursor-pointer"
                        >
                          Replenish stock
                        </button>
                        <button
                          onClick={() => handleDeleteMedicine(m.id, m.name)}
                          className="p-1 text-red-500 hover:bg-red-50 hover:text-white rounded transition-colors cursor-pointer"
                          title="Dispose batch file"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 italic">No inventory batch matches active filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showAddMedModal && renderAddMedModal()}
        {showUpdateStockModal && renderAdjustStockModal()}
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

  if (activeTab === 'pharmacist-prescriptions') {
    return (
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">Historical Dispatched Prescriptions</h3>
          <p className="text-xs text-slate-400">Track complete medical history of clinician prescription logs and dispenser signs.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold bg-slate-50">
                <th className="py-2.5 px-3">Rx Code</th>
                <th className="py-2.5 px-3">Patient Name</th>
                <th className="py-2.5 px-3">Prescribing Physician</th>
                <th className="py-2.5 px-3">Medicine Generic</th>
                <th className="py-2.5 px-3">Dosage Specs</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right font-semibold">Rx Sheet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {prescriptions.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-teal-700">{p.id}</td>
                  <td className="py-3 px-3 font-bold text-slate-800">{p.patientName}</td>
                  <td className="py-3 px-3 text-slate-500 font-medium">{p.doctorName}</td>
                  <td className="py-3 px-3 font-semibold text-slate-700">{p.medicineName}</td>
                  <td className="py-3 px-3 text-slate-400 font-mono">{p.dosage}, {p.frequency} ({p.duration})</td>
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                      p.status === 'Completed' || p.status === 'Dispensed' ? 'bg-teal-100 text-teal-800' :
                      p.status === 'Sent' ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-800 animate-pulse'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => onOpenPrescription(p)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold rounded cursor-pointer"
                    >
                      View sheet
                    </button>
                  </td>
                </tr>
              ))}
              {prescriptions.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 italic">No active prescriptions on pharmacy dispatch registries.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return null;

  // --- SUBTAB FORMS ---

  function renderAddMedModal() {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowAddMedModal(false)} />
        <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden border border-slate-200 z-10 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">Onboard Pharmaceutical Medicine</h4>
            <button onClick={() => setShowAddMedModal(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
          </div>

          <form onSubmit={handleAddMedicine} className="space-y-3 pt-4 text-xs">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Medicine Brand/Generic</label>
              <input
                type="text"
                value={newMedName}
                onChange={(e) => setNewMedName(e.target.value)}
                placeholder="e.g., Atorvastatin 40mg"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded outline-none font-semibold text-slate-700 focus:border-teal-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Therapeutic Category</label>
                <select
                  value={newMedCat}
                  onChange={(e) => setNewMedCat(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded outline-none text-slate-700 focus:border-teal-500"
                >
                  <option value="Antibiotics">Antibiotics</option>
                  <option value="Cardiovascular">Cardiovascular</option>
                  <option value="Analgesics">Analgesics</option>
                  <option value="Antidiabetics">Antidiabetics</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Expiry date</label>
                <input
                  type="date"
                  value={newMedExp}
                  onChange={(e) => setNewMedExp(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded outline-none font-mono text-slate-700 focus:border-teal-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Initial Depot quantity</label>
                <input
                  type="number"
                  value={newMedQty}
                  onChange={(e) => setNewMedQty(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded outline-none text-slate-700 focus:border-teal-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Unit Sales Price (NGN)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newMedPrice}
                  onChange={(e) => setNewMedPrice(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded outline-none text-slate-700 focus:border-teal-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Registered Supplier</label>
              <input
                type="text"
                value={newMedSupplier}
                onChange={(e) => setNewMedSupplier(e.target.value)}
                placeholder="Pfizer Wholesalers"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded outline-none text-slate-700 focus:border-teal-500"
                required
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddMedModal(false)}
                className="px-3 py-1.5 text-slate-500 hover:bg-slate-50 border border-slate-200 rounded transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded shadow transition-colors cursor-pointer text-xs uppercase"
              >
                Onboard Batch
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  function renderAdjustStockModal() {
    if (!selectedMed) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowUpdateStockModal(false)} />
        <div className="relative w-full max-w-sm bg-white rounded-lg shadow-xl overflow-hidden border border-slate-200 z-10 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">Replenish Depot Stock</h4>
            <button onClick={() => setShowUpdateStockModal(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
          </div>

          <form onSubmit={handleAdjustStock} className="space-y-4 pt-4 text-xs">
            <div className="bg-slate-50 p-3 border border-slate-200 rounded space-y-1">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase">Selected Batch generic</span>
              <p className="font-bold text-sm text-slate-800">{selectedMed.name}</p>
              <p className="text-[10px] text-slate-400">Current Depot level: {selectedMed.quantity} units</p>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Replenished Units Level</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="500"
                  value={updateQty}
                  onChange={(e) => setUpdateQty(Number(e.target.value))}
                  className="flex-1 accent-teal-600 cursor-pointer"
                />
                <input
                  type="number"
                  value={updateQty}
                  onChange={(e) => setUpdateQty(Number(e.target.value))}
                  className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded font-bold text-center text-slate-800 outline-none focus:border-teal-500"
                  required
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowUpdateStockModal(false)}
                className="px-3 py-1.5 text-slate-500 hover:bg-slate-50 border border-slate-200 rounded transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded shadow transition-colors cursor-pointer text-xs uppercase"
              >
                Apply replenish
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
};
