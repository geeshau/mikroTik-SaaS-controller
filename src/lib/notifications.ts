import { toast } from 'sonner';

export const notify = {
  success: (message: string, description?: string) =>
    toast.success(message, { description }),
  
  error: (message: string, description?: string) =>
    toast.error(message, { description }),
  
  warning: (message: string, description?: string) =>
    toast.warning(message, { description }),
  
  info: (message: string, description?: string) =>
    toast.info(message, { description }),

  // App-specific notifications
  routerOnline: (routerName: string) =>
    toast.success(`${routerName} is online`, {
      description: 'Router is reachable via WireGuard tunnel',
    }),

  routerOffline: (routerName: string) =>
    toast.error(`${routerName} went offline`, {
      description: 'Connection lost — check WAN uplink or tunnel',
    }),

  snapshotCreated: (routerName: string) =>
    toast.success('Snapshot saved', {
      description: `Configuration snapshot for ${routerName}`,
    }),

  firmwareUpdateAvailable: (routerName: string, version: string) =>
    toast.info('Firmware update available', {
      description: `${routerName} can be updated to v${version}`,
    }),

  bulkPushComplete: (count: number) =>
    toast.success(`Bulk push complete`, {
      description: `Successfully pushed config to ${count} router${count !== 1 ? 's' : ''}`,
    }),

  thresholdBreach: (routerName: string, metric: string, value: string) =>
    toast.warning(`Threshold breach on ${routerName}`, {
      description: `${metric} reached ${value}`,
    }),

  exportReady: (filename: string) =>
    toast.success('Export ready', {
      description: `${filename} is ready for download`,
    }),
};
