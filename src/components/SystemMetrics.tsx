import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from "recharts";
import { getSystemMetrics, type SystemMetricsData } from "@/lib/admin";

interface HistoryPoint {
  time: string;
  memory: number;
  cpuLoad: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / k ** i).toFixed(2)} ${sizes[i]}`;
}

function formatDuration(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

export function SystemMetrics() {
  const [metrics, setMetrics] = useState<SystemMetricsData | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getSystemMetrics();
        if (cancelled) return;
        setMetrics(data);
        setError(null);

        setHistory((prev) => {
          const now = new Date().toLocaleTimeString();
          const newPoint: HistoryPoint = {
            time: now,
            memory: data.memory.usedPercentage,
            cpuLoad: data.cpu.loadAverage[0] ?? 0,
          };
          const next = [...prev, newPoint];
          if (next.length > 60) return next.slice(next.length - 60);
          return next;
        });
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load system metrics");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    const interval = window.setInterval(load, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const statCards = useMemo(() => {
    if (!metrics) return [];
    return [
      {
        label: "CPU Load",
        value: metrics.cpu.loadAverage[0]?.toFixed(2) ?? "0.00",
        subtext: `${metrics.cpu.count} core${metrics.cpu.count === 1 ? "" : "s"}`,
      },
      {
        label: "Memory Used",
        value: `${metrics.memory.usedPercentage.toFixed(1)}%`,
        subtext: `${formatBytes(metrics.memory.used)} / ${formatBytes(metrics.memory.total)}`,
      },
      {
        label: "Uptime",
        value: formatDuration(metrics.uptime),
        subtext: metrics.hostname,
      },
      {
        label: "Disk Used",
        value: metrics.disk ? `${((metrics.disk.used / metrics.disk.total) * 100).toFixed(1)}%` : "N/A",
        subtext: metrics.disk
          ? `${formatBytes(metrics.disk.used)} / ${formatBytes(metrics.disk.total)}`
          : "Disk info unavailable",
      },
    ];
  }, [metrics]);

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center">
        <p className="text-text-secondary text-sm">Loading system metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 text-center">
        <p className="text-rose-400 text-sm">{error}</p>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center">
        <p className="text-text-secondary text-sm">No system metrics available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
          >
            <p className="text-xs text-text-secondary uppercase font-semibold tracking-wider">
              {stat.label}
            </p>
            <p className="text-2xl font-bold text-text mt-1">{stat.value}</p>
            <p className="text-xs text-text-secondary/70 mt-1 truncate">{stat.subtext}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Memory Usage %">
          <AreaChart data={history} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <defs>
              <linearGradient id="memoryGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f472b6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f472b6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <YAxis tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }} domain={[0, 100]} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(0,0,0,0.8)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "0.5rem",
                color: "#fff",
                fontSize: "0.75rem",
              }}
            />
            <Area
              type="monotone"
              dataKey="memory"
              stroke="#f472b6"
              strokeWidth={2}
              fill="url(#memoryGradient)"
              dot={false}
              activeDot={{ r: 4, fill: "#f472b6" }}
            />
          </AreaChart>
        </ChartCard>

        <ChartCard title="CPU Load (1 min)">
          <AreaChart data={history} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <defs>
              <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34d399" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
            </defs>
            <YAxis tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }} domain={[0, "auto"]} allowDecimals />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(0,0,0,0.8)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "0.5rem",
                color: "#fff",
                fontSize: "0.75rem",
              }}
            />
            <Area
              type="monotone"
              dataKey="cpuLoad"
              stroke="#34d399"
              strokeWidth={2}
              fill="url(#cpuGradient)"
              dot={false}
              activeDot={{ r: 4, fill: "#34d399" }}
            />
          </AreaChart>
        </ChartCard>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <h3 className="text-sm font-semibold text-text mb-3">System Info</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between sm:flex-col sm:justify-start">
            <span className="text-text-secondary">Platform</span>
            <span className="text-text font-medium">{metrics.platform}</span>
          </div>
          <div className="flex justify-between sm:flex-col sm:justify-start">
            <span className="text-text-secondary">Hostname</span>
            <span className="text-text font-medium">{metrics.hostname}</span>
          </div>
          <div className="flex justify-between sm:flex-col sm:justify-start">
            <span className="text-text-secondary">CPU</span>
            <span className="text-text font-medium truncate" title={metrics.cpu.model}>
              {metrics.cpu.model}
            </span>
          </div>
          <div className="flex justify-between sm:flex-col sm:justify-start">
            <span className="text-text-secondary">Last updated</span>
            <span className="text-text font-medium">
              {new Date(metrics.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <h3 className="text-sm font-semibold text-text mb-4">{title}</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default SystemMetrics;
