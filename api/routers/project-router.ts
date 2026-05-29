import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { projects, projectTasks, projectFiles } from "@db/schema";
import { eq, and, desc, like, sql } from "drizzle-orm";

export const projectRouter = createRouter({
  list: authedQuery
    .input(
      z.object({
        search: z.string().optional(),
        status: z.enum(["active", "planning", "paused", "completed", "archived"]).optional(),
        category: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;
      const filters = [eq(projects.userId, userId)];

      if (input?.search) filters.push(like(projects.name, `%${input.search}%`));
      if (input?.status) filters.push(eq(projects.status, input.status));
      if (input?.category) filters.push(eq(projects.category, input.category));

      const where = filters.length > 1 ? and(...filters) : filters[0];

      const items = await db
        .select()
        .from(projects)
        .where(where)
        .orderBy(desc(projects.updatedAt))
        .limit(input?.limit ?? 20)
        .offset(input?.offset ?? 0);

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(projects)
        .where(where);

      const itemsWithCounts = await Promise.all(
        items.map(async (project) => {
          const taskCounts = await db
            .select({
              total: sql<number>`count(*)`,
              done: sql<number>`sum(case when ${projectTasks.status} = 'done' then 1 else 0 end)`,
            })
            .from(projectTasks)
            .where(eq(projectTasks.projectId, project.id));
          return {
            ...project,
            taskTotal: taskCounts[0]?.total ?? 0,
            taskDone: Number(taskCounts[0]?.done ?? 0),
          };
        })
      );

      return {
        items: itemsWithCounts,
        total: countResult[0]?.count ?? 0,
      };
    }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db
        .select()
        .from(projects)
        .where(and(eq(projects.id, input.id), eq(projects.userId, ctx.user.id)))
        .limit(1);
      if (!result[0]) return null;

      const tasks = await db
        .select()
        .from(projectTasks)
        .where(eq(projectTasks.projectId, input.id))
        .orderBy(projectTasks.createdAt);

      const files = await db
        .select()
        .from(projectFiles)
        .where(eq(projectFiles.projectId, input.id))
        .orderBy(projectFiles.createdAt);

      return { ...result[0], tasks, files };
    }),

  create: authedQuery
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        status: z.enum(["active", "planning", "paused", "completed", "archived"]).default("active"),
        category: z.string().optional(),
        color: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.insert(projects).values({
        userId: ctx.user.id,
        name: input.name,
        description: input.description ?? "",
        status: input.status,
        category: input.category ?? "",
        color: input.color ?? "#5eead4",
      });
      return { id: Number(result[0].insertId), ...input, userId: ctx.user.id };
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        status: z.enum(["active", "planning", "paused", "completed", "archived"]).optional(),
        category: z.string().optional(),
        color: z.string().optional(),
        progress: z.number().min(0).max(100).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db
        .update(projects)
        .set(data)
        .where(and(eq(projects.id, id), eq(projects.userId, ctx.user.id)));
      return { id, ...data };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db.delete(projectFiles).where(eq(projectFiles.projectId, input.id));
      await db.delete(projectTasks).where(eq(projectTasks.projectId, input.id));
      await db
        .delete(projects)
        .where(and(eq(projects.id, input.id), eq(projects.userId, ctx.user.id)));
      return { success: true };
    }),

  // ─── Project Tasks ───────────────────────────────────────────────
  addTask: authedQuery
    .input(
      z.object({
        projectId: z.number(),
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        priority: z.enum(["low", "medium", "high"]).default("medium"),
        dueDate: z.string().datetime().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { projectId, ...taskData } = input;
      const project = await db
        .select()
        .from(projects)
        .where(and(eq(projects.id, projectId), eq(projects.userId, ctx.user.id)))
        .limit(1);
      if (!project[0]) throw new Error("Project not found");

      const result = await db.insert(projectTasks).values({
        projectId,
        title: taskData.title,
        description: taskData.description ?? "",
        priority: taskData.priority,
        dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
      });
      return { id: Number(result[0].insertId), projectId, ...taskData };
    }),

  updateTask: authedQuery
    .input(
      z.object({
        taskId: z.number(),
        title: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        status: z.enum(["todo", "in_progress", "done"]).optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
        dueDate: z.string().datetime().optional().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { taskId, ...data } = input;
      const updateData: Record<string, unknown> = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.priority !== undefined) updateData.priority = data.priority;
      if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;

      await db.update(projectTasks).set(updateData).where(eq(projectTasks.id, taskId));
      return { taskId, ...data };
    }),

  deleteTask: authedQuery
    .input(z.object({ taskId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(projectTasks).where(eq(projectTasks.id, input.taskId));
      return { success: true };
    }),

  // ─── Project Files ───────────────────────────────────────────────
  addFile: authedQuery
    .input(
      z.object({
        projectId: z.number(),
        name: z.string().min(1).max(255),
        fileType: z.string().optional(),
        size: z.number().optional(),
        url: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { projectId, ...fileData } = input;
      const project = await db
        .select()
        .from(projects)
        .where(and(eq(projects.id, projectId), eq(projects.userId, ctx.user.id)))
        .limit(1);
      if (!project[0]) throw new Error("Project not found");

      const result = await db.insert(projectFiles).values({
        projectId,
        name: fileData.name,
        fileType: fileData.fileType ?? "",
        size: fileData.size ?? 0,
        url: fileData.url ?? "",
      });
      return { id: Number(result[0].insertId), projectId, ...fileData };
    }),

  deleteFile: authedQuery
    .input(z.object({ fileId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(projectFiles).where(eq(projectFiles.id, input.fileId));
      return { success: true };
    }),
});
