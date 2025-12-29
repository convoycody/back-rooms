import React, { useState } from 'react';
import { AlertTriangle, Check, Clipboard } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { useGlobalErrorCapture } from '@/hooks/useGlobalErrorCapture';
import { cn } from '@/utils';

const ErrorReportButton = ({ label, onClick, loading }) => (
  <button
    onClick={onClick}
    disabled={loading}
    className={cn(
      'inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
      loading
        ? 'bg-slate-700/60 text-slate-300 cursor-not-allowed'
        : 'bg-amber-500/90 text-black hover:bg-amber-400',
    )}
  >
    {loading ? 'Submitting…' : label}
  </button>
);

export default function GlobalErrorReporter() {
  const { latestError, clear } = useGlobalErrorCapture();
  const [submitting, setSubmitting] = useState(false);
  const [lastErrorId, setLastErrorId] = useState(null);

  if (!latestError) return null;

  const submitReport = async () => {
    try {
      setSubmitting(true);
      setLastErrorId(null);

      const payload = {
        error_type: latestError.context?.source || 'frontend_error',
        error_message: latestError.message || 'Unknown error',
        error_stack: latestError.stack || '',
        page_url: window.location.href,
        additional_data: latestError.context || {},
      };

      const result = await base44.functions.invoke('logError', payload);
      const errorId = result?.error_id || 'unknown';
      setLastErrorId(errorId);
      toast.success(`Error reported. ID: ${errorId}`);
    } catch (err) {
      console.error('Failed to submit error report', err);
      toast.error('Could not submit error report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyId = () => {
    if (!lastErrorId) return;
    navigator.clipboard.writeText(lastErrorId).catch(() => {});
    toast.success('Error ID copied');
  };

  return (
    <div className="fixed bottom-4 right-4 w-full max-w-md shadow-lg rounded-lg border border-slate-800 bg-slate-900/95 backdrop-blur z-50 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-amber-400">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-white">We hit a snag</p>
            <button
              onClick={clear}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Dismiss
            </button>
          </div>
          <p className="text-xs text-slate-300 mt-1 line-clamp-3">
            {latestError.message || 'An unexpected error occurred.'}
          </p>
          {latestError.stack ? (
            <details className="mt-2">
              <summary className="text-xs text-slate-400 cursor-pointer">Details</summary>
              <pre className="mt-1 max-h-24 overflow-auto text-[11px] text-slate-300 whitespace-pre-wrap">
                {latestError.stack}
              </pre>
            </details>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <ErrorReportButton
              label="Submit report"
              onClick={submitReport}
              loading={submitting}
            />
            {lastErrorId ? (
              <button
                onClick={copyId}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-slate-800 text-slate-200 hover:bg-slate-700"
              >
                <Clipboard className="w-3 h-3" />
                Copy ID
              </button>
            ) : null}
            {lastErrorId ? (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-300">
                <Check className="w-3 h-3" /> ID: {lastErrorId}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
