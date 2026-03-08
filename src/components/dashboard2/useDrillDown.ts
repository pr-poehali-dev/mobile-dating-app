import { useState, useCallback } from 'react';
import { DrillDownFilter } from './DrillDownModal';

export const useDrillDown = () => {
  const [drillFilter, setDrillFilter] = useState<DrillDownFilter | null>(null);

  const openDrill = useCallback((filter: DrillDownFilter) => {
    setDrillFilter(filter);
  }, []);

  const closeDrill = useCallback(() => {
    setDrillFilter(null);
  }, []);

  return { drillFilter, openDrill, closeDrill };
};
