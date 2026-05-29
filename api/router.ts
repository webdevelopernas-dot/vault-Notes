import { authRouter } from "./auth-router";
import { createRouter, publicQuery } from "./middleware";
import { noteRouter } from "./routers/note-router";
import { projectRouter } from "./routers/project-router";
import { snippetRouter } from "./routers/snippet-router";
import { fileRouter } from "./routers/file-router";
import { journalRouter } from "./routers/journal-router";
import { reminderRouter } from "./routers/reminder-router";
import { ideaRouter } from "./routers/idea-router";
import { bookmarkRouter } from "./routers/bookmark-router";
import { searchRouter } from "./routers/search-router";
import { dashboardRouter } from "./routers/dashboard-router";
import { githubRouter } from "./routers/github-router";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  note: noteRouter,
  project: projectRouter,
  snippet: snippetRouter,
  file: fileRouter,
  journal: journalRouter,
  reminder: reminderRouter,
  idea: ideaRouter,
  bookmark: bookmarkRouter,
  search: searchRouter,
  dashboard: dashboardRouter,
  github: githubRouter,
});

export type AppRouter = typeof appRouter;
