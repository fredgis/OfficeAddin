import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import {
  FluentProvider,
  webLightTheme,
  webDarkTheme,
  teamsHighContrastTheme,
} from '@fluentui/react-components';
import type { Theme } from '@fluentui/react-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from './App';
import { AuthProvider } from './services/auth';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

/** Detect Office host theme; falls back to light theme. */
function detectOfficeTheme(): Theme {
  try {
    // Check for OS-level high-contrast mode
    if (window.matchMedia?.('(forced-colors: active)').matches) {
      return teamsHighContrastTheme;
    }

    const officeTheme = Office.context?.officeTheme;
    if (officeTheme) {
      const bg = officeTheme.bodyBackgroundColor?.toLowerCase();
      if (bg && (bg === '#000000' || bg === '#1e1e1e' || bg === '#2d2d2d' || parseInt(bg.replace('#', ''), 16) < 0x404040)) {
        return webDarkTheme;
      }
    }
  } catch {
    // Office.context may not be available in all environments
  }
  return webLightTheme;
}

const Root: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(detectOfficeTheme);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  useEffect(() => {
    // Re-detect theme if Office signals a change
    const handler = () => setTheme(detectOfficeTheme());
    let registeredHandler = false;
    if (Office.context?.officeTheme && typeof Office.context.document?.addHandlerAsync === 'function') {
      Office.context.document.addHandlerAsync(
        Office.EventType.DocumentSelectionChanged,
        handler,
        (result) => { registeredHandler = result.status === Office.AsyncResultStatus.Succeeded; }
      );
    }

    // React to OS high-contrast changes
    const mq = window.matchMedia?.('(forced-colors: active)');
    const mqHandler = () => setTheme(detectOfficeTheme());
    if (mq?.addEventListener) {
      mq.addEventListener('change', mqHandler);
    }

    return () => {
      if (registeredHandler && typeof Office.context.document?.removeHandlerAsync === 'function') {
        Office.context.document.removeHandlerAsync(Office.EventType.DocumentSelectionChanged, { handler });
      }
      if (mq?.removeEventListener) {
        mq.removeEventListener('change', mqHandler);
      }
    };
  }, []);

  return (
    <React.StrictMode>
      <FluentProvider theme={theme}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <App isOffline={isOffline} />
          </AuthProvider>
        </QueryClientProvider>
      </FluentProvider>
    </React.StrictMode>
  );
};

// Add a timeout fallback — if Office.onReady doesn't fire within 10s,
// render anyway (handles cases where Office.js context is unavailable)
let officeReady = false;

Office.onReady(() => {
  officeReady = true;
  renderApp();
});

setTimeout(() => {
  if (!officeReady) {
    console.warn('Office.onReady did not fire within 10s — rendering without Office context');
    renderApp();
  }
}, 10000);

function renderApp() {
  try {
    const container = document.getElementById('root');
    if (!container) {
      throw new Error('Root element not found');
    }

    const root = createRoot(container);
    root.render(<Root />);
  } catch (err) {
    const el = document.getElementById('root') || document.body;
    el.innerHTML = `<div style="padding:2rem;font-family:sans-serif">
      <h2>Failed to load add-in</h2>
      <p>${err instanceof Error ? err.message : 'Unknown error'}</p>
    </div>`;
  }
}
