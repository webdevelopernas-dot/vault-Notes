import { relations } from "drizzle-orm";
import { users, notes, projects, projectTasks, projectFiles, codeSnippets, files, journalEntries, reminders, ideas, bookmarks, githubConfigs } from "./schema";

export const usersRelations = relations(users, ({ many, one }) => ({
  notes: many(notes),
  projects: many(projects),
  codeSnippets: many(codeSnippets),
  files: many(files),
  journalEntries: many(journalEntries),
  reminders: many(reminders),
  ideas: many(ideas),
  bookmarks: many(bookmarks),
  githubConfig: one(githubConfigs),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  user: one(users, { fields: [notes.userId], references: [users.id] }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, { fields: [projects.userId], references: [users.id] }),
  tasks: many(projectTasks),
  files: many(projectFiles),
}));

export const projectTasksRelations = relations(projectTasks, ({ one }) => ({
  project: one(projects, { fields: [projectTasks.projectId], references: [projects.id] }),
}));

export const projectFilesRelations = relations(projectFiles, ({ one }) => ({
  project: one(projects, { fields: [projectFiles.projectId], references: [projects.id] }),
}));

export const codeSnippetsRelations = relations(codeSnippets, ({ one }) => ({
  user: one(users, { fields: [codeSnippets.userId], references: [users.id] }),
}));

export const filesRelations = relations(files, ({ one }) => ({
  user: one(users, { fields: [files.userId], references: [users.id] }),
}));

export const journalEntriesRelations = relations(journalEntries, ({ one }) => ({
  user: one(users, { fields: [journalEntries.userId], references: [users.id] }),
}));

export const remindersRelations = relations(reminders, ({ one }) => ({
  user: one(users, { fields: [reminders.userId], references: [users.id] }),
}));

export const ideasRelations = relations(ideas, ({ one }) => ({
  user: one(users, { fields: [ideas.userId], references: [users.id] }),
}));

export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
  user: one(users, { fields: [bookmarks.userId], references: [users.id] }),
}));

export const githubConfigsRelations = relations(githubConfigs, ({ one }) => ({
  user: one(users, { fields: [githubConfigs.userId], references: [users.id] }),
}));
