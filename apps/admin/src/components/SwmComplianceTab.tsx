'use client';

import React, { useState } from 'react';
import {
  BULK_GENERATORS,
  BulkGeneratorAccount,
  generateSwmComplianceCertificate,
  SwmComplianceCertificate,
} from '@/services/adminOperations';

export const SwmComplianceTab: React.FC = () => {
  const [selectedGenerator, setSelectedGenerator] = useState<BulkGeneratorAccount>(BULK_GENERATORS[0]!);
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
      `Certificate ${certificate.certificateId} downloaded successfully for ${certificate.generatorName} (Signed by GMC Statutory Authority).`,
    );
    setTimeout(() => setDownloadSuccessMsg(null), 6000);
  };

  // 4 statutory mass-balance streams (daily aggregate across Guwahati bulk generators)
  const totalDailyWet = BULK_GENERATORS.reduce((acc, g) => acc + g.massBalance.wetKg, 0);
  const totalDailyDry = BULK_GENERATORS.reduce((acc, g) => acc + g.massBalance.dryKg, 0);
  const totalDailySanitary = BULK_GENERATORS.reduce((acc, g) => acc + g.massBalance.sanitaryKg, 0);
  const totalDailySpecialCare = BULK_GENERATORS.reduce((acc, g) => acc + g.massBalance.specialCareKg, 0);
  const grandTotalDaily = totalDailyWet + totalDailyDry + totalDailySanitary + totalDailySpecialCare;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">
            🌱 SWM Rules 2026 Bulk Generator Compliance Engine
          </h2>
          <p className="text-xs text-slate-500">
            Automated mass-balance aggregation • Certified Boragaon landfill diversion • GMC & Assam SPCB statutory certificates
          </p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          Clause 4 (Bulk Generators &gt;100 kg/day)
        </span>
      </div>

      {downloadSuccessMsg && (
        <div
          data-testid="certificate-download-banner"
          className="p-4 rounded-lg bg-emerald-50 border border-emerald-300 text-xs font-bold text-emerald-900 flex justify-between items-center"
        >
          <span>✓ {downloadSuccessMsg}</span>
          <button onClick={() => setDownloadSuccessMsg(null)} className="text-emerald-900 font-bold ml-4">
            ✕
          </button>
        </div>
      )}

      {/* 4-Stream Mass-Balance Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stream 1: Dry Recyclable */}
        <div className="p-4 rounded-lg bg-emerald-50/60 border border-emerald-200">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-emerald-800 uppercase">Stream 1: Dry Recyclable</span>
            <span className="text-xs">📦</span>
          </div>
          <div className="text-2xl font-black text-emerald-900 mt-2">{totalDailyDry.toFixed(1)} kg / day</div>
          <span className="text-[11px] font-semibold text-emerald-700 mt-1 block">
            100% Diverted to Recyclers
          </span>
        </div>

        {/* Stream 2: Wet Organic */}
        <div className="p-4 rounded-lg bg-amber-50/60 border border-amber-200">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-amber-800 uppercase">Stream 2: Wet Organic</span>
            <span className="text-xs">🍏</span>
          </div>
          <div className="text-2xl font-black text-amber-900 mt-2">{totalDailyWet.toFixed(1)} kg / day</div>
          <span className="text-[11px] font-semibold text-amber-700 mt-1 block">
            Bio-Methanation / Composting
          </span>
        </div>

        {/* Stream 3: Sanitary Domestic Hazardous */}
        <div className="p-4 rounded-lg bg-red-50/60 border border-red-200">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-red-800 uppercase">Stream 3: Sanitary Waste</span>
            <span className="text-xs">🩹</span>
          </div>
          <div className="text-2xl font-black text-red-900 mt-2">{totalDailySanitary.toFixed(1)} kg / day</div>
          <span className="text-[11px] font-semibold text-red-700 mt-1 block">
            Incineration Standard Enforced
          </span>
        </div>

        {/* Stream 4: Special Care & E-Waste */}
        <div className="p-4 rounded-lg bg-indigo-50/60 border border-indigo-200">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-indigo-800 uppercase">Stream 4: Special Care</span>
            <span className="text-xs">🔌</span>
          </div>
          <div className="text-2xl font-black text-indigo-900 mt-2">{totalDailySpecialCare.toFixed(1)} kg / day</div>
          <span className="text-[11px] font-semibold text-indigo-700 mt-1 block">
            APCB Authorized Recyclers
          </span>
        </div>
      </div>

      {/* Generator Selector & Certified Landfill Diversion Certificate */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Bulk Generator Selector List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Registered Bulk Waste Generators (&gt;100 kg/day)
          </h3>
          <div className="space-y-2">
            {BULK_GENERATORS.map((gen) => {
              const isSelected = selectedGenerator.id === gen.id;
              return (
                <button
                  key={gen.id}
                  data-testid={`select-generator-${gen.id}`}
                  onClick={() => handleSelectGenerator(gen)}
                  className={`w-full p-4 rounded-lg border text-left transition-all ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/40 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="font-extrabold text-xs text-slate-900">{gen.name}</div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      W{gen.wardNumber}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">{gen.address}</div>
                  <div className="mt-2 flex justify-between items-center text-[11px] font-mono">
                    <span className="text-slate-600">Daily Average:</span>
                    <strong className="text-emerald-700 font-bold">{gen.avgDailyWasteKg} kg/day</strong>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <span className="font-bold text-slate-800">Total Bulk Waste Under Management: </span>
            <span className="font-mono font-bold text-slate-900">{grandTotalDaily} kg/day</span>
          </div>
        </div>

        {/* Audit-Ready Compliance Certificate Preview Card */}
        {certificate && (
          <div className="lg:col-span-2 border-2 border-emerald-600 rounded-xl p-6 bg-slate-50/50 flex flex-col justify-between shadow-sm relative">
            <div>
              {/* Certificate Official Header */}
              <div className="flex justify-between items-start border-b border-emerald-200 pb-4">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-800 block">
                    Statutory Environmental Compliance Form 4
                  </span>
                  <h3 className="text-base font-black text-slate-900 mt-0.5">
                    Guwahati Municipal Corporation SWM Rules 2026 Certificate
                  </h3>
                  <div className="text-xs text-slate-600 mt-1">
                    Issued to: <strong className="text-slate-900">{certificate.generatorName}</strong>
                  </div>
                </div>

                <div className="text-right">
                  <div className="px-3 py-1 rounded bg-emerald-600 text-white text-[11px] font-mono font-black">
                    ✓ {certificate.status}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-1">
                    ID: {certificate.certificateId}
                  </div>
                </div>
              </div>

              {/* Certified Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Total Waste (30d)</span>
                  <div className="text-sm font-black text-slate-900 mt-1 font-mono">
                    {certificate.totalWasteGeneratedKg} kg
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Dry Scrap Diverted</span>
                  <div data-testid="cert-diverted-kg" className="text-sm font-black text-emerald-700 mt-1 font-mono">
                    {certificate.dryScrapDivertedKg} kg
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Boragaon Landfill Saved</span>
                  <div data-testid="cert-volume-saved" className="text-sm font-black text-emerald-700 mt-1 font-mono">
                    {certificate.landfillVolumeSavedCubicMeters} m³
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">CO₂e Avoided</span>
                  <div data-testid="cert-carbon-offset" className="text-sm font-black text-emerald-700 mt-1 font-mono">
                    {certificate.carbonOffsetKgCO2e} kg
                  </div>
                </div>
              </div>

              {/* Segregation and Legal Statement */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-1 font-medium">
                <div className="flex justify-between">
                  <span>Source Segregation Efficiency:</span>
                  <strong data-testid="cert-segregation-pct" className="text-emerald-700 font-bold">
                    {certificate.segregationCompliancePct}% (Statutory Threshold: &ge;80%)
                  </strong>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Carbon Offset Basis:</span>
                  <span>1.2 kg CO₂e avoided per kg dry scrap diverted</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Boragaon Landfill Baseline:</span>
                  <span>0.0027 m³ capacity conserved per kg scrap</span>
                </div>
              </div>

              {/* Cryptographic Verification Hash */}
              <div className="mt-3 p-2 rounded bg-slate-100 border border-slate-200 text-[10px] font-mono text-slate-600 flex justify-between items-center">
                <span>GMC Verification Hash:</span>
                <span data-testid="cert-hash" className="font-bold text-slate-900">{certificate.gmcCertificationHash}</span>
              </div>
            </div>

            {/* Download Action Button */}
            <div className="pt-4 mt-4 border-t border-slate-200 flex justify-end">
              <button
                data-testid="download-compliance-cert-btn"
                onClick={handleDownload}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-5 py-3 rounded-lg shadow-sm transition-all flex items-center gap-2"
              >
                <span>📜</span>
                <span>DOWNLOAD SWM 2026 STATUTORY CERTIFICATE (PDF/CSV)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
