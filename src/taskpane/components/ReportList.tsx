import React from 'react';
import {
  Card,
  CardHeader,
  Body1,
  Caption1,
  Spinner,
  MessageBar,
  MessageBarBody,
  Text,
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

  if (isLoading) {
    return <Spinner size="small" label="Loading reports…" />;
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
        <Text>No reports found in this workspace.</Text>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {reports.map((report) => (
        <Card
          key={report.id}
          className={styles.card}
          onClick={() => onReportSelected(report)}
        >
          <CardHeader
            header={<Body1>{report.name}</Body1>}
            description={<Caption1>Dataset: {report.datasetId}</Caption1>}
          />
        </Card>
      ))}
    </div>
  );
};
