"use client";

import { upload } from "@vercel/blob/client";
import { useRef, useState } from "react";

const ACCEPTED_TYPES = ".pdf,.doc,.docx,.txt";
const MAXIMUM_SIZE = 25 * 1024 * 1024;

type Props = {
  matterId?: string | null;
  compact?: boolean;
  onUploaded?: () => void;
};

function UploadIcon() {
  return (
    <svg className="upload-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 14V3M6 7l4-4 4 4M3 12v4h14v-4" />
    </svg>
  );
}

export function DocumentUpload({ matterId = null, compact = false, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");

  async function uploadFile(file: File) {
    if (file.size > MAXIMUM_SIZE) {
      setMessage("Choose a file smaller than 25 MB.");
      return;
    }
    setUploading(true);
    setProgress(0);
    setMessage("");
    try {
      await upload(`documents/${crypto.randomUUID()}-${file.name}`, file, {
        access: "private",
        handleUploadUrl: "/api/documents/upload",
        clientPayload: JSON.stringify({ matterId }),
        multipart: file.size > 5 * 1024 * 1024,
        onUploadProgress: ({ percentage }) => setProgress(Math.round(percentage)),
      });
      setMessage("Upload complete. Your document is private to this account.");
      window.setTimeout(() => onUploaded?.(), 900);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={compact ? "document-upload compact" : "document-upload"}>
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept={ACCEPTED_TYPES}
        disabled={uploading}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void uploadFile(file);
        }}
      />
      <button type="button" disabled={uploading} onClick={() => inputRef.current?.click()} aria-label="Upload a private document" title={compact ? "Upload document" : undefined}>
        {compact ? <UploadIcon /> : uploading ? `Uploading ${progress}%` : "Choose document"}
      </button>
      {compact ? null : <small>PDF, DOC, DOCX or TXT · up to 25 MB · private to your account</small>}
      {message ? <p role="status">{message}</p> : null}
    </div>
  );
}
