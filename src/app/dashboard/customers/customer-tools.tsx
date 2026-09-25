"use client";

import { FileUp, Loader2, UserPlus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toastResult } from "@/components/toast";
import { Button, Card, Label } from "@/components/ui";
import { importCustomers, saveCustomer } from "../actions/customers";

export function CustomerTools() {
  const [open, setOpen] = useState<"add" | "import" | null>(null);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(open === "import" ? null : "import")}>
        <FileUp className="size-4" /> Import CSV
      </Button>
      <Button onClick={() => setOpen(open === "add" ? null : "add")}>
        <UserPlus className="size-4" /> Add customer
      </Button>
      {open && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-night/40 p-4 backdrop-blur-sm" onClick={() => setOpen(null)}>
          <Card className="w-full max-w-md animate-rise p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-semibold">{open === "add" ? "Add customer" : "Import customers"}</h2>
              <button onClick={() => setOpen(null)} className="text-muted hover:text-ink" aria-label="Close"><X className="size-4" /></button>
            </div>
            {open === "add" ? <AddForm done={() => setOpen(null)} /> : <ImportForm done={() => setOpen(null)} />}
          </Card>
        </div>
      )}
    </>
  );
}

function AddForm({ done }: { done: () => void }) {
  const [v, setV] = useState({ name: "", phone: "", tags: "" });
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await saveCustomer(null, v);
          toastResult(r);
          if (r.ok) { done(); router.refresh(); }
        });
      }}
    >
      <div><Label htmlFor="n">Name</Label><input id="n" className="field" required value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} /></div>
      <div><Label htmlFor="p" hint="10-digit numbers get +91">WhatsApp number</Label><input id="p" className="field" required placeholder="+91 98765 43210" value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} /></div>
      <div><Label htmlFor="t" hint="comma separated, optional">Tags</Label><input id="t" className="field" placeholder="vip, chennai" value={v.tags} onChange={(e) => setV({ ...v, tags: e.target.value })} /></div>
      <Button className="w-full" disabled={pending}>{pending ? <Loader2 className="size-4 animate-spin" /> : "Add customer"}</Button>
    </form>
  );
}

function ImportForm({ done }: { done: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [tags, setTags] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!file) return;
        start(async () => {
          const r = await importCustomers(await file.text(), tags);
          toastResult(r);
          if (r.ok) { done(); router.refresh(); }
        });
      }}
    >
      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-line px-4 py-8 text-center transition hover:border-brand hover:bg-brand-soft/30">
        <FileUp className="size-6 text-brand" />
        <span className="text-sm font-medium">{file ? file.name : "Choose a .csv file"}</span>
        <span className="text-xs text-muted">Columns: <code>name, phone, tags</code>. Existing numbers are updated, not duplicated.</span>
        <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </label>
      <div><Label htmlFor="it" hint="optional">Add these tags to everyone</Label><input id="it" className="field" placeholder="october-list" value={tags} onChange={(e) => setTags(e.target.value)} /></div>
      <p className="text-xs text-muted">
        Excel: File → Save As → CSV UTF-8. <a className="font-medium text-brand-deep underline" href={`data:text/csv;charset=utf-8,${encodeURIComponent("name,phone,tags\nPriya Sharma,9876543210,vip\nArjun Rao,+91 91234 56789,\n")}`} download="customers-sample.csv">Download a sample</a>
      </p>
      <Button className="w-full" disabled={pending || !file}>{pending ? <Loader2 className="size-4 animate-spin" /> : "Import"}</Button>
    </form>
  );
}
