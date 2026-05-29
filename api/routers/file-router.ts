import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { files } from "@db/schema";
import { eq, and, desc, like, sql } from "drizzle-orm";

export const fileRouter = createRouter({
  list: authedQuery
    .input(
      z.object({
        search: z.string().optional(),
        fileType: z.string().optional(),
        isFavorite: z.boolean().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;
      const filters = [eq(files.userId, userId)];

      if (input?.search) filters.push(like(files.name, `%${input.search}%`));
      if (input?.fileType) filters.push(eq(files.fileType, input.fileType));
      if (input?.isFavorite !== undefined) filters.push(eq(files.isFavorite, input.isFavorite));

      const where = filters.length > 1 ? and(...filters) : filters[0];

      const items = await db
        .select()
        .from(files)
        .where(where)
        .orderBy(desc(files.createdAt))
        .limit(input?.limit ?? 20)
        .offset(input?.offset ?? 0);

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(files)
        .where(where);

      return { items, total: countResult[0]?.count ?? 0 };
    }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db
        .select()
        .from(files)
        .where(and(eq(files.id, input.id), eq(files.userId, ctx.user.id)))
        .limit(1);
      return result[0] ?? null;
    }),

  create: authedQuery
    .input(
      z.object({
        name: z.string().min(1).max(255),
        originalName: z.string().optional(),
        fileType: z.string().optional(),
        mimeType: z.string().optional(),
        size: z.number().optional(),
        url: z.string().optional(),
        folderPath: z.string().optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.insert(files).values({
        userId: ctx.user.id,
        name: input.name,
        originalName: input.originalName ?? input.name,
        fileType: input.fileType ?? "",
        mimeType: input.mimeType ?? "",
        size: input.size ?? 0,
        url: input.url ?? "",
        folderPath: input.folderPath ?? "",
        tags: input.tags ?? [],
      });
      return { id: Number(result[0].insertId), ...input, userId: ctx.user.id };
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        tags: z.array(z.string()).optional(),
        isFavorite: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db
        .update(files)
        .set(data)
        .where(and(eq(files.id, id), eq(files.userId, ctx.user.id)));
      return { id, ...data };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .delete(files)
        .where(and(eq(files.id, input.id), eq(files.userId, ctx.user.id)));
      return { success: true };
    }),

  toggleFavorite: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const existing = await db
        .select({ isFavorite: files.isFavorite })
        .from(files)
        .where(and(eq(files.id, input.id), eq(files.userId, ctx.user.id)))
        .limit(1);
      if (!existing[0]) throw new Error("File not found");
      const newVal = !existing[0].isFavorite;
      await db
        .update(files)
        .set({ isFavorite: newVal })
        .where(and(eq(files.id, input.id), eq(files.userId, ctx.user.id)));
      return { id: input.id, isFavorite: newVal };
    }),
});
