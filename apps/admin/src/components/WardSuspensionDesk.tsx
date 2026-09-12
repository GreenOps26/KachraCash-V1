'use client';

import React, { useState } from 'react';
import {
  CloudRain,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  X
} from 'lucide-react';
import { WardFloodStatus, INITIAL_GUWAHATI_WARDS } from '@/services/adminOperations';

export const WardSuspensionDesk: React.FC = () => {
  const [wards, setWards] = useState<WardFloodStatus[]>(INITIAL_GUWAHATI_WARDS);
  const [activeAlertMsg, setActiveAlertMsg] = useState<string | null>(null);

  const toggleSuspension = (wardId: string) => {
    setWards((prev) =>
      prev.map((ward) => {
        if (ward.id === wardId) {
          const nextState = !ward.isMonsoonSuspended;
          const affectedPickups = nextState ? Math.floor(10 + Math.random() * 8) : 0;
          const nowStr = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });

          const msg = nextState
            ? `Emergency Hold: ${ward.wardName} (Ward ${ward.wardNumber}) suspended due to street waterlogging. ${affectedPickups} bookings halted; automated SMS rescheduling dispatched.`
            : `Suspension Lifted: ${ward.wardName} (Ward ${ward.wardNumber}) restored. Standard pickup scheduling resumed.`;

          setActiveAlertMsg(msg);

          return {
            ...ward,
            isMonsoonSuspended: nextState,
            activeRescheduledPickups: affectedPickups,
            lastToggledAt: nowStr + ' IST',
            toggledBy: 'Admin Ops Desk',
          };
        }
        return ward;
      }),
    );
  };

  const suspendedCount = wards.filter((w) => w.isMonsoonSuspended).length;

  return (
    <div className="bg-[#0C1915] rounded-xl border border-white/[0.08] p-5 text-[#F1F5EF] space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <CloudRain className="w-5 h-5 text-[#55F3CF]" />
            <h2 className="text-base font-display font-bold text-[#F1F5EF] tracking-tight">
              Monsoon Flood Emergency Board
            </h2>
          </div>
          <p className="text-xs text-[#DEEAE3]/60 font-mono mt-0.5">
            Ward-level intake suspension • Automated SMS rescheduling • PostGIS polygon controls
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-[#10221C] text-[#55F3CF] border border-[#55F3CF]/20">
            {suspendedCount} / {wards.length} Wards Suspended
          </span>
        </div>
      </div>

      {/* Real-Time Operational Alert Banner */}
      {activeAlertMsg && (
        <div
          data-testid="ward-toggle-notification"
          className="p-3.5 rounded-lg bg-amber-950/30 border border-amber-500/50 text-[#F1F5EF] flex justify-between items-center"
        >
          <div className="font-mono text-xs text-amber-200 leading-relaxed font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{activeAlertMsg}</span>
          </div>
          <button
            onClick={() => setActiveAlertMsg(null)}
            className="text-amber-300 hover:text-amber-100 p-1 ml-3"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Grid of 5 Guwahati Ward Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {wards.map((ward) => {
          const isSuspended = ward.isMonsoonSuspended;

          return (
            <div
              key={ward.id}
              className={`rounded-lg border p-4 flex flex-col justify-between transition-all relative overflow-hidden ${
                isSuspended
                  ? 'border-red-500/50 bg-[#160908]'
                  : 'border-white/[0.08] bg-[#10221C] hover:border-white/20'
              }`}
            >
              {/* Subtle hazard stripes accent for suspended cards */}
              {isSuspended && (
                <div
                  className="absolute inset-0 opacity-10 pointer-events-none"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(45deg, #DC2626, #DC2626 8px, transparent 8px, transparent 16px)',
                  }}
                />
              )}

              <div className="space-y-2.5 relative z-10">
                {/* Ward Title & Status Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-[#DEEAE3]/40 uppercase tracking-wider block">
                      WARD {ward.wardNumber}
                    </span>
                    <h3 className="font-display font-bold text-sm text-[#F1F5EF] mt-0.5">
                      {ward.wardName}
                    </h3>
                  </div>

                  {isSuspended ? (
                    <span
                      data-testid={`ward-status-badge-${ward.id}`}
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-red-950 text-red-300 border border-red-700/50 flex items-center gap-1"
                    >
                      <ShieldAlert className="w-3 h-3 text-red-400" />
                      Suspended
                    </span>
                  ) : (
                    <span
                      data-testid={`ward-status-badge-${ward.id}`}
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#1F4D3C]/40 text-[#C7FF3D] border border-[#C7FF3D]/30 flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3 text-[#C7FF3D]" />
                      Active
                    </span>
                  )}
                </div>

                {/* Hotspots */}
                <div className="text-xs text-[#DEEAE3]/70 font-sans">
                  <span className="font-mono text-[#DEEAE3]/40 block text-[10px] uppercase">
                    Vulnerability Hotspots:
                  </span>
                  <p className="mt-0.5 text-[11px] leading-relaxed">{ward.waterloggedHotspots}</p>
                </div>

                {/* Status Specific Information */}
                {isSuspended ? (
                  <div className="space-y-1.5 pt-2 border-t border-red-500/20">
                    <div className="p-2 rounded bg-red-950/40 border border-red-500/30 text-[11px] font-mono text-red-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <span>Waterlogging &gt; 0.5m • Logistics Frozen</span>
                    </div>

                    <div className="text-[11px] font-mono text-red-400 flex items-center gap-1.5">
                      <MessageSquare className="w-3 h-3 shrink-0" />
                      <span>
                        {ward.activeRescheduledPickups} pickups rescheduled via SMS
                      </span>
                    </div>

                    {ward.lastToggledAt && (
                      <div className="text-[10px] font-mono text-[#DEEAE3]/40">
                        Hold set at {ward.lastToggledAt}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="pt-2 border-t border-white/[0.04] text-[11px] text-[#DEEAE3]/50 font-sans">
                    Standard operations active. PostGIS spatial matching enabled for citizen bookings.
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-3 mt-3 border-t border-white/[0.08] relative z-10">
                <button
                  data-testid={`toggle-ward-btn-${ward.id}`}
                  onClick={() => toggleSuspension(ward.id)}
                  className={`w-full py-2 rounded text-xs font-mono font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    isSuspended
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-red-600 hover:bg-red-500 text-white'
                  }`}
                >
                  {isSuspended ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Lift Suspension (Restore Bookings)</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Suspend Ward (Hold Intake)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
