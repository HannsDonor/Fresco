"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import {
  subscribeLandingFailures,
  requestLandingRetry,
  type LandingSection,
} from "@/lib/landingData";

export default function DataLoadBanner() {
  const [failed, setFailed] = useState<LandingSection[]>([]);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => subscribeLandingFailures(setFailed), []);

  if (failed.length === 0) return null;

  function handleRetry() {
    setRetrying(true);
    requestLandingRetry();
    window.setTimeout(() => setRetrying(false), 1200);
  }

  return (
    <div className="border-b border-amber-200 bg-amber-50">
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="flex items-start gap-2.5 text-sm font-medium text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          Some content couldn&apos;t load. Check your connection and try again.
        </p>
        <button
          type="button"
          onClick={handleRetry}
          disabled={retrying}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-600 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${retrying ? "animate-spin" : ""}`} />
          Retry
        </button>
      </div>
    </div>
  );
}