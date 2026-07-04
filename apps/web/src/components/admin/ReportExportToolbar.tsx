"use client";

import { useState } from "react";
import { Download, Printer } from "lucide-react";

interface Props {
  targetId: string;
  filename: string;
  printUrl?: string;
}

export function ReportExportToolbar({ targetId, filename, printUrl }: Props) {
  const [downloading, setDownloading] = useState(false);

  function handlePrint() {
    if (printUrl) {
      window.open(printUrl, "_blank");
      return;
    }
    window.print();
  }

  async function handleDownloadPdf() {
    setDownloading(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const el = document.getElementById(targetId);
      if (!el) return;
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, logging: false });
      const img = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pageW / canvas.width, pageH / canvas.height);
      const w = canvas.width * ratio;
      const h = canvas.height * ratio;
      pdf.addImage(img, "PNG", (pageW - w) / 2, 10, w, h);
      pdf.save(filename);
    } catch (err) {
      console.error("PDF export failed:", err);
      window.print();
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex gap-2 print:hidden">
      <button
        type="button"
        onClick={handlePrint}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 hover:bg-slate-50"
      >
        <Printer className="h-3.5 w-3.5" />
        Print / Save PDF
      </button>
      <button
        type="button"
        onClick={handleDownloadPdf}
        disabled={downloading}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#4C3BCF] text-white hover:bg-[#3d2fb8] disabled:opacity-50"
      >
        <Download className="h-3.5 w-3.5" />
        {downloading ? "Generating…" : "Download PDF"}
      </button>
    </div>
  );
}
