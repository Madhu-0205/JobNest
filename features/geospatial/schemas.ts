import { z } from "zod";

// Bounding boxes for India coordinate verification: Lat [6.0, 36.0], Lon [68.0, 98.0]
const isWithinIndia = (lat: number, lon: number) => {
  return lat >= 6.0 && lat <= 36.0 && lon >= 68.0 && lon <= 98.0;
};

export const geocodeInputSchema = z.object({
  address: z.string().min(3, "Address query must be at least 3 characters long."),
  locale: z.string().optional().default("en"),
});

export const reverseGeocodeInputSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  locale: z.string().optional().default("en"),
}).refine(data => isWithinIndia(data.latitude, data.longitude), {
  message: "Warning: Coordinates fall outside India region boundaries.",
  path: ["latitude"],
});

export const routeRequestSchema = z.object({
  startLatitude: z.number().min(-90).max(90),
  startLongitude: z.number().min(-180).max(180),
  endLatitude: z.number().min(-90).max(90),
  endLongitude: z.number().min(-180).max(180),
  mode: z.enum(["driving-car", "foot-walking", "cycling-regular"]).optional().default("driving-car"),
  criteria: z.enum(["fastest", "shortest", "alternative"]).optional().default("fastest"),
  waypoints: z.array(
    z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    })
  ).optional().default([]),
});

export const etaRequestSchema = z.object({
  startLatitude: z.number().min(-90).max(90),
  startLongitude: z.number().min(-180).max(180),
  endLatitude: z.number().min(-90).max(90),
  endLongitude: z.number().min(-180).max(180),
  mode: z.enum(["driving-car", "foot-walking", "cycling-regular"]).optional().default("driving-car"),
  departureTime: z.string().optional(),
});

export const gpsPingSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().positive(),
  signalQuality: z.enum(["bad", "average", "good", "excellent"]).optional().default("good"),
  timestamp: z.number().optional(), // Unix timestamp (ms)
});

export const geofenceEventSchema = z.object({
  geofenceId: z.string().uuid(),
  eventType: z.enum(["enter", "leave"]),
  correlationId: z.string().optional(),
});

export const saveLocationSchema = z.object({
  label: z.string().min(1, "Location label is required."),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  plusCode: z.string().optional(),
  houseNumber: z.string().optional(),
  street: z.string().optional(),
  landmark: z.string().optional(),
  village: z.string().optional(),
  town: z.string().optional(),
  city: z.string().optional(),
  mandalTaluk: z.string().optional(),
  district: z.string().min(1, "District is required."),
  state: z.string().min(1, "State is required."),
  country: z.string().optional().default("India"),
  pincode: z.string().min(6, "Indian pin code must be at least 6 digits."),
});
