import SurveyWizard from "@/components/SurveyWizard";

export default function SurveyPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          AI Survey
        </h1>
        <p className="text-gray-600 text-center mb-10">
          Please answer all questions. Your responses are required before
          continuing. Some questions may ask for extra details if you answer
          "Yes".
        </p>

        <SurveyWizard />
      </div>
    </main>
  );
}
