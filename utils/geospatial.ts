export interface LatLon {
  latitude: number;
  longitude: number;
}

export interface NormalizedAddress {
  displayName: string;
  latitude: number;
  longitude: number;
  geohash: string;
  plusCode: string;
  houseNumber?: string;
  street?: string;
  landmark?: string;
  village?: string;
  town?: string;
  city?: string;
  mandalTaluk?: string;
  district: string;
  state: string;
  country: string;
  pincode: string;
}

export interface RouteResult {
  distanceMeters: number;
  durationSeconds: number;
  coordinates: [number, number][]; // Array of [lon, lat]
  mode: string;
  criteria: string;
  alternatives?: {
    distanceMeters: number;
    durationSeconds: number;
    coordinates: [number, number][];
  }[];
}

export interface TravelEstimate {
  distanceMeters: number;
  durationSeconds: number;
  trafficFactor: number;
  departureTime: string;
  arrivalTime: string;
  isRecalculationNeeded: boolean;
}

export interface SpoofCheckResult {
  isSpoofed: boolean;
  reason?: string;
  speedMps?: number;
  accuracyMeters?: number;
}

/**
 * Computes straight-line distance between two coordinates using the Haversine formula.
 */
export function calculateDistance(p1: LatLon, p2: LatLon): number {
  const R = 6371000; // Earth radius in meters
  const rad = Math.PI / 180;
  
  const dLat = (p2.latitude - p1.latitude) * rad;
  const dLon = (p2.longitude - p1.longitude) * rad;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(p1.latitude * rad) * Math.cos(p2.latitude * rad) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // distance in meters
}

/**
 * Encodes coordinates into a Base32 Geohash string.
 */
export function encodeGeoHash(latitude: number, longitude: number, precision = 9): string {
  const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";
  let isEven = true;
  let latMin = -90, latMax = 90;
  let lonMin = -180, lonMax = 180;
  let geohash = "";
  let bit = 0;
  let ch = 0;

  while (geohash.length < precision) {
    let mid: number;
    if (isEven) {
      mid = (lonMin + lonMax) / 2;
      if (longitude > mid) {
        ch |= (1 << (4 - bit));
        lonMin = mid;
      } else {
        lonMax = mid;
      }
    } else {
      mid = (latMin + latMax) / 2;
      if (latitude > mid) {
        ch |= (1 << (4 - bit));
        latMin = mid;
      } else {
        latMax = mid;
      }
    }

    isEven = !isEven;
    if (bit < 4) {
      bit++;
    } else {
      geohash += BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }
  return geohash;
}

/**
 * Generates standard Plus Code format mapping for coordinates.
 */
export function encodePlusCode(latitude: number, longitude: number): string {
  const ALPHABET = "23456789CFGHJMPQRVWX";
  
  // Grid alignment shift
  const lat = latitude + 90;
  const lon = longitude + 180;
  
  let code = "";
  let latVal = lat;
  let lonVal = lon;
  
  let latGrid = 180;
  let lonGrid = 360;
  
  for (let i = 0; i < 5; i++) {
    const latStep = latGrid / 20;
    const lonStep = lonGrid / 20;
    
    const latIdx = Math.floor(latVal / latStep);
    const lonIdx = Math.floor(lonVal / lonStep);
    
    code += ALPHABET[Math.min(latIdx, 19)] + ALPHABET[Math.min(lonIdx, 19)];
    
    latVal -= latIdx * latStep;
    lonVal -= lonIdx * lonStep;
    
    latGrid = latStep;
    lonGrid = lonStep;
    
    if (i === 3) {
      code += "+";
    }
  }
  
  return "8F" + code;
}

/**
 * Builds localized directions prompts template array for navigation guidance.
 */
export function generateVoiceDirections(route: RouteResult, locale = "en"): string[] {
  const directions: string[] = [];
  const distanceKm = (route.distanceMeters / 1000).toFixed(1);
  
  const templates: Record<string, { start: string; walk: string; turnLeft: string; turnRight: string; arrive: string }> = {
    en: {
      start: `Starting journey of ${distanceKm} kilometers.`,
      walk: "Head straight along the main road.",
      turnLeft: "In 100 meters, turn left.",
      turnRight: "In 100 meters, turn right.",
      arrive: "You have arrived at your destination.",
    },
    hi: {
      start: `${distanceKm} किलोमीटर की यात्रा शुरू हो रही है।`,
      walk: "मुख्य सड़क पर सीधे चलें।",
      turnLeft: "100 मीटर में, बाएं मुड़ें।",
      turnRight: "100 मीटर में, दाएं मुड़ें।",
      arrive: "आप अपने गंतव्य पर पहुंच गए हैं।",
    },
    te: {
      start: `${distanceKm} కిలోమీటర్ల ప్రయాణం ప్రారంభమవుతుంది.`,
      walk: "ప్రధాన రహదారి వెంట తిన్నగా వెళ్ళండి.",
      turnLeft: "100 మీటర్లలో, ఎడమ వైపు తిరగండి.",
      turnRight: "100 మీటర్లలో, కుడి వైపు తిరగండి.",
      arrive: "మీరు గమ్యస్థానానికి చేరుకున్నారు.",
    },
    ta: {
      start: `${distanceKm} கிலோமீட்டர் பயணம் தொடங்குகிறது.`,
      walk: "பிரதான சாலையில் நேராக செல்லவும்.",
      turnLeft: "100 மீட்டரில், இடதுபுறம் திரும்பவும்.",
      turnRight: "100 மீட்டரில், வலதுபுறம் திரும்பவும்.",
      arrive: "நீங்கள் இலக்கை அடைந்துவிட்டீர்கள்.",
    },
    kn: {
      start: `${distanceKm} ಕಿಲೋಮೀಟರ್ ಪ್ರಯಾಣ ಪ್ರಾರಂಭವಾಗುತ್ತದೆ.`,
      walk: "ಮುಖ್ಯ ರಸ್ತೆಯಲ್ಲಿ ನೇರವಾಗಿ ಸಾಗಿ.",
      turnLeft: "100 ಮೀಟರ್‌ನಲ್ಲಿ, ಎಡಕ್ಕೆ ತಿರುಗಿ.",
      turnRight: "100 ಮೀಟರ್‌ನಲ್ಲಿ, ಬಲಕ್ಕೆ ತಿರುಗಿ.",
      arrive: "ನೀವು ತಲುಪಬೇಕಾದ ಸ್ಥಳವನ್ನು ತಲುಪಿದ್ದೀರಿ.",
    },
    mr: {
      start: `${distanceKm} किलोमीटरचा प्रवास सुरू होत आहे.`,
      walk: "मुख्य रस्त्याने सरळ जा.",
      turnLeft: "100 मीटरवर, डावीकडे वळा.",
      turnRight: "100 मीटरवर, उजवीकडे वळा.",
      arrive: "तुम्ही तुमच्या गंतव्यस्थानी पोहोचला आहात.",
    },
  };

  const strings = templates[locale] || templates["en"];

  directions.push(strings.start);
  directions.push(strings.walk);
  
  if (route.distanceMeters > 500) {
    directions.push(strings.turnLeft);
    directions.push(strings.walk);
    directions.push(strings.turnRight);
  }
  
  directions.push(strings.arrive);
  return directions;
}
