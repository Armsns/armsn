import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getAnalytics, type AnalyticsData, type AnalyticsEvent } from "@/lib/admin";

interface TimeSeriesPoint {
  day: string;
  count: number;
}

const tooltipStyle = {
  backgroundColor: "rgba(0, 0, 0, 0.8)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: "0.5rem",
  color: "#fff",
  fontSize: "0.75rem",
};

const axisStyle = {
  fill: "rgba(255, 255, 255, 0.5)",
  fontSize: "0.7rem",
};

const gridStyle = {
  stroke: "rgba(255, 255, 255, 0.05)",
};

function getDefaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return { start: start.toISOString().split("T")[0], end: end.toISOString().split("T")[0] };
}

export function AnalyticsCharts() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>(getDefaultDateRange().start);
  const [endDate, setEndDate] = useState<string>(getDefaultDateRange().end);
  const [isRefetching, setIsRefetching] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsRefetching(true);
      try {
        const analytics = await getAnalytics(startDate, endDate);
        if (cancelled) return;
        setData(analytics);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load analytics");
      } finally {
        if (!cancelled) {
          setLoading(false);
          setIsRefetching(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [startDate, endDate]);

  const dayCount = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
  }, [startDate, endDate]);

  const paddedViews = useMemo(
    () => fillMissingDays(data?.viewsOverTime ?? [], startDate, endDate),
    [data?.viewsOverTime, startDate, endDate],
  );
  const paddedServerRequests = useMemo(
    () => fillMissingDays(data?.serverRequestsOverTime ?? [], startDate, endDate),
    [data?.serverRequestsOverTime, startDate, endDate],
  );

  const topPagesLimited = useMemo(() => (data?.topPages ?? []).slice(0, 8), [data?.topPages]);

  const hasData =
    paddedViews.some((d) => d.count > 0) ||
    paddedServerRequests.some((d) => d.count > 0) ||
    topPagesLimited.length > 0;

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center">
        <p className="text-text-secondary text-sm">Loading analytics...</p>
      </div>
    );
  }

  const dateRangeError = startDate > endDate ? "Start date must be before end date" : null;

  if (error || dateRangeError) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 text-center">
        <p className="text-rose-400 text-sm">{dateRangeError || error}</p>
      </div>
    );
  }

  if (!data || !hasData) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center">
        <p className="text-text-secondary text-sm">
          No analytics data yet. Data will appear as visitors use the site.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        {isRefetching && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl">
            <span className="text-text text-sm">Updating...</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <label htmlFor="analytics-start-date" className="text-sm text-text-secondary">
            From
          </label>
          <input
            id="analytics-start-date"
            type="date"
            value={startDate}
            max={endDate}
            disabled={isRefetching}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-9 px-2 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-text focus:outline-none focus:border-accent/50 focus:bg-white/[0.06] transition-all disabled:opacity-50"
          />
          <label htmlFor="analytics-end-date" className="text-sm text-text-secondary">
            To
          </label>
          <input
            id="analytics-end-date"
            type="date"
            value={endDate}
            min={startDate}
            disabled={isRefetching}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-9 px-2 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-text focus:outline-none focus:border-accent/50 focus:bg-white/[0.06] transition-all disabled:opacity-50"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            const { start, end } = getDefaultDateRange();
            setStartDate(start);
            setEndDate(end);
          }}
          className="text-xs text-text-secondary hover:text-text underline transition-colors"
        >
          Reset to last 30 days
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard label="Total Views" value={data.totalViews} />
        <StatCard label="Unique Visitors" value={data.uniqueVisitors} />
        <StatCard label="Server Requests" value={data.totalServerRequests} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title={`Page Views (${dayCount} Days)`}>
          <AreaChart data={paddedViews} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <defs>
              <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStyle.stroke} />
            <XAxis
              dataKey="day"
              tick={{ ...axisStyle }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
              interval="preserveStartEnd"
            />
            <YAxis tick={{ ...axisStyle }} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#818cf8"
              strokeWidth={2}
              fill="url(#viewsGradient)"
              dot={false}
              activeDot={{ r: 4, fill: "#818cf8" }}
            />
          </AreaChart>
        </ChartCard>

        <ChartCard title={`Server Requests (${dayCount} Days)`}>
          <AreaChart
            data={paddedServerRequests}
            margin={{ top: 5, right: 5, bottom: 5, left: -20 }}
          >
            <defs>
              <linearGradient id="serverRequestsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34d399" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStyle.stroke} />
            <XAxis
              dataKey="day"
              tick={{ ...axisStyle }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
              interval="preserveStartEnd"
            />
            <YAxis tick={{ ...axisStyle }} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#34d399"
              strokeWidth={2}
              fill="url(#serverRequestsGradient)"
              dot={false}
              activeDot={{ r: 4, fill: "#34d399" }}
            />
          </AreaChart>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Top Pages">
          <BarChart
            data={topPagesLimited}
            layout="vertical"
            margin={{ top: 5, right: 5, bottom: 5, left: 40 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={gridStyle.stroke} horizontal={false} />
            <XAxis type="number" tick={{ ...axisStyle }} allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="path"
              tick={{ ...axisStyle }}
              width={120}
              tickFormatter={(value: string) => {
                if (value.length <= 20) return value;
                return `${value.slice(0, 20)}...`;
              }}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="count" fill="#818cf8" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartCard>

        <EventList title="Recent Logins" events={data.recentLogins} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <EventList title="Recent Proxy Usage" events={data.recentProxyUsage} />
        <EventList title="Recent Server Requests" events={data.recentServerRequests} />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs text-text-secondary uppercase font-semibold tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-text mt-1">{value}</p>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
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

function EventList({ title, events }: { title: string; events: AnalyticsEvent[] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <h3 className="text-sm font-semibold text-text mb-3">{title}</h3>
      <ul className="space-y-1.5 text-sm">
        {events.length === 0 ? (
          <li className="text-text-secondary text-xs italic py-2">No {title.toLowerCase()} yet</li>
        ) : (
          events.map((event) => (
            <li
              key={event.id}
              className="flex items-center justify-between bg-white/[0.03] border border-white/5 p-2.5 rounded-lg"
            >
              <div className="min-w-0">
                <span className="text-text font-medium truncate block">
                  {event.path || "—"}
                </span>
                <span className="text-xs text-text-secondary">
                  {event.username || "Anonymous"} · {formatDate(event.created_at)}
                </span>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function fillMissingDays(
  data: TimeSeriesPoint[],
  startDateStr: string,
  endDateStr: string,
): TimeSeriesPoint[] {
  const result: TimeSeriesPoint[] = [];
  const start = new Date(startDateStr);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDateStr);
  end.setHours(0, 0, 0, 0);

  const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  for (let i = 0; i < days; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    const day = date.toISOString().split("T")[0];
    const existing = data.find((d) => d.day === day);
    result.push({ day, count: existing ? existing.count : 0 });
  }

  return result;
}

export default AnalyticsCharts;
