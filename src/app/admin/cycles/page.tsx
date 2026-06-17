"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  LogOut,
  RotateCcw,
  Save,
  Shield,
  ShieldAlert,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// Helper to safely format DB timestamps for the HTML input
const formatForInput = (isoString?: string | null) => {
  if (!isoString) return "";
  return new Date(isoString).toISOString().slice(0, 16);
};

export default function CycleGovernance() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // State matching your DB schema
  const [cycle, setCycle] = useState<any>({
    id: "",
    cycle_name: "",
    status: "inactive",
    is_active: false,
    override_enabled: false,
    goal_setting_start: "",
    goal_setting_end: "",
    q1_start: "",
    q1_end: "",
    q2_start: "",
    q2_end: "",
    q3_start: "",
    q3_end: "",
    q4_start: "",
    q4_end: "",
  });

  const supabase = createClient();

  useEffect(() => {
    loadActiveCycle();
  }, []);

  async function loadActiveCycle() {
    setLoading(true);
    try {
      // Fetch the currently active cycle
      const { data, error } = await supabase
        .from("goal_cycles")
        .select("*")
        .eq("status", "active")
        .maybeSingle();

      if (data) {
        setCycle({
          ...data,
          goal_setting_start: formatForInput(data.goal_setting_start),
          goal_setting_end: formatForInput(data.goal_setting_end),
          q1_start: formatForInput(data.q1_start),
          q1_end: formatForInput(data.q1_end),
          q2_start: formatForInput(data.q2_start),
          q2_end: formatForInput(data.q2_end),
          q3_start: formatForInput(data.q3_start),
          q3_end: formatForInput(data.q3_end),
          q4_start: formatForInput(data.q4_start),
          q4_end: formatForInput(data.q4_end),
        });
      }
    } catch (err) {
      console.error("Error loading cycle:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async () => {
    if (!cycle.cycle_name) {
      alert("Please enter a Cycle Name (e.g., FY2026).");
      return;
    }

    setSaving(true);
    try {
      // --- NEW LOGIC: Evaluate the current date against the phase dates ---
      const now = new Date();
      
      const isWithinDateRange = (start?: string, end?: string) => {
        if (!start || !end) return false;
        return now >= new Date(start) && now <= new Date(end);
      };

      // Determine the dynamic status based on the current system date
      let currentPhaseStatus = "active"; // Fallback status
      
      if (isWithinDateRange(cycle.goal_setting_start, cycle.goal_setting_end)) {
        currentPhaseStatus = "goal_setting";
      } else if (isWithinDateRange(cycle.q1_start, cycle.q1_end)) {
        currentPhaseStatus = "q1_checkin";
      } else if (isWithinDateRange(cycle.q2_start, cycle.q2_end)) {
        currentPhaseStatus = "q2_checkin";
      } else if (isWithinDateRange(cycle.q3_start, cycle.q3_end)) {
        currentPhaseStatus = "q3_checkin";
      } else if (isWithinDateRange(cycle.q4_start, cycle.q4_end)) {
        currentPhaseStatus = "q4_checkin";
      }

      const payload = {
        cycle_name: cycle.cycle_name,
        override_enabled: cycle.override_enabled,
        goal_setting_start: cycle.goal_setting_start || null,
        goal_setting_end: cycle.goal_setting_end || null,
        q1_start: cycle.q1_start || null,
        q1_end: cycle.q1_end || null,
        q2_start: cycle.q2_start || null,
        q2_end: cycle.q2_end || null,
        q3_start: cycle.q3_start || null,
        q3_end: cycle.q3_end || null,
        q4_start: cycle.q4_start || null,
        q4_end: cycle.q4_end || null,
        is_active: true,                 // Keeps the overall cycle active
        status: currentPhaseStatus,      // Saves the specific calculated phase
      };

      let savedCycleId = null;

      const { data: existingCycle } = await supabase
        .from("goal_cycles")
        .select("id")
        .eq("cycle_name", cycle.cycle_name)
        .maybeSingle();

      if (existingCycle) {
        const { data, error } = await supabase.from("goal_cycles").update(payload).eq("id", existingCycle.id).select().single();
        if (error) throw error;
        savedCycleId = data.id;
      } else {
        const { data, error } = await supabase.from("goal_cycles").insert([payload]).select().single();
        if (error) throw error;
        savedCycleId = data.id;
      }

      // Deactivate all OTHER cycles
      if (savedCycleId) {
        const { error: deactivateError } = await supabase
          .from("goal_cycles")
          .update({ is_active: false, status: "inactive" })
          .neq("id", savedCycleId);

        if (deactivateError) throw deactivateError;
      }

      alert(`Cycle "${cycle.cycle_name}" saved. Phase set to: ${currentPhaseStatus.replace('_', ' ')}`);
      loadActiveCycle(); 
      
    } catch (error) {
      console.error("Save failed:", error);
      alert("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const toggleOverride = () => {
    setCycle({ ...cycle, override_enabled: !cycle.override_enabled });
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#f4f7fb]">Loading Configuration...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900 font-sans pb-12">
      <div className="max-w-7xl mx-auto p-6 md:p-8 flex flex-col gap-6">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-xl bg-blue-600 text-white flex justify-center items-center shadow-sm">
              <Calendar className="size-6" />
            </div>
            <div className="flex flex-col">
              <h1 className="font-serif text-3xl font-bold text-slate-900">Cycle Governance</h1>
              <p className="text-slate-500 text-sm mt-1">Configure performance cycle schedule and enforcement rules</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              href="/admin/dashboard" 
              className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm w-fit"
            >
              <ArrowLeft className="size-4" />
              Back to Dashboard
            </Link>
            <button 
              onClick={handleLogout}
              className="inline-flex items-center gap-2 bg-white border border-rose-200 text-rose-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-50 transition-colors shadow-sm w-fit"
            >
              <LogOut className="size-4" />
              Sign Out
            </button>
          </div>
        </header>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] flex justify-between items-center">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Cycle</span>
              <span className="font-serif text-2xl font-bold text-slate-800">{cycle.cycle_name || "None"}</span>
            </div>
            <div className="size-10 rounded-lg bg-blue-500 text-white flex justify-center items-center shadow-md shadow-blue-500/20">
              <Calendar className="size-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] flex justify-between items-center">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Current Phase</span>
              <span className="font-serif text-2xl font-bold text-slate-800 capitalize">{cycle.status || "Inactive"}</span>
            </div>
            <div className="size-10 rounded-lg bg-purple-500 text-white flex justify-center items-center shadow-md shadow-purple-500/20">
              <Clock className="size-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] flex justify-between items-center">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Override Status</span>
              <span className={`font-serif text-2xl font-bold ${cycle.override_enabled ? 'text-orange-600' : 'text-slate-800'}`}>
                {cycle.override_enabled ? "Enabled" : "Disabled"}
              </span>
            </div>
            <div className={`size-10 rounded-lg text-white flex justify-center items-center shadow-md ${cycle.override_enabled ? 'bg-orange-500 shadow-orange-500/20' : 'bg-emerald-500 shadow-emerald-500/20'}`}>
              <Shield className="size-5" />
            </div>
          </div>
        </div>

        {/* General Settings */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-800 font-serif">Cycle Name</label>
          <input
            type="text"
            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50/50"
            value={cycle.cycle_name || ""}
            onChange={(e) => setCycle({ ...cycle, cycle_name: e.target.value })}
            placeholder="e.g. FY2026"
          />
        </div>

        {/* Phases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col gap-5">
            <h3 className="font-serif text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Goal Setting Phase</h3>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-500">Open Date</label>
                <input type="datetime-local" className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700" value={cycle.goal_setting_start} onChange={(e) => setCycle({ ...cycle, goal_setting_start: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-500">Close Date</label>
                <input type="datetime-local" className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700" value={cycle.goal_setting_end} onChange={(e) => setCycle({ ...cycle, goal_setting_end: e.target.value })} />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col gap-5">
            <h3 className="font-serif text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Q1 Check-in Phase</h3>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-500">Open Date</label>
                <input type="datetime-local" className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700" value={cycle.q1_start} onChange={(e) => setCycle({ ...cycle, q1_start: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-500">Close Date</label>
                <input type="datetime-local" className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700" value={cycle.q1_end} onChange={(e) => setCycle({ ...cycle, q1_end: e.target.value })} />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col gap-5">
            <h3 className="font-serif text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Q2 Check-in Phase</h3>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-500">Open Date</label>
                <input type="datetime-local" className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700" value={cycle.q2_start} onChange={(e) => setCycle({ ...cycle, q2_start: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-500">Close Date</label>
                <input type="datetime-local" className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700" value={cycle.q2_end} onChange={(e) => setCycle({ ...cycle, q2_end: e.target.value })} />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col gap-5">
            <h3 className="font-serif text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Q3 Check-in Phase</h3>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-500">Open Date</label>
                <input type="datetime-local" className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700" value={cycle.q3_start} onChange={(e) => setCycle({ ...cycle, q3_start: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-500">Close Date</label>
                <input type="datetime-local" className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700" value={cycle.q3_end} onChange={(e) => setCycle({ ...cycle, q3_end: e.target.value })} />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col gap-5">
            <h3 className="font-serif text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Q4 Check-in Phase</h3>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-500">Open Date</label>
                <input type="datetime-local" className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700" value={cycle.q4_start} onChange={(e) => setCycle({ ...cycle, q4_start: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-500">Close Date</label>
                <input type="datetime-local" className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700" value={cycle.q4_end} onChange={(e) => setCycle({ ...cycle, q4_end: e.target.value })} />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-4 mt-2">
          <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed">
            <Save className="size-4" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
          
          <button onClick={toggleOverride} className={`inline-flex items-center gap-2 border px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm ${cycle.override_enabled ? 'bg-orange-50 border-orange-300 text-orange-700' : 'bg-white border-orange-200 text-orange-600 hover:bg-orange-50'}`}>
            <ShieldAlert className="size-4" />
            {cycle.override_enabled ? "Disable Override" : "Enable Override"}
          </button>
          
          <button onClick={loadActiveCycle} className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
            <RotateCcw className="size-4" />
            Discard Changes
          </button>
        </div>

      </div>
    </div>
  );
}