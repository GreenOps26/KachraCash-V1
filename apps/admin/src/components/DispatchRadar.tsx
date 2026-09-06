'use client';

import React, { useState } from 'react';
import {
  CollectorRadarMarker,
  ActivePickupCoordinate,
  calculateDistanceMeters,
  evaluateSlaStatus,
  reassignBreachedTicket,
  ReassignmentResult,
} from '@/services/adminOperations';

export const DispatchRadar: React.FC = () => {
  // Live collector GPS markers across Guwahati
  const [collectors, setCollectors] = useState<CollectorRadarMarker[]>([
    {
      collectorId: 'COLL_01',
      name: 'Pranjal Saikia',
      phone: '+91 98640 11223',
      lat: 26.1340,
      lng: 91.7870,
      floatBalance: 4250.0,
      status: 'ONLINE',
      aadhaarRaw: '542198761234',
    },
    {
      collectorId: 'COLL_02',
      name: 'Biren Kalita',
      phone: '+91 94350 44556',
      lat: 26.1420,
      lng: 91.7950,
      floatBalance: 2150.0,
      status: 'ONLINE',
      aadhaarRaw: '778844339876',
    },
    {
      collectorId: 'COLL_03',
      name: 'Dhruba Bora',
      phone: '+91 97060 77889',
      lat: 26.1150, // Far away (>1.8 km)
      lng: 91.7650,
      floatBalance: 2800.0,
      status: 'IN_TRANSIT',
      aadhaarRaw: '889922114567',
    },
    {
      collectorId: 'COLL_04',
      name: 'Mridul Das',
      phone: '+91 94351 22334',
      lat: 26.1355,
      lng: 91.7885, // Close backup in Beltola
      floatBalance: 3100.0,
      status: 'ONLINE',
      aadhaarRaw: '665544332211',
    },
  ]);

  // Active pickup coordinates with distance tracking to assigned collectors
  const [pickups, setPickups] = useState<ActivePickupCoordinate[]>([
    {
      ticketId: 'TCK_BELTOLA_01',
      orderId: 'ORD_99182',
      citizenName: 'Anita Goswami',
      citizenPhone: '+91 98641 55667',
      wardId: 'WARD_BELTOLA_28',
      wardName: 'Beltola',
      wardNumber: 28,
      lat: 26.1344,
      lng: 91.7878,
      visualTier: 'SOFT_FILMS',
      scheduledSlot: '10:00 AM – 12:00 PM',
      timeToSlotMinutes: 14, // T-14 min (<= 15 min)
      assignedCollectorId: 'COLL_03', // Dhruba Bora is > 2,000m away!
      assignedCollectorName: 'Dhruba Bora',
      distanceMeters: calculateDistanceMeters(26.1150, 91.7650, 26.1344, 91.7878), // ~3.1 km
      slaStatus: 'BREACH_T15',
    },
    {
      ticketId: 'TCK_JAYANAGAR_02',
      orderId: 'ORD_99183',
      citizenName: 'Bhaskar Sharma',
      citizenPhone: '+91 94350 77881',
      wardId: 'WARD_JAYANAGAR_24',
      wardName: 'Jayanagar',
      wardNumber: 24,
      lat: 26.1415,
      lng: 91.7945,
      visualTier: 'RIGID_CONTAINERS',
      scheduledSlot: '10:00 AM – 12:00 PM',
      timeToSlotMinutes: 19, // T-19 min (<= 20 min)
      assignedCollectorId: 'COLL_02',
      assignedCollectorName: 'Biren Kalita',
      distanceMeters: calculateDistanceMeters(26.1420, 91.7950, 26.1415, 91.7945), // ~75m
      slaStatus: 'OPTIMAL',
    },
    {
      ticketId: 'TCK_GANESHGURI_03',
      orderId: 'ORD_99184',
      citizenName: 'Manab Barman',
      citizenPhone: '+91 98642 99001',
      wardId: 'WARD_GANESHGURI_29',
      wardName: 'Ganeshguri',
      wardNumber: 29,
      lat: 26.1520,
      lng: 91.7820,
      visualTier: 'MIXED_BULKY',
      scheduledSlot: '12:00 PM – 02:00 PM',
      timeToSlotMinutes: 20, // T-20 min
      assignedCollectorId: 'COLL_01',
      assignedCollectorName: 'Pranjal Saikia',
      distanceMeters: calculateDistanceMeters(26.1340, 91.7870, 26.1520, 91.7820), // ~2.0 km
      slaStatus: 'WARNING_T20',
    },
  ]);

  const [notification, setNotification] = useState<ReassignmentResult | null>(null);

  const handleReassign = (ticket: ActivePickupCoordinate) => {
    try {
      const result = reassignBreachedTicket(ticket, collectors);
      setNotification(result);

      // Update pickup state
      setPickups((prev) =>
        prev.map((p) =>
          p.ticketId === ticket.ticketId
            ? {
                ...p,
                assignedCollectorId: result.newCollectorId,
                assignedCollectorName: result.newCollectorName,
                distanceMeters: result.newDistanceMeters,
                slaStatus: evaluateSlaStatus(result.newDistanceMeters, p.timeToSlotMinutes),
                reassignedToCollectorId: result.newCollectorId,
              }
            : p,
        ),
      );

      // Update collector float penalty
      setCollectors((prev) =>
        prev.map((c) =>
          c.collectorId === ticket.assignedCollectorId
            ? { ...c, floatBalance: c.floatBalance - 150.0 }
            : c,
        ),
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      alert(message);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">
            📡 Live PostGIS Geospatial Dispatch Radar (Guwahati Grid)
          </h2>
          <p className="text-xs text-slate-500">
            Spatial indexing (SRID 4326) • Real-time collector proximity monitoring • 500m geofence SLA tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            PostGIS Stream Active
          </span>
        </div>
      </div>

      {/* SLA Alert Notification Banner */}
      {notification && (
        <div
          data-testid="reassignment-alert-banner"
          className="p-4 rounded-lg bg-red-50 border border-red-300 text-xs text-red-900 flex items-start justify-between"
        >
          <div>
            <div className="font-extrabold text-sm flex items-center gap-1.5">
              <span>⚡ SLA BREACH PENALTY & TICKET REASSIGNMENT APPLIED</span>
            </div>
            <p className="mt-1 font-medium">{notification.message}</p>
            <div className="mt-2 flex gap-4 text-[11px] font-mono">
              <span>Collector Penalty: -₹{notification.penaltyLevied.toFixed(2)}</span>
              <span>Citizen Credit Voucher: +₹{notification.citizenVoucherIssued.toFixed(2)}</span>
              <span>New Collector Distance: {notification.newDistanceMeters}m</span>
            </div>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-red-700 hover:text-red-900 font-bold px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Geospatial Radar Visualizer & Wards Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual Radar Map Canvas */}
        <div className="lg:col-span-2 bg-slate-950 rounded-xl p-5 border border-slate-800 text-white relative overflow-hidden min-h-[300px]">
          <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2 mb-4">
            <span className="font-bold text-slate-200">GUWAHATI MUNICIPAL SPATIAL RADAR (SRID 4326)</span>
            <span className="font-mono text-[11px]">Center: 26.1445° N, 91.7362° E</span>
          </div>

          {/* Map Grid Background Simulation */}
          <div className="grid grid-cols-4 gap-4 h-52 border border-slate-800/80 rounded-lg p-3 bg-slate-900/40 relative">
            {/* Beltola Zone */}
            <div className="border border-dashed border-slate-700/60 rounded p-2 text-[10px] text-slate-400">
              <span className="font-bold text-slate-300">Ward 28 (Beltola)</span>
              <div className="mt-2 text-emerald-400">📍 Active Grid</div>
            </div>
            {/* Jayanagar Zone */}
            <div className="border border-dashed border-slate-700/60 rounded p-2 text-[10px] text-slate-400">
              <span className="font-bold text-slate-300">Ward 24 (Jayanagar)</span>
              <div className="mt-2 text-emerald-400">📍 Active Grid</div>
            </div>
            {/* Ganeshguri Zone */}
            <div className="border border-dashed border-slate-700/60 rounded p-2 text-[10px] text-slate-400">
              <span className="font-bold text-slate-300">Ward 29 (Ganeshguri)</span>
              <div className="mt-2 text-amber-400">⚠️ SLA T-20</div>
            </div>
            {/* Wireless/Hatigaon Zone */}
            <div className="border border-dashed border-red-800/60 bg-red-950/20 rounded p-2 text-[10px] text-red-300">
              <span className="font-bold text-red-200">Ward 30 (Hatigaon)</span>
              <div className="mt-2 text-red-400">🌊 Flood Suspended</div>
            </div>

            {/* Visual Collector and Pickup Markers */}
            <div className="absolute inset-0 p-4 pointer-events-none flex flex-wrap items-center justify-around">
              {collectors.map((c) => (
                <div
                  key={c.collectorId}
                  className="bg-emerald-500/90 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg shadow-emerald-900/50 flex items-center gap-1"
                >
                  <span>🛵</span>
                  <span>{c.name.split(' ')[0]}</span>
                  <span className="font-mono text-[9px]">({c.collectorId})</span>
                </div>
              ))}
              {pickups.map((p) => (
                <div
                  key={p.ticketId}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1 ${
                    p.slaStatus === 'BREACH_T15'
                      ? 'bg-red-500 text-white animate-bounce'
                      : p.slaStatus === 'WARNING_T20'
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-blue-500 text-white'
                  }`}
                >
                  <span>📦</span>
                  <span>{p.wardName}</span>
                  <span className="font-mono text-[9px]">{p.distanceMeters}m</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-800">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Optimal (≤500m)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> T-20 Warning (&gt;500m)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> T-15 SLA Breach (&gt;500m)
              </span>
            </div>
            <span className="font-mono text-slate-500">PostGIS ST_DWithin Index Acceleration</span>
          </div>
        </div>

        {/* Proximity SLA Summary Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              Proximity SLA Rules Engine
            </h3>
            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <div className="font-bold text-slate-900 text-xs">Rule 1: T-20 Proximity Check</div>
                <p className="mt-1 text-slate-500">
                  If collector is outside the 500-meter radius at T-20 minutes, dispatch status flags an Amber operational warning.
                </p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-red-200 bg-red-50/40">
                <div className="font-bold text-red-900 text-xs">Rule 2: T-15 Automated SLA Breach</div>
                <p className="mt-1 text-slate-700">
                  If collector remains outside 500m at T-15 minutes, automated reassignment triggers with ₹150 penalty and ₹100 citizen credit.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 text-xs text-slate-500">
            <span>Online Qualified Collectors: </span>
            <strong className="text-slate-900">
              {collectors.filter((c) => c.floatBalance >= 2000.0).length} / {collectors.length}
            </strong>
          </div>
        </div>
      </div>

      {/* Active Pickups & SLA Breach Monitor Table */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
          Active Pickup Coordinates & SLA Proximity Monitor
        </h3>
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">Ticket / Order</th>
                <th className="p-3">Ward & Citizen</th>
                <th className="p-3">Assigned Collector</th>
                <th className="p-3">Distance (m)</th>
                <th className="p-3">Slot Countdown</th>
                <th className="p-3">SLA Status</th>
                <th className="p-3 text-right">Operations Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {pickups.map((pickup) => (
                <tr key={pickup.ticketId} className="hover:bg-slate-50/50">
                  <td className="p-3 font-mono font-bold text-slate-900">
                    <div>{pickup.ticketId}</div>
                    <div className="text-[11px] text-slate-500 font-normal">#{pickup.orderId}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-slate-900">
                      {pickup.wardName} (W{pickup.wardNumber})
                    </div>
                    <div className="text-slate-500">{pickup.citizenName}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-slate-800">{pickup.assignedCollectorName}</div>
                    <div className="text-[11px] font-mono text-slate-500">{pickup.assignedCollectorId}</div>
                  </td>
                  <td className="p-3 font-mono font-bold">
                    <span className={pickup.distanceMeters > 500 ? 'text-red-600' : 'text-emerald-600'}>
                      {pickup.distanceMeters} m
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="font-mono font-bold text-slate-900">
                      T-{pickup.timeToSlotMinutes} min
                    </span>
                  </td>
                  <td className="p-3">
                    {pickup.slaStatus === 'BREACH_T15' && (
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-extrabold bg-red-100 text-red-800 border border-red-200">
                        ⚡ RED SLA BREACH
                      </span>
                    )}
                    {pickup.slaStatus === 'WARNING_T20' && (
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        ⚠️ AMBER WARNING (T-20)
                      </span>
                    )}
                    {pickup.slaStatus === 'OPTIMAL' && (
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        ✓ OPTIMAL (≤500m)
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    {pickup.slaStatus === 'BREACH_T15' ? (
                      <button
                        onClick={() => handleReassign(pickup)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all"
                      >
                        ⚡ REASSIGN TICKET (₹150 PENALTY)
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReassign(pickup)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      >
                        Manual Reassign
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
