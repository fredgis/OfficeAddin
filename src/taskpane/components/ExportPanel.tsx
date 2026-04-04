import React, { useCallback } from 'react';
import {
  Button,
  Spinner,
  Text,
  Card,
  CardHeader,
  Body1,
  Caption1,
  MessageBar,
  MessageBarBody,
  Divider,
  makeStyles,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import {
  ArrowExportLtr24Regular,
  ArrowSync24Regular,
  Image24Regular,
} from '@fluentui/react-icons';
import { useExportPage } from '../hooks/usePowerBI';
import type { ReportPage, ExportResult } from '../types/powerbi';
import { InsertPanel } from './InsertPanel';
import { InsightsPanel } from './InsightsPanel';
import { CombinedInsertPanel } from './CombinedInsertPanel';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    width: '100%',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  sectionLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    color: tokens.colorNeutralForeground3,
  },
  formatGroup: {
    display: 'flex',
    flexDirection: 'row',
    gap: tokens.spacingHorizontalM,
  },
  actions: {
    display: 'flex',
    flexDirection: 'row',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
  },
  progressContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalS,
    paddingTop: tokens.spacingVerticalL,
    paddingBottom: tokens.spacingVerticalL,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    backgroundColor: tokens.colorNeutralBackground3,
  },
  preview: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    alignItems: 'center',
  },
  previewImage: {
    maxWidth: '100%',
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    boxShadow: tokens.shadow8,
    transitionProperty: 'box-shadow',
    transitionDuration: '200ms',
    ':hover': {
      boxShadow: tokens.shadow16,
    },
  },
  pageHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  pageIcon: {
    color: tokens.colorBrandForeground1,
    fontSize: '20px',
  },
});

type ExportFormat = 'PNG';

interface ExportPanelProps {
  reportId: string;
  page: ReportPage;
  workspaceId: string;
  onExportComplete?: (result: ExportResult) => void;
  cachedResult?: ExportResult | null;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({
  reportId,
  page,
  workspaceId,
  onExportComplete,
  cachedResult,
}) => {
  const styles = useStyles();
  const exportMutation = useExportPage();

  const handleExport = useCallback(() => {
    exportMutation.mutate(
      { reportId, pageName: page.name, format: 'PNG', workspaceId },
      {
        onSuccess: (result) => {
          onExportComplete?.(result);
        },
      }
    );
  }, [reportId, page.name, workspaceId, exportMutation, onExportComplete]);

  const result = exportMutation.data || cachedResult;

  return (
    <div className={styles.root}>
      <Card size="small">
        <CardHeader
          image={<Image24Regular className={styles.pageIcon} />}
          header={<Text weight="semibold">{page.displayName}</Text>}
          description={<Caption1>Page {page.order}</Caption1>}
        />
      </Card>

      <div className={styles.actions}>
        <Button
          appearance="primary"
          icon={<ArrowExportLtr24Regular />}
          onClick={handleExport}
          disabled={exportMutation.isPending}
          aria-label={`Export page ${page.displayName}`}
        >
          Export Page
        </Button>
      </div>

      {exportMutation.isPending && (
        <div className={styles.progressContainer}>
          <Spinner size="medium" label="Exporting page… This may take up to 60 seconds." />
        </div>
      )}

      {exportMutation.isError && (
        <div role="alert">
          <MessageBar intent="error">
            <MessageBarBody>
              Export failed: {(exportMutation.error as Error).message}
            </MessageBarBody>
          </MessageBar>
          <Button
            appearance="subtle"
            size="small"
            icon={<ArrowSync24Regular />}
            onClick={handleExport}
            aria-label="Retry export"
            style={{ marginTop: '8px' }}
          >
            Retry Export
          </Button>
        </div>
      )}

      {result && !exportMutation.isPending && (
        <>
          <Divider />
          <InsertPanel exportResult={result} pageName={page.displayName} />
          <Divider />
          <InsightsPanel
            reportId={reportId}
            pageName={page.displayName}
          />
          <Divider />
          <CombinedInsertPanel
            reportId={reportId}
            page={page}
            exportResult={result}
          />
        </>
      )}
    </div>
  );
};
