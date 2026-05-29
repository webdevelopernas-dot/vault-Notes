import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  bigint,
  boolean,
  int,
  json,
  date,
} from "drizzle-orm/mysql-core";

// ─── Users (managed by auth system) ───────────────────────────────
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Notes ─────────────────────────────────────────────────────────
export const notes = mysqlTable("notes", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  contentType: mysqlEnum("contentType", ["markdown", "richtext"]).default("markdown"),
  tags: json("tags").$type<string[]>(),
  isPinned: boolean("isPinned").default(false),
  isArchived: boolean("isArchived").default(false),
  folderPath: varchar("folderPath", { length: 500 }).default(""),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Note = typeof notes.$inferSelect;
export type InsertNote = typeof notes.$inferInsert;

// ─── Projects ──────────────────────────────────────────────────────
export const projects = mysqlTable("projects", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["active", "planning", "paused", "completed", "archived"]).default("active"),
  category: varchar("category", { length: 100 }),
  color: varchar("color", { length: 20 }).default("#5eead4"),
  progress: int("progress").default(0),
  folderPath: varchar("folderPath", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

// ─── Project Tasks ─────────────────────────────────────────────────
export const projectTasks = mysqlTable("projectTasks", {
  id: serial("id").primaryKey(),
  projectId: bigint("projectId", { mode: "number", unsigned: true }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["todo", "in_progress", "done"]).default("todo"),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium"),
  dueDate: timestamp("dueDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type ProjectTask = typeof projectTasks.$inferSelect;
export type InsertProjectTask = typeof projectTasks.$inferInsert;

// ─── Project Files ─────────────────────────────────────────────────
export const projectFiles = mysqlTable("projectFiles", {
  id: serial("id").primaryKey(),
  projectId: bigint("projectId", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  fileType: varchar("fileType", { length: 50 }),
  size: int("size").default(0),
  url: text("url"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProjectFile = typeof projectFiles.$inferSelect;
export type InsertProjectFile = typeof projectFiles.$inferInsert;

// ─── Code Snippets ─────────────────────────────────────────────────
export const codeSnippets = mysqlTable("codeSnippets", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  code: text("code").notNull(),
  language: varchar("language", { length: 50 }).notNull(),
  tags: json("tags").$type<string[]>(),
  isFavorite: boolean("isFavorite").default(false),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type CodeSnippet = typeof codeSnippets.$inferSelect;
export type InsertCodeSnippet = typeof codeSnippets.$inferInsert;

// ─── Files (File Manager) ──────────────────────────────────────────
export const files = mysqlTable("files", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  originalName: varchar("originalName", { length: 255 }),
  fileType: varchar("fileType", { length: 50 }),
  mimeType: varchar("mimeType", { length: 100 }),
  size: int("size").default(0),
  url: text("url"),
  folderPath: varchar("folderPath", { length: 500 }),
  tags: json("tags").$type<string[]>(),
  isFavorite: boolean("isFavorite").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FileItem = typeof files.$inferSelect;
export type InsertFileItem = typeof files.$inferInsert;

// ─── Journal Entries ───────────────────────────────────────────────
export const journalEntries = mysqlTable("journalEntries", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  entryDate: date("entryDate").notNull(),
  notes: text("notes"),
  accomplishments: text("accomplishments"),
  tasks: text("tasks"),
  reflections: text("reflections"),
  mood: mysqlEnum("mood", ["great", "good", "neutral", "bad", "terrible"]).default("neutral"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type JournalEntry = typeof journalEntries.$inferSelect;
export type InsertJournalEntry = typeof journalEntries.$inferInsert;

// ─── Reminders ─────────────────────────────────────────────────────
export const reminders = mysqlTable("reminders", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  dueDate: timestamp("dueDate"),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium"),
  isCompleted: boolean("isCompleted").default(false),
  category: varchar("category", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Reminder = typeof reminders.$inferSelect;
export type InsertReminder = typeof reminders.$inferInsert;

// ─── Ideas ─────────────────────────────────────────────────────────
export const ideas = mysqlTable("ideas", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", ["business", "app", "project", "other"]).default("other"),
  status: mysqlEnum("status", ["new", "planning", "active", "completed", "on_hold"]).default("new"),
  tags: json("tags").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Idea = typeof ideas.$inferSelect;
export type InsertIdea = typeof ideas.$inferInsert;

// ─── Bookmarks ─────────────────────────────────────────────────────
export const bookmarks = mysqlTable("bookmarks", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  url: text("url").notNull(),
  description: text("description"),
  favicon: text("favicon"),
  category: varchar("category", { length: 100 }),
  tags: json("tags").$type<string[]>(),
  isFavorite: boolean("isFavorite").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Bookmark = typeof bookmarks.$inferSelect;
export type InsertBookmark = typeof bookmarks.$inferInsert;

// ─── GitHub Configs ────────────────────────────────────────────────
export const githubConfigs = mysqlTable("githubConfigs", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull().unique(),
  repoOwner: varchar("repoOwner", { length: 255 }),
  repoName: varchar("repoName", { length: 255 }),
  branch: varchar("branch", { length: 100 }).default("main"),
  tokenEncrypted: text("tokenEncrypted"),
  isActive: boolean("isActive").default(false),
  lastSyncAt: timestamp("lastSyncAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type GithubConfig = typeof githubConfigs.$inferSelect;
export type InsertGithubConfig = typeof githubConfigs.$inferInsert;
