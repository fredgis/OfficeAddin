import React from 'react';
import {
  Dropdown,
  Option,
  Spinner,
  MessageBar,
  MessageBarBody,
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
});

interface WorkspacePickerProps {
  onWorkspaceSelected: (workspace: Workspace) => void;
}

export const WorkspacePicker: React.FC<WorkspacePickerProps> = ({ onWorkspaceSelected }) => {
  const styles = useStyles();
  const { data: workspaces, isLoading, error } = useWorkspaces();

  if (isLoading) {
    return <Spinner size="small" label="Loading workspaces…" />;
  }

  if (error) {
    return (
      <MessageBar intent="error">
        <MessageBarBody>Failed to load workspaces: {(error as Error).message}</MessageBarBody>
      </MessageBar>
    );
  }

  return (
    <div className={styles.root}>
      <Dropdown
        placeholder="Select a workspace"
        onOptionSelect={(_event, data) => {
          const workspace = workspaces?.find((w) => w.id === data.optionValue);
          if (workspace) {
            onWorkspaceSelected(workspace);
          }
        }}
      >
        {workspaces?.map((ws) => (
          <Option key={ws.id} value={ws.id}>
            {ws.name}
          </Option>
        ))}
      </Dropdown>
    </div>
  );
};
