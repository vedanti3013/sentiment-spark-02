import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Download, FileSpreadsheet, MinusCircle, Search, TrendingDown, UploadCloud, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { AppHeader } from "@/components/ui/app-header";
import { Button } from "@/components/ui/button";
import { ModelSelect } from "@/components/ui/model-select";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/batch-upload")({
  head: () => ({ meta: [
    { title: "Batch Upload — भावSense" },
    { name: "description", content: "Upload CSV or XLSX files and analyze Hindi review sentiment in batches." },
    { property: "og:title", content: "Batch Upload — भावSense" },
    { property: "og:description", content: "Batch Hindi sentiment analysis with charts, filters, and CSV export." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: BatchUpload,
});

type SheetRow = Record<string, string>;
type Sentiment = "Positive" | "Neutral" | "Negative";
type ResultRow = { id: number; review: string; product: string; sentiment: Sentiment; confidence: number };

const sentimentMeta = {
  Positive: { label: "Positive · सकारात्मक", icon: CheckCircle2, className: "text-positive bg-positive/10 border-positive", color: "var(--positive)" },
  Neutral: { label: "Neutral · तटस्थ", icon: MinusCircle, className: "text-neutral bg-neutral/10 border-neutral", color: "var(--neutral)" },
  Negative: { label: "Negative · नकारात्मक", icon: TrendingDown, className: "text-negative bg-negative/10 border-negative", color: "var(--negative)" },
} as const;

function escapeCsv(value: string | number) { return `"${String(value).replaceAll('"', '""')}"`; }
function download(name: string, content: string) {
  const href = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a"); link.href = href; link.download = name; link.click(); URL.revokeObjectURL(href);
}

const API_BASE = "http://127.0.0.1:8000";

async function predictReview(
  review: string,
  model: string
): Promise<Pick<ResultRow, "sentiment" | "confidence">> {
  const response = await fetch(`${API_BASE}/api/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: review,
      model,
    }),
  });

  if (!response.ok) {
    throw new Error(`Prediction failed: ${response.status}`);
  }

  const data = await response.json();

  const sentimentMap: Record<string, Sentiment> = {
    positive: "Positive",
    neutral: "Neutral",
    negative: "Negative",
  };

  const sentiment = sentimentMap[String(data.prediction).toLowerCase()];

  if (!sentiment || typeof data.confidence !== "number") {
    throw new Error("Unexpected prediction response from backend.");
  }

  return {
    sentiment,
    confidence: data.confidence,
  };
}

function BatchUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<SheetRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [reviewColumn, setReviewColumn] = useState("");
  const [productColumn, setProductColumn] = useState("");
  const [model, setModel] = useState("Naive Bayes");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [filter, setFilter] = useState<"All" | Sentiment>("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [expanded, setExpanded] = useState<number | null>(null);

  const readFile = async (file?: File) => {
    if (!file) return;
    if (!/\.(csv|xlsx)$/i.test(file.name) || file.size > 10 * 1024 * 1024) { setError("Invalid file · केवल CSV/XLSX, maximum 10 MB."); return; }
    try {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const first = workbook.SheetNames[0];
      if (!first) throw new Error("No sheet");
      const sheet = workbook.Sheets[first];
      if (!sheet) throw new Error("No sheet");
      const parsed = XLSX.utils.sheet_to_json<SheetRow>(sheet, { defval: "" });
      const headers = parsed[0] ? Object.keys(parsed[0]) : [];
      if (!parsed.length || !headers.length) throw new Error("No rows");
      const suggestedReview = headers.find((value) => /review|समीक्षा|text|टिप्पणी/i.test(value)) ?? "";
      const suggestedProduct = headers.find((value) => /product|उत्पाद|item/i.test(value)) ?? "";
      setFileName(file.name); setRows(parsed); setColumns(headers); setReviewColumn(suggestedReview); setProductColumn(suggestedProduct); setResults([]); setError("");
    } catch { setError("File पढ़ा नहीं जा सका — valid CSV या XLSX चुनें."); }
  };

  
const runAnalysis = async () => {
  if (!reviewColumn) {
    setError("Missing column · Review column चुनना required है.");
    return;
  }

  const validRows = rows.filter(
    (row): row is SheetRow => !!row && String(row[reviewColumn] ?? "").trim().length > 0
  );

  if (validRows.length === 0) {
    setError("No reviews found in the selected column.");
    return;
  }

  setError("");
  setProgress(1);
  setResults([]);
  setPage(1);

  try {
    const next: ResultRow[] = [];

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      if (!row) continue;

      const review = String(row[reviewColumn] ?? "").trim();

      const prediction = await predictReview(review, model);

      next.push({
        id: i + 1,
        review,
        product: productColumn
          ? String(row[productColumn] || "Unknown")
          : "",
        ...prediction,
      });

      setProgress(Math.round(((i + 1) / validRows.length) * 100));
      setResults([...next]);
    }
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Analysis failed. Check whether the backend is running."
    );
  } finally {
    setProgress(0);
  }
};

  const filtered = useMemo(() => results.filter((row) => (filter === "All" || row.sentiment === filter) && row.review.toLowerCase().includes(search.toLowerCase())), [results, filter, search]);
  const counts = useMemo(() => (["Positive", "Neutral", "Negative"] as Sentiment[]).map((name) => ({ name, value: results.filter((row) => row.sentiment === name).length, color: sentimentMeta[name].color })), [results]);
  const positiveCount = counts.find((item) => item.name === "Positive")?.value ?? 0;
  const neutralCount = counts.find((item) => item.name === "Neutral")?.value ?? 0;
  const negativeCount = counts.find((item) => item.name === "Negative")?.value ?? 0;
  const productData = useMemo(() => {
    const map = new Map<string, Record<Sentiment, number>>();
    results.forEach((row) => { const current = map.get(row.product) ?? { Positive: 0, Neutral: 0, Negative: 0 }; current[row.sentiment] += 1; map.set(row.product, current); });
    return [...map].map(([product, values]) => ({ product, ...values })).sort((a, b) => b.Positive + b.Neutral + b.Negative - a.Positive - a.Neutral - a.Negative).slice(0, 10);
  }, [results]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const average = results.length ? Math.round(results.reduce((sum, row) => sum + row.confidence, 0) / results.length) : 0;

  return <main className="min-h-screen bg-background text-foreground">
    <AppHeader active="/batch-upload" />
    <div className="mx-auto max-w-[1440px] px-4 py-7 md:px-10 md:py-10">
      <div className="mb-7 border-b-2 border-foreground pb-5"><p className="mb-1 text-sm font-bold text-primary">02 / BATCH UPLOAD</p><h1 className="font-display text-3xl leading-tight md:text-5xl">पूरा batch. एक clear picture.</h1><p className="mt-2 text-sm font-medium text-muted-foreground">CSV या XLSX में Hindi reviews upload करें और sentiment trends देखें.</p></div>

      {!fileName ? <section className="border-2 border-dashed border-foreground bg-card p-6 text-center shadow-[6px_6px_0_var(--ink)] md:p-12" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); void readFile(e.dataTransfer.files[0]); }}>
        <UploadCloud className="mx-auto size-14 text-primary" /><h2 className="mt-4 font-display text-2xl">File यहाँ drop करें</h2><p className="mt-2 text-sm font-semibold text-muted-foreground">CSV or XLSX · maximum 10 MB</p><input ref={inputRef} className="hidden" type="file" accept=".csv,.xlsx" onChange={(e) => void readFile(e.target.files?.[0])} /><div className="mt-5 flex flex-wrap justify-center gap-3"><Button onClick={() => inputRef.current?.click()}><FileSpreadsheet className="size-4" />Choose file</Button><Button variant="outline" onClick={() => download("bhavsense-sample.csv", "Review,Product\nबहुत शानदार गुणवत्ता है,मोबाइल\nडिलीवरी बहुत देर से हुई,जूते\nउत्पाद ठीक है,किताब") }><Download className="size-4" />Download sample file</Button></div>
      </section> : <section className="border-2 border-foreground bg-card p-4 shadow-[6px_6px_0_var(--ink)] md:p-6">
        <div className="flex items-center justify-between gap-3 border-b-2 border-foreground pb-4"><div className="flex min-w-0 items-center gap-3"><FileSpreadsheet className="size-7 shrink-0 text-primary" /><div className="min-w-0"><p className="truncate font-bold">{fileName}</p><p className="text-xs text-muted-foreground">{rows.length} rows found</p></div></div><Button variant="ghost" size="icon" aria-label="Remove file" onClick={() => { setFileName(""); setRows([]); setResults([]); setError(""); }}><X className="size-5" /></Button></div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <ColumnSelect label="Review column · समीक्षा" required value={reviewColumn} columns={columns} onChange={setReviewColumn} />
          <ColumnSelect label="Product column · उत्पाद" value={productColumn} columns={columns} onChange={setProductColumn} />
          <ModelSelect id="batch-model" value={model} onChange={setModel} />
        </div>
        {error && <div role="alert" className="mt-4 flex items-center gap-2 border-2 border-negative bg-negative/10 px-3 py-2 text-sm font-bold text-negative"><AlertCircle className="size-5" />{error}</div>}
        {progress > 0 && progress < 100 && <div className="mt-5"><div className="mb-2 flex justify-between text-sm font-bold"><span>Analysis चल रहा है…</span><span>{progress}%</span></div><Progress value={progress} className="h-3 rounded-none border border-foreground" /></div>}
        <Button className="mt-5" onClick={runAnalysis} disabled={progress > 0 && progress < 100}><CheckCircle2 className="size-4" />Run analysis</Button>
      </section>}
      {error && !fileName && <div role="alert" className="mt-4 flex items-center gap-2 border-2 border-negative bg-negative/10 px-3 py-2 text-sm font-bold text-negative"><AlertCircle className="size-5" />{error}</div>}

      {results.length > 0 && <div className="mt-8 space-y-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5"><Kpi label="Total reviews" value={results.length} /><Kpi label="Positive" value={`${results.length ? Math.round((positiveCount / results.length) * 100) : 0}%`} tone="positive" /><Kpi label="Neutral" value={`${results.length ? Math.round((neutralCount / results.length) * 100) : 0}%`} tone="neutral" /><Kpi label="Negative" value={`${results.length ? Math.round((negativeCount / results.length) * 100) : 0}%`} tone="negative" /><Kpi label="Avg confidence" value={`${average}%`} /></div>
        <div className={cn("grid gap-6", productColumn && "lg:grid-cols-2")}><ChartCard title="Sentiment distribution · वितरण"><ResponsiveContainer width="100%" height={280}><PieChart><Pie data={counts} dataKey="value" nameKey="name" innerRadius={62} outerRadius={96} paddingAngle={3}>{counts.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></ChartCard>{productColumn && <ChartCard title="Product sentiment · Top 10"><ResponsiveContainer width="100%" height={280}><BarChart data={productData} layout="vertical" margin={{ left: 12 }}><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" allowDecimals={false} /><YAxis type="category" dataKey="product" width={78} tick={{ fontSize: 11 }} /><Tooltip /><Legend /><Bar dataKey="Positive" stackId="a" fill="var(--positive)" /><Bar dataKey="Neutral" stackId="a" fill="var(--neutral)" /><Bar dataKey="Negative" stackId="a" fill="var(--negative)" /></BarChart></ResponsiveContainer></ChartCard>}</div>
        <section className="border-2 border-foreground bg-card shadow-[6px_6px_0_var(--ink)]"><div className="flex flex-col gap-3 border-b-2 border-foreground p-4 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="font-display text-2xl">Results · नतीजे</h2><p className="text-xs font-semibold text-muted-foreground">Predicted by {model}</p></div><div className="flex flex-wrap gap-2">{(["All", "Positive", "Neutral", "Negative"] as const).map((item) => <Button key={item} size="sm" variant={filter === item ? "default" : "outline"} onClick={() => { setFilter(item); setPage(1); }}>{item}</Button>)}</div><label className="relative"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><input aria-label="Search reviews" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search reviews" className="h-10 w-full rounded-md border-2 border-foreground bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring lg:w-52" /></label><Button variant="outline" onClick={() => download("bhavsense-results.csv", ["#,Review,Sentiment,Confidence", ...filtered.map((row) => [row.id, escapeCsv(row.review), row.sentiment, `${row.confidence}%`].join(","))].join("\n"))}><Download className="size-4" />Download results CSV</Button></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-secondary"><tr><th className="p-3">#</th><th className="p-3">Review · समीक्षा</th><th className="p-3">Predicted sentiment</th><th className="p-3">Confidence</th></tr></thead><tbody>{visible.map((row) => { const meta = sentimentMeta[row.sentiment]; const Icon = meta.icon; return <tr key={row.id} className="border-t border-border"><td className="p-3 font-bold">{row.id}</td><td className="max-w-lg p-3"><button className="text-left hover:text-primary" onClick={() => setExpanded(expanded === row.id ? null : row.id)}>{expanded === row.id ? row.review : `${row.review.slice(0, 78)}${row.review.length > 78 ? "…" : ""}`}</button></td><td className="p-3"><span className={cn("inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-bold", meta.className)}><Icon className="size-4" />{meta.label}</span></td><td className="p-3 font-bold">{row.confidence}%</td></tr>; })}</tbody></table></div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-foreground p-4 text-sm font-bold"><label>Rows <select aria-label="Rows per page" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="ml-2 rounded-md border-2 border-foreground bg-background px-2 py-1">{[10,25,50].map((n) => <option key={n}>{n}</option>)}</select></label><span>{filtered.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}</span><div className="flex gap-2"><Button size="icon" variant="outline" aria-label="Previous page" disabled={page === 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="size-4" /></Button><Button size="icon" variant="outline" aria-label="Next page" disabled={page === pages} onClick={() => setPage((p) => p + 1)}><ChevronRight className="size-4" /></Button></div></div>
        </section>
      </div>}
    </div>
  </main>;
}

function ColumnSelect({ label, value, columns, onChange, required }: { label: string; value: string; columns: string[]; onChange: (value: string) => void; required?: boolean }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-bold">{label} {required ? <span className="text-negative">*</span> : <span className="font-normal text-muted-foreground">(optional)</span>}</span><span className="relative block"><select value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full appearance-none rounded-md border-2 border-foreground bg-background px-3 pr-9 text-sm font-semibold"><option value="">Select column</option>{columns.map((column) => <option key={column}>{column}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3 size-5" /></span></label>;
}
function Kpi({ label, value, tone }: { label: string; value: string | number; tone?: "positive" | "neutral" | "negative" }) { return <div className={cn("border-2 border-foreground bg-card p-4 shadow-[4px_4px_0_var(--ink)]", tone === "positive" && "border-positive", tone === "neutral" && "border-neutral", tone === "negative" && "border-negative")}><p className="text-xs font-bold text-muted-foreground">{label}</p><p className={cn("mt-1 font-display text-3xl", tone && `text-${tone}`)}>{value}</p></div>; }
function ChartCard({ title, children }: { title: string; children: React.ReactNode }) { return <section className="border-2 border-foreground bg-card p-4 shadow-[6px_6px_0_var(--ink)]"><h2 className="font-display text-xl">{title}</h2><div className="mt-3">{children}</div></section>; }