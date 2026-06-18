"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { jsPDF } from "jspdf";
import { createClient } from "@/lib/supabase/client";

import {
  LayoutDashboard,
  ListChecks,
  CalendarCheck,
  BarChart2,
  Bell,
  Menu,
  X,
  Target,
  TrendingUp,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  BarChart3,
  LogOut,
  Layers,
  Users,
  Send,
} from "lucide-react";

import { getEmployeeReportData } from "@/services/reportservice";
import { getEmployeeSharedGoals } from "@/services/sharedgoalservice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function EmployeeReports() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [sharedGoals, setSharedGoals] = useState<any[]>([]);
  const [sheet, setSheet] = useState<any>(null);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [reportData, sharedRes] = await Promise.all([
        getEmployeeReportData(),
        getEmployeeSharedGoals(),
      ]);

      if (reportData) {
        setProfile(reportData.profile);
        setGoals(reportData.goals || []);
        setSheet(reportData.goalSheet);
      }
      if (sharedRes) {
        setSharedGoals(sharedRes.data || []);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  // --- EXPORT LOGIC ---
  const handleExportCSV = () => {
    if (goals.length === 0 && sharedGoals.length === 0) {
      alert("No goals available to export.");
      return;
    }

    const headers = [
      "Category, Title, Focus Area, Target, Weightage (%), Progress (%), Status",
    ];

    // Personal Goals Rows
    const personalRows = goals.map((g) => {
      const safeTitle = g.title.replace(/"/g, '""');
      const status = g.progress >= 100 ? "Completed" : "Active";
      return `"Personal","${safeTitle}","${g.thrust_area || "N/A"}",${g.target_value || 0},${g.weightage || 0},${g.progress || 0},${status}`;
    });

    // Shared Goals Rows
    const sharedRows = sharedGoals.map((sg) => {
      const safeTitle = (sg.shared_goals?.title || "Shared Goal").replace(
        /"/g,
        '""',
      );
      const status =
        sg.status === "submitted" || sg.status === "approved"
          ? "Submitted"
          : "Draft";
      return `"Shared","${safeTitle}","${sg.shared_goals?.department || "Cross-Dept"}",${sg.shared_goals?.target_value || 0},${sg.weightage || 0},${sg.progress || 0},${status}`;
    });

    const csvContent = headers.concat(personalRows, sharedRows).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute(
      "download",
      `${profile?.full_name || "Employee"}_Performance_Report.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    if (goals.length === 0 && sharedGoals.length === 0) {
      alert("No goals available to export.");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text("Performance Report", 14, 20);

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Employee: ${profile?.full_name || "N/A"}`, 14, 32);
    doc.text(`Department: ${profile?.department || "N/A"}`, 14, 38);
    doc.text(
      `Sheet Status: ${sheet?.submission_status?.toUpperCase() || "DRAFT"}`,
      14,
      44,
    );

    doc.line(14, 50, 196, 50);

    let yPos = 62;

    // --- SECTION 1: PERSONAL GOALS ---
    if (goals.length > 0) {
      doc.setFontSize(16);
      doc.setTextColor(0);
      doc.text("Personal Goals", 14, yPos);
      yPos += 10;

      doc.setFontSize(11);
      goals.forEach((g, index) => {
        const status = g.progress >= 100 ? "Completed" : "Active";
        doc.setFont("helvetica", "bold");
        doc.text(`${index + 1}. ${g.title}`, 14, yPos);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80);
        doc.text(
          `Area: ${g.thrust_area || "N/A"}  |  Weight: ${g.weightage}%  |  Progress: ${g.progress}%  |  Status: ${status}`,
          20,
          yPos + 6,
        );
        yPos += 16;
        doc.setTextColor(0);
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
      });
      yPos += 10;
    }

    // --- SECTION 2: SHARED GOALS ---
    if (sharedGoals.length > 0) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(16);
      doc.setTextColor(0);
      doc.text("Shared Goals", 14, yPos);
      yPos += 10;

      doc.setFontSize(11);
      sharedGoals.forEach((sg, index) => {
        const status =
          sg.status === "submitted" || sg.status === "approved"
            ? "Submitted"
            : "Draft";
        doc.setFont("helvetica", "bold");
        doc.text(
          `${index + 1}. ${sg.shared_goals?.title || "Shared Goal"}`,
          14,
          yPos,
        );
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80);
        doc.text(
          `Weight: ${sg.weightage}%  |  Progress: ${sg.progress}%  |  Status: ${status}`,
          20,
          yPos + 6,
        );
        yPos += 16;
        doc.setTextColor(0);
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
      });
    }

    doc.save(
      `${profile?.full_name?.replace(/\s+/g, "_") || "Employee"}_Report.pdf`,
    );
  };

  // --- DERIVED STATS (Personal) ---
  const activePersonal = goals.length;
  const completedPersonal = goals.filter((g) => g.progress >= 100).length;
  const onTrackPersonal = goals.filter(
    (g) => g.progress > 0 && g.progress < 100,
  ).length;
  const behindPersonal = goals.filter(
    (g) => g.progress === 0 || !g.progress,
  ).length;

  const overallProgress = activePersonal
    ? Math.round(
        goals.reduce((acc, curr) => acc + (Number(curr.progress) || 0), 0) /
          activePersonal,
      )
    : 0;

  // --- DERIVED STATS (Shared) ---
  const totalShared = sharedGoals.length;
  const submittedShared = sharedGoals.filter(
    (sg) => sg.status === "submitted" || sg.status === "approved",
  ).length;

  // --- Calculate Thrust Area Stats (Personal Only) ---
  const thrustAreaStats = goals.reduce((acc: any, g: any) => {
    const area = g.thrust_area || "General";
    if (!acc[area]) acc[area] = { count: 0, progress: 0, weight: 0 };
    acc[area].count += 1;
    acc[area].progress += Number(g.progress) || 0;
    acc[area].weight += Number(g.weightage) || 0;
    return acc;
  }, {});

  if (loading)
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#F8F9FC] text-neutral-500 font-medium">
        Loading Reports...
      </div>
    );

  return (
    <div className="flex h-screen bg-[#F8F9FC]">
      <aside
        className={`fixed md:static bg-[#0F1729] w-[230px] h-screen z-50 transition-transform ${mobile ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div className="p-5">
          <h1 className="text-white font-bold text-xl flex items-center gap-2">
            OMP
          </h1>
        </div>
        <nav className="space-y-2 px-3 mt-4">
          <Item
            icon={LayoutDashboard}
            href="/employee/dashboard"
            label="Dashboard"
          />
          <Item icon={ListChecks} href="/employee/goals" label="Goals" />
          <Item
            icon={CalendarCheck}
            href="/employee/checkins"
            label="Check-ins"
          />
          <Item
            icon={BarChart2}
            href="/employee/report"
            label="Reports"
            active
          />

          <Item
            icon={ListChecks}
            href="/employee/guidelines"
            label="Guidelines"
          />
          <div className="pt-4 mt-4 border-t border-white/10">
            <button
              onClick={handleSignOut}
              className="flex w-full gap-3 px-4 py-3 rounded-xl transition text-white/70 hover:bg-rose-500/10 hover:text-rose-500 text-left"
            >
              <LogOut size={18} /> Sign Out
            </button>
          </div>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white px-5 py-4 border-b flex justify-between items-center z-10 shrink-0">
          <div className="flex gap-3 items-center">
            <button onClick={() => setMobile(!mobile)} className="md:hidden">
              <Menu />
            </button>
            <div className="font-semibold text-neutral-800">
              Reports Workspace
            </div>
          </div>
          <div className="flex gap-4 items-center">
            <div className="font-semibold text-sm">{profile?.full_name}</div>
          </div>
        </header>

        <main className="p-5 md:p-8 overflow-auto flex-1 custom-scrollbar">
          <div className="flex flex-col gap-8 max-w-6xl mx-auto">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h1 className="font-bold text-3xl tracking-tight text-neutral-900 mb-1">
                  Performance Analytics
                </h1>
                <p className="text-neutral-500 text-sm">
                  Detailed breakdown of your personal and shared goals.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleExportPDF}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 rounded-xl shadow-sm"
                >
                  <Download className="size-4" /> Export PDF
                </Button>
                <Button
                  onClick={handleExportCSV}
                  className="text-neutral-700 border-neutral-300 gap-2 rounded-xl bg-white hover:bg-neutral-50"
                  variant="outline"
                >
                  <FileSpreadsheet className="size-4" /> Export CSV
                </Button>
              </div>
            </div>

            {/* Top Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <StatCard
                title="Personal Progress"
                value={`${overallProgress}%`}
                sub={`Avg across ${activePersonal} personal goals`}
                icon={TrendingUp}
                color="indigo"
              />
              <StatCard
                title="Personal Completed"
                value={`${completedPersonal}`}
                sub={`${activePersonal - completedPersonal} in progress`}
                icon={CheckCircle2}
                color="emerald"
              />
              <StatCard
                title="Total Shared Goals"
                value={totalShared}
                sub="Assigned by managers"
                icon={Users}
                color="amber"
              />
              <StatCard
                title="Submitted Shared"
                value={submittedShared}
                sub={`${totalShared - submittedShared} awaiting submission`}
                icon={Send}
                color="blue"
              />
            </div>

            {/* Performance Summary Chart (Full Width) */}
            <Card className="shadow-sm rounded-2xl border-neutral-200/60 p-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">
                  Personal Goal Breakdown
                </CardTitle>
                <CardDescription>
                  Current status of your personal goal sheet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                  <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-100 p-5">
                    <div className="text-emerald-700 text-sm font-semibold mb-2 flex items-center gap-2">
                      <CheckCircle2 size={16} /> Completed
                    </div>
                    <div className="font-bold text-emerald-800 text-4xl">
                      {completedPersonal}
                    </div>
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-100 p-5">
                    <div className="text-indigo-700 text-sm font-semibold mb-2 flex items-center gap-2">
                      <TrendingUp size={16} /> On Track
                    </div>
                    <div className="font-bold text-indigo-800 text-4xl">
                      {onTrackPersonal}
                    </div>
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-rose-50 to-rose-100/50 border border-rose-100 p-5">
                    <div className="text-rose-700 text-sm font-semibold mb-2 flex items-center gap-2">
                      <BarChart3 size={16} /> Behind
                    </div>
                    <div className="font-bold text-rose-800 text-4xl">
                      {behindPersonal}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance by Focus Area */}
            <Card className="shadow-sm rounded-2xl border-neutral-200/60 p-1 mb-8">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Layers size={20} className="text-indigo-500" /> Personal
                  Focus Areas
                </CardTitle>
                <CardDescription>
                  Average progress distribution across your thrust areas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(thrustAreaStats).length === 0 ? (
                  <div className="text-center py-8 text-neutral-400 font-medium bg-neutral-50 rounded-xl border border-dashed">
                    No focus areas defined yet.
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {Object.keys(thrustAreaStats).map((area) => {
                      const stats = thrustAreaStats[area];
                      const avgProgress = Math.round(
                        stats.progress / stats.count,
                      );
                      return (
                        <div
                          key={area}
                          className="rounded-xl border border-neutral-200 bg-white p-5 hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-bold text-neutral-900 mb-1">
                                {area}
                              </h3>
                              <span className="text-xs font-semibold text-neutral-500 bg-neutral-100 px-2 py-1 rounded-md">
                                {stats.count} Goal{stats.count > 1 ? "s" : ""}
                              </span>
                            </div>
                            <Badge
                              variant="outline"
                              className="text-indigo-700 bg-indigo-50 border-indigo-200"
                            >
                              {stats.weight}% Wt
                            </Badge>
                          </div>

                          <div>
                            <div className="flex justify-between text-sm mb-1.5 font-medium">
                              <span className="text-neutral-600">
                                Avg. Progress
                              </span>
                              <span
                                className={
                                  avgProgress >= 100
                                    ? "text-emerald-600"
                                    : "text-indigo-600"
                                }
                              >
                                {avgProgress}%
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${avgProgress >= 100 ? "bg-emerald-500" : "bg-indigo-500"}`}
                                style={{ width: `${avgProgress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #E5E7EB; border-radius: 20px; }
      `,
        }}
      />
    </div>
  );
}

function StatCard({ title, value, sub, icon: Icon, color, isText }: any) {
  const colorMap: any = {
    indigo: "text-indigo-600 bg-indigo-50",
    emerald: "text-emerald-600 bg-emerald-50",
    amber: "text-amber-600 bg-amber-50",
    blue: "text-blue-600 bg-blue-50",
  };

  return (
    <div className="rounded-2xl border border-neutral-200/60 bg-white p-5 shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <p className="text-sm font-semibold text-neutral-500">{title}</p>
        <div className={`p-2 rounded-lg ${colorMap[color]}`}>
          <Icon size={18} />
        </div>
      </div>
      <h3
        className={`text-3xl font-bold text-neutral-900 ${isText ? "capitalize" : ""}`}
      >
        {value}
      </h3>
      <p className="mt-1 text-xs text-neutral-500 font-medium">{sub}</p>
    </div>
  );
}

function Item({ icon: Icon, href, label, active }: any) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${active ? "bg-indigo-600 text-white font-medium" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
    >
      <Icon size={18} /> {label}
    </Link>
  );
}
