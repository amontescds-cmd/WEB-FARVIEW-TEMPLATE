import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import {
  createClient,
  createInsight,
  createVisionVersion,
  deleteClient,
  deleteInsight,
  deleteVisionVersion,
  getClientById,
  getClientsByUserId,
  getInsightsByClientId,
  getNextVersionNumber,
  getVisionVersionById,
  getVisionVersionsByClientId,
  setVisionFinal,
  updateClient,
  updateVisionVersion,
} from "./db";

// Single operator user — no authentication required
const OPERATOR_USER_ID = 1;

// ─── Clients Router ───────────────────────────────────────────────────────────

const clientsRouter = router({
  list: publicProcedure.query(async () => {
    return getClientsByUserId(OPERATOR_USER_ID);
  }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const client = await getClientById(input.id, OPERATOR_USER_ID);
      if (!client) throw new TRPCError({ code: "NOT_FOUND", message: "Cliente no encontrado" });
      return client;
    }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        industry: z.string().optional(),
        timeHorizon: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await createClient({ ...input, userId: OPERATOR_USER_ID, status: "active" });
      return { success: true };
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        industry: z.string().optional(),
        timeHorizon: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(["active", "completed", "archived"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateClient(id, OPERATOR_USER_ID, data);
      return { success: true };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteClient(input.id, OPERATOR_USER_ID);
      return { success: true };
    }),
});

// ─── Insights Router ──────────────────────────────────────────────────────────

const insightsRouter = router({
  list: publicProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ input }) => {
      return getInsightsByClientId(input.clientId);
    }),

  addText: publicProcedure
    .input(
      z.object({
        clientId: z.number(),
        title: z.string().min(1),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      await createInsight({
        clientId: input.clientId,
        type: "text",
        title: input.title,
        content: input.content,
      });
      return { success: true };
    }),

  uploadFile: publicProcedure
    .input(
      z.object({
        clientId: z.number(),
        title: z.string().min(1),
        fileName: z.string(),
        fileMimeType: z.string(),
        fileBase64: z.string(),
        extractedText: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const buffer = Buffer.from(input.fileBase64, "base64");
      const fileKey = `insights/${input.clientId}/${Date.now()}-${input.fileName}`;
      const { url } = await storagePut(fileKey, buffer, input.fileMimeType);

      await createInsight({
        clientId: input.clientId,
        type: "file",
        title: input.title,
        content: input.extractedText ?? null,
        fileUrl: url,
        fileKey,
        fileName: input.fileName,
        fileMimeType: input.fileMimeType,
      });
      return { success: true };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteInsight(input.id);
      return { success: true };
    }),
});

// ─── Vision Router ────────────────────────────────────────────────────────────

const visionRouter = router({
  listVersions: publicProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ input }) => {
      return getVisionVersionsByClientId(input.clientId);
    }),

  generate: publicProcedure
    .input(
      z.object({
        clientId: z.number(),
        refinementInstructions: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const client = await getClientById(input.clientId, OPERATOR_USER_ID);
      if (!client) throw new TRPCError({ code: "NOT_FOUND", message: "Cliente no encontrado" });

      const clientInsights = await getInsightsByClientId(input.clientId);
      if (clientInsights.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "El cliente no tiene insights cargados. Agrega al menos un insight antes de generar la visión.",
        });
      }

      const insightsText = clientInsights
        .map(
          (ins, i) =>
            `Insight ${i + 1} — ${ins.title}:\n${ins.content ?? "[Archivo adjunto sin texto extraído]"}`
        )
        .join("\n\n");

      const systemPrompt = `Eres un consultor experto en planeación estratégica con más de 20 años de experiencia trabajando con organizaciones de alto impacto en América Latina. Tu especialidad es facilitar procesos de construcción de visión estratégica que inspiren, orienten y movilicen a las organizaciones hacia su futuro deseado.

Tu tarea es redactar una Declaración de Visión Estratégica para el cliente descrito, basándote en los insights de sesiones de trabajo que se te proporcionan. La declaración debe:

1. Estar redactada en primera persona del plural (nosotros/nuestra organización) o en tercera persona institucional, según lo que mejor se adapte al contexto.
2. Proyectarse al horizonte de tiempo definido.
3. Ser aspiracional, clara, concisa y memorable — entre 2 y 5 oraciones.
4. Reflejar la identidad, valores y aspiraciones específicas del cliente.
5. Usar lenguaje de alto impacto, sin tecnicismos vacíos ni clichés genéricos.
6. Ser coherente con la industria y contexto del cliente.
7. Estar lista para ser presentada en plenaria ante el equipo directivo.

Responde ÚNICAMENTE con la declaración de visión, sin explicaciones adicionales, sin títulos, sin comillas.`;

      const userPrompt = `INFORMACIÓN DEL CLIENTE:
- Nombre: ${client.name}
- Industria: ${client.industry ?? "No especificada"}
- Horizonte de tiempo: ${client.timeHorizon ?? "No especificado"}
- Descripción: ${client.description ?? "No disponible"}

INSIGHTS DE SESIONES DE PLANEACIÓN:
${insightsText}

${input.refinementInstructions ? `INSTRUCCIONES DE REFINAMIENTO ADICIONALES:\n${input.refinementInstructions}\n` : ""}

Redacta la Declaración de Visión Estratégica para este cliente.`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });

      const rawContent = response.choices?.[0]?.message?.content;
      const content = typeof rawContent === "string" ? rawContent : "";
      if (!content)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "La IA no generó contenido",
        });

      const versionNumber = await getNextVersionNumber(input.clientId);
      await createVisionVersion({
        clientId: input.clientId,
        versionNumber,
        content,
        prompt: userPrompt,
        refinementInstructions: input.refinementInstructions ?? null,
        isFinal: 0,
      });

      return { success: true, content, versionNumber };
    }),

  updateNotes: publicProcedure
    .input(z.object({ id: z.number(), notes: z.string() }))
    .mutation(async ({ input }) => {
      await updateVisionVersion(input.id, { notes: input.notes });
      return { success: true };
    }),

  setFinal: publicProcedure
    .input(z.object({ clientId: z.number(), versionId: z.number() }))
    .mutation(async ({ input }) => {
      await setVisionFinal(input.clientId, input.versionId);
      return { success: true };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteVisionVersion(input.id);
      return { success: true };
    }),

  exportDocx: publicProcedure
    .input(z.object({ versionId: z.number(), clientId: z.number() }))
    .mutation(async ({ input }) => {
      const client = await getClientById(input.clientId, OPERATOR_USER_ID);
      if (!client) throw new TRPCError({ code: "NOT_FOUND" });

      const version = await getVisionVersionById(input.versionId);
      if (!version) throw new TRPCError({ code: "NOT_FOUND" });

      const {
        Document,
        Paragraph,
        TextRun,
        HeadingLevel,
        AlignmentType,
        Packer,
        BorderStyle,
        ShadingType,
      } = await import("docx");

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                text: "DECLARACIÓN DE VISIÓN ESTRATÉGICA",
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
              }),
              new Paragraph({
                children: [new TextRun({ text: client.name, bold: true, size: 28 })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 100 },
              }),
              ...(client.industry
                ? [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `Industria: ${client.industry}`,
                          size: 22,
                          color: "666666",
                        }),
                      ],
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 100 },
                    }),
                  ]
                : []),
              ...(client.timeHorizon
                ? [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `Horizonte: ${client.timeHorizon}`,
                          size: 22,
                          color: "666666",
                        }),
                      ],
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 400 },
                    }),
                  ]
                : [new Paragraph({ text: "", spacing: { after: 400 } })]),
              new Paragraph({
                children: [
                  new TextRun({
                    text: version.content,
                    size: 28,
                    italics: true,
                    color: "1a1a1a",
                  }),
                ],
                alignment: AlignmentType.JUSTIFIED,
                spacing: { before: 200, after: 400, line: 360 },
                shading: { type: ShadingType.SOLID, color: "f8f8f8" },
                border: {
                  left: { style: BorderStyle.THICK, size: 12, color: "DC2626" },
                },
                indent: { left: 400, right: 400 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Versión ${version.versionNumber}  ·  ${new Date(
                      version.createdAt
                    ).toLocaleDateString("es-MX", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}`,
                    size: 18,
                    color: "999999",
                  }),
                ],
                alignment: AlignmentType.RIGHT,
                spacing: { before: 400 },
              }),
            ],
          },
        ],
      });

      const buffer = await Packer.toBuffer(doc);
      const fileKey = `exports/${input.clientId}/vision-v${version.versionNumber}-${Date.now()}.docx`;
      const { url } = await storagePut(
        fileKey,
        buffer,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );

      return {
        url,
        fileName: `Vision-${client.name}-v${version.versionNumber}.docx`,
      };
    }),
});

// ─── App Router ───────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  clients: clientsRouter,
  insights: insightsRouter,
  vision: visionRouter,
});

export type AppRouter = typeof appRouter;
