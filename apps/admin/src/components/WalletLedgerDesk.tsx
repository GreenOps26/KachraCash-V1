'use client';

import React, { useState } from 'react';
import {
  Wallet,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Lock,
  FileSpreadsheet,
} from 'lucide-react';
import {
  getWalletStatusBadge,
  redactAadhaar,
  generateOpaqueKycToken,
  WalletLedgerAuditEntry,
} from '@/services/adminOperations';

interface CollectorWalletRow {
  collectorId: string;
  name: string;
  phone: string;
  floatBalance: number;
  aadhaarRaw: string;
  assignedWard: string;
}

export const WalletLedgerDesk: React.FC = () => {
  const [wallets] = useState<CollectorWalletRow[]>([
    {
      collectorId: 'COLL_01',
      name: 'Babul Ali',
      phone: '+91 98640 99881',
      floatBalance: 2450.0,
      aadhaarRaw: '542198761234',
      assignedWard: 'Beltola (Ward 28)',
    },
    {
      collectorId: 'COLL_02',
      name: 'Biren Kalita',
      phone: '+91 94350 44556',
      floatBalance: 1650.0, // Amber buffer (1,000 - 1,999)
      aadhaarRaw: '778844339876',
      assignedWard: 'Jayanagar (Ward 24)',
    },
    {
      collectorId: 'COLL_03',
      name: 'Dhruba Bora',
      phone: '+91 97060 77889',
      floatBalance: 850.0, // Red critical (<1,000)
      aadhaarRaw: '889922114567',
      assignedWard: 'Ganeshguri (Ward 29)',
    },
    {
      collectorId: 'COLL_04',
      name: 'Mridul Das',
      phone: '+91 94351 22334',
      floatBalance: 3200.0,
      aadhaarRaw: '665544332211',
      assignedWard: 'Noonmati (Ward 15)',
    },
    {
      collectorId: 'COLL_05',
      name: 'Pranjal Saikia',
      phone: '+91 98640 11223',
      floatBalance: 4250.0,
      aadhaarRaw: '334455667788',
      assignedWard: 'Beltola (Ward 28)',
    },
  ]);

  const [ledger] = useState<WalletLedgerAuditEntry[]>([
    {
      id: 'LEDGER_8819',
      walletId: 'WAL_COLL_01',
      collectorName: 'Babul Ali',
      amount: -219.24,
      type: 'DEBIT_ORDER_AND_FEE',
      description: 'Doorstep Settlement Payout + 8% Platform Fee',
      referenceOrderId: 'ORD_99214',
      gatewayPayoutRef: 'CF_UPI_PAY_8819024',
      idempotencyKey: 'PAYOUT_ORD_99214_1788719000',
      timestamp: '2 mins ago',
    },
    {
      id: 'LEDGER_8818',
      walletId: 'WAL_COLL_02',
      collectorName: 'Biren Kalita',
      amount: 2000.0,
      type: 'CREDIT_TOPUP',
      description: 'Mid-Route UPI Escrow Float Top-Up via RazorpayX',
      referenceOrderId: 'TOPUP_77192',
      gatewayPayoutRef: 'RZP_COL_TOPUP_99182',
      idempotencyKey: 'TOPUP_WAL_COLL_02_1788718500',
      timestamp: '14 mins ago',
    },
    {
      id: 'LEDGER_8817',
      walletId: 'WAL_COLL_03',
      collectorName: 'Dhruba Bora',
      amount: -150.0,
      type: 'PENALTY_SLA_BREACH',
      description: 'T-15 min Geofence SLA Breach (>500m at T-15 min)',
      referenceOrderId: 'ORD_99182',
      gatewayPayoutRef: 'INTERNAL_LEDGER_PENALTY',
      idempotencyKey: 'PENALTY_ORD_99182_1788718000',
      timestamp: '32 mins ago',
    },
  ]);

  return (
    <div className="bg-[#0C1915] rounded-xl border border-white/[0.08] p-5 text-[#F1F5EF] space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[#C97A2B]" />
            <h2 className="text-base font-display font-bold text-[#F1F5EF] tracking-tight">
              Collector Float Health & KYC Compliance
            </h2>
          </div>
          <p className="text-xs text-[#DEEAE3]/60 font-mono mt-0.5">
            ₹2,000 float gate enforcement • Double-entry immutable ledger • Redacted identity tokens
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-[#10221C] text-[#C97A2B] border border-[#C97A2B]/30 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#C97A2B]" />
          KYC Shield Active
        </span>
      </div>

      {/* Collector Float Wallets Table */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
          <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#DEEAE3]/60">
            Collector Float Status
          </h3>
          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span className="flex items-center gap-1.5 text-[#C7FF3D]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#059669]"></span> Green (≥₹2,000)
            </span>
            <span className="flex items-center gap-1.5 text-amber-300">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Amber (₹1,000–₹1,999)
            </span>
            <span className="flex items-center gap-1.5 text-red-400">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Red (&lt;₹1,000 / Frozen)
            </span>
          </div>
        </div>

        <div className="overflow-x-auto border border-white/[0.08] rounded-lg bg-[#10221C]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#07110E] text-[#DEEAE3]/60 font-mono border-b border-white/[0.08]">
              <tr>
                <th className="p-2.5">Collector</th>
                <th className="p-2.5">Phone & Ward</th>
                <th className="p-2.5">Government ID (Redacted)</th>
                <th className="p-2.5 font-mono">Float Balance</th>
                <th className="p-2.5">Status</th>
                <th className="p-2.5 text-right">Dispatch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {wallets.map((w) => {
                const status = getWalletStatusBadge(w.floatBalance);
                const redactedAadhaar = redactAadhaar(w.aadhaarRaw);
                const kycToken = generateOpaqueKycToken(w.collectorId);

                return (
                  <tr key={w.collectorId} className="hover:bg-white/[0.015] transition-colors">
                    <td className="p-2.5 font-mono">
                      <div className="font-medium text-[#F1F5EF]">{w.name}</div>
                      <div className="text-[10px] text-[#55F3CF]">{w.collectorId}</div>
                    </td>
                    <td className="p-2.5">
                      <div className="font-mono text-[#DEEAE3] text-[11px]">{w.phone}</div>
                      <div className="text-[10px] text-[#DEEAE3]/40">{w.assignedWard}</div>
                    </td>
                    <td className="p-2.5">
                      <div
                        data-testid={`aadhaar-redacted-${w.collectorId}`}
                        className="font-mono text-[#DEEAE3]/90 text-[11px]"
                      >
                        {redactedAadhaar}
                      </div>
                      <div
                        data-testid={`kyc-token-${w.collectorId}`}
                        className="text-[10px] text-[#55F3CF] font-mono mt-0.5"
                      >
                        {kycToken}
                      </div>
                    </td>
                    <td className="p-2.5 font-mono font-bold text-xs text-[#C7FF3D] tabular-nums">
                      ₹{w.floatBalance.toFixed(2)}
                    </td>
                    <td className="p-2.5">
                      {status === 'HEALTHY_FLOAT' && (
                        <span
                          data-testid={`wallet-status-${w.collectorId}`}
                          className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#1F4D3C]/40 text-[#C7FF3D] border border-[#C7FF3D]/30 inline-flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3 text-[#C7FF3D]" />
                          Healthy (≥₹2,000)
                        </span>
                      )}
                      {status === 'ROUTE_BUFFER' && (
                        <span
                          data-testid={`wallet-status-${w.collectorId}`}
                          className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-950/40 text-amber-300 border border-amber-600/40 inline-flex items-center gap-1"
                        >
                          <AlertCircle className="w-3 h-3 text-amber-400" />
                          Buffer (₹1k-₹2k)
                        </span>
                      )}
                      {status === 'CRITICAL_FROZEN' && (
                        <span
                          data-testid={`wallet-status-${w.collectorId}`}
                          className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-red-950/40 text-red-300 border border-red-700/50 inline-flex items-center gap-1"
                        >
                          <Lock className="w-3 h-3 text-red-400" />
                          Critical (&lt;₹1,000)
                        </span>
                      )}
                    </td>
                    <td className="p-2.5 text-right font-mono">
                      {status === 'CRITICAL_FROZEN' ? (
                        <span className="text-red-400 text-[10px] px-2 py-0.5 rounded bg-red-950/40 border border-red-800/60">
                          Frozen
                        </span>
                      ) : (
                        <span className="text-[#C7FF3D] text-[10px] px-2 py-0.5 rounded bg-[#1F4D3C]/30 border border-[#C7FF3D]/20">
                          Active
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Double-Entry wallet_ledger Immutable Audit Feed */}
      <div>
        <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#DEEAE3]/60 mb-2.5 flex items-center gap-1.5">
          <FileSpreadsheet className="w-3.5 h-3.5 text-[#55F3CF]" />
          Double-Entry Audit Stream (`wallet_ledger`)
        </h3>
        <div className="overflow-x-auto border border-white/[0.08] rounded-lg bg-[#10221C]">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#07110E] text-[#DEEAE3]/60 border-b border-white/[0.08]">
              <tr>
                <th className="p-2.5">Entry ID</th>
                <th className="p-2.5">Type</th>
                <th className="p-2.5 font-sans">Collector</th>
                <th className="p-2.5 font-sans">Description</th>
                <th className="p-2.5">Payout Ref</th>
                <th className="p-2.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {ledger.map((entry) => {
                const isNegative = entry.amount < 0;
                return (
                  <tr key={entry.id} className="hover:bg-white/[0.015] transition-colors">
                    <td className="p-2.5 font-medium text-[#55F3CF]">{entry.id}</td>
                    <td className="p-2.5">
                      {entry.type === 'DEBIT_ORDER_AND_FEE' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-950/60 text-blue-300 border border-blue-800/40">
                          Debit Order Fee
                        </span>
                      )}
                      {entry.type === 'CREDIT_TOPUP' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#1F4D3C]/40 text-[#C7FF3D] border border-[#C7FF3D]/30">
                          Credit Top-Up
                        </span>
                      )}
                      {entry.type === 'PENALTY_SLA_BREACH' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-950/60 text-red-300 border border-red-800/40">
                          SLA Penalty
                        </span>
                      )}
                    </td>
                    <td className="p-2.5 font-sans font-medium text-[#F1F5EF]">
                      {entry.collectorName}
                    </td>
                    <td className="p-2.5 font-sans">
                      <div className="font-medium text-[#F1F5EF] text-[11px]">{entry.description}</div>
                      <div className="text-[10px] font-mono text-[#DEEAE3]/40">
                        Ref: #{entry.referenceOrderId}
                      </div>
                    </td>
                    <td className="p-2.5 text-[#DEEAE3]/60 text-[11px]">{entry.gatewayPayoutRef}</td>
                    <td className="p-2.5 text-right font-bold text-xs tabular-nums">
                      <span className={isNegative ? 'text-red-400' : 'text-[#C7FF3D]'}>
                        {isNegative
                          ? `-₹${Math.abs(entry.amount).toFixed(2)}`
                          : `+₹${entry.amount.toFixed(2)}`}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
