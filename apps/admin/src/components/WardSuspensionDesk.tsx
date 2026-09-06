'use client';

import React, { useState } from 'react';
import { WardFloodStatus, INITIAL_GUWAHATI_WARDS } from '@/services/adminOperations';

export const WardSuspensionDesk: React.FC = () => {
  const [wards, setWards] = useState<WardFloodStatus[]>(INITIAL_GUWAHATI_WARDS);
  const [activeAlertMsg, setActiveAlertMsg] = useState<string | null>(null);

  const toggleSuspension = (wardId: string) => {
    setWards((prev) =>
      prev.map((ward) => {
        if (ward.id === wardId) {
          const nextState = !ward.isMonsoonSuspended;
          const affectedPickups = nextState ? Math.floor(8 + Math.random() * 12) : 0;
          const nowStr = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });

          const msg = nextState
            ? `🚨 EMERGENCY: ${ward.wardName} (Ward ${ward.wardNumber}) suspended due to flash flooding. ${affectedPickups} bookings halted; automated SMS rescheduling dispatched to residents.`
            : `✓ CLEAR: ${ward.wardName} (Ward ${ward.wardNumber}) suspension lifted. Standard pickup scheduling resumed.`;

          setActiveAlertMsg(msg);

          return {
            ...ward,
            isMonsoonSuspended: nextState,
            activeRescheduledPickups: affectedPickups,
            lastToggledAt: nowStr + ' IST',
            toggledBy: 'Admin Ops Desk (Guwahati)',
          };
        }
        return ward;
      }),
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">
            ⛈️ Monsoon Ward Suspension Operations Desk
          </h2>
          <p className="text-xs text-slate-500">
            Pragmatic Climate Directive: 1-click ward pickup suspension with automated customer SMS rescheduling.
          </p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
          Guwahati Municipal Corporation Polygons
        </span>
      </div>

      {/* Real-Time Operational Alert */}
      {activeAlertMsg && (
        <div
          data-testid="ward-toggle-notification"
          className="p-4 rounded-lg bg-amber-50 border border-amber-300 text-xs text-amber-900 flex justify-between items-center"
        >
          <div className="font-semibold">{activeAlertMsg}</div>
          <button
            onClick={() => setActiveAlertMsg(null)}
            className="text-amber-900 font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Ward Cards List */}
      <div className="divide-y divide-slate-200">
        {wards.map((ward) => (
          <div key={ward.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span className="font-extrabold text-slate-900 text-sm">
                  Ward {ward.wardNumber}: {ward.wardName}
                </span>
                {ward.isMonsoonSuspended ? (
                  <span
                    data-testid={`ward-status-badge-${ward.id}`}
                    className="px-2.5 py-0.5 rounded text-[11px] font-black bg-red-100 text-red-800 border border-red-200 flex items-center gap-1"
                  >
                    <span>🌊</span> SUSPENDED (FLASH FLOOD)
                  </span>
                ) : (
                  <span
                    data-testid={`ward-status-badge-${ward.id}`}
                    className="px-2.5 py-0.5 rounded text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1"
                  >
                    <span>✓</span> ACTIVE (LOGISTICS OPEN)
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-500">
                <span className="font-medium text-slate-700">Waterlogged Vulnerability Hotspots: </span>
                {ward.waterloggedHotspots}
              </div>

              {ward.isMonsoonSuspended ? (
                <div className="text-xs font-semibold text-red-600 flex items-center gap-1">
                  <span>📱 Automated SMS Alerts:</span>
                  <span>{ward.activeRescheduledPickups} residential pickups halted & rescheduled</span>
                  {ward.lastToggledAt && (
                    <span className="text-slate-400 font-normal">({ward.lastToggledAt})</span>
                  )}
                </div>
              ) : (
                <div className="text-xs text-slate-400">
                  Normal pickup dispatch operations. Doorstep collectors assigned via PostGIS.
                </div>
              )}
            </div>

            <div>
              <button
                data-testid={`toggle-ward-btn-${ward.id}`}
                onClick={() => toggleSuspension(ward.id)}
                className={`px-4 py-2.5 rounded-lg text-xs font-black transition-all shadow-sm flex items-center gap-1.5 ${
                  ward.isMonsoonSuspended
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {ward.isMonsoonSuspended ? (
                  <>
                    <span>✓</span> LIFT SUSPENSION (RESTORE API)
                  </>
                ) : (
                  <>
                    <span>⚠️</span> SUSPEND WARD (BLOCK BOOKINGS)
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
