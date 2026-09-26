import { CalendarClock, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ActionButton } from "@/components/action-button";
import { Badge, buttonClass, Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { cn } from "@/lib/cn";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { DAYS, estimateDuration, formatMinutes } from "@/lib/schedule";
import { toggleCampaign } from "../actions/campaigns";

export const metadata: Metadata = { title: "Campaigns" };
export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const [campaigns, audience] = await Promise.all([
    db.campaign.findMany({
      include: {
        template: { select: { name: true, status: true } },
        runs: { orderBy: { startedAt: "desc" }, take: 1 },
      },
      orderBy: [{ active: "desc" }, { nextRunAt: "asc" }],
    }),
    db.customer.count({ where: { optedOut: false } }),
  ]);

  return (
    <>
      <PageHeader
        title="Campaigns"
        description="Recurring or one-off sends. Each one delivers in batches at the pace you set."
        actions={
          <Link href="/dashboard/campaigns/new" className={buttonClass("primary")}>
            <Plus className="size-4" /> New campaign
          </Link>
        }
      />

      {campaigns.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {campaigns.map((c) => {
            const last = c.runs[0];
            return (
              <Card key={c.id} className={cn("p-5 transition hover:shadow-pop", !c.active && "opacity-75")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/dashboard/campaigns/${c.id}`} className="block truncate text-base font-semibold hover:underline">{c.name}</Link>
                    <p className="mt-0.5 truncate font-mono text-xs text-muted">{c.template.name}</p>
                  </div>
                  {c.active ? <Badge tone="green" dot>Active</Badge> : <Badge dot>Paused</Badge>}
                </div>

                <div className="mt-4 flex flex-wrap gap-1">
                  {c.scheduleType === "WEEKLY" ? (
                    DAYS.map((d, i) => (
                      <span key={d} className={cn("grid h-7 w-9 place-items-center rounded-md text-[11px] font-medium", c.daysOfWeek.includes(i) ? "bg-brand text-white" : "bg-canvas text-muted")}>{d}</span>
                    ))
                  ) : (
                    <Badge tone="blue">Once · {fmtDate(c.runAt, "d MMM yyyy")}</Badge>
                  )}
                </div>

                <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-4 text-xs">
                  <div>
                    <dt className="text-muted">Time</dt>
                    <dd className="mt-0.5 font-medium">{c.sendTime}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Pace</dt>
                    <dd className="mt-0.5 font-medium">{c.batchSize} / {c.intervalMinutes} min</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Takes</dt>
                    <dd className="mt-0.5 font-medium">~{formatMinutes(estimateDuration(audience, c.batchSize, c.intervalMinutes))}</dd>
                  </div>
                </dl>

                <div className="mt-4 flex items-center justify-between gap-2 text-xs">
                  <span className="text-muted">
                    {c.template.status !== "APPROVED" ? (
                      <span className="text-amber-700">Template waiting for approval</span>
                    ) : c.active && c.nextRunAt ? (
                      <>Next: <b className="text-ink">{fmtDate(c.nextRunAt, "EEE d MMM, h:mm a")}</b></>
                    ) : last ? (
                      <>Last run {fmtDate(last.startedAt, "d MMM")}</>
                    ) : (
                      "Not scheduled"
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    {last && ["RUNNING", "WAITING_TEMPLATE", "WAITING_CONNECTION"].includes(last.status) && <StatusBadge status={last.status} />}
                    <ActionButton action={toggleCampaign.bind(null, c.id, !c.active)}>{c.active ? "Pause" : "Resume"}</ActionButton>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={<CalendarClock className="size-5" />}
            title="No campaigns yet"
            action={<Link href="/dashboard/campaigns/new" className={buttonClass("primary")}><Plus className="size-4" /> New campaign</Link>}
          >
            For two promotions a week, create one campaign and pick two days, for example Tuesday and Friday.
          </EmptyState>
        </Card>
      )}
    </>
  );
}
