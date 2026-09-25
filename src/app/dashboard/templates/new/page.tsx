import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { TemplateEditor } from "../template-editor";

export const metadata: Metadata = { title: "New template" };

export default function NewTemplatePage() {
  return (
    <>
      <Link href="/dashboard/templates" className="mb-3 inline-flex items-center gap-1 text-xs text-muted hover:text-ink">
        <ArrowLeft className="size-3.5" /> Templates
      </Link>
      <PageHeader title="New template" description="Pick a category, write the message and preview it exactly as customers will see it." />
      <TemplateEditor
        id={null}
        businessName={process.env.BUSINESS_NAME ?? "Your Business"}
        initial={{
          name: "",
          language: "en",
          category: "MARKETING",
          headerType: "TEXT",
          headerText: "This week's special ☕",
          headerMediaUrl: "",
          body: "Hi {{1}}, enjoy *{{2}}* on your next visit. Show this message at the counter before Sunday.",
          footer: "Reply STOP to unsubscribe",
          buttons: [{ type: "QUICK_REPLY", text: "Interested" }],
          variables: { "1": { source: "first_name" }, "2": { source: "static", value: "20% off" } },
          codeExpiryMins: 10,
          securityNote: true,
        }}
      />
    </>
  );
}
