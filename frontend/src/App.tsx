import { useEffect, useState } from 'react';
import { DetailScreen } from './screens/DetailScreen';
import { FeedScreen } from './screens/FeedScreen';
import { FiltersScreen } from './screens/FiltersScreen';
import { onBackButtonClick, setBackButtonVisible } from './telegram';
import type { Job } from './types';

type View =
  | { name: 'feed' }
  | { name: 'detail'; job: Job }
  | { name: 'filters' };

export function App() {
  const [view, setView] = useState<View>({ name: 'feed' });

  useEffect(() => {
    setBackButtonVisible(view.name !== 'feed');
  }, [view.name]);

  useEffect(() => onBackButtonClick(() => setView({ name: 'feed' })), []);

  if (view.name === 'detail') {
    return <DetailScreen job={view.job} />;
  }
  if (view.name === 'filters') {
    return <FiltersScreen onClose={() => setView({ name: 'feed' })} />;
  }
  return (
    <FeedScreen
      onSelectJob={(job) => setView({ name: 'detail', job })}
      onOpenFilters={() => setView({ name: 'filters' })}
    />
  );
}
