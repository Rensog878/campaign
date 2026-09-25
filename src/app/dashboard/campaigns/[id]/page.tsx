import { ArrowLeft, Pause, Play, Send } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionButton } from "@/components/action-button";
import { Card, CardHeader, PageHeader, StatusBadge } from "@/components/ui";
import { db } from "@/lib/db";
import { APP_TZ, fmtDate, fmtNumber, pct } from "@/lib/format";
import { formatInTimeZone } from "date-fns-tz";
import { cancelRun, deleteCampaign, runCampaignNow, toggleCampaign } from "../../actions/campaigns";
import { CampaignForm } from "../campaign-form";
import { campaignFormData } from "../form-data";

export const metadata: Metadata = { title: "Campaign" };
export const dynamic = "force-dynamic";

export default async function CampaignPage({ params }: PageProps<"/dashboard/campaigns/[id]">) {
  const { id } = await params;
  const c = await db.campaign.findUnique({
    where: { id },
    include: { runs: { orderBy: { scheduledFor: "desc" }, take: 20 } },
  });
  if (!c) notFound();

  const [{ templates, audience }, stats] = await Promise.all([
    campaignFormData(),
    db.message.groupBy({ by: ["runId", "status"], where: { runId: { in: c.runs.map((r) => r.id) } }, _count: true }),
  ]);
  const stat = (runId: string, ...s: string[]) =>
    stats.filter((x) => x.runId === runId && s.includes(x.status)).reduce((a, x) => a + x._count, 0);

  return (
    <>
      <Link href="/dashboard/campaigns" className="mb-3 inline-flex items-center gap-1 text-xs text-muted hover:text-ink">
        <ArrowLeft className="size-3.5" /> Campaigns
      </Link>
      <PageHeader
        title={c.name}
        description={c.active && c.nextRunAt ? `Next send ${fmtDate(c.nextRunAt, "EEEE d MMM, h:mm a")}` : "Paused: nothing scheduled"}
        actions={
          <>
            <ActionButton action={runCampaignNow.bind(null, c.id)} size="md" confirm="Start sending this campaign to its customers now?">
              <Send className="size-4" /> Send now
            </ActionButton>
            <ActionButton action={toggleCampaign.bind(null, c.id, !c.active)} size="md">
              {c.active ? <><Pause className="size-4" /> Pause</> : <><Play className="size-4" /> Resume</>}
            </ActionButton>
            <ActionButton action={deleteCampaign.bind(null, c.id)} variant="danger" size="md" confirm="Delete this campaign? Messages already sent stay in the log.">
              Delete
            </ActionButton>
          </>
        }
      />

      <CampaignForm
        id={c.id}
        templates={templates}
        audience={audience}
        initial={{
          name: c.name,
          templateId: c.templateId,
          audienceTag: c.audienceTag ?? "",
          scheduleType: c.scheduleType,
          daysOfWeek: c.daysOfWeek,
          sendTime: c.sendTime,
          runDate: c.runAt ? formatInTimeZone(c.runAt, APP_TZ, "yyyy-MM-dd") : new Date().toISOString().slice(0, 10),
          batchSize: c.batchSize,
          intervalMinutes: c.intervalMinutes,
          active: c.active,
        }}
      />

      <Card className="mt-6">
        <CardHeader title="Send history" description="The last 20 runs of this campaign." />
        {c.runs.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th className="px-5 py-2.5 font-medium">Started</th>
                  <th className="px-5 py-2.5 font-medium">Status</th>
                  <th className="px-5 py-2.5 text-right font-medium">Customers</th>
                  <th className="px-5 py-2.5 text-right font-medium">Delivered</th>
                  <th className="px-5 py-2.5 text-right font-medium">Read</th>
                  <th className="px-5 py-2.5 text-right font-medium">Failed</th>
                  <th className="px-5 py-2.5" />
                </tr>
              </thead>
              <tbody className="tabular divide-y divide-line">
                {c.runs.map((r) => {
                  const delivered = stat(r.id, "DELIVERED", "READ");
                  const read = stat(r.id, "READ");
                  return (
                    <tr key={r.id}>
                      <td className="px-5 py-3">{fmtDate(r.startedAt)}</td>
                      <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                      <td className="px-5 py-3 text-right">{fmtNumber(r.total)}</td>
                      <td className="px-5 py-3 text-right">{fmtNumber(delivered)} <span className="text-xs text-muted">{pct(delivered, r.total)}%</span></td>
                      <td className="px-5 py-3 text-right">{fmtNumber(read)} <span className="text-xs text-muted">{pct(read, r.total)}%</span></td>
                      <td className="px-5 py-3 text-right text-rose-600">{fmtNumber(stat(r.id, "FAILED"))}</td>
                      <td className="px-5 py-3 text-right">
                        {["RUNNING", "WAITING_TEMPLATE"].includes(r.status) ? (
                          <ActionButton action={cancelRun.bind(null, r.id)} variant="danger" confirm="Stop this run?">Stop</ActionButton>
                        ) : (
                          <Link href={`/dashboard/messages?campaign=${c.id}`} className="text-xs font-medium text-brand-deep hover:underline">Log</Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-5 py-6 text-sm text-muted">This campaign hasn&apos;t sent yet.</p>
        )}
      </Card>
    </>
  );
}
