"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { jsPDF } from "jspdf"; // Added jsPDF import
import {
  LayoutDashboard,
  ListChecks,
  CalendarCheck,
  BarChart2,
  Settings,
  Bell,
  Menu,
  X,
  Target,
  TrendingUp,
  CheckCircle2,
  CalendarRange,
  Users,
  Download,
  FileSpreadsheet,
  BarChart3,
  FileText,
  CalendarCheck2,
  Award,
  RefreshCw,
} from "lucide-react";

import { getEmployeeReportData } from "@/services/reportservice";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Goal {
  id: string | number;
  title: string;
  weightage: number | string;
  target_value: number | string;
  progress: number;
}

export default function EmployeeReports() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [sheet, setSheet] = useState<any>(null);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const reportData = await getEmployeeReportData();
      
      if (reportData) {
        setProfile(reportData.profile);
        setGoals(reportData.goals || []);
        setSheet(reportData.goalSheet);
      }
    } finally {
      setLoading(false);
    }
  }

  // --- EXPORT LOGIC ---

  const handleExportCSV = () => {
    if (!goals || goals.length === 0) {
      alert("No goals available to export.");
      return;
    }

    // 1. Define headers
    const headers = ["Title, Weightage (%), Progress (%), Status"];
    
    // 2. Map data to rows
    const rows = goals.map(g => {
      // Escape quotes in titles to prevent CSV breaking
      const safeTitle = g.title.replace(/"/g, '""');
      const status = g.progress === 100 ? 'Completed' : 'Active';
      return `"${safeTitle}",${g.weightage || 0},${g.progress || 0},${status}`;
    });

    // 3. Create Blob and download
    const csvContent = headers.concat(rows).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${profile?.full_name || 'Employee'}_Goals_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    if (!goals || goals.length === 0) {
      alert("No goals available to export.");
      return;
    }

    const doc = new jsPDF();

    // Title
    doc.setFontSize(22);
    doc.text("GoalTrack Performance Report", 14, 20);

    // Profile Info
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Employee: ${profile?.full_name || 'N/A'}`, 14, 32);
    doc.text(`Department: ${profile?.department || 'N/A'}`, 14, 38);
    doc.text(`Cycle Status: ${sheet?.submission_status?.toUpperCase() || 'DRAFT'}`, 14, 44);

    // Overall Progress Summary
    const active = goals.length;
    const completed = goals.filter((g) => g.progress === 100).length;
    const overallProg = active ? Math.round(goals.reduce((acc, curr) => acc + (Number(curr.progress) || 0), 0) / active) : 0;
    
    doc.text(`Overall Progress: ${overallProg}%`, 130, 32);
    doc.text(`Completed Goals: ${completed} / ${active}`, 130, 38);

    doc.line(14, 50, 196, 50); // Divider line

    // Goals List
    let yPos = 62;
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text("Goal Breakdown", 14, yPos);
    yPos += 10;

    doc.setFontSize(11);
    goals.forEach((g, index) => {
      const status = g.progress === 100 ? "Completed" : "Active";
      
      // Goal Title
      doc.setFont("helvetica", "bold");
      doc.text(`${index + 1}. ${g.title}`, 14, yPos);
      
      // Goal Metrics
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80);
      doc.text(`Weightage: ${g.weightage || 0}%  |  Progress: ${g.progress || 0}%  |  Status: ${status}`, 20, yPos + 6);
      
      yPos += 16;
      doc.setTextColor(0); // Reset color

      // Add a new page if we run out of space at the bottom
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
    });

    // Save PDF
    doc.save(`${profile?.full_name?.replace(/\s+/g, '_') || 'Employee'}_Performance_Report.pdf`);
  };

  // --- DERIVED STATS ---
  const activeGoals = goals.length;
  const completedGoals = goals.filter((g) => g.progress === 100).length;
  const onTrackGoals = goals.filter((g) => g.progress > 0 && g.progress < 100).length;
  const behindGoals = goals.filter((g) => g.progress === 0 || !g.progress).length;
  
  const overallProgress = activeGoals
    ? Math.round(goals.reduce((acc, curr) => acc + (Number(curr.progress) || 0), 0) / activeGoals)
    : 0;

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#F8F9FC]">
        Loading Reports...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8F9FC]">
      {/* SIDEBAR */}
      <aside
        className={`fixed md:static bg-[#0F1729] w-[230px] h-screen z-50 transition-transform ${
          mobile ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="p-5">
          <h1 className="text-white font-bold text-xl flex items-center gap-2">
            <Target className="size-5 text-indigo-500" /> GoalTrack
          </h1>
        </div>
        <nav className="space-y-2 px-3">
          <Item icon={LayoutDashboard} href="/employee/dashboard" label="Dashboard" />
          <Item icon={ListChecks} href="/employee/goals" label="Goals" />
          <Item icon={CalendarCheck} href="/employee/checkins" label="Check-ins" />
          <Item icon={BarChart2} href="/employee/reports" label="Reports" active />
          <Item icon={Settings} href="/settings" label="Settings" />
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* HEADER */}
        <header className="bg-white px-5 py-4 border-b flex justify-between items-center">
          <div className="flex gap-3 items-center">
            <button onClick={() => setMobile(!mobile)} className="md:hidden">
              {mobile ? <X /> : <Menu />}
            </button>
            <div className="font-medium text-neutral-800">Reports</div>
          </div>
          <div className="flex gap-4 items-center">
            <Link href="/notifications" className="relative text-neutral-500 hover:text-neutral-900 transition-colors">
              <Bell size={20} />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-600 rounded-full" />
            </Link>
            <div className="flex items-center gap-3 border-l pl-4">
              <div className="flex flex-col items-end">
                <span className="leading-none font-semibold text-sm">
                  {profile?.full_name || "Employee"}
                </span>
                <span className="text-neutral-500 text-xs">
                  {profile?.department || "Operations"}
                </span>
              </div>
              <div className="size-8 font-semibold rounded-full bg-indigo-100 text-indigo-700 text-xs flex justify-center items-center">
                {profile?.full_name?.substring(0, 2).toUpperCase() || "ME"}
              </div>
            </div>
          </div>
        </header>

        {/* REPORTS CONTENT */}
        <main className="p-8 overflow-auto flex-1">
          <div className="flex flex-col gap-6 max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <h1 className="font-bold text-3xl tracking-tight text-neutral-900">
                    Reports
                  </h1>
                  <span className="font-medium rounded-full bg-neutral-200/50 text-neutral-900 text-xs px-3 py-1">
                    Employee View
                  </span>
                </div>
                <p className="max-w-2xl text-neutral-500 text-sm">
                  View your performance summaries, quarterly progress, and
                  downloadable reports for the current goal cycle.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  onClick={handleExportPDF}
                  className="bg-[#0F1729] hover:bg-[#0F1729]/90 text-white gap-2 rounded-xl"
                >
                  <Download className="size-4" />
                  Export PDF
                </Button>
                <Button
                  onClick={handleExportCSV}
                  className="text-neutral-950 border-neutral-200 gap-2 rounded-xl"
                  variant="outline"
                >
                  <FileSpreadsheet className="size-4" />
                  Export CSV
                </Button>
              </div>
            </div>

            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="shadow-sm rounded-2xl border-neutral-200/60 p-6">
                <CardContent className="p-0 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-neutral-500 text-sm">Overall Progress</span>
                    <TrendingUp className="size-4 text-indigo-600" />
                  </div>
                  <div className="font-semibold text-3xl">{overallProgress}%</div>
                  <p className="text-neutral-500 text-xs">Across {activeGoals} active goals</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm rounded-2xl border-neutral-200/60 p-6">
                <CardContent className="p-0 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-neutral-500 text-sm">Goals Completed</span>
                    <CheckCircle2 className="size-4 text-emerald-600" />
                  </div>
                  <div className="font-semibold text-3xl">{completedGoals} / {activeGoals}</div>
                  <p className="text-neutral-500 text-xs">{activeGoals - completedGoals} goals remain in progress</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm rounded-2xl border-neutral-200/60 p-6">
                <CardContent className="p-0 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-neutral-500 text-sm">Goal Sheet Status</span>
                    <CalendarRange className="size-4 text-amber-600" />
                  </div>
                  <div className="font-semibold text-xl mt-1 capitalize">{sheet?.submission_status || 'Draft'}</div>
                  <p className="text-neutral-500 text-xs mt-1">Current cycle status</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm rounded-2xl border-neutral-200/60 p-6">
                <CardContent className="p-0 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-neutral-500 text-sm">Total Weightage</span>
                    <Users className="size-4 text-blue-600" />
                  </div>
                  <div className="font-semibold text-3xl">
                    {goals.reduce((acc, curr) => acc + (Number(curr.weightage) || 0), 0)}%
                  </div>
                  <p className="text-neutral-500 text-xs">Accumulated goal impact</p>
                </CardContent>
              </Card>
            </div>

            {/* Middle Row Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_0.85fr] gap-6">
              {/* Performance Summary */}
              <Card className="shadow-sm rounded-2xl border-neutral-200/60 p-6 flex flex-col gap-4">
                <CardHeader className="p-0 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                      <CardTitle className="text-xl">Performance Summary</CardTitle>
                      <CardDescription>Goal completion overview and progress timeline</CardDescription>
                    </div>
                    <Badge className="rounded-full px-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-0">
                      FY 2024–25
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl bg-neutral-50 border border-neutral-100 p-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm">Current Progress</span>
                        <span className="font-semibold text-indigo-600 text-sm">Active</span>
                      </div>
                      <div className="rounded-full bg-neutral-200 mt-3 h-2 overflow-hidden">
                        <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${overallProgress}%` }} />
                      </div>
                      <p className="text-neutral-500 text-xs mt-2">Overall achievement is {overallProgress}%</p>
                    </div>
                    <div className="rounded-2xl bg-neutral-50 border border-neutral-100 p-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm">Q2 Target</span>
                        <span className="font-semibold text-amber-600 text-sm">In Progress</span>
                      </div>
                      <div className="rounded-full bg-neutral-200 mt-3 h-2 overflow-hidden">
                        <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `68%` }} />
                      </div>
                      <p className="text-neutral-500 text-xs mt-2">Check-in cycle completion</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-neutral-200/60 p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="size-4 text-neutral-900" />
                        <span className="font-semibold text-sm">Goal Completion Breakdown</span>
                      </div>
                      <span className="text-neutral-500 text-xs">By status</span>
                    </div>
                    <div className="grid grid-cols-3 mt-4 gap-3 text-center md:text-left">
                      <div className="rounded-xl bg-emerald-50/80 border border-emerald-100 p-3">
                        <div className="text-emerald-700 text-xs font-medium">Completed</div>
                        <div className="font-semibold text-emerald-700 text-2xl mt-1">{completedGoals}</div>
                      </div>
                      <div className="rounded-xl bg-amber-50/80 border border-amber-100 p-3">
                        <div className="text-amber-700 text-xs font-medium">On Track</div>
                        <div className="font-semibold text-amber-700 text-2xl mt-1">{onTrackGoals}</div>
                      </div>
                      <div className="rounded-xl bg-red-50/80 border border-red-100 p-3">
                        <div className="text-red-700 text-xs font-medium">Behind</div>
                        <div className="font-semibold text-red-700 text-2xl mt-1">{behindGoals}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Reports Center */}
              <Card className="shadow-sm rounded-2xl border-neutral-200/60 p-6 flex flex-col gap-4">
                <CardHeader className="p-0 flex flex-col gap-2">
                  <CardTitle className="text-xl">Reports Center</CardTitle>
                  <CardDescription>Quick access to your downloadable reports</CardDescription>
                </CardHeader>
                <CardContent className="p-0 flex flex-col gap-3">
                  <div 
                    onClick={handleExportPDF}
                    className="rounded-2xl border border-neutral-200/60 bg-white hover:bg-neutral-50 transition-colors cursor-pointer flex p-4 items-start gap-3"
                  >
                    <div className="size-10 rounded-xl bg-neutral-100 text-neutral-700 flex justify-center items-center shrink-0">
                      <FileText className="size-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center gap-3">
                        <span className="font-medium text-sm">Goal Sheet Report (PDF)</span>
                        <Badge className="rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-0">
                          {sheet?.submission_status || 'Draft'}
                        </Badge>
                      </div>
                      <p className="text-neutral-500 text-xs mt-1">Includes all goals, weightage, and current progress.</p>
                    </div>
                  </div>
                  <div 
                    onClick={handleExportCSV}
                    className="rounded-2xl border border-neutral-200/60 bg-white hover:bg-neutral-50 transition-colors cursor-pointer flex p-4 items-start gap-3"
                  >
                    <div className="size-10 rounded-xl bg-neutral-100 text-neutral-700 flex justify-center items-center shrink-0">
                      <CalendarCheck2 className="size-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center gap-3">
                        <span className="font-medium text-sm">Quarterly Check-in Report (CSV)</span>
                        <Badge className="rounded-full" variant="outline">Q2</Badge>
                      </div>
                      <p className="text-neutral-500 text-xs mt-1">Summarizes planned vs actual achievements in a spreadsheet.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// Re-usable Sidebar Item Component
function Item({ icon: Icon, href, label, active }: any) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
        active
          ? "bg-indigo-600 text-white font-medium"
          : "text-white/70 hover:bg-white/10 hover:text-white"
      }`}
    >
      <Icon size={18} />
      {label}
    </Link>
  );
}