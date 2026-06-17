"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Bell,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Clock,
  LayoutDashboard,
  Lock,
  RotateCcw,
  ScrollText,
  Target,
  Users,
  X,
  Menu,
  FileSearch,
  History
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Import actual services
import { getSubmittedGoalSheets, approveGoalSheet, rejectGoalSheet } from "@/services/managerservice";
import { getManagerCheckins } from "@/services/checkinservice";
import { getCurrentUserProfile } from "@/services/sharedgoalservice";

export default function ManagerApprovals() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [mobile, setMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");

  // Data States
  const [allSheets, setAllSheets] = useState<any[]>([]);
  const [allGoals, setAllGoals] = useState<any[]>([]);
  const [expandedSheet, setExpandedSheet] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const [userRes, sheetsRes, checkinsRes] = await Promise.all([
        getCurrentUserProfile(),
        getSubmittedGoalSheets(),
        getManagerCheckins(), // Gets all goals to display inside the sheets
      ]);

      if (userRes) setProfile(userRes);

      const sheets = sheetsRes?.data || [];
      const goals = checkinsRes?.data || [];

      setAllSheets(sheets);
      setAllGoals(goals);
    } catch (err) {
      console.error("Failed to load manager approvals:", err);
    } finally {
      setLoading(false);
    }
  }

  // --- ACTIONS ---

  const handleApprove = async (sheetId: string) => {
    if (!confirm("Are you sure you want to approve this goal sheet?")) return;
    const res = await approveGoalSheet(sheetId);
    if (!res.error) {
      alert("Goal sheet approved successfully.");
      loadData(); // Refresh UI
      setExpandedSheet(null);
    } else {
      alert(res.error);
    }
  };

  const handleReject = async (sheetId: string) => {
    if (!confirm("Are you sure you want to return this goal sheet for rework?")) return;
    const res = await rejectGoalSheet(sheetId);
    if (!res.error) {
      alert("Goal sheet returned to employee.");
      loadData(); // Refresh UI
      setExpandedSheet(null);
    } else {
      alert(res.error);
    }
  };

  const toggleSheet = (id: string) => {
    setExpandedSheet(expandedSheet === id ? null : id);
  };

  // --- DERIVED STATS ---
  const pendingSheets = allSheets.filter((s: any) => s.submission_status === "submitted");
  const historySheets = allSheets.filter((s: any) => ["approved", "rejected"].includes(s.submission_status));
  const pendingCount = pendingSheets.length;

  const displaySheets = activeTab === "pending" ? pendingSheets : historySheets;

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#F8F9FC]">
        Loading Approvals...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8F9FC]">
      {/* SIDEBAR */}
      <aside
        className={`fixed md:static bg-[#0F1729] w-[230px] h-screen z-50 transition-transform ${
          mobile ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 flex flex-col`}
      >
        <div className="p-5 flex items-center gap-3">
          <div className="size-9 rounded-lg bg-indigo-600 text-white flex justify-center items-center shrink-0">
            <Target className="size-5" />
          </div>
          <div className="flex flex-col text-white">
            <span className="leading-tight font-bold text-sm">GoalTrack</span>
            <span className="leading-tight text-white/50 text-xs">Manager Portal</span>
          </div>
        </div>

        <nav className="space-y-2 px-3 flex-1 mt-4">
          <Item icon={LayoutDashboard} href="/manager/dashboard" label="Dashboard" />
          <Item
            icon={CheckCircle}
            href="/manager/approvals/id"
            label="Approvals"
            active
            badge={pendingCount > 0 ? pendingCount : undefined}
          />
          <Item icon={ClipboardCheck} href="/manager/checkins" label="Check-ins" />
          <Item icon={Users} href="/manager/shared-goals" label="Shared Goals" />
          <Item icon={BarChart3} href="/manager/reports" label="Team Reports" />
          <Item icon={ScrollText} href="/manager/audit" label="Audit Log" />
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
            <div className="flex flex-col">
              <h1 className="font-semibold text-neutral-950 text-base">
                Goal Approvals
              </h1>
            </div>
          </div>
          <div className="flex gap-4 items-center">
            <Link href="/notifications" className="relative text-neutral-500 hover:text-neutral-900 transition-colors">
              <Bell size={20} />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-600 rounded-full" />
            </Link>
            <div className="flex items-center gap-3 border-l pl-4">
              <div className="flex flex-col items-end">
                <span className="leading-none font-semibold text-sm">
                  {profile?.full_name || "Manager"}
                </span>
                <span className="text-neutral-500 text-xs">
                  {profile?.department || "Department"}
                </span>
              </div>
              <div className="size-8 font-semibold rounded-full bg-indigo-100 text-indigo-700 text-xs flex justify-center items-center">
                {profile?.full_name?.substring(0, 2).toUpperCase() || "MGR"}
              </div>
            </div>
          </div>
        </header>

        {/* DASHBOARD CONTENT */}
        <main className="p-4 md:p-8 overflow-auto flex-1">
          <div className="flex flex-col gap-6 max-w-5xl mx-auto">
            
            {/* Header & Tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-neutral-950">Review Goal Sheets</h2>
                <p className="text-sm text-neutral-500 mt-1">Review, approve, or return employee goal sheets for the current cycle.</p>
              </div>
              
              <div className="flex bg-neutral-200/50 p-1 rounded-xl w-fit">
                <button
                  onClick={() => setActiveTab("pending")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === "pending"
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-neutral-500 hover:text-neutral-700"
                  }`}
                >
                  <FileSearch className="size-4" />
                  Pending Review
                  {pendingCount > 0 && (
                    <span className="bg-indigo-100 text-indigo-700 text-[10px] py-0.5 px-2 rounded-full">
                      {pendingCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === "history"
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-neutral-500 hover:text-neutral-700"
                  }`}
                >
                  <History className="size-4" />
                  History
                </button>
              </div>
            </div>

            {/* Approval List Card */}
            <Card className="shadow-sm rounded-2xl border-neutral-200/60 p-6">
              <CardHeader className="p-0 pb-4 border-b border-neutral-100 mb-4 flex flex-row justify-between items-center">
                <div className="flex flex-col gap-1">
                  <CardTitle className="font-semibold text-lg">
                    {activeTab === "pending" ? "Awaiting Your Action" : "Reviewed Sheets"}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex flex-col gap-4">
                {displaySheets.length === 0 ? (
                  <div className="text-center py-16 px-4 rounded-xl border border-dashed border-neutral-200 bg-neutral-50 flex flex-col items-center justify-center">
                    <CheckCircle className="size-10 text-neutral-300 mb-3" />
                    <h3 className="font-medium text-neutral-900 text-lg">
                      {activeTab === "pending" ? "All caught up!" : "No history yet"}
                    </h3>
                    <p className="text-neutral-500 text-sm mt-1 max-w-[250px]">
                      {activeTab === "pending" 
                        ? "You have zero goal sheets pending approval right now." 
                        : "You haven't approved or rejected any goal sheets yet."}
                    </p>
                  </div>
                ) : (
                  displaySheets.map((sheet: any) => {
                    const isExpanded = expandedSheet === sheet.id;
                    const sheetGoals = allGoals.filter((g) => g.goal_sheet_id === sheet.id);

                    return (
                      <div
                        key={sheet.id}
                        className={`rounded-xl border border-solid transition-colors ${
                          isExpanded ? "border-indigo-200 bg-indigo-50/10" : "border-neutral-200 bg-white"
                        } flex p-4 flex-col gap-4`}
                      >
                        {/* Card Header (Clickable) */}
                        <div
                          className="flex justify-between items-center cursor-pointer"
                          onClick={() => toggleSheet(sheet.id)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="size-12 font-bold rounded-full bg-indigo-100 text-indigo-700 text-sm flex justify-center items-center">
                              {sheet.profile?.full_name?.substring(0, 2).toUpperCase() || "EM"}
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="font-semibold text-neutral-950 text-base flex items-center gap-2">
                                {sheet.profile?.full_name || "Employee"}
                                
                                {/* Status Badge for History Tab */}
                                {activeTab === "history" && (
                                  <Badge variant="outline" className={`ml-2 text-[10px] h-5 ${
                                    sheet.submission_status === 'approved' 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                    : 'bg-red-50 text-red-700 border-red-200'
                                  }`}>
                                    {sheet.submission_status.toUpperCase()}
                                  </Badge>
                                )}
                              </span>
                              <span className="text-neutral-500 text-sm">
                                {sheet.profile?.department || "Department"} · Submitted {new Date(sheet.updated_at || sheet.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="hidden md:flex flex-col text-right">
                              <span className="text-neutral-900 font-medium text-sm">{sheetGoals.length} Goals</span>
                              <span className="text-neutral-500 text-xs">Total Weight: 100%</span>
                            </div>
                            <div className="p-1 rounded-full hover:bg-neutral-100 text-neutral-400 transition-colors">
                              {isExpanded ? <ChevronUp className="size-5" /> : <ChevronDown className="size-5" />}
                            </div>
                          </div>
                        </div>

                        {/* Expanded Content: Goals List */}
                        {isExpanded && (
                          <div className="flex flex-col gap-4 mt-2">
                            <div className="rounded-lg bg-white border border-neutral-200 overflow-hidden">
                              <div className="grid grid-cols-[1fr_120px_100px_80px] font-medium bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wider px-5 py-3">
                                <span>Goal Title & Description</span>
                                <span>Thrust Area</span>
                                <span>Target</span>
                                <span className="text-right">Weight</span>
                              </div>
                              {sheetGoals.length === 0 ? (
                                <div className="px-5 py-4 text-sm text-neutral-500">
                                  No goals found in this sheet.
                                </div>
                              ) : (
                                sheetGoals.map((g: any) => (
                                  <div
                                    key={g.id}
                                    className="grid grid-cols-[1fr_120px_100px_80px] text-sm border-t border-neutral-200 px-5 py-4 items-start gap-4"
                                  >
                                    <div className="flex flex-col gap-1 pr-2">
                                      <span className="text-neutral-900 font-medium">{g.title}</span>
                                      {g.description && (
                                        <span className="text-neutral-500 text-xs line-clamp-2">
                                          {g.description}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-neutral-600 capitalize mt-0.5">
                                      {g.thrust_area || "-"}
                                    </span>
                                    <div className="flex flex-col mt-0.5">
                                      <span className="text-neutral-900 font-medium">
                                        {g.target_value || "-"}
                                      </span>
                                      {g.uom_type && (
                                        <span className="text-neutral-400 text-xs capitalize">{g.uom_type}</span>
                                      )}
                                    </div>
                                    <span className="text-neutral-900 font-semibold text-right mt-0.5">
                                      {g.weightage || 0}%
                                    </span>
                                  </div>
                                ))
                              )}
                            </div>

                            {/* Action Area (Only show if pending) */}
                            {activeTab === "pending" && (
                              <div className="flex flex-col md:flex-row gap-4 items-center justify-between pt-2">
                                <div className="rounded-lg bg-amber-50/50 flex px-4 py-3 items-center gap-3 border border-amber-100/50 w-full md:w-auto">
                                  <Lock className="size-4 text-amber-600 shrink-0" />
                                  <span className="text-amber-700 text-sm">
                                    Approving this sheet will lock it for the employee for this cycle.
                                  </span>
                                </div>

                                <div className="flex items-center gap-3 w-full md:w-auto">
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleReject(sheet.id);
                                    }}
                                    variant="outline"
                                    className="text-amber-700 border-amber-200 hover:bg-amber-50 flex-1 md:flex-none"
                                  >
                                    <RotateCcw className="size-4 mr-2" /> Return for Rework
                                  </Button>
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleApprove(sheet.id);
                                    }}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1 md:flex-none"
                                  >
                                    <Check className="size-4 mr-2" /> Approve Goals
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

// Re-usable Sidebar Item Component
function Item({ icon: Icon, href, label, active, badge }: any) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${
        active
          ? "bg-indigo-600 text-white font-medium"
          : "text-white/70 hover:bg-white/10 hover:text-white"
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon size={18} />
        {label}
      </div>
      {badge && (
        <span className="min-w-[20px] font-semibold rounded-full bg-red-500 text-white text-[10px] flex px-1.5 justify-center items-center h-5">
          {badge}
        </span>
      )}
    </Link>
  );
}