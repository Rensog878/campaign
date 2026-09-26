import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { daysAgo } from "@/lib/format";
import { CampaignForm } from "../campaign-form";
import { campaignFormData } from "../form-data";

export const metadata: Metadata = { title: "New campaign" };
export const dynamic = "force-dynamic";

export default async function NewCampaignPage() {
  const { templates, audience } = await campaignFormData();
  const tomorrow = daysAgo(-1).toISOString().slice(0, 10);
  return (
    <>
      <Link href="/dashboard/campaigns" className="-my-2 mb-1 inline-flex items-center gap-1 py-2 text-sm text-muted hover:text-ink sm:mb-3 sm:text-xs">
        <ArrowLeft className="size-3.5" /> Campaigns
      </Link>
      <PageHeader title="New campaign" description="Choose what to send, when to send it and how fast." />
      <CampaignForm
        id={null}
        templates={templates}
        audience={audience}
        initial={{
          name: "",
          templateId: templates.find((t) => t.status === "APPROVED")?.id ?? "",
          audienceTag: "",
          scheduleType: "WEEKLY",
          daysOfWeek: [2, 5],
          sendTime: "10:00",
          runDate: tomorrow,
          batchSize: 100,
          intervalMinutes: 10,
          active: true,
        }}
      />
    </>
  );
}
