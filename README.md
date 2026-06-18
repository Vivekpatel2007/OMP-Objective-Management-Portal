
#  OMP-Objective Management Portal


[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=flat-square&logo=vercel)](https://omp-objective-management-portal-l36btmcdt.vercel.app/) [![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-181717?style=flat-square&logo=github)](https://github.com/Vivekpatel2007/OMP-Objective-Management-Portal) [![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=nextdotjs)](https://nextjs.org/) [![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)

## Problem Statement

Organizations often face problems while managing employee goals because of manual processes. Some common problems are:

* Goals are managed using spreadsheets and emails.
* Managers cannot track employee progress in real time.
* Employees do not clearly understand how their work supports company objectives.
* Performance reviews become difficult because data is scattered.
* No proper system exists for approvals, check-ins, and tracking.
* Changes made to goals are difficult to monitor and audit.

---

## Solution / Description

OMP is a Goal Setting & Tracking Portal developed to solve these problems by creating a centralized digital platform.

The system allows employees to create and track goals, managers to review and approve them, and admins to manage cycles and governance. It supports quarterly check-ins, shared goals, progress tracking, reports, and audit logs to make performance management easier, transparent, and organized.

## Core Features 

### Role-Based Access Control

Three distinct roles — Employee, Manager , and Admin/HR — with separate dashboards and permissions. Employees manage goals and check-ins, managers review and approve progress, and admins control governance and organization-wide operations.

### Goal Creation & Approval Workflow

Employees create Goal Sheets by defining goals, targets, UoM, and weightage. Validation rules enforce a maximum of 8 goals, minimum 10% weightage per goal, and total weightage equal to 100%. Managers approve, reject, or return submissions for rework.

### Shared Goal Assignment

Managers and admins can assign common organizational or departmental KPIs to employees in bulk. Shared goals support organization-wide, department-wise, or selected employee assignment with centralized achievement tracking.

### Quarterly Check-ins & Achievement Tracking

Employees update actual achievements during quarterly windows, while managers review progress and provide structured feedback through check-ins and review comments.

### Progress Calculation Engine

Progress is automatically calculated using goal targets and achievement values with support for Numeric, Percentage, Timeline, and Zero-based measurement methods.


### Reporting & Performance Visibility

Generate performance reports, monitor completion status, compare planned vs actual achievements, and provide organization-wide visibility through dashboards and exports.

### Enterprise Deployment

Built using Next.js, TypeScript, Tailwind CSS, Supabase Authentication, and PostgreSQL with scalable architecture and deployment support through Vercel.

### Progress Calculation Engine

OMP supports four UOM (Unit of Measure) types, each with distinct progress semantics:

| UOM | Meaning | Formula | Example |
| :--- | :--- | :--- | :--- |
| `min` | Higher is better | `(actual ÷ target) × 100` | Sales revenue, customer score |
| `max` | Lower is better | `(target ÷ actual) × 100` | Cost, defect count, TAT |
| `zero` | Zero means success | `actual === 0 → 100%`, else `0%` | Safety incidents, policy violations |
| `timeline` | On-time completion | `actual date ≤ target date → 100%`, else `0%` | Project delivery, milestone dates |

**Engine Safeguards & Logic:**
* **Data Normalisation:** All inputs are normalised before calculation. Numeric strings, whitespace-padded values, and date strings are all handled safely.
* **Error Guarding:** Division-by-zero and `NaN` values are strictly guarded at the engine level to prevent crashes.
* **Over-achievement:** When calculating `min` metrics, if the actual value exceeds the target (`actual > target`), the engine intentionally returns `> 100%` to accurately reflect real performance.
## Installation

## Prerequisites

Node.js 20+,
Supabase Project
,PostgreSQL (via Supabase)

```bash
#1. Clone the Repository
git clone https://github.com/your-org/atomquest-portal.git
cd atomquest-portal
# 2. Install Dependencies

# Install all required packages:

npm install

# Additional modules used in the project:

# Core Framework

npm install next react react-dom typescript

# Supabase

npm install @supabase/supabase-js @supabase/ssr

# UI & Styling

npm install tailwindcss shadcn class-variance-authority clsx tailwind-merge tw-animate-css lucide-react next-themes

# Forms & Validation

npm install react-hook-form @hookform/resolvers zod

# Tables & State Management

npm install @tanstack/react-table zustandCharts

# Charts & Analytics

npm install recharts

# Reports & PDF Export

npm install jspdf

# Development Dependencies

npm install -D eslint eslint-config-next @types/node @types/react @types/react-dom @tailwindcss/postcss

# If dependencies are missing:

rm -rf node_modules package-lock.json
npm install

# 3. Configure Environment Variables

# Create:

cp .env.example .env.local

# Edit .env.local:

# 4. Start Development Server
npm run dev

```
Open:

http://localhost:3000
    
## Environment Variables

NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url

NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

### Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Configure Database


1.Open Supabase and

2.Create a new project

3.Enable Authentication

4.Create database tables

5.Apply SQL schema

6 Seed Demo Data (Optional)

    npm run seed




## Production Deployment

OMP is deployed using **Vercel** with **Supabase PostgreSQL** as the database and **Supabase Authentication** for user management.

### Vercel Setup

1. Import the repository into [Vercel](https://vercel.com/new).
2. Navigate to **Project Settings → Environment Variables**.
3. Add the following environment variables and set them for all deployment environments (Development, Preview, Production):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_production_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
4. Deploy the application

## Demo Credentials

A seeded demo environment is available at the live deployment. Use the following accounts to explore each role:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@company.com` | `Admin@123` |
| **Manager** | `manager1@company.com` | `Manager@123` |
| **Employee** | `employee1@company.com` | `Employee1@123` |

> **Note:** The demo database is read-write. Feel free to create goals, submit check-ins, and explore the full workflow.

## Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **Next.js 16** | Application framework and routing |
| **React 19** | Component-based user interface |
| **TypeScript** | Type safety and scalable development |
| **Tailwind CSS v4** | Responsive UI styling |
| **ShadCN UI** | Reusable UI components |
| **Lucide React** | Icons and visual elements |
| **Next Themes** | Theme management |
| **React Hook Form** | Form handling |
| **TanStack React Table** | Dynamic table rendering |
| **Supabase** | Backend services |
| **PostgreSQL** | Primary relational database |
| **Supabase Authentication** | Authentication and user sessions |
| **Recharts** | Dashboard visualizations |
| **jsPDF** | PDF report generation |
| **Vercel** | Hosting and deployment |
| **ESLint** | Code quality |
| **Git & GitHub** | Version control |
## Authors

- [@Vivek Patel](https://www.github.com/Vivekpatel2007)

