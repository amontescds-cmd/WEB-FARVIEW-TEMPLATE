import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock all DB helpers
vi.mock("./db", () => ({
  getClientsByUserId: vi.fn().mockResolvedValue([
    { id: 1, name: "Empresa Test", industry: "Manufactura", timeHorizon: "5 años", status: "active", description: null, userId: 1, createdAt: new Date(), updatedAt: new Date() },
  ]),
  getClientById: vi.fn().mockResolvedValue({
    id: 1, name: "Empresa Test", industry: "Manufactura", timeHorizon: "5 años", status: "active", description: null, userId: 1, createdAt: new Date(), updatedAt: new Date(),
  }),
  createClient: vi.fn().mockResolvedValue(undefined),
  updateClient: vi.fn().mockResolvedValue(undefined),
  deleteClient: vi.fn().mockResolvedValue(undefined),
  getInsightsByClientId: vi.fn().mockResolvedValue([
    { id: 1, clientId: 1, type: "text", title: "FODA", content: "Fortalezas: liderazgo regional", fileUrl: null, fileKey: null, fileName: null, fileMimeType: null, createdAt: new Date() },
  ]),
  createInsight: vi.fn().mockResolvedValue(undefined),
  deleteInsight: vi.fn().mockResolvedValue(undefined),
  getVisionVersionsByClientId: vi.fn().mockResolvedValue([
    { id: 1, clientId: 1, versionNumber: 1, content: "Ser líderes regionales en manufactura sostenible.", isFinal: 0, refinementInstructions: null, notes: null, prompt: null, createdAt: new Date() },
  ]),
  getVisionVersionById: vi.fn().mockResolvedValue({
    id: 1, clientId: 1, versionNumber: 1, content: "Ser líderes regionales en manufactura sostenible.", isFinal: 0, refinementInstructions: null, notes: null, prompt: null, createdAt: new Date(),
  }),
  createVisionVersion: vi.fn().mockResolvedValue(undefined),
  updateVisionVersion: vi.fn().mockResolvedValue(undefined),
  setVisionFinal: vi.fn().mockResolvedValue(undefined),
  deleteVisionVersion: vi.fn().mockResolvedValue(undefined),
  getNextVersionNumber: vi.fn().mockResolvedValue(2),
}));

// Mock LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "Para 2030, seremos la empresa de manufactura más innovadora y sostenible de la región, reconocida por transformar industrias y mejorar la calidad de vida de nuestras comunidades." } }],
  }),
}));

// Mock storage
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ key: "test-key", url: "/manus-storage/test-key" }),
}));

function createCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("clients router", () => {
  it("list returns clients", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.clients.list();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Empresa Test");
  });

  it("getById returns a client", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.clients.getById({ id: 1 });
    expect(result.id).toBe(1);
    expect(result.industry).toBe("Manufactura");
  });

  it("create returns success", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.clients.create({ name: "Nuevo Cliente", industry: "Retail y Comercio" });
    expect(result.success).toBe(true);
  });

  it("update returns success", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.clients.update({ id: 1, name: "Empresa Actualizada" });
    expect(result.success).toBe(true);
  });

  it("delete returns success", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.clients.delete({ id: 1 });
    expect(result.success).toBe(true);
  });
});

describe("insights router", () => {
  it("list returns insights for a client", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.insights.list({ clientId: 1 });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("FODA");
  });

  it("addText returns success", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.insights.addText({
      clientId: 1,
      title: "Análisis de Mercado",
      content: "El mercado muestra tendencias de crecimiento sostenido...",
    });
    expect(result.success).toBe(true);
  });

  it("delete returns success", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.insights.delete({ id: 1 });
    expect(result.success).toBe(true);
  });
});

describe("vision router", () => {
  it("listVersions returns versions for a client", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.vision.listVersions({ clientId: 1 });
    expect(result).toHaveLength(1);
    expect(result[0].versionNumber).toBe(1);
  });

  it("generate creates a vision version using LLM", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.vision.generate({ clientId: 1 });
    expect(result.success).toBe(true);
    expect(result.content).toContain("manufactura");
    expect(result.versionNumber).toBe(2);
  });

  it("setFinal marks a version as final", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.vision.setFinal({ clientId: 1, versionId: 1 });
    expect(result.success).toBe(true);
  });

  it("updateNotes saves consultant notes", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.vision.updateNotes({ id: 1, notes: "El equipo aprobó esta versión." });
    expect(result.success).toBe(true);
  });

  it("delete removes a vision version", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.vision.delete({ id: 1 });
    expect(result.success).toBe(true);
  });
});
