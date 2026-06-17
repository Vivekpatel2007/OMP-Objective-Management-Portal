"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Bell,
  CheckCircle,
  ClipboardCheck,
  LayoutDashboard,
  Menu,
  ScrollText,
  Target,
  Users,
  X,
  Plus,
  Building2,
  UserPlus,
  Check
} from "lucide-react";

import {
  createSharedGoal,
  getEmployees,
  getCurrentUserProfile,
  getSharedGoals,
} from "@/services/sharedgoalservice";

export default function SharedGoalsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selected, setSelected] = useState<any[]>([]);
  const [sharedGoals, setSharedGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobile, setMobile] = useState(false);

  const [goal, setGoal] = useState({
    title: "",
    description: "",
    target: "",
    uom: "min",
    weightage: 10,
    type: "department",
    department: "",
  });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);

    const user = await getCurrentUserProfile();
    setProfile(user);

    const emp = await getEmployees();
    setEmployees(emp.data || []);

    const existing = await getSharedGoals();
    setSharedGoals(existing.data || []);

    if (user?.role === "manager") {
      setGoal((prev) => ({
        ...prev,
        department: user.department,
        type: "department",
      }));
    }

    setLoading(false);
  }

  function toggleEmployee(emp: any) {
    const exists = selected.some((s) => s.id === emp.id);
    if (exists) {
      setSelected(selected.filter((s) => s.id !== emp.id));
      return;
    }
    setSelected([...selected, emp]);
  }

  async function create() {
    if (!goal.title) {
      alert("Goal title is required");
      return;
    }

    const response = await createSharedGoal({
      ...goal,
      employees: selected,
    });

    if (response.error) {
      alert(response.error);
      return;
    }

    alert("Shared Goal Created Successfully");

    load();
    setSelected([]);
    setGoal({
      title: "",
      description: "",
      target: "",
      uom: "min",
      weightage: 10,
      type: profile?.role === "manager" ? "department" : "all",
      department: profile?.department || "",
    });
  }

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#F8F9FC]">
        Loading Shared Goals...
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
          <Item icon={CheckCircle} href="/manager/approvals" label="Approvals" />
          <Item icon={ClipboardCheck} href="/manager/checkins" label="Check-ins" />
          <Item icon={Users} href="/manager/shared-goals" label="Shared Goals" active />
          <Item icon={BarChart3} href="/manager/reports" label="Team Reports" />
          <Item icon={ScrollText} href="/manager/audit" label="Audit Log" />
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* HEADER */}
        <header className="bg-white px-5 py-4 border-b flex justify-between items-center z-10">
          <div className="flex gap-3 items-center">
            <button onClick={() => setMobile(!mobile)} className="md:hidden">
              {mobile ? <X /> : <Menu />}
            </button>
            <div className="flex flex-col">
              <h1 className="font-semibold text-neutral-950 text-base">Shared Goals</h1>
            </div>
          </div>
          <div className="flex gap-4 items-center">
            <Link href="/notifications" className="relative text-neutral-500 hover:text-neutral-900 transition-colors">
              <Bell size={20} />
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

        {/* PAGE CONTENT */}
        <main className="p-4 md:p-8 overflow-auto flex-1">
          <div className="max-w-7xl mx-auto flex flex-col gap-6">
            
            {/* Page Title Header */}
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">Assign Shared Goals</h2>
              <p className="text-neutral-500 mt-1">Create and cascade KPIs to your department or specific employees.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
              
              {/* LEFT COLUMN: Create Goal Form */}
              <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-neutral-100">
                  <h3 className="font-semibold text-lg text-neutral-900">Goal Details</h3>
                </div>
                <div className="p-6 flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-neutral-700">Goal Title</label>
                    <input
                      placeholder="e.g., Increase Q3 Sales Margin"
                      value={goal.title}
                      onChange={(e) => setGoal({ ...goal, title: e.target.value })}
                      className="w-full h-11 px-3 rounded-xl border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-neutral-700">Description</label>
                    <textarea
                      placeholder="Provide detailed expectations..."
                      value={goal.description}
                      onChange={(e) => setGoal({ ...goal, description: e.target.value })}
                      className="w-full min-h-[100px] p-3 rounded-xl border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-neutral-700">Target Value</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={goal.target}
                        onChange={(e) => setGoal({ ...goal, target: e.target.value })}
                        className="w-full h-11 px-3 rounded-xl border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-neutral-700">Weightage (%)</label>
                      <input
                        type="number"
                        placeholder="10"
                        value={goal.weightage}
                        onChange={(e) => setGoal({ ...goal, weightage: Number(e.target.value) })}
                        className="w-full h-11 px-3 rounded-xl border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-neutral-700">Unit of Measure</label>
                      <select
                        value={goal.uom}
                        onChange={(e) => setGoal({ ...goal, uom: e.target.value })}
                        className="w-full h-11 px-3 rounded-xl border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="min">Minimum</option>
                        <option value="max">Maximum</option>
                        <option value="zero">Zero Tolerance</option>
                      </select>
                    </div>
                  </div>

                  <div className="border-t border-neutral-100 pt-5 mt-2">
                    <h4 className="font-semibold text-neutral-900 mb-4">Assignment Scope</h4>
                    
                    <div className="flex flex-col sm:flex-row gap-3 mb-5">
                      <button
                        onClick={() => setGoal({ ...goal, type: "department" })}
                        className={`flex-1 flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition-colors ${
                          goal.type === "department"
                            ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                            : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                        }`}
                      >
                        <Building2 className="size-4" /> Entire Department
                      </button>
                      <button
                        onClick={() => setGoal({ ...goal, type: "employee" })}
                        className={`flex-1 flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition-colors ${
                          goal.type === "employee"
                            ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                            : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                        }`}
                      >
                        <UserPlus className="size-4" /> Specific Employees
                      </button>
                    </div>

                    {goal.type === "department" ? (
                      <div className="rounded-xl bg-indigo-50/50 border border-indigo-100 p-4 flex items-center gap-3">
                        <div className="size-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                          <Users className="size-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-900">Department Wide Goal</p>
                          <p className="text-xs text-neutral-500">
                            This goal will be assigned to everyone in the <strong>{profile?.department}</strong> department.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                        {employees.map((emp) => {
                          const active = selected.some((s) => s.id === emp.id);
                          return (
                            <button
                              key={emp.id}
                              onClick={() => toggleEmployee(emp)}
                              className={`flex items-center justify-between rounded-xl border p-3 text-left transition-colors ${
                                active
                                  ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20"
                                  : "bg-white border-neutral-200 text-neutral-800 hover:border-indigo-300"
                              }`}
                            >
                              <div className="flex flex-col overflow-hidden">
                                <span className={`font-semibold text-sm truncate ${active ? "text-white" : "text-neutral-900"}`}>
                                  {emp.full_name}
                                </span>
                                <span className={`text-xs truncate ${active ? "text-indigo-200" : "text-neutral-500"}`}>
                                  {emp.employee_id || "No ID"}
                                </span>
                              </div>
                              {active && <Check className="size-4 text-white shrink-0 ml-2" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={create}
                    className="w-full mt-4 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium h-12 rounded-xl transition-all shadow-sm active:scale-[0.98]"
                  >
                    <Plus className="size-5" /> Cascade Shared Goal
                  </button>
                </div>
              </div>

              {/* RIGHT COLUMN: Existing Shared Goals */}
              <div className="flex flex-col gap-4">
                <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-sm flex flex-col h-full overflow-hidden">
                  <div className="p-6 border-b border-neutral-100 bg-neutral-50/50">
                    <h3 className="font-semibold text-lg text-neutral-900">Active Shared Goals</h3>
                    <p className="text-sm text-neutral-500 mt-1">Currently assigned KPIs</p>
                  </div>
                  
                  <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-3 custom-scrollbar">
                    {sharedGoals.length === 0 ? (
                      <div className="text-center py-10 px-4 rounded-xl border border-dashed border-neutral-200 bg-neutral-50 flex flex-col items-center">
                        <Target className="size-8 text-neutral-300 mb-2" />
                        <h3 className="font-medium text-neutral-900">No active goals</h3>
                        <p className="text-neutral-500 text-sm mt-1 text-center">
                          Shared goals you create will appear here.
                        </p>
                      </div>
                    ) : (
                      sharedGoals.map((g) => (
                        <div key={g.id} className="rounded-xl border border-neutral-200 bg-white p-4 hover:shadow-sm transition-shadow">
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <h4 className="font-semibold text-neutral-900 text-sm leading-tight">
                              {g.title}
                            </h4>
                            <span className="shrink-0 px-2.5 py-0.5 rounded-full bg-neutral-100 border border-neutral-200 text-[10px] font-medium text-neutral-600 uppercase tracking-wider">
                              {g.assignment_type}
                            </span>
                          </div>
                          
                          <p className="text-xs text-neutral-500 mb-4 line-clamp-2">
                            {g.description || "No description provided."}
                          </p>
                          
                          <div className="grid grid-cols-2 gap-2 border-t border-neutral-100 pt-3 mt-auto">
                            <div className="flex flex-col">
                              <span className="text-[10px] uppercase font-semibold text-neutral-400">Target</span>
                              <span className="text-sm font-medium text-neutral-800">{g.target_value} ({g.uom_type})</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] uppercase font-semibold text-neutral-400">Created</span>
                              <span className="text-sm font-medium text-neutral-800">
                                {g.created_at?.split("T")[0] || "N/A"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>

      {/* Adding some global css inside component just for custom scrollbar styling if needed, though standard tailwind is preferred */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #E5E7EB;
          border-radius: 20px;
        }
      `}} />
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