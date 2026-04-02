import React, { useState, useCallback } from 'react';
import {
  Button,
  Spinner,
  RadioGroup,
  Radio,
  Text,
  Card,
  CardHeader,
  Body1,
  Caption1,
  MessageBar,
  MessageBarBody,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { useExportPage } from '../hooks/usePowerBI';
import type { ReportPage, ExportResult } from '../types/powerbi';
import { InsertPanel } from './InsertPanel';
import { InsightsPanel } from './InsightsPanel';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    width: '100%',
    paddingTop: tokens.spacingVerticalM,
  },
  header: {
    fontWeight: tokens.fontWeightSemibold,
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
    paddingTop: tokens.spacingVerticalM,
    paddingBottom: tokens.spacingVerticalM,
  },
  preview: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    alignItems: 'center',
  },
  previewImage: {
    maxWidth: '100%',
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow4,
  },
});

interface ExportPanelProps {
  reportId: string;
  page: ReportPage;
  onExportComplete?: (result: ExportResult) => void;
  cachedResult?: ExportResult | null;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({
  reportId,
  page,
  onExportComplete,
  cachedResult,
}) => {
  const styles = useStyles();
  const [format, setFormat] = useState<'PNG' | 'JPEG'>('PNG');
  const exportMutation = useExportPage();

  const handleExport = useCallback(() => {
    exportMutation.mutate(
      { reportId, pageName: page.name, format },
      {
        onSuccess: (result) => {
          onExportComplete?.(result);
        },
      }
    );
  }, [reportId, page.name, format, exportMutation, onExportComplete]);

  const result = exportMutation.data || cachedResult;

  return (
    <div className={styles.root}>
      <Card>
        <CardHeader
          header={<Body1 className={styles.header}>Export: {page.displayName}</Body1>}
          description={<Caption1>Page {page.order}</Caption1>}
        />
      </Card>

      <Text weight="semibold">Format</Text>
      <RadioGroup
        layout="horizontal"
        value={format}
        onChange={(_e, data) => setFormat(data.value as 'PNG' | 'JPEG')}
      >
        <Radio value="PNG" label="PNG" />
        <Radio value="JPEG" label="JPEG" />
      </RadioGroup>

      <div className={styles.actions}>
        <Button
          appearance="primary"
          onClick={handleExport}
          disabled={exportMutation.isPending}
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
        <MessageBar intent="error">
          <MessageBarBody>
            Export failed: {(exportMutation.error as Error).message}
          </MessageBarBody>
        </MessageBar>
      )}

      {result && !exportMutation.isPending && (
        <>
          <InsertPanel exportResult={result} pageName={page.displayName} />
          <InsightsPanel
            reportId={reportId}
            page={page}
            exportResult={result}
          />
        </>
      )}
    </div>
  );
};
