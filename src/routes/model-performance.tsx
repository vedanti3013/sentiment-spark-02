import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, BarChart3, CheckCircle2, ChevronDown, Database, MinusCircle, TrendingDown } from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { AppHeader } from "@/components/ui/app-header";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/model-performance")({
  head: () => ({ meta: [
    { title: "Model Performance — भावSense" },
    { name: "description", content: "Compare six Hindi sentiment models across accuracy, macro-F1, class metrics, and confusion matrices." },
    { property: "og:title", content: "Model Performance — भावSense" },
    { property: "og:description", content: "Visible charts and detailed metrics for classical, FFNN, and LSTM plus ELMo models." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: ModelPerformance,
});

const models = [
  { model: "SVM", accuracy: 92.4, macroF1: 91.7, negative: [0.92, 0.94, 0.93], neutral: [0.87, 0.82, 0.84], positive: [0.95, 0.96, 0.95], matrix: [[246,12,5],[10,191,17],[4,19,380]] },
  { model: "Logistic Regression", accuracy: 89.1, macroF1: 88.4, negative: [0.89, 0.91, 0.90], neutral: [0.83, 0.77, 0.80], positive: [0.92, 0.95, 0.93], matrix: [[238,19,6],[14,180,24],[6,27,370]] },
  { model: "Naive Bayes", accuracy: 86.7, macroF1: 85.6, negative: [0.87, 0.88, 0.87], neutral: [0.78, 0.72, 0.75], positive: [0.90, 0.94, 0.92], matrix: [[231,24,8],[18,169,31],[8,29,366]] },
  { model: "Decision Tree", accuracy: 83.2, macroF1: 82.1, negative: [0.84, 0.82, 0.83], neutral: [0.73, 0.70, 0.71], positive: [0.87, 0.91, 0.89], matrix: [[216,34,13],[24,153,41],[12,25,366]] },
  { model: "FFNN", accuracy: 91.3, macroF1: 90.6, negative: [0.91, 0.92, 0.91], neutral: [0.85, 0.80, 0.82], positive: [0.94, 0.96, 0.95], matrix: [[242,15,6],[12,186,20],[5,19,379]] },
  { model: "LSTM + ELMo", accuracy: 93.6, macroF1: 92.9, negative: [0.94, 0.95, 0.94], neutral: [0.89, 0.84, 0.86], positive: [0.96, 0.97, 0.96], matrix: [[249,10,4],[8,198,12],[3,20,380]] },
] as const;

const distribution = [{ split: "Train", Negative: 1048, Neutral: 871, Positive: 1608 }, { split: "Test", Negative: 263, Neutral: 218, Positive: 403 }];
const words = {
  Negative: ["खराब","बेकार","निराश","देर","टूटा","समस्या","घटिया","बुरा","धोखा","महंगा","कमजोर","वापस","गंदा","नुकसान","नाकाम"],
  Neutral: ["ठीक","सामान्य","औसत","मिला","उत्पाद","कीमत","समय","पैकेट","सुविधा","रंग","आकार","विवरण","उपयोग","सेवा","जैसा"],
  Positive: ["अच्छा","शानदार","बेहतरीन","खुश","पसंद","कमाल","उत्तम","तेज़","सुंदर","आसान","भरोसेमंद","लाजवाब","मज़ेदार","संतुष्ट","सही"],
} as const;
const colors = { Negative: "var(--negative)", Neutral: "var(--neutral)", Positive: "var(--positive)" };

function ModelPerformance() {
  const [selected, setSelected] = useState("LSTM + ELMo");
  const active = models.find((item) => item.model === selected) ?? models[0];
  const total = active.matrix.flat().reduce((sum, value) => sum + value, 0);

  return <main className="min-h-screen bg-background text-foreground">
    <AppHeader active="/model-performance" />
    <div className="mx-auto max-w-[1440px] px-4 py-7 md:px-10 md:py-10">
      <div className="flex flex-col gap-4 border-b-2 border-foreground pb-5 md:flex-row md:items-end md:justify-between"><div><p className="mb-1 text-sm font-bold text-primary">03 / MODEL PERFORMANCE</p><h1 className="font-display text-3xl leading-tight md:text-5xl">Models कितने accurate हैं?</h1><p className="mt-2 text-sm font-medium text-muted-foreground">Six models का side-by-side notebook performance view.</p></div><span className="inline-flex w-fit items-center gap-2 border-2 border-neutral bg-neutral/10 px-3 py-2 text-xs font-bold text-neutral"><AlertTriangle className="size-4" />Placeholder data · notebook connection pending</span></div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[.72fr_1.28fr]">
        <section className="border-2 border-foreground bg-card p-5 shadow-[6px_6px_0_var(--ink)]"><div className="flex items-start gap-3"><Database className="size-7 text-primary" /><div><p className="text-sm font-bold text-muted-foreground">DATASET · डेटा</p><h2 className="mt-1 font-display text-2xl">4,411 reviews</h2><p className="mt-1 font-bold">3,527 train <span className="text-muted-foreground">/</span> 884 test</p></div></div><ResponsiveContainer width="100%" height={250}><BarChart data={distribution} margin={{ top: 24 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="split" /><YAxis /><Tooltip /><Legend /><Bar dataKey="Negative" stackId="a" fill={colors.Negative} /><Bar dataKey="Neutral" stackId="a" fill={colors.Neutral} /><Bar dataKey="Positive" stackId="a" fill={colors.Positive} /></BarChart></ResponsiveContainer></section>
        <section className="border-2 border-foreground bg-card p-5 shadow-[6px_6px_0_var(--ink)]"><div className="flex items-center gap-3"><BarChart3 className="size-7 text-primary" /><div><p className="text-sm font-bold text-muted-foreground">MODEL COMPARISON</p><h2 className="font-display text-2xl">Accuracy + Macro-F1</h2></div></div><ResponsiveContainer width="100%" height={310}><BarChart data={models} margin={{ top: 24, right: 8, left: -12, bottom: 38 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="model" interval={0} angle={-20} textAnchor="end" tick={{ fontSize: 11 }} /><YAxis domain={[70, 100]} /><Tooltip /><Legend /><Bar dataKey="accuracy" name="Accuracy %" fill="var(--primary)" /><Bar dataKey="macroF1" name="Macro-F1 %" fill="var(--accent)" stroke="var(--foreground)" /></BarChart></ResponsiveContainer></section>
      </div>

      <section className="mt-6 border-2 border-foreground bg-card shadow-[6px_6px_0_var(--ink)]"><div className="border-b-2 border-foreground p-5"><p className="text-sm font-bold text-muted-foreground">DETAILED RESULTS</p><h2 className="font-display text-2xl">All model accuracies · सभी scores</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-center text-sm"><thead className="bg-secondary"><tr><th rowSpan={2} className="p-3 text-left">Model</th><th rowSpan={2} className="p-3">Accuracy</th><th rowSpan={2} className="p-3">Macro-F1</th>{(["Negative","Neutral","Positive"] as const).map((item) => <th key={item} colSpan={3} className={cn("border-l border-foreground/30 p-2", `text-${item.toLowerCase()}`)}>{item}</th>)}</tr><tr>{[0,1,2].flatMap((group) => ["Precision","Recall","F1"].map((metric) => <th key={`${group}-${metric}`} className="border-l border-foreground/20 p-2 text-xs">{metric}</th>))}</tr></thead><tbody>{models.map((row) => <tr key={row.model} className="border-t border-border"><td className="p-3 text-left font-bold">{row.model}</td><td className="p-3 font-display text-lg">{row.accuracy}%</td><td className="p-3 font-display text-lg">{row.macroF1}%</td>{[...row.negative,...row.neutral,...row.positive].map((value, index) => <td key={index} className="border-l border-border p-3">{value.toFixed(2)}</td>)}</tr>)}</tbody></table></div></section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[.88fr_1.12fr]">
        <section className="border-2 border-foreground bg-card p-5 shadow-[6px_6px_0_var(--ink)]"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-bold text-muted-foreground">CONFUSION MATRIX</p><h2 className="font-display text-2xl">Actual × Predicted</h2></div><label><span className="sr-only">Select model</span><span className="relative block"><select value={selected} onChange={(e) => setSelected(e.target.value)} className="h-10 appearance-none rounded-md border-2 border-foreground bg-background py-1 pl-3 pr-9 font-bold">{models.map((item) => <option key={item.model}>{item.model}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-2.5 size-4" /></span></label></div><div className="mt-5 grid grid-cols-[auto_repeat(3,minmax(0,1fr))] gap-1 text-center text-xs font-bold"><span /><span>Pred. Neg.</span><span>Pred. Neu.</span><span>Pred. Pos.</span>{active.matrix.map((row, rowIndex) => <MatrixRow key={rowIndex} label={["Actual Neg.","Actual Neu.","Actual Pos."][rowIndex]} row={row} rowIndex={rowIndex} total={total} />)}</div><div className="mt-4 flex flex-wrap justify-center gap-4 text-xs font-bold"><span className="flex items-center gap-1"><TrendingDown className="size-4 text-negative" />Negative</span><span className="flex items-center gap-1"><MinusCircle className="size-4 text-neutral" />Neutral</span><span className="flex items-center gap-1"><CheckCircle2 className="size-4 text-positive" />Positive</span></div></section>
        <section className="border-2 border-foreground bg-card p-5 shadow-[6px_6px_0_var(--ink)]"><p className="text-sm font-bold text-muted-foreground">TOP WORDS</p><h2 className="font-display text-2xl">हर sentiment की vocabulary</h2><div className="mt-5 grid gap-5 sm:grid-cols-3">{(Object.keys(words) as (keyof typeof words)[]).map((sentiment) => <div key={sentiment}><h3 className={cn("mb-3 flex items-center gap-2 font-bold", `text-${sentiment.toLowerCase()}`)}>{sentiment === "Negative" ? <TrendingDown className="size-4" /> : sentiment === "Neutral" ? <MinusCircle className="size-4" /> : <CheckCircle2 className="size-4" />}{sentiment}</h3><div className="flex flex-wrap gap-2">{words[sentiment].map((word) => <span key={word} className={cn("rounded-md border px-2 py-1 text-sm font-semibold", sentiment === "Negative" ? "border-negative bg-negative/10 text-negative" : sentiment === "Neutral" ? "border-neutral bg-neutral/10 text-neutral" : "border-positive bg-positive/10 text-positive")}>{word}</span>)}</div></div>)}</div></section>
      </div>
      <aside className="mt-6 flex items-start gap-3 border-2 border-neutral bg-neutral/10 p-5 shadow-[4px_4px_0_var(--ink)]"><AlertTriangle className="mt-0.5 size-6 shrink-0 text-neutral" /><div><p className="font-display text-xl">Neutral सबसे hard class है.</p><p className="mt-1 text-sm font-semibold text-muted-foreground">Placeholder results में neutral reviews का recall और F1 सबसे कम है, क्योंकि mild praise और mild complaints अक्सर overlap करते हैं.</p></div></aside>
    </div>
  </main>;
}

function MatrixRow({ label, row, rowIndex, total }: { label: string; row: readonly number[]; rowIndex: number; total: number }) {
  return <><span className="flex items-center justify-end pr-2">{label}</span>{row.map((value, columnIndex) => { const correct = rowIndex === columnIndex; const max = Math.max(...row); const strength = value / max; return <div key={columnIndex} className={cn("grid aspect-square min-h-16 place-items-center border border-foreground/30 p-1", correct ? "bg-positive text-positive-foreground" : strength > .4 ? "bg-negative/30" : "bg-negative/10")}><span><strong className="block text-base md:text-xl">{value}</strong><span className="text-[10px] md:text-xs">{(value / total * 100).toFixed(1)}%</span></span></div>; })}</>;
}