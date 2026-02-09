import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.parthenon.planner',
  appName: 'Parthenon Planner',
  webDir: 'dist'
  android: {
    fullscreen: false,
  },
};

export default config;
