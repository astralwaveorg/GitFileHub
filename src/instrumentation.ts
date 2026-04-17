// Next.js instrumentation: runs once when the server starts.
// In standalone mode, the server always runs Node.js runtime.

// Lazy scheduler initialization.
// Called from API routes (Node.js runtime only) on first request.
let _schedulerStarted = false;

export function ensureSchedulerStarted() {
  if (_schedulerStarted) return;
  _schedulerStarted = true;

  import('@/lib/scheduler').then(({ startScheduler }) => {
    startScheduler()
      .then(() => console.log('[GitFileDock] Scheduler started successfully'))
      .catch((err: unknown) => console.error('[GitFileDock] Failed to start scheduler:', err));
  });
}
