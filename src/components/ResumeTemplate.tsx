import React, { useEffect, useMemo, useRef, useState } from "react";

type ResumeSections = {
  summary?: string;
  skills?: string[];
  experience?: string[];
  education?: string[];
};

export type ExportResult = { success: boolean; message?: string };

export type ResumeTemplateProps = {
  name: string;
  title: string;
  contactLeft?: string; // e.g., email
  contactRight?: string; // e.g., website
  sections: ResumeSections;
  width?: number; // px
  height?: number; // px
  onExportReady?: (exportFns: {
    copyPNG: () => Promise<ExportResult>;
    downloadPNG: () => Promise<ExportResult>;
    downloadSVG: () => ExportResult;
    getPNGBlob: () => Promise<Blob | null>;
  }) => void;
};

// Utility: convert current SVG to PNG blob
const svgToPngBlob = async (svg: SVGSVGElement, width: number, height: number): Promise<Blob> => {
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svg);
  const svgBlob = new Blob([svgString], { type: "image/svg+xml" });
  const url = URL.createObjectURL(svgBlob);
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = (e) => reject(e);
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to create PNG blob"));
      }, "image/png", 0.92);
    });
  } finally {
    URL.revokeObjectURL(url);
  }
};

// Utility: attempt to copy PNG to clipboard
const copyPngToClipboard = async (blob: Blob): Promise<{ success: boolean; message?: string }> => {
  try {
    // ClipboardItem is not available in all contexts
    // @ts-ignore
    const item = new ClipboardItem({ "image/png": blob });
    await navigator.clipboard.write([item]);
    return { success: true, message: "Copied to clipboard!" };
  } catch (err) {
    const errorMsg = (err as Error).message || "";
    // Adobe Express iframe blocks clipboard API for security
    if (errorMsg.includes("permissions policy") || errorMsg.includes("Permissions-Policy")) {
      return { success: false, message: "Clipboard blocked by Adobe Express sandbox. Use Download instead." };
    }
    return { success: false, message: "Failed to copy. Please use Download instead." };
  }
};

const splitLines = (text?: string) => (text || "")
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter(Boolean);

const listFromCSV = (text?: string) => splitLines(text).flatMap((l) => l.split(/\s*,\s*/)).filter(Boolean);

export const ResumeTemplate: React.FC<ResumeTemplateProps> = ({
  name,
  title,
  contactLeft,
  contactRight,
  sections,
  width = 850,
  height = 1100,
  onExportReady
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [exporting, setExporting] = useState(false);

  const skills = useMemo(() => sections.skills || [], [sections.skills]);
  const experience = useMemo(() => sections.experience || [], [sections.experience]);
  const education = useMemo(() => sections.education || [], [sections.education]);

  useEffect(() => {
    if (!onExportReady) return;
    const makeFns = () => ({
      copyPNG: async () => {
        if (!svgRef.current) return { success: false, message: "No resume template found" };
        setExporting(true);
        try {
          const blob = await svgToPngBlob(svgRef.current, width, height);
          const result = await copyPngToClipboard(blob);
          return result;
        } catch (err) {
          return { success: false, message: (err as Error).message || "Failed to copy" };
        } finally {
          setExporting(false);
        }
      },
      downloadPNG: async () => {
        if (!svgRef.current) return { success: false, message: "No resume template found" };
        setExporting(true);
        try {
          const blob = await svgToPngBlob(svgRef.current, width, height);
          const url = URL.createObjectURL(blob);
          // Try download attribute first
          const a = document.createElement("a");
          a.href = url;
          a.download = "resume-template.png";
          a.rel = "noopener";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          // Fallback: open in new tab if download is blocked
          try {
            // Some sandboxed iframes block file downloads; opening a tab helps users save manually
            window.open(url, "_blank", "noopener,noreferrer");
            return { success: true, message: "Download started. Check your downloads folder." };
          } catch (popupErr) {
            const errMsg = (popupErr as Error).message || "";
            // Adobe Express iframe blocks popups for security
            if (errMsg.includes("allow-popups") || errMsg.includes("sandboxed")) {
              return { success: false, message: "Popups blocked by Adobe Express. The download may still be processed." };
            }
            return { success: true, message: "Download initiated (check your downloads folder)." };
          }
        } catch (err) {
          return { success: false, message: (err as Error).message || "Failed to download PNG" };
        } finally {
          setExporting(false);
          setTimeout(() => { /* cleanup blob URLs */ }, 2000);
        }
      },
      downloadSVG: () => {
        if (!svgRef.current) return { success: false, message: "No resume template found" };
        try {
          const serializer = new XMLSerializer();
          const svgString = serializer.serializeToString(svgRef.current);
          const blob = new Blob([svgString], { type: "image/svg+xml" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "resume-template.svg";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          try {
            window.open(url, "_blank", "noopener,noreferrer");
            return { success: true, message: "Download started. Check your downloads folder." };
          } catch (popupErr) {
            return { success: true, message: "Download initiated (check your downloads folder)." };
          }
        } catch (err) {
          return { success: false, message: (err as Error).message || "Failed to download SVG" };
        }
      },
      getPNGBlob: async () => {
        if (!svgRef.current) return null;
        try {
          const blob = await svgToPngBlob(svgRef.current, width, height);
          return blob;
        } catch (err) {
          console.error("Failed to generate PNG blob:", err);
          return null;
        }
      }
    });
    onExportReady(makeFns());
  }, [onExportReady, width, height]);

  // Layout constants matching the provided template feel
  const margin = 40;
  const colGap = 30;
  const leftColWidth = 280; // left column like template
  const rightColWidth = width - margin * 2 - leftColWidth - colGap;

  // Typography
  const fontFamily = "-apple-system, Segoe UI, Helvetica, Arial, sans-serif";

  return (
    <div className="resume-svg-wrapper" aria-busy={exporting} style={{ width: "100%", maxHeight: "100%", overflow: "hidden", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ background: "#fff", borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", maxWidth: "100%", maxHeight: "100%", overflow: "hidden" }}
      >
        <defs>
          <style>{`
            .h1 { font: 700 44px ${fontFamily}; fill: #111; overflow: hidden; text-overflow: ellipsis; }
            .h2 { font: 700 22px ${fontFamily}; fill: #111; letter-spacing: 0.3px; }
            .eyebrow { font: 700 16px ${fontFamily}; fill: #333; text-transform: uppercase; }
            .label { font: 600 15px ${fontFamily}; fill: #000; }
            .text { font: 400 14px ${fontFamily}; fill: #222; overflow: hidden; text-overflow: ellipsis; }
            .muted { font: 400 13px ${fontFamily}; fill: #666; overflow: hidden; text-overflow: ellipsis; }
            .rule { stroke: #222; stroke-width: 2; }
            .rule-thin { stroke: #bbb; stroke-width: 1; }
            .bullet { font: 400 14px ${fontFamily}; fill: #222; overflow: hidden; text-overflow: ellipsis; }
          `}</style>
        </defs>

        {/* Header */}
        <g transform={`translate(${margin}, ${margin})`}>
          <text className="h1" x={0} y={0} dominantBaseline="hanging">{name || "Your Name"}</text>
          <text className="eyebrow" x={0} y={60} dominantBaseline="hanging">{title || "Your Title"}</text>
          {/* Right-aligned contact */}
          <text className="muted" x={width - margin * 2} y={18} textAnchor="end">{contactLeft || "email@example.com"}</text>
          <text className="muted" x={width - margin * 2} y={40} textAnchor="end">{contactRight || "www.example.com"}</text>
          <line className="rule" x1={0} x2={width - margin * 2} y1={84} y2={84} />
        </g>

        {/* Columns */}
        <g transform={`translate(${margin}, ${margin + 110})`}>
          {/* Left column */}
          <g>
            {/* About */}
            <text className="h2" x={0} y={0} dominantBaseline="hanging">about</text>
            <line className="rule" x1={0} x2={leftColWidth} y1={26} y2={26} />
            {splitLines(sections.summary).slice(0, 14).map((line, i) => (
              <text key={i} className="text" x={0} y={48 + i * 20}>{line}</text>
            ))}

            {/* Skills */}
            <text className="h2" x={0} y={365} dominantBaseline="hanging">skills</text>
            <line className="rule" x1={0} x2={leftColWidth} y1={391} y2={391} />
            {skills.slice(0, 12).map((skill, i) => (
              <text key={i} className="text" x={0} y={413 + i * 20}>{skill}</text>
            ))}

            {/* Education */}
            <text className="h2" x={0} y={720} dominantBaseline="hanging">education</text>
            <line className="rule" x1={0} x2={leftColWidth} y1={746} y2={746} />
            {(education.length ? education : [
              "Your University, Years",
              "Degree and minors",
              "Relevant GPA or honors"
            ]).slice(0, 8).map((line, i) => (
              <text key={i} className="text" x={0} y={768 + i * 20}>{line}</text>
            ))}
          </g>

          {/* Right column */}
          <g transform={`translate(${leftColWidth + colGap}, 0)`}>
            <text className="h2" x={0} y={0} dominantBaseline="hanging">work experience</text>
            <line className="rule" x1={0} x2={rightColWidth} y1={26} y2={26} />

            {experience.slice(0, 18).map((line, i) => (
              <text key={i} className="bullet" x={0} y={48 + i * 20}>{line.replace(/^[-*]\s*/, "• ")}</text>
            ))}

            {/* Footer separators */}
            <line className="rule-thin" x1={0} x2={rightColWidth} y1={660} y2={660} />
            <text className="muted" x={0} y={680}>References available upon request</text>
            <text className="muted" x={rightColWidth} y={680} textAnchor="end">Thank you for your time!</text>
          </g>
        </g>
      </svg>
    </div>
  );
};

export default ResumeTemplate;
