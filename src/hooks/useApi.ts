import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

// Generic typed SWR hook
export function useApiGet<T>(url: string | null, options?: { refreshInterval?: number }) {
  return useSWR<T>(url, { ...options });
}

// Router telemetry with real-time refresh
export function useRouterTelemetry(routerId: string) {
  return useSWR(
    routerId ? `/api/routers/${routerId}/telemetry` : null,
    {
      refreshInterval: 5000, // poll every 5s
      revalidateOnFocus: true,
    }
  );
}

// Router snapshot
export function useRouterSnapshot(routerId: string) {
  return useSWR(
    routerId ? `/api/routers/${routerId}/snapshot` : null
  );
}

// Network topology
export function useNetworkTopology() {
  return useSWR('/api/network/topology', {
    refreshInterval: 30000, // refresh every 30s
  });
}

// Hotspot profiles
export function useHotspotProfiles() {
  return useSWR('/api/network/hotspots');
}

// Access control lists
export function useAccessLists() {
  return useSWR('/api/network/access-lists');
}

// SD-WAN overlay status
export function useOverlayStatus() {
  return useSWR('/api/network/overlay', {
    refreshInterval: 15000,
  });
}

// SD-WAN policies
export function useSdwanPolicies() {
  return useSWR('/api/network/policies');
}

// Mutation helpers for POST/PUT/DELETE
async function postFetcher(url: string, { arg }: { arg: unknown }) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(arg),
  });
  if (!res.ok) throw new Error('Request failed');
  return res.json();
}

// Provision a new router
export function useProvisionRouter() {
  return useSWRMutation('/api/tunnel/provision', postFetcher);
}

// Take a config snapshot
export function useTakeSnapshot(routerId: string) {
  return useSWRMutation(
    `/api/routers/${routerId}/snapshot`,
    async (url: string) => {
      const res = await fetch(url, { method: 'POST' });
      if (!res.ok) throw new Error('Snapshot failed');
      return res.json();
    }
  );
}
