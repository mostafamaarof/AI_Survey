"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type Question = {
  id: number;
  text: string;
  options: string[];
};

interface SurveyWizardProps {
  questions: Question[];
  onSubmit: (answers: Record<number, string>) => void;
}

export default function SurveyWizard({ questions, onSubmit }: SurveyWizardProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const currentQuestion = questions[step];
  const totalSteps = questions.length;

  const handleSelect = (option: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: option }));
  };

  const handleNext = () => {
    if (!answers[currentQuestion.id]) return; // prevent skipping
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      onSubmit(answers);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-md">
      {/* Progress bar */}
      <div className="mb-6">
        <Progress value={((step + 1) / totalSteps) * 100} />
        <p className="text-sm text-gray-500 mt-2">
          Step {step + 1} of {totalSteps}
        </p>
      </div>

      {/* Question */}
      <h2 className="text-xl font-semibold mb-4">{currentQuestion.text}</h2>

      {/* Options as cards */}
      <div className="grid gap-3">
        {currentQuestion.options.map((option) => (
          <button
            key={option}
            onClick={() => handleSelect(option)}
            className={`p-4 border rounded-xl text-left transition 
              ${
                answers[currentQuestion.id] === option
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-gray-50 hover:bg-gray-100 border-gray-300"
              }`}
          >
            {option}
          </button>
        ))}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={handleBack} disabled={step === 0}>
          ← Back
        </Button>
        <Button onClick={handleNext} disabled={!answers[currentQuestion.id]}>
          {step === totalSteps - 1 ? "Submit" : "Next →"}
        </Button>
      </div>
    </div>
  );
}
