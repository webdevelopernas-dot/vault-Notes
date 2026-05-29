import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { notes } from "@db/schema";
import { eq, and, desc, like, sql } from "drizzle-orm";

export const noteRouter = createRouter({
  list: authedQuery
    .input(
      z.object({
        search: z.string().optional(),
        tag: z.string().optional(),
        isPinned: z.boolean().optional(),
        isArchived: z.boolean().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;
      const filters = [eq(notes.userId, userId)];

      if (input?.search) {
        filters.push(like(notes.title, `%${input.search}%`));
      }
      if (input?.isPinned !== undefined) {
        filters.push(eq(notes.isPinned, input.isPinned));
      }
      if (input?.isArchived !== undefined) {
        filters.push(eq(notes.isArchived, input.isArchived));
      }

      const where = filters.length > 1 ? and(...filters) : filters[0];

      const items = await db
        .select()
        .from(notes)
        .where(where)
        .orderBy(desc(notes.isPinned), desc(notes.updatedAt))
        .limit(input?.limit ?? 20)
        .offset(input?.offset ?? 0);

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(notes)
        .where(where);

      return {
        items,
        total: countResult[0]?.count ?? 0,
      };
    }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db
        .select()
        .from(notes)
        .where(and(eq(notes.id, input.id), eq(notes.userId, ctx.user.id)))
        .limit(1);
      return result[0] ?? null;
    }),

  create: authedQuery
    .input(
      z.object({
        title: z.string().min(1).max(255),
        content: z.string().optional(),
        contentType: z.enum(["markdown", "richtext"]).default("markdown"),
        tags: z.array(z.string()).optional(),
        folderPath: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.insert(notes).values({
        userId: ctx.user.id,
        title: input.title,
        content: input.content ?? "",
        contentType: input.contentType,
        tags: input.tags ?? [],
        folderPath: input.folderPath ?? "",
      });
      const id = Number(result[0].insertId);
      return { id, ...input, userId: ctx.user.id };
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).max(255).optional(),
        content: z.string().optional(),
        contentType: z.enum(["markdown", "richtext"]).optional(),
        tags: z.array(z.string()).optional(),
        isPinned: z.boolean().optional(),
        isArchived: z.boolean().optional(),
        folderPath: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db
        .update(notes)
        .set(data)
        .where(and(eq(notes.id, id), eq(notes.userId, ctx.user.id)));
      return { id, ...data };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .delete(notes)
        .where(and(eq(notes.id, input.id), eq(notes.userId, ctx.user.id)));
      return { success: true };
    }),

  togglePin: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const existing = await db
        .select({ isPinned: notes.isPinned })
        .from(notes)
        .where(and(eq(notes.id, input.id), eq(notes.userId, ctx.user.id)))
        .limit(1);
      if (!existing[0]) throw new Error("Note not found");
      const newVal = !existing[0].isPinned;
      await db
        .update(notes)
        .set({ isPinned: newVal })
        .where(and(eq(notes.id, input.id), eq(notes.userId, ctx.user.id)));
      return { id: input.id, isPinned: newVal };
    }),

  toggleArchive: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const existing = await db
        .select({ isArchived: notes.isArchived })
        .from(notes)
        .where(and(eq(notes.id, input.id), eq(notes.userId, ctx.user.id)))
        .limit(1);
      if (!existing[0]) throw new Error("Note not found");
      const newVal = !existing[0].isArchived;
      await db
        .update(notes)
        .set({ isArchived: newVal })
        .where(and(eq(notes.id, input.id), eq(notes.userId, ctx.user.id)));
      return { id: input.id, isArchived: newVal };
    }),
});
