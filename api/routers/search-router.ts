import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { notes, projects, codeSnippets, files, journalEntries, reminders, ideas, bookmarks } from "@db/schema";
import { eq, like, or, and, desc } from "drizzle-orm";

export const searchRouter = createRouter({
  global: authedQuery
    .input(
      z.object({
        query: z.string().min(1).max(200),
        filters: z.object({
          notes: z.boolean().optional(),
          projects: z.boolean().optional(),
          snippets: z.boolean().optional(),
          files: z.boolean().optional(),
          journal: z.boolean().optional(),
          reminders: z.boolean().optional(),
          ideas: z.boolean().optional(),
          bookmarks: z.boolean().optional(),
        }).optional(),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;
      const searchTerm = `%${input.query}%`;
      const filters = input.filters ?? {};
      const limit = input.limit;

      const results: Record<string, unknown[]> = {};

      // Search Notes
      if (!filters || filters.notes !== false) {
        const noteResults = await db
          .select({
            id: notes.id,
            title: notes.title,
            content: notes.content,
            tags: notes.tags,
            isPinned: notes.isPinned,
            updatedAt: notes.updatedAt,
          })
          .from(notes)
          .where(
            and(
              eq(notes.userId, userId),
              or(like(notes.title, searchTerm), like(notes.content, searchTerm))
            )
          )
          .orderBy(desc(notes.updatedAt))
          .limit(limit);
        results.notes = noteResults;
      }

      // Search Projects
      if (!filters || filters.projects !== false) {
        const projectResults = await db
          .select({
            id: projects.id,
            name: projects.name,
            description: projects.description,
            status: projects.status,
            category: projects.category,
            progress: projects.progress,
            updatedAt: projects.updatedAt,
          })
          .from(projects)
          .where(
            and(
              eq(projects.userId, userId),
              or(like(projects.name, searchTerm), like(projects.description, searchTerm))
            )
          )
          .orderBy(desc(projects.updatedAt))
          .limit(limit);
        results.projects = projectResults;
      }

      // Search Snippets
      if (!filters || filters.snippets !== false) {
        const snippetResults = await db
          .select({
            id: codeSnippets.id,
            title: codeSnippets.title,
            code: codeSnippets.code,
            language: codeSnippets.language,
            tags: codeSnippets.tags,
            updatedAt: codeSnippets.updatedAt,
          })
          .from(codeSnippets)
          .where(
            and(
              eq(codeSnippets.userId, userId),
              or(like(codeSnippets.title, searchTerm), like(codeSnippets.code, searchTerm))
            )
          )
          .orderBy(desc(codeSnippets.updatedAt))
          .limit(limit);
        results.snippets = snippetResults;
      }

      // Search Files
      if (!filters || filters.files !== false) {
        const fileResults = await db
          .select({
            id: files.id,
            name: files.name,
            originalName: files.originalName,
            fileType: files.fileType,
            size: files.size,
            tags: files.tags,
            createdAt: files.createdAt,
          })
          .from(files)
          .where(
            and(
              eq(files.userId, userId),
              or(like(files.name, searchTerm), like(files.originalName, searchTerm))
            )
          )
          .orderBy(desc(files.createdAt))
          .limit(limit);
        results.files = fileResults;
      }

      // Search Journal
      if (!filters || filters.journal !== false) {
        const journalResults = await db
          .select({
            id: journalEntries.id,
            entryDate: journalEntries.entryDate,
            notes: journalEntries.notes,
            mood: journalEntries.mood,
            createdAt: journalEntries.createdAt,
          })
          .from(journalEntries)
          .where(
            and(
              eq(journalEntries.userId, userId),
              or(
                like(journalEntries.notes, searchTerm),
                like(journalEntries.accomplishments, searchTerm),
                like(journalEntries.tasks, searchTerm),
                like(journalEntries.reflections, searchTerm)
              )
            )
          )
          .orderBy(desc(journalEntries.entryDate))
          .limit(limit);
        results.journal = journalResults;
      }

      // Search Reminders
      if (!filters || filters.reminders !== false) {
        const reminderResults = await db
          .select({
            id: reminders.id,
            title: reminders.title,
            description: reminders.description,
            dueDate: reminders.dueDate,
            priority: reminders.priority,
            isCompleted: reminders.isCompleted,
            category: reminders.category,
            createdAt: reminders.createdAt,
          })
          .from(reminders)
          .where(
            and(
              eq(reminders.userId, userId),
              or(like(reminders.title, searchTerm), like(reminders.description, searchTerm))
            )
          )
          .orderBy(desc(reminders.createdAt))
          .limit(limit);
        results.reminders = reminderResults;
      }

      // Search Ideas
      if (!filters || filters.ideas !== false) {
        const ideaResults = await db
          .select({
            id: ideas.id,
            title: ideas.title,
            description: ideas.description,
            category: ideas.category,
            status: ideas.status,
            tags: ideas.tags,
            createdAt: ideas.createdAt,
          })
          .from(ideas)
          .where(
            and(
              eq(ideas.userId, userId),
              or(like(ideas.title, searchTerm), like(ideas.description, searchTerm))
            )
          )
          .orderBy(desc(ideas.createdAt))
          .limit(limit);
        results.ideas = ideaResults;
      }

      // Search Bookmarks
      if (!filters || filters.bookmarks !== false) {
        const bookmarkResults = await db
          .select({
            id: bookmarks.id,
            title: bookmarks.title,
            url: bookmarks.url,
            description: bookmarks.description,
            category: bookmarks.category,
            tags: bookmarks.tags,
            createdAt: bookmarks.createdAt,
          })
          .from(bookmarks)
          .where(
            and(
              eq(bookmarks.userId, userId),
              or(like(bookmarks.title, searchTerm), like(bookmarks.url, searchTerm))
            )
          )
          .orderBy(desc(bookmarks.createdAt))
          .limit(limit);
        results.bookmarks = bookmarkResults;
      }

      return results;
    }),
});
