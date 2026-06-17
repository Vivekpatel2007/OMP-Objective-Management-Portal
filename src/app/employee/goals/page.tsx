"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  AlertTriangle,
  BarChart3,
  Bell,
  CheckCircle2,
  GripVertical,
  Info,
  LayoutDashboard,
  Pencil,
  Plus,
  Send,
  Settings,
  Target,
  Trash2,
  CheckCircle,
  Menu,
  X,
  Check,
  ListChecks,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

type Goal = {
  id: string;
  title: string;
  description?: string;
  thrust_area?: string;
  uom_type?: string;
  target_value: number;
  weightage: number;
  progress: number;
};

export default function GoalSheet() {
  const [loading, setLoading] = useState(true);
  const [mobile, setMobile] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [status, setStatus] = useState("draft");
  const [locked, setLocked] = useState(false);

  // States for inline editing
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Goal>>({});

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      const [goalRes, user, notif] = await Promise.all([
        getGoals(),
        getCurrentUserProfile(),
        getNotifications(),
      ]);

      setGoals(goalRes?.data || []);
      setStatus(goalRes?.submissionStatus || "draft");
      setLocked(goalRes?.locked || false);
      setProfile(user);
      setNotifications(notif?.data || []);
    } finally {
      setLoading(false);
    }
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
    alert("Submitted");
    load();
  }

  // Edit Handlers
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
    
    // Actually update the DB!
    const res = await updateGoal(editingGoalId, editForm);
    if (res?.error) {
       alert("Failed to update goal");
       return;
    }
    
    // Optimistically update the local state:
    setGoals((prev) =>
      prev.map((g) => (g.id === editingGoalId ? { ...g, ...editForm } as Goal : g))
    );
    
    setEditingGoalId(null);
    setEditForm({});
  }
  const totalWeight = goals.reduce((a, b) => a + Number(b.weightage || 0), 0);
  const remaining = 100 - totalWeight;

  if (loading) {
    return <div className="h-screen grid place-items-center">Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-[#F8F9FC] overflow-hidden">
      {/* SIDEBAR */}
      <aside
        className={`fixed md:static bg-[#0F1729] w-[230px] h-screen z-50 transition flex flex-col ${
          mobile ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="p-5">
          <h1 className="text-white font-bold text-xl">GoalTrack</h1>
        </div>

        <nav className="space-y-2 px-3 mt-4">
          <Nav icon={LayoutDashboard} label="Dashboard" href="/employee/dashboard" />
          <Nav active icon={ListChecks} label="My Goal Sheet" href="/employee/goals" />
          <Nav icon={CheckCircle} label="Check-ins" href="/employee/checkins" />
          <Nav icon={BarChart3} label="Reports" href="/employee/report" />
          <Nav icon={Settings} label="Settings" href="/settings" />
        </nav>

        <div className="mt-auto p-5 flex gap-3 items-center">
          <div className="size-10 rounded-full bg-white/10 text-white grid place-items-center font-semibold">
            {profile?.full_name?.[0] || "E"}
          </div>
          <div>
            <div className="font-medium text-white">{profile?.full_name}</div>
            <div className="text-xs text-white/50">Employee</div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white px-5 py-4 border-b flex justify-between items-center z-10">
          <div className="flex gap-3 items-center">
            <button className="md:hidden" onClick={() => setMobile(!mobile)}>
              {mobile ? <X /> : <Menu />}
            </button>
            <div className="font-medium">Goal Sheet</div>
          </div>
          <div className="flex gap-4 items-center">
            <Link href="/notifications" className="relative">
              <Bell className="text-neutral-600" size={20} />
              {notifications.length > 0 && (
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-indigo-600 border-2 border-white" />
              )}
            </Link>
            <div className="text-sm font-medium">
              {profile?.full_name}
            </div>
          </div>
        </header>

        <main className="p-5 overflow-auto flex-1">
          <div className="max-w-5xl mx-auto">
            <div className="flex justify-between flex-wrap gap-4 items-end">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold">My Goal Sheet</h1>
                  <Badge variant="secondary" className="bg-white border shadow-sm">{status}</Badge>
                </div>
                <p className="text-neutral-500 mt-1 text-sm">Define and manage goals</p>
              </div>
              <div className="flex gap-2">
                <Link href="/employee/goals/create">
                  <Button variant="outline" className="bg-white">
                    <Plus size={16} className="mr-2" />
                    Add Goal
                  </Button>
                </Link>
                <Button disabled={locked} onClick={submit} className="bg-indigo-600 hover:bg-indigo-700">
                  <Send size={16} className="mr-2" />
                  Submit Sheet
                </Button>
              </div>
            </div>

            {/* WEIGHT SUMMARY */}
            <Card className="mt-6 rounded-2xl shadow-sm border-neutral-200/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Weightage Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between text-sm font-medium">
                  <div>Total: {totalWeight}%</div>
                  <div className={remaining === 0 ? "text-emerald-600" : "text-amber-600"}>
                    Remaining: {remaining}%
                  </div>
                </div>
                <div className="mt-3 h-3 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${remaining === 0 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                    style={{ width: `${totalWeight}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* GOALS */}
            <div className="mt-6 flex flex-col gap-4">
              {goals.length === 0 ? (
                <Card className="rounded-2xl border-dashed border-2">
                  <CardContent className="p-10 text-center">
                    <div className="font-medium">No Goals Yet</div>
                    <div className="mt-2 text-sm text-neutral-500">Create your first goal to get started</div>
                    <Link href="/employee/goals/create">
                      <Button className="mt-5 bg-indigo-600 hover:bg-indigo-700">
                        <Plus size={16} className="mr-2" /> Create Goal
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                goals.map((goal) => 
                  // Render Inline Edit Mode OR Read Mode
                  editingGoalId === goal.id ? (
                    <Card key={goal.id} className="border-2 border-indigo-200 shadow-sm relative rounded-2xl">
                      <div className="p-6 bg-indigo-50/30 rounded-2xl">
                        <div className="flex justify-between items-center mb-6">
                          <div className="flex items-center gap-3">
                            <GripVertical className="text-neutral-400" size={20} />
                            <h3 className="font-bold text-lg">{editForm.title || "Editing Goal"}</h3>
                          </div>
                          <div className="text-sm text-indigo-600 font-medium bg-indigo-100 px-3 py-1 rounded-full">Editing Mode</div>
                        </div>

                        <div className="space-y-4 pl-8">
                          <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-neutral-700">Goal Title</label>
                              <Input
                                value={editForm.title || ""}
                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                className="bg-white"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-neutral-700">Thrust Area</label>
                              <Select
                                value={editForm.thrust_area || ""}
                                onValueChange={(val) => setEditForm({ ...editForm, thrust_area: val })}
                              >
                                <SelectTrigger className="bg-white">
                                  <SelectValue placeholder="Select Area" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Quality">Quality</SelectItem>
                                  <SelectItem value="Revenue">Revenue</SelectItem>
                                  <SelectItem value="Operations">Operations</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-700">Description</label>
                            <Textarea
                              className="resize-none bg-white"
                              rows={3}
                              value={editForm.description || ""}
                              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            />
                          </div>

                          <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-neutral-700">UOM</label>
                              <Select
                                value={editForm.uom_type || ""}
                                onValueChange={(val) => setEditForm({ ...editForm, uom_type: val })}
                              >
                                <SelectTrigger className="bg-white">
                                  <SelectValue placeholder="Select UOM" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Numeric Higher Better">Numeric Higher Better</SelectItem>
                                  <SelectItem value="Numeric Lower Better">Numeric Lower Better</SelectItem>
                                  <SelectItem value="Percentage">Percentage</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-neutral-700">Target Value</label>
                              <Input
                                type="number"
                                className="bg-white"
                                value={editForm.target_value || ""}
                                onChange={(e) => setEditForm({ ...editForm, target_value: Number(e.target.value) })}
                              />
                            </div>
                          </div>

                          <div className="w-1/2 pr-3 space-y-2">
                            <label className="text-sm font-medium text-neutral-700">Weightage %</label>
                            <Input
                              type="number"
                              className="bg-white"
                              value={editForm.weightage || ""}
                              onChange={(e) => setEditForm({ ...editForm, weightage: Number(e.target.value) })}
                            />
                          </div>

                          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-indigo-100">
                            <Button variant="ghost" onClick={handleCancelEdit}>
                              Cancel
                            </Button>
                            <Button className="bg-neutral-900 text-white hover:bg-neutral-800" onClick={handleSaveEdit}>
                              <Check className="mr-2" size={16} />
                              Save Changes
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ) : (
                    <Card key={goal.id} className="p-5 rounded-2xl shadow-sm border-neutral-200/60 transition-all hover:shadow-md">
                      <CardContent className="flex p-0 gap-4 items-start">
                        <GripVertical className="mt-1 text-neutral-300 cursor-grab" />
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-lg text-neutral-900">{goal.title}</h3>
                              <p className="text-sm text-neutral-500 mt-1">{goal.description}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge variant="secondary" className="bg-indigo-50 text-indigo-700">{goal.progress || 0}% Progress</Badge>
                            </div>
                          </div>

                          <div className="grid md:grid-cols-4 gap-5 mt-6 bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                            <div>
                              <div className="text-xs text-neutral-500 mb-1.5 uppercase font-medium tracking-wider">Thrust Area</div>
                              <Badge variant="outline" className="bg-white">{goal.thrust_area || "N/A"}</Badge>
                            </div>
                            <div>
                              <div className="text-xs text-neutral-500 mb-1.5 uppercase font-medium tracking-wider">UOM</div>
                              <div className="text-sm text-neutral-700 truncate">{goal.uom_type || "-"}</div>
                            </div>
                            <div>
                              <div className="text-xs text-neutral-500 mb-1.5 uppercase font-medium tracking-wider">Target</div>
                              <div className="text-sm font-medium">{goal.target_value}</div>
                            </div>
                            <div>
                              <div className="text-xs text-neutral-500 mb-1.5 uppercase font-medium tracking-wider">Weight</div>
                              <div className="text-sm font-medium">{goal.weightage}%</div>
                            </div>
                          </div>

                          <div className="mt-4 flex justify-end gap-2">
                            <Button variant="ghost" size="sm" className="text-neutral-600 hover:text-indigo-600 hover:bg-indigo-50" onClick={() => handleEditClick(goal)}>
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
                        </div>
                      </CardContent>
                    </Card>
                  )
                )
              )}
            </div>

            {/* VALIDATION */}
            <Card className="mt-6 rounded-2xl shadow-sm border-neutral-200/60 mb-8">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Validation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2 text-sm items-center">
                  <CheckCircle2 size={18} className="text-emerald-500" />
                  <span className="font-medium text-neutral-700">Goals:</span> {goals.length}/8
                </div>
                <div className={`flex gap-2 text-sm items-center ${remaining === 0 ? "text-emerald-600" : "text-rose-500"}`}>
                  <AlertTriangle size={18} />
                  <span className="font-medium">Weight:</span> {totalWeight}%
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

/* NAV Component matched to Dashboard Sidebar theme */
function Nav({ icon: Icon, label, href, active }: any) {
  return (
    <Link
      href={href}
      className={`flex gap-3 px-4 py-3 rounded-xl transition ${
        active
          ? "bg-white/10 text-white font-medium"
          : "text-white/70 hover:bg-white/10 hover:text-white"
      }`}
    >
      <Icon size={18} />
      {label}
    </Link>
  );
}