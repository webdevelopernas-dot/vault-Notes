import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { journalEntries } from "@db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export const journalRouter = createRouter({
  list: authedQuery
    .input(
      z.object({
        month: z.number().min(1).max(12).optional(),
        year: z.number().min(2000).max(2100).optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;
      const filters = [eq(journalEntries.userId, userId)];

      const items = await db
        .select()
        .from(journalEntries)
        .where(and(...filters))
        .orderBy(desc(journalEntries.entryDate))
        .limit(input?.limit ?? 20)
        .offset(input?.offset ?? 0);

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(journalEntries)
        .where(and(...filters));

      return { items, total: countResult[0]?.count ?? 0 };
    }),

  getByDate: authedQuery
    .input(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const dateObj = new Date(input.date + "T00:00:00");
      const result = await db
        .select()
        .from(journalEntries)
        .where(
          and(
            eq(journalEntries.entryDate, dateObj),
            eq(journalEntries.userId, ctx.user.id)
          )
        )
        .limit(1);
      return result[0] ?? null;
    }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db
        .select()
        .from(journalEntries)
        .where(and(eq(journalEntries.id, input.id), eq(journalEntries.userId, ctx.user.id)))
        .limit(1);
      return result[0] ?? null;
    }),

  create: authedQuery
    .input(
      z.object({
        entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        notes: z.string().optional(),
        accomplishments: z.string().optional(),
        tasks: z.string().optional(),
        reflections: z.string().optional(),
        mood: z.enum(["great", "good", "neutral", "bad", "terrible"]).default("neutral"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const dateObj = new Date(input.entryDate + "T00:00:00");
      const result = await db.insert(journalEntries).values({
        userId: ctx.user.id,
        entryDate: dateObj,
        notes: input.notes ?? "",
        accomplishments: input.accomplishments ?? "",
        tasks: input.tasks ?? "",
        reflections: input.reflections ?? "",
        mood: input.mood,
      });
      return { id: Number(result[0].insertId), ...input, userId: ctx.user.id };
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        notes: z.string().optional(),
        accomplishments: z.string().optional(),
        tasks: z.string().optional(),
        reflections: z.string().optional(),
        mood: z.enum(["great", "good", "neutral", "bad", "terrible"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db
        .update(journalEntries)
        .set(data)
        .where(and(eq(journalEntries.id, id), eq(journalEntries.userId, ctx.user.id)));
      return { id, ...data };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .delete(journalEntries)
        .where(and(eq(journalEntries.id, input.id), eq(journalEntries.userId, ctx.user.id)));
      return { success: true };
    }),
});
