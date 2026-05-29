import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { notes, projects, codeSnippets, files, journalEntries, reminders, ideas, bookmarks } from "@db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { format } from "date-fns";

export const dashboardRouter = createRouter({
  summary: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userId = ctx.user.id;
    const today = format(new Date(), "yyyy-MM-dd");
    const todayDate = new Date(today + "T00:00:00");

    // Recent Notes (last 4)
    const recentNotes = await db
      .select({
        id: notes.id,
        title: notes.title,
        content: notes.content,
        tags: notes.tags,
        isPinned: notes.isPinned,
        updatedAt: notes.updatedAt,
      })
      .from(notes)
      .where(and(eq(notes.userId, userId), eq(notes.isArchived, false)))
      .orderBy(desc(notes.isPinned), desc(notes.updatedAt))
      .limit(4);

    // Recent Files (last 3)
    const recentFiles = await db
      .select({
        id: files.id,
        name: files.name,
        originalName: files.originalName,
        fileType: files.fileType,
        size: files.size,
        createdAt: files.createdAt,
      })
      .from(files)
      .where(eq(files.userId, userId))
      .orderBy(desc(files.createdAt))
      .limit(3);

    // Active Projects (last 3)
    const activeProjects = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        status: projects.status,
        category: projects.category,
        color: projects.color,
        progress: projects.progress,
        updatedAt: projects.updatedAt,
      })
      .from(projects)
      .where(and(eq(projects.userId, userId), eq(projects.status, "active")))
      .orderBy(desc(projects.updatedAt))
      .limit(3);

    // Upcoming Reminders (last 4 incomplete)
    const upcomingReminders = await db
      .select({
        id: reminders.id,
        title: reminders.title,
        description: reminders.description,
        dueDate: reminders.dueDate,
        priority: reminders.priority,
        isCompleted: reminders.isCompleted,
        category: reminders.category,
      })
      .from(reminders)
      .where(and(eq(reminders.userId, userId), eq(reminders.isCompleted, false)))
      .orderBy(reminders.dueDate)
      .limit(4);

    // Recent Snippets (last 3)
    const recentSnippets = await db
      .select({
        id: codeSnippets.id,
        title: codeSnippets.title,
        code: sql<string>`substring(${codeSnippets.code}, 1, 200)`,
        language: codeSnippets.language,
        isFavorite: codeSnippets.isFavorite,
        updatedAt: codeSnippets.updatedAt,
      })
      .from(codeSnippets)
      .where(eq(codeSnippets.userId, userId))
      .orderBy(desc(codeSnippets.updatedAt))
      .limit(3);

    // Recent Bookmarks (last 4)
    const recentBookmarks = await db
      .select({
        id: bookmarks.id,
        title: bookmarks.title,
        url: bookmarks.url,
        description: bookmarks.description,
        favicon: bookmarks.favicon,
        category: bookmarks.category,
      })
      .from(bookmarks)
      .where(eq(bookmarks.userId, userId))
      .orderBy(desc(bookmarks.createdAt))
      .limit(4);

    // Today's Journal
    const todaysJournal = await db
      .select()
      .from(journalEntries)
      .where(and(eq(journalEntries.userId, userId), eq(journalEntries.entryDate, todayDate)))
      .limit(1);

    // Counts
    const noteCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(notes)
      .where(eq(notes.userId, userId));
    const projectCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(eq(projects.userId, userId));
    const snippetCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(codeSnippets)
      .where(eq(codeSnippets.userId, userId));
    const fileCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(files)
      .where(eq(files.userId, userId));
    const reminderCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(reminders)
      .where(eq(reminders.userId, userId));
    const ideaCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(ideas)
      .where(eq(ideas.userId, userId));
    const bookmarkCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookmarks)
      .where(eq(bookmarks.userId, userId));

    return {
      recentNotes,
      recentFiles,
      activeProjects,
      upcomingReminders,
      recentSnippets,
      recentBookmarks,
      todaysJournal: todaysJournal[0] ?? null,
      counts: {
        totalNotes: noteCount[0]?.count ?? 0,
        totalProjects: projectCount[0]?.count ?? 0,
        totalSnippets: snippetCount[0]?.count ?? 0,
        totalFiles: fileCount[0]?.count ?? 0,
        totalReminders: reminderCount[0]?.count ?? 0,
        totalIdeas: ideaCount[0]?.count ?? 0,
        totalBookmarks: bookmarkCount[0]?.count ?? 0,
      },
    };
  }),
});
