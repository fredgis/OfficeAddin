import React, { useState, useMemo } from 'react';
import {
  Button,
  Combobox,
  Option,
  MessageBar,
  MessageBarBody,
  Text,
  Skeleton,
  SkeletonItem,
  makeStyles,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import {
  Folder24Regular,
  ArrowSync20Regular,
} from '@fluentui/react-icons';
import { useWorkspaces } from '../hooks/usePowerBI';
import type { Workspace } from '../types/powerbi';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    width: '100%',
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    color: tokens.colorNeutralForeground3,
  },
  empty: {
    textAlign: 'center',
    paddingTop: tokens.spacingVerticalXXL,
    paddingBottom: tokens.spacingVerticalXXL,
    color: tokens.colorNeutralForeground3,
  },
  skeleton: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    paddingTop: tokens.spacingVerticalM,
  },
  errorRetry: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
});

interface WorkspacePickerProps {
  onWorkspaceSelected: (workspace: Workspace) => void;
}

export const WorkspacePicker: React.FC<WorkspacePickerProps> = ({ onWorkspaceSelected }) => {
  const styles = useStyles();
  const { data: workspaces, isLoading, error, refetch } = useWorkspaces();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!workspaces) return [];
    if (!query) return workspaces;
    const lower = query.toLowerCase();
    return workspaces.filter((ws) => ws.name.toLowerCase().includes(lower));
  }, [workspaces, query]);

  if (isLoading) {
    return (
      <Skeleton aria-label="Loading workspaces">
        <div className={styles.skeleton}>
          <SkeletonItem size={36} />
        </div>
      </Skeleton>
    );
  }

  if (error) {
    return (
      <div className={styles.errorRetry} role="alert">
        <MessageBar intent="error">
          <MessageBarBody>Failed to load workspaces: {(error as Error).message}</MessageBarBody>
        </MessageBar>
        <Button
          appearance="subtle"
          size="small"
          icon={<ArrowSync20Regular />}
          onClick={() => refetch()}
          aria-label="Retry loading workspaces"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!workspaces || workspaces.length === 0) {
    return (
      <div className={styles.empty}>
        <Folder24Regular style={{ fontSize: '32px', marginBottom: '8px', display: 'block', margin: '0 auto 8px' }} />
        <Text>No workspaces found.</Text>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <Text className={styles.label} size={200} weight="semibold">SELECT WORKSPACE</Text>
      <Combobox
        aria-label="Select a workspace"
        placeholder="Search workspaces…"
        freeform
        onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
        onOptionSelect={(_event, data) => {
          const workspace = workspaces.find((w) => w.id === data.optionValue);
          if (workspace) {
            onWorkspaceSelected(workspace);
          }
        }}
      >
        {filtered.map((ws) => (
          <Option key={ws.id} value={ws.id}>
            {ws.name}
          </Option>
        ))}
      </Combobox>
    </div>
  );
};
