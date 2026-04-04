import React, { useState, useCallback } from 'react';
import {
  Button,
  Spinner,
  Text,
  Card,
  CardHeader,
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
  const [format] = useState<ExportFormat>('PNG');
  const exportMutation = useExportPage();

  const handleExport = useCallback(() => {
    exportMutation.mutate(
      { reportId, pageName: page.name, format, workspaceId },
      {
        onSuccess: (result) => {
          onExportComplete?.(result);
        },
      }
    );
  }, [reportId, page.name, format, workspaceId, exportMutation, onExportComplete]);

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
          aria-label={`Export page ${page.displayName} as PNG`}
        >
          Export as PNG
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
            imageBase64={result?.image}
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
