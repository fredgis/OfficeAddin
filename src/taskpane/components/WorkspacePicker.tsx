import React, { useState, useMemo } from 'react';
import {
  Combobox,
  Option,
  Spinner,
  MessageBar,
  MessageBarBody,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { useWorkspaces } from '../hooks/usePowerBI';
import type { Workspace } from '../types/powerbi';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    width: '100%',
  },
  empty: {
    textAlign: 'center',
    paddingTop: tokens.spacingVerticalL,
    paddingBottom: tokens.spacingVerticalL,
  },
});

interface WorkspacePickerProps {
  onWorkspaceSelected: (workspace: Workspace) => void;
}

export const WorkspacePicker: React.FC<WorkspacePickerProps> = ({ onWorkspaceSelected }) => {
  const styles = useStyles();
  const { data: workspaces, isLoading, error } = useWorkspaces();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!workspaces) return [];
    if (!query) return workspaces;
    const lower = query.toLowerCase();
    return workspaces.filter((ws) => ws.name.toLowerCase().includes(lower));
  }, [workspaces, query]);

  if (isLoading) {
    return <Spinner size="small" label="Loading workspaces…" aria-label="Loading workspaces" />;
  }

  if (error) {
    return (
      <MessageBar intent="error">
        <MessageBarBody>Failed to load workspaces: {(error as Error).message}</MessageBarBody>
      </MessageBar>
    );
  }

  if (!workspaces || workspaces.length === 0) {
    return (
      <div className={styles.empty}>
        <Text>No workspaces found.</Text>
      </div>
    );
  }

  return (
    <div className={styles.root}>
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
