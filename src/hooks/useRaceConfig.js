import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const defaults = {
  derby_enabled: true,
  owner_license_cost: 50000,
  max_horses_main: 6,
  max_horses_sprint: 4,
  max_horses_duel: 2,
};

export function useRaceConfig(options = {}) {
  return useQuery({
    queryKey: ['raceConfig'],
    queryFn: async () => {
      const configs = await base44.entities.RaceConfig.list();
      const config = configs[0] || {};
      return { ...defaults, ...config };
    },
    staleTime: 30_000,
    ...options,
  });
}

export function isDerbyEnabled(config) {
  return config?.derby_enabled !== false;
}

export function getLicenseCost(config) {
  return config?.owner_license_cost ?? defaults.owner_license_cost;
}
