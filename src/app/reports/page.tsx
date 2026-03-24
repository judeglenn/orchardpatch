import { BarChart3, FileText, Download, ShieldCheck, ChevronRight } from "lucide-react";

const FEATURES = [
  {
    icon: <BarChart3 className="h-5 w-5" style={{ color: "#1565c0" }} />,
    title: "Compliance Dashboard",
    description: "At-a-glance view of fleet patch status. See what percentage of devices are on the latest version for every app.",
    bg: "#e3f2fd",
  },
  {
    icon: <FileText className="h-5 w-5" style={{ color: "#6a1b9a" }} />,
    title: "Audit Trail",
    description: "Full history of every patch deployed — who triggered it, which mode, which devices, and the outcome. Built for compliance reviews.",
    bg: "#f3e5f5",
  },
  {
    icon: <Download className="h-5 w-5" style={{ color: "#2d5016" }} />,
    title: "CSV / PDF Export",
    description: "Export version drift reports, installed app lists, and patch history. Share with your security team or management in one click.",
    bg: "#f0f7e8",
  },
  {
    icon: <ShieldCheck className="h-5 w-5" style={{ color: "#e65100" }} />,
    title: "Version Drift Analysis",
    description: "Identify apps that have been falling behind the longest. Prioritize which patches matter most based on version age and device count.",
    bg: "#fff3e0",
  },
];

export default function ReportsPage() {
  return (
    <div className="px-6 py-6 max-w-3xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl" style={{ background: "#e3f2fd" }}>
            📊
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold" style={{ color: "#1a1a2e" }}>Reports</h1>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#fff3e0", color: "#e65100" }}>
                Coming Soon
              </span>
            </div>
            <p className="text-sm mt-0.5" style={{ color: "#6b7280" }}>Compliance dashboards, audit trails, and exports</p>
          </div>
        </div>
        <div className="rounded-xl px-5 py-4" style={{ background: "#e3f2fd", border: "1px solid #90caf9" }}>
          <p className="text-sm leading-relaxed" style={{ color: "#1565c0" }}>
            Know exactly where your fleet stands at all times. Reports gives you the data your security team, compliance auditors, and management need — without digging through MDM logs.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-xl border bg-white p-5" style={{ borderColor: "#e2e4e7", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg mb-3" style={{ background: f.bg }}>{f.icon}</div>
            <p className="text-sm font-semibold mb-1.5" style={{ color: "#1a1a2e" }}>{f.title}</p>
            <p className="text-xs leading-relaxed" style={{ color: "#6b7280" }}>{f.description}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border px-5 py-4 flex items-center justify-between" style={{ background: "#1a2e0d", borderColor: "#2d5016" }}>
        <div>
          <p className="text-sm font-semibold text-white mb-0.5">Available on Pro & Enterprise</p>
          <p className="text-xs" style={{ color: "#a0c878" }}>Join the waitlist to be notified when Reports launches.</p>
        </div>
        <a href="https://orchardpatch.com" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 shrink-0 ml-4 rounded-lg px-3 py-2 text-xs font-semibold"
          style={{ background: "#2d5016", color: "white" }}>
          Join Waitlist <ChevronRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
