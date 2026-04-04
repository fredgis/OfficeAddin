import React from 'react';
import {
  Title3,
  Button,
  Spinner,
  MessageBar,
  MessageBarBody,
  Text,
  Divider,
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
    backgroundColor: tokens.colorNeutralBackground2,
  },
  brandBar: {
    height: '4px',
    background: BRAND_GRADIENT,
    flexShrink: 0,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: tokens.spacingVerticalS,
    paddingBottom: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  headerLogo: {
    width: '24px',
    height: '24px',
    borderRadius: '6px',
    background: BRAND_GRADIENT,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: 700,
    flexShrink: 0,
  },
  content: {
    flex: '1',
    overflowY: 'auto',
    overflowX: 'hidden',
    paddingTop: tokens.spacingVerticalL,
    paddingBottom: tokens.spacingVerticalXXL,
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
  },
  center: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: tokens.spacingVerticalL,
    paddingTop: tokens.spacingVerticalXXL,
    paddingBottom: tokens.spacingVerticalXXL,
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
  },
  loginLogo: {
    width: '56px',
    height: '56px',
    borderRadius: '14px',
    background: BRAND_GRADIENT,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    fontSize: '26px',
    fontWeight: 700,
    marginBottom: tokens.spacingVerticalM,
  },
  loginSubtitle: {
    textAlign: 'center',
    maxWidth: '260px',
    color: tokens.colorNeutralForeground3,
  },
  offlineBanner: {
    backgroundColor: tokens.colorPaletteYellowBackground2,
    paddingTop: tokens.spacingVerticalXS,
    paddingBottom: tokens.spacingVerticalXS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
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
