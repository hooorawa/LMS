"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";

type UploadStatus = "idle" | "uploading" | "done" | "error";

export function FileUploader({
  courseId,
  name,
  label,
  accept,
  defaultKey,
  endpoint = "/api/uploads/sign",
  extraFields,
  onUploaded,
}: {
  courseId?: string;
  name: string;
  label: string;
  accept: string;
  defaultKey?: string;
  endpoint?: string;
  extraFields?: Record<string, string>;
  onUploaded?: (key: string) => void;
}) {
  const [status, setStatus] = useState<UploadStatus>(defaultKey ? "done" : "idle");
  const [key, setKey] = useState(defaultKey ?? "");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus("uploading");
    setError("");
    setFileName(file.name);

    try {
      const signRes = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...extraFields,
          courseId,
          fileName: file.name,
          contentType: file.type,
        }),
      });

      if (!signRes.ok) {
        const body = await signRes.json().catch(() => null);
        throw new Error(body?.error ?? "Could not prepare upload.");
      }

      const { uploadUrl, key: objectKey } = await signRes.json();

      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!putRes.ok) {
        throw new Error("Upload to storage failed.");
      }

      setKey(objectKey);
      setStatus("done");
      onUploaded?.(objectKey);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Upload failed.");
    }
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor={`${name}-file`}>{label}</Label>
      <input
        id={`${name}-file`}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium"
      />
      <input type="hidden" name={name} value={key} />
      {status === "uploading" ? (
        <p className="text-xs text-muted-foreground">Uploading {fileName}&hellip;</p>
      ) : null}
      {status === "done" && key ? (
        <p className="text-xs text-muted-foreground">
          Uploaded{fileName ? `: ${fileName}` : ""}
        </p>
      ) : null}
      {status === "error" ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
