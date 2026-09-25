import type { Prisma } from "@prisma/client";
import { Search, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ActionButton } from "@/components/action-button";
import { Badge, buttonClass, Card, EmptyState, PageHeader } from "@/components/ui";
import { cn } from "@/lib/cn";
import { db } from "@/lib/db";
import { fmtDate, fmtNumber } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { deleteCustomer, setOptOut } from "../actions/customers";
import { CustomerTools } from "./customer-tools";

export const metadata: Metadata = { title: "Customers" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function CustomersPage({ searchParams }: PageProps<"/dashboard/customers">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const tag = typeof sp.tag === "string" ? sp.tag : "";
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.CustomerWhereInput = {
    ...(tag === "__optout" ? { optedOut: true } : tag ? { tags: { has: tag } } : {}),
    ...(q && { OR: [{ name: { contains: q, mode: "insensitive" } }, { phone: { contains: q.replace(/\D/g, "") || q } }] }),
  };
  const [rows, total, tags] = await Promise.all([
    db.customer.findMany({
      where,
      include: { messages: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true, status: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.customer.count({ where }),
    db.$queryRaw<{ tag: string }[]>`SELECT DISTINCT unnest(tags) AS tag FROM "Customer" ORDER BY 1`,
  ]);
  const qs = (patch: Record<string, string | undefined>) => {
    const s = new URLSearchParams(Object.entries({ q, tag, ...patch }).filter(([, v]) => v) as [string, string][]);
    return `/dashboard/customers${s.size ? `?${s}` : ""}`;
  };

  return (
    <>
      <PageHeader
        title="Customers"
        description="Everyone who can receive your campaigns. Customers who reply STOP are opted out automatically."
        actions={<CustomerTools />}
      />

      <Card>
        <form className="flex flex-col gap-2 border-b border-line p-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input name="q" defaultValue={q} placeholder="Search name or number" className="field pl-9" />
          </div>
          <select name="tag" defaultValue={tag} className="field sm:w-48">
            <option value="">All customers</option>
            <option value="__optout">Opted out</option>
            {tags.map((t) => (
              <option key={t.tag} value={t.tag}>Tag: {t.tag}</option>
            ))}
          </select>
          <button className={buttonClass("secondary")}>Filter</button>
        </form>

        {rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th className="px-4 py-2.5 font-medium">Customer</th>
                  <th className="px-4 py-2.5 font-medium">Tags</th>
                  <th className="px-4 py-2.5 font-medium">Last message</th>
                  <th className="px-4 py-2.5 font-medium">Added</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((c) => (
                  <tr key={c.id} className="hover:bg-canvas/60">
                    <td className="px-4 py-3">
                      <p className="font-medium">{c.name}</p>
                      <p className="tabular text-xs text-muted">{formatPhone(c.phone)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {c.optedOut && <Badge tone="red">Opted out</Badge>}
                        {c.tags.map((t) => (
                          <Link key={t} href={qs({ tag: t, page: undefined })}><Badge>{t}</Badge></Link>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">{c.messages[0] ? `${fmtDate(c.messages[0].createdAt, "d MMM")} · ${c.messages[0].status.toLowerCase()}` : "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted">{fmtDate(c.createdAt, "d MMM yyyy")}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <ActionButton action={setOptOut.bind(null, c.id, !c.optedOut)} variant="ghost">{c.optedOut ? "Opt in" : "Opt out"}</ActionButton>
                        <ActionButton action={deleteCustomer.bind(null, c.id)} variant="ghost" confirm={`Delete ${c.name} and their message history?`}>Delete</ActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={<Users className="size-5" />} title={q || tag ? "No matching customers" : "No customers yet"}>
            {q || tag ? "Try a different search." : "Import your customer list as a CSV to get started."}
          </EmptyState>
        )}

        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t border-line px-4 py-3 text-xs text-muted">
            <span className="tabular">{fmtNumber((page - 1) * PAGE_SIZE + 1)}–{fmtNumber(Math.min(page * PAGE_SIZE, total))} of {fmtNumber(total)}</span>
            <div className="flex gap-1">
              <Link href={qs({ page: String(page - 1) })} className={cn(buttonClass("secondary", "sm"), page <= 1 && "pointer-events-none opacity-40")}>Prev</Link>
              <Link href={qs({ page: String(page + 1) })} className={cn(buttonClass("secondary", "sm"), page * PAGE_SIZE >= total && "pointer-events-none opacity-40")}>Next</Link>
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
