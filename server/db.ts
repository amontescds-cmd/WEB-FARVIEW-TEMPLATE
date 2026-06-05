import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  Client,
  InsertClient,
  InsertInsight,
  InsertUser,
  InsertVisionVersion,
  clients,
  insights,
  users,
  visionVersions,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;

  textFields.forEach((field) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  });

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Clients ──────────────────────────────────────────────────────────────────

export async function createClient(data: InsertClient): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(clients).values(data);
}

export async function getClientsByUserId(userId: number): Promise<Client[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(clients)
    .where(eq(clients.userId, userId))
    .orderBy(desc(clients.createdAt));
}

export async function getClientById(id: number, userId: number): Promise<Client | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.userId, userId)))
    .limit(1);
  return result[0];
}

export async function updateClient(
  id: number,
  userId: number,
  data: Partial<InsertClient>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(clients)
    .set(data)
    .where(and(eq(clients.id, id), eq(clients.userId, userId)));
}

export async function deleteClient(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(clients).where(and(eq(clients.id, id), eq(clients.userId, userId)));
}

// ─── Insights ─────────────────────────────────────────────────────────────────

export async function createInsight(data: InsertInsight) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(insights).values(data);
}

export async function getInsightsByClientId(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(insights)
    .where(eq(insights.clientId, clientId))
    .orderBy(desc(insights.createdAt));
}

export async function deleteInsight(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(insights).where(eq(insights.id, id));
}

// ─── Vision Versions ──────────────────────────────────────────────────────────

export async function createVisionVersion(data: InsertVisionVersion) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(visionVersions).values(data);
}

export async function getVisionVersionsByClientId(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(visionVersions)
    .where(eq(visionVersions.clientId, clientId))
    .orderBy(desc(visionVersions.createdAt));
}

export async function getVisionVersionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(visionVersions)
    .where(eq(visionVersions.id, id))
    .limit(1);
  return result[0];
}

export async function updateVisionVersion(
  id: number,
  data: Partial<InsertVisionVersion>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(visionVersions).set(data).where(eq(visionVersions.id, id));
}

export async function setVisionFinal(clientId: number, versionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Unmark all versions for this client
  await db
    .update(visionVersions)
    .set({ isFinal: 0 })
    .where(eq(visionVersions.clientId, clientId));
  // Mark the selected version as final
  await db
    .update(visionVersions)
    .set({ isFinal: 1 })
    .where(eq(visionVersions.id, versionId));
}

export async function deleteVisionVersion(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(visionVersions).where(eq(visionVersions.id, id));
}

export async function getNextVersionNumber(clientId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 1;
  const existing = await db
    .select()
    .from(visionVersions)
    .where(eq(visionVersions.clientId, clientId));
  return existing.length + 1;
}
