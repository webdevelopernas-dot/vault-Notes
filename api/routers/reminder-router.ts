import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { reminders } from "@db/schema";
import { eq, and, desc, like, sql, gte, lte } from "drizzle-orm";

export const reminderRouter = createRouter({
  list: authedQuery
    .input(
      z.object({
        search: z.string().optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
        isCompleted: z.boolean().optional(),
        dueDateFrom: z.string().datetime().optional(),
        dueDateTo: z.string().datetime().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;
      const filters = [eq(reminders.userId, userId)];

      if (input?.search) filters.push(like(reminders.title, `%${input.search}%`));
      if (input?.priority) filters.push(eq(reminders.priority, input.priority));
      if (input?.isCompleted !== undefined) filters.push(eq(reminders.isCompleted, input.isCompleted));
      if (input?.dueDateFrom) filters.push(gte(reminders.dueDate, new Date(input.dueDateFrom)));
      if (input?.dueDateTo) filters.push(lte(reminders.dueDate, new Date(input.dueDateTo)));

      const where = filters.length > 1 ? and(...filters) : filters[0];

      const items = await db
        .select()
        .from(reminders)
        .where(where)
        .orderBy(reminders.isCompleted, desc(reminders.dueDate))
        .limit(input?.limit ?? 20)
        .offset(input?.offset ?? 0);

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(reminders)
        .where(where);

      return { items, total: countResult[0]?.count ?? 0 };
    }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db
        .select()
        .from(reminders)
        .where(and(eq(reminders.id, input.id), eq(reminders.userId, ctx.user.id)))
        .limit(1);
      return result[0] ?? null;
    }),

  create: authedQuery
    .input(
      z.object({
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        dueDate: z.string().datetime().optional().nullable(),
        priority: z.enum(["low", "medium", "high"]).default("medium"),
        category: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.insert(reminders).values({
        userId: ctx.user.id,
        title: input.title,
        description: input.description ?? "",
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        priority: input.priority,
        category: input.category ?? "",
      });
      return { id: Number(result[0].insertId), ...input, userId: ctx.user.id };
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        dueDate: z.string().datetime().optional().nullable(),
        priority: z.enum(["low", "medium", "high"]).optional(),
        isCompleted: z.boolean().optional(),
        category: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...data } = input;
      const updateData: Record<string, unknown> = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
      if (data.priority !== undefined) updateData.priority = data.priority;
      if (data.isCompleted !== undefined) updateData.isCompleted = data.isCompleted;
      if (data.category !== undefined) updateData.category = data.category;

      await db
        .update(reminders)
        .set(updateData)
        .where(and(eq(reminders.id, id), eq(reminders.userId, ctx.user.id)));
      return { id, ...data };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .delete(reminders)
        .where(and(eq(reminders.id, input.id), eq(reminders.userId, ctx.user.id)));
      return { success: true };
    }),

  toggleComplete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const existing = await db
        .select({ isCompleted: reminders.isCompleted })
        .from(reminders)
        .where(and(eq(reminders.id, input.id), eq(reminders.userId, ctx.user.id)))
        .limit(1);
      if (!existing[0]) throw new Error("Reminder not found");
      const newVal = !existing[0].isCompleted;
      await db
        .update(reminders)
        .set({ isCompleted: newVal })
        .where(and(eq(reminders.id, input.id), eq(reminders.userId, ctx.user.id)));
      return { id: input.id, isCompleted: newVal };
    }),
});
