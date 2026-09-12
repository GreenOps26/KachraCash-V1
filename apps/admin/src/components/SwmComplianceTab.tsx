'use client';

import React, { useState } from 'react';
import {
  Leaf,
  Package,
  Apple,
  HeartPulse,
  Cpu,
  Download,
  Check,
  X,
  Building2,
} from 'lucide-react';
import {
  BULK_GENERATORS,
  BulkGeneratorAccount,
  generateSwmComplianceCertificate,
  SwmComplianceCertificate,
} from '@/services/adminOperations';

export const SwmComplianceTab: React.FC = () => {
  const [selectedGenerator, setSelectedGenerator] = useState<BulkGeneratorAccount>(
    BULK_GENERATORS[0]!,
  );
  const [certificate, setCertificate] = useState<SwmComplianceCertificate | null>(
    generateSwmComplianceCertificate(BULK_GENERATORS[0]!),
  );
  const [downloadSuccessMsg, setDownloadSuccessMsg] = useState<string | null>(null);

  const handleSelectGenerator = (gen: BulkGeneratorAccount) => {
    setSelectedGenerator(gen);
    setCertificate(generateSwmComplianceCertificate(gen));
  };

  const handleDownload = () => {
    if (!certificate) return;
    setDownloadSuccessMsg(
      `Compliance Certificate generated for ${certificate.generatorName} (Hash: ${certificate.gmcCertificationHash}). Signed under SWM Rules 2026.`,
    );
    setTimeout(() => setDownloadSuccessMsg(null), 6000);
  };

  // 4 statutory mass-balance streams (daily aggregate across Guwahati bulk generators)
  const totalDailyWet = BULK_GENERATORS.reduce((acc, g) => acc + g.massBalance.wetKg, 0);
  const totalDailyDry = BULK_GENERATORS.reduce((acc, g) => acc + g.massBalance.dryKg, 0);
  const totalDailySanitary = BULK_GENERATORS.reduce((acc, g) => acc + g.massBalance.sanitaryKg, 0);
  const totalDailySpecialCare = BULK_GENERATORS.reduce(
    (acc, g) => acc + g.massBalance.specialCareKg,
    0,
  );
  const grandTotalDaily =
    totalDailyWet + totalDailyDry + totalDailySanitary + totalDailySpecialCare;

  return (
    <div className="bg-[#0C1915] rounded-xl border border-white/[0.08] p-5 text-[#F1F5EF] space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-[#C7FF3D]" />
            <h2 className="text-base font-display font-bold text-[#F1F5EF] tracking-tight">
              SWM Rules 2026 Bulk Generator Compliance Engine
            </h2>
          </div>
          <p className="text-xs text-[#DEEAE3]/60 font-mono mt-0.5">
            Mass-balance stream aggregation • Boragaon landfill diversion certification • SPCB compliance
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-[#10221C] text-[#C7FF3D] border border-[#C7FF3D]/20">
          Bulk Generators &gt;100 kg/day
        </span>
      </div>

      {downloadSuccessMsg && (
        <div
          data-testid="certificate-download-banner"
          className="p-3.5 rounded-lg bg-[#1F4D3C]/40 border border-[#C7FF3D]/40 text-[#F1F5EF] flex justify-between items-center"
        >
          <div className="font-mono text-xs text-[#C7FF3D] font-medium flex items-center gap-2">
            <Check className="w-4 h-4 text-[#C7FF3D] shrink-0" />
            <span>{downloadSuccessMsg}</span>
          </div>
          <button
            onClick={() => setDownloadSuccessMsg(null)}
            className="text-white/60 hover:text-white p-1 ml-3"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4-Stream Mass-Balance Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Stream 1: Dry Recyclable */}
        <div className="p-3.5 rounded-lg bg-[#10221C] border border-white/[0.08]">
          <div className="flex justify-between items-center text-[11px] font-mono text-[#55F3CF]">
            <span className="uppercase tracking-wider">Stream 1: Dry Scrap</span>
            <Package className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-display font-bold text-[#C7FF3D] mt-1.5 tabular-nums">
            {totalDailyDry.toFixed(1)} kg/day
          </div>
          <span className="text-[10px] font-mono text-[#DEEAE3]/50 mt-0.5 block">
            100% Diverted to Reprocessing
          </span>
        </div>

        {/* Stream 2: Wet Organic */}
        <div className="p-3.5 rounded-lg bg-[#10221C] border border-white/[0.08]">
          <div className="flex justify-between items-center text-[11px] font-mono text-amber-300">
            <span className="uppercase tracking-wider">Stream 2: Wet Organic</span>
            <Apple className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-display font-bold text-amber-300 mt-1.5 tabular-nums">
            {totalDailyWet.toFixed(1)} kg/day
          </div>
          <span className="text-[10px] font-mono text-[#DEEAE3]/50 mt-0.5 block">
            Bio-Methanation / Composting
          </span>
        </div>

        {/* Stream 3: Sanitary Domestic Hazardous */}
        <div className="p-3.5 rounded-lg bg-[#10221C] border border-white/[0.08]">
          <div className="flex justify-between items-center text-[11px] font-mono text-red-400">
            <span className="uppercase tracking-wider">Stream 3: Sanitary</span>
            <HeartPulse className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-display font-bold text-red-400 mt-1.5 tabular-nums">
            {totalDailySanitary.toFixed(1)} kg/day
          </div>
          <span className="text-[10px] font-mono text-[#DEEAE3]/50 mt-0.5 block">
            Incineration Standard
          </span>
        </div>

        {/* Stream 4: Special Care & E-Waste */}
        <div className="p-3.5 rounded-lg bg-[#10221C] border border-white/[0.08]">
          <div className="flex justify-between items-center text-[11px] font-mono text-[#55F3CF]">
            <span className="uppercase tracking-wider">Stream 4: Special Care</span>
            <Cpu className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-display font-bold text-[#55F3CF] mt-1.5 tabular-nums">
            {totalDailySpecialCare.toFixed(1)} kg/day
          </div>
          <span className="text-[10px] font-mono text-[#DEEAE3]/50 mt-0.5 block">
            Authorized E-Waste Recyclers
          </span>
        </div>
      </div>

      {/* Generator Selector & Certified Landfill Diversion Certificate Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1">
        {/* Bulk Generator Selector (4 cols) */}
        <div className="lg:col-span-4 space-y-2.5">
          <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#DEEAE3]/60">
            Bulk Waste Generators (&gt;100 kg/day)
          </h3>
          <div className="space-y-2">
            {BULK_GENERATORS.map((gen) => {
              const isSelected = selectedGenerator.id === gen.id;
              return (
                <button
                  key={gen.id}
                  data-testid={`select-generator-${gen.id}`}
                  onClick={() => handleSelectGenerator(gen)}
                  className={`w-full p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#C7FF3D] bg-[#1F4D3C]/30 shadow-sm'
                      : 'border-white/[0.08] bg-[#10221C] hover:border-white/20'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="font-medium text-xs text-[#F1F5EF] flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#55F3CF]" />
                      {gen.name}
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#07110E] text-[#55F3CF] border border-white/[0.08]">
                      W{gen.wardNumber}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#DEEAE3]/50 mt-1 font-sans">{gen.address}</div>
                  <div className="mt-2 flex justify-between items-center text-xs font-mono">
                    <span className="text-[#DEEAE3]/50">Daily Volume:</span>
                    <strong className="text-[#C7FF3D] font-medium tabular-nums">
                      {gen.avgDailyWasteKg} kg/day
                    </strong>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-3 rounded-lg bg-[#10221C] border border-white/[0.08] text-xs font-mono text-[#DEEAE3]/60 flex items-center justify-between">
            <span className="text-[11px]">Total Managed Volume:</span>
            <span className="font-bold text-sm text-[#F1F5EF] tabular-nums">
              {grandTotalDaily.toFixed(1)} kg/day
            </span>
          </div>
        </div>

        {/* Audit-Ready Statutory Certificate Card (8 cols) */}
        {certificate && (
          <div className="lg:col-span-8 border border-white/[0.12] rounded-lg p-5 bg-[#10221C] flex flex-col justify-between">
            <div>
              {/* Certificate Official Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start border-b border-white/[0.08] pb-3 gap-2">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#55F3CF] block">
                    STATUTORY COMPLIANCE REPORT
                  </span>
                  <h3 className="text-sm font-display font-bold text-[#F1F5EF] mt-0.5">
                    Guwahati Municipal Corporation SWM Rules 2026 Certificate
                  </h3>
                  <div className="text-xs text-[#DEEAE3]/60 mt-1 font-sans">
                    Client: <span className="text-[#F1F5EF] font-medium">{certificate.generatorName}</span>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <div className="px-2 py-0.5 rounded bg-[#1F4D3C]/50 text-[#C7FF3D] text-[10px] font-mono font-semibold border border-[#C7FF3D]/30 inline-block">
                    {certificate.status}
                  </div>
                  <div className="text-[10px] text-[#DEEAE3]/40 font-mono mt-0.5">
                    ID: {certificate.certificateId}
                  </div>
                </div>
              </div>

              {/* Certified Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3.5">
                <div className="bg-[#07110E] p-2.5 rounded border border-white/[0.08] text-center">
                  <span className="text-[10px] text-[#DEEAE3]/40 font-mono uppercase">
                    Total Waste (30d)
                  </span>
                  <div className="text-sm font-mono font-bold text-[#F1F5EF] mt-0.5 tabular-nums">
                    {certificate.totalWasteGeneratedKg} kg
                  </div>
                </div>

                <div className="bg-[#07110E] p-2.5 rounded border border-white/[0.08] text-center">
                  <span className="text-[10px] text-[#DEEAE3]/40 font-mono uppercase">
                    Dry Scrap Diverted
                  </span>
                  <div
                    data-testid="cert-diverted-kg"
                    className="text-sm font-mono font-bold text-[#C7FF3D] mt-0.5 tabular-nums"
                  >
                    {certificate.dryScrapDivertedKg} kg
                  </div>
                </div>

                <div className="bg-[#07110E] p-2.5 rounded border border-white/[0.08] text-center">
                  <span className="text-[10px] text-[#DEEAE3]/40 font-mono uppercase">
                    Landfill Saved
                  </span>
                  <div
                    data-testid="cert-volume-saved"
                    className="text-sm font-mono font-bold text-[#55F3CF] mt-0.5 tabular-nums"
                  >
                    {certificate.landfillVolumeSavedCubicMeters} m³
                  </div>
                </div>

                <div className="bg-[#07110E] p-2.5 rounded border border-white/[0.08] text-center">
                  <span className="text-[10px] text-[#DEEAE3]/40 font-mono uppercase">
                    CO₂e Avoided
                  </span>
                  <div
                    data-testid="cert-carbon-offset"
                    className="text-sm font-mono font-bold text-[#C7FF3D] mt-0.5 tabular-nums"
                  >
                    {certificate.carbonOffsetKgCO2e} kg
                  </div>
                </div>
              </div>

              {/* Segregation and Legal Baseline Statements */}
              <div className="bg-[#07110E] p-3 rounded border border-white/[0.08] text-xs text-[#DEEAE3]/70 space-y-1 font-mono">
                <div className="flex justify-between">
                  <span>Source Segregation Efficiency:</span>
                  <strong
                    data-testid="cert-segregation-pct"
                    className="text-[#C7FF3D] tabular-nums"
                  >
                    {certificate.segregationCompliancePct}% (Threshold: &ge;80%)
                  </strong>
                </div>
                <div className="flex justify-between text-[11px] text-[#DEEAE3]/40">
                  <span>Carbon Offset Basis:</span>
                  <span>1.2 kg CO₂e avoided per kg dry scrap diverted</span>
                </div>
                <div className="flex justify-between text-[11px] text-[#DEEAE3]/40">
                  <span>Landfill Capacity Factor:</span>
                  <span>0.0027 m³ conserved per kg diverted</span>
                </div>
              </div>

              {/* Cryptographic Verification Hash */}
              <div className="mt-3 p-2 rounded bg-[#0C1915] border border-white/[0.08] text-[10px] font-mono text-[#DEEAE3]/60 flex flex-wrap justify-between items-center gap-2">
                <span>Verification Hash:</span>
                <span
                  data-testid="cert-hash"
                  className="font-medium text-[#55F3CF]"
                >
                  {certificate.gmcCertificationHash}
                </span>
              </div>
            </div>

            {/* Download Action Button */}
            <div className="pt-3.5 mt-3.5 border-t border-white/[0.08] flex justify-end">
              <button
                data-testid="download-compliance-cert-btn"
                onClick={handleDownload}
                className="bg-[#C7FF3D] hover:bg-[#b2eb2d] text-[#07110E] font-mono font-semibold text-xs px-4 py-2.5 rounded transition-colors cursor-pointer flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Generate GMC Compliance PDF</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
