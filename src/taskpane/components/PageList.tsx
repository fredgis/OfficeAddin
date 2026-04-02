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
  Button,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { usePages } from '../hooks/usePowerBI';
import type { ReportPage } from '../types/powerbi';

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
  cardContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  empty: {
    textAlign: 'center',
    paddingTop: tokens.spacingVerticalL,
    paddingBottom: tokens.spacingVerticalL,
  },
});

interface PageListProps {
  reportId: string;
  onPageSelected: (page: ReportPage) => void;
  onExportPage?: (page: ReportPage) => void;
}

export const PageList: React.FC<PageListProps> = ({ reportId, onPageSelected, onExportPage }) => {
  const styles = useStyles();
  const { data: pages, isLoading, error } = usePages(reportId);

  if (isLoading) {
    return <Spinner size="small" label="Loading pages…" />;
  }

  if (error) {
    return (
      <MessageBar intent="error">
        <MessageBarBody>Failed to load pages: {(error as Error).message}</MessageBarBody>
      </MessageBar>
    );
  }

  if (!pages || pages.length === 0) {
    return (
      <div className={styles.empty}>
        <Text>No pages found in this report.</Text>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {pages.map((page) => (
        <Card
          key={page.name}
          className={styles.card}
          onClick={() => onPageSelected(page)}
        >
          <div className={styles.cardContent}>
            <CardHeader
              header={<Body1>{page.displayName}</Body1>}
              description={<Caption1>Page {page.order}</Caption1>}
            />
            {onExportPage && (
              <Button
                size="small"
                appearance="subtle"
                onClick={(e) => {
                  e.stopPropagation();
                  onExportPage(page);
                }}
              >
                Export
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};
