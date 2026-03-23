// app/page.tsx
"use client";
import { useState } from "react";

export default function RagDemo() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

async function ask() {
  if (!question.trim()) return;
  setAnswer("");
  setLoading(true);

  const reader = null;
  try {
    const res = await fetch("/api/query", {
      method: "POST",
      body: JSON.stringify({ question }),
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) throw new Error(`Server error: ${res.status}`);

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value).replace(/^data: /gm, "");
      setAnswer((prev) => prev + text);
    }
  } catch (err) {
    setAnswer("Something went wrong. Please try again.");
    console.error(err);
  } finally {
    setLoading(false);  // always resets, even on error
  }
}


  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-medium mb-6">Docs Q&A</h1>
      <textarea
        className="w-full border rounded p-3 mb-4"
        rows={3}
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask anything about the docs..."
      />
      <button onClick={ask} disabled={loading}
        className="bg-black text-white px-5 py-2 rounded">
        {loading ? "Thinking…" : "Ask"}
      </button>
      {answer && (
        <div className="mt-6 prose">
          <p>{answer}</p>
        </div>
      )}
    </main>
  );
}
