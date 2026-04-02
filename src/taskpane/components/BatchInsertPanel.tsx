import React, { useState, useCallback } from 'react';
import {
  Button,
  Checkbox,
  Switch,
  Spinner,
  Text,
  ProgressBar,
  MessageBar,
  MessageBarBody,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import type { ReportPage, ExportResult } from '../types/powerbi';
import { useExportPage } from '../hooks/usePowerBI';
import { batchInsertImages, LayoutOption } from '../services/officeInsert';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    width: '100%',
    paddingTop: tokens.spacingVerticalM,
  },
  pageList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    maxHeight: '240px',
    overflowY: 'auto',
  },
  actions: {
    display: 'flex',
    flexDirection: 'row',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  progress: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
});

interface BatchInsertPanelProps {
  reportId: string;
  pages: ReportPage[];
  exportCache: Record<string, ExportResult>;
  onExportComplete: (result: ExportResult) => void;
}

export const BatchInsertPanel: React.FC<BatchInsertPanelProps> = ({
  reportId,
  pages,
  exportCache,
  onExportComplete,
}) => {
  const styles = useStyles();
  const [selectedNames, setSelectedNames] = useState<Set<string>>(new Set());
  const [includeTitles, setIncludeTitles] = useState(true);
  const [inserting, setInserting] = useState(false);
  const [progressCurrent, setProgressCurrent] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const exportMutation = useExportPage();

  const togglePage = useCallback((name: string) => {
    setSelectedNames((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedNames((prev) =>
      prev.size === pages.length ? new Set() : new Set(pages.map((p) => p.name))
    );
  }, [pages]);

  const handleBatchInsert = useCallback(async () => {
    setSuccessMsg(null);
    setErrorMsg(null);
    setInserting(true);

    const selected = pages.filter((p) => selectedNames.has(p.name));
    setProgressTotal(selected.length);
    setProgressCurrent(0);

    try {
      // Export any pages not yet cached
      const images: Array<{ base64: string; title?: string }> = [];
      for (const page of selected) {
        const cacheKey = `${reportId}:${page.name}`;
        let result = exportCache[cacheKey];
        if (!result) {
          result = await exportMutation.mutateAsync({
            reportId,
            pageName: page.name,
            format: 'PNG',
          });
          onExportComplete(result);
        }
        images.push({
          base64: result.image,
          title: includeTitles ? page.displayName : undefined,
        });
      }

      await batchInsertImages(images, 'full' as LayoutOption, (current, total) => {
        setProgressCurrent(current);
        setProgressTotal(total);
      });

      setSuccessMsg(`Successfully inserted ${selected.length} slide(s).`);
    } catch (err) {
      setErrorMsg(`Batch insert failed: ${(err as Error).message}`);
    } finally {
      setInserting(false);
    }
  }, [pages, selectedNames, reportId, exportCache, exportMutation, onExportComplete, includeTitles]);

  return (
    <div className={styles.root}>
      <Text weight="semibold" size={400}>Batch Insert</Text>

      <div className={styles.actions}>
        <Button size="small" appearance="subtle" onClick={toggleAll}>
          {selectedNames.size === pages.length ? 'Deselect All' : 'Select All'}
        </Button>
        <Text size={200}>{selectedNames.size} of {pages.length} selected</Text>
      </div>

      <div className={styles.pageList}>
        {pages.map((page) => (
          <Checkbox
            key={page.name}
            label={`${page.displayName} (Page ${page.order})`}
            checked={selectedNames.has(page.name)}
            onChange={() => togglePage(page.name)}
            disabled={inserting}
          />
        ))}
      </div>

      <Switch
        label="Include slide titles"
        checked={includeTitles}
        onChange={(_e, data) => setIncludeTitles(data.checked)}
        disabled={inserting}
      />

      <Button
        appearance="primary"
        onClick={handleBatchInsert}
        disabled={inserting || selectedNames.size === 0}
      >
        Insert All as New Slides
      </Button>

      {inserting && (
        <div className={styles.progress}>
          <Text size={200}>
            Inserting {progressCurrent} of {progressTotal} pages…
          </Text>
          <ProgressBar
            value={progressTotal > 0 ? progressCurrent / progressTotal : 0}
          />
        </div>
      )}

      {successMsg && (
        <MessageBar intent="success">
          <MessageBarBody>{successMsg}</MessageBarBody>
        </MessageBar>
      )}

      {errorMsg && (
        <MessageBar intent="error">
          <MessageBarBody>{errorMsg}</MessageBarBody>
        </MessageBar>
      )}
    </div>
  );
};
