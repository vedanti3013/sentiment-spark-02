import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, ChevronDown, MinusCircle, TrendingDown } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

// No head() here: the home route inherits title/description/og/twitter from
// __root.tsx, and ships no og:image so serve-time hosting can inject the
// project's social preview (explicit og:image or latest screenshot).
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Analyze Hindi Reviews — भावSense" },
      { name: "description", content: "Analyze Hindi reviews using SVM, Logistic Regression, Naive Bayes, or Decision Tree." },
      { property: "og:title", content: "Analyze Hindi Reviews — भावSense" },
      { property: "og:description", content: "A vibrant Hindi–English sentiment analysis workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const examples = [
  { label: "Negative · नकारात्मक", review: "उत्पाद की गुणवत्ता बहुत ख़राब है और डिलीवरी भी देर से हुई।", tone: "negative" },
  { label: "Neutral · तटस्थ", review: "उत्पाद ठीक है, जैसा बताया गया था वैसा ही मिला।", tone: "neutral" },
  { label: "Positive · सकारात्मक", review: "बहुत शानदार अनुभव! गुणवत्ता और सेवा दोनों कमाल हैं।", tone: "positive" },
] as const;

// Input is Hindi-only: at least one Devanagari letter, no Latin letters.
const HINDI_RE = /[\u0900-\u097F]/;
const LATIN_RE = /[A-Za-z]/;

const models = [
  ["SVM", "92.4%"],
  ["Logistic Regression", "89.1%"],
  ["Naive Bayes", "86.7%"],
  ["Decision Tree", "83.2%"],
] as const;

function Index() {
  const [review, setReview] = useState("");
  const [title, setTitle] = useState("");
  const [model, setModel] = useState("SVM");
  const [status, setStatus] = useState<"empty" | "loading" | "result" | "error">("empty");
  const [errorText, setErrorText] = useState("");

  const analyze = () => {
    const text = review.trim();
    if (!text) {
      setErrorText("कृपया review लिखें — input empty है.");
      setStatus("error");
      return;
    }
    if (!HINDI_RE.test(text) || LATIN_RE.test(text)) {
      setErrorText("केवल Hindi (देवनागरी) input accepted है — कृपया English अक्षर हटाकर दोबारा लिखें.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    window.setTimeout(() => setStatus("result"), 800);
  };

  const clear = () => {
    setReview("");
    setTitle("");
    setErrorText("");
    setStatus("empty");
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b-2 border-foreground bg-card">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-10">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-md bg-accent font-display text-xl text-accent-foreground shadow-[3px_3px_0_var(--ink)]">भा</div>
            <div><div className="font-display text-xl leading-none">भावSense</div><div className="mt-1 text-xs font-semibold text-muted-foreground">Hindi Sentiment Lab</div></div>
          </div>
          <nav aria-label="Primary" className="grid grid-cols-4 gap-1 overflow-x-auto rounded-md border-2 border-foreground bg-secondary p-1 text-center text-xs font-bold sm:text-sm">
            <span className="rounded-sm bg-primary px-3 py-2 text-primary-foreground">Analyze</span>
            <span className="px-3 py-2 text-muted-foreground">Batch Upload</span>
            <span className="px-3 py-2 text-muted-foreground">Model Performance</span>
            <span className="px-3 py-2 text-muted-foreground">About</span>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-4 py-7 md:px-10 md:py-10">
        <div className="mb-7 flex items-end justify-between gap-4 border-b-2 border-foreground pb-5">
          <div><p className="mb-1 text-sm font-bold text-primary">01 / SINGLE REVIEW</p><h1 className="font-display text-3xl leading-tight md:text-5xl">Review पढ़ें. Mood समझें.</h1></div>
          <p className="hidden max-w-xs text-right text-sm font-medium text-muted-foreground md:block">Hindi review को analyze करें और model confidence तुरंत देखें.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.12fr)_minmax(360px,.88fr)]">
          <section className="border-2 border-foreground bg-card p-4 shadow-[6px_6px_0_var(--ink)] md:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block"><span className="mb-1.5 block text-sm font-bold">Model · मॉडल</span><div className="relative"><select value={model} onChange={(event) => setModel(event.target.value)} className="h-11 w-full appearance-none rounded-md border-2 border-foreground bg-background px-3 pr-9 text-sm font-semibold outline-none focus:ring-2 focus:ring-ring">{models.map(([name, accuracy]) => <option key={name} value={name}>{name} — {accuracy} accuracy</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3 size-5" /></div></label>
              <label className="block"><span className="mb-1.5 block text-sm font-bold">Title · शीर्षक <span className="font-normal text-muted-foreground">(optional)</span></span><input value={title} onChange={(event) => setTitle(event.target.value)} className="h-11 w-full rounded-md border-2 border-foreground bg-background px-3 outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring" placeholder="Review का छोटा title" /></label>
            </div>

            <label className="mt-5 block"><span className="mb-1.5 block text-sm font-bold">Review · समीक्षा</span><textarea value={review} onChange={(event) => setReview(event.target.value.slice(0, 1000))} maxLength={1000} className="min-h-44 w-full resize-none rounded-md border-2 border-foreground bg-background p-4 text-base leading-relaxed outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring" placeholder="अपनी Hindi review यहाँ लिखें… product या service कैसी लगी?" /><span className="mt-1 block text-right text-xs font-bold text-muted-foreground">{review.length} / 1,000 characters</span></label>

            <div className="mt-4"><p className="mb-2 text-sm font-bold">Try an example · उदाहरण</p><div className="flex gap-2 overflow-x-auto pb-2">{examples.map((example) => <Button key={example.tone} variant="secondary" onClick={() => { setReview(example.review); setStatus("empty"); }} className={`h-9 shrink-0 px-3 text-xs ${example.tone === "negative" ? "text-negative" : example.tone === "neutral" ? "text-neutral" : "text-positive"}`}>{example.tone === "negative" ? <TrendingDown className="size-4" /> : example.tone === "neutral" ? <MinusCircle className="size-4" /> : <CheckCircle2 className="size-4" />}{example.label}</Button>)}</div></div>

            {status === "error" && <div role="alert" className="mt-3 flex items-center gap-2 rounded-md border-2 border-negative bg-negative/10 px-3 py-2 text-sm font-semibold text-negative"><AlertCircle className="size-5 shrink-0" />कृपया review लिखें — input empty है.</div>}

            <div className="mt-5 flex gap-3"><Button onClick={analyze} disabled={status === "loading"} className="min-w-32">{status === "loading" && <span className="size-4 animate-spin-fast rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />} {status === "loading" ? "Analyzing…" : "Analyze"}</Button><Button variant="secondary" onClick={clear}>Clear</Button></div>
          </section>

          <ResultPanel status={status} model={model} />
        </div>
      </div>
    </main>
  );
}

function ResultPanel({ status, model }: { status: "empty" | "loading" | "result" | "error"; model: string }) {
  if (status !== "result") {
    return <section className="flex min-h-80 flex-col items-center justify-center border-2 border-foreground bg-secondary p-8 text-center shadow-[6px_6px_0_var(--ink)]"><div className="mb-4 grid size-16 place-items-center rounded-full border-2 border-foreground bg-accent text-2xl font-bold">{status === "loading" ? <span className="size-7 animate-spin-fast rounded-full border-3 border-foreground/25 border-t-foreground" /> : "अ"}</div><h2 className="font-display text-2xl">{status === "loading" ? "भाव पढ़ रहे हैं…" : "Result यहाँ दिखेगा"}</h2><p className="mt-2 max-w-sm text-sm font-medium text-muted-foreground">{status === "loading" ? "Model review के शब्दों और tone को analyze कर रहा है." : "Review लिखकर Analyze दबाएँ. Confidence और सभी class probabilities यहीं मिलेंगी."}</p></section>;
  }

  const bars = [
    { label: "Negative · नकारात्मक", value: 7, color: "bg-negative", text: "text-negative", icon: <TrendingDown className="size-4" /> },
    { label: "Neutral · तटस्थ", value: 11, color: "bg-neutral", text: "text-neutral", icon: <MinusCircle className="size-4" /> },
    { label: "Positive · सकारात्मक", value: 82, color: "bg-positive", text: "text-positive", icon: <CheckCircle2 className="size-4" /> },
  ];

  return <section className="border-2 border-foreground bg-card p-5 shadow-[6px_6px_0_var(--ink)] md:p-6"><p className="text-sm font-bold text-muted-foreground">02 / SENTIMENT RESULT</p><div className="mt-4 flex items-center gap-4 border-b-2 border-foreground pb-5"><div className="grid size-16 shrink-0 place-items-center rounded-md bg-positive/15 text-positive"><CheckCircle2 className="size-9" /></div><div><h2 className="font-display text-3xl text-positive">Positive · सकारात्मक</h2><p className="mt-1 text-sm font-semibold">Confidence <span className="text-xl text-foreground">82%</span></p></div></div><div className="mt-6 space-y-5">{bars.map((bar) => <div key={bar.label}><div className={`mb-1.5 flex items-center justify-between text-sm font-bold ${bar.text}`}><span className="flex items-center gap-2">{bar.icon}{bar.label}</span><span>{bar.value}%</span></div><div className="h-3 overflow-hidden border border-foreground/30 bg-muted"><div className={`h-full animate-bar-fill ${bar.color}`} style={{ width: `${bar.value}%` }} /></div></div>)}</div><div className="mt-6 flex items-center justify-between rounded-md border-2 border-foreground bg-secondary px-4 py-3 text-sm font-bold"><span>Predicted by</span><span>{model}</span></div></section>;
}
