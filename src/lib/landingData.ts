export type LandingSection = "services" | "shop-info";

type FailureListener = (failed: LandingSection[]) => void;
type RetryListener = () => void;

const failedSections = new Set<LandingSection>();
const failureListeners = new Set<FailureListener>();
const retryListeners = new Set<RetryListener>();

export function reportLandingLoad(section: LandingSection, ok: boolean) {
  if (ok) {
    failedSections.delete(section);
  } else {
    failedSections.add(section);
  }
  const snapshot = Array.from(failedSections);
  failureListeners.forEach((listener) => listener(snapshot));
}

export function subscribeLandingFailures(listener: FailureListener): () => void {
  failureListeners.add(listener);
  listener(Array.from(failedSections));
  return () => {
    failureListeners.delete(listener);
  };
}

export function requestLandingRetry() {
  retryListeners.forEach((listener) => listener());
}

export function subscribeLandingRetry(listener: RetryListener): () => void {
  retryListeners.add(listener);
  return () => {
    retryListeners.delete(listener);
  };
}