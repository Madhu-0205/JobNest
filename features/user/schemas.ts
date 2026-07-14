import { z } from "zod";

export const workerProfileSchema = z.object({
  jobTitle: z.string().min(2, "Job title must be at least 2 characters."),
  bio: z.string().min(10, "Bio must be at least 10 characters."),
  experienceYears: z.number().int().min(0, "Experience cannot be negative."),
  serviceRadiusMeters: z.number().int().min(100, "Service radius must be at least 100 meters."),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  preferredWorkArea: z.string().optional(),
  travelDistanceKm: z.number().int().min(0).optional(),
});

export const employerProfileSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters.").optional(),
  companyWebsite: z.string().url("Invalid website URL format.").or(z.string().length(0)).optional(),
  industry: z.string().min(2, "Industry must be at least 2 characters.").optional(),
  bio: z.string().min(10, "Company description must be at least 10 characters.").optional(),
});

export const kycDocumentSchema = z.object({
  documentType: z.enum(["Aadhar", "PAN", "Passport", "DrivingLicense", "VoterId"]),
  documentNumber: z.string().min(4, "Document verification number is required."),
  fileUrl: z.string().url("Invalid document upload file URL format."),
});

export const experienceSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters."),
  roleTitle: z.string().min(2, "Role title must be at least 2 characters."),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid start date format (YYYY-MM-DD)."),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid end date format (YYYY-MM-DD).").or(z.string().length(0)).optional(),
  description: z.string().optional(),
});

export const educationSchema = z.object({
  institution: z.string().min(2, "Institution must be at least 2 characters."),
  degree: z.string().min(2, "Degree must be at least 2 characters."),
  fieldOfStudy: z.string().min(2, "Field of study must be at least 2 characters.").optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid start date format (YYYY-MM-DD)."),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid end date format (YYYY-MM-DD).").or(z.string().length(0)).optional(),
});

export const certificationSchema = z.object({
  name: z.string().min(2, "Certification name must be at least 2 characters."),
  issuingOrganization: z.string().min(2, "Issuing organization must be at least 2 characters."),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid issue date format (YYYY-MM-DD)."),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid expiry date format (YYYY-MM-DD).").or(z.string().length(0)).optional(),
  credentialId: z.string().optional(),
  credentialUrl: z.string().url("Invalid credential URL format.").or(z.string().length(0)).optional(),
});

export const portfolioItemSchema = z.object({
  title: z.string().min(2, "Portfolio project title must be at least 2 characters."),
  description: z.string().min(10, "Project description must be at least 10 characters.").optional(),
  mediaUrl: z.string().url("Invalid project media file URL.").or(z.string().length(0)).optional(),
  projectUrl: z.string().url("Invalid project link URL.").or(z.string().length(0)).optional(),
});
