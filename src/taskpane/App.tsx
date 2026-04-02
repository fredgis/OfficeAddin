import React from 'react';
import {
  Title1,
  Button,
  Spinner,
  MessageBar,
  MessageBarBody,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { useAuth } from './services/auth';
import { WorkspaceBrowser } from './components/WorkspaceBrowser';
import { ErrorBoundary } from './components/ErrorBoundary';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: tokens.colorNeutralBackground1,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: tokens.spacingVerticalM,
    paddingBottom: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke1,
  },
  content: {
    flex: '1',
    overflowY: 'auto',
    paddingTop: tokens.spacingVerticalM,
    paddingBottom: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
  },
  center: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: tokens.spacingVerticalL,
  },
});

export const App: React.FC = () => {
  const styles = useStyles();
  const { isAuthenticated, isLoading, error, login, logout } = useAuth();

  if (isLoading) {
    return (
      <div className={styles.root}>
        <div className={styles.center}>
          <Spinner size="medium" label="Signing in…" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={styles.root}>
        <div className={styles.center}>
          <Title1>Fabric Storyboard Copilot</Title1>
          {error && (
            <MessageBar intent="error">
              <MessageBarBody>{error}</MessageBarBody>
            </MessageBar>
          )}
          <Button appearance="primary" onClick={login} aria-label="Sign in with Microsoft">
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className={styles.root}>
        <div className={styles.header}>
          <Text weight="semibold">Fabric Storyboard Copilot</Text>
          <Button appearance="subtle" size="small" onClick={logout} aria-label="Sign out">
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
