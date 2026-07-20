import { c as createComponent, r as renderComponent, m as maybeRenderHead, a as renderTemplate, b as createAstro, d as renderScript } from '../chunks/astro/server_B5uWz4y8.mjs';
import 'piccolore';
import { $ as $$, a as $$Main, b as $$Shield } from '../chunks/Main_CQyHQ8wO.mjs';
import { $ as $$Users, a as $$Eye, b as $$EyeOff, c as $$UserPlus, d as $$KeyRound } from '../chunks/Users_Cqss292D.mjs';
import { $ as $$Search } from '../chunks/Search_D7XepV_R.mjs';
import { jsx, jsxs } from 'react/jsx-runtime';
import { useState, useEffect, useMemo } from 'react';
import { AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area, BarChart, Bar, ResponsiveContainer } from 'recharts';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro();
const $$Activity = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Activity;
  return renderTemplate`${renderComponent($$result, "Layout", $$, { "iconName": "activity", ...Astro2.props }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"></path> ` })}`;
}, "/Users/arman/Documents/GitHub/armsn/node_modules/lucide-astro/dist/Activity.astro", void 0);

async function getAnalytics(startDate, endDate) {
  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  const query = params.toString();
  const res = await fetch(`/api/admin/analytics${query ? `?${query}` : ""}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: "Failed to load analytics" }));
    throw new Error(data.error || "Failed to load analytics");
  }
  return await res.json();
}

const tooltipStyle = {
  backgroundColor: "rgba(0, 0, 0, 0.8)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: "0.5rem",
  color: "#fff",
  fontSize: "0.75rem"
};
const axisStyle = {
  fill: "rgba(255, 255, 255, 0.5)",
  fontSize: "0.7rem"
};
const gridStyle = {
  stroke: "rgba(255, 255, 255, 0.05)"
};
function getDefaultDateRange() {
  const end = /* @__PURE__ */ new Date();
  const start = /* @__PURE__ */ new Date();
  start.setDate(start.getDate() - 30);
  return { start: start.toISOString().split("T")[0], end: end.toISOString().split("T")[0] };
}
function AnalyticsCharts() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(getDefaultDateRange().start);
  const [endDate, setEndDate] = useState(getDefaultDateRange().end);
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
    return Math.max(1, Math.ceil(diffTime / (1e3 * 60 * 60 * 24)) + 1);
  }, [startDate, endDate]);
  const paddedViews = useMemo(
    () => fillMissingDays(data?.viewsOverTime ?? [], startDate, endDate),
    [data?.viewsOverTime, startDate, endDate]
  );
  const paddedServerRequests = useMemo(
    () => fillMissingDays(data?.serverRequestsOverTime ?? [], startDate, endDate),
    [data?.serverRequestsOverTime, startDate, endDate]
  );
  const topPagesLimited = useMemo(() => (data?.topPages ?? []).slice(0, 8), [data?.topPages]);
  const hasData = paddedViews.some((d) => d.count > 0) || paddedServerRequests.some((d) => d.count > 0) || topPagesLimited.length > 0;
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center", children: /* @__PURE__ */ jsx("p", { className: "text-text-secondary text-sm", children: "Loading analytics..." }) });
  }
  const dateRangeError = startDate > endDate ? "Start date must be before end date" : null;
  if (error || dateRangeError) {
    return /* @__PURE__ */ jsx("div", { className: "rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 text-center", children: /* @__PURE__ */ jsx("p", { className: "text-rose-400 text-sm", children: dateRangeError || error }) });
  }
  if (!data || !hasData) {
    return /* @__PURE__ */ jsx("div", { className: "rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center", children: /* @__PURE__ */ jsx("p", { className: "text-text-secondary text-sm", children: "No analytics data yet. Data will appear as visitors use the site." }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4", children: [
      isRefetching && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl", children: /* @__PURE__ */ jsx("span", { className: "text-text text-sm", children: "Updating..." }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "analytics-start-date", className: "text-sm text-text-secondary", children: "From" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            id: "analytics-start-date",
            type: "date",
            value: startDate,
            max: endDate,
            disabled: isRefetching,
            onChange: (e) => setStartDate(e.target.value),
            className: "h-9 px-2 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-text focus:outline-none focus:border-accent/50 focus:bg-white/[0.06] transition-all disabled:opacity-50"
          }
        ),
        /* @__PURE__ */ jsx("label", { htmlFor: "analytics-end-date", className: "text-sm text-text-secondary", children: "To" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            id: "analytics-end-date",
            type: "date",
            value: endDate,
            min: startDate,
            disabled: isRefetching,
            onChange: (e) => setEndDate(e.target.value),
            className: "h-9 px-2 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-text focus:outline-none focus:border-accent/50 focus:bg-white/[0.06] transition-all disabled:opacity-50"
          }
        )
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => {
            const { start, end } = getDefaultDateRange();
            setStartDate(start);
            setEndDate(end);
          },
          className: "text-xs text-text-secondary hover:text-text underline transition-colors",
          children: "Reset to last 30 days"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-3", children: [
      /* @__PURE__ */ jsx(StatCard, { label: "Total Views", value: data.totalViews }),
      /* @__PURE__ */ jsx(StatCard, { label: "Unique Visitors", value: data.uniqueVisitors }),
      /* @__PURE__ */ jsx(StatCard, { label: "Server Requests", value: data.totalServerRequests })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-4", children: [
      /* @__PURE__ */ jsx(ChartCard, { title: `Page Views (${dayCount} Days)`, children: /* @__PURE__ */ jsxs(AreaChart, { data: paddedViews, margin: { top: 5, right: 5, bottom: 5, left: -20 }, children: [
        /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", { id: "viewsGradient", x1: "0", y1: "0", x2: "0", y2: "1", children: [
          /* @__PURE__ */ jsx("stop", { offset: "5%", stopColor: "#818cf8", stopOpacity: 0.4 }),
          /* @__PURE__ */ jsx("stop", { offset: "95%", stopColor: "#818cf8", stopOpacity: 0 })
        ] }) }),
        /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: gridStyle.stroke }),
        /* @__PURE__ */ jsx(
          XAxis,
          {
            dataKey: "day",
            tick: { ...axisStyle },
            tickFormatter: (value) => {
              const date = new Date(value);
              return `${date.getMonth() + 1}/${date.getDate()}`;
            },
            interval: "preserveStartEnd"
          }
        ),
        /* @__PURE__ */ jsx(YAxis, { tick: { ...axisStyle }, allowDecimals: false }),
        /* @__PURE__ */ jsx(Tooltip, { contentStyle: tooltipStyle }),
        /* @__PURE__ */ jsx(
          Area,
          {
            type: "monotone",
            dataKey: "count",
            stroke: "#818cf8",
            strokeWidth: 2,
            fill: "url(#viewsGradient)",
            dot: false,
            activeDot: { r: 4, fill: "#818cf8" }
          }
        )
      ] }) }),
      /* @__PURE__ */ jsx(ChartCard, { title: `Server Requests (${dayCount} Days)`, children: /* @__PURE__ */ jsxs(
        AreaChart,
        {
          data: paddedServerRequests,
          margin: { top: 5, right: 5, bottom: 5, left: -20 },
          children: [
            /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", { id: "serverRequestsGradient", x1: "0", y1: "0", x2: "0", y2: "1", children: [
              /* @__PURE__ */ jsx("stop", { offset: "5%", stopColor: "#34d399", stopOpacity: 0.4 }),
              /* @__PURE__ */ jsx("stop", { offset: "95%", stopColor: "#34d399", stopOpacity: 0 })
            ] }) }),
            /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: gridStyle.stroke }),
            /* @__PURE__ */ jsx(
              XAxis,
              {
                dataKey: "day",
                tick: { ...axisStyle },
                tickFormatter: (value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                },
                interval: "preserveStartEnd"
              }
            ),
            /* @__PURE__ */ jsx(YAxis, { tick: { ...axisStyle }, allowDecimals: false }),
            /* @__PURE__ */ jsx(Tooltip, { contentStyle: tooltipStyle }),
            /* @__PURE__ */ jsx(
              Area,
              {
                type: "monotone",
                dataKey: "count",
                stroke: "#34d399",
                strokeWidth: 2,
                fill: "url(#serverRequestsGradient)",
                dot: false,
                activeDot: { r: 4, fill: "#34d399" }
              }
            )
          ]
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-4", children: [
      /* @__PURE__ */ jsx(ChartCard, { title: "Top Pages", children: /* @__PURE__ */ jsxs(
        BarChart,
        {
          data: topPagesLimited,
          layout: "vertical",
          margin: { top: 5, right: 5, bottom: 5, left: 40 },
          children: [
            /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: gridStyle.stroke, horizontal: false }),
            /* @__PURE__ */ jsx(XAxis, { type: "number", tick: { ...axisStyle }, allowDecimals: false }),
            /* @__PURE__ */ jsx(
              YAxis,
              {
                type: "category",
                dataKey: "path",
                tick: { ...axisStyle },
                width: 120,
                tickFormatter: (value) => {
                  if (value.length <= 20) return value;
                  return `${value.slice(0, 20)}...`;
                }
              }
            ),
            /* @__PURE__ */ jsx(Tooltip, { contentStyle: tooltipStyle }),
            /* @__PURE__ */ jsx(Bar, { dataKey: "count", fill: "#818cf8", radius: [0, 4, 4, 0] })
          ]
        }
      ) }),
      /* @__PURE__ */ jsx(EventList, { title: "Recent Logins", events: data.recentLogins })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-4", children: [
      /* @__PURE__ */ jsx(EventList, { title: "Recent Proxy Usage", events: data.recentProxyUsage }),
      /* @__PURE__ */ jsx(EventList, { title: "Recent Server Requests", events: data.recentServerRequests })
    ] })
  ] });
}
function StatCard({ label, value }) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-white/10 bg-white/[0.03] p-4", children: [
    /* @__PURE__ */ jsx("p", { className: "text-xs text-text-secondary uppercase font-semibold tracking-wider", children: label }),
    /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-text mt-1", children: value })
  ] });
}
function ChartCard({
  title,
  children
}) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-white/10 bg-white/[0.03] p-4", children: [
    /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold text-text mb-4", children: title }),
    /* @__PURE__ */ jsx("div", { className: "h-64 w-full", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children }) })
  ] });
}
function EventList({ title, events }) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-white/10 bg-white/[0.03] p-4", children: [
    /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold text-text mb-3", children: title }),
    /* @__PURE__ */ jsx("ul", { className: "space-y-1.5 text-sm", children: events.length === 0 ? /* @__PURE__ */ jsxs("li", { className: "text-text-secondary text-xs italic py-2", children: [
      "No ",
      title.toLowerCase(),
      " yet"
    ] }) : events.map((event) => /* @__PURE__ */ jsx(
      "li",
      {
        className: "flex items-center justify-between bg-white/[0.03] border border-white/5 p-2.5 rounded-lg",
        children: /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsx("span", { className: "text-text font-medium truncate block", children: event.path || "—" }),
          /* @__PURE__ */ jsxs("span", { className: "text-xs text-text-secondary", children: [
            event.username || "Anonymous",
            " · ",
            formatDate(event.created_at)
          ] })
        ] })
      },
      event.id
    )) })
  ] });
}
function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}
function fillMissingDays(data, startDateStr, endDateStr) {
  const result = [];
  const start = new Date(startDateStr);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDateStr);
  end.setHours(0, 0, 0, 0);
  const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1e3 * 60 * 60 * 24)) + 1);
  for (let i = 0; i < days; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    const day = date.toISOString().split("T")[0];
    const existing = data.find((d) => d.day === day);
    result.push({ day, count: existing ? existing.count : 0 });
  }
  return result;
}

const $$Admin = createComponent(async ($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Main, {}, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="flex flex-col items-center pt-24 pb-12 px-4 min-h-screen"> <div class="text-center mb-10 animate-fade-in"> <h1 class="text-3xl font-normal tracking-tight text-text uppercase font-display">Admin</h1> <p class="mt-1 text-text-secondary text-sm">Manage users and system access</p> </div> <div id="admin-access-denied" class="hidden rounded-2xl border border-rose-500/30 bg-rose-500/5 p-8 text-center max-w-md"> ${renderComponent($$result2, "Shield", $$Shield, { "class": "w-12 h-12 text-rose-400 mx-auto mb-4", "stroke-width": 1.5 })} <h2 class="text-xl font-semibold text-text mb-2">Access Denied</h2> <p class="text-text-secondary text-sm">You must be logged in as the admin user to view this page.</p> </div> <div id="admin-panel" class="hidden w-full max-w-4xl animate-fade-in"> <div class="flex items-center justify-center gap-2 mb-6"> <button id="tab-users" type="button" class="px-4 py-2 rounded-lg text-sm font-medium bg-white/10 text-text transition-colors">
Users
</button> <button id="tab-analytics" type="button" class="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text hover:bg-white/5 transition-colors">
Analytics
</button> </div> <div id="users-section" class="rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl"> <div class="flex items-center gap-3 mb-6"> <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10 text-accent"> ${renderComponent($$result2, "Users", $$Users, { "class": "w-5 h-5", "stroke-width": 1.5 })} </div> <div> <h2 class="text-lg font-semibold text-text">User Management</h2> <p class="text-xs text-text-secondary">Create, reset, and remove user accounts</p> </div> </div> <form id="add-user-form" class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6"> <input id="new-username" name="new-username" type="text" placeholder="Username" required class="h-10 px-3 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:border-accent/50 focus:bg-white/[0.06] transition-all"> <div class="relative"> <input id="new-password" name="new-password" type="password" autocomplete="new-password" placeholder="Password" required minlength="6" class="w-full h-10 px-3 pr-10 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:border-accent/50 focus:bg-white/[0.06] transition-all"> <button type="button" id="toggle-password-visibility" class="absolute right-2 top-1/2 -translate-y-1/2 text-text-placeholder hover:text-text transition-colors" aria-label="Show password"> ${renderComponent($$result2, "Eye", $$Eye, { "id": "pw-eye", "class": "w-4 h-4", "stroke-width": 1.5 })} ${renderComponent($$result2, "EyeOff", $$EyeOff, { "id": "pw-eyeoff", "class": "w-4 h-4 hidden", "stroke-width": 1.5 })} </button> </div> <div class="sm:col-span-2"> <button id="add-user-btn" type="submit" class="w-full h-10 rounded-lg bg-accent/15 text-accent font-semibold hover:bg-accent/25 active:scale-[0.98] transition-all text-sm flex items-center justify-center gap-2"> ${renderComponent($$result2, "UserPlus", $$UserPlus, { "class": "w-4 h-4", "stroke-width": 1.5 })} <span>Add User</span> </button> </div> </form> <div class="mb-4"> <div class="flex items-center justify-between mb-2.5"> <p class="text-xs text-text-secondary uppercase font-semibold tracking-wider">Users</p> <span id="user-count" class="text-xs text-text-secondary/70 font-mono">0</span> </div> <div class="relative mb-2.5"> <input id="user-search" type="text" placeholder="Filter users..." autocomplete="off" class="w-full h-9 pl-8 pr-3 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:border-accent/50 focus:bg-white/[0.06] transition-all"> ${renderComponent($$result2, "Search", $$Search, { "class": "absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-placeholder pointer-events-none", "stroke-width": 1.5 })} </div> <ul id="user-list" class="space-y-1.5 text-sm text-text"> <li class="text-text-secondary text-xs italic py-2">Loading...</li> </ul> </div> </div> <div id="analytics-section" class="hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl"> <div class="flex items-center gap-3 mb-6"> <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10 text-accent"> ${renderComponent($$result2, "Activity", $$Activity, { "class": "w-5 h-5", "stroke-width": 1.5 })} </div> <div> <h2 class="text-lg font-semibold text-text">Analytics</h2> <p class="text-xs text-text-secondary">Page views, visitors, and activity</p> </div> </div> ${renderComponent($$result2, "AnalyticsCharts", AnalyticsCharts, { "client:load": true, "client:component-hydration": "load", "client:component-path": "@/components/AnalyticsCharts", "client:component-export": "default" })} </div> </div> </div>  <div id="proxy-history-modal" class="hidden fixed inset-0 z-[10000] flex items-center justify-center px-4"> <div id="proxy-history-overlay" class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div> <div class="relative w-full max-w-lg rounded-2xl border border-white/10 bg-background/95 backdrop-blur-md shadow-2xl p-6 space-y-4 max-h-[80vh] flex flex-col"> <div class="flex items-center justify-between"> <div class="flex items-center gap-2.5"> <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-accent/10 text-accent"> <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> </div> <div> <h3 class="text-sm font-semibold text-text uppercase tracking-wide font-display">Proxy History</h3> <p class="text-xs text-text-secondary mt-0.5">for <span id="proxy-history-username" class="text-text font-medium"></span></p> </div> </div> <button id="proxy-history-close" type="button" class="text-text-secondary hover:text-text transition-colors p-1 rounded" aria-label="Close proxy history"> <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> </button> </div> <div id="proxy-history-content" class="overflow-y-auto space-y-2 pr-1"> <p class="text-text-secondary text-sm italic">Loading...</p> </div> </div> </div>  <div id="reset-pw-modal" class="hidden fixed inset-0 z-[10000] flex items-center justify-center px-4"> <div id="reset-pw-overlay" class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div> <div class="relative w-full max-w-sm rounded-2xl border border-white/10 bg-background/95 backdrop-blur-md shadow-2xl p-6 space-y-4"> <div class="flex items-center gap-2.5"> <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-accent/10 text-accent"> ${renderComponent($$result2, "KeyRound", $$KeyRound, { "class": "w-4 h-4", "stroke-width": 1.5 })} </div> <div> <h3 class="text-sm font-semibold text-text uppercase tracking-wide font-display">Reset Password</h3> <p class="text-xs text-text-secondary mt-0.5">for <span id="reset-pw-username" class="text-text font-medium"></span></p> </div> </div> <form id="reset-pw-form" class="space-y-3"> <div class="relative"> <input id="reset-pw-input" name="reset-pw-input" type="password" autocomplete="new-password" placeholder="New password" required minlength="6" class="w-full h-10 px-3 pr-10 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:border-accent/50 focus:bg-white/[0.06] transition-all"> <button type="button" id="reset-pw-toggle" class="absolute right-2 top-1/2 -translate-y-1/2 text-text-placeholder hover:text-text transition-colors" aria-label="Show password"> ${renderComponent($$result2, "Eye", $$Eye, { "id": "reset-pw-eye", "class": "w-4 h-4", "stroke-width": 1.5 })} ${renderComponent($$result2, "EyeOff", $$EyeOff, { "id": "reset-pw-eyeoff", "class": "w-4 h-4 hidden", "stroke-width": 1.5 })} </button> </div> <p class="text-xs text-text-secondary">Password must be at least 6 characters.</p> <div class="flex gap-2 pt-1"> <button type="button" id="reset-pw-cancel" class="flex-1 h-10 rounded-lg bg-white/5 border border-white/10 text-text-secondary font-medium hover:bg-white/10 transition-all text-sm">
Cancel
</button> <button type="submit" id="reset-pw-submit" class="flex-1 h-10 rounded-lg bg-accent/15 text-accent font-semibold hover:bg-accent/25 active:scale-[0.98] transition-all text-sm">
Reset
</button> </div> </form> </div> </div> ${renderScript($$result2, "/Users/arman/Documents/GitHub/armsn/src/pages/admin.astro?astro&type=script&index=0&lang.ts")} ` })}`;
}, "/Users/arman/Documents/GitHub/armsn/src/pages/admin.astro", void 0);

const $$file = "/Users/arman/Documents/GitHub/armsn/src/pages/admin.astro";
const $$url = "/admin";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$Admin,
	file: $$file,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
