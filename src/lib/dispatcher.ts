import "server-only";
import type { Campaign } from "@prisma/client";
import { db } from "./db";
import { computeNextRun } from "./schedule";
import { renderFor, type TemplateDraft, type VarMap } from "./template";
import { MetaError, sendTemplateMessage } from "./whatsapp";

const TIME_BUDGET_MS = 50_000; // stay under Vercel's function limit
const CONCURRENCY = 10;

/** Creates a run and queues one message per eligible customer. */
export async function startRun(campaign: Campaign & { template: { name: string } }, scheduledFor: Date) {
  const customers = await db.customer.findMany({
    where: { optedOut: false, ...(campaign.audienceTag ? { tags: { has: campaign.audienceTag } } : {}) },
    select: { id: true },
  });
  const run = await db.campaignRun.create({
    data: { campaignId: campaign.id, scheduledFor, total: customers.length, nextBatchAt: new Date() },
  });
  if (customers.length) {
    await db.message.createMany({
      data: customers.map((c) => ({
        runId: run.id,
        customerId: c.id,
        templateId: campaign.templateId,
        templateName: campaign.template.name,
      })),
    });
  } else {
    await db.campaignRun.update({ where: { id: run.id }, data: { status: "COMPLETED", completedAt: new Date() } });
  }
  return run;
}

async function startDueCampaigns(now: Date) {
  const due = await db.campaign.findMany({
    where: { active: true, nextRunAt: { lte: now } },
    include: { template: { select: { name: true } } },
  });
  let started = 0;
  for (const c of due) {
    const next = computeNextRun(c, now);
    // Claim the slot so overlapping cron calls cannot start the same run twice.
    const claimed = await db.campaign.updateMany({
      where: { id: c.id, nextRunAt: c.nextRunAt },
      data: { nextRunAt: next, active: next !== null },
    });
    if (!claimed.count) continue;
    try {
      await startRun(c, c.nextRunAt!);
      started++;
    } catch (e) {
      console.error(`Could not start campaign ${c.id}`, e);
    }
  }
  return started;
}

async function inPool<T>(items: T[], size: number, fn: (item: T) => Promise<void>) {
  for (let i = 0; i < items.length; i += size) await Promise.all(items.slice(i, i + size).map(fn));
}

async function processRun(runId: string, now: Date, deadline: number) {
  const run = await db.campaignRun.findUnique({
    where: { id: runId },
    include: { campaign: { include: { template: true } } },
  });
  if (!run) return { sent: 0, failed: 0 };
  const { campaign } = run;

  const claimed = await db.campaignRun.updateMany({
    where: { id: run.id, nextBatchAt: run.nextBatchAt },
    data: { nextBatchAt: new Date(now.getTime() + campaign.intervalMinutes * 60_000) },
  });
  if (!claimed.count) return { sent: 0, failed: 0 };

  // Always the latest saved version, so template edits reach the next batch.
  const t = campaign.template;
  if (t.status !== "APPROVED") {
    await db.campaignRun.update({
      where: { id: run.id },
      data: { status: "WAITING_TEMPLATE", nextBatchAt: new Date(now.getTime() + 5 * 60_000) },
    });
    return { sent: 0, failed: 0 };
  }
  if (run.status !== "RUNNING") await db.campaignRun.update({ where: { id: run.id }, data: { status: "RUNNING" } });

  const batch = await db.message.findMany({
    where: { runId: run.id, status: "QUEUED" },
    include: { customer: true },
    take: campaign.batchSize,
    orderBy: { id: "asc" },
  });

  const draft = { ...t, headerText: t.headerText ?? "", footer: t.footer ?? "", variables: t.variables as VarMap } as Pick<
    TemplateDraft,
    "category" | "headerType" | "headerText" | "body" | "footer" | "variables" | "codeExpiryMins" | "securityNote"
  >;
  let sent = 0;
  let failed = 0;

  await inPool(batch, CONCURRENCY, async (m) => {
    if (Date.now() > deadline) return; // stays QUEUED for the next call
    if (m.customer.optedOut) {
      await db.message.update({ where: { id: m.id }, data: { status: "SKIPPED", error: "Customer opted out" } });
      return;
    }
    const r = renderFor(draft, m.customer);
    const text = [r.header, r.body, r.footer].filter(Boolean).join("\n\n");
    try {
      const res = await sendTemplateMessage({
        to: m.customer.phone,
        templateName: t.name,
        language: t.language,
        headerType: t.headerType,
        headerMediaUrl: t.headerMediaUrl,
        headerParams: r.headerParams,
        bodyParams: r.bodyParams,
      });
      await db.message.update({
        where: { id: m.id },
        data: {
          status: "SENT",
          waMessageId: res.id,
          simulated: res.simulated,
          body: text,
          templateName: t.name,
          sentAt: new Date(),
        },
      });
      sent++;
    } catch (e) {
      await db.message.update({
        where: { id: m.id },
        data: { status: "FAILED", error: e instanceof MetaError ? e.message : String(e), body: text, failedAt: new Date() },
      });
      failed++;
    }
  });

  const left = await db.message.count({ where: { runId: run.id, status: "QUEUED" } });
  if (!left) await db.campaignRun.update({ where: { id: run.id }, data: { status: "COMPLETED", completedAt: new Date() } });
  return { sent, failed };
}

/** One tick of the scheduler. Safe to call often and concurrently. */
export async function dispatch() {
  const startedAt = Date.now();
  const deadline = startedAt + TIME_BUDGET_MS;
  const now = new Date();

  const campaignsStarted = await startDueCampaigns(now);
  const runs = await db.campaignRun.findMany({
    where: { status: { in: ["RUNNING", "WAITING_TEMPLATE"] }, nextBatchAt: { lte: now } },
    select: { id: true },
    orderBy: { nextBatchAt: "asc" },
    take: 20,
  });

  let sent = 0;
  let failed = 0;
  for (const r of runs) {
    if (Date.now() > deadline) break;
    const res = await processRun(r.id, now, deadline);
    sent += res.sent;
    failed += res.failed;
  }
  return { campaignsStarted, runsProcessed: runs.length, sent, failed, ms: Date.now() - startedAt };
}
