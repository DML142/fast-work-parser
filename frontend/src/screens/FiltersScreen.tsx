import { useCallback, useEffect, useState } from 'react';
import { getFilters, updateFilters, updateSource } from '../api';
import { keywordsToText, textToKeywords } from '../keywordText';
import type { FiltersState } from '../types';

export interface FiltersScreenProps {
  onClose: () => void;
}

export function FiltersScreen({ onClose }: FiltersScreenProps) {
  const [filters, setFilters] = useState<FiltersState | null>(null);
  const [includeText, setIncludeText] = useState('');
  const [excludeText, setExcludeText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFilters = useCallback(() => {
    setError(null);
    getFilters()
      .then((loaded) => {
        setFilters(loaded);
        setIncludeText(keywordsToText(loaded.includeKeywords));
        setExcludeText(keywordsToText(loaded.excludeKeywords));
      })
      .catch(() => setError('Could not load filters.'));
  }, []);

  useEffect(() => {
    loadFilters();
  }, [loadFilters]);

  const toggleSource = (name: string, enabled: boolean) => {
    if (!filters) {
      return;
    }
    const previous = filters.sources;
    setFilters({
      ...filters,
      sources: filters.sources.map((source) =>
        source.name === name ? { ...source, enabled } : source,
      ),
    });
    updateSource(name, enabled).catch(() => {
      setFilters((current) =>
        current ? { ...current, sources: previous } : current,
      );
      setError('Could not update source.');
    });
  };

  const handleSave = () => {
    setSaving(true);
    setError(null);
    updateFilters({
      includeKeywords: textToKeywords(includeText),
      excludeKeywords: textToKeywords(excludeText),
    })
      .then(() => onClose())
      .catch(() => setError('Could not save filters.'))
      .finally(() => setSaving(false));
  };

  if (!filters) {
    if (error) {
      return (
        <div className="filters-screen__error">
          <p>{error}</p>
          <button type="button" onClick={loadFilters}>
            Retry
          </button>
        </div>
      );
    }
    return <p>Loading…</p>;
  }

  return (
    <div className="filters-screen">
      <h1>Filters</h1>
      {error && <p className="filters-screen__error">{error}</p>}
      <label>
        Include keywords (one per line)
        <textarea
          value={includeText}
          onChange={(event) => setIncludeText(event.target.value)}
        />
      </label>
      <label>
        Exclude keywords (one per line)
        <textarea
          value={excludeText}
          onChange={(event) => setExcludeText(event.target.value)}
        />
      </label>
      <div className="filters-screen__sources">
        {filters.sources.map((source) => (
          <label key={source.name}>
            <input
              type="checkbox"
              checked={source.enabled}
              onChange={(event) =>
                toggleSource(source.name, event.target.checked)
              }
            />
            {source.name}
          </label>
        ))}
      </div>
      <button type="button" onClick={handleSave} disabled={saving}>
        Save
      </button>
    </div>
  );
}
