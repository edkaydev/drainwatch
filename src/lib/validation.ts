import {
  isIncidentCategory,
  isSeverity,
  isUrgency,
  type AIClassification,
  type IncidentCategory,
  type ReporterInfo,
  type Severity,
} from "./types";

export const DESCRIPTION_MIN = 20;
export const DESCRIPTION_MAX = 1200;
export const TITLE_MAX = 120;
export const ADDRESS_MAX = 200;
export const REPORTER_NAME_MAX = 80;
export const MAX_PHOTOS = 3;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_PHOTO_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const ACCEPTED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export type ImageMimeType = (typeof ACCEPTED_IMAGE_MIME_TYPES)[number];
export const MAX_IMAGE_BASE64_LENGTH = 2 * 1024 * 1024;

export function isImageMimeType(value: unknown): value is ImageMimeType {
  return (ACCEPTED_IMAGE_MIME_TYPES as readonly unknown[]).includes(value);
}

// Expanded to cover Kampala, Nkozi/UMU (~72 km SW), and surrounding greater Uganda area.
const KAMPALA_BOUNDS = {
  minLat: -0.35,
  maxLat: 0.85,
  minLng: 31.7,
  maxLng: 33.1,
};

export type DraftLocation = {
  lat: number | null;
  lng: number | null;
  address?: string;
  division?: string;
};

export type ReportDraft = {
  category: IncidentCategory | "";
  severity: Severity | "";
  title: string;
  description: string;
  location: DraftLocation;
  reporter: ReporterInfo;
};

export type ReportErrors = Partial<
  Record<
    "category" | "severity" | "title" | "description" | "location" | "reporter",
    string
  >
>;

export function cleanText(value: string): string {
  return value.replace(/\u0000/g, "").trim();
}

export function normaliseSingleLine(value: string): string {
  return cleanText(value).replace(/\s+/g, " ");
}

export function sanitizeDraft(draft: ReportDraft): ReportDraft {
  return {
    category: draft.category,
    severity: draft.severity,
    title: normaliseSingleLine(draft.title).slice(0, TITLE_MAX),
    description: cleanText(draft.description).slice(0, DESCRIPTION_MAX),
    location: {
      lat: draft.location.lat,
      lng: draft.location.lng,
      address: normaliseSingleLine(draft.location.address ?? "").slice(0, ADDRESS_MAX),
      division: normaliseSingleLine(draft.location.division ?? "").slice(0, 80),
    },
    reporter: {
      name: normaliseSingleLine(draft.reporter.name ?? "").slice(0, REPORTER_NAME_MAX),
      phone: normaliseSingleLine(draft.reporter.phone ?? "").slice(0, 30),
      email: normaliseSingleLine(draft.reporter.email ?? "").slice(0, 120),
    },
  };
}

export function validateCoordinates(lat: number | null, lng: number | null): string | null {
  if (lat === null || lng === null || Number.isNaN(lat) || Number.isNaN(lng)) {
    return "Drop a pin or enter the incident coordinates.";
  }

  if (
    lat < KAMPALA_BOUNDS.minLat ||
    lat > KAMPALA_BOUNDS.maxLat ||
    lng < KAMPALA_BOUNDS.minLng ||
    lng > KAMPALA_BOUNDS.maxLng
  ) {
    return "This location is outside the Kampala service area. Pick a point inside Kampala.";
  }

  return null;
}

export function validateReporter(reporter: ReporterInfo): string | null {
  const phone = (reporter.phone ?? "").trim();
  if (phone && !/^[+0-9()\-\s]{7,30}$/.test(phone)) {
    return "Enter a valid phone number, or leave it blank.";
  }

  const email = (reporter.email ?? "").trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Enter a valid email address, or leave it blank.";
  }

  return null;
}

export function validateDraft(draft: ReportDraft, hasPhotos = false): ReportErrors {
  const errors: ReportErrors = {};

  if (!isIncidentCategory(draft.category)) {
    errors.category = "Choose the type of drainage hazard.";
  }

  if (!isSeverity(draft.severity)) {
    errors.severity = "Choose how severe the hazard is.";
  }

  const description = cleanText(draft.description);
  const descriptionMin = hasPhotos ? 0 : DESCRIPTION_MIN;
  if (description.length < descriptionMin) {
    errors.description = `Add at least ${DESCRIPTION_MIN} characters so staff can act on the report.`;
  } else if (description.length > DESCRIPTION_MAX) {
    errors.description = `Keep the description under ${DESCRIPTION_MAX} characters.`;
  }

  if (draft.title.length > TITLE_MAX) {
    errors.title = `Keep the title under ${TITLE_MAX} characters.`;
  }

  const locationError = validateCoordinates(draft.location.lat, draft.location.lng);
  if (locationError) {
    errors.location = locationError;
  }

  const reporterError = validateReporter(draft.reporter);
  if (reporterError) {
    errors.reporter = reporterError;
  }

  return errors;
}

export function isDraftReady(draft: ReportDraft): boolean {
  return Object.keys(validateDraft(draft)).length === 0;
}

export type ClassifyRequest = {
  description: string;
  category?: IncidentCategory;
  severity?: Severity;
  imageBase64?: string;
  imageMimeType?: ImageMimeType;
};

export function parseClassifyRequest(value: unknown): ClassifyRequest | null {
  if (typeof value !== "object" || value === null) return null;

  const record = value as Record<string, unknown>;
  if (typeof record.description !== "string") return null;

  const description = cleanText(record.description);
  if (description.length < 5 || description.length > 4000) return null;

  let imageBase64: string | undefined;
  let imageMimeType: ImageMimeType | undefined;

  if (typeof record.imageBase64 === "string" && record.imageBase64.length > 0) {
    if (record.imageBase64.length > MAX_IMAGE_BASE64_LENGTH) return null;
    if (!isImageMimeType(record.imageMimeType)) return null;
    imageBase64 = record.imageBase64;
    imageMimeType = record.imageMimeType;
  }

  return {
    description,
    category: isIncidentCategory(record.category) ? record.category : undefined,
    severity: isSeverity(record.severity) ? record.severity : undefined,
    imageBase64,
    imageMimeType,
  };
}

export function isAIClassification(value: unknown): value is AIClassification {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;

  return (
    isIncidentCategory(record.category) &&
    isSeverity(record.severity) &&
    isUrgency(record.urgency) &&
    typeof record.summary === "string" &&
    record.summary.length > 0 &&
    record.summary.length <= 280 &&
    typeof record.confidence === "number" &&
    record.confidence >= 0 &&
    record.confidence <= 1 &&
    (record.source === "gemini" || record.source === "fallback")
  );
}

export function photoError(file: File): string | null {
  if (!ACCEPTED_PHOTO_TYPES.includes(file.type as (typeof ACCEPTED_PHOTO_TYPES)[number])) {
    return "Use a JPEG, PNG, or WebP image.";
  }

  if (file.size > MAX_PHOTO_BYTES) {
    return "Each photo must be 5 MB or smaller.";
  }

  return null;
}
