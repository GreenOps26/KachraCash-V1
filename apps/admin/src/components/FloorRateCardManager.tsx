'use client';

import React, { useState } from 'react';
import {
  computeFloorRateWithFreight,
  REGIONAL_FREIGHT_HUBS,
  RateCardAuditRow,
} from '@/services/adminOperations';

export const FloorRateCardManager: React.FC = () => {
  const [nationalIndex, setNationalIndex] = useState<number>(40.0);
  const [freightOffset, setFreightOffset] = useState<number>(REGIONAL_FREIGHT_HUBS.BYRNIHAT_FERROUS.freightOffsetPerKg);
  const [freightHubName, setFreightHubName] = useState<string>(REGIONAL_FREIGHT_HUBS.BYRNIHAT_FERROUS.name);
  const [handlingOffset, setHandlingOffset] = useState<number>(1.8);
  const [aggregatorMargin, setAggregatorMargin] = useState<number>(2.0);
  const [volatilityBuffer, setVolatilityBuffer] = useState<number>(0.05);

  // Immutable audit log state
  const [auditLog, setAuditLog] = useState<RateCardAuditRow[]>([
    {
      versionId: 'RC_V2026_09_06_A',
      timestamp: '2026-09-06 18:00:00 IST',
      publishedBy: 'Ops Desk (Assam Regional Aggregator)',
      nationalIndexRate: 40.0,
      freightCost: 1.2,
      freightHubName: 'Byrnihat Short-Haul Ferrous Freight Hub',
      handlingCost: 1.8,
      aggregatorMargin: 2.0,
      collectorMargin: 0.08,
      volatilityBuffer: 0.05,
      computedFloorRate: 30.59,
      status: 'PUBLISHED_ACTIVE',
    },
    {
      versionId: 'RC_V2026_09_05_B',
      timestamp: '2026-09-05 09:30:00 IST',
      publishedBy: 'Ops Desk (Assam Regional Aggregator)',
      nationalIndexRate: 16.0,
      freightCost: 3.5,
      freightHubName: 'West Bengal / Siliguri Paper & Polymer Freight Hub',
      handlingCost: 1.0,
      aggregatorMargin: 1.0,
      collectorMargin: 0.08,
      volatilityBuffer: 0.04,
      computedFloorRate: 9.35,
      status: 'ARCHIVED',
    },
  ]);

  const [publishSuccessMsg, setPublishSuccessMsg] = useState<string | null>(null);

  // Live recalculation
  const pricingResult = computeFloorRateWithFreight(
    nationalIndex,
    freightOffset,
    handlingOffset,
    aggregatorMargin,
    0.08, // Collector 8% margin
    volatilityBuffer,
  );

  const handleSelectFreightHub = (hubKey: keyof typeof REGIONAL_FREIGHT_HUBS) => {
    const hub = REGIONAL_FREIGHT_HUBS[hubKey];
    setFreightOffset(hub.freightOffsetPerKg);
    setFreightHubName(hub.name);
  };

  const handlePublishVersion = () => {
    const newVersionId = `RC_V2026_${Date.now().toString(36).toUpperCase()}`;
    const newRow: RateCardAuditRow = {
      versionId: newVersionId,
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
      publishedBy: 'Ops Desk Lead (Guwahati Head Office)',
      nationalIndexRate: nationalIndex,
      freightCost: freightOffset,
      freightHubName,
      handlingCost: handlingOffset,
      aggregatorMargin,
      collectorMargin: 0.08,
      volatilityBuffer,
      computedFloorRate: pricingResult.floorRate,
      status: 'PUBLISHED_ACTIVE',
    };

    setAuditLog((prev) => [
      newRow,
      ...prev.map((r) => (r.status === 'PUBLISHED_ACTIVE' ? { ...r, status: 'ARCHIVED' as const } : r)),
    ]);

    setPublishSuccessMsg(`Published Version ${newVersionId} at ₹${pricingResult.floorRate.toFixed(2)}/kg successfully!`);
    setTimeout(() => setPublishSuccessMsg(null), 5000);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">
            📊 Dynamic Floor Rate Card Desk (Phase 1 Mandate)
          </h2>
          <p className="text-xs text-slate-500">
            Deterministic Formula: P_floor = [P_national - (C_freight + C_handling + M_aggregator)] × (1 - M_collector) × (1 - α_risk)
          </p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Zero Bidding Enforced
        </span>
      </div>

      {publishSuccessMsg && (
        <div data-testid="publish-success-banner" className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-xs font-bold text-emerald-800 flex justify-between items-center">
          <span>✓ {publishSuccessMsg}</span>
          <button onClick={() => setPublishSuccessMsg(null)} className="text-emerald-900 font-bold">✕</button>
        </div>
      )}

      {/* Main Grid: Controls vs Computed Live Payout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formula Controls */}
        <div className="lg:col-span-2 space-y-4">
          {/* Benchmark Spot Price */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700">
                National Spot Baseline (P_national): ₹{nationalIndex.toFixed(2)} / kg
              </label>
              <span className="text-[11px] font-mono text-slate-500">Commodity Benchmark</span>
            </div>
            <input
              type="range"
              min="10"
              max="150"
              step="1"
              value={nationalIndex}
              onChange={(e) => setNationalIndex(Number(e.target.value))}
              className="w-full accent-emerald-600"
            />
          </div>

          {/* Regional Freight Hub Presets */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Hardcoded Logistics Freight Offset (C_freight)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                data-testid="byrnihat-freight-btn"
                onClick={() => handleSelectFreightHub('BYRNIHAT_FERROUS')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  freightOffset === 1.2
                    ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                }`}
              >
                <div className="font-bold text-xs text-slate-900">
                  Byrnihat Short-Haul Ferrous Freight
                </div>
                <div className="text-[11px] text-emerald-700 font-extrabold mt-1">
                  C_freight = ₹1.20 / kg
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Assam-Meghalaya Industrial Zone
                </div>
              </button>

              <button
                type="button"
                data-testid="siliguri-freight-btn"
                onClick={() => handleSelectFreightHub('SILIGURI_POLYMER')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  freightOffset === 3.5
                    ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                }`}
              >
                <div className="font-bold text-xs text-slate-900">
                  West Bengal / Siliguri Paper & Polymer
                </div>
                <div className="text-[11px] text-emerald-700 font-extrabold mt-1">
                  C_freight = ₹3.50 / kg
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  North Bengal Reprocessing Corridor
                </div>
              </button>
            </div>
          </div>

          {/* Additional Variables */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Handling Offset (C_handling)
              </label>
              <div className="flex items-center">
                <span className="p-2 bg-slate-100 border border-r-0 border-slate-300 rounded-l-lg text-xs font-bold text-slate-600">₹</span>
                <input
                  type="number"
                  step="0.1"
                  value={handlingOffset}
                  onChange={(e) => setHandlingOffset(Number(e.target.value))}
                  className="w-full text-xs border border-slate-300 rounded-r-lg p-2 bg-slate-50 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Aggregator Margin (M_aggregator)
              </label>
              <div className="flex items-center">
                <span className="p-2 bg-slate-100 border border-r-0 border-slate-300 rounded-l-lg text-xs font-bold text-slate-600">₹</span>
                <input
                  type="number"
                  step="0.5"
                  value={aggregatorMargin}
                  onChange={(e) => setAggregatorMargin(Number(e.target.value))}
                  className="w-full text-xs border border-slate-300 rounded-r-lg p-2 bg-slate-50 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Risk Buffer (α_risk): {(volatilityBuffer * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0.02"
                max="0.08"
                step="0.01"
                value={volatilityBuffer}
                onChange={(e) => setVolatilityBuffer(Number(e.target.value))}
                className="w-full accent-blue-600 mt-2"
              />
            </div>
          </div>
        </div>

        {/* Live Computed Output Card */}
        <div className="bg-slate-900 text-white rounded-xl p-5 flex flex-col justify-between shadow-md">
          <div>
            <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <span>Deterministic Floor Rate</span>
              <span className="text-emerald-400">LIVE MATH</span>
            </div>
            <div data-testid="computed-floor-rate-display" className="text-4xl font-black text-emerald-400 mt-3">
              ₹{pricingResult.floorRate.toFixed(2)}{' '}
              <span className="text-base text-slate-400 font-normal">/ kg</span>
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Guaranteed purchase floor price locked on collector BLE scales across all Guwahati wards.
            </p>
          </div>

          <div className="space-y-2 border-t border-slate-800 pt-4 mt-4 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Freight Offset (C_freight):</span>
              <span className="text-white font-semibold font-mono">₹{freightOffset.toFixed(2)}/kg</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Collector Baseline Margin:</span>
              <span className="text-white font-semibold">8.0%</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Platform Take-Rate:</span>
              <span className="text-white font-semibold">8.0%</span>
            </div>
            <div className="flex justify-between text-slate-400 pt-2 border-t border-slate-800">
              <span className="font-bold text-slate-300">Citizen Net Payout Share:</span>
              <span className="text-emerald-400 font-extrabold">92.0%</span>
            </div>

            <button
              onClick={handlePublishVersion}
              data-testid="publish-rate-card-btn"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs py-3 rounded-lg mt-3 transition-all shadow-md"
            >
              🚀 PUBLISH RATE CARD VERSION
            </button>
          </div>
        </div>
      </div>

      {/* Immutable Rate Card Audit Log */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
          Immutable Rate Card Publishing Audit Log
        </h3>
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">Version ID</th>
                <th className="p-3">Timestamp (IST)</th>
                <th className="p-3">Freight Corridor</th>
                <th className="p-3">P_national</th>
                <th className="p-3">C_freight</th>
                <th className="p-3 font-bold text-emerald-700">P_floor</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white font-mono">
              {auditLog.map((row) => (
                <tr key={row.versionId} className="hover:bg-slate-50/50">
                  <td className="p-3 font-bold text-slate-900">{row.versionId}</td>
                  <td className="p-3 text-slate-600 font-sans">{row.timestamp}</td>
                  <td className="p-3 text-slate-700 font-sans">{row.freightHubName}</td>
                  <td className="p-3 font-bold">₹{row.nationalIndexRate.toFixed(2)}</td>
                  <td className="p-3">₹{row.freightCost.toFixed(2)}</td>
                  <td className="p-3 font-black text-emerald-600 text-sm">
                    ₹{row.computedFloorRate.toFixed(2)}/kg
                  </td>
                  <td className="p-3 text-right">
                    {row.status === 'PUBLISHED_ACTIVE' ? (
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        ✓ ACTIVE
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                        ARCHIVED
                      </span>
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
