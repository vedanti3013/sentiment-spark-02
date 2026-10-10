import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, BarChart3, CheckCircle2, ChevronDown, Database, MinusCircle, TrendingDown } from "lucide-react";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { AppHeader } from "@/components/ui/app-header";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/model-performance")({
  head: () => ({ meta: [
    { title: "Model Performance — भावSense" },
    { name: "description", content: "Compare four trained classic Hindi sentiment models across accuracy, macro-F1, class metrics, and confusion matrices." },
    { property: "og:title", content: "Model Performance — भावSense" },
    { property: "og:description", content: "Performance metrics loaded from the trained classic models used by the backend." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: ModelPerformance,
});

type ClassMetrics = {
  precision: number;
  recall: number;
  f1: number;
  support: number;
};

type ApiModelMetrics = {
  accuracy: number;
  macro_f1: number;
  per_class: {
    negative: ClassMetrics;
    neutral: ClassMetrics;
    positive: ClassMetrics;
  };
  confusion_matrix: number[][];
};

type ApiMetrics = {
  labels: string[];
  train_distribution: number[];
  test_distribution: number[];
  models: Record<string, ApiModelMetrics>;
  top_words: Record<string, string[]>;
  neural_models?: Record<string, { accuracy: number }>;
};

const API_BASE = "http://127.0.0.1:8000";

type PerformanceModel = {
  model: string;
  accuracy: number;
  macroF1: number;
  negative: number[];
  neutral: number[];
  positive: number[];
  matrix: number[][];
};

function convertApiMetrics(data: ApiMetrics): PerformanceModel[] {
  return Object.entries(data.models).map(([name, item]) => ({
    model: name,
    accuracy: Number((item.accuracy * 100).toFixed(2)),
    macroF1: Number((item.macro_f1 * 100).toFixed(2)),
    negative: [
      item.per_class.negative.precision,
      item.per_class.negative.recall,
      item.per_class.negative.f1,
    ],
    neutral: [
      item.per_class.neutral.precision,
      item.per_class.neutral.recall,
      item.per_class.neutral.f1,
    ],
    positive: [
      item.per_class.positive.precision,
      item.per_class.positive.recall,
      item.per_class.positive.f1,
    ],
    matrix: item.confusion_matrix,
  }));
}

const fallbackDistribution = [{ split: "Train", Negative: 1571, Neutral: 680, Positive: 1276 }, { split: "Test", Negative: 394, Neutral: 170, Positive: 320 }];
const fallbackWords = {
  Negative: ["खराब","बेकार","निराश","देर","टूटा","समस्या","घटिया","बुरा","धोखा","महंगा","कमजोर","वापस","गंदा","नुकसान","नाकाम"],
  Neutral: ["ठीक","सामान्य","औसत","मिला","उत्पाद","कीमत","समय","पैकेट","सुविधा","रंग","आकार","विवरण","उपयोग","सेवा","जैसा"],
  Positive: ["अच्छा","शानदार","बेहतरीन","खुश","पसंद","कमाल","उत्तम","तेज़","सुंदर","आसान","भरोसेमंद","लाजवाब","मज़ेदार","संतुष्ट","सही"],
} as const;
const colors = { Negative: "var(--negative)", Neutral: "var(--neutral)", Positive: "var(--positive)" };

function ModelPerformance() {
 
const [selected, setSelected] = useState("Naive Bayes");
const [apiData, setApiData] = useState<ApiMetrics | null>(null);
const [apiError, setApiError] = useState("");
const [loading, setLoading] = useState(true);

useEffect(() => {
  let cancelled = false;

  async function loadMetrics() {
    try {
      const response = await fetch(`${API_BASE}/api/metrics`);

      if (!response.ok) {
        throw new Error(`Metrics request failed: ${response.status}`);
      }

      const data: ApiMetrics = await response.json();

      if (!cancelled) {
        setApiData(data);
        setApiError("");
      }
    } catch {
      if (!cancelled) {
        setApiError(
          "Could not load real model metrics. Check that the backend is running."
        );
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  }

  loadMetrics();

  return () => {
    cancelled = true;
  };
}, []);

const models = apiData ? convertApiMetrics(apiData) : [];
const distribution = apiData
  ? [
      { split: "Train", Negative: apiData.train_distribution[0] ?? 0, Neutral: apiData.train_distribution[1] ?? 0, Positive: apiData.train_distribution[2] ?? 0 },
      { split: "Test", Negative: apiData.test_distribution[0] ?? 0, Neutral: apiData.test_distribution[1] ?? 0, Positive: apiData.test_distribution[2] ?? 0 },
    ]
  : fallbackDistribution;
const words = apiData
  ? {
      Negative: apiData.top_words.negative ?? [],
      Neutral: apiData.top_words.neutral ?? [],
      Positive: apiData.top_words.positive ?? [],
    }
  : fallbackWords;
const active = models.find((item) => item.model === selected) ?? models[0] ?? null;
const total = active
  ? active.matrix.flat().reduce((sum, value) => sum + value, 0)
  : 0;
 

  return <main className="min-h-screen bg-background text-foreground">
    <AppHeader active="/model-performance" />
    <div className="mx-auto max-w-[1440px] px-4 py-7 md:px-10 md:py-10">
      <div className="flex flex-col gap-4 border-b-2 border-foreground pb-5 md:flex-row md:items-end md:justify-between"><div><p className="mb-1 text-sm font-bold text-primary">03 / MODEL PERFORMANCE</p><h1 className="font-display text-3xl leading-tight md:text-5xl">Models कितने accurate हैं?</h1><p className="mt-2 text-sm font-medium text-muted-foreground">Four trained classic models का live backend performance view.</p></div><span className="inline-flex w-fit items-center gap-2 border-2 border-positive bg-positive/10 px-3 py-2 text-xs font-bold text-positive"><CheckCircle2 className="size-4" />Trained classic models connected</span></div>

      {loading && <p className="mt-5 border-2 border-primary bg-primary/10 p-3 text-sm font-bold">Loading metrics from the trained backend models…</p>}
      {apiError && <p role="alert" className="mt-5 border-2 border-negative bg-negative/10 p-3 text-sm font-bold text-negative">{apiError}</p>}

      <div className="mt-7 grid gap-6 lg:grid-cols-[.72fr_1.28fr]">
        <section className="border-2 border-foreground bg-card p-5 shadow-[6px_6px_0_var(--ink)]"><div className="flex items-start gap-3"><Database className="size-7 text-primary" /><div><p className="text-sm font-bold text-muted-foreground">DATASET · डेटा</p><h2 className="mt-1 font-display text-2xl">{distribution[0].Negative + distribution[0].Neutral + distribution[0].Positive + distribution[1].Negative + distribution[1].Neutral + distribution[1].Positive} reviews</h2><p className="mt-1 font-bold">{distribution[0].Negative + distribution[0].Neutral + distribution[0].Positive} train <span className="text-muted-foreground">/</span> {distribution[1].Negative + distribution[1].Neutral + distribution[1].Positive} test</p></div></div><ResponsiveContainer width="100%" height={250}><BarChart data={distribution} margin={{ top: 24 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="split" /><YAxis /><Tooltip /><Legend /><Bar dataKey="Negative" stackId="a" fill={colors.Negative} /><Bar dataKey="Neutral" stackId="a" fill={colors.Neutral} /><Bar dataKey="Positive" stackId="a" fill={colors.Positive} /></BarChart></ResponsiveContainer></section>
        <section className="border-2 border-foreground bg-card p-5 shadow-[6px_6px_0_var(--ink)]"><div className="flex items-center gap-3"><BarChart3 className="size-7 text-primary" /><div><p className="text-sm font-bold text-muted-foreground">MODEL COMPARISON</p><h2 className="font-display text-2xl">Accuracy + Macro-F1</h2></div></div><ResponsiveContainer width="100%" height={310}><BarChart data={models} margin={{ top: 24, right: 8, left: -12, bottom: 38 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="model" interval={0} angle={-20} textAnchor="end" tick={{ fontSize: 11 }} /><YAxis domain={[70, 100]} /><Tooltip /><Legend /><Bar dataKey="accuracy" name="Accuracy %" fill="var(--primary)" /><Bar dataKey="macroF1" name="Macro-F1 %" fill="var(--accent)" stroke="var(--foreground)" /></BarChart></ResponsiveContainer></section>
      </div>

      <section className="mt-6 border-2 border-foreground bg-card shadow-[6px_6px_0_var(--ink)]"><div className="border-b-2 border-foreground p-5"><p className="text-sm font-bold text-muted-foreground">DETAILED RESULTS</p><h2 className="font-display text-2xl">All model accuracies · सभी scores</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-center text-sm"><thead className="bg-secondary"><tr><th rowSpan={2} className="p-3 text-left">Model</th><th rowSpan={2} className="p-3">Accuracy</th><th rowSpan={2} className="p-3">Macro-F1</th>{(["Negative","Neutral","Positive"] as const).map((item) => <th key={item} colSpan={3} className={cn("border-l border-foreground/30 p-2", `text-${item.toLowerCase()}`)}>{item}</th>)}</tr><tr>{[0,1,2].flatMap((group) => ["Precision","Recall","F1"].map((metric) => <th key={`${group}-${metric}`} className="border-l border-foreground/20 p-2 text-xs">{metric}</th>))}</tr></thead><tbody>{models.map((row) => <tr key={row.model} className="border-t border-border"><td className="p-3 text-left font-bold">{row.model}</td><td className="p-3 font-display text-lg">{row.accuracy}%</td><td className="p-3 font-display text-lg">{row.macroF1}%</td>{[...row.negative,...row.neutral,...row.positive].map((value, index) => <td key={index} className="border-l border-border p-3">{value.toFixed(2)}</td>)}</tr>)}</tbody></table></div></section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[.88fr_1.12fr]">
        <section className="border-2 border-foreground bg-card p-5 shadow-[6px_6px_0_var(--ink)]"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-bold text-muted-foreground">CONFUSION MATRIX</p><h2 className="font-display text-2xl">Actual × Predicted</h2></div><label><span className="sr-only">Select model</span><span className="relative block"><select value={selected} onChange={(e) => setSelected(e.target.value)} className="h-10 appearance-none rounded-md border-2 border-foreground bg-background py-1 pl-3 pr-9 font-bold">{models.map((item) => <option key={item.model}>{item.model}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-2.5 size-4" /></span></label></div>        {active ? <div className="mt-5 grid grid-cols-[auto_repeat(3,minmax(0,1fr))] gap-1 text-center text-xs font-bold"><span /><span>Pred. Neg.</span><span>Pred. Neu.</span><span>Pred. Pos.</span>{active.matrix.map((row, rowIndex) => <MatrixRow key={rowIndex} label={["Actual Neg.","Actual Neu.","Actual Pos."][rowIndex] ?? "Actual"} row={row} rowIndex={rowIndex} total={total} />)}</div> : <p className="mt-5 text-sm text-muted-foreground">Loading model matrix…</p>}<div className="mt-4 flex flex-wrap justify-center gap-4 text-xs font-bold"><span className="flex items-center gap-1"><TrendingDown className="size-4 text-negative" />Negative</span><span className="flex items-center gap-1"><MinusCircle className="size-4 text-neutral" />Neutral</span><span className="flex items-center gap-1"><CheckCircle2 className="size-4 text-positive" />Positive</span></div></section>        <section className="border-2 border-foreground bg-card p-5 shadow-[6px_6px_0_var(--ink)]"><p className="text-sm font-bold text-muted-foreground">TOP WORDS</p><h2 className="font-display text-2xl">हर sentiment की vocabulary</h2><div className="mt-5 grid gap-5 sm:grid-cols-3">{(Object.keys(words) as (keyof typeof words)[]).map((sentiment) => <div key={sentiment}><h3 className={cn("mb-3 flex items-center gap-2 font-bold", `text-${sentiment.toLowerCase()}`)}>{sentiment === "Negative" ? <TrendingDown className="size-4" /> : sentiment === "Neutral" ? <MinusCircle className="size-4" /> : <CheckCircle2 className="size-4" />}{sentiment}</h3><div className="flex flex-wrap gap-2">{words[sentiment].map((word) => <span key={word} className={cn("rounded-md border px-2 py-1 text-sm font-semibold", sentiment === "Negative" ? "border-negative bg-negative/10 text-negative" : sentiment === "Neutral" ? "border-neutral bg-neutral/10 text-neutral" : "border-positive bg-positive/10 text-positive")}>{word}</span>)}</div></div>)}</div></section>
      </div>
      <aside className="mt-6 flex items-start gap-3 border-2 border-neutral bg-neutral/10 p-5 shadow-[4px_4px_0_var(--ink)]"><AlertTriangle className="mt-0.5 size-6 shrink-0 text-neutral" /><div><p className="font-display text-xl">Neutral सबसे hard class है.</p><p className="mt-1 text-sm font-semibold text-muted-foreground">Trained classic model results में neutral reviews का recall और F1 सबसे कम है, क्योंकि mild praise और mild complaints अक्सर overlap करते हैं.</p></div></aside>
    </div>
  </main>;
}

function MatrixRow({ label, row, rowIndex, total }: { label: string; row: readonly number[]; rowIndex: number; total: number }) {
  return <><span className="flex items-center justify-end pr-2">{label}</span>{row.map((value, columnIndex) => { const correct = rowIndex === columnIndex; const max = Math.max(...row); const strength = value / max; return <div key={columnIndex} className={cn("grid aspect-square min-h-16 place-items-center border border-foreground/30 p-1", correct ? "bg-positive text-positive-foreground" : strength > .4 ? "bg-negative/30" : "bg-negative/10")}><span><strong className="block text-base md:text-xl">{value}</strong><span className="text-[10px] md:text-xs">{(value / total * 100).toFixed(1)}%</span></span></div>; })}</>;
}