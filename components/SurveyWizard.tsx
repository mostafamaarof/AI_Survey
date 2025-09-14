"use client";
import { useState } from "react";
import { Question } from "@/types";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface SurveyWizardProps {
  questions: Question[];
  onSubmit: (values: Record<string, string | string[]>) => void;
}

export default function SurveyWizard({ questions, onSubmit }: SurveyWizardProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [error, setError] = useState("");

  const q = questions[step];

  const handleChange = (value: string | string[]) => {
    setAnswers({ ...answers, [q.id]: value });
    setError(""); // clear error once answered
  };

  const next = () => {
    if (!answers[q.id] || (Array.isArray(answers[q.id]) && answers[q.id].length === 0)) {
      setError("⚠️ Please answer before continuing.");
      return;
    }
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      onSubmit(answers);
    }
  };

  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  const progress = Math.round(((step + 1) / questions.length) * 100);

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-md">
      {/* Progress Bar */}
      <Progress value={progress} className="mb-6" />
      <h2 className="text-xl font-semibold mb-4">
        Question {step + 1} of {questions.length}
      </h2>
      <p className="text-lg font-medium mb-6">{q.text}</p>

      {/* Render Inputs */}
      {q.qtype === "text" && (
        <input
          type="text"
          onChange={(e) => handleChange(e.target.value)}
          value={(answers[q.id] as string) || ""}
          className="w-full border p-3 rounded-lg focus:ring focus:ring-blue-400"
        />
      )}

      {q.qtype === "longtext" && (
        <textarea
          onChange={(e) => handleChange(e.target.value)}
          value={(answers[q.id] as string) || ""}
          className="w-full border p-3 rounded-lg focus:ring focus:ring-blue-400"
          rows={5}
        />
      )}

      {q.qtype === "single" &&
        q.options?.map((opt) => (
          <label key={opt} className="block mb-2">
            <input
              type="radio"
              name={q.id}
              value={opt}
              checked={answers[q.id] === opt}
              onChange={(e) => handleChange(e.target.value)}
              className="mr-2"
            />
            {opt}
          </label>
        ))}

      {q.qtype === "multi" &&
        q.options?.map((opt) => (
          <label key={opt} className="block mb-2">
            <input
              type="checkbox"
              value={opt}
              checked={(answers[q.id] as string[])?.includes(opt)}
              onChange={(e) => {
                const current = (answers[q.id] as string[]) || [];
                if (e.target.checked) {
                  handleChange([...current, opt]);
                } else {
                  handleChange(current.filter((o) => o !== opt));
                }
              }}
              className="mr-2"
            />
            {opt}
          </label>
        ))}

      {q.qtype === "number" && (
        <input
          type="number"
          onChange={(e) => handleChange(e.target.value)}
          value={(answers[q.id] as string) || ""}
          className="w-full border p-3 rounded-lg focus:ring focus:ring-blue-400"
        />
      )}

      {/* Error Message */}
      {error && <p className="text-red-500 mt-2">{error}</p>}

      {/* Navigation Buttons */}
      <div className="mt-6 flex justify-between">
        <Button onClick={prev} disabled={step === 0} variant="outline">
          ← Back
        </Button>
        <Button onClick={next} className="bg-blue-600 hover:bg-blue-700">
          {step === questions.length - 1 ? "Submit" : "Next →"}
        </Button>
      </div>
    </div>
  );
}
