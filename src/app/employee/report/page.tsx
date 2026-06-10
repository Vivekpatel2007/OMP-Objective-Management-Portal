"use client";

import { useEffect, useState } from "react";

import { jsPDF } from "jspdf";

import {
  getEmployeeReportData,
} from "@/services/reportservice";

export default function EmployeeReportPage() {
  const [data, setData] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function load() {
      try {
        const response =
          await getEmployeeReportData();

        console.log(
          "REPORT DATA",
          response
        );

        setData(
          response
        );
      } catch (
        err
      ) {
        console.log(
          err
        );
      }

      setLoading(
        false
      );
    }

    load();
  }, []);

  function exportPDF() {
    if (!data)
      return;

    const pdf =
      new jsPDF();

    pdf.setFontSize(
      20
    );

    pdf.text(
      "Employee Report",
      20,
      20
    );

    pdf.setFontSize(
      12
    );

    pdf.text(
      `Name: ${
        data
          ?.profile
          ?.full_name ||
        "-"
      }`,
      20,
      50
    );

    pdf.text(
      `Department: ${
        data
          ?.profile
          ?.department ||
        "-"
      }`,
      20,
      65
    );

    pdf.text(
      `Employee Rating: ${
        data
          ?.goalSheet
          ?.employee_rating ||
        "-"
      }`,
      20,
      80
    );

    pdf.text(
      `Manager Rating: ${
        data
          ?.goalSheet
          ?.manager_rating ||
        "-"
      }`,
      20,
      95
    );

    let y =
      120;

    pdf.text(
      "Goals",
      20,
      y
    );

    y += 15;

    data?.goals?.forEach(
      (
        goal: any
      ) => {
        pdf.text(
          `${goal.title}`,
          20,
          y
        );

        y += 10;

        pdf.text(
          `Progress ${
            goal.progress ||
            0
          }%`,
          30,
          y
        );

        y += 15;
      }
    );

    pdf.save(
      "employee-report.pdf"
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        Loading report...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">

        <h1 className="text-3xl font-bold">
          Employee Report
        </h1>

        <div className="mt-6 rounded border p-6">
          No report data found
        </div>

      </div>
    );
  }

  return (
    <div className="p-6">

      <h1 className="mb-8 text-3xl font-bold">
        Employee Report
      </h1>

      <div className="rounded border p-6">

        <p>
          Name:
          {" "}
          {
            data
              ?.profile
              ?.full_name ||
            "-"
          }
        </p>

        <p>
          Department:
          {" "}
          {
            data
              ?.profile
              ?.department ||
            "-"
          }
        </p>

        <p>
          Goals:
          {" "}
          {
            data
              ?.goals
              ?.length ||
            0
          }
        </p>

      </div>

      <button
        onClick={
          exportPDF
        }
        className="mt-6 rounded bg-black px-5 py-2 text-white"
      >
        Export PDF
      </button>

    </div>
  );
}