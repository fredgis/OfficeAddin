import React, { useState, useMemo } from 'react';
import {
  Button,
  Card,
  CardHeader,
  Body1,
  Caption1,
  MessageBar,
  MessageBarBody,
  Text,
  Input,
  Skeleton,
  SkeletonItem,
  makeStyles,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import {
  DataBarVertical24Regular,
  Search20Regular,
  ArrowSync20Regular,
} from '@fluentui/react-icons';
import { useReports } from '../hooks/usePowerBI';
import type { Report } from '../types/powerbi';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    width: '100%',
  },
  label: {
    color: tokens.colorNeutralForeground3,
  },
  card: {
    cursor: 'pointer',
    transitionProperty: 'background-color, box-shadow',
    transitionDuration: '150ms',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      boxShadow: tokens.shadow4,
    },
  },
  reportIcon: {
    color: tokens.colorBrandForeground1,
  },
  empty: {
    textAlign: 'center',
    paddingTop: tokens.spacingVerticalXXL,
    paddingBottom: tokens.spacingVerticalXXL,
    color: tokens.colorNeutralForeground3,
  },
  skeleton: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    paddingTop: tokens.spacingVerticalM,
  },
  errorRetry: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  count: {
    color: tokens.colorNeutralForeground3,
  },
});

interface ReportListProps {
  workspaceId: string;
  onReportSelected: (report: Report) => void;
}

export const ReportList: React.FC<ReportListProps> = ({ workspaceId, onReportSelected }) => {
  const styles = useStyles();
  const { data: reports, isLoading, error, refetch } = useReports(workspaceId);
  const [filter, setFilter] = useState('');

  const filtered = useMemo(() => {
    if (!reports) return [];
    if (!filter) return reports;
    const lower = filter.toLowerCase();
    return reports.filter((r) => r.name.toLowerCase().includes(lower));
  }, [reports, filter]);

  if (isLoading) {
    return (
      <Skeleton aria-label="Loading reports">
        <div className={styles.skeleton}>
          <SkeletonItem size={36} />
          <SkeletonItem size={48} />
          <SkeletonItem size={48} />
          <SkeletonItem size={48} />
        </div>
      </Skeleton>
    );
  }

  if (error) {
    return (
      <div className={styles.errorRetry} role="alert">
        <MessageBar intent="error">
          <MessageBarBody>Failed to load reports: {(error as Error).message}</MessageBarBody>
        </MessageBar>
        <Button
          appearance="subtle"
          size="small"
          icon={<ArrowSync20Regular />}
          onClick={() => refetch()}
          aria-label="Retry loading reports"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!reports || reports.length === 0) {
    return (
      <div className={styles.empty}>
        <DataBarVertical24Regular style={{ fontSize: '32px', display: 'block', margin: '0 auto 8px' }} />
        <Text>No reports in this workspace.</Text>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <Input
        aria-label="Filter reports"
        placeholder="Search reports…"
        contentBefore={<Search20Regular />}
        value={filter}
        onChange={(_e, data) => setFilter(data.value)}
      />
      <Text className={styles.count} size={200}>{filtered.length} report{filtered.length !== 1 ? 's' : ''}</Text>
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
            image={<DataBarVertical24Regular className={styles.reportIcon} />}
            header={<Text weight="semibold">{report.name}</Text>}
            description={report.datasetId ? <Caption1>Dataset: {report.datasetId}</Caption1> : undefined}
          />
        </Card>
      ))}
    </div>
  );
};
