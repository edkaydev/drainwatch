import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  updateDoc,
  writeBatch,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore";
import { getDb } from "./firebase";
import {
  canTransitionStatus,
  CATEGORY_LABELS,
  isIncidentCategory,
  isIncidentStatus,
  isSeverity,
  isUrgency,
  SEVERITY_LABELS,
  type AIClassification,
  type Incident,
  type IncidentCategory,
  type IncidentLocation,
  type IncidentStatus,
  type PublicIncident,
  type ReporterInfo,
  type StatusChange,
} from "./types";
import {
  cleanText,
  DESCRIPTION_MAX,
  normaliseSingleLine,
  sanitizeDraft,
  TITLE_MAX,
  type ClassifyRequest,
  type ReportDraft,
  type TranscribeRequest,
} from "./validation";

export type StaffMember = {
  uid: string;
  name: string;
};

export type UpdateStatusInput = {
  status: IncidentStatus;
  note?: string;
};

function asDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date(0);
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function parseLocation(value: unknown): IncidentLocation {
  const record =
    typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

  return {
    lat: asNumber(record.lat),
    lng: asNumber(record.lng),
    address: asString(record.address) || undefined,
    division: asString(record.division) || undefined,
  };
}

function parseReporter(value: unknown): ReporterInfo {
  const record =
    typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

  return {
    name: asString(record.name) || undefined,
    phone: asString(record.phone) || undefined,
    email: asString(record.email) || undefined,
  };
}

function parseAI(value: unknown): AIClassification | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const record = value as Record<string, unknown>;

  if (
    !isIncidentCategory(record.category) ||
    !isSeverity(record.severity) ||
    !isUrgency(record.urgency)
  ) {
    return undefined;
  }

  return {
    category: record.category,
    severity: record.severity,
    urgency: record.urgency,
    summary: asString(record.summary),
    confidence: Math.min(1, Math.max(0, asNumber(record.confidence))),
    source: record.source === "gemini" ? "gemini" : "fallback",
    reviewed: record.reviewed === true,
    reviewedBy: asString(record.reviewedBy) || undefined,
    reviewedAt: record.reviewedAt ? asDate(record.reviewedAt) : undefined,
  };
}

function parseStatusHistory(value: unknown, fallbackStatus: IncidentStatus): StatusChange[] {
  if (!Array.isArray(value)) {
    return [
      {
        status: fallbackStatus,
        at: new Date(0),
        by: null,
        byName: "System",
        note: "Status history unavailable",
      },
    ];
  }

  return value.flatMap((entry) => {
    if (typeof entry !== "object" || entry === null) return [];
    const record = entry as Record<string, unknown>;
    if (!isIncidentStatus(record.status)) return [];

    return [
      {
        status: record.status,
        at: asDate(record.at),
        by: asString(record.by) || null,
        byName: asString(record.byName, "DrainWatch"),
        note: asString(record.note) || undefined,
      },
    ];
  });
}

export function docToIncident(id: string, data: DocumentData): Incident {
  const status = isIncidentStatus(data.status) ? data.status : "new";
  const category = isIncidentCategory(data.category) ? data.category : "other";
  const severity = isSeverity(data.severity) ? data.severity : "medium";

  return {
    id,
    category,
    severity,
    title: asString(data.title, CATEGORY_LABELS[category]),
    description: asString(data.description),
    location: parseLocation(data.location),
    reporter: parseReporter(data.reporter),
    photoUrls: Array.isArray(data.photoUrls)
      ? data.photoUrls.filter((url): url is string => typeof url === "string")
      : [],
    status,
    statusHistory: parseStatusHistory(data.statusHistory, status),
    ai: parseAI(data.ai),
    reportedBy: asString(data.reportedBy) || undefined,
    createdAt: asDate(data.createdAt),
    updatedAt: asDate(data.updatedAt),
    resolvedAt: data.resolvedAt ? asDate(data.resolvedAt) : undefined,
  };
}

export function docToPublicIncident(id: string, data: DocumentData): PublicIncident {
  const category = isIncidentCategory(data.category) ? data.category : "other";
  const severity = isSeverity(data.severity) ? data.severity : "medium";
  const status = isIncidentStatus(data.status) ? data.status : "new";

  return {
    id,
    category,
    severity,
    title: asString(data.title, CATEGORY_LABELS[category]),
    status,
    location: parseLocation(data.location),
    photoUrl: asString(data.photoUrl) || undefined,
    createdAt: asDate(data.createdAt),
    updatedAt: asDate(data.updatedAt),
    resolvedAt: data.resolvedAt ? asDate(data.resolvedAt) : undefined,
  };
}

function buildTitle(draft: ReportDraft, category: IncidentCategory): string {
  const title = normaliseSingleLine(draft.title);
  if (title) return title.slice(0, TITLE_MAX);

  const place = draft.location.division || draft.location.address || "Kampala";
  return `${CATEGORY_LABELS[category]} in ${place}`.slice(0, TITLE_MAX);
}

function buildAI(ai: AIClassification | undefined) {
  if (!ai) return undefined;

  return {
    category: ai.category,
    severity: ai.severity,
    urgency: ai.urgency,
    summary: ai.summary.slice(0, 280),
    confidence: ai.confidence,
    source: ai.source,
    reviewed: false,
  };
}

function buildReporter(reporter: ReporterInfo) {
  const result: Record<string, string> = {};
  if (reporter.name) result.name = reporter.name;
  if (reporter.phone) result.phone = reporter.phone;
  if (reporter.email) result.email = reporter.email;
  return result;
}

function buildLocation(location: IncidentLocation) {
  const result: Record<string, string | number> = {
    lat: location.lat,
    lng: location.lng,
  };
  if (location.address) result.address = location.address;
  if (location.division) result.division = location.division;
  return result;
}

export function newIncidentId(): string {
  return doc(collection(getDb(), "incidents")).id;
}

export async function createIncident(input: {
  incidentId: string;
  draft: ReportDraft;
  ai?: AIClassification;
  photoUrls: string[];
  reporterUid?: string;
}): Promise<string> {
  const draft = sanitizeDraft(input.draft);

  if (!isIncidentCategory(draft.category) || !isSeverity(draft.severity)) {
    throw new Error("The report is missing a valid category or severity.");
  }

  const lat = draft.location.lat;
  const lng = draft.location.lng;

  if (typeof lat !== "number" || typeof lng !== "number" || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("The report is missing a valid location.");
  }

  const location = {
    lat,
    lng,
    address: draft.location.address,
    division: draft.location.division,
  };

  const db = getDb();
  const incidentRef = doc(db, "incidents", input.incidentId);
  const publicRef = doc(db, "publicIncidents", input.incidentId);
  const title = buildTitle(draft, draft.category);

  const incidentData: Record<string, unknown> = {
    category: draft.category,
    severity: draft.severity,
    title,
    description: cleanText(draft.description).slice(0, DESCRIPTION_MAX),
    location: buildLocation(location),
    reporter: buildReporter(draft.reporter),
    photoUrls: input.photoUrls,
    status: "new",
    statusHistory: [
      {
        status: "new",
        at: Timestamp.now(),
        by: input.reporterUid ?? null,
        byName: draft.reporter.name || "Public reporter",
        note: "Report submitted",
      },
    ],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (input.reporterUid) incidentData.reportedBy = input.reporterUid;
  const ai = buildAI(input.ai);
  if (ai) incidentData.ai = ai;

  const publicData: Record<string, unknown> = {
    category: draft.category,
    severity: draft.severity,
    title,
    status: "new",
    location: buildLocation(location),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (input.photoUrls[0]) publicData.photoUrl = input.photoUrls[0];

  const batch = writeBatch(db);
  batch.set(incidentRef, incidentData);
  batch.set(publicRef, publicData);
  await batch.commit();

  return input.incidentId;
}

export function subscribeIncidents(
  next: (incidents: Incident[]) => void,
  onError: (error: Error) => void,
  max = 500,
): Unsubscribe {
  const q = query(
    collection(getDb(), "incidents"),
    orderBy("createdAt", "desc"),
    limit(max),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      next(snapshot.docs.map((item) => docToIncident(item.id, item.data())));
    },
    (error) => onError(error),
  );
}

export function subscribePublicIncidents(
  next: (incidents: PublicIncident[]) => void,
  onError: (error: Error) => void,
  max = 1000,
): Unsubscribe {
  const q = query(
    collection(getDb(), "publicIncidents"),
    orderBy("createdAt", "desc"),
    limit(max),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      next(snapshot.docs.map((item) => docToPublicIncident(item.id, item.data())));
    },
    (error) => onError(error),
  );
}

export function subscribeIncident(
  incidentId: string,
  next: (incident: Incident | null) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    doc(getDb(), "incidents", incidentId),
    (snapshot) => {
      next(snapshot.exists() ? docToIncident(snapshot.id, snapshot.data()) : null);
    },
    (error) => onError(error),
  );
}

export async function getIncidentById(incidentId: string): Promise<Incident | null> {
  const snapshot = await getDoc(doc(getDb(), "incidents", incidentId));
  return snapshot.exists() ? docToIncident(snapshot.id, snapshot.data()) : null;
}

export async function updateIncidentStatus(
  incidentId: string,
  input: UpdateStatusInput,
  staff: StaffMember,
): Promise<void> {
  if (!isIncidentStatus(input.status)) {
    throw new Error("Invalid status.");
  }

  const note = normaliseSingleLine(input.note ?? "").slice(0, 500);
  const db = getDb();
  const incidentRef = doc(db, "incidents", incidentId);
  const publicRef = doc(db, "publicIncidents", incidentId);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(incidentRef);
    if (!snapshot.exists()) {
      throw new Error("This incident no longer exists.");
    }

    const data = snapshot.data();
    const currentStatus = isIncidentStatus(data.status) ? data.status : "new";
    if (currentStatus === input.status) {
      throw new Error(`The incident is already marked as ${input.status.replace("_", " ")}.`);
    }

    if (!canTransitionStatus(currentStatus, input.status)) {
      throw new Error(
        `Cannot move an incident from ${currentStatus.replace("_", " ")} to ${input.status.replace("_", " ")}.`,
      );
    }

    if (input.status === "resolved" && note.length < 5) {
      throw new Error("Add a short note explaining how the issue was resolved.");
    }

    const history = Array.isArray(data.statusHistory)
      ? [...data.statusHistory]
      : [];

    history.push({
      status: input.status,
      at: Timestamp.now(),
      by: staff.uid,
      byName: staff.name,
      ...(note ? { note } : {}),
    });

    transaction.update(incidentRef, {
      status: input.status,
      statusHistory: history,
      updatedAt: serverTimestamp(),
      resolvedAt:
        input.status === "resolved" ? serverTimestamp() : null,
    });

    transaction.set(
      publicRef,
      {
        status: input.status,
        updatedAt: serverTimestamp(),
        resolvedAt: input.status === "resolved" ? serverTimestamp() : null,
      },
      { merge: true },
    );
  });
}

export async function applyAISuggestion(
  incidentId: string,
  ai: AIClassification,
  staff: StaffMember,
): Promise<void> {
  const db = getDb();
  const incidentRef = doc(db, "incidents", incidentId);
  const publicRef = doc(db, "publicIncidents", incidentId);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(incidentRef);
    if (!snapshot.exists()) throw new Error("This incident no longer exists.");

    const data = snapshot.data();
    const history = Array.isArray(data.statusHistory)
      ? [...data.statusHistory]
      : [];

    history.push({
      status: isIncidentStatus(data.status) ? data.status : "new",
      at: Timestamp.now(),
      by: staff.uid,
      byName: staff.name,
      note: `AI suggestion applied: ${CATEGORY_LABELS[ai.category]} / ${SEVERITY_LABELS[ai.severity]}`,
    });

    transaction.update(incidentRef, {
      category: ai.category,
      severity: ai.severity,
      statusHistory: history,
      "ai.reviewed": true,
      "ai.reviewedBy": staff.uid,
      "ai.reviewedAt": serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    transaction.set(
      publicRef,
      {
        category: ai.category,
        severity: ai.severity,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  });
}

export async function dismissAISuggestion(
  incidentId: string,
  staff: StaffMember,
): Promise<void> {
  await updateDoc(doc(getDb(), "incidents", incidentId), {
    "ai.reviewed": true,
    "ai.reviewedBy": staff.uid,
    "ai.reviewedAt": serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function requestClassification(
  input: ClassifyRequest,
): Promise<AIClassification> {
  const response = await fetch("/api/classify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const message = await response
      .json()
      .then((data: { error?: string }) => data.error)
      .catch(() => undefined);
    throw new Error(message || "Classification is unavailable right now.");
  }

  return (await response.json()) as AIClassification;
}

export async function requestTranscription(input: TranscribeRequest): Promise<string> {
  const response = await fetch("/api/transcribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = (await response.json().catch(() => ({}))) as {
    transcript?: string;
    error?: string;
  };

  if (!response.ok || typeof data.transcript !== "string") {
    throw new Error(data.error || "Transcription is unavailable right now.");
  }

  return data.transcript;
}

export function incidentToPublic(incident: Incident): PublicIncident {
  return {
    id: incident.id,
    category: incident.category,
    severity: incident.severity,
    title: incident.title,
    status: incident.status,
    location: incident.location,
    photoUrl: incident.photoUrls[0],
    createdAt: incident.createdAt,
    updatedAt: incident.updatedAt,
    resolvedAt: incident.resolvedAt,
  };
}
