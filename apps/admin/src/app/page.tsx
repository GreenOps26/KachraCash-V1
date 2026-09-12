'use client';

import React, { useState } from 'react';
import {
  LayoutGrid,
  Radar,
  TrendingUp,
  CloudRain,
  Wallet,
  Scale,
  Leaf,
} from 'lucide-react';
import { DispatchRadar } from '@/components/DispatchRadar';
import { FloorRateCardManager } from '@/components/FloorRateCardManager';
import { WardSuspensionDesk } from '@/components/WardSuspensionDesk';
import { WalletLedgerDesk } from '@/components/WalletLedgerDesk';
import { DisputeResolutionQueue } from '@/components/DisputeResolutionQueue';
import { SwmComplianceTab } from '@/components/SwmComplianceTab';

type Tab =
  | 'COMMAND_GRID'
  | 'RADAR'
  | 'RATES'
  | 'FLOOD_DESK'
  | 'WALLETS'
  | 'DISPUTES'
  | 'SWM_2026';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('COMMAND_GRID');

  const tabs: Array<{ id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'COMMAND_GRID', label: 'Command Grid (Radar 60% / Rates 40%)', icon: LayoutGrid },
    { id: 'RADAR', label: 'Dispatch Radar', icon: Radar },
    { id: 'RATES', label: 'Floor Rate Cards', icon: TrendingUp },
    { id: 'FLOOD_DESK', label: 'Monsoon Ward Desk', icon: CloudRain },
    { id: 'WALLETS', label: 'Float & KYC Desk', icon: Wallet },
    { id: 'DISPUTES', label: 'Dispute Queue', icon: Scale },
    { id: 'SWM_2026', label: 'SWM Rules 2026', icon: Leaf },
  ];

  return (
    <div className="space-y-5">
      {/* Top Operations Command Navigation Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.08] pb-3.5">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const IconComponent = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#1F4D3C]/60 text-[#C7FF3D] border border-[#C7FF3D]/40 font-semibold shadow-sm'
                  : 'bg-[#10221C] text-[#DEEAE3]/70 hover:text-[#F1F5EF] hover:bg-[#10221C]/80 border border-white/[0.08]'
              }`}
            >
              <IconComponent className={`w-3.5 h-3.5 ${isActive ? 'text-[#C7FF3D]' : 'text-[#DEEAE3]/60'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Primary Operations View: 60% Dispatch Radar / 40% Floor Rate Desk on 1440px+ */}
      {activeTab === 'COMMAND_GRID' && (
        <div className="flex flex-col xl:flex-row gap-5 items-start">
          <div className="w-full xl:w-[60%] space-y-5">
            <DispatchRadar />
          </div>
          <div className="w-full xl:w-[40%] space-y-5">
            <FloorRateCardManager />
          </div>
        </div>
      )}

      {/* Standalone Focus Views */}
      {activeTab === 'RADAR' && <DispatchRadar />}
      {activeTab === 'RATES' && <FloorRateCardManager />}
      {activeTab === 'FLOOD_DESK' && <WardSuspensionDesk />}
      {activeTab === 'WALLETS' && <WalletLedgerDesk />}
      {activeTab === 'DISPUTES' && <DisputeResolutionQueue />}
      {activeTab === 'SWM_2026' && <SwmComplianceTab />}
    </div>
  );
}
