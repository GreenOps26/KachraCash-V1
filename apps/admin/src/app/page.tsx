'use client';

import React, { useState } from 'react';
import { DispatchRadar } from '@/components/DispatchRadar';
import { FloorRateCardManager } from '@/components/FloorRateCardManager';
import { WardSuspensionDesk } from '@/components/WardSuspensionDesk';
import { WalletLedgerDesk } from '@/components/WalletLedgerDesk';
import { DisputeResolutionQueue } from '@/components/DisputeResolutionQueue';
import { SwmComplianceTab } from '@/components/SwmComplianceTab';

type Tab = 'RADAR' | 'RATES' | 'FLOOD_DESK' | 'WALLETS' | 'DISPUTES' | 'SWM_2026';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('RADAR');

  const tabs: Array<{ id: Tab; label: string; icon: string }> = [
    { id: 'RADAR', label: 'Dispatch Radar', icon: '📡' },
    { id: 'RATES', label: 'Floor Rate Cards', icon: '📊' },
    { id: 'FLOOD_DESK', label: 'Monsoon Ward Desk', icon: '⛈️' },
    { id: 'WALLETS', label: 'Float Ledger Desk', icon: '💼' },
    { id: 'DISPUTES', label: 'Dispute Queue', icon: '⚖️' },
    { id: 'SWM_2026', label: 'SWM Rules 2026', icon: '🌱' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                isActive
                  ? 'bg-slate-900 text-white shadow-slate-300'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {activeTab === 'RADAR' && <DispatchRadar />}
      {activeTab === 'RATES' && <FloorRateCardManager />}
      {activeTab === 'FLOOD_DESK' && <WardSuspensionDesk />}
      {activeTab === 'WALLETS' && <WalletLedgerDesk />}
      {activeTab === 'DISPUTES' && <DisputeResolutionQueue />}
      {activeTab === 'SWM_2026' && <SwmComplianceTab />}
    </div>
  );
}
