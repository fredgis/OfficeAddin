import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { FluentProvider, webLightTheme, webDarkTheme } from '@fluentui/react-components';
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
    const officeTheme = Office.context?.officeTheme;
    if (officeTheme) {
      // Office dark themes have a dark body background color
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

  useEffect(() => {
    // Re-detect theme if Office signals a change
    if (Office.context?.officeTheme && typeof Office.context.document?.addHandlerAsync === 'function') {
      Office.context.document.addHandlerAsync(
        Office.EventType.DocumentSelectionChanged,
        () => setTheme(detectOfficeTheme()),
      );
    }
  }, []);

  return (
    <React.StrictMode>
      <FluentProvider theme={theme}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </QueryClientProvider>
      </FluentProvider>
    </React.StrictMode>
  );
};

Office.onReady(() => {
  const container = document.getElementById('root');
  if (!container) {
    throw new Error('Root element not found');
  }

  const root = createRoot(container);
  root.render(<Root />);
});
