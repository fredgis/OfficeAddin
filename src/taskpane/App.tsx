import React from 'react';
import {
  Title3,
  Button,
  Spinner,
  MessageBar,
  MessageBarBody,
  Text,
  makeStyles,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import {
  SignOut24Regular,
  PersonCircle24Regular,
} from '@fluentui/react-icons';
import { useAuth } from './services/auth';
import { WorkspaceBrowser } from './components/WorkspaceBrowser';
import { ErrorBoundary } from './components/ErrorBoundary';

const BRAND_GRADIENT = 'linear-gradient(135deg, #0078d4 0%, #5c2d91 100%)';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#f5f5f5',
  },
  brandBar: {
    height: '3px',
    background: BRAND_GRADIENT,
    flexShrink: 0,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '10px',
    paddingBottom: '10px',
    paddingLeft: '16px',
    paddingRight: '12px',
    backgroundColor: '#ffffff',
    ...shorthands.borderBottom('1px', 'solid', '#e0e0e0'),
    flexShrink: 0,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  headerLogo: {
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    background: BRAND_GRADIENT,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 700,
    flexShrink: 0,
  },
  content: {
    flex: '1',
    overflowY: 'auto',
    overflowX: 'hidden',
    paddingTop: '16px',
    paddingBottom: '32px',
    paddingLeft: '16px',
    paddingRight: '16px',
  },
  center: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: '16px',
    paddingTop: '48px',
    paddingBottom: '48px',
    paddingLeft: '24px',
    paddingRight: '24px',
  },
  loginLogo: {
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    background: BRAND_GRADIENT,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    fontSize: '28px',
    fontWeight: 700,
    marginBottom: '8px',
    boxShadow: '0 4px 12px rgba(0,120,212,0.3)',
  },
  loginSubtitle: {
    textAlign: 'center',
    maxWidth: '260px',
    color: tokens.colorNeutralForeground3,
    lineHeight: '1.5',
  },
  offlineBanner: {
    backgroundColor: '#fff4ce',
    paddingTop: '6px',
    paddingBottom: '6px',
    paddingLeft: '16px',
    paddingRight: '16px',
    textAlign: 'center',
    flexShrink: 0,
  },
});

interface AppProps {
  isOffline?: boolean;
}

export const App: React.FC<AppProps> = ({ isOffline = false }) => {
  const styles = useStyles();
  const { isAuthenticated, isLoading, error, login, logout } = useAuth();

  if (isLoading) {
    return (
      <div className={styles.root}>
        <div className={styles.brandBar} />
        <div className={styles.center}>
          <Spinner size="medium" label="Signing in…" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={styles.root}>
        <div className={styles.brandBar} />
        <div className={styles.center}>
          <div className={styles.loginLogo} aria-hidden="true">F</div>
          <Title3>Fabric Storyboard Copilot</Title3>
          <Text className={styles.loginSubtitle} size={200}>
            Browse Power BI workspaces, export report pages, and generate AI-powered insights.
          </Text>
          {error && (
            <MessageBar intent="error">
              <MessageBarBody>{error}</MessageBarBody>
            </MessageBar>
          )}
          <Button
            appearance="primary"
            size="large"
            icon={<PersonCircle24Regular />}
            onClick={login}
            aria-label="Sign in with Microsoft"
          >
            Sign in with Microsoft
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className={styles.root}>
        <div className={styles.brandBar} />
        {isOffline && (
          <div className={styles.offlineBanner} role="status" aria-live="polite">
            <Text size={200} weight="semibold">You are offline. Some features may be unavailable.</Text>
          </div>
        )}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerLogo} aria-hidden="true">F</div>
            <Text weight="semibold" size={300}>Storyboard Copilot</Text>
          </div>
          <Button
            appearance="subtle"
            size="small"
            icon={<SignOut24Regular />}
            onClick={logout}
            aria-label="Sign out"
          >
            Sign out
          </Button>
        </div>
        <div className={styles.content} role="main">
          <WorkspaceBrowser />
        </div>
      </div>
    </ErrorBoundary>
  );
};
