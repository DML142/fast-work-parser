import { useCallback, useEffect, useRef, useState } from 'react';
import { JobCard } from '../components/JobCard';
import { ApiError, getJobs, getParseStatus, triggerParse } from '../api';
import type { Job, ParseStatus } from '../types';
import './FeedScreen.css';

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

  const cooldownActive = (parseStatus?.cooldownRemainingSeconds ?? 0) > 0;

  const wasCoolingDownRef = useRef(false);

  useEffect(() => {
    if (cooldownActive) {
      wasCoolingDownRef.current = true;
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
    }
    if (wasCoolingDownRef.current) {
      wasCoolingDownRef.current = false;
      loadParseStatus();
      loadJobs();
    }
  }, [cooldownActive, loadParseStatus, loadJobs]);

  // A run can outlast the fixed cooldown window (hh.ru in particular fetches
  // sequentially and can be slow), so keep polling for progress while either
  // the cooldown or the pipeline itself is still active.
  const parsingActive = cooldownActive || (parseStatus?.parsing ?? false);
  const sourcesActivity = parseStatus?.sources ?? [];

  useEffect(() => {
    if (!parsingActive) {
      return;
    }
    const timer = setInterval(loadParseStatus, 2000);
    return () => clearInterval(timer);
  }, [parsingActive, loadParseStatus]);

  const handleParse = () => {
    setParseError(null);
    setTriggering(true);
    triggerParse()
      .then((status) => {
        setParseStatus(status);
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 429) {
          const body = error.body as
            | { cooldownRemainingSeconds?: number }
            | null;
          setParseStatus((current) => ({
            lastParsedAt: current?.lastParsedAt ?? null,
            cooldownRemainingSeconds: body?.cooldownRemainingSeconds ?? 60,
            parsing: current?.parsing ?? false,
            sources: current?.sources ?? [],
          }));
        } else {
          setParseError('Could not start a parse run.');
        }
      })
      .finally(() => setTriggering(false));
  };

  return (
    <div className="feed-screen">
      <header className="feed-screen__header">
        <div className="feed-screen__parse-row">
          <button
            type="button"
            className="feed-screen__parse-button"
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
        <button
          type="button"
          className="feed-screen__filters-button"
          onClick={onOpenFilters}
          aria-label="Filters"
        >
          ⚙
        </button>
      </header>
      {parsingActive && sourcesActivity.length > 0 && (
        <ul className="feed-screen__activity">
          {sourcesActivity.map((entry) => (
            <li key={entry.source} className="feed-screen__activity-item">
              <span className="feed-screen__activity-source">
                {entry.source}
              </span>
              <span className="feed-screen__activity-detail">
                {entry.status === 'failed'
                  ? 'failed'
                  : entry.status === 'fetching'
                    ? entry.jobCount > 0
                      ? `${entry.jobCount} so far…`
                      : 'fetching…'
                    : `${entry.jobCount} job${entry.jobCount === 1 ? '' : 's'}${
                        entry.lastJobTitle ? ` — ${entry.lastJobTitle}` : ''
                      }`}
              </span>
            </li>
          ))}
        </ul>
      )}
      {authError && (
        <p className="feed-screen__auth-error">Open this from Telegram.</p>
      )}
      {!authError && loadError && (
        <div className="feed-screen__error">
          <p>Could not load jobs.</p>
          <button
            type="button"
            className="feed-screen__retry-button"
            onClick={loadJobs}
          >
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
