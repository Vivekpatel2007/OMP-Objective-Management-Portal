
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  CalendarRange,
  Clock,
  Plus,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// Helper to format timestamps nicely for display
const formatDisplayDate = (isoString?: string | null) => {
  if (!isoString) return "Not scheduled";
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export default function CycleConfigurationsList() {
  const [loading, setLoading] = useState(true);
  const [cycles, setCycles] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    fetchAllCycles();
  }, []);

  async function fetchAllCycles() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("goal_cycles")
        .select("*")
        .order("is_active", { ascending: false }) // Put active cycle first
        .order("created_at", { ascending: false }); // Then newest first

      if (error) throw error;
      setCycles(data || []);
    } catch (err) {
      console.error("Error fetching cycles:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f7fb] text-slate-500">
        Loading Configurations...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900 font-sans pb-12">
      <div className="max-w-7xl mx-auto p-6 md:p-8 flex flex-col gap-8">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-xl bg-blue-600 text-white flex justify-center items-center shadow-sm">
              <CalendarRange className="size-6" />
            </div>
            <div className="flex flex-col">
              <h1 className="font-serif text-3xl font-bold text-slate-900">Cycle Overview</h1>
              <p className="text-slate-500 text-sm mt-1">View all performance cycle schedules and phases</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              href="/admin/dashboard" 
              className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm"
            >
              <ArrowLeft className="size-4" />
              Back
            </Link>
            <Link 
              href="/admin/cycles" 
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="size-4" />
              New Configuration
            </Link>
          </div>
        </header>

        {/* Cycles Grid */}
        {cycles.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 flex flex-col items-center justify-center border border-slate-200 text-center shadow-sm">
            <Calendar className="size-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-700">No cycles configured</h3>
            <p className="text-slate-500 text-sm mt-2 max-w-sm">You haven't set up any performance cycles yet. Create your first configuration to get started.</p>
            <Link 
              href="/admin/cycles" 
              className="mt-6 inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Configure Cycle
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {cycles.map((cycle) => (
              <div 
                key={cycle.id} 
                className={`bg-white rounded-2xl p-6 border shadow-sm flex flex-col gap-6 relative overflow-hidden transition-all ${
                  cycle.is_active 
                    ? 'border-blue-400 shadow-blue-500/10' 
                    : 'border-slate-200'
                }`}
              >
                {/* Active Indicator Strip */}
                {cycle.is_active && (
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-500" />
                )}

                {/* Card Header */}
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-3">
                      <h2 className="font-serif text-2xl font-bold text-slate-800">
                        {cycle.cycle_name || "Unnamed Cycle"}
                      </h2>
                      {cycle.is_active && (
                        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="size-3.5" /> Active
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 text-sm flex items-center gap-2 capitalize">
                      <Clock className="size-4" />
                      Status: {cycle.status || "Inactive"}
                    </p>
                  </div>

                  {/* Override Badge */}
                  <div title="Override Status">
                    {cycle.override_enabled ? (
                      <span className="inline-flex items-center justify-center p-2 rounded-lg bg-orange-50 text-orange-600 border border-orange-200">
                        <ShieldAlert className="size-5" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
                        <ShieldCheck className="size-5" />
                      </span>
                    )}
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* Phases List */}
                <div className="flex flex-col gap-4">
                  
                  {/* Goal Setting */}
                  <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-sm font-semibold text-slate-700 w-1/3">Goal Setting</span>
                    <div className="flex flex-col text-right w-2/3">
                      <span className="text-xs text-slate-500">
                        {formatDisplayDate(cycle.goal_setting_start)} —
                      </span>
                      <span className="text-xs font-medium text-slate-800">
                        {formatDisplayDate(cycle.goal_setting_end)}
                      </span>
                    </div>
                  </div>

                  {/* Q1 */}
                  <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-sm font-semibold text-slate-700 w-1/3">Q1 Check-in</span>
                    <div className="flex flex-col text-right w-2/3">
                      <span className="text-xs text-slate-500">
                        {formatDisplayDate(cycle.q1_start)} —
                      </span>
                      <span className="text-xs font-medium text-slate-800">
                        {formatDisplayDate(cycle.q1_end)}
                      </span>
                    </div>
                  </div>

                  {/* Q2 */}
                  <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-sm font-semibold text-slate-700 w-1/3">Q2 Check-in</span>
                    <div className="flex flex-col text-right w-2/3">
                      <span className="text-xs text-slate-500">
                        {formatDisplayDate(cycle.q2_start)} —
                      </span>
                      <span className="text-xs font-medium text-slate-800">
                        {formatDisplayDate(cycle.q2_end)}
                      </span>
                    </div>
                  </div>

                  {/* Q3 */}
                  <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-sm font-semibold text-slate-700 w-1/3">Q3 Check-in</span>
                    <div className="flex flex-col text-right w-2/3">
                      <span className="text-xs text-slate-500">
                        {formatDisplayDate(cycle.q3_start)} —
                      </span>
                      <span className="text-xs font-medium text-slate-800">
                        {formatDisplayDate(cycle.q3_end)}
                      </span>
                    </div>
                  </div>

                  {/* Q4 */}
                  <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-sm font-semibold text-slate-700 w-1/3">Q4 Check-in</span>
                    <div className="flex flex-col text-right w-2/3">
                      <span className="text-xs text-slate-500">
                        {formatDisplayDate(cycle.q4_start)} —
                      </span>
                      <span className="text-xs font-medium text-slate-800">
                        {formatDisplayDate(cycle.q4_end)}
                      </span>
                    </div>
                  </div>

                </div>

                
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}