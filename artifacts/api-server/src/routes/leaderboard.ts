import { Router, type IRouter } from "express";
import {
  ListLeaderboardQueryParams,
  ListLeaderboardResponse,
  SubmitScoreBody,
  SubmitScoreResponse,
} from "@workspace/api-zod";
import { db, leaderboardEntriesTable } from "@workspace/db";
import { asc, desc, eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/leaderboard", async (req, res) => {
  const parsedQuery = ListLeaderboardQueryParams.safeParse(req.query);
  if (!parsedQuery.success) {
    res.status(400).json({ error: "Invalid leaderboard filters" });
    return;
  }

  const { difficulty, limit } = parsedQuery.data;
  const rows = await db
    .select()
    .from(leaderboardEntriesTable)
    .where(difficulty ? eq(leaderboardEntriesTable.difficulty, difficulty) : undefined)
    .orderBy(desc(leaderboardEntriesTable.score), asc(leaderboardEntriesTable.createdAt))
    .limit(limit);

  res.json(ListLeaderboardResponse.parse(rows));
});

router.post("/leaderboard", async (req, res) => {
  const body = req.body && typeof req.body === "object"
    ? { ...req.body, username: typeof req.body.username === "string" ? req.body.username.trim() : req.body.username }
    : req.body;
  const parsedBody = SubmitScoreBody.safeParse(body);
  if (!parsedBody.success) {
    res.status(400).json({ error: "Invalid score submission" });
    return;
  }

  const [created] = await db
    .insert(leaderboardEntriesTable)
    .values(parsedBody.data)
    .returning();

  res.status(201).json(SubmitScoreResponse.parse(created));
});

export default router;