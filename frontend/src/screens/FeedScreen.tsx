import { useCallback, useEffect, useState } from 'react';
import { JobCard } from '../components/JobCard';
import { ApiError, getJobs, getParseStatus, triggerParse } from '../api';
import type { Job, ParseStatus } from '../types';

function formatLastParsed(lastParsedAt: string | null): string {
  if (!lastParsedAt) {
    return 'never';
  }
  const elapsedMs = Date.now() - new Date(lastParsedAt).getTime();
  const minutes = Math.max(0, Math.round(elapsedMs / 60_000));
  if (minutes < 1) {
    return 'just now';
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.round(minutes / 60);
  return `${hours}h ago`;
}

export interface FeedScreenProps {
  onSelectJob: (job: Job) => void;
  onOpenFilters: () => void;
}

export function FeedScreen({ onSelectJob, onOpenFilters }: FeedScreenProps) {
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [parseStatus, setParseStatus] = useState<ParseStatus | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [triggering, setTriggering] = useState(false);

  const loadJobs = useCallback(() => {
    setLoadError(false);
    setAuthError(false);
    getJobs()
      .then(setJobs)
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 401) {
          setAuthError(true);
        } else {
          setLoadError(true);
        }
      });
  }, []);

  const loadParseStatus = useCallback(() => {
    getParseStatus()
      .then(setParseStatus)
      .catch(() => {
        // Countdown/caption just stays stale; not worth a second error UI.
      });
  }, []);

  useEffect(() => {
    loadJobs();
    loadParseStatus();
  }, [loadJobs, loadParseStatus]);

  useEffect(() => {
    if (!parseStatus || parseStatus.cooldownRemainingSeconds <= 0) {
      return;
    }
    const timer = setInterval(() => {
      setParseStatus((current) =>
        current
          ? {
              ...current,
              cooldownRemainingSeconds: Math.max(
                0,
                current.cooldownRemainingSeconds - 1,
              ),
            }
          : current,
      );
    }, 1000);
    return () => clearInterval(timer);
  }, [parseStatus]);

  const handleParse = () => {
    setParseError(null);
    setTriggering(true);
    triggerParse()
      .then((status) => {
        setParseStatus(status);
        loadJobs();
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 429) {
          const body = error.body as
            | { cooldownRemainingSeconds?: number }
            | null;
          setParseStatus((current) => ({
            lastParsedAt: current?.lastParsedAt ?? null,
            cooldownRemainingSeconds: body?.cooldownRemainingSeconds ?? 60,
          }));
        } else {
          setParseError('Could not start a parse run.');
        }
      })
      .finally(() => setTriggering(false));
  };

  const cooldownActive = (parseStatus?.cooldownRemainingSeconds ?? 0) > 0;

  return (
    <div className="feed-screen">
      <header className="feed-screen__header">
        <div>
          <button
            type="button"
            onClick={handleParse}
            disabled={triggering || cooldownActive}
          >
            {cooldownActive
              ? `Parse in ${parseStatus?.cooldownRemainingSeconds}s`
              : 'PARSE NOW'}
          </button>
          <span className="feed-screen__last-parsed">
            last parsed {formatLastParsed(parseStatus?.lastParsedAt ?? null)}
          </span>
          {parseError && (
            <span className="feed-screen__parse-error">{parseError}</span>
          )}
        </div>
        <button type="button" onClick={onOpenFilters} aria-label="Filters">
          ⚙
        </button>
      </header>
      {authError && (
        <p className="feed-screen__auth-error">Open this from Telegram.</p>
      )}
      {!authError && loadError && (
        <div className="feed-screen__error">
          <p>Could not load jobs.</p>
          <button type="button" onClick={loadJobs}>
            Retry
          </button>
        </div>
      )}
      {!authError && !loadError && jobs === null && <p>Loading…</p>}
      {!authError && !loadError && jobs !== null && (
        <div className="feed-screen__list">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} onSelect={onSelectJob} />
          ))}
        </div>
      )}
    </div>
  );
}
