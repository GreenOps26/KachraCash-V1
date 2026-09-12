'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  Check,
  Truck,
  Upload,
  X,
  History
} from 'lucide-react';
import {
  computeFloorRateWithFreight,
  REGIONAL_FREIGHT_HUBS,
  RateCardAuditRow,
} from '@/services/adminOperations';

interface CommodityDefinition {
  sku: string;
  name: string;
  category: string;
  nationalBenchmark: number;
  freightCost: number;
  handlingCost: number;
  aggregatorMargin: number;
  collectorMargin: number;
  volatilityBuffer: number;
}

export const FloorRateCardManager: React.FC = () => {
  const [nationalIndex, setNationalIndex] = useState<number>(40.0);
  const [freightOffset, setFreightOffset] = useState<number>(
    REGIONAL_FREIGHT_HUBS.BYRNIHAT_FERROUS.freightOffsetPerKg,
  );
  const [freightHubName, setFreightHubName] = useState<string>(
    REGIONAL_FREIGHT_HUBS.BYRNIHAT_FERROUS.name,
  );
  const [handlingOffset, setHandlingOffset] = useState<number>(1.8);
  const [aggregatorMargin, setAggregatorMargin] = useState<number>(2.0);
  const [volatilityBuffer, setVolatilityBuffer] = useState<number>(0.05);

  // 8-Commodity Master Table Data
  const commodities: CommodityDefinition[] = [
    {
      sku: 'SKU_OCC_01',
      name: 'Old Corrugated Cardboard (OCC)',
      category: 'Paper & Soft Films',
      nationalBenchmark: 19.0,
      freightCost: freightOffset,
      handlingCost: 1.2,
      aggregatorMargin: 1.5,
      collectorMargin: 0.08,
      volatilityBuffer: 0.04,
    },
    {
      sku: 'SKU_PET_02',
      name: 'Sorted Clean PET Bottles',
      category: 'Rigid Containers',
      nationalBenchmark: nationalIndex,
      freightCost: freightOffset,
      handlingCost: handlingOffset,
      aggregatorMargin: aggregatorMargin,
      collectorMargin: 0.08,
      volatilityBuffer: volatilityBuffer,
    },
    {
      sku: 'SKU_HDPE_03',
      name: 'Rigid HDPE Drums & Containers',
      category: 'Rigid Containers',
      nationalBenchmark: 45.0,
      freightCost: freightOffset,
      handlingCost: 1.8,
      aggregatorMargin: 2.0,
      collectorMargin: 0.08,
      volatilityBuffer: 0.05,
    },
    {
      sku: 'SKU_LDPE_04',
      name: 'Soft Film & Stretch Wrap (LDPE)',
      category: 'Paper & Soft Films',
      nationalBenchmark: 28.0,
      freightCost: freightOffset,
      handlingCost: 1.5,
      aggregatorMargin: 1.8,
      collectorMargin: 0.08,
      volatilityBuffer: 0.05,
    },
    {
      sku: 'SKU_FERROUS_05',
      name: 'Iron & Light Tin Metal Scrap',
      category: 'Bulky & Metals',
      nationalBenchmark: 32.0,
      freightCost: 1.2,
      handlingCost: 1.5,
      aggregatorMargin: 1.8,
      collectorMargin: 0.08,
      volatilityBuffer: 0.04,
    },
    {
      sku: 'SKU_COPPER_06',
      name: 'Heavy Copper Wire & Brass Scrap',
      category: 'Bulky & Metals',
      nationalBenchmark: 460.0,
      freightCost: 2.0,
      handlingCost: 5.0,
      aggregatorMargin: 8.0,
      collectorMargin: 0.08,
      volatilityBuffer: 0.05,
    },
    {
      sku: 'SKU_PAPER_07',
      name: 'Mixed Office Paper & Daily Newspaper',
      category: 'Paper & Soft Films',
      nationalBenchmark: 14.0,
      freightCost: 1.8,
      handlingCost: 1.0,
      aggregatorMargin: 1.2,
      collectorMargin: 0.08,
      volatilityBuffer: 0.04,
    },
    {
      sku: 'SKU_EWASTE_08',
      name: 'Domestic E-Waste & Small Appliances',
      category: 'Bulky & Metals',
      nationalBenchmark: 65.0,
      freightCost: 4.0,
      handlingCost: 3.5,
      aggregatorMargin: 4.0,
      collectorMargin: 0.08,
      volatilityBuffer: 0.06,
    },
  ];

  // Immutable audit log state
  const [auditLog, setAuditLog] = useState<RateCardAuditRow[]>([
    {
      versionId: 'RC_V2026_09_06_A',
      timestamp: '2026-09-06 18:00:00 IST',
      publishedBy: 'Ops Desk (Assam Regional Aggregator)',
      nationalIndexRate: 40.0,
      freightCost: 1.2,
      freightHubName: 'Byrnihat Short-Haul Ferrous Hub',
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
      freightHubName: 'Siliguri Paper & Polymer Hub',
      handlingCost: 1.0,
      aggregatorMargin: 1.0,
      collectorMargin: 0.08,
      volatilityBuffer: 0.04,
      computedFloorRate: 9.27,
      status: 'ARCHIVED',
    },
  ]);

  const [publishSuccessMsg, setPublishSuccessMsg] = useState<string | null>(null);

  // Live recalculation for primary benchmark
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
      timestamp:
        new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
      publishedBy: 'Ops Desk Lead (Guwahati)',
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
      ...prev.map((r) =>
        r.status === 'PUBLISHED_ACTIVE' ? { ...r, status: 'ARCHIVED' as const } : r,
      ),
    ]);

    setPublishSuccessMsg(
      `Published Version ${newVersionId} at ₹${pricingResult.floorRate.toFixed(2)}/kg into floor_rate_cards.`,
    );
    setTimeout(() => setPublishSuccessMsg(null), 5000);
  };

  return (
    <div className="bg-[#0C1915] rounded-xl border border-white/[0.08] p-5 text-[#F1F5EF] space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#C7FF3D]" />
            <h2 className="text-base font-display font-bold text-[#F1F5EF] tracking-tight">
              Dynamic Floor Rate Card Desk
            </h2>
          </div>
          <p className="text-xs text-[#DEEAE3]/60 font-mono mt-0.5">
            Deterministic pricing engine • Regional freight offsets • Reverse auctions prohibited
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-[#10221C] text-[#C7FF3D] border border-[#C7FF3D]/20 inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C7FF3D]"></span>
          Zero Bidding Enforced
        </span>
      </div>

      {publishSuccessMsg && (
        <div
          data-testid="publish-success-banner"
          className="p-3 bg-emerald-950/30 border border-emerald-500/50 rounded-lg text-xs font-mono text-emerald-300 flex justify-between items-center"
        >
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#C7FF3D]" />
            {publishSuccessMsg}
          </span>
          <button
            onClick={() => setPublishSuccessMsg(null)}
            className="text-emerald-400 hover:text-emerald-200 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Formula Preview Box */}
      <div className="p-3 rounded-lg bg-[#07110E] border border-white/[0.08] font-mono text-xs">
        <div className="text-[10px] text-[#DEEAE3]/40 uppercase tracking-wider mb-1">
          DETERMINISTIC FORMULA
        </div>
        <div className="text-[#C7FF3D] text-xs font-medium tracking-wide">
          P_floor = [P_national - (Freight + Handling + Aggregator)] × (1 - Collector Margin) × (1 - Volatility Buffer)
        </div>
      </div>

      {/* Controls vs Live Computed Output Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Formula Variable Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-3.5">
          {/* National Spot Slider */}
          <div className="bg-[#10221C] p-3.5 rounded-lg border border-white/[0.08]">
            <div className="flex justify-between items-center mb-1 text-xs font-mono">
              <span className="text-[#DEEAE3]/80">
                National Spot Benchmark (P_national):
              </span>
              <span className="text-[#C7FF3D] font-bold tabular-nums">
                ₹{nationalIndex.toFixed(2)} / kg
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="150"
              step="1"
              value={nationalIndex}
              onChange={(e) => setNationalIndex(Number(e.target.value))}
              className="w-full accent-[#C7FF3D] cursor-pointer"
            />
          </div>

          {/* Logistics Corridor Quick-Toggles */}
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-[#DEEAE3]/60 mb-2 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-[#55F3CF]" />
              Regional Freight Corridor (C_freight)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                data-testid="byrnihat-freight-btn"
                onClick={() => handleSelectFreightHub('BYRNIHAT_FERROUS')}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  freightOffset === 1.2
                    ? 'border-[#C7FF3D] bg-[#1F4D3C]/30 shadow-sm'
                    : 'border-white/[0.08] hover:border-white/20 bg-[#10221C]'
                }`}
              >
                <div className="font-medium text-xs text-[#F1F5EF]">
                  Byrnihat Short-Haul Hub
                </div>
                <div className="text-xs text-[#C7FF3D] font-mono font-semibold mt-1">
                  C_freight = ₹1.20 / kg
                </div>
                <div className="text-[10px] text-[#DEEAE3]/40 mt-0.5">
                  Assam-Meghalaya Border (Ferrous)
                </div>
              </button>

              <button
                type="button"
                data-testid="siliguri-freight-btn"
                onClick={() => handleSelectFreightHub('SILIGURI_POLYMER')}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  freightOffset === 3.5
                    ? 'border-[#C7FF3D] bg-[#1F4D3C]/30 shadow-sm'
                    : 'border-white/[0.08] hover:border-white/20 bg-[#10221C]'
                }`}
              >
                <div className="font-medium text-xs text-[#F1F5EF]">
                  Siliguri Long-Haul Hub
                </div>
                <div className="text-xs text-[#C7FF3D] font-mono font-semibold mt-1">
                  C_freight = ₹3.50 / kg
                </div>
                <div className="text-[10px] text-[#DEEAE3]/40 mt-0.5">
                  North Bengal Reprocessing (Polymer)
                </div>
              </button>
            </div>
          </div>

          {/* Secondary Formula Variables */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="bg-[#10221C] p-2.5 rounded-lg border border-white/[0.08]">
              <label className="block text-[11px] font-mono text-[#DEEAE3]/60 mb-1">
                Handling (C_handling)
              </label>
              <div className="flex items-center">
                <span className="p-1 bg-[#07110E] border border-r-0 border-white/[0.08] rounded-l text-xs text-[#DEEAE3]/50 font-mono">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.1"
                  value={handlingOffset}
                  onChange={(e) => setHandlingOffset(Number(e.target.value))}
                  className="w-full text-xs font-mono bg-[#07110E] border border-white/[0.08] rounded-r p-1 text-[#F1F5EF] tabular-nums"
                />
              </div>
            </div>

            <div className="bg-[#10221C] p-2.5 rounded-lg border border-white/[0.08]">
              <label className="block text-[11px] font-mono text-[#DEEAE3]/60 mb-1">
                Aggregator (M_agg)
              </label>
              <div className="flex items-center">
                <span className="p-1 bg-[#07110E] border border-r-0 border-white/[0.08] rounded-l text-xs text-[#DEEAE3]/50 font-mono">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.5"
                  value={aggregatorMargin}
                  onChange={(e) => setAggregatorMargin(Number(e.target.value))}
                  className="w-full text-xs font-mono bg-[#07110E] border border-white/[0.08] rounded-r p-1 text-[#F1F5EF] tabular-nums"
                />
              </div>
            </div>

            <div className="bg-[#10221C] p-2.5 rounded-lg border border-white/[0.08]">
              <label className="block text-[11px] font-mono text-[#DEEAE3]/60 mb-1">
                Volatility Buffer (α_risk)
              </label>
              <div className="text-xs font-mono font-medium text-[#55F3CF] mb-1 tabular-nums">
                {(volatilityBuffer * 100).toFixed(0)}%
              </div>
              <input
                type="range"
                min="0.02"
                max="0.08"
                step="0.01"
                value={volatilityBuffer}
                onChange={(e) => setVolatilityBuffer(Number(e.target.value))}
                className="w-full accent-[#55F3CF] cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Live Computed Payout Card (5 cols) */}
        <div className="lg:col-span-5 bg-[#10221C] rounded-lg p-4 border border-white/[0.08] flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-wider text-[#DEEAE3]/60">
              <span>Calculated Floor Price</span>
              <span className="text-[#C7FF3D]">Real-Time Math</span>
            </div>
            <div
              data-testid="computed-floor-rate-display"
              className="font-display text-3xl font-bold text-[#C7FF3D] mt-2 tabular-nums"
            >
              ₹{pricingResult.floorRate.toFixed(2)}{' '}
              <span className="text-sm font-normal text-[#DEEAE3]/50 font-sans">/ kg</span>
            </div>
            <p className="text-xs text-[#DEEAE3]/60 mt-1.5 leading-relaxed font-sans">
              Locked floor rate card broadcasted directly to collector BLE scales.
            </p>
          </div>

          <div className="space-y-1.5 border-t border-white/[0.08] pt-3 mt-3 text-xs font-mono">
            <div className="flex justify-between text-[#DEEAE3]/60">
              <span>Freight Offset (C_freight):</span>
              <span className="text-[#F1F5EF] tabular-nums">₹{freightOffset.toFixed(2)}/kg</span>
            </div>
            <div className="flex justify-between text-[#DEEAE3]/60">
              <span>Collector Commission:</span>
              <span className="text-[#55F3CF]">8.0%</span>
            </div>
            <div className="flex justify-between text-[#DEEAE3]/60">
              <span>Platform Take-Rate:</span>
              <span className="text-[#55F3CF]">8.0%</span>
            </div>
            <div className="flex justify-between text-[#DEEAE3]/60 pt-1.5 border-t border-white/[0.04]">
              <span className="text-[#DEEAE3]">Citizen Net Payout Share:</span>
              <span className="text-[#C7FF3D] font-bold">92.0%</span>
            </div>

            <button
              onClick={handlePublishVersion}
              data-testid="publish-rate-card-btn"
              className="w-full bg-[#C7FF3D] hover:bg-[#b2eb2d] text-[#07110E] font-mono font-semibold text-xs py-2.5 rounded-lg mt-2 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              Publish Rate Card Version
            </button>
          </div>
        </div>
      </div>

      {/* 8-Commodity Master Table */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#DEEAE3]/60">
            8-Commodity Master Rate Table
          </h3>
          <span className="text-[11px] font-mono text-[#55F3CF]">
            8 Commodities
          </span>
        </div>

        <div className="overflow-x-auto border border-white/[0.08] rounded-lg bg-[#10221C]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#07110E] text-[#DEEAE3]/60 font-mono border-b border-white/[0.08]">
              <tr>
                <th className="p-2.5">SKU</th>
                <th className="p-2.5">Commodity & Category</th>
                <th className="p-2.5 font-mono">National Spot</th>
                <th className="p-2.5 font-mono">Freight</th>
                <th className="p-2.5 font-mono">Handling</th>
                <th className="p-2.5 font-mono">Take-Rate</th>
                <th className="p-2.5 text-right font-mono text-[#C7FF3D]">Floor Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {commodities.map((comm) => {
                const res = computeFloorRateWithFreight(
                  comm.nationalBenchmark,
                  comm.freightCost,
                  comm.handlingCost,
                  comm.aggregatorMargin,
                  comm.collectorMargin,
                  comm.volatilityBuffer,
                );

                return (
                  <tr key={comm.sku} className="hover:bg-white/[0.015] transition-colors">
                    <td className="p-2.5 font-mono font-medium text-[#55F3CF]">{comm.sku}</td>
                    <td className="p-2.5">
                      <div className="font-medium text-[#F1F5EF]">{comm.name}</div>
                      <div className="text-[10px] text-[#DEEAE3]/40 font-sans">{comm.category}</div>
                    </td>
                    <td className="p-2.5 font-mono text-[#DEEAE3] tabular-nums">
                      ₹{comm.nationalBenchmark.toFixed(2)}/kg
                    </td>
                    <td className="p-2.5 font-mono text-[#DEEAE3] tabular-nums">
                      ₹{comm.freightCost.toFixed(2)}/kg
                    </td>
                    <td className="p-2.5 font-mono text-[#DEEAE3] tabular-nums">
                      ₹{comm.handlingCost.toFixed(2)}/kg
                    </td>
                    <td className="p-2.5 font-mono text-[#55F3CF]">
                      {(comm.collectorMargin * 100).toFixed(0)}%
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold text-[#C7FF3D] tabular-nums">
                      ₹{res.floorRate.toFixed(2)}/kg
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Immutable Rate Card Audit Log Table */}
      <div>
        <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#DEEAE3]/60 mb-2.5 flex items-center gap-1.5">
          <History className="w-3.5 h-3.5 text-[#55F3CF]" />
          Immutable Publishing Audit Log (`floor_rate_cards`)
        </h3>
        <div className="overflow-x-auto border border-white/[0.08] rounded-lg bg-[#10221C]">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#07110E] text-[#DEEAE3]/60 border-b border-white/[0.08]">
              <tr>
                <th className="p-2.5">Version ID</th>
                <th className="p-2.5">Timestamp</th>
                <th className="p-2.5">Corridor</th>
                <th className="p-2.5">P_national</th>
                <th className="p-2.5">C_freight</th>
                <th className="p-2.5 text-[#C7FF3D]">P_floor</th>
                <th className="p-2.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {auditLog.map((row) => (
                <tr key={row.versionId} className="hover:bg-white/[0.015] transition-colors">
                  <td className="p-2.5 font-medium text-[#F1F5EF]">{row.versionId}</td>
                  <td className="p-2.5 text-[#DEEAE3]/60 font-sans text-[11px]">{row.timestamp}</td>
                  <td className="p-2.5 text-[#DEEAE3]/70 font-sans text-[11px]">{row.freightHubName}</td>
                  <td className="p-2.5 text-[#F1F5EF] tabular-nums">
                    ₹{row.nationalIndexRate.toFixed(2)}
                  </td>
                  <td className="p-2.5 text-[#DEEAE3] tabular-nums">₹{row.freightCost.toFixed(2)}</td>
                  <td className="p-2.5 font-bold text-[#C7FF3D] tabular-nums">
                    ₹{row.computedFloorRate.toFixed(2)}/kg
                  </td>
                  <td className="p-2.5 text-right">
                    {row.status === 'PUBLISHED_ACTIVE' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#1F4D3C]/40 text-[#C7FF3D] border border-[#C7FF3D]/30">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-[#07110E] text-[#DEEAE3]/40 border border-white/[0.06]">
                        Archived
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
