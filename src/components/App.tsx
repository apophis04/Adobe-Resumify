// To support: system="express" scale="medium" color="light"
// import these spectrum web components modules:
import "@spectrum-web-components/theme/express/scale-medium.js";
import "@spectrum-web-components/theme/express/theme-light.js";

// To learn more about using "swc-react" visit:
// https://opensource.adobe.com/spectrum-web-components/using-swc-react/
import { Button } from "@swc-react/button";
import { Theme } from "@swc-react/theme";
import React, { useCallback, useMemo, useState } from "react";
import "./App.css";

import { AddOnSDKAPI } from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";
import ResumeTemplate, { ExportResult } from "./ResumeTemplate";

type Analysis = {
    optimizedResume: string;
    variants: string[];
    atsScore: number;
    topKeywords: string[];
    missingKeywords: string[];
    strengths: string[];
    weakAreas: string[];
    suggestions: string[];
    recruiterNote: string;
    linkedInHeadline: string;
    linkedInAbout: string;
    coverLetter: string;
};

type PremiumState = {
    status: "unknown" | "free" | "premium" | "pending";
    message: string;
    loading: boolean;
};

type InjectionState = {
    status: "idle" | "working" | "done" | "error";
    message: string;
};

type FinalSelection = {
    variantIndex: number;
    text: string;
};

const stopWords = new Set([
    "and",
    "the",
    "with",
    "for",
    "that",
    "from",
    "this",
    "these",
    "those",
    "into",
    "about",
    "your",
    "you",
    "are",
    "was",
    "were",
    "have",
    "has",
    "had",
    "will",
    "shall",
    "should",
    "can",
    "could",
    "may",
    "might",
    "been",
    "being",
    "their",
    "there",
    "than",
    "then",
    "our",
    "out",
    "per",
    "via",
    "on",
    "at",
    "in",
    "to",
    "of",
    "as",
    "by"
]);

const actionVerbs = [
    "Delivered",
    "Implemented",
    "Optimized",
    "Improved",
    "Built",
    "Led",
    "Managed",
    "Launched",
    "Analyzed",
    "Developed",
    "Streamlined",
    "Orchestrated",
    "Elevated"
];

const sectionHeads = [
    "summary",
    "skills",
    "experience",
    "projects",
    "education",
    "certifications"
];

const normalizeWords = (text: string) =>
    text
        .toLowerCase()
        .split(/[^a-z0-9+]+/)
        .filter(Boolean);

const extractKeywords = (jobRole: string, industry: string, jobDescription: string) => {
    const source = `${jobRole} ${industry} ${jobDescription}`;
    const counts: Record<string, number> = {};
    normalizeWords(source).forEach((word) => {
        if (stopWords.has(word) || word.length < 4) {
            return;
        }
        counts[word] = (counts[word] || 0) + 1;
    });

    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([word]) => word)
        .slice(0, 18);
};

const detectSections = (resumeText: string) => {
    const text = resumeText.toLowerCase();
    return sectionHeads.reduce<Record<string, boolean>>((acc, head) => {
        acc[head] = text.includes(head);
        return acc;
    }, {});
};

const rewriteBullets = (lines: string[]) => {
    let verbIndex = 0;
    return lines.map((line) => {
        const clean = line.replace(/^[\-*\u2022]\s*/, "").trim();
        if (!clean) return "";
        const verb = actionVerbs[verbIndex % actionVerbs.length];
        verbIndex += 1;
        return `${verb} ${clean}`.replace(/\.+$/, ".");
    });
};

const formatList = (items: string[]) => items.filter(Boolean).join(", ");

const buildSummary = (jobRole: string, industry: string, usedKeywords: string[]) => {
    const focus = usedKeywords.slice(0, 5);
    if (focus.length === 0) {
        return `${jobRole} professional in ${industry}, focusing on impact, clarity, and ATS alignment.`;
    }
    return `${jobRole} in ${industry} with strengths across ${formatList(focus)}; committed to clear, measurable outcomes and ATS-ready delivery.`;
};

const buildSkills = (resumeWords: Set<string>, usedKeywords: string[]) => {
    const matched = usedKeywords.filter((k) => resumeWords.has(k.toLowerCase()));
    if (matched.length > 0) return formatList(matched);
    const fallbacks = Array.from(resumeWords)
        .filter((w) => w.length > 3)
        .slice(0, 15);
    return formatList(fallbacks);
};

const buildVariants = (base: string, summary: string) => {
    const concise = base.replace("Summary\n" + summary, `Summary\n${summary.replace("with", "focused on")}`);
    const impact = base.replace("Summary\n" + summary, `Summary\n${summary.replace("with", "driving")} Emphasizes measurable delivery.`);
    return [base, concise, impact];
};

const buildOptimizedResume = (
    summary: string,
    skills: string,
    bullets: string[],
    remainingLines: string[],
    sections: Record<string, boolean>
) => {
    const experienceBody = bullets.length > 0 ? bullets.map((b) => `- ${b}`).join("\n") : "- Retain original experience details and align wording to role.";
    const education = sections.education ? "Education\n- Keep education details unchanged." : "";
    const certifications = sections.certifications ? "Certifications\n- Keep certification titles accurate." : "";
    const extras = remainingLines.length > 0 ? `Additional Details\n- ${remainingLines.join("\n- ")}` : "";

    return [
        `Summary\n${summary}`,
        `Skills\n${skills || "Prioritize role-aligned technical and domain skills."}`,
        `Experience\n${experienceBody}`,
        sections.projects ? "Projects\n- Keep project outcomes concise and quantifiable." : "",
        education,
        certifications,
        extras
    ]
        .filter(Boolean)
        .join("\n\n");
};

const scoreResume = (usedKeywords: string[], missingKeywords: string[], sections: Record<string, boolean>) => {
    let score = 55 + usedKeywords.length * 2 - missingKeywords.length;
    if (sections.summary) score += 5;
    if (sections.skills) score += 5;
    if (sections.experience) score += 8;
    if (sections.education) score += 4;
    if (sections.projects) score += 3;
    return Math.max(0, Math.min(100, Math.round(score)));
};

const buildRecruiterNote = (usedKeywords: string[], missingKeywords: string[]) => {
    const hits = usedKeywords.slice(0, 5).join(", ");
    const gaps = missingKeywords.slice(0, 5).join(", ");
    return `Highlights: ${hits || "core role terms present"}. Gaps: ${gaps || "no major keyword gaps"}.`;
};

const buildLinkedIn = (jobRole: string, industry: string, usedKeywords: string[]) => {
    const headKeywords = usedKeywords.slice(0, 3).join(" | ");
    const headline = [jobRole, industry, headKeywords].filter(Boolean).join(" | ");
    const about = `Focused on ${jobRole} in ${industry}. Experienced in ${formatList(usedKeywords.slice(0, 6))}. Open to roles that reward clarity, measurable outcomes, and collaboration.`;
    return { headline, about };
};

const buildCoverLetter = (jobRole: string, industry: string, usedKeywords: string[], resumeText: string) => {
    const opener = `I am interested in the ${jobRole} role in ${industry}.`;
    const body = usedKeywords.length > 0
        ? `My background includes work with ${formatList(usedKeywords.slice(0, 6))}, and I focus on aligning delivery to role goals without overstating achievements.`
        : "My background aligns with the posted requirements, and I focus on clear outcomes without overstating achievements.";
    const closing = "Thank you for your time; I welcome a conversation to confirm fit.";
    return [opener, body, "I will keep all stated experience consistent with my resume.", closing].join("\n\n");
};

const App = ({ addOnUISdk }: { addOnUISdk: AddOnSDKAPI }) => {
    const [resumeText, setResumeText] = useState("");
    const [fullName, setFullName] = useState("");
    const [titleText, setTitleText] = useState("");
    const [contactEmail, setContactEmail] = useState("");
    const [contactWebsite, setContactWebsite] = useState("");
    const [jobRole, setJobRole] = useState("");
    const [industry, setIndustry] = useState("");
    const [jobDescription, setJobDescription] = useState("");
    const [analysis, setAnalysis] = useState<Analysis | null>(null);
    const [enhancing, setEnhancing] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [enhanceMessage, setEnhanceMessage] = useState("");
    const [reading, setReading] = useState(false);
    const [resumeInsights, setResumeInsights] = useState("");
    const [exportFns, setExportFns] = useState<{ copyPNG: () => Promise<ExportResult>; downloadPNG: () => Promise<ExportResult>; downloadSVG: () => ExportResult; getPNGBlob: () => Promise<Blob | null> } | null>(null);
    const [exportPreviewUrl, setExportPreviewUrl] = useState<string>("");
    const [exportError, setExportError] = useState<string>("");

    const handleExportReady = useCallback((fns: { copyPNG: () => Promise<ExportResult>; downloadPNG: () => Promise<ExportResult>; downloadSVG: () => ExportResult; getPNGBlob: () => Promise<Blob | null> }) => {
        setExportFns(fns);
    }, []);

    const resumeWords = useMemo(() => new Set(normalizeWords(resumeText)), [resumeText]);

    const handleFileUpload = async (file?: File | null) => {
        if (!file) return;
        try {
            setReading(true);
            setResumeInsights("Analyzing resume...");
            const formData = new FormData();
            formData.append("resume", file);
            const response = await fetch("http://localhost:5000/api/resume/analyze", {
                method: "POST",
                body: formData
            });
            if (!response.ok) {
                const errText = await response.text();
                throw new Error(errText || "Backend analysis failed");
            }
            const data = await response.json();
            setResumeInsights(data.insights || "No insights generated");
            setResumeText(data.extracted_text || "[Resume analyzed - ready to generate variants]");
        } catch (err: any) {
            console.error("Resume analysis error", err);
            setResumeInsights(`Error: ${err?.message || "Unable to analyze resume"}`);
        } finally {
            setReading(false);
        }
    };

    const handleEnhanceWithOpenAI = async () => {
        if (!resumeText) return;
        setEnhancing(true);
        setEnhanceMessage("Processing...");
        try {
            const response = await fetch("http://localhost:5000/api/resume/enhance", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    resume_text: resumeText,
                    job_role: jobRole,
                    industry: industry,
                    job_description: jobDescription
                })
            });
            if (!response.ok) {
                const errText = await response.text();
                const errJson = JSON.parse(errText);
                const errMsg = errJson?.error || "Enhancement failed";
                throw new Error(errMsg);
            }
            const data = await response.json();
            const content = data?.enhanced_text || "";
            if (content) {
                setResumeText(content.trim());
                setEnhanceMessage("Resume enhanced successfully!");
            } else {
                setEnhanceMessage("No response from backend");
            }
        } catch (err: any) {
            console.error("Enhancement error", err);
            setEnhanceMessage(`Error: ${err?.message || "Unable to enhance. Check backend."}`);
        } finally {
            setEnhancing(false);
        }
    };

    const handleCopyToClipboard = async (text: string, index: number) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000);
        } catch (error) {
            console.error("Failed to copy:", error);
            alert("Failed to copy to clipboard");
        }
    };

    const handleOptimize = () => {
        if (!resumeText || !jobRole || !industry) return;

        const keywords = extractKeywords(jobRole, industry, jobDescription);
        const usedKeywords = keywords.filter((k) => resumeWords.has(k.toLowerCase()));
        const missingKeywords = keywords.filter((k) => !resumeWords.has(k.toLowerCase()));
        const sections = detectSections(resumeText);
        const lines = resumeText
            .split(/\r?\n/)
            .map((l) => l.trim())
            .filter(Boolean);
        const bulletLines = lines.filter((l) => /^[\-*\u2022]/.test(l));
        const otherLines = lines.filter((l) => !/^[\-*\u2022]/.test(l));
        const rewrittenBullets = rewriteBullets(bulletLines);
        const summary = buildSummary(jobRole, industry, usedKeywords);
        const skills = buildSkills(resumeWords, usedKeywords);
        const optimizedResume = buildOptimizedResume(summary, skills, rewrittenBullets, otherLines.slice(0, 8), sections);
        const variants = buildVariants(optimizedResume, summary);
        const atsScore = scoreResume(usedKeywords, missingKeywords, sections);
        const recruiterNote = buildRecruiterNote(usedKeywords, missingKeywords);
        const { headline, about } = buildLinkedIn(jobRole, industry, usedKeywords);
        const coverLetter = buildCoverLetter(jobRole, industry, usedKeywords, resumeText);

        const strengths: string[] = [
            usedKeywords.length > 0 ? "Relevant keywords present" : "Resume ready for keyword infusion",
            sections.experience ? "Experience section detected" : "Add clear Experience section",
            "Clean single-column text layout"
        ];

        const weakAreas: string[] = [];
        if (missingKeywords.length > 0) weakAreas.push("Add job-specific keywords naturally");
        if (!sections.summary) weakAreas.push("Add a targeted summary");
        if (!sections.skills) weakAreas.push("List role-aligned skills");

        const suggestions = [
            "Mirror job title in summary",
            "Reuse keywords in Skills and top bullets",
            "Keep bullets action-led; one line each",
            "Avoid tables or graphics; keep ATS-safe"
        ];

        setAnalysis({
            optimizedResume,
            variants,
            atsScore,
            topKeywords: usedKeywords,
            missingKeywords,
            strengths,
            weakAreas,
            suggestions,
            recruiterNote,
            linkedInHeadline: headline,
            linkedInAbout: about,
            coverLetter
        });
    };

    const parseOptimizedToSections = (text: string) => {
        const out: { summary?: string; skills?: string[]; experience?: string[]; education?: string[] } = {};
        const blocks = text.split(/\n\n+/);
        for (const block of blocks) {
            const [head, ...rest] = block.split(/\n/);
            const body = rest.join("\n");
            const key = head.trim().toLowerCase();
            if (key.includes("summary")) out.summary = body.trim();
            else if (key.includes("skills")) out.skills = listFromCSVLike(body);
            else if (key.includes("experience")) out.experience = splitBullets(body);
            else if (key.includes("education")) out.education = splitLinesLike(body);
        }
        return out;
    };

    const listFromCSVLike = (text: string) =>
        text
            .split(/\n/)
            .flatMap((l) => l.split(/\s*,\s*/))
            .map((t) => t.replace(/^[-*]\s*/, "").trim())
            .filter(Boolean);

    const splitBullets = (text: string) =>
        text
            .split(/\n/)
            .map((t) => t.replace(/^[-*]\s*/, "- ").trim())
            .filter(Boolean);

    const splitLinesLike = (text: string) => text.split(/\n/).map((t) => t.trim()).filter(Boolean);

    return (
        <Theme system="express" scale="medium" color="light">
            <div className="page">
                <header className="hero">
                    <div>
                        <p className="eyebrow">Premium · ATS-ready</p>
                        <h1>Resume Optimization Add-on</h1>
                        <p className="lede">
                            Upload resume text, set the target role and industry, and generate ATS-aligned variants ready to edit in Express.
                        </p>
                    </div>
                    <div className="badge">GPT-5.1-Codex-Max</div>
                </header>

                <section className="grid">
                    <div className="card">
                        <h2>Inputs</h2>

                        <div className="row">
                            <div className="field">
                                <label className="label">Your full name</label>
                                <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g., Divya Gupta" />
                            </div>
                            <div className="field">
                                <label className="label">Professional title</label>
                                <input className="input" value={titleText} onChange={(e) => setTitleText(e.target.value)} placeholder="e.g., Copywriter" />
                            </div>
                        </div>

                        <div className="row">
                            <div className="field">
                                <label className="label">Contact email</label>
                                <input className="input" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="e.g., name@website.com" />
                            </div>
                            <div className="field">
                                <label className="label">Website</label>
                                <input className="input" value={contactWebsite} onChange={(e) => setContactWebsite(e.target.value)} placeholder="e.g., www.myportfolio.com" />
                            </div>
                        </div>

                        <div className="row">
                            <div className="field">
                                <label className="label">Upload resume (PDF)</label>
                                <input
                                    className="input"
                                    type="file"
                                    accept=".pdf"
                                    onChange={(e) => handleFileUpload(e.target.files?.[0])}
                                />
                                <p className="hint">Extract text from PDF resume for enhancement.</p>
                                {resumeInsights && (
                                    <div className={`panel resume-insights ${reading ? "loading" : ""}`}>
                                        <p className="label">Resume Analysis</p>
                                        <pre>{resumeInsights}</pre>
                                    </div>
                                )}
                            </div>
                        </div>

                        <label className="label">OR paste resume text directly</label>
                        <textarea
                            className="textarea"
                            value={resumeText}
                            onChange={(e) => setResumeText(e.target.value)}
                            rows={8}
                            placeholder="Paste your resume text here as an alternative to uploading a PDF..."
                        />
                        <p className="hint">You can either upload a PDF above or paste text directly here.</p>

                        <div className="row">
                            <div className="field">
                                <label className="label">Target job role</label>
                                <input
                                    className="input"
                                    value={jobRole}
                                    onChange={(e) => setJobRole(e.target.value)}
                                    placeholder="e.g., Senior Product Manager"
                                />
                            </div>
                            <div className="field">
                                <label className="label">Industry</label>
                                <input
                                    className="input"
                                    value={industry}
                                    onChange={(e) => setIndustry(e.target.value)}
                                    placeholder="e.g., SaaS / Fintech"
                                />
                            </div>
                        </div>

                        <label className="label">Job description (optional)</label>
                        <textarea
                            className="textarea"
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            rows={6}
                            placeholder="Paste the JD to align keywords and bullets."
                        />

                        <div className="actions">
                            <Button
                                variant="accent"
                                size="l"
                                onClick={handleOptimize}
                                disabled={!resumeText || !jobRole || !industry}
                            >
                                Generate ATS-Ready Resume
                            </Button>
                            <p className="hint">No tables, icons, or columns. All outputs remain fully editable.</p>
                        </div>
                    </div>

                    <div className="card results">
                        <div className="header-row">
                            <h2>Outputs</h2>
                            <div className="header-actions">
                                <div className="score" aria-live="polite">
                                    <span>ATS Score</span>
                                    <strong>{analysis ? `${analysis.atsScore}/100` : "--"}</strong>
                                </div>
                            </div>
                        </div>

                        {analysis ? (
                            <div className="outputs">
                                <div className="pill-row">
                                    <div className="pill">Top keywords: {analysis.topKeywords.slice(0, 8).join(", ") || "pending"}</div>
                                    <div className="pill warning">Missing: {analysis.missingKeywords.slice(0, 6).join(", ") || "none"}</div>
                                </div>

                                <div className="stack">
                                    {analysis.variants.map((variant, idx) => (
                                        <article
                                            key={idx}
                                            className="panel"
                                        >
                                            <div className="panel-head">
                                                <h3>Resume Variant {idx + 1}</h3>
                                                <span className="tag">Editable</span>
                                            </div>
                                            <pre>{variant}</pre>
                                            <div className="panel-actions">
                                                <Button
                                                    size="s"
                                                    variant={copiedIndex === idx ? "accent" : "primary"}
                                                    onClick={() => handleCopyToClipboard(variant, idx)}
                                                >
                                                    {copiedIndex === idx ? "✓ Copied" : "Copy to Clipboard"}
                                                </Button>
                                            </div>
                                        </article>
                                    ))}
                                </div>

                                <article className="panel">
                                    <div className="panel-head">
                                        <h3>Cover Letter (optional)</h3>
                                        <span className="tag">Plain text</span>
                                    </div>
                                    <pre>{analysis.coverLetter}</pre>
                                </article>

                                <article className="panel">
                                    <div className="panel-head">
                                        <h3>LinkedIn</h3>
                                        <span className="tag">Headline + About</span>
                                    </div>
                                    <pre>{`${analysis.linkedInHeadline}

${analysis.linkedInAbout}`}</pre>
                                </article>

                                <div className="split">
                                    <div className="panel">
                                        <div className="panel-head">
                                            <h3>Strengths</h3>
                                        </div>
                                        <ul>
                                            {analysis.strengths.map((item, i) => (
                                                <li key={i}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="panel">
                                        <div className="panel-head">
                                            <h3>Weak Areas</h3>
                                        </div>
                                        <ul>
                                            {(analysis.weakAreas.length ? analysis.weakAreas : ["None flagged; ensure facts stay accurate."]).map((item, i) => (
                                                <li key={i}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                <article className="panel">
                                    <div className="panel-head">
                                        <h3>Suggestions</h3>
                                        <span className="tag">ATS guidance</span>
                                    </div>
                                    <ul>
                                        {analysis.suggestions.map((item, i) => (
                                            <li key={i}>{item}</li>
                                        ))}
                                    </ul>
                                    <p className="note">Recruiter note: {analysis.recruiterNote}</p>
                                </article>

                                <article className="panel">
                                    <div className="panel-head">
                                        <h3>Template Preview</h3>
                                        <span className="tag">SVG · two-column</span>
                                    </div>
                                    <div className="template-preview">
                                        <ResumeTemplate
                                            name={fullName || "Your Name"}
                                            title={titleText || jobRole || "Your Title"}
                                            contactLeft={contactEmail}
                                            contactRight={contactWebsite}
                                            sections={parseOptimizedToSections(analysis.optimizedResume)}
                                            onExportReady={handleExportReady}
                                        />
                                    </div>
                                    <div className="panel-actions">
                                        <Button size="s" variant="primary" disabled={!exportFns} onClick={async () => {
                                            setExportError("");
                                            if (!exportFns) return;
                                            const result = await exportFns.copyPNG();
                                            if (!result.success) {
                                                setExportError(result.message || "Clipboard blocked by browser. Use PNG download.");
                                            }
                                        }}>Copy PNG to Clipboard</Button>
                                        <Button size="s" variant="secondary" disabled={!exportFns} onClick={async () => {
                                            setExportError("");
                                            if (!exportFns) return;
                                            const result = await exportFns.downloadPNG();
                                            if (!result.success) {
                                                setExportError(result.message || "Download may be blocked; use Preview PNG below.");
                                            }
                                        }}>Download PNG</Button>
                                        <Button size="s" variant="secondary" disabled={!exportFns} onClick={() => {
                                            setExportError("");
                                            if (!exportFns) return;
                                            const result = exportFns.downloadSVG();
                                            if (!result.success) {
                                                setExportError(result.message || "SVG download blocked; use Preview PNG below.");
                                            }
                                        }}>Download SVG</Button>
                                    </div>
                                    <div className="actions tight">
                                        <Button size="s" variant="secondary" disabled={!exportFns} onClick={async () => {
                                            setExportError("");
                                            setExportPreviewUrl("");
                                            const blob = await exportFns?.getPNGBlob();
                                            if (!blob) {
                                                setExportError("Unable to render PNG preview.");
                                                return;
                                            }
                                            const url = URL.createObjectURL(blob);
                                            setExportPreviewUrl(url);
                                        }}>Preview PNG</Button>
                                        {exportError && (<p className="hint error-text">{exportError}</p>)}
                                    </div>
                                    {exportPreviewUrl && (
                                        <div className="panel" style={{ marginTop: 8 }}>
                                            <div className="panel-head"><h3>PNG Preview</h3><span className="tag">Right-click to save</span></div>
                                            <img src={exportPreviewUrl} alt="Resume PNG preview" style={{ width: "100%", height: "auto", borderRadius: 6, border: "1px solid #eee" }} />
                                            <div className="panel-actions">
                                                <a href={exportPreviewUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12 }}>Open in new tab</a>
                                            </div>
                                        </div>
                                    )}
                                    <p className="hint">If your browser blocks image clipboard, use Download PNG and upload it in Express.</p>
                                </article>
                            </div>
                        ) : (
                            <div className="placeholder">
                                <p>Provide the resume text, job role, and industry to generate ATS-ready variants, missing keywords, and cover letter.</p>
                                <ul>
                                    <li>Never fabricates experience or credentials.</li>
                                    <li>Keeps output single-column and text-only.</li>
                                    <li>Highlights missing keywords to weave in.</li>
                                    <li>Returns 2-3 variants plus ATS score.</li>
                                </ul>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </Theme>
    );
};

export default App;
