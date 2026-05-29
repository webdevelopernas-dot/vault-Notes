import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { codeSnippets } from "@db/schema";
import { eq, and, desc, like, sql } from "drizzle-orm";

export const snippetRouter = createRouter({
  list: authedQuery
    .input(
      z.object({
        search: z.string().optional(),
        language: z.string().optional(),
        isFavorite: z.boolean().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;
      const filters = [eq(codeSnippets.userId, userId)];

      if (input?.search) filters.push(like(codeSnippets.title, `%${input.search}%`));
      if (input?.language) filters.push(eq(codeSnippets.language, input.language));
      if (input?.isFavorite !== undefined) filters.push(eq(codeSnippets.isFavorite, input.isFavorite));

      const where = filters.length > 1 ? and(...filters) : filters[0];

      const items = await db
        .select()
        .from(codeSnippets)
        .where(where)
        .orderBy(desc(codeSnippets.isFavorite), desc(codeSnippets.updatedAt))
        .limit(input?.limit ?? 20)
        .offset(input?.offset ?? 0);

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(codeSnippets)
        .where(where);

      return { items, total: countResult[0]?.count ?? 0 };
    }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db
        .select()
        .from(codeSnippets)
        .where(and(eq(codeSnippets.id, input.id), eq(codeSnippets.userId, ctx.user.id)))
        .limit(1);
      return result[0] ?? null;
    }),

  create: authedQuery
    .input(
      z.object({
        title: z.string().min(1).max(255),
        code: z.string().min(1),
        language: z.string().min(1).max(50),
        tags: z.array(z.string()).optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.insert(codeSnippets).values({
        userId: ctx.user.id,
        title: input.title,
        code: input.code,
        language: input.language,
        tags: input.tags ?? [],
        description: input.description ?? "",
      });
      return { id: Number(result[0].insertId), ...input, userId: ctx.user.id };
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).max(255).optional(),
        code: z.string().optional(),
        language: z.string().min(1).max(50).optional(),
        tags: z.array(z.string()).optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db
        .update(codeSnippets)
        .set(data)
        .where(and(eq(codeSnippets.id, id), eq(codeSnippets.userId, ctx.user.id)));
      return { id, ...data };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .delete(codeSnippets)
        .where(and(eq(codeSnippets.id, input.id), eq(codeSnippets.userId, ctx.user.id)));
      return { success: true };
    }),

  toggleFavorite: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const existing = await db
        .select({ isFavorite: codeSnippets.isFavorite })
        .from(codeSnippets)
        .where(and(eq(codeSnippets.id, input.id), eq(codeSnippets.userId, ctx.user.id)))
        .limit(1);
      if (!existing[0]) throw new Error("Snippet not found");
      const newVal = !existing[0].isFavorite;
      await db
        .update(codeSnippets)
        .set({ isFavorite: newVal })
        .where(and(eq(codeSnippets.id, input.id), eq(codeSnippets.userId, ctx.user.id)));
      return { id: input.id, isFavorite: newVal };
    }),
});
