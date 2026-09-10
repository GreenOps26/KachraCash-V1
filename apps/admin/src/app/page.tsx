'use client';

import React, { useState } from 'react';
import { DispatchRadar } from '@/components/DispatchRadar';
import { FloorRateCardManager } from '@/components/FloorRateCardManager';
import { WardSuspensionDesk } from '@/components/WardSuspensionDesk';
import { WalletLedgerDesk } from '@/components/WalletLedgerDesk';
import { DisputeResolutionQueue } from '@/components/DisputeResolutionQueue';
import { SwmComplianceTab } from '@/components/SwmComplianceTab';

type Tab = 'DASHBOARD' | 'RADAR' | 'RATES' | 'FLOOD_DESK' | 'WALLETS' | 'DISPUTES' | 'SWM_2026';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('DASHBOARD');
  const [stopwatchSeconds, setStopwatchSeconds] = useState(5048);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [showAddPickupModal, setShowAddPickupModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [pickupCreatedNotice, setPickupCreatedNotice] = useState<string | null>(null);

  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setStopwatchSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  const formatTime = (secs: number) => {
    const h = String(Math.floor(secs / 3600)).padStart(2, '0');
    const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const tabs: Array<{ id: Tab; label: string; icon: string }> = [
    { id: 'DASHBOARD', label: 'Donezo Overview', icon: '🌿' },
    { id: 'RADAR', label: 'Dispatch Radar', icon: '📡' },
    { id: 'RATES', label: 'Floor Rate Cards', icon: '📊' },
    { id: 'FLOOD_DESK', label: 'Monsoon Ward Desk', icon: '⛈️' },
    { id: 'WALLETS', label: 'Float Ledger Desk', icon: '💼' },
    { id: 'DISPUTES', label: 'Dispute Queue', icon: '⚖️' },
    { id: 'SWM_2026', label: 'SWM Rules 2026', icon: '🌱' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Donezo Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5EBE5] pb-4">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#143D2B] text-white shadow-md shadow-[#143D2B]/20'
                    : 'bg-white text-[#62776C] hover:bg-[#F4F7F5] border border-[#E5EBE5]'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search & Profile Pill */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white border border-[#E5EBE5] rounded-full text-xs">
            <span className="text-[#62776C]">🔍</span>
            <input
              type="text"
              placeholder="Search pickups, wards..."
              className="bg-transparent outline-none w-48 text-xs text-[#14241C]"
            />
            <span className="text-[10px] bg-[#F4F7F5] px-1.5 py-0.5 rounded border border-[#E5EBE5] font-mono text-[#62776C]">
              ⌘F
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#E5EBE5] rounded-full">
            <div className="w-6 h-6 rounded-full bg-[#FEF3C7] flex items-center justify-center text-xs">
              👨‍💼
            </div>
            <span className="text-xs font-bold text-[#143D2B]">Pranjal B.</span>
          </div>
        </div>
      </div>

      {pickupCreatedNotice && (
        <div className="p-4 bg-[#DCFCE7] border border-[#86EFAC] rounded-2xl flex items-center justify-between text-xs text-[#15803D] font-bold">
          <span>{pickupCreatedNotice}</span>
          <button onClick={() => setPickupCreatedNotice(null)} className="text-sm">✕</button>
        </div>
      )}

      {/* Primary Donezo Overview Tab */}
      {activeTab === 'DASHBOARD' && (
        <div className="space-y-6">
          {/* Header Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0A2418] tracking-tight font-display">
                Dashboard
              </h1>
              <p className="text-sm text-[#62776C] mt-0.5">
                Plan, prioritize, and monitor scrap circularity across Guwahati wards.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddPickupModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#143D2B] text-white text-xs font-bold shadow-md shadow-[#143D2B]/20 hover:bg-[#0D281A] transition-all cursor-pointer"
              >
                <span>+</span>
                <span>Add Pickup</span>
              </button>
              <button
                onClick={() => setShowExportModal(true)}
                className="px-5 py-2.5 rounded-full bg-white text-[#143D2B] border border-[#E5EBE5] text-xs font-bold hover:bg-[#F4F7F5] transition-all cursor-pointer"
              >
                Import / Export Data
              </button>
            </div>
          </div>

          {/* 4 Metric Cards (Matching Donezo Pin 0) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Solid Dark Forest Green */}
            <div className="bg-gradient-to-br from-[#103322] to-[#164831] text-white p-6 rounded-[24px] border border-[#1F573C] shadow-lg shadow-[#103322]/15 flex flex-col justify-between min-h-[140px]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#A7F3D0]">Total Pickups</span>
                <span className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center text-xs text-white">
                  ↗
                </span>
              </div>
              <div className="text-3xl font-extrabold font-display my-2">248</div>
              <div className="flex items-center gap-2 text-[11px] text-[#86EFAC] font-semibold">
                <span className="px-2 py-0.5 rounded-full bg-[#22C55E]/25 border border-[#86EFAC]/30 font-bold">
                  +12%
                </span>
                <span>Increased from yesterday</span>
              </div>
            </div>

            {/* Card 2: White */}
            <div className="bg-white text-[#14241C] p-6 rounded-[24px] border border-[#E5EBE5] shadow-sm flex flex-col justify-between min-h-[140px]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#62776C]">Recycled Scrap</span>
                <span className="w-7 h-7 rounded-full bg-[#F4F7F5] border border-[#E5EBE5] flex items-center justify-center text-xs text-[#143D2B]">
                  ↗
                </span>
              </div>
              <div className="text-3xl font-extrabold font-display my-2 text-[#0A2418]">18.4 T</div>
              <div className="flex items-center gap-2 text-[11px] text-[#15803D] font-semibold">
                <span className="px-2 py-0.5 rounded-full bg-[#DCFCE7] font-bold">+8.5%</span>
                <span>Diverted from Boragaon</span>
              </div>
            </div>

            {/* Card 3: White */}
            <div className="bg-white text-[#14241C] p-6 rounded-[24px] border border-[#E5EBE5] shadow-sm flex flex-col justify-between min-h-[140px]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#62776C]">Disbursed Float</span>
                <span className="w-7 h-7 rounded-full bg-[#F4F7F5] border border-[#E5EBE5] flex items-center justify-center text-xs text-[#143D2B]">
                  ↗
                </span>
              </div>
              <div className="text-3xl font-extrabold font-display my-2 text-[#0A2418]">₹4.82L</div>
              <div className="flex items-center gap-2 text-[11px] text-[#15803D] font-semibold">
                <span className="px-2 py-0.5 rounded-full bg-[#DCFCE7] font-bold">92%</span>
                <span>Instant UPI customer split</span>
              </div>
            </div>

            {/* Card 4: White */}
            <div className="bg-white text-[#14241C] p-6 rounded-[24px] border border-[#E5EBE5] shadow-sm flex flex-col justify-between min-h-[140px]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#62776C]">Active Collectors</span>
                <span className="w-7 h-7 rounded-full bg-[#F4F7F5] border border-[#E5EBE5] flex items-center justify-center text-xs text-[#143D2B]">
                  ↗
                </span>
              </div>
              <div className="text-3xl font-extrabold font-display my-2 text-[#0A2418]">42</div>
              <div className="flex items-center gap-2 text-[11px] text-[#15803D] font-semibold">
                <span className="px-2 py-0.5 rounded-full bg-[#DCFCE7] font-bold">Live</span>
                <span>Beltola, Hatigaon, Jayanagar</span>
              </div>
            </div>
          </div>

          {/* Middle Row: Capsule Bar Analytics + Reminders + Projects */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Scrap Inflow Analytics (Capsule Bar Chart) */}
            <div className="bg-white p-6 rounded-[24px] border border-[#E5EBE5] shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-extrabold text-[#0A2418] font-display">
                  Project Analytics
                </h3>
                <span className="text-xs font-bold text-[#143D2B] bg-[#F4F7F5] px-3 py-1 rounded-full border border-[#E5EBE5]">
                  Weekly Inflow
                </span>
              </div>

              <div className="flex items-end justify-between h-40 pt-4 px-2">
                {[
                  { day: 'S', h: 'h-16', style: 'striped', val: '4.2T' },
                  { day: 'M', h: 'h-24', style: 'solid-dark', val: '6.8T' },
                  { day: 'T', h: 'h-20', style: 'solid-mint', val: '5.5T' },
                  { day: 'W', h: 'h-32', style: 'solid-dark', val: '8.9T' },
                  { day: 'T', h: 'h-20', style: 'striped', val: '5.8T' },
                  { day: 'F', h: 'h-16', style: 'striped', val: '4.9T' },
                  { day: 'S', h: 'h-28', style: 'striped', val: '7.2T' },
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2">
                    <div
                      className={`w-7 rounded-full transition-all cursor-pointer ${item.h} ${
                        item.style === 'solid-dark'
                          ? 'bg-[#103322]'
                          : item.style === 'solid-mint'
                          ? 'bg-[#4ADE80] shadow-sm shadow-[#4ADE80]/50'
                          : 'bg-gradient-to-b from-[#E2EAE5] to-white border-2 border-[#D4E0D7]'
                      }`}
                      title={`${item.day}: ${item.val}`}
                    />
                    <span className="text-xs font-bold text-[#8FA198]">{item.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reminders Card (Donezo Style) */}
            <div className="bg-white p-6 rounded-[24px] border border-[#E5EBE5] shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-[#0A2418] font-display">Reminders</h3>
                <span className="text-sm">🔔</span>
              </div>

              <div className="my-4">
                <h4 className="text-base font-bold text-[#0A2418] leading-tight">
                  GMC Zonal SWM Coordination
                </h4>
                <p className="text-xs text-[#62776C] mt-1">
                  Time: 02:00 PM – 04:00 PM • Panbazar Smart City HQ
                </p>
              </div>

              <button className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-[#143D2B] text-white text-xs font-bold hover:bg-[#0D281A] transition-all shadow-md shadow-[#143D2B]/15">
                <span>📹</span>
                <span>Start Meeting</span>
              </button>
            </div>

            {/* Active Recycle Batches */}
            <div className="bg-white p-6 rounded-[24px] border border-[#E5EBE5] shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-extrabold text-[#0A2418] font-display">
                  Recycle Batches
                </h3>
                <button className="text-xs font-bold text-[#143D2B] bg-[#F4F7F5] px-2.5 py-1 rounded-full border border-[#E5EBE5]">
                  + New
                </button>
              </div>

              <div className="divide-y divide-[#E5EBE5]">
                {[
                  { icon: '📦', name: 'Cardboard OCC (Ward 28)', due: 'Due: 11:30 AM • 450 kg' },
                  { icon: '🍾', name: 'PET Flakes Batch A', due: 'Due: 01:15 PM • Byrnihat Mill' },
                  { icon: '⚡', name: 'Copper & E-Scrap Hub', due: 'Due: 03:00 PM • Verified' },
                ].map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#F4F7F5] flex items-center justify-center text-sm">
                      {item.icon}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#0A2418]">{item.name}</div>
                      <div className="text-[11px] text-[#8FA198]">{item.due}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Bottom Row: Collector Fleet + Semi-Circle Gauge + Stopwatch */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Collector Fleet Collaboration */}
            <div className="bg-white p-6 rounded-[24px] border border-[#E5EBE5] shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-extrabold text-[#0A2418] font-display">
                  Collector Fleet
                </h3>
                <button className="text-xs font-bold text-[#143D2B] bg-[#F4F7F5] px-2.5 py-1 rounded-full border border-[#E5EBE5]">
                  + Add Member
                </button>
              </div>

              <div className="space-y-3">
                {[
                  {
                    name: 'Pranjal Saikia (প্ৰাঞ্জল)',
                    task: 'Doorstep Weighing • Beltola Ward 28',
                    badge: 'Active',
                    bg: 'bg-[#DCFCE7] text-[#15803D]',
                  },
                  {
                    name: 'Bhaben Kalita (ভবেন)',
                    task: 'Transit to Hatigaon Wholesale Depot',
                    badge: 'En Route',
                    bg: 'bg-[#FEF9C3] text-[#854D0E]',
                  },
                  {
                    name: 'Mukesh Das (মুকেশ)',
                    task: 'Byrnihat Freight Line Dispatch',
                    badge: 'Pending',
                    bg: 'bg-[#FEE2E2] text-[#B91C1C]',
                  },
                ].map((col, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#E0F2FE] flex items-center justify-center text-sm">
                        🛵
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#0A2418]">{col.name}</div>
                        <div className="text-[11px] text-[#62776C]">{col.task}</div>
                      </div>
                    </div>
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${col.bg}`}>
                      {col.badge}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ward Progress Semi-Circle Donut Gauge */}
            <div className="bg-white p-6 rounded-[24px] border border-[#E5EBE5] shadow-sm flex flex-col items-center justify-between text-center">
              <h3 className="text-base font-extrabold text-[#0A2418] font-display w-full text-left">
                Ward Target Progress
              </h3>

              <div className="relative w-44 h-24 my-2 overflow-hidden flex items-end justify-center">
                <div className="w-44 h-44 rounded-full border-[20px] border-[#E5EBE5] border-t-[#143D2B] border-r-[#143D2B] absolute -bottom-20 rotate-[-45deg]" />
                <div className="relative z-10 text-center pb-1">
                  <div className="text-3xl font-extrabold font-display text-[#0A2418]">78%</div>
                  <div className="text-[11px] font-semibold text-[#62776C]">Ward Quota Met</div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold text-[#62776C]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#143D2B]" /> Dispatched
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#4ADE80]" /> Weighed
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#E5EBE5]" /> Open
                </span>
              </div>
            </div>

            {/* Time Tracker Textured Dark Green Card */}
            <div className="bg-gradient-to-br from-[#164D36] to-[#0D281A] text-white p-6 rounded-[24px] shadow-lg shadow-[#0D281A]/25 flex flex-col justify-between relative overflow-hidden">
              <span className="text-xs font-semibold text-[#9AB4A6]">Live Dispatch Stopwatch</span>
              <div className="text-3xl sm:text-4xl font-extrabold font-mono tracking-wider text-center my-4 text-white">
                {formatTime(stopwatchSeconds)}
              </div>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className="w-10 h-10 rounded-full bg-white text-[#143D2B] flex items-center justify-center font-bold text-sm shadow-md hover:scale-105 transition-all"
                  title="Play/Pause"
                >
                  {isTimerRunning ? '⏸' : '▶'}
                </button>
                <button
                  onClick={() => setStopwatchSeconds(0)}
                  className="w-10 h-10 rounded-full bg-[#EF4444] text-white flex items-center justify-center font-bold text-xs shadow-md hover:scale-105 transition-all"
                  title="Reset"
                >
                  ⏹
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Tab Panels */}
      {activeTab === 'RADAR' && <DispatchRadar />}
      {activeTab === 'RATES' && <FloorRateCardManager />}
      {activeTab === 'FLOOD_DESK' && <WardSuspensionDesk />}
      {activeTab === 'WALLETS' && <WalletLedgerDesk />}
      {activeTab === 'DISPUTES' && <DisputeResolutionQueue />}
      {activeTab === 'SWM_2026' && <SwmComplianceTab />}

      {/* Modal 1: Add Pickup Request */}
      {showAddPickupModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FBFCFA] border border-[#DCE3D8] rounded-[24px] max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="p-5 bg-[#F1F5EF] border-b border-[#DCE3D8] flex items-center justify-between">
              <h3 className="font-extrabold text-base text-[#1F2A24] font-display">Create Doorstep Pickup Ticket</h3>
              <button onClick={() => setShowAddPickupModal(false)} className="w-8 h-8 rounded-full bg-white border border-[#DCE3D8] flex items-center justify-center text-xs text-[#57665C] hover:bg-[#F3DDD6] hover:text-[#9C3B2A] cursor-pointer">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-[#1F2A24] block mb-1">Guwahati Ward Location</label>
                <select className="w-full bg-[#F1F5EF] border border-[#DCE3D8] rounded-xl p-2.5 text-xs text-[#1F2A24] outline-none">
                  <option>Beltola / Wireless (Ward 28) - ACTIVE</option>
                  <option>Hatigaon Sijubari (Ward 24) - ACTIVE</option>
                  <option>Jayanagar (Ward 27) - ACTIVE</option>
                  <option>Ganeshguri / Dispur (Ward 12) - ACTIVE</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-[#1F2A24] block mb-1">Scrap Commodity SKU</label>
                <select className="w-full bg-[#F1F5EF] border border-[#DCE3D8] rounded-xl p-2.5 text-xs text-[#1F2A24] outline-none">
                  <option>Old Corrugated Cardboard (ভঙা কাৰ্ডব’ৰ্ড) - ₹14.00/kg</option>
                  <option>Plastic PET Bottles (প্লাষ্টিক বটল) - ₹22.00/kg</option>
                  <option>Ferrous Iron Rebar (লোহা / ৰড) - ₹28.50/kg</option>
                  <option>Copper Wire (তামৰ তাঁৰ) - ₹480.00/kg</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#1F2A24] block mb-1">Citizen Name</label>
                  <input type="text" defaultValue="Bhupen Hazarika" className="w-full bg-[#F1F5EF] border border-[#DCE3D8] rounded-xl p-2.5 text-xs text-[#1F2A24] outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#1F2A24] block mb-1">Estimated kg</label>
                  <input type="number" defaultValue="18.5" className="w-full bg-[#F1F5EF] border border-[#DCE3D8] rounded-xl p-2.5 text-xs text-[#1F2A24] outline-none" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-[#F1F5EF] border-t border-[#DCE3D8] flex justify-end gap-3">
              <button onClick={() => setShowAddPickupModal(false)} className="px-4 py-2 rounded-full border border-[#DCE3D8] bg-white text-xs font-bold text-[#1F2A24]">Cancel</button>
              <button
                onClick={() => {
                  setShowAddPickupModal(false);
                  setPickupCreatedNotice('Ticket created! Dispatched nearby collector Pranjal Saikia (137m away in Beltola).');
                }}
                className="px-5 py-2 rounded-full bg-[#1F4D3C] text-white text-xs font-bold shadow-md shadow-[#1F4D3C]/20 cursor-pointer"
              >
                ⚡ Dispatch Nearby Collector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Export SWM Report */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FBFCFA] border border-[#DCE3D8] rounded-[24px] max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="p-5 bg-[#F1F5EF] border-b border-[#DCE3D8] flex items-center justify-between">
              <h3 className="font-extrabold text-base text-[#1F2A24] font-display">CPCB Form IV Statutory SWM Manifest</h3>
              <button onClick={() => setShowExportModal(false)} className="w-8 h-8 rounded-full bg-white border border-[#DCE3D8] flex items-center justify-center text-xs text-[#57665C] hover:bg-[#F3DDD6] hover:text-[#9C3B2A] cursor-pointer">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-[#57665C]">
                Official statutory returns under Solid Waste Management Rules 2026. 18.4 Metric Tons diverted to Byrnihat and West Bengal mills.
              </p>
              <div className="p-4 rounded-xl bg-[#F1F5EF] border border-[#DCE3D8] text-xs space-y-2">
                <div className="flex justify-between"><span>Audit Period:</span><strong>September 2026</strong></div>
                <div className="flex justify-between"><span>Verified PostGIS GPS Runs:</span><strong>248 Pickups</strong></div>
                <div className="flex justify-between"><span>E-Waste & Polymer Tracked:</span><strong>6.8 Tons</strong></div>
              </div>
            </div>
            <div className="p-4 bg-[#F1F5EF] border-t border-[#DCE3D8] flex justify-end gap-3">
              <button onClick={() => setShowExportModal(false)} className="px-4 py-2 rounded-full border border-[#DCE3D8] bg-white text-xs font-bold text-[#1F2A24]">Close</button>
              <button
                onClick={() => {
                  setShowExportModal(false);
                  setPickupCreatedNotice('CPCB Form IV Digital Manifest downloaded with certified cryptographic hash.');
                }}
                className="px-5 py-2 rounded-full bg-[#1F4D3C] text-white text-xs font-bold cursor-pointer"
              >
                Download Signed PDF & CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
