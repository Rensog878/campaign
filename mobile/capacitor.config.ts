import type { CapacitorConfig } from "@capacitor/cli";

// A native Android shell around the live portal. It uses Android's WebView (not Chrome),
// so Chrome settings such as "Desktop site" never change the layout, and every deploy
// to Vercel reaches the app without rebuilding it.
const config: CapacitorConfig = {
  appId: "com.cupnsaucer.campaigns",
  appName: "Campaigns",
  webDir: "www",
  server: {
    url: "https://campaign-seven-ruddy.vercel.app/login",
    errorPath: "offline.html", // shown when there's no internet
    androidScheme: "https",
  },
  android: {
    backgroundColor: "#0c1714",
    allowMixedContent: false,
  },
  plugins: {
    SystemBars: {
      insetsHandling: "native", // the portal pads itself with env(safe-area-inset-*)
      initialViewportFitValueHint: "cover",
      style: "DARK", // light icons on the dark header
    },
    SplashScreen: {
      launchShowDuration: 800,
      backgroundColor: "#0c1714",
      showSpinner: false,
    },
  },
};

export default config;
