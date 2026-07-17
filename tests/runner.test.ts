import { test, expect } from "vitest";
import { verifySignUpValidation, verifyLoginValidation, verifyUserAgentParsing, verifyRateLimiting } from "./unit/auth.test";
import { verifyGeohashEncoding, verifyDistanceCalculations, verifyETAEstimation, verifyGPSSecurity } from "./unit/geospatial.test";
import { verifyRequestContextPropagation, verifyResultMonadSuccess, verifyResultMonadFailure } from "./unit/infra.test";
import { verifyOpportunitySchema, verifyApplicationSchema, verifyOfferSchema, verifyTransactionScenario } from "./unit/opportunity.test";
import { verifyEnvLoading } from "./unit/env.test";

test("Environment - verifyEnvLoading", () => {
  expect(verifyEnvLoading()).toBe(true);
});

test("Auth - verifySignUpValidation", () => {
  expect(verifySignUpValidation()).toBe(true);
});

test("Auth - verifyLoginValidation", () => {
  expect(verifyLoginValidation()).toBe(true);
});

test("Auth - verifyUserAgentParsing", () => {
  expect(verifyUserAgentParsing()).toBe(true);
});

test("Security - verifyRateLimiting", async () => {
  expect(await verifyRateLimiting()).toBe(true);
});

test("Geospatial - verifyGeohashEncoding", () => {
  expect(verifyGeohashEncoding()).toBe(true);
});

test("Geospatial - verifyDistanceCalculations", () => {
  expect(verifyDistanceCalculations()).toBe(true);
});

test("Geospatial - verifyETAEstimation", async () => {
  expect(await verifyETAEstimation()).toBe(true);
});

test("Security - verifyGPSSecurity", () => {
  expect(verifyGPSSecurity()).toBe(true);
});

test("Infra - verifyRequestContextPropagation", () => {
  expect(verifyRequestContextPropagation()).toBe(true);
});

test("Infra - verifyResultMonadSuccess", () => {
  expect(verifyResultMonadSuccess()).toBe(true);
});

test("Infra - verifyResultMonadFailure", () => {
  expect(verifyResultMonadFailure()).toBe(true);
});

test("Opportunity - verifyOpportunitySchema", () => {
  expect(verifyOpportunitySchema()).toBe(true);
});

test("Opportunity - verifyApplicationSchema", () => {
  expect(verifyApplicationSchema()).toBe(true);
});

test("Opportunity - verifyOfferSchema", () => {
  expect(verifyOfferSchema()).toBe(true);
});

test("Opportunity - verifyTransactionScenario", async () => {
  expect(await verifyTransactionScenario()).toBe(true);
});
