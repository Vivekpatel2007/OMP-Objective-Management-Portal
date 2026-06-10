"use client";

import {
  useEffect,
  useState,
} from "react";

import { jsPDF } from "jspdf";

import {
  getAdminReportData,
} from "@/services/reportservice";

export default function AdminReportPage() {
  const [data,
    setData] =
    useState<any>(
      null
    );

  useEffect(() => {
    async function load() {
      const res =
        await getAdminReportData();

      setData(res);
    }

    load();
  }, []);

  function exportPDF() {
    const pdf =
      new jsPDF();

    pdf.text(
      "Organization Report",
      20,
      20
    );

    pdf.text(
      `Employees: ${
        data
          .employees
          ?.length
      }`,
      20,
      50
    );

    pdf.text(
      `Goal Sheets: ${
        data
          .sheets
          ?.length
      }`,
      20,
      70
    );

    pdf.text(
      `Goals: ${
        data
          .goals
          ?.length
      }`,
      20,
      90
    );

    pdf.save(
      "admin-report.pdf"
    );
  }

  if (!data)
    return (
      <div className="p-6">
        Loading...
      </div>
    );

  return (
    <div className="p-6">

      <h1 className="mb-8 text-3xl font-bold">
        Admin Report
      </h1>

      <button
        onClick={
          exportPDF
        }
        className="rounded bg-black px-5 py-2 text-white"
      >
        Export PDF
      </button>

    </div>
  );
}