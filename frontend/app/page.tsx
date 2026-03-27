// app/page.tsx
"use client";
import { useState, useRef, useCallback, useEffect } from "react";

const MAX_FILE_SIZE = 50 * 1024; // 50 KB

interface DocEntry {
  filename: string;
  title: string;
}

export default function RagDemo() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const [uploadStatus, setUploadStatus] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [resetStatus, setResetStatus] = useState("");
  const [resetting, setResetting] = useState(false);

  const [documents, setDocuments] = useState<DocEntry[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      setDocuments(data.documents ?? []);
    } catch {
      setDocuments([]);
    } finally {
      setDocsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const pollIngestStatus = useCallback((filename: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/ingest-status");
        const data = await res.json();
        if (data.status === "completed") {
          clearInterval(interval);
          setUploadStatus(
            `Ingestion completed. You can now query the contents of "${filename}".`
          );
          fetchDocuments();
        } else if (data.status === "failed") {
          clearInterval(interval);
          setUploadStatus("Ingestion failed. Please try uploading again.");
        }
      } catch {
        clearInterval(interval);
      }
    }, 2000);
  }, [fetchDocuments]);

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
        pollIngestStatus(data.filename);
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
        fetchDocuments();
      }
    } catch {
      setResetStatus("Reset failed. Please try again.");
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-72 shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Zm3.75 11.625a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
              </svg>
            </div>
            <span className="font-semibold text-gray-900 text-lg">Docs Q&A</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            Knowledge Base
          </h3>
          {docsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-9 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
              <p className="text-sm text-gray-400 leading-relaxed">
                No context available.<br />Please upload a document.
              </p>
            </div>
          ) : (
            <ul className="space-y-1.5">
              {documents.map((doc) => (
                <li
                  key={doc.filename}
                  className="flex items-center gap-2.5 text-sm text-gray-700 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
                  title={doc.filename}
                >
                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                  <span className="truncate">{doc.title}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-5 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">
            {documents.length} document{documents.length !== 1 ? "s" : ""} loaded
          </p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-5">
          <h1 className="text-xl font-semibold text-gray-900">Ask a Question</h1>
          <p className="text-sm text-gray-500 mt-1">
            Query your documentation using natural language
          </p>
        </header>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-8 py-8 space-y-8">
            {/* Query section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <textarea
                className="w-full border border-gray-200 rounded-lg p-4 text-sm leading-relaxed
                  placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500
                  focus:border-transparent resize-none transition-shadow"
                rows={3}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask anything about the docs..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    ask();
                  }
                }}
              />
              <div className="flex justify-end mt-3">
                <button
                  onClick={ask}
                  disabled={loading || !question.trim()}
                  className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm
                    font-medium px-5 py-2.5 rounded-lg hover:bg-indigo-700
                    disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Thinking...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                      </svg>
                      Ask
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Answer */}
            {answer && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-gray-500">Answer</h3>
                </div>
                <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap break-words overflow-hidden">
                  {answer}
                </div>
              </div>
            )}

            {/* Management section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Upload card */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">Import Document</h2>
                    <p className="text-xs text-gray-400">Markdown files, max 50KB</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".md"
                    className="block w-full text-sm text-gray-500
                      file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0
                      file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700
                      hover:file:bg-gray-200 file:cursor-pointer file:transition-colors"
                  />
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="w-full bg-emerald-600 text-white text-sm font-medium
                      py-2.5 rounded-lg hover:bg-emerald-700 disabled:opacity-50
                      disabled:cursor-not-allowed transition-colors"
                  >
                    {uploading ? "Uploading..." : "Upload & Ingest"}
                  </button>
                </div>
                {uploadStatus && (
                  <p className="mt-3 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                    {uploadStatus}
                  </p>
                )}
              </div>

              {/* Reset card */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                    <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">Reset Knowledge Base</h2>
                    <p className="text-xs text-gray-400">Archive docs & clear vectors</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                  This will move all documents to the archive folder and delete the vectorized data.
                  This action cannot be undone.
                </p>
                <button
                  onClick={handleReset}
                  disabled={resetting}
                  className="w-full bg-white text-red-600 text-sm font-medium
                    py-2.5 rounded-lg border border-red-200 hover:bg-red-50
                    disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {resetting ? "Resetting..." : "Reset Everything"}
                </button>
                {resetStatus && (
                  <p className="mt-3 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                    {resetStatus}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
