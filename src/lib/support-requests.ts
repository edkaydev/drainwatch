import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore";
import { getDb } from "./firebase";
import { cleanText, normaliseSingleLine } from "./validation";

export const SUPPORT_MESSAGE_MIN = 5;
export const SUPPORT_MESSAGE_MAX = 500;

export type SupportRequestStatus = "open" | "claimed" | "resolved";

export type SupportRequest = {
  id: string;
  message: string;
  contactName?: string;
  contactPhone?: string;
  status: SupportRequestStatus;
  claimedBy?: string;
  claimedByName?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type StaffMember = {
  uid: string;
  name: string;
};

function isSupportRequestStatus(value: unknown): value is SupportRequestStatus {
  return value === "open" || value === "claimed" || value === "resolved";
}

function asDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return new Date(0);
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function docToSupportRequest(id: string, data: DocumentData): SupportRequest {
  return {
    id,
    message: asString(data.message),
    contactName: asString(data.contactName) || undefined,
    contactPhone: asString(data.contactPhone) || undefined,
    status: isSupportRequestStatus(data.status) ? data.status : "open",
    claimedBy: asString(data.claimedBy) || undefined,
    claimedByName: asString(data.claimedByName) || undefined,
    createdAt: asDate(data.createdAt),
    updatedAt: asDate(data.updatedAt),
  };
}

export type SupportRequestDraft = {
  message: string;
  contactName?: string;
  contactPhone?: string;
};

export function validateSupportRequest(draft: SupportRequestDraft): string | null {
  const message = cleanText(draft.message);
  if (message.length < SUPPORT_MESSAGE_MIN) {
    return `Add at least ${SUPPORT_MESSAGE_MIN} characters so staff know what you need.`;
  }
  if (message.length > SUPPORT_MESSAGE_MAX) {
    return `Keep the message under ${SUPPORT_MESSAGE_MAX} characters.`;
  }
  return null;
}

export async function createSupportRequest(draft: SupportRequestDraft): Promise<string> {
  const error = validateSupportRequest(draft);
  if (error) throw new Error(error);

  const db = getDb();
  const requestRef = doc(collection(db, "supportRequests"));

  const data: Record<string, unknown> = {
    message: cleanText(draft.message).slice(0, SUPPORT_MESSAGE_MAX),
    status: "open",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const contactName = normaliseSingleLine(draft.contactName ?? "").slice(0, 80);
  const contactPhone = normaliseSingleLine(draft.contactPhone ?? "").slice(0, 30);
  if (contactName) data.contactName = contactName;
  if (contactPhone) data.contactPhone = contactPhone;

  await setDoc(requestRef, data);

  return requestRef.id;
}

export function subscribeSupportRequests(
  next: (requests: SupportRequest[]) => void,
  onError: (error: Error) => void,
  max = 200,
): Unsubscribe {
  const q = query(
    collection(getDb(), "supportRequests"),
    orderBy("createdAt", "desc"),
    limit(max),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      next(snapshot.docs.map((item) => docToSupportRequest(item.id, item.data())));
    },
    (error) => onError(error),
  );
}

export async function claimSupportRequest(
  requestId: string,
  staff: StaffMember,
): Promise<void> {
  await updateDoc(doc(getDb(), "supportRequests", requestId), {
    status: "claimed",
    claimedBy: staff.uid,
    claimedByName: staff.name,
    updatedAt: serverTimestamp(),
  });
}

export async function resolveSupportRequest(
  requestId: string,
  staff: StaffMember,
): Promise<void> {
  await updateDoc(doc(getDb(), "supportRequests", requestId), {
    status: "resolved",
    claimedBy: staff.uid,
    claimedByName: staff.name,
    updatedAt: serverTimestamp(),
  });
}
