import { Sidebar } from "@/components/shared/Sidebar";
import { Header } from "@/components/shared/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex h-screen overflow-hidden bg-slate-100 font-sans text-slate-900 dark:bg-[#0b1220] dark:text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(0,97,255,0.08),transparent_30%),radial-gradient(circle_at_90%_90%,rgba(30,41,59,0.16),transparent_35%)]" />
      <Sidebar />
      <main className="relative z-10 flex flex-1 flex-col overflow-y-auto">
        <Header />
        <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
