"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type Question = {
  id: string;
  text: string;
  type: "text" | "radio";
  required?: boolean;
  options?: string[];
  conditional?: { value: string; followupId: string; followupText: string };
};

const questions: Question[] = [
  {
    id: "ai_unit",
    text: "Does your SAI have a dedicated AI unit?",
    type: "radio",
    required: true,
    options: ["Yes", "No"],
    conditional: {
      value: "Yes",
      followupId: "ai_unit_details",
      followupText: "If yes, please describe its functions",
    },
  },
  {
    id: "rpa_tools",
    text: "Do you use RPA tools?",
    type: "radio",
    required: true,
    options: ["Yes", "No"],
    conditional: {
      value: "Yes",
      followupId: "rpa_details",
      followupText: "If yes, please describe the processes being automated",
    },
  },
  {
    id: "challenges",
    text: "What are the biggest challenges your SAI faces with AI?",
    type: "text",
    required: true,
  },
];

export default function SurveyWizard() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const currentQuestion = questions[step];
  const progress = ((step + 1) / questions.length) * 100;

  const handleChange = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => ({ ...prev, [id]: "" }));
  };

  const validateStep = (): boolean => {
    let valid = true;
    let stepErrors: Record<string, string> = {};

    if (currentQuestion.required && !answers[currentQuestion.id]) {
      stepErrors[currentQuestion.id] = "This question is required";
      valid = false;
    }

    if (
      currentQuestion.conditional &&
      answers[currentQuestion.id] === currentQuestion.conditional.value &&
      !answers[currentQuestion.conditional.followupId]
    ) {
      stepErrors[currentQuestion.conditional.followupId] =
        "This field is required";
      valid = false;
    }

    setErrors(stepErrors);
    return valid;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => setStep((s) => s - 1);

  const handleSubmit = () => {
    if (validateStep()) {
      console.log("Survey responses:", answers);
      alert("Thank you for completing the survey!");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <Progress value={progress} className="mb-6" />
      <h2 className="text-xl font-semibold mb-4">
        Question {step + 1} of {questions.length}
      </h2>

      <div className="mb-6">
        <p className="mb-3 font-medium">
          {currentQuestion.text}{" "}
          {currentQuestion.required && <span className="text-red-500">*</span>}
        </p>

        {currentQuestion.type === "radio" &&
          currentQuestion.options?.map((opt) => (
            <label key={opt} className="block mb-2">
              <input
                type="radio"
                name={currentQuestion.id}
                value={opt}
                checked={answers[currentQuestion.id] === opt}
                onChange={(e) => handleChange(currentQuestion.id, e.target.value)}
                className="mr-2"
              />
              {opt}
            </label>
          ))}

        {currentQuestion.type === "text" && (
          <textarea
            className="w-full border rounded p-2"
            value={answers[currentQuestion.id] || ""}
            onChange={(e) => handleChange(currentQuestion.id, e.target.value)}
          />
        )}

        {errors[currentQuestion.id] && (
          <p className="text-red-500 text-sm mt-1">
            {errors[currentQuestion.id]}
          </p>
        )}

        {currentQuestion.conditional &&
          answers[currentQuestion.id] ===
            currentQuestion.conditional.value && (
            <div className="mt-4">
              <p className="mb-2">
                {currentQuestion.conditional.followupText}{" "}
                <span className="text-red-500">*</span>
              </p>
              <textarea
                className="w-full border rounded p-2"
                value={
                  answers[currentQuestion.conditional.followupId] || ""
                }
                onChange={(e) =>
                  handleChange(
                    currentQuestion.conditional!.followupId,
                    e.target.value
                  )
                }
              />
              {errors[currentQuestion.conditional.followupId] && (
                <p className="text-red-500 text-sm mt-1">
                  {errors[currentQuestion.conditional.followupId]}
                </p>
              )}
            </div>
          )}
      </div>

      <div className="flex justify-between">
        {step > 0 && (
          <Button variant="secondary" onClick={handleBack}>
            Back
          </Button>
        )}
        {step < questions.length - 1 ? (
          <Button onClick={handleNext}>Next</Button>
        ) : (
          <Button onClick={handleSubmit}>Submit</Button>
        )}
      </div>
    </div>
  );
}
