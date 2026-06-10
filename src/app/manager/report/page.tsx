"use client";

import {
  useEffect,
  useState,
} from "react";

import { jsPDF } from "jspdf";

import {
  getManagerReportData,
} from "@/services/reportservice";

export default function ManagerReportPage() {
  const [data,
    setData] =
    useState<any>(
      null
    );

  useEffect(() => {
    async function load() {
      const res =
        await getManagerReportData();

      setData(res);
    }

    load();
  }, []);

  function exportPDF() {
    const pdf =
      new jsPDF();

    pdf.text(
      "Manager Report",
      20,
      20
    );

    let y =
      40;

    data.sheets.forEach(
      (
        sheet: any,
        index: number
      ) => {
        pdf.text(
          `Sheet ${
            index +
            1
          }: ${
            sheet.submission_status
          }`,
          20,
          y
        );

        y +=
          10;
      }
    );

    pdf.save(
      "manager-report.pdf"
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
        Manager Report
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