// app/page.tsx
"use client";
import { useState, useRef, useCallback } from "react";

const MAX_FILE_SIZE = 50 * 1024; // 50 KB

export default function RagDemo() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const [uploadStatus, setUploadStatus] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [resetStatus, setResetStatus] = useState("");
  const [resetting, setResetting] = useState(false);

  const pollIngestStatus = useCallback((filename: string, sizeKB: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/ingest-status");
        const data = await res.json();
        if (data.status === "completed") {
          clearInterval(interval);
          setUploadStatus(
            `Ingestion completed. You can now query the contents of "${filename}".`
          );
        } else if (data.status === "failed") {
          clearInterval(interval);
          setUploadStatus("Ingestion failed. Please try uploading again.");
        }
      } catch {
        clearInterval(interval);
      }
    }, 2000);
  }, []);

  async function ask() {
    if (!question.trim()) return;
    setAnswer("");
    setLoading(true);

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
      setLoading(false);
    }
  }

  async function handleUpload() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setUploadStatus("Please select a file.");
      return;
    }

    if (!file.name.endsWith(".md")) {
      setUploadStatus("Only .md files are allowed.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setUploadStatus(`File exceeds the ${MAX_FILE_SIZE / 1024}KB size limit.`);
      return;
    }

    setUploading(true);
    setUploadStatus("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setUploadStatus(data.detail || "Upload failed.");
      } else {
        const sizeKB = (data.size / 1024).toFixed(1);
        setUploadStatus(
          `Uploaded "${data.filename}" (${sizeKB}KB). Ingestion started...`
        );
        if (fileInputRef.current) fileInputRef.current.value = "";
        pollIngestStatus(data.filename, sizeKB);
      }
    } catch {
      setUploadStatus("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleReset() {
    if (!confirm("This will archive all documents and clear the knowledge base. Continue?")) {
      return;
    }

    setResetting(true);
    setResetStatus("");

    try {
      const res = await fetch("/api/reset", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setResetStatus("Reset failed. Please try again.");
      } else {
        const count = data.archived?.length ?? 0;
        setResetStatus(
          `Reset complete. ${count} document${count !== 1 ? "s" : ""} moved to archive. Knowledge base is now empty.`
        );
        setUploadStatus("");
      }
    } catch {
      setResetStatus("Reset failed. Please try again.");
    } finally {
      setResetting(false);
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
        {loading ? "Thinking..." : "Ask"}
      </button>
      {answer && (
        <div className="mt-6 prose">
          <p>{answer}</p>
        </div>
      )}

      <hr className="my-10 border-gray-300" />

      <section>
        <h2 className="text-xl font-medium mb-4">Import Document</h2>
        <p className="text-sm text-gray-500 mb-3">
          Upload a Markdown (.md) file (max 50KB) to add it to the knowledge base.
        </p>
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".md"
            className="block text-sm file:mr-3 file:py-2 file:px-4
              file:rounded file:border-0 file:bg-gray-100
              file:text-gray-700 hover:file:bg-gray-200"
          />
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="bg-black text-white px-5 py-2 rounded"
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>
        {uploadStatus && (
          <p className="mt-3 text-sm text-gray-700">{uploadStatus}</p>
        )}
      </section>

      <hr className="my-10 border-gray-300" />

      <section>
        <h2 className="text-xl font-medium mb-4">Reset Knowledge Base</h2>
        <p className="text-sm text-gray-500 mb-3">
          Archive all documents and clear the vectorized database.
        </p>
        <button
          onClick={handleReset}
          disabled={resetting}
          className="bg-red-600 text-white px-5 py-2 rounded hover:bg-red-700"
        >
          {resetting ? "Resetting..." : "Reset Database"}
        </button>
        {resetStatus && (
          <p className="mt-3 text-sm text-gray-700">{resetStatus}</p>
        )}
      </section>
    </main>
  );
}