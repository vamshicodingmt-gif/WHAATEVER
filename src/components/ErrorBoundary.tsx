import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';
import { STORAGE_KEYS } from '@/lib/storage';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * ErrorBoundary — last line of defence.
 *
 * A client-side app owns its own failure modes, so instead of a blank white page
 * WHAATEVER shows a brutalist crash card that lets the visitor keep their data
 * and retry, or clear the local feed if a corrupted payload caused the crash.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Deliberately local-only logging: WHAATEVER has no telemetry endpoint.
    // eslint-disable-next-line no-console
    console.error('[WHAATEVER] render error', error, info.componentStack);
  }

  private handleRetry = (): void => {
    this.setState({ error: null });
  };

  private handleResetFeed = (): void => {
    try {
      window.localStorage.removeItem(STORAGE_KEYS.posts);
    } catch {
      /* storage may be unavailable — a reload is still worth trying */
    }
    window.location.reload();
  };

  render(): ReactNode {
    const { error } = this.state;

    if (!error) return this.props.children;

    return (
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-4 py-10">
        <div className="border-4 border-black bg-white p-6 shadow-brutal-2xl">
          <p className="badge badge-ink">
            <AlertOctagon size={10} strokeWidth={3} aria-hidden /> Client-side crash
          </p>
          <h1 className="mt-3 font-display text-3xl uppercase leading-none tracking-tight sm:text-4xl">
            Something broke on this device
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            WHAATEVER runs entirely in your browser, so this error is local — nothing was lost on a server, because there
            is no server. Retry first; if the crash repeats, your stored feed may contain a corrupted entry and can be
            cleared.
          </p>

          <pre className="mt-4 max-h-40 overflow-auto border-3 border-black bg-beige p-3 text-[11px] leading-relaxed text-ink-soft">
            {error.message}
          </pre>

          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={this.handleRetry} className="btn btn-cobalt">
              <RotateCcw size={15} strokeWidth={3} aria-hidden /> Try again
            </button>
            <button type="button" onClick={this.handleResetFeed} className="btn btn-danger">
              Clear local feed &amp; reload
            </button>
          </div>
        </div>
      </main>
    );
  }
}
