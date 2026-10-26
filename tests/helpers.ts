import type { Incident, PublicIncident } from "@/lib/types";

const BASE_DATE = new Date("2026-01-01T00:00:00.000Z");

export function makePublicIncident(
  overrides: Partial<PublicIncident> = {},
): PublicIncident {
  return {
    id: "incident-1",
    category: "blocked_drain",
    severity: "medium",
    title: "Blocked drain",
    status: "new",
    location: { lat: 0.3476, lng: 32.5825 },
    createdAt: BASE_DATE,
    updatedAt: BASE_DATE,
    ...overrides,
  };
}

export function makeIncident(overrides: Partial<Incident> = {}): Incident {
  return {
    id: "incident-1",
    category: "blocked_drain",
    severity: "medium",
    title: "Blocked drain",
    description: "A drain is blocked and water cannot flow past the rubbish.",
    location: { lat: 0.3476, lng: 32.5825 },
    reporter: { name: "Test Reporter" },
    photoUrls: [],
    status: "new",
    statusHistory: [
      {
        status: "new",
        at: BASE_DATE,
        by: null,
        byName: "Public reporter",
      },
    ],
    createdAt: BASE_DATE,
    updatedAt: BASE_DATE,
    ...overrides,
  };
}

export { BASE_DATE };
