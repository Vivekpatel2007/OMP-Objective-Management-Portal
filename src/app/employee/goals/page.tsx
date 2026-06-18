"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

import {
  BarChart3,
  CheckCircle,
  ListChecks,
  LayoutDashboard,
  LogOut,
  Lock,
  Plus,
  Send,
  Target,
  Trash2,
  Pencil,
  Menu,
  X,
  Check,
  Archive,
  CalendarDays,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import {
  getGoals,
  deleteGoal,
  submitGoalSheet,
  updateGoal,
} from "@/services/goalservice";
import { getCurrentUserProfile } from "@/services/sharedgoalservice";
import { getNotifications } from "@/services/notificationservice";
// Pass the active quarter to ensure the backend creates a sheet specifically for this quarter
import { getOrCreateGoalSheet } from "@/services/goal-sheetservice";

type Goal = {
  id: string;
  title: string;
  description?: string;
  thrust_area?: string;
  uom_type?: string;
  target_value: number;
  weightage: number;
  progress: number;
  quarter?: string;
};

export default function GoalSheet() {
  const [loading, setLoading] = useState(true);
  const [mobile, setMobile] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  const [goals, setGoals] = useState<Goal[]>([]);
  const [status, setStatus] = useState("draft");
  const [locked, setLocked] = useState(false);

  // Sheet & Dynamic Quarter States
  const [hasGoalSheet, setHasGoalSheet] = useState<boolean>(false);
  const [activeQuarter, setActiveQuarter] = useState<string>("Q1");
  const [viewTab, setViewTab] = useState<"current" | "past">("current");

  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Goal>>({});

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      const supabase = createClient();

      // 1. Fetch Active Cycle to dynamically determine current Quarter
      const { data: activeCycle } = await supabase
        .from("goal_cycles")
        .select("*")
        .eq("is_active", true)
        .maybeSingle();

      let currentQ = "Q1"; // Default to Q1
      if (activeCycle) {
        const now = new Date();
        const isWithin = (start?: string, end?: string) => {
          if (!start || !end) return false;
          return now >= new Date(start) && now <= new Date(end);
        };

        // Determine which quarter is currently active based on admin dates
        if (isWithin(activeCycle.q2_start, activeCycle.q2_end)) currentQ = "Q2";
        else if (isWithin(activeCycle.q3_start, activeCycle.q3_end))
          currentQ = "Q3";
        else if (isWithin(activeCycle.q4_start, activeCycle.q4_end))
          currentQ = "Q4";
      }
      setActiveQuarter(currentQ);

      // 2. Fetch standard data
      const [goalRes, user, notif] = await Promise.all([
        getGoals(),
        getCurrentUserProfile(),
        getNotifications(),
      ]);

      if (goalRes?.error === "Goal sheet not found" || !goalRes) {
        setHasGoalSheet(false);
      } else {
        setHasGoalSheet(true);
      }

      setGoals(goalRes?.data || []);
      setStatus(goalRes?.submissionStatus || "draft");
      setLocked(goalRes?.locked || false);
      setProfile(user);
      setNotifications(notif?.data || []);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateSheet() {
    // Pass the active quarter so the backend generates a fresh sheet for the current quarter
    const res = await getOrCreateGoalSheet(activeQuarter);
    if (res?.error) {
      alert(res?.error || "Failed to create goal sheet");
      return;
    }
    alert(`Goal Sheet created successfully for ${activeQuarter}.`);
    load();
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  async function removeGoal(id: string) {
    if (!confirm("Delete Goal?")) return;
    await deleteGoal(id);
    load();
  }

  async function submit() {
    const res = await submitGoalSheet();
    if (res?.error) {
      alert(res.error);
      return;
    }
    alert(`${activeQuarter} Goal sheet submitted successfully.`);
    load();
  }

  function handleEditClick(goal: Goal) {
    setEditingGoalId(goal.id);
    setEditForm(goal);
  }

  function handleCancelEdit() {
    setEditingGoalId(null);
    setEditForm({});
  }

  async function handleSaveEdit() {
    if (!editingGoalId) return;
    const res = await updateGoal(editingGoalId, editForm);
    if (res?.error) {
      alert("Failed to update goal");
      return;
    }
    setGoals((prev) =>
      prev.map((g) =>
        g.id === editingGoalId ? ({ ...g, ...editForm } as Goal) : g,
      ),
    );
    setEditingGoalId(null);
    setEditForm({});
  }

  // Calculate current goals based purely on the active quarter
  const currentGoals = goals.filter(
    (g) => (g.quarter || "Q1") === activeQuarter,
  );

  // Past goals are those whose quarter number is strictly less than the active quarter
  const pastGoals = goals.filter((g) => {
    const qOrder = { Q1: 1, Q2: 2, Q3: 3, Q4: 4 };
    const goalQ = g.quarter || "Q1";
    return (
      qOrder[goalQ as keyof typeof qOrder] <
      qOrder[activeQuarter as keyof typeof qOrder]
    );
  });

  // Calculate weightage specifically for the active quarter so it resets to 0% initially
  const totalWeight = currentGoals.reduce(
    (a, b) => a + Number(b.weightage || 0),
    0,
  );
  const remaining = 100 - totalWeight;
  const isSheetLocked =
    locked || status === "submitted" || status === "approved";

  const renderGoalsList = (list: Goal[], isReadOnly: boolean) => {
    // Render the completely blank initial state for a new quarter
    if (list.length === 0) {
      return (
        <Card className="rounded-2xl border-dashed border-2 bg-transparent shadow-none">
          <CardContent className="p-10 text-center text-neutral-500">
            <div className="font-medium mb-2 text-lg text-neutral-800">
              Your {activeQuarter} Sheet is Empty
            </div>
            <p className="text-sm">
              Start adding your goals for this quarter. Weightage must total
              100%.
            </p>
            {!isReadOnly && !isSheetLocked && (
              <Link href="/employee/goals/create">
                <Button className="mt-5 bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Plus size={16} className="mr-2" /> Create First Goal
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      );
    }

    return list.map((goal) =>
      editingGoalId === goal.id ? (
        <Card
          key={goal.id}
          className="border-2 border-indigo-200 shadow-sm relative rounded-2xl"
        >
          <div className="p-6 bg-indigo-50/30 rounded-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg">
                {editForm.title || "Editing Goal"}
              </h3>
            </div>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">
                    Goal Title
                  </label>
                  <Input
                    value={editForm.title || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, title: e.target.value })
                    }
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">
                    Thrust Area
                  </label>
                  <Input
                    value={editForm.thrust_area || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, thrust_area: e.target.value })
                    }
                    className="bg-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700">
                  Description
                </label>
                <Textarea
                  className="resize-none bg-white"
                  rows={3}
                  value={editForm.description || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                />
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">
                    UOM
                  </label>
                  <Select
                    value={editForm.uom_type || ""}
                    onValueChange={(val) =>
                      setEditForm({ ...editForm, uom_type: val })
                    }
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select UOM" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Numeric Higher Better">
                        Numeric Higher Better
                      </SelectItem>
                      <SelectItem value="Numeric Lower Better">
                        Numeric Lower Better
                      </SelectItem>
                      <SelectItem value="Percentage">Percentage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">
                    Target Value
                  </label>
                  <Input
                    type="number"
                    className="bg-white"
                    value={editForm.target_value || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        target_value: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div className="w-1/2 pr-3 space-y-2">
                <label className="text-sm font-medium text-neutral-700">
                  Weightage %
                </label>
                <Input
                  type="number"
                  className="bg-white"
                  value={editForm.weightage || ""}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      weightage: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-indigo-100">
                <Button variant="ghost" onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button
                  className="bg-neutral-900 text-white hover:bg-neutral-800"
                  onClick={handleSaveEdit}
                >
                  <Check className="mr-2" size={16} /> Save Changes
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card
          key={goal.id}
          className={`p-5 rounded-2xl shadow-sm border-neutral-200/60 ${isReadOnly ? "bg-slate-50" : ""}`}
        >
          <CardContent className="flex p-0 gap-4 items-start">
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg text-neutral-900">
                    {goal.title}
                  </h3>
                  <p className="text-sm text-neutral-500 mt-1">
                    {goal.description}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {isReadOnly && (
                    <Badge variant="outline" className="text-slate-500">
                      {goal.quarter}
                    </Badge>
                  )}
                  <Badge
                    variant="secondary"
                    className="bg-indigo-50 text-indigo-700"
                  >
                    {goal.progress || 0}% Progress
                  </Badge>
                </div>
              </div>
              <div
                className={`grid md:grid-cols-4 gap-5 mt-6 p-4 rounded-xl border border-neutral-100 ${isReadOnly ? "bg-white" : "bg-neutral-50"}`}
              >
                <div>
                  <div className="text-xs text-neutral-500 mb-1.5 uppercase font-medium tracking-wider">
                    Thrust Area
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-white border-neutral-200"
                  >
                    {goal.thrust_area || "N/A"}
                  </Badge>
                </div>
                <div>
                  <div className="text-xs text-neutral-500 mb-1.5 uppercase font-medium tracking-wider">
                    UOM
                  </div>
                  <div className="text-sm text-neutral-700 truncate font-medium">
                    {goal.uom_type || "-"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-neutral-500 mb-1.5 uppercase font-medium tracking-wider">
                    Target
                  </div>
                  <div className="text-sm font-medium">{goal.target_value}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-500 mb-1.5 uppercase font-medium tracking-wider">
                    Weight
                  </div>
                  <div className="text-sm font-medium text-indigo-600">
                    {goal.weightage}%
                  </div>
                </div>
              </div>

              {!isReadOnly && !isSheetLocked && (
                <div className="mt-4 flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-neutral-600 hover:text-indigo-600 hover:bg-indigo-50"
                    onClick={() => handleEditClick(goal)}
                  >
                    <Pencil size={16} className="mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => removeGoal(goal.id)}
                  >
                    <Trash2 size={16} className="mr-2" />
                    Remove
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ),
    );
  };

  if (loading)
    return (
      <div className="h-screen grid place-items-center bg-[#F8F9FC]">
        Loading...
      </div>
    );

  return (
    <div className="flex h-screen bg-[#F8F9FC] overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`fixed md:static bg-[#0F1729] w-[230px] h-screen z-50 transition flex flex-col ${mobile ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div className="p-5">
          <h1 className="text-white font-bold text-xl">OMP</h1>
        </div>
        <nav className="space-y-2 px-3 mt-4 flex-1">
          <Nav
            icon={LayoutDashboard}
            label="Dashboard"
            href="/employee/dashboard"
          />
          <Nav
            active
            icon={ListChecks}
            label="My Goal Sheet"
            href="/employee/goals"
          />
          <Nav icon={CheckCircle} label="Check-ins" href="/employee/checkins" />
          <Nav icon={BarChart3} label="Reports" href="/employee/report" />
          <Nav
            icon={ListChecks}
            label="Guidelines"
            href="/employee/guidelines"
          />
        </nav>
        <div className="p-3 mb-4">
          <button
            onClick={handleSignOut}
            className="flex w-full gap-3 px-4 py-3 rounded-xl transition text-white/70 hover:bg-rose-500/10 hover:text-rose-500 text-left"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white px-5 py-4 border-b flex justify-between items-center z-10">
          <div className="flex gap-3 items-center">
            <button className="md:hidden" onClick={() => setMobile(!mobile)}>
              {mobile ? <X /> : <Menu />}
            </button>
            <div className="font-medium text-neutral-800">Goal Sheet</div>
          </div>
          <div className="flex gap-4 items-center">
            <div className="text-sm font-medium text-neutral-700">
              {profile?.full_name}
            </div>
          </div>
        </header>

        <main className="p-5 overflow-auto flex-1">
          <div className="max-w-5xl mx-auto">
            {/* Create Goal Sheet Prompt (Only shows if no sheet exists) */}
            {!hasGoalSheet && (
              <div className="mb-8 bg-white border border-indigo-100 rounded-2xl p-8 text-center flex flex-col items-center justify-center shadow-sm">
                <div className="bg-indigo-50 p-4 rounded-full mb-4">
                  <Target size={32} className="text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-2">
                  No Goal Sheet for {activeQuarter}
                </h3>
                <p className="text-neutral-500 mb-6 max-w-sm text-sm">
                  You need to generate a new goal sheet for the active quarter
                  before adding goals.
                </p>
                <Button
                  onClick={handleCreateSheet}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg shadow-sm shadow-indigo-600/20"
                >
                  <Plus size={18} className="mr-2" /> Create {activeQuarter}{" "}
                  Goal Sheet
                </Button>
              </div>
            )}

            {/* Main Goal Sheet Layout (Only shows if sheet exists) */}
            {hasGoalSheet && (
              <>
                <div className="flex justify-between flex-wrap gap-4 items-end mb-8">
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl font-bold">My Goal Sheet</h1>
                      <Badge
                        variant="secondary"
                        className="bg-white border shadow-sm capitalize"
                      >
                        {status}
                      </Badge>
                    </div>
                    <p className="text-neutral-500 mt-1 text-sm">
                      Manage your goals for the current active cycle.
                    </p>
                    {isSheetLocked && (
                      <p className="text-amber-600 text-sm mt-2 font-medium flex items-center gap-1">
                        <Lock size={14} /> Sheet is locked. Pending manager
                        review.
                      </p>
                    )}
                  </div>

                  {!isSheetLocked && currentGoals.length > 0 && (
                    <div className="flex gap-2">
                      <Link href="/employee/goals/create">
                        <Button variant="outline" className="bg-white">
                          <Plus size={16} className="mr-2" />
                          Add Goal
                        </Button>
                      </Link>
                      <Button
                        disabled={remaining !== 0}
                        onClick={submit}
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        <Send size={16} className="mr-2" /> Submit{" "}
                        {activeQuarter} Sheet
                      </Button>
                    </div>
                  )}
                </div>

                {/* TABS Navigation */}
                <div className="flex border-b border-neutral-200 mb-6">
                  <button
                    onClick={() => setViewTab("current")}
                    className={`pb-3 px-4 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
                      viewTab === "current"
                        ? "border-indigo-600 text-indigo-600"
                        : "border-transparent text-neutral-500 hover:text-neutral-800"
                    }`}
                  >
                    <CalendarDays size={16} />
                    Active Quarter ({activeQuarter})
                  </button>
                  <button
                    onClick={() => setViewTab("past")}
                    className={`pb-3 px-4 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
                      viewTab === "past"
                        ? "border-indigo-600 text-indigo-600"
                        : "border-transparent text-neutral-500 hover:text-neutral-800"
                    }`}
                  >
                    <Archive size={16} />
                    Past Quarters
                  </button>
                </div>

                {/* Tab Views */}
                {viewTab === "current" ? (
                  <div className="space-y-6">
                    <Card className="rounded-2xl shadow-sm border-neutral-200/60">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                          {activeQuarter} Weightage Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between text-sm font-medium">
                          <div>Total: {totalWeight}%</div>
                          <div
                            className={
                              remaining === 0
                                ? "text-emerald-600"
                                : "text-amber-600"
                            }
                          >
                            Remaining: {remaining}%
                          </div>
                        </div>
                        <div className="mt-3 h-3 bg-neutral-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${remaining === 0 ? "bg-emerald-500" : "bg-indigo-500"}`}
                            style={{ width: `${totalWeight}%` }}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex flex-col gap-4">
                      {renderGoalsList(currentGoals, false)}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex flex-col gap-4">
                      {renderGoalsList(pastGoals, true)}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function Nav({ icon: Icon, label, href, active }: any) {
  return (
    <Link
      href={href}
      className={`flex gap-3 px-4 py-3 rounded-xl transition ${active ? "bg-white/10 text-white font-medium" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
    >
      <Icon size={18} /> {label}
    </Link>
  );
}
