import { ChevronDown } from "lucide-react";

export const classicalModels = [
  ["SVM", "92.4%"],
  ["Logistic Regression", "89.1%"],
  ["Naive Bayes", "86.7%"],
  ["Decision Tree", "83.2%"],
] as const;

export function ModelSelect({ value, onChange, id = "model" }: { value: string; onChange: (value: string) => void; id?: string }) {
  return (
    <label className="block" htmlFor={id}>
      <span className="mb-1.5 block text-sm font-bold">Model · मॉडल</span>
      <span className="relative block">
        <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full appearance-none rounded-md border-2 border-foreground bg-background px-3 pr-9 text-sm font-semibold outline-none focus:ring-2 focus:ring-ring">
          {classicalModels.map(([name, accuracy]) => <option key={name} value={name}>{name} — {accuracy} accuracy</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-3 size-5" />
      </span>
    </label>
  );
}