'use client';

import React, { useState } from 'react';
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
      name: 'Pranjal Saikia',
      phone: '+91 98640 11223',
      floatBalance: 4250.0,
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
      floatBalance: 3100.0,
      aadhaarRaw: '665544332211',
      assignedWard: 'Noonmati (Ward 15)',
    },
  ]);

  const [ledger] = useState<WalletLedgerAuditEntry[]>([
    {
      id: 'LEDGER_8819',
      walletId: 'WAL_COLL_01',
      collectorName: 'Pranjal Saikia',
      amount: -219.24, // Gross payout + take-rate debit
      type: 'DEBIT_ORDER_AND_FEE',
      description: 'Doorstep Settlement Payout + 8% Take-Rate',
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
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">
            💼 Collector Float Ledger & Pre-Funded Escrow Desk
          </h2>
          <p className="text-xs text-slate-500">
            Pre-funded float enforcement • Immutable double-entry audit stream • Redacted KYC & Aadhaar compliance
          </p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#F4E3CD] text-[#C97A2B] border border-[#C97A2B]/40">
          🌼 BANYAN & MARIGOLD AUDIT ENFORCED
        </span>
      </div>

      {/* Collector Float Wallets Table */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Onboarded Collector Float Wallets
          </h3>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 font-semibold text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Green (≥₹2,000)
            </span>
            <span className="flex items-center gap-1 font-semibold text-amber-700">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> Amber (₹1,000–₹1,999)
            </span>
            <span className="flex items-center gap-1 font-semibold text-red-700">
              <span className="w-2 h-2 rounded-full bg-red-500"></span> Red (&lt;₹1,000 / Frozen)
            </span>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">Collector ID & Name</th>
                <th className="p-3">Phone & Ward</th>
                <th className="p-3">KYC Verification (Redacted)</th>
                <th className="p-3">Float Balance</th>
                <th className="p-3">Status Badge</th>
                <th className="p-3 text-right">Dispatch Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {wallets.map((w) => {
                const status = getWalletStatusBadge(w.floatBalance);
                const redactedAadhaar = redactAadhaar(w.aadhaarRaw);
                const kycToken = generateOpaqueKycToken(w.collectorId);

                return (
                  <tr key={w.collectorId} className="hover:bg-slate-50/50">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{w.name}</div>
                      <div className="text-[11px] font-mono text-slate-500">{w.collectorId}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-mono text-slate-700">{w.phone}</div>
                      <div className="text-[11px] text-slate-500">{w.assignedWard}</div>
                    </td>
                    <td className="p-3">
                      <div data-testid={`aadhaar-redacted-${w.collectorId}`} className="font-mono text-slate-800 font-medium">
                        {redactedAadhaar}
                      </div>
                      <div data-testid={`kyc-token-${w.collectorId}`} className="text-[10px] text-emerald-700 font-mono font-bold">
                        {kycToken}
                      </div>
                    </td>
                    <td className="p-3 font-mono font-extrabold text-sm text-slate-900">
                      ₹{w.floatBalance.toFixed(2)}
                    </td>
                    <td className="p-3">
                      {status === 'HEALTHY_FLOAT' && (
                        <span
                          data-testid={`wallet-status-${w.collectorId}`}
                          className="px-2.5 py-1 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200"
                        >
                          ✓ HEALTHY (≥₹2,000)
                        </span>
                      )}
                      {status === 'ROUTE_BUFFER' && (
                        <span
                          data-testid={`wallet-status-${w.collectorId}`}
                          className="px-2.5 py-1 rounded-md text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200"
                        >
                          ⚠️ ROUTE BUFFER (₹1,000–₹1,999)
                        </span>
                      )}
                      {status === 'CRITICAL_FROZEN' && (
                        <span
                          data-testid={`wallet-status-${w.collectorId}`}
                          className="px-2.5 py-1 rounded-md text-[10px] font-black bg-red-100 text-red-800 border border-red-200"
                        >
                          🔴 CRITICAL / FROZEN (&lt;₹1,000)
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {status === 'CRITICAL_FROZEN' ? (
                        <span className="font-bold text-red-600 text-[11px]">DISPATCH BLOCKED</span>
                      ) : (
                        <span className="font-bold text-emerald-600 text-[11px]">ELIGIBLE FOR DISPATCH</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Double-Entry wallet_ledger Audit Stream */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
          Double-Entry Immutable Audit Stream (`wallet_ledger`)
        </h3>
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">Entry ID</th>
                <th className="p-3">Event Type</th>
                <th className="p-3">Collector</th>
                <th className="p-3">Description & Order Ref</th>
                <th className="p-3">Gateway Payout Ref</th>
                <th className="p-3 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white font-mono">
              {ledger.map((entry) => {
                const isNegative = entry.amount < 0;
                return (
                  <tr key={entry.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-bold text-slate-900">{entry.id}</td>
                    <td className="p-3 font-sans">
                      {entry.type === 'DEBIT_ORDER_AND_FEE' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                          DEBIT_ORDER_AND_FEE
                        </span>
                      )}
                      {entry.type === 'CREDIT_TOPUP' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          CREDIT_TOPUP
                        </span>
                      )}
                      {entry.type === 'PENALTY_SLA_BREACH' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                          PENALTY_SLA_BREACH
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-sans font-medium text-slate-800">{entry.collectorName}</td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-slate-900">{entry.description}</div>
                      <div className="text-[11px] font-mono text-slate-500">Order: #{entry.referenceOrderId}</div>
                    </td>
                    <td className="p-3 text-slate-600">{entry.gatewayPayoutRef}</td>
                    <td className="p-3 text-right font-black text-sm">
                      <span className={isNegative ? 'text-red-600' : 'text-emerald-600'}>
                        {isNegative ? `-₹${Math.abs(entry.amount).toFixed(2)}` : `+₹${entry.amount.toFixed(2)}`}
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
