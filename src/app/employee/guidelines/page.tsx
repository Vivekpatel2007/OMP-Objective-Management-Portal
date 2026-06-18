"use client";

import Link from "next/link";
import {
  ArrowLeft,
  LayoutDashboard,
  Target,
  Users,
  CalendarCheck,
  BarChart3,
  Star,
  BookOpen,
  Info,
} from "lucide-react";

export default function EmployeeGuidelinesPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FC] font-sans pb-12">
      {/* Header Section */}
      <div className="bg-[#0F1729] text-white pt-12 pb-24 px-6 md:px-8">
        <div className="max-w-6xl mx-auto">
          <Link
            href="/employee/dashboard"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors text-sm font-medium"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <BookOpen size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight text-white">
                Employee Guidelines
              </h1>
              <p className="text-slate-400 mt-2 max-w-2xl text-sm md:text-base">
                Everything you need to know about setting, managing, and
                tracking your performance objectives within the platform.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Guidelines Grid */}
      <div className="max-w-6xl mx-auto px-6 md:px-8 -mt-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. Dashboard Overview */}
          <GuidelineCard
            icon={LayoutDashboard}
            title="1. Dashboard Overview"
            color="bg-blue-500"
            items={[
              "Tracking Metrics: Your dashboard provides an immediate overview of your Total Goals, Average Progress, Total Weightage, and Sheet Status.",
              "Cycle Phases: You can view the current active organizational phase, such as the Goal Setting Phase or specific quarterly check-ins (Q1-Q4).",
              "Goal Submission: Once your goal weightage reaches exactly 100% and your status is in 'draft,' you can submit your goal sheet for manager approval directly from the dashboard.",
            ]}
          />

          {/* 2. Personal Goals */}
          <GuidelineCard
            icon={Target}
            title="2. Creating & Managing Personal Goals"
            color="bg-indigo-500"
            items={[
              "Goal Limits: You are permitted to create a maximum of 8 personal goals.",
              "Weightage Requirements: Every individual goal must be assigned a weightage of at least 10%.",
              "Total Weightage: The combined weightage of all your personal goals must equal exactly 100%.",
              "Required Details: When creating a goal, you must specify the Goal Title, Description, Thrust Area, Unit of Measure (UOM), Target Value, and Weightage.",
              "Editing Restrictions: Your goal sheet will be locked and cannot be edited once it is 'submitted' or 'approved'.",
            ]}
          />

          {/* 3. Shared Goals */}
          <GuidelineCard
            icon={Users}
            title="3. Handling Shared Goals"
            color="bg-emerald-500"
            items={[
              "Assignments: Managers and administrators can cascade Shared Goals to your specific profile, your department, or the entire organization[cite: 10, 11].",
              "Visibility: Assigned shared goals appear in a dedicated section on your Dashboard and within your Check-in Workspace.",
              "Weightage Allocation: You must allocate a specific weightage to the shared goals assigned to you.",
            ]}
          />

          {/* 4. Quarterly Progress */}
          <GuidelineCard
            icon={CalendarCheck}
            title="4. Quarterly Progress Check-ins"
            color="bg-amber-500"
            items={[
              "Personal Goals: Use the Check-in Workspace to input your 'Actual Achievement' and adjust your 'Weightage,' then click 'Save Update' to log your progress.",
              "Shared Goals (Drafting): You can update your shared goal progress and weightage, then click 'Save' to keep it as a draft.",
              "Shared Goals (Submission): Clicking 'Submit' on a shared goal will send it directly to the assigner (Manager or Admin) for review.",
              "Check-in Locking: Once you submit a shared goal update, it becomes locked and you will not be able to edit it until the assigner reviews it.",
            ]}
          />

          {/* 5. Performance Reports */}
          <GuidelineCard
            icon={BarChart3}
            title="5. Performance Reports"
            color="bg-rose-500"
            items={[
              "Export Options: You can export your comprehensive Performance Analytics report as a PDF or CSV file.",
              "Analytics Breakdown: The report workspace categorizes your goals into 'Completed,' 'On Track,' and 'Behind,' and averages your progress across different Thrust Areas.",
            ]}
          />
        </div>

        {/* Footer info box */}
        <div className="mt-8 bg-indigo-50 border border-indigo-100 rounded-2xl p-6 flex gap-4 items-start shadow-sm">
          <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg shrink-0">
            <Info size={20} />
          </div>
          <div>
            <h4 className="font-semibold text-indigo-900">
              Need further assistance?
            </h4>
            <p className="text-sm text-indigo-700 mt-1">
              If you have any questions regarding goal setting or encounter
              technical issues, please reach out to your HR Administrator or
              direct reporting manager for clarification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable component for the guideline cards
function GuidelineCard({
  title,
  items,
  icon: Icon,
  color,
}: {
  title: string;
  items: string[];
  icon: any;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col h-full">
      <div className="flex items-center gap-4 mb-5 border-b border-slate-100 pb-4">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm ${color}`}
        >
          <Icon size={20} />
        </div>
        <h2 className="text-xl font-bold text-slate-800 font-serif">{title}</h2>
      </div>
      <ul className="space-y-3 flex-1">
        {items.map((item, index) => {
          // Splitting the title and description for better formatting
          const [boldPart, ...rest] = item.split(": ");
          const description = rest.join(": ");

          return (
            <li
              key={index}
              className="text-sm text-slate-600 flex items-start gap-3 leading-relaxed"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2 shrink-0" />
              <div>
                {description ? (
                  <>
                    <strong className="text-slate-800">{boldPart}:</strong>{" "}
                    {description}
                  </>
                ) : (
                  item
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
