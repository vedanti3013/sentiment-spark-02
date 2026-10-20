import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

const API_BASE = "http://127.0.0.1:8000";

const fallbackModels = [
  ["SVM", "74.32%"],
  ["Logistic Regression", "71.04%"],
] as const;

export function ModelSelect({ value, onChange, id = "model" }: { value: string; onChange: (value: string) => void; id?: string }) {
  const [models, setModels] = useState<readonly (readonly [string, string])[]>(fallbackModels);

  useEffect(() => {
    let cancelled = false;

    async function loadModels() {
      try {
        const response = await fetch(`${API_BASE}/api/models`);
        if (!response.ok) throw new Error(`Models request failed: ${response.status}`);

        const data: { models: Array<{ name: string; accuracy: number | null }> } =
          await response.json();
        const apiModels = data.models
          .filter((model) => model.name === "SVM" || model.name === "Logistic Regression")
          .filter((model) => typeof model.accuracy === "number")
          .map((model) => [model.name, `${(model.accuracy * 100).toFixed(2)}%`] as const);

        if (!cancelled && apiModels.length > 0) {
          setModels(apiModels);
        }
      } catch {
        // Keep the known classic-model options when the backend is unavailable.
      }
    }

    void loadModels();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <label className="block" htmlFor={id}>
      <span className="mb-1.5 block text-sm font-bold">Model · मॉडल</span>
      <span className="relative block">
        <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full appearance-none rounded-md border-2 border-foreground bg-background px-3 pr-9 text-sm font-semibold outline-none focus:ring-2 focus:ring-ring">
          {models.map(([name, accuracy]) => <option key={name} value={name}>{name} — {accuracy} accuracy</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-3 size-5" />
      </span>
    </label>
  );
}