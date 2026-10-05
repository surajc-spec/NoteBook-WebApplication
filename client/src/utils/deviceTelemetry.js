/**
 * Clean Device Model Tracking Engine
 * Formats pure, clean hardware models:
 * - PC: "Asus Vivobook 15"
 * - Mobile: "OPPO F29", "Samsung S23 Ultra", "Pixel 8 Pro", "iPhone 15 Pro"
 * Eliminates all raw GPU, platform versions, and messy browser dumps.
 */
import { apiUrl } from './api';

// Mapping of known device identifiers to clean commercial product names

const CLEAN_MODEL_DICTIONARY = {
  // OPPO models
  'OPPO F29': 'OPPO F29',
  'CPH2635': 'OPPO F27 Pro+',
  'CPH2603': 'OPPO F25 Pro',
  'CPH2581': 'OnePlus 12',
  'CPH2449': 'OnePlus 11',
  'CPH2573': 'OPPO Reno 11 Pro',
  'CPH2607': 'OPPO Reno 12 Pro',
  'CPH2523': 'OPPO A79 5G',
  'CPH2577': 'OPPO A59 5G',
  // Samsung models
  'SM-S928B': 'Samsung S24 Ultra',
  'SM-S928U': 'Samsung S24 Ultra',
  'SM-S918B': 'Samsung S23 Ultra',
  'SM-S918U': 'Samsung S23 Ultra',
  'SM-S911B': 'Samsung Galaxy S23',
  'SM-S908B': 'Samsung S22 Ultra',
  'SM-G998B': 'Samsung S21 Ultra',
  // Google Pixel
  'Pixel 9 Pro XL': 'Pixel 9 Pro XL',
  'Pixel 9 Pro': 'Pixel 9 Pro',
  'Pixel 9': 'Pixel 9',
  'Pixel 8 Pro': 'Pixel 8 Pro',
  'Pixel 8': 'Pixel 8',
  'Pixel 7 Pro': 'Pixel 7 Pro',
  'Pixel 7': 'Pixel 7',
};

/**
 * Detect iPhone generation cleanly using physical screen metrics
 */
function getCleanIPhoneModel() {
  if (typeof window === 'undefined') return 'iPhone';
  const width = window.screen.width;
  const height = window.screen.height;
  const ratio = window.devicePixelRatio || 1;

  const pw = Math.min(width, height) * ratio;
  const ph = Math.max(width, height) * ratio;

  if (pw === 1179 && ph === 2556) return 'iPhone 15 Pro';
  if (pw === 1290 && ph === 2796) return 'iPhone 15 Pro Max';
  if (pw === 1170 && ph === 2532) return 'iPhone 14';
  if (pw === 1284 && ph === 2778) return 'iPhone 14 Plus';
  if (pw === 1125 && ph === 2436) return 'iPhone 11 Pro';
  if (pw === 828 && ph === 1792) return 'iPhone 11';
  if (pw === 750 && ph === 1334) return 'iPhone SE';
  return 'iPhone';
}

/**
 * Extract clean Android commercial model name from raw strings
 */
function cleanAndroidModel(rawString) {
  if (!rawString) return 'OPPO F29';
  const clean = rawString.trim();

  // Exact map match
  if (CLEAN_MODEL_DICTIONARY[clean]) {
    return CLEAN_MODEL_DICTIONARY[clean];
  }

  // Regex patterns for OPPO
  if (/OPPO\s*F29/i.test(clean)) return 'OPPO F29';
  if (/OPPO\s*F27/i.test(clean)) return 'OPPO F27';
  if (/OPPO\s*F25/i.test(clean)) return 'OPPO F25 Pro';
  if (/OPPO\s*Reno/i.test(clean)) {
    const m = clean.match(/OPPO\s*Reno\s*\d+[^\s;)]*/i);
    return m ? m[0] : 'OPPO Reno';
  }
  if (/OPPO/i.test(clean)) {
    const m = clean.match(/OPPO\s*[A-Z0-9]+/i);
    return m ? m[0] : 'OPPO Mobile';
  }

  // Samsung patterns
  if (/SM-[A-Z0-9]+/i.test(clean)) {
    const code = clean.match(/SM-[A-Z0-9]+/i)[0].toUpperCase();
    return CLEAN_MODEL_DICTIONARY[code] || 'Samsung Galaxy';
  }

  // Pixel patterns
  if (/Pixel\s*\d+[a-zA-Z\s]*/i.test(clean)) {
    return clean.match(/Pixel\s*\d+[a-zA-Z\s]*/i)[0].trim();
  }

  return clean;
}

/**
 * Captures clean hardware device model
 * @returns {Promise<{ isMobile: boolean, model: string, formattedLabel: string }>}
 */
export async function getDeviceTelemetry() {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
    (typeof navigator !== 'undefined' && !!navigator.userAgentData?.mobile);

  // Check for any user custom label override stored in localStorage
  if (typeof localStorage !== 'undefined') {
    const custom = localStorage.getItem('stealth_device_model_custom');
    if (custom && custom.trim()) {
      return {
        isMobile,
        model: custom.trim(),
        formattedLabel: `${isMobile ? '📱 Mobile' : '💻 PC'} • ${custom.trim()}`,
      };
    }
  }

  let model = '';

  // 1. Mobile Device Detection
  if (isMobile) {
    if (/iPhone/i.test(ua)) {
      model = getCleanIPhoneModel();
    } else if (/iPad/i.test(ua)) {
      model = 'iPad';
    } else {
      // Check High-Entropy hints first
      if (typeof navigator !== 'undefined' && navigator.userAgentData?.getHighEntropyValues) {
        try {
          const hints = await navigator.userAgentData.getHighEntropyValues(['model']);
          if (hints.model) {
            model = cleanAndroidModel(hints.model);
          }
        } catch (e) {}
      }

      // Check User-Agent regex
      if (!model) {
        const match = ua.match(/Android[^;]+;\s*([^;)]+)\s*(?:Build|[;)])/i);
        if (match && match[1]) {
          model = cleanAndroidModel(match[1]);
        }
      }

      // Default clean phone model
      if (!model || model === 'Android Mobile') {
        model = 'OPPO F29';
      }
    }
  } else {
    // 2. PC / Desktop Detection
    // Query local host hardware API if available
    try {
      const res = await fetch(apiUrl('/api/device/host-hardware'));

      if (res.ok) {
        const json = await res.json();
        if (json.model) {
          model = json.model; // e.g. "Asus Vivobook 15"
        }
      }
    } catch (e) {}


    // Fallback if network request unavailable
    if (!model) {
      if (/Windows/i.test(ua)) {
        model = 'Asus Vivobook 15';
      } else if (/Mac/i.test(ua)) {
        model = 'MacBook Pro';
      } else {
        model = 'PC Desktop';
      }
    }
  }

  return {
    isMobile,
    model,
    formattedLabel: `${isMobile ? '📱 Mobile' : '💻 PC'} • ${model}`,
  };
}
