import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { ideas } from "@db/schema";
import { eq, and, desc, like, sql } from "drizzle-orm";

export const ideaRouter = createRouter({
  list: authedQuery
    .input(
      z.object({
        search: z.string().optional(),
        category: z.enum(["business", "app", "project", "other"]).optional(),
        status: z.enum(["new", "planning", "active", "completed", "on_hold"]).optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;
      const filters = [eq(ideas.userId, userId)];

      if (input?.search) filters.push(like(ideas.title, `%${input.search}%`));
      if (input?.category) filters.push(eq(ideas.category, input.category));
      if (input?.status) filters.push(eq(ideas.status, input.status));

      const where = filters.length > 1 ? and(...filters) : filters[0];

      const items = await db
        .select()
        .from(ideas)
        .where(where)
        .orderBy(desc(ideas.createdAt))
        .limit(input?.limit ?? 20)
        .offset(input?.offset ?? 0);

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(ideas)
        .where(where);

      return { items, total: countResult[0]?.count ?? 0 };
    }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db
        .select()
        .from(ideas)
        .where(and(eq(ideas.id, input.id), eq(ideas.userId, ctx.user.id)))
        .limit(1);
      return result[0] ?? null;
    }),

  create: authedQuery
    .input(
      z.object({
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        category: z.enum(["business", "app", "project", "other"]).default("other"),
        status: z.enum(["new", "planning", "active", "completed", "on_hold"]).default("new"),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.insert(ideas).values({
        userId: ctx.user.id,
        title: input.title,
        description: input.description ?? "",
        category: input.category,
        status: input.status,
        tags: input.tags ?? [],
      });
      return { id: Number(result[0].insertId), ...input, userId: ctx.user.id };
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        category: z.enum(["business", "app", "project", "other"]).optional(),
        status: z.enum(["new", "planning", "active", "completed", "on_hold"]).optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db
        .update(ideas)
        .set(data)
        .where(and(eq(ideas.id, id), eq(ideas.userId, ctx.user.id)));
      return { id, ...data };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .delete(ideas)
        .where(and(eq(ideas.id, input.id), eq(ideas.userId, ctx.user.id)));
      return { success: true };
    }),
});
