'use client';

import React from 'react';
import { MapPin, Users, Recycle, Wallet, AlertTriangle } from 'lucide-react';

interface OperationsHeaderProps {
  activeWardsCount?: number;
  totalWardsCount?: number;
  onDutySahaayaks?: number;
  dailyDiversionKg?: number;
  landfillSpaceSavedM3?: number;
  escrowFloatPool?: number;
  openSlaAlertsCount?: number;
}

export const OperationsHeader: React.FC<OperationsHeaderProps> = ({
  activeWardsCount = 4,
  totalWardsCount = 5,
  onDutySahaayaks = 32,
  dailyDiversionKg = 5420.5,
  landfillSpaceSavedM3 = 14.63,
  escrowFloatPool = 84250.0,
  openSlaAlertsCount = 1,
}) => {
  return (
    <header className="bg-[#0C1915] border-b border-white/[0.08] sticky top-0 z-50 backdrop-blur-md">
      {/* Top Global Command Bar */}
      <div className="max-w-[1720px] mx-auto px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Terminal Badge */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#10221C] border border-[#C7FF3D]/30 flex items-center justify-center text-[#C7FF3D]">
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-lg tracking-tight text-[#F1F5EF]">
                KachraCash
              </span>
              <span className="text-xs text-[#DEEAE3]/50 font-sans hidden sm:inline">
                কচৰা ক্যাশ
              </span>
              <span className="bg-[#10221C] text-[#C7FF3D] border border-[#C7FF3D]/30 font-mono text-[10px] font-semibold px-2 py-0.5 rounded tracking-wider uppercase">
                Operations Console
              </span>
            </div>
            <p className="text-[11px] text-[#DEEAE3]/60 font-mono">
              Guwahati Municipal Region • Kamrup Metropolitan District (SRID 4326)
            </p>
          </div>
        </div>

        {/* Live Infrastructure Health & Telemetry */}
        <div className="flex flex-wrap items-center gap-3">
          <div
            data-testid="infra-health-pill"
            className="flex items-center gap-2.5 px-3 py-1 rounded-full bg-[#10221C] border border-white/[0.08] font-mono text-xs text-[#DEEAE3]/80"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C7FF3D] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C7FF3D]"></span>
            </span>
            <span className="text-[#DEEAE3]/60">DB:</span>
            <span className="text-[#C7FF3D] font-medium">Neon Pool (4ms)</span>
            <span className="text-white/20">•</span>
            <span className="text-[#DEEAE3]/60">Payouts:</span>
            <span className="text-[#55F3CF] font-medium">99.8%</span>
          </div>

          <div className="px-2.5 py-1 rounded-full bg-[#10221C] border border-white/[0.08] text-[11px] font-mono text-[#DEEAE3]/60">
            IST <span className="text-[#DEEAE3]/80">(UTC+05:30)</span>
          </div>
        </div>
      </div>

      {/* 4-Column Municipal Metrics Grid Bar */}
      <div className="border-t border-white/[0.08] bg-[#07110E]/60 px-6 py-2.5">
        <div className="max-w-[1720px] mx-auto grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {/* Metric 1: Active Wards */}
          <div className="bg-[#10221C] border border-white/[0.08] rounded-lg p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#DEEAE3]/50">
              <span className="flex items-center gap-1.5 uppercase tracking-wider">
                <MapPin className="w-3 h-3 text-[#55F3CF]" />
                Municipal Wards
              </span>
              <span className="text-emerald-400 font-medium">4 Online</span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-xl font-bold text-[#F1F5EF] tabular-nums">
                {activeWardsCount} / {totalWardsCount}
              </span>
              <span className="text-xs text-[#DEEAE3]/60">Active Wards</span>
            </div>
            <p className="text-[11px] text-[#DEEAE3]/50 truncate font-sans">
              Beltola, Jayanagar, Ganeshguri, Noonmati (Hatigaon suspended)
            </p>
          </div>

          {/* Metric 2: On-Duty Sahaayaks */}
          <div className="bg-[#10221C] border border-white/[0.08] rounded-lg p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#DEEAE3]/50">
              <span className="flex items-center gap-1.5 uppercase tracking-wider">
                <Users className="w-3 h-3 text-[#55F3CF]" />
                Collector Network
              </span>
              <span className="text-[#55F3CF] font-medium">Synced</span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-xl font-bold text-[#55F3CF] tabular-nums">
                {onDutySahaayaks}
              </span>
              <span className="text-xs text-[#DEEAE3]/60">Collectors En-Route</span>
            </div>
            <p className="text-[11px] text-[#DEEAE3]/50 font-sans">
              PostGIS tracked • Float ≥ ₹2,000 verified
            </p>
          </div>

          {/* Metric 3: Daily Diversion */}
          <div className="bg-[#10221C] border border-white/[0.08] rounded-lg p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#DEEAE3]/50">
              <span className="flex items-center gap-1.5 uppercase tracking-wider">
                <Recycle className="w-3 h-3 text-[#C7FF3D]" />
                Landfill Diversion
              </span>
              <span className="text-[#C7FF3D] font-medium">Today</span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-xl font-bold text-[#C7FF3D] tabular-nums">
                {dailyDiversionKg.toLocaleString('en-IN')} kg
              </span>
              <span className="text-xs text-[#DEEAE3]/60">({landfillSpaceSavedM3} m³ saved)</span>
            </div>
            <p className="text-[11px] text-[#DEEAE3]/50 font-sans">
              Boragaon dumpsite capacity conserved
            </p>
          </div>

          {/* Metric 4: Escrow Float Pool & SLA Alerts */}
          <div className="bg-[#10221C] border border-white/[0.08] rounded-lg p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#DEEAE3]/50">
              <span className="flex items-center gap-1.5 uppercase tracking-wider">
                <Wallet className="w-3 h-3 text-[#C97A2B]" />
                Escrow & SLA
              </span>
              {openSlaAlertsCount > 0 ? (
                <span className="text-amber-400 font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  1 Alert
                </span>
              ) : (
                <span className="text-emerald-400 font-medium">Optimal</span>
              )}
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-xl font-bold text-[#C97A2B] tabular-nums">
                ₹{escrowFloatPool.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-[#DEEAE3]/60">Float Escrow</span>
            </div>
            <p className="text-[11px] text-[#DEEAE3]/50 font-sans">
              Pre-funded float • 1 warning active (T-20)
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
