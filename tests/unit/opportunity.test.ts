import { opportunitySchema, applicationSchema, offerSchema } from "@/features/opportunity/schemas";

/**
 * Unit Test: Opportunity Zod input verification.
 */
export function verifyOpportunitySchema(): boolean {
  const validOpportunity = {
    title: "Expert Plumber Needed for Village House",
    description: "Looking for an experienced plumber to fix leakage issues in a domestic household. Work is expected to take 3 hours.",
    categoryId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    typeId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
    pricingModel: "hourly" as const,
    salaryMin: 150,
    salaryMax: 250,
    currency: "INR",
    houseNumber: "No. 45",
    street: "Main Bazaar Road",
    district: "Guntur",
    state: "Andhra Pradesh",
    pincode: "522002",
    latitude: 16.3067,
    longitude: 80.4365,
    hiringRadiusMeters: 5000,
  };

  const checkValid = opportunitySchema.safeParse(validOpportunity);
  if (!checkValid.success) {
    throw new Error(`Valid opportunity failed validation check: ${JSON.stringify(checkValid.error.flatten())}`);
  }

  // Check invalid title length
  const shortTitleOpportunity = { ...validOpportunity, title: "Plum" };
  const checkShort = opportunitySchema.safeParse(shortTitleOpportunity);
  if (checkShort.success) {
    throw new Error("Validation breach: Title under 5 characters was accepted.");
  }

  // Check invalid latitude check
  const badLatOpportunity = { ...validOpportunity, latitude: 120 };
  const checkBadLat = opportunitySchema.safeParse(badLatOpportunity);
  if (checkBadLat.success) {
    throw new Error("Validation breach: Latitude out of range was accepted.");
  }

  return true;
}

/**
 * Unit Test: Opportunity applications schemas.
 */
export function verifyApplicationSchema(): boolean {
  const validApplication = {
    opportunityId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    coverLetter: "Interested in the role, I have 5 years experience in local repairs.",
    resumeUrl: "https://jobnest.io/resumes/worker-123.pdf",
    voiceIntroUrl: "https://jobnest.io/voice/worker-123.mp3",
    expectedSalary: 12000,
  };

  const checkValid = applicationSchema.safeParse(validApplication);
  if (!checkValid.success) {
    throw new Error(`Valid application failed validation: ${JSON.stringify(checkValid.error.flatten())}`);
  }

  const shortLetterApplication = { ...validApplication, coverLetter: "Hi" };
  const checkShort = applicationSchema.safeParse(shortLetterApplication);
  if (checkShort.success) {
    throw new Error("Validation breach: Short cover letter accepted.");
  }

  return true;
}

/**
 * Unit Test: Work Offer validation rules.
 */
export function verifyOfferSchema(): boolean {
  const validOffer = {
    opportunityId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    workerId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33",
    salaryOffered: 15000,
    terms: "Contract includes weekly payouts, working hours from 9 AM to 5 PM.",
  };

  const checkValid = offerSchema.safeParse(validOffer);
  if (!checkValid.success) {
    throw new Error(`Valid offer failed validation check: ${JSON.stringify(checkValid.error.flatten())}`);
  }

  const negativeSalaryOffer = { ...validOffer, salaryOffered: -50 };
  const checkNegative = offerSchema.safeParse(negativeSalaryOffer);
  if (checkNegative.success) {
    throw new Error("Security breach: Negative salaries accepted in offers.");
  }

  return true;
}
