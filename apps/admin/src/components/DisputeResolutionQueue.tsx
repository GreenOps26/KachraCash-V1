'use client';

import React, { useState } from 'react';
import {
  Scale,
  Camera,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  X
} from 'lucide-react';
import { DisputeItem } from '@/services/adminOperations';

export const DisputeResolutionQueue: React.FC = () => {
  const [disputes, setDisputes] = useState<DisputeItem[]>([
    {
      id: 'DISPUTE_99182',
      orderId: 'ORD_99182',
      wardName: 'Beltola (Ward 28)',
      citizenName: 'Dr. Ananya Bordoloi',
      collectorName: 'Dhruba Bora',
      citizenClaim: 'Sorted Rigid PET Bottles (Floor Rate: ₹30.59/kg)',
      collectorClaim: 'Downgraded to Mixed Soft Plastics due to alleged contamination (Offered: ₹14.00/kg)',
      intakePhotoDescription: 'Clean, transparent PET beverage bottles rinsed and bundled in clear sack.',
      doorstepPhotoDescription: 'Collector photo showing 2 soiled MLPs placed near scale platform.',
      scaleTelemetryWeightKg: 14.5,
      scaleTelemetryTareStatus: true,
      escrowHoldAmount: 203.00,
      status: 'PENDING_REVIEW',
    },
    {
      id: 'DISPUTE_99185',
      orderId: 'ORD_99185',
      wardName: 'Jayanagar (Ward 24)',
      citizenName: 'Ramen Barua',
      collectorName: 'Biren Kalita',
      citizenClaim: 'Old Corrugated Cardboard (OCC) Clean & Dry (Floor Rate: ₹14.00/kg)',
      collectorClaim: 'Moisture ingress >25% due to rain runoff during storage (Offered: ₹8.50/kg)',
      intakePhotoDescription: 'Flattened clean corrugated cartons stacked indoors.',
      doorstepPhotoDescription: 'Bottom layer damp carton showing dark moisture watermarks.',
      scaleTelemetryWeightKg: 28.0,
      scaleTelemetryTareStatus: true,
      escrowHoldAmount: 392.00,
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
              ? `Arbitration Finalized: Reverted material tier to resident booking classification. Released full escrow payout of ₹${d.escrowHoldAmount.toFixed(2)} via UPI. Logged warning on collector ${d.collectorName}.`
              : `Arbitration Finalized: Contamination claim confirmed from visual inspection. Applied adjusted scrap tier subtotal and released settlement.`;

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
    <div className="bg-[#0C1915] rounded-xl border border-white/[0.08] p-5 text-[#F1F5EF] space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-[#C7FF3D]" />
            <h2 className="text-base font-display font-bold text-[#F1F5EF] tracking-tight">
              Photographic Dispute Queue & Doorstep Arbitration
            </h2>
          </div>
          <p className="text-xs text-[#DEEAE3]/60 font-mono mt-0.5">
            Side-by-side photographic evidence • BLE scale weight verification • Escrow payout settlement
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-amber-950/40 text-amber-300 border border-amber-600/40 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          {pendingCount} Pending Review
        </span>
      </div>

      {notification && (
        <div
          data-testid="arbitration-notification-banner"
          className="p-3.5 rounded-lg bg-[#1F4D3C]/40 border border-[#C7FF3D]/40 text-[#F1F5EF] flex justify-between items-center"
        >
          <div className="font-mono text-xs text-[#C7FF3D] font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#C7FF3D] shrink-0" />
            <span>{notification}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-white/60 hover:text-white p-1 ml-3"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Disputes Cards List */}
      <div className="space-y-4">
        {disputes.map((dispute) => (
          <div
            key={dispute.id}
            data-testid={`dispute-card-${dispute.id}`}
            className="border border-white/[0.08] rounded-lg p-4 bg-[#10221C] space-y-3.5"
          >
            {/* Dispute Meta Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] pb-2.5">
              <div>
                <span className="font-mono font-bold text-xs text-[#55F3CF]">
                  Dispute #{dispute.id}
                </span>
                <span className="text-[#DEEAE3]/50 text-xs ml-2 font-mono">
                  Order: #{dispute.orderId} • {dispute.wardName}
                </span>
              </div>

              <div>
                {dispute.status === 'PENDING_REVIEW' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-950/50 text-amber-300 border border-amber-600/40 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    Pending Review
                  </span>
                )}
                {dispute.status === 'AFFIRMED_RESIDENT' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#1F4D3C]/50 text-[#C7FF3D] border border-[#C7FF3D]/40 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-[#C7FF3D]" />
                    Affirmed Resident (Escrow Disbursed)
                  </span>
                )}
                {dispute.status === 'AFFIRMED_COLLECTOR' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-red-950/50 text-red-300 border border-red-700/50 flex items-center gap-1">
                    <XCircle className="w-3 h-3 text-red-400" />
                    Affirmed Collector (Downgrade Upheld)
                  </span>
                )}
              </div>
            </div>

            {/* Escrow and Telemetry Bar */}
            <div className="flex flex-wrap gap-4 text-xs font-mono bg-[#07110E] p-2.5 rounded border border-white/[0.08] text-[#DEEAE3]/70">
              <div>
                Resident: <strong className="text-[#F1F5EF] font-sans font-medium">{dispute.citizenName}</strong>
              </div>
              <div>
                Collector: <strong className="text-[#F1F5EF] font-sans font-medium">{dispute.collectorName}</strong>
              </div>
              <div>
                Escrow Hold:{' '}
                <strong className="text-[#C7FF3D] tabular-nums">₹{dispute.escrowHoldAmount.toFixed(2)}</strong>
              </div>
              <div>
                Scale Telemetry:{' '}
                <strong className="text-[#55F3CF] tabular-nums">
                  {dispute.scaleTelemetryWeightKg.toFixed(2)} kg (Zero-Tare: Verified)
                </strong>
              </div>
            </div>

            {/* Side-by-Side Photographic Inspection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Resident Intake Evidence */}
              <div className="bg-[#0C1915] p-3.5 rounded-lg border border-white/[0.08] space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-mono font-medium text-[#55F3CF] uppercase">
                    1. Resident Booking Intake Photo
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/40">
                    Intake Baseline
                  </span>
                </div>
                <div className="h-28 bg-[#07110E] rounded border border-dashed border-blue-500/20 flex flex-col items-center justify-center p-2.5 text-center">
                  <Camera className="w-5 h-5 text-blue-400 mb-1" />
                  <span className="text-xs text-[#DEEAE3]/70 font-sans leading-relaxed">
                    {dispute.intakePhotoDescription}
                  </span>
                </div>
                <div className="text-xs text-[#DEEAE3]/70 font-mono">
                  <span className="text-[#DEEAE3]/40">Claimed Tier: </span>
                  {dispute.citizenClaim}
                </div>
              </div>

              {/* Collector Doorstep Evidence */}
              <div className="bg-[#0C1915] p-3.5 rounded-lg border border-white/[0.08] space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-mono font-medium text-amber-300 uppercase">
                    2. Collector Doorstep Photo
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40">
                    Doorstep Scale
                  </span>
                </div>
                <div className="h-28 bg-[#07110E] rounded border border-dashed border-amber-500/20 flex flex-col items-center justify-center p-2.5 text-center">
                  <Camera className="w-5 h-5 text-amber-400 mb-1" />
                  <span className="text-xs text-[#DEEAE3]/70 font-sans leading-relaxed">
                    {dispute.doorstepPhotoDescription}
                  </span>
                </div>
                <div className="text-xs text-[#DEEAE3]/70 font-mono">
                  <span className="text-[#DEEAE3]/40">Doorstep Assessment: </span>
                  {dispute.collectorClaim}
                </div>
              </div>
            </div>

            {/* Arbitration Actions */}
            {dispute.status === 'PENDING_REVIEW' && (
              <div className="flex flex-col sm:flex-row gap-2.5 pt-2 border-t border-white/[0.08]">
                <button
                  data-testid={`affirm-resident-btn-${dispute.id}`}
                  onClick={() => handleResolve(dispute.id, 'AFFIRMED_RESIDENT')}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-medium text-xs py-2.5 rounded transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Affirm Resident (Disburse ₹{dispute.escrowHoldAmount.toFixed(2)} via UPI)</span>
                </button>
                <button
                  data-testid={`affirm-collector-btn-${dispute.id}`}
                  onClick={() => handleResolve(dispute.id, 'AFFIRMED_COLLECTOR')}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white font-mono font-medium text-xs py-2.5 rounded transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Affirm Collector (Downgrade to Mixed Paper ₹8.50/kg)</span>
                </button>
              </div>
            )}

            {dispute.resolutionSummary && (
              <div className="p-3 rounded bg-[#07110E] text-xs font-mono text-[#DEEAE3]/80 border border-white/[0.08] leading-relaxed">
                {dispute.resolutionSummary}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
