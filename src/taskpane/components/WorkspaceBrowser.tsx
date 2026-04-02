import React, { useState, useCallback } from 'react';
import { Button, makeStyles, tokens } from '@fluentui/react-components';
import { WorkspacePicker } from './WorkspacePicker';
import { ReportList } from './ReportList';
import { PageList } from './PageList';
import { ExportPanel } from './ExportPanel';
import { BatchInsertPanel } from './BatchInsertPanel';
import { BreadcrumbNav } from './BreadcrumbNav';
import { usePages } from '../hooks/usePowerBI';
import type { Workspace, Report, ReportPage, ExportResult } from '../types/powerbi';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    width: '100%',
  },
  modeToggle: {
    display: 'flex',
    justifyContent: 'flex-end',
    paddingBottom: tokens.spacingVerticalXS,
  },
});

export const WorkspaceBrowser: React.FC = () => {
  const styles = useStyles();
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedPage, setSelectedPage] = useState<ReportPage | null>(null);
  const [exportCache, setExportCache] = useState<Record<string, ExportResult>>({});
  const [batchMode, setBatchMode] = useState(false);

  const { data: pages } = usePages(selectedReport?.id ?? null);

  const handleExportComplete = useCallback((result: ExportResult) => {
    const key = `${result.reportId}:${result.pageName}`;
    setExportCache((prev) => ({ ...prev, [key]: result }));
  }, []);

  const handleNavigateWorkspaces = useCallback(() => {
    setSelectedWorkspace(null);
    setSelectedReport(null);
    setSelectedPage(null);
  }, []);

  const handleNavigateReports = useCallback(() => {
    setSelectedReport(null);
    setSelectedPage(null);
  }, []);

  const handleNavigatePages = useCallback(() => {
    setSelectedPage(null);
  }, []);

  return (
    <div className={styles.root}>
      <BreadcrumbNav
        workspace={selectedWorkspace}
        report={selectedReport}
        page={selectedPage}
        onNavigateWorkspaces={handleNavigateWorkspaces}
        onNavigateReports={handleNavigateReports}
        onNavigatePages={handleNavigatePages}
      />

      {!selectedWorkspace && (
        <WorkspacePicker onWorkspaceSelected={setSelectedWorkspace} />
      )}

      {selectedWorkspace && !selectedReport && (
        <ReportList
          workspaceId={selectedWorkspace.id}
          onReportSelected={setSelectedReport}
        />
      )}

      {selectedReport && !selectedPage && (
        <>
          <div className={styles.modeToggle}>
            <Button
              size="small"
              appearance={batchMode ? 'primary' : 'subtle'}
              onClick={() => setBatchMode((prev) => !prev)}
            >
              {batchMode ? 'Exit Batch Insert' : 'Batch Insert'}
            </Button>
          </div>
          {batchMode && pages ? (
            <BatchInsertPanel
              reportId={selectedReport.id}
              pages={pages}
              exportCache={exportCache}
              onExportComplete={handleExportComplete}
            />
          ) : (
            <PageList
              reportId={selectedReport.id}
              onPageSelected={setSelectedPage}
              onExportPage={setSelectedPage}
            />
          )}
        </>
      )}

      {selectedReport && selectedPage && (
        <ExportPanel
          reportId={selectedReport.id}
          page={selectedPage}
          onExportComplete={handleExportComplete}
          cachedResult={exportCache[`${selectedReport.id}:${selectedPage.name}`] || null}
        />
      )}
    </div>
  );
};
