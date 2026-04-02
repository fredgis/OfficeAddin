import React, { useState, useMemo } from 'react';
import {
  Card,
  CardHeader,
  Body1,
  Caption1,
  Spinner,
  MessageBar,
  MessageBarBody,
  Text,
  Input,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { useReports } from '../hooks/usePowerBI';
import type { Report } from '../types/powerbi';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    width: '100%',
  },
  card: {
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  empty: {
    textAlign: 'center',
    paddingTop: tokens.spacingVerticalL,
    paddingBottom: tokens.spacingVerticalL,
  },
});

interface ReportListProps {
  workspaceId: string;
  onReportSelected: (report: Report) => void;
}

export const ReportList: React.FC<ReportListProps> = ({ workspaceId, onReportSelected }) => {
  const styles = useStyles();
  const { data: reports, isLoading, error } = useReports(workspaceId);
  const [filter, setFilter] = useState('');

  const filtered = useMemo(() => {
    if (!reports) return [];
    if (!filter) return reports;
    const lower = filter.toLowerCase();
    return reports.filter((r) => r.name.toLowerCase().includes(lower));
  }, [reports, filter]);

  if (isLoading) {
    return <Spinner size="small" label="Loading reports…" aria-label="Loading reports" />;
  }

  if (error) {
    return (
      <MessageBar intent="error">
        <MessageBarBody>Failed to load reports: {(error as Error).message}</MessageBarBody>
      </MessageBar>
    );
  }

  if (!reports || reports.length === 0) {
    return (
      <div className={styles.empty}>
        <Text>No reports in this workspace.</Text>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <Input
        aria-label="Filter reports"
        placeholder="Filter reports…"
        value={filter}
        onChange={(_e, data) => setFilter(data.value)}
      />
      {filtered.map((report) => (
        <Card
          key={report.id}
          className={styles.card}
          role="button"
          aria-label={`Select report ${report.name}`}
          onClick={() => onReportSelected(report)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onReportSelected(report);
            }
          }}
          tabIndex={0}
        >
          <CardHeader
            header={<Body1>{report.name}</Body1>}
            description={report.datasetId ? <Caption1>Dataset: {report.datasetId}</Caption1> : undefined}
          />
        </Card>
      ))}
    </div>
  );
};
