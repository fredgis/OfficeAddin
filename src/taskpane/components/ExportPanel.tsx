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
    gap: '16px',
    width: '100%',
  },
  pageCard: {
    backgroundColor: '#ffffff',
    ...shorthands.borderRadius('8px'),
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  },
  actions: {
    display: 'flex',
    flexDirection: 'row',
    gap: '8px',
    alignItems: 'center',
  },
  exportBtn: {
    background: 'linear-gradient(135deg, #0078d4 0%, #106ebe 100%)',
    ':hover': {
      background: 'linear-gradient(135deg, #106ebe 0%, #005a9e 100%)',
    },
  },
  progressContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    paddingTop: '20px',
    paddingBottom: '20px',
    ...shorthands.borderRadius('8px'),
    backgroundColor: '#f0f4ff',
    ...shorthands.border('1px', 'dashed', '#c7d8f4'),
  },
  pageIcon: {
    color: '#0078d4',
    fontSize: '20px',
  },
  section: {
    ...shorthands.borderRadius('8px'),
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    paddingTop: '12px',
    paddingBottom: '12px',
    paddingLeft: '14px',
    paddingRight: '14px',
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '12px',
    paddingBottom: '8px',
    ...shorthands.borderBottom('2px', 'solid', '#0078d4'),
    color: '#0078d4',
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
      <Card size="small" className={styles.pageCard}>
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
          <div className={styles.section}>
            <InsertPanel exportResult={result} pageName={page.displayName} />
          </div>
          <div className={styles.section}>
            <InsightsPanel
              reportId={reportId}
              pageName={page.displayName}
              imageBase64={result?.image}
            />
          </div>
          <div className={styles.section}>
            <CombinedInsertPanel
              reportId={reportId}
              page={page}
              exportResult={result}
            />
          </div>
        </>
      )}
    </div>
  );
};
