'use client';

import React, { useState } from 'react';
import { DisputeItem } from '@/services/adminOperations';

export const DisputeResolutionQueue: React.FC = () => {
  const [disputes, setDisputes] = useState<DisputeItem[]>([
    {
      id: 'DISPUTE_99182',
      orderId: 'ORD_99182',
      wardName: 'Beltola (Ward 28)',
      citizenName: 'Anita Goswami',
      collectorName: 'Dhruba Bora',
      citizenClaim: 'Sorted Rigid PET Bottles (Floor Rate: ₹30.59/kg)',
      collectorClaim: 'Downgraded to Mixed Soft Plastics due to alleged contamination (Offered: ₹14.00/kg)',
      intakePhotoDescription: 'Clean, transparent PET beverage bottles rinsed and bundled in clear sack.',
      doorstepPhotoDescription: 'Collector photo showing 2 soiled MLPs placed near scale platform.',
      scaleTelemetryWeightKg: 14.5,
      scaleTelemetryTareStatus: true,
      escrowHoldAmount: 408.11, // Escrow hold for 14.5 kg at ₹30.59 - 8% fee
      status: 'PENDING_REVIEW',
    },
    {
      id: 'DISPUTE_99185',
      orderId: 'ORD_99185',
      wardName: 'Jayanagar (Ward 24)',
      citizenName: 'Ramen Barua',
      collectorName: 'Pranjal Saikia',
      citizenClaim: 'Old Corrugated Cardboard (OCC) Clean & Dry (Floor Rate: ₹14.00/kg)',
      collectorClaim: 'Moisture ingress >25% due to rain runoff during storage (Offered: ₹8.00/kg)',
      intakePhotoDescription: 'Flattened clean corrugated cartons stacked indoors.',
      doorstepPhotoDescription: 'Bottom layer damp carton showing dark moisture watermarks.',
      scaleTelemetryWeightKg: 28.0,
      scaleTelemetryTareStatus: true,
      escrowHoldAmount: 360.64,
      status: 'PENDING_REVIEW',
    },
  ]);

  const [notification, setNotification] = useState<string | null>(null);

  const handleResolve = (
    disputeId: string,
    action: 'AFFIRMED_RESIDENT' | 'AFFIRMED_COLLECTOR',
  ) => {
    setDisputes((prev) =>
      prev.map((d) => {
        if (d.id === disputeId) {
          const summary =
            action === 'AFFIRMED_RESIDENT'
              ? `Arbitration Complete: Reverted material grade to resident booking tier. Full escrow payout of ₹${d.escrowHoldAmount.toFixed(2)} unlocked to resident UPI. Disciplinary strike logged against collector ${d.collectorName}.`
              : `Arbitration Complete: Collector contamination claim upheld based on visual telemetry. Adjusted line-item subtotal applied and settlement released.`;

          setNotification(summary);
          return {
            ...d,
            status: action,
            resolutionSummary: summary,
          };
        }
        return d;
      }),
    );
  };

  const pendingCount = disputes.filter((d) => d.status === 'PENDING_REVIEW').length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">
            ⚖️ Photographic Dispute Resolution & Arbitration Desk
          </h2>
          <p className="text-xs text-slate-500">
            Side-by-side photographic evidence • BLE scale telemetry audit • Customer escrow payout protection
          </p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          {pendingCount} Pending Arbitration
        </span>
      </div>

      {notification && (
        <div
          data-testid="arbitration-notification-banner"
          className="p-4 rounded-lg bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 flex justify-between items-center"
        >
          <div className="font-semibold">{notification}</div>
          <button onClick={() => setNotification(null)} className="text-emerald-900 font-bold ml-4">
            ✕
          </button>
        </div>
      )}

      {/* Disputes Cards List */}
      <div className="space-y-6">
        {disputes.map((dispute) => (
          <div
            key={dispute.id}
            data-testid={`dispute-card-${dispute.id}`}
            className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-4"
          >
            {/* Dispute Meta Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <span className="font-mono font-extrabold text-sm text-slate-900">
                  Dispute #{dispute.id}
                </span>
                <span className="text-slate-500 text-xs ml-2 font-normal">
                  Order: #{dispute.orderId} • {dispute.wardName}
                </span>
              </div>

              <div>
                {dispute.status === 'PENDING_REVIEW' && (
                  <span className="px-2.5 py-1 rounded-md text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                    ⚠️ PENDING ARBITRATION
                  </span>
                )}
                {dispute.status === 'AFFIRMED_RESIDENT' && (
                  <span className="px-2.5 py-1 rounded-md text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    ✓ AFFIRMED RESIDENT (ESCROW UNLOCKED)
                  </span>
                )}
                {dispute.status === 'AFFIRMED_COLLECTOR' && (
                  <span className="px-2.5 py-1 rounded-md text-xs font-extrabold bg-slate-200 text-slate-800">
                    ✕ AFFIRMED COLLECTOR (CONTAMINATION UPHELD)
                  </span>
                )}
              </div>
            </div>

            {/* Escrow and Telemetry Bar */}
            <div className="flex flex-wrap gap-4 text-xs font-mono bg-white p-3 rounded-lg border border-slate-200 text-slate-700">
              <div>
                Resident: <strong className="text-slate-900 font-sans">{dispute.citizenName}</strong>
              </div>
              <div>
                Collector: <strong className="text-slate-900 font-sans">{dispute.collectorName}</strong>
              </div>
              <div>
                Pre-Funded Escrow Hold:{' '}
                <strong className="text-emerald-700">₹{dispute.escrowHoldAmount.toFixed(2)}</strong>
              </div>
              <div>
                Scale Telemetry:{' '}
                <strong className="text-slate-900">
                  {dispute.scaleTelemetryWeightKg.toFixed(2)} kg (Zero-Tare: Verified)
                </strong>
              </div>
            </div>

            {/* Side-by-Side Photographic Inspection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Resident Intake Evidence */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-extrabold text-blue-700 uppercase">
                    1. Customer Booking Intake Photo & Claim
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800">
                    Initial Booking Baseline
                  </span>
                </div>
                <div className="h-32 bg-blue-50/40 rounded-lg border border-dashed border-blue-200 flex flex-col items-center justify-center p-3 text-center">
                  <span className="text-2xl mb-1">📸</span>
                  <span className="text-xs text-slate-700 font-medium">
                    {dispute.intakePhotoDescription}
                  </span>
                </div>
                <div className="text-xs text-slate-700">
                  <span className="font-bold">Claimed Tier: </span>
                  {dispute.citizenClaim}
                </div>
              </div>

              {/* Collector Doorstep Evidence */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-extrabold text-amber-700 uppercase">
                    2. Collector Doorstep Weighment Photo & Claim
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800">
                    Doorstep Scale Telemetry
                  </span>
                </div>
                <div className="h-32 bg-amber-50/40 rounded-lg border border-dashed border-amber-200 flex flex-col items-center justify-center p-3 text-center">
                  <span className="text-2xl mb-1">📷</span>
                  <span className="text-xs text-slate-700 font-medium">
                    {dispute.doorstepPhotoDescription}
                  </span>
                </div>
                <div className="text-xs text-slate-700">
                  <span className="font-bold">Claimed Downgrade: </span>
                  {dispute.collectorClaim}
                </div>
              </div>
            </div>

            {/* Arbitration Actions */}
            {dispute.status === 'PENDING_REVIEW' && (
              <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-slate-200">
                <button
                  data-testid={`affirm-resident-btn-${dispute.id}`}
                  onClick={() => handleResolve(dispute.id, 'AFFIRMED_RESIDENT')}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-3 rounded-lg shadow-sm transition-all"
                >
                  ✓ AFFIRM RESIDENT (UNLOCK ESCROW & LOG WARNING)
                </button>
                <button
                  data-testid={`affirm-collector-btn-${dispute.id}`}
                  onClick={() => handleResolve(dispute.id, 'AFFIRMED_COLLECTOR')}
                  className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-black text-xs py-3 rounded-lg shadow-sm transition-all"
                >
                  ✕ AFFIRM COLLECTOR (UPHOLD CONTAMINATION DOWNGRADE)
                </button>
              </div>
            )}

            {dispute.resolutionSummary && (
              <div className="p-3 rounded-lg bg-slate-100 text-xs font-medium text-slate-700 border border-slate-200">
                {dispute.resolutionSummary}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
