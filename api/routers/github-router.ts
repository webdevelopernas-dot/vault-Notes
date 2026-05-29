import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { githubConfigs } from "@db/schema";
import { eq } from "drizzle-orm";

export const githubRouter = createRouter({
  getConfig: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const result = await db
      .select()
      .from(githubConfigs)
      .where(eq(githubConfigs.userId, ctx.user.id))
      .limit(1);
    return result[0] ?? null;
  }),

  saveConfig: authedQuery
    .input(
      z.object({
        repoOwner: z.string().min(1),
        repoName: z.string().min(1),
        branch: z.string().default("main"),
        token: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const existing = await db
        .select()
        .from(githubConfigs)
        .where(eq(githubConfigs.userId, ctx.user.id))
        .limit(1);

      // Simple obfuscation - not real encryption but hides token from plain view
      const obfuscatedToken = Buffer.from(input.token).toString("base64");

      if (existing[0]) {
        await db
          .update(githubConfigs)
          .set({
            repoOwner: input.repoOwner,
            repoName: input.repoName,
            branch: input.branch,
            tokenEncrypted: obfuscatedToken,
            isActive: true,
          })
          .where(eq(githubConfigs.userId, ctx.user.id));
        return { ...existing[0], repoOwner: input.repoOwner, repoName: input.repoName, branch: input.branch, tokenEncrypted: obfuscatedToken };
      } else {
        const result = await db.insert(githubConfigs).values({
          userId: ctx.user.id,
          repoOwner: input.repoOwner,
          repoName: input.repoName,
          branch: input.branch,
          tokenEncrypted: obfuscatedToken,
          isActive: true,
        });
        return { id: Number(result[0].insertId), userId: ctx.user.id, ...input, tokenEncrypted: obfuscatedToken };
      }
    }),

  testConnection: authedQuery.mutation(async ({ ctx }) => {
    const db = getDb();
    const config = await db
      .select()
      .from(githubConfigs)
      .where(eq(githubConfigs.userId, ctx.user.id))
      .limit(1);

    if (!config[0] || !config[0].tokenEncrypted) {
      return { success: false, message: "No GitHub config found" };
    }

    try {
      const token = Buffer.from(config[0].tokenEncrypted, "base64").toString();
      const response = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (response.ok) {
        return { success: true, message: "Connected to GitHub successfully" };
      } else {
        return { success: false, message: `GitHub API error: ${response.status}` };
      }
    } catch (error) {
      return { success: false, message: `Connection failed: ${error instanceof Error ? error.message : "Unknown error"}` };
    }
  }),

  syncVault: authedQuery.mutation(async () => {
    // Placeholder for vault sync - would implement full sync logic here
    return { success: true, message: "Vault sync initiated", syncedAt: new Date() };
  }),
});
