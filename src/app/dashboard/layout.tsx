import { LogOut, MessageCircle } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getSettings, isSimulated } from "@/lib/provider";
import { logout } from "../login/actions";
import { MobileNav, SideNav } from "./nav";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const user = await requireUser();
  const settings = await getSettings();
  const via = settings.provider === "LOCAL" ? "Local session" : "Meta Cloud API";

  const mode = !isSimulated(settings) ? (
    <span className="flex items-center gap-2 text-xs text-emerald-300"><span className="size-2 animate-pulse rounded-full bg-emerald-400" />Sending via {via}</span>
  ) : (
    <span className="flex items-center gap-2 text-xs text-amber-300"><span className="size-2 rounded-full bg-amber-400" />Demo mode · {via} not set up</span>
  );

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-night px-4 py-6 lg:flex">
        <div className="mb-8 flex items-center gap-2.5 px-2">
          <span className="grid size-9 place-items-center rounded-xl bg-brand text-white"><MessageCircle className="size-5" /></span>
          <div>
            <p className="text-sm font-semibold text-white">Campaign Portal</p>
            <p className="text-[11px] text-white/50">WhatsApp Business</p>
          </div>
        </div>
        <SideNav />
        <div className="mt-auto space-y-4 border-t border-white/10 px-2 pt-4">
          {mode}
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm text-white">{user.name}</p>
              <p className="truncate text-xs text-white/50">{user.email}</p>
            </div>
            <form action={logout}>
              <button title="Sign out" className="grid size-8 place-items-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white">
                <LogOut className="size-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-30 space-y-3 bg-night px-4 pb-3 pt-4 lg:hidden">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 font-semibold text-white"><MessageCircle className="size-5 text-emerald-400" />Campaign Portal</span>
          <form action={logout}><button className="text-xs text-white/60">Sign out</button></form>
        </div>
        {mode}
        <MobileNav />
      </header>

      <main className="mx-auto max-w-7xl animate-rise px-4 py-8 sm:px-8">{children}</main>
    </div>
  );
}
