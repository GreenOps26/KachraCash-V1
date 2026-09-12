'use client';

import React, { useState } from 'react';
import {
  Radar,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Clock,
  MapPin,
  Truck,
  ShieldAlert,
  X
} from 'lucide-react';
import {
  CollectorRadarMarker,
  ActivePickupCoordinate,
  calculateDistanceMeters,
  evaluateSlaStatus,
  reassignBreachedTicket,
  ReassignmentResult,
} from '@/services/adminOperations';

export const DispatchRadar: React.FC = () => {
  // Live collector GPS markers across Guwahati municipal grid
  const [collectors, setCollectors] = useState<CollectorRadarMarker[]>([
    {
      collectorId: 'COLL_01',
      name: 'Babul Ali',
      phone: '+91 98640 99881',
      lat: 26.1352,
      lng: 91.7890,
      floatBalance: 2450.0,
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
      lat: 26.1150, // Distant (>2.8 km away)
      lng: 91.7650,
      floatBalance: 2800.0,
      status: 'IN_TRANSIT',
      aadhaarRaw: '889922114567',
    },
    {
      collectorId: 'COLL_04',
      name: 'Mridul Das',
      phone: '+91 94351 22334',
      lat: 26.1358,
      lng: 91.7882, // Backup collector in Beltola ~180m away
      floatBalance: 3200.0,
      status: 'ONLINE',
      aadhaarRaw: '665544332211',
    },
    {
      collectorId: 'COLL_05',
      name: 'Pranjal Saikia',
      phone: '+91 98640 11223',
      lat: 26.1530,
      lng: 91.7830,
      floatBalance: 4250.0,
      status: 'ONLINE',
      aadhaarRaw: '334455667788',
    },
  ]);

  // Active pickup coordinates with distance tracking to assigned collectors
  const [pickups, setPickups] = useState<ActivePickupCoordinate[]>([
    {
      ticketId: 'TCK_BELTOLA_01',
      orderId: 'ORD_99182',
      citizenName: 'Dr. Ananya Bordoloi',
      citizenPhone: '+91 98641 55667',
      wardId: 'WARD_BELTOLA_28',
      wardName: 'Beltola',
      wardNumber: 28,
      lat: 26.1344,
      lng: 91.7878,
      visualTier: 'SOFT_FILMS',
      scheduledSlot: '10:00 AM – 12:00 PM',
      timeToSlotMinutes: 14, // T-14 min (SLA BREACH triggered at T-15)
      assignedCollectorId: 'COLL_03', // Dhruba Bora (>2,800m away)
      assignedCollectorName: 'Dhruba Bora',
      distanceMeters: calculateDistanceMeters(26.1150, 91.7650, 26.1344, 91.7878), // ~2,840m
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
      timeToSlotMinutes: 19,
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
      assignedCollectorId: 'COLL_05',
      assignedCollectorName: 'Pranjal Saikia',
      distanceMeters: calculateDistanceMeters(26.1340, 91.7870, 26.1520, 91.7820), // ~2,000m
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
    <div className="bg-[#0C1915] rounded-xl border border-white/[0.08] p-5 text-[#F1F5EF] space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <Radar className="w-5 h-5 text-[#C7FF3D]" />
            <h2 className="text-base font-display font-bold text-[#F1F5EF] tracking-tight">
              PostGIS Geospatial Dispatch Radar
            </h2>
          </div>
          <p className="text-xs text-[#DEEAE3]/60 font-mono mt-0.5">
            Real-time proximity monitoring • ST_DistanceSphere (SRID 4326) • 500m geofence SLA
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-mono bg-[#10221C] text-[#55F3CF] border border-[#55F3CF]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C7FF3D] animate-pulse"></span>
            PostGIS Live Stream
          </span>
        </div>
      </div>

      {/* SLA Alert Notification Banner */}
      {notification && (
        <div
          data-testid="reassignment-alert-banner"
          className="p-4 rounded-lg bg-red-950/30 border border-red-500/50 text-[#F1F5EF] flex items-start justify-between"
        >
          <div>
            <div className="font-mono font-semibold text-xs flex items-center gap-2 text-red-400">
              <ShieldAlert className="w-4 h-4" />
              <span>SLA Breach Reassignment Executed</span>
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800/60 font-mono">
                {notification.ticketId}
              </span>
            </div>
            <p className="mt-1 text-xs text-[#DEEAE3]/80 font-sans leading-relaxed">
              {notification.message}
            </p>
            <div className="mt-2.5 flex flex-wrap gap-3 text-xs font-mono">
              <span className="px-2 py-0.5 rounded bg-[#10221C] text-red-400 border border-red-500/20">
                Penalty: -₹{notification.penaltyLevied.toFixed(2)}
              </span>
              <span className="px-2 py-0.5 rounded bg-[#10221C] text-[#C7FF3D] border border-[#C7FF3D]/20">
                Voucher: +₹{notification.citizenVoucherIssued.toFixed(2)}
              </span>
              <span className="px-2 py-0.5 rounded bg-[#10221C] text-[#55F3CF] border border-[#55F3CF]/20">
                New Distance: {notification.newDistanceMeters}m
              </span>
            </div>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-white/40 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Geospatial Radar Canvas & Rules Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Interactive Vector Map Canvas (8 Cols) */}
        <div className="lg:col-span-8 bg-[#07110E] rounded-lg p-4 border border-white/[0.08] relative overflow-hidden flex flex-col justify-between min-h-[350px]">
          {/* Map Top Metadata Bar */}
          <div className="flex items-center justify-between text-xs text-[#DEEAE3]/60 border-b border-white/[0.08] pb-2.5 mb-3">
            <span className="font-mono font-medium text-[#C7FF3D] text-[11px]">
              GUWAHATI MUNICIPAL SPATIAL GRID
            </span>
            <span className="font-mono text-[10px] text-[#DEEAE3]/40">
              Center: 26.1445° N, 91.7362° E
            </span>
          </div>

          {/* Interactive Vector Map Canvas with Ward Boundaries */}
          <div className="relative w-full h-64 rounded-lg border border-white/[0.08] bg-[#0C1915]/80 overflow-hidden">
            {/* SVG Municipal Polygons */}
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 600 280"
              preserveAspectRatio="none"
            >
              <defs>
                <pattern
                  id="hazardStripes"
                  width="10"
                  height="10"
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(45)"
                >
                  <line x1="0" y1="0" x2="0" y2="10" stroke="#9C3B2A" strokeWidth="3" />
                  <line x1="5" y1="0" x2="5" y2="10" stroke="#160807" strokeWidth="3" />
                </pattern>
              </defs>

              {/* Background Coordinate Grid */}
              <line x1="0" y1="140" x2="600" y2="140" stroke="#1F4D3C" strokeWidth="0.5" strokeDasharray="4,4" opacity="0.4" />
              <line x1="300" y1="0" x2="300" y2="280" stroke="#1F4D3C" strokeWidth="0.5" strokeDasharray="4,4" opacity="0.4" />

              {/* Range Rings */}
              <circle cx="300" cy="140" r="110" fill="none" stroke="#1F4D3C" strokeWidth="1" strokeDasharray="3,3" opacity="0.5" />
              <circle cx="300" cy="140" r="60" fill="none" stroke="#1F4D3C" strokeWidth="1" strokeDasharray="3,3" opacity="0.5" />

              {/* Ward Polygons */}
              {/* Ward 15: Noonmati (Top Right) */}
              <polygon
                points="390,20 570,30 550,110 370,95"
                fill="#10221C"
                stroke="#1F4D3C"
                strokeWidth="1.2"
                className="hover:fill-[#1F4D3C]/30 transition-colors"
              />
              <text x="440" y="65" fill="#DEEAE3" fontSize="10" fontFamily="JetBrains Mono" opacity="0.8">
                Ward 15 Noonmati
              </text>

              {/* Ward 29: Ganeshguri (Center Top) */}
              <polygon
                points="210,25 380,25 360,115 190,110"
                fill="#10221C"
                stroke="#C97A2B"
                strokeWidth="1.2"
                strokeDasharray="2,2"
                className="hover:fill-[#1F4D3C]/30 transition-colors"
              />
              <text x="245" y="70" fill="#DEEAE3" fontSize="10" fontFamily="JetBrains Mono" opacity="0.8">
                Ward 29 Ganeshguri
              </text>

              {/* Ward 24: Jayanagar (Center East) */}
              <polygon
                points="360,120 540,115 520,200 340,195"
                fill="#10221C"
                stroke="#1F4D3C"
                strokeWidth="1.2"
                className="hover:fill-[#1F4D3C]/30 transition-colors"
              />
              <text x="410" y="160" fill="#DEEAE3" fontSize="10" fontFamily="JetBrains Mono" opacity="0.8">
                Ward 24 Jayanagar
              </text>

              {/* Ward 28: Beltola (Center South) */}
              <polygon
                points="180,125 350,120 330,260 160,250"
                fill="#10221C"
                stroke="#C7FF3D"
                strokeWidth="1.2"
                className="hover:fill-[#1F4D3C]/30 transition-colors"
              />
              <text x="215" y="185" fill="#C7FF3D" fontSize="10" fontFamily="JetBrains Mono" fontWeight="600">
                Ward 28 Beltola
              </text>

              {/* Ward 30: Wireless / Hatigaon (Hazard Stripes Suspended) */}
              <polygon
                points="20,130 170,125 150,265 10,255"
                fill="url(#hazardStripes)"
                stroke="#DC2626"
                strokeWidth="1.5"
                opacity="0.85"
              />
              <text x="25" y="185" fill="#F87171" fontSize="10" fontFamily="JetBrains Mono" fontWeight="600">
                Ward 30 (Suspended)
              </text>
            </svg>

            {/* Visual Markers Layer */}
            <div className="absolute inset-0 p-4 pointer-events-none">
              {/* Collector Markers */}
              {collectors.map((c) => {
                const isBeltola = c.collectorId === 'COLL_01' || c.collectorId === 'COLL_04';
                const isJayanagar = c.collectorId === 'COLL_02';
                const isNoonmati = c.collectorId === 'COLL_05';
                const isDistant = c.collectorId === 'COLL_03';

                let top = '50%';
                let left = '50%';
                if (isBeltola && c.collectorId === 'COLL_01') {
                  top = '68%';
                  left = '45%';
                } else if (isBeltola && c.collectorId === 'COLL_04') {
                  top = '62%';
                  left = '42%';
                } else if (isJayanagar) {
                  top = '52%';
                  left = '70%';
                } else if (isNoonmati) {
                  top = '22%';
                  left = '75%';
                } else if (isDistant) {
                  top = '82%';
                  left = '12%';
                }

                return (
                  <div
                    key={c.collectorId}
                    style={{ top, left }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-[#10221C]/95 border border-[#C7FF3D]/40 px-2 py-0.5 rounded-full shadow-lg pointer-events-auto"
                  >
                    <Truck className="w-3 h-3 text-[#C7FF3D]" />
                    <div className="text-[10px] font-mono leading-tight">
                      <span className="text-[#F1F5EF] font-medium">{c.name}</span>
                      <span className="text-[#C7FF3D] ml-1 font-semibold">
                        ₹{c.floatBalance.toFixed(0)}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Pickup Nodes */}
              {pickups.map((p) => {
                let top = '64%';
                let left = '48%';
                if (p.ticketId === 'TCK_JAYANAGAR_02') {
                  top = '54%';
                  left = '72%';
                } else if (p.ticketId === 'TCK_GANESHGURI_03') {
                  top = '28%';
                  left = '48%';
                }

                const isBreach = p.slaStatus === 'BREACH_T15';
                const isWarning = p.slaStatus === 'WARNING_T20';

                return (
                  <div
                    key={p.ticketId}
                    style={{ top, left }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
                  >
                    <div className="relative flex items-center justify-center">
                      <span
                        className={`animate-ping absolute inline-flex h-6 w-6 rounded-full opacity-70 ${
                          isBreach
                            ? 'bg-red-500'
                            : isWarning
                              ? 'bg-amber-400'
                              : 'bg-[#55F3CF]'
                        }`}
                      ></span>
                      <div
                        className={`relative z-10 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold shadow-md flex items-center gap-1 ${
                          isBreach
                            ? 'bg-red-950 text-red-300 border border-red-700'
                            : isWarning
                              ? 'bg-amber-950 text-amber-300 border border-amber-600'
                              : 'bg-[#1F4D3C] text-[#55F3CF] border border-[#55F3CF]/30'
                        }`}
                      >
                        <MapPin className="w-2.5 h-2.5" />
                        <span>{p.wardName}</span>
                        <span className="opacity-70">({p.distanceMeters}m)</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Map Footer Legend */}
          <div className="mt-3 flex flex-wrap items-center justify-between text-[11px] text-[#DEEAE3]/60 pt-2.5 border-t border-white/[0.08] gap-2">
            <div className="flex items-center gap-3 font-mono text-[10px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#059669]"></span> Optimal (≤500m)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#D97706]"></span> Warning (T-20)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#DC2626]"></span> Breach (T-15)
              </span>
            </div>
            <span className="font-mono text-[#DEEAE3]/40 text-[10px]">
              PostGIS ST_DWithin Acceleration
            </span>
          </div>
        </div>

        {/* Proximity SLA Rules Engine Card (4 Cols) */}
        <div className="lg:col-span-4 bg-[#10221C] border border-white/[0.08] rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[#DEEAE3]/60 mb-3 border-b border-white/[0.08] pb-2">
              <span className="font-semibold text-[#C7FF3D]">Proximity SLA Protocol</span>
              <span className="text-[#55F3CF]">500m Geofence</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#0C1915] rounded-lg border border-white/[0.08]">
                <div className="flex items-center justify-between text-[#C97A2B] font-mono font-medium text-xs">
                  <span>T-20 Proximity Warning</span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-950/50 text-amber-300 border border-amber-700/40 text-[10px]">
                    &gt; 500m
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#DEEAE3]/70 font-sans leading-relaxed">
                  Collector &gt;500m from pickup node at T-20 minutes triggers an operational Amber warning state.
                </p>
              </div>

              <div className="p-3 bg-red-950/20 rounded-lg border border-red-500/30">
                <div className="flex items-center justify-between text-red-400 font-mono font-medium text-xs">
                  <span>T-15 Automated Breach</span>
                  <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 text-[10px]">
                    ST_DistanceSphere
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#DEEAE3]/70 font-sans leading-relaxed">
                  Collector &gt;500m at T-15 triggers automated reassignment to nearest qualified collector (≥₹2,000 float), ₹150 collector penalty, and ₹100 resident voucher.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.08] text-xs text-[#DEEAE3]/60 flex items-center justify-between font-mono">
            <span>Qualified Collectors:</span>
            <span className="text-[#C7FF3D] font-semibold">
              {collectors.filter((c) => c.floatBalance >= 2000.0).length} / {collectors.length}
            </span>
          </div>
        </div>
      </div>

      {/* Active Pickups & SLA Breach Monitor Table */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#DEEAE3]/60">
            Active Pickup Coordinates & SLA Proximity Monitor
          </h3>
          <span className="text-[11px] font-mono text-[#55F3CF]">
            {pickups.length} Coordinates Monitored
          </span>
        </div>

        <div className="overflow-x-auto border border-white/[0.08] rounded-lg bg-[#10221C]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#07110E] text-[#DEEAE3]/60 font-mono border-b border-white/[0.08]">
              <tr>
                <th className="p-2.5">Ticket</th>
                <th className="p-2.5">Ward & Citizen</th>
                <th className="p-2.5">Collector</th>
                <th className="p-2.5 font-mono">Distance</th>
                <th className="p-2.5 font-mono">Countdown</th>
                <th className="p-2.5">Status</th>
                <th className="p-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {pickups.map((pickup) => (
                <tr key={pickup.ticketId} className="hover:bg-white/[0.015] transition-colors">
                  <td className="p-2.5 font-mono">
                    <div className="font-semibold text-[#F1F5EF]">{pickup.ticketId}</div>
                    <div className="text-[10px] text-[#DEEAE3]/40">#{pickup.orderId}</div>
                  </td>
                  <td className="p-2.5">
                    <div className="font-medium text-[#F1F5EF]">
                      {pickup.wardName} (W{pickup.wardNumber})
                    </div>
                    <div className="text-[11px] text-[#DEEAE3]/50 font-sans">{pickup.citizenName}</div>
                  </td>
                  <td className="p-2.5">
                    <div className="font-medium text-[#DEEAE3]">{pickup.assignedCollectorName}</div>
                    <div className="text-[10px] font-mono text-[#DEEAE3]/40">{pickup.assignedCollectorId}</div>
                  </td>
                  <td className="p-2.5 font-mono font-medium">
                    <span
                      className={
                        pickup.distanceMeters > 500
                          ? 'text-red-400'
                          : 'text-[#C7FF3D]'
                      }
                    >
                      {pickup.distanceMeters} m
                    </span>
                  </td>
                  <td className="p-2.5 font-mono text-[#F1F5EF]">
                    T-{pickup.timeToSlotMinutes} min
                  </td>
                  <td className="p-2.5">
                    {pickup.slaStatus === 'BREACH_T15' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-red-950 text-red-300 border border-red-700/50 inline-flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-red-400" />
                        SLA Breach (T-15)
                      </span>
                    )}
                    {pickup.slaStatus === 'WARNING_T20' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-950 text-amber-300 border border-amber-700/50 inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        Warning (T-20)
                      </span>
                    )}
                    {pickup.slaStatus === 'OPTIMAL' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#1F4D3C]/40 text-[#C7FF3D] border border-[#C7FF3D]/30 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-[#C7FF3D]" />
                        Optimal (≤500m)
                      </span>
                    )}
                  </td>
                  <td className="p-2.5 text-right">
                    {pickup.slaStatus === 'BREACH_T15' ? (
                      <button
                        onClick={() => handleReassign(pickup)}
                        className="bg-red-600 hover:bg-red-500 text-white font-mono font-semibold px-3 py-1.5 rounded text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Reassign (180m • ₹150)
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReassign(pickup)}
                        className="bg-[#10221C] hover:bg-[#1F4D3C]/40 text-[#DEEAE3] border border-white/[0.08] font-mono px-2.5 py-1 rounded text-xs transition-colors cursor-pointer"
                      >
                        Reassign
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
