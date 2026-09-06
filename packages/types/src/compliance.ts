/**
 * Assamese Voice Engine Prompts (Zero-Text / Low-Literacy Audio Engine)
 */
export const ASSAMESE_VOICE_PROMPTS = {
  dispatch: {
    textAs: 'নতুন ভঙা-কুহিলা আহিছে। গ্ৰহণ কৰিবলৈ সেউজীয়া বোটামটো টিপক।',
    textEn: 'New pickup request. Tap green button to accept.',
  },
  weighing: (weightKg: number) => ({
    textAs: `স্কেলত বস্তু তুলক। ${weightKg.toFixed(2)} কিলো হৈছে। ঠিক থাকিলে সেউজীয়া বোটাম টিপক।`,
    textEn: `Place scrap on scale. ${weightKg.toFixed(2)} kg recorded. Tap green to lock.`,
  }),
  settlement: (amount: number, margin: number) => ({
    textAs: `গ্ৰাহকক ${amount.toFixed(0)} টকা দিয়ক। আপোনাৰ লাভ ${margin.toFixed(0)} টকা ৱালেটত জমা হৈছে।`,
    textEn: `Settlement complete for ₹${amount.toFixed(0)}. Profit ₹${margin.toFixed(0)} credited.`,
  }),
  tarePending: {
    textAs: 'প্ৰথমে স্কেলটো শূন্য কৰক। সেউজীয়া লাইট নজ্বলালৈকে বস্তু নুতুলিব।',
    textEn: 'Scale must register 0.000 kg baseline tare first.',
  },
};

/**
 * Sensitive Government Identification Redaction (Aadhaar, PAN)
 */
export function redactAadhaar(rawDigits?: string): string {
  if (!rawDigits) return '[Aadhaar Not Provided]';
  const clean = rawDigits.replace(/\D/g, '');
  const last4 = clean.slice(-4);
  return `•••• •••• ${last4} [Aadhaar Redacted]`;
}

/**
 * Opaque Verification Token Generation for Partner KYC
 */
export function generateOpaqueKycToken(collectorId: string): string {
  const hash = collectorId
    .split('')
    .reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 10000, 7)
    .toString()
    .padStart(4, '0');
  return `KYC_VERIFIED_AS_${hash}`;
}

/**
 * Collector Wallet Float Status Badge
 */
export function getWalletStatusBadge(
  floatBalance: number,
): 'HEALTHY_FLOAT' | 'ROUTE_BUFFER' | 'CRITICAL_FROZEN' {
  if (floatBalance >= 2000.0) return 'HEALTHY_FLOAT';
  if (floatBalance >= 1000.0) return 'ROUTE_BUFFER';
  return 'CRITICAL_FROZEN';
}

/**
 * Guwahati Municipal SWM Rules 2026 ESG Metrics (Boragaon Dumpsite Baseline)
 */
export function calculateEsgImpact(weightKg: number) {
  const volumeSavedM3 = Number((weightKg * 0.0027).toFixed(3));
  const carbonAvoidedKg = Number((weightKg * 1.2).toFixed(1));
  const greenCredits = Math.round(weightKg * 10);
  return {
    volumeSavedM3,
    carbonAvoidedKg,
    greenCredits,
  };
}
