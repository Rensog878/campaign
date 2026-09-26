import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import type { TemplateButton, VarMap } from "@/lib/template";
import { TemplateEditor } from "../template-editor";

export const metadata: Metadata = { title: "Edit template" };
export const dynamic = "force-dynamic";

export default async function EditTemplatePage({ params }: PageProps<"/dashboard/templates/[id]">) {
  const { id } = await params;
  const t = await db.template.findUnique({ where: { id } });
  if (!t) notFound();

  return (
    <>
      <Link href="/dashboard/templates" className="-my-2 mb-1 inline-flex items-center gap-1 py-2 text-sm text-muted hover:text-ink sm:mb-3 sm:text-xs">
        <ArrowLeft className="size-3.5" /> Templates
      </Link>
      <PageHeader
        title={t.name}
        description={`Last changed ${fmtDate(t.updatedAt)}${t.lastSyncedAt ? ` · synced with Meta ${fmtDate(t.lastSyncedAt)}` : ""}`}
      />
      <TemplateEditor
        id={t.id}
        status={t.status}
        statusReason={t.statusReason}
        businessName={process.env.BUSINESS_NAME ?? "Your Business"}
        initial={{
          name: t.name,
          language: t.language,
          category: t.category,
          headerType: t.headerType,
          headerText: t.headerText ?? "",
          headerMediaUrl: t.headerMediaUrl ?? "",
          body: t.body,
          footer: t.footer ?? "",
          buttons: t.buttons as TemplateButton[],
          variables: t.variables as VarMap,
          codeExpiryMins: t.codeExpiryMins,
          securityNote: t.securityNote,
        }}
      />
    </>
  );
}
