"use client";

import { useEffect, useState } from "react";

function formatRemaining(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function CountdownTimer({
  expiresAt,
  onExpire,
}: {
  expiresAt: string;
  onExpire: () => void;
}) {
  const [remainingMs, setRemainingMs] = useState(() => new Date(expiresAt).getTime() - Date.now());
  const expired = remainingMs <= 0;

  useEffect(() => {
    if (expired) {
      onExpire();
      return;
    }

    const interval = setInterval(() => {
      setRemainingMs(new Date(expiresAt).getTime() - Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, expired, onExpire]);

  return (
    <span
      className={`rounded-full px-3 py-1 text-sm font-medium ${
        remainingMs < 60_000 ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
      }`}
    >
      {formatRemaining(remainingMs)}
    </span>
  );
}
