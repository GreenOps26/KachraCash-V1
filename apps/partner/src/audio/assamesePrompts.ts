/**
 * Colloquial Assamese (as-IN) Voice Engine Prompt Dictionary
 * Tailored for low-literacy collectors operating across Guwahati streets.
 */
export const assamesePrompts = {
  dispatch: {
    textAs: 'নতুন ভঙা-কুহিলা আহিছে। গ্ৰহণ কৰিবলৈ সেউজীয়া বোটামটো টিপক।',
    textEn: 'New pickup request. Tap green button to accept.',
  },
  navigation: {
    textAs: 'গ্ৰাহকৰ ঘৰলৈ যাবলৈ ৰাস্তা দেখুওৱা হৈছে। ফোন কৰিবলৈ নীলা বোটাম টিপক।',
    textEn: 'Route displayed. Tap blue button to call.',
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
  emergency: {
    textAs: 'সহায়ক জৰুৰী যোগাযোগ আৰম্ভ হৈছে। গুৱাহাটী নিয়ন্ত্ৰণ কক্ষৰ সৈতে সংযোগ কৰা হৈছে।',
    textEn: 'Emergency SOS triggered. Connecting to Guwahati Operations Desk.',
  },
  offlineQueued: {
    textAs: 'নেটৱৰ্ক সংযোগ নাই। কাৰ্য্যটো অফলাইন মজুত কৰা হৈছে। সংযোগ পালে নিজে নিজে ছিংক হ\'ব।',
    textEn: 'No cellular network. Transaction signed and queued locally in SQLite. Will sync automatically.',
  },
  lowFloat: {
    textAs: 'ৱালেটত জমা টকা কমি গৈছে। অনুগ্ৰহ কৰি টপ-আপ কৰক।',
    textEn: 'Wallet float balance is low. Please topup to accept more pickups.',
  },
  syncSuccess: (count: number) => ({
    textAs: `${count} টা অফলাইন কাৰ্য্য চাৰ্ভাৰত সফলভাৱে ছিংক হ\'ল।`,
    textEn: `${count} offline transaction(s) synced successfully with server.`,
  }),
};

export function speakAssamesePrompt(key: keyof typeof assamesePrompts, arg1?: number, arg2?: number) {
  let promptText = '';
  if (key === 'weighing' && typeof arg1 === 'number') {
    promptText = assamesePrompts.weighing(arg1).textAs;
  } else if (key === 'settlement' && typeof arg1 === 'number' && typeof arg2 === 'number') {
    promptText = assamesePrompts.settlement(arg1, arg2).textAs;
  } else if (key === 'syncSuccess' && typeof arg1 === 'number') {
    promptText = assamesePrompts.syncSuccess(arg1).textAs;
  } else {
    const item = assamesePrompts[key];
    if (typeof item === 'object' && 'textAs' in item) {
      promptText = item.textAs;
    }
  }

  // In production Android APK: triggers flutter_tts / android.speech.tts with locale as-IN
  console.log(`[Assamese TTS as-IN]: ${promptText}`);
  return promptText;
}
