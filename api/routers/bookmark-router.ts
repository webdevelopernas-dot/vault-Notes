import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { bookmarks } from "@db/schema";
import { eq, and, desc, like, sql } from "drizzle-orm";

export const bookmarkRouter = createRouter({
  list: authedQuery
    .input(
      z.object({
        search: z.string().optional(),
        category: z.string().optional(),
        isFavorite: z.boolean().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;
      const filters = [eq(bookmarks.userId, userId)];

      if (input?.search) {
        filters.push(
          like(bookmarks.title, `%${input.search}%`)
        );
      }
      if (input?.category) filters.push(eq(bookmarks.category, input.category));
      if (input?.isFavorite !== undefined) filters.push(eq(bookmarks.isFavorite, input.isFavorite));

      const where = filters.length > 1 ? and(...filters) : filters[0];

      const items = await db
        .select()
        .from(bookmarks)
        .where(where)
        .orderBy(desc(bookmarks.isFavorite), desc(bookmarks.createdAt))
        .limit(input?.limit ?? 20)
        .offset(input?.offset ?? 0);

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(bookmarks)
        .where(where);

      return { items, total: countResult[0]?.count ?? 0 };
    }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db
        .select()
        .from(bookmarks)
        .where(and(eq(bookmarks.id, input.id), eq(bookmarks.userId, ctx.user.id)))
        .limit(1);
      return result[0] ?? null;
    }),

  create: authedQuery
    .input(
      z.object({
        title: z.string().min(1).max(255),
        url: z.string().url(),
        description: z.string().optional(),
        favicon: z.string().optional(),
        category: z.string().optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.insert(bookmarks).values({
        userId: ctx.user.id,
        title: input.title,
        url: input.url,
        description: input.description ?? "",
        favicon: input.favicon ?? "",
        category: input.category ?? "",
        tags: input.tags ?? [],
      });
      return { id: Number(result[0].insertId), ...input, userId: ctx.user.id };
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).max(255).optional(),
        url: z.string().url().optional(),
        description: z.string().optional(),
        favicon: z.string().optional(),
        category: z.string().optional(),
        tags: z.array(z.string()).optional(),
        isFavorite: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db
        .update(bookmarks)
        .set(data)
        .where(and(eq(bookmarks.id, id), eq(bookmarks.userId, ctx.user.id)));
      return { id, ...data };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .delete(bookmarks)
        .where(and(eq(bookmarks.id, input.id), eq(bookmarks.userId, ctx.user.id)));
      return { success: true };
    }),

  toggleFavorite: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const existing = await db
        .select({ isFavorite: bookmarks.isFavorite })
        .from(bookmarks)
        .where(and(eq(bookmarks.id, input.id), eq(bookmarks.userId, ctx.user.id)))
        .limit(1);
      if (!existing[0]) throw new Error("Bookmark not found");
      const newVal = !existing[0].isFavorite;
      await db
        .update(bookmarks)
        .set({ isFavorite: newVal })
        .where(and(eq(bookmarks.id, input.id), eq(bookmarks.userId, ctx.user.id)));
      return { id: input.id, isFavorite: newVal };
    }),
});
