"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";
import { requireUser } from "@/lib/session";
import {
  fromMetaComponents,
  renderFor,
  toMetaComponents,
  validateDraft,
  type TemplateDraft,
  type VarMap,
} from "@/lib/template";
import {
  createMetaTemplate,
  deleteMetaTemplate,
  editMetaTemplate,
  listMetaTemplates,
  mapMetaStatus,
  MetaError,
  sendTemplateMessage,
  uploadHeaderSample,
  waConfig,
} from "@/lib/whatsapp";

export type ActionResult = { ok: boolean; message?: string; errors?: string[]; id?: string };

const errText = (e: unknown) => (e instanceof MetaError ? e.message : e instanceof Error ? e.message : "Something went wrong");

function contentFields(d: TemplateDraft) {
  const auth = d.category === "AUTHENTICATION";
  return {
    headerType: auth ? "NONE" : d.headerType,
    headerText: !auth && d.headerType === "TEXT" ? d.headerText.trim() : null,
    headerMediaUrl: !auth && d.headerType === "IMAGE" ? d.headerMediaUrl.trim() : null,
    body: auth ? "" : d.body.trim(),
    footer: auth ? null : d.footer.trim() || null,
    buttons: auth ? [{ type: "COPY_CODE", text: d.buttons[0]?.text || "Copy code" }] : d.buttons,
    variables: d.variables,
    codeExpiryMins: auth ? d.codeExpiryMins : null,
    securityNote: auth ? d.securityNote : false,
  } as const;
}

async function metaComponents(d: TemplateDraft) {
  const handle = d.category !== "AUTHENTICATION" && d.headerType === "IMAGE" ? await uploadHeaderSample(d.headerMediaUrl) : undefined;
  return toMetaComponents(d, handle);
}

export async function saveTemplate(id: string | null, draft: TemplateDraft): Promise<ActionResult> {
  await requireUser();
  const errors = validateDraft(draft);
  if (errors.length) return { ok: false, errors };
  const { live } = waConfig();

  // Editing: Meta must accept the change first, so what we send always matches what Meta approved.
  if (id) {
    const existing = await db.template.findUnique({ where: { id } });
    if (!existing) return { ok: false, message: "Template not found." };
    const merged = { ...draft, name: existing.name, language: existing.language, category: existing.category };
    try {
      if (live && existing.metaId) await editMetaTemplate(existing.metaId, await metaComponents(merged));
      else if (live) {
        const res = await createMetaTemplate({ name: existing.name, language: existing.language, category: existing.category, components: await metaComponents(merged) });
        await db.template.update({ where: { id }, data: { metaId: res.id } });
      }
    } catch (e) {
      return { ok: false, message: `Meta did not accept the change: ${errText(e)}` };
    }
    await db.template.update({
      where: { id },
      data: { ...contentFields(merged), status: live ? "PENDING" : "APPROVED", statusReason: null },
    });
    revalidatePath("/dashboard/templates");
    return {
      ok: true,
      id,
      message: live
        ? "Saved and sent to Meta for review. Batches pause until it's approved again, usually within minutes."
        : "Saved. Demo mode approves templates instantly.",
    };
  }

  if (await db.template.findUnique({ where: { name_language: { name: draft.name, language: draft.language } } })) {
    return { ok: false, errors: ["A template with this name and language already exists."] };
  }
  const created = await db.template.create({
    data: { name: draft.name, language: draft.language, category: draft.category, ...contentFields(draft), status: live ? "DRAFT" : "APPROVED" },
  });
  if (!live) {
    revalidatePath("/dashboard/templates");
    return { ok: true, id: created.id, message: "Template created. Demo mode approves templates instantly." };
  }
  try {
    const res = await createMetaTemplate({ name: draft.name, language: draft.language, category: draft.category, components: await metaComponents(draft) });
    await db.template.update({
      where: { id: created.id },
      data: { metaId: res.id, status: mapMetaStatus(res.status), category: res.category as never, lastSyncedAt: new Date() },
    });
  } catch (e) {
    await db.template.update({ where: { id: created.id }, data: { statusReason: errText(e) } });
    revalidatePath("/dashboard/templates");
    return { ok: false, id: created.id, message: `Saved as a draft, but Meta rejected it: ${errText(e)}` };
  }
  revalidatePath("/dashboard/templates");
  return { ok: true, id: created.id, message: "Submitted to Meta for approval." };
}

export async function syncTemplates(): Promise<ActionResult> {
  await requireUser();
  if (!waConfig().live) return { ok: false, message: "Connect WhatsApp in Settings to sync templates from Meta." };
  try {
    const remote = await listMetaTemplates();
    let imported = 0;
    for (const r of remote) {
      const parsed = fromMetaComponents(r.components ?? []);
      const status = mapMetaStatus(r.status);
      const category = (["MARKETING", "UTILITY", "AUTHENTICATION"].includes(r.category) ? r.category : "UTILITY") as never;
      const local = await db.template.findFirst({ where: { OR: [{ metaId: r.id }, { name: r.name, language: r.language }] } });
      const content = {
        ...parsed,
        headerText: parsed.headerType === "TEXT" ? parsed.headerText : null,
        footer: parsed.footer || null,
        category,
        status,
        statusReason: r.rejected_reason && r.rejected_reason !== "NONE" ? r.rejected_reason : null,
        metaId: r.id,
        lastSyncedAt: new Date(),
      };
      if (local) {
        await db.template.update({ where: { id: local.id }, data: content });
      } else {
        await db.template.create({ data: { name: r.name, language: r.language, ...content, variables: { "1": { source: "name" } } } });
        imported++;
      }
    }
    revalidatePath("/dashboard/templates");
    return { ok: true, message: `Synced ${remote.length} templates from Meta${imported ? `, ${imported} new` : ""}.` };
  } catch (e) {
    return { ok: false, message: errText(e) };
  }
}

export async function deleteTemplate(id: string): Promise<ActionResult> {
  await requireUser();
  const t = await db.template.findUnique({ where: { id }, include: { _count: { select: { campaigns: true } } } });
  if (!t) return { ok: false, message: "Template not found." };
  if (t._count.campaigns) return { ok: false, message: "This template is used by a campaign. Change or delete the campaign first." };
  try {
    if (waConfig().live && t.metaId) await deleteMetaTemplate(t.name, t.metaId);
  } catch (e) {
    return { ok: false, message: errText(e) };
  }
  await db.template.delete({ where: { id } });
  revalidatePath("/dashboard/templates");
  return { ok: true, message: "Template deleted." };
}

export async function sendTestMessage(id: string, rawPhone: string): Promise<ActionResult> {
  await requireUser();
  const phone = normalizePhone(rawPhone);
  if (!phone) return { ok: false, message: "Enter a valid mobile number." };
  const t = await db.template.findUnique({ where: { id } });
  if (!t) return { ok: false, message: "Template not found." };
  if (t.status !== "APPROVED") return { ok: false, message: "Only approved templates can be sent." };
  if (t.category === "AUTHENTICATION") return { ok: false, message: "Authentication templates are sent by your app's login flow, not from here." };

  const customer =
    (await db.customer.findUnique({ where: { phone } })) ??
    (await db.customer.create({ data: { phone, name: "Test recipient", tags: ["test"] } }));
  const r = renderFor({ ...t, headerText: t.headerText ?? "", footer: t.footer ?? "", variables: t.variables as VarMap }, customer);
  const body = [r.header, r.body, r.footer].filter(Boolean).join("\n\n");
  try {
    const res = await sendTemplateMessage({
      to: phone, templateName: t.name, language: t.language, headerType: t.headerType,
      headerMediaUrl: t.headerMediaUrl, headerParams: r.headerParams, bodyParams: r.bodyParams,
    });
    await db.message.create({
      data: { customerId: customer.id, templateId: t.id, templateName: t.name, body, status: "SENT", waMessageId: res.id, simulated: res.simulated, sentAt: new Date() },
    });
    revalidatePath("/dashboard/messages");
    return { ok: true, message: res.simulated ? "Simulated send logged (demo mode)." : `Test sent to +${phone}.` };
  } catch (e) {
    await db.message.create({
      data: { customerId: customer.id, templateId: t.id, templateName: t.name, body, status: "FAILED", error: errText(e), failedAt: new Date() },
    });
    return { ok: false, message: errText(e) };
  }
}
