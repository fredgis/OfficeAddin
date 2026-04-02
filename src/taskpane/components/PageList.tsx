import React from 'react';
import {
  Card,
  CardHeader,
  Body1,
  Caption1,
  MessageBar,
  MessageBarBody,
  Text,
  Button,
  Skeleton,
  SkeletonItem,
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
  skeleton: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
});

interface PageListProps {
  reportId: string;
  onPageSelected: (page: ReportPage) => void;
  onExportPage?: (page: ReportPage) => void;
}

export const PageList: React.FC<PageListProps> = ({ reportId, onPageSelected, onExportPage }) => {
  const styles = useStyles();
  const { data: pages, isLoading, error, refetch } = usePages(reportId);

  if (isLoading) {
    return (
      <Skeleton aria-label="Loading pages">
        <div className={styles.skeleton}>
          <SkeletonItem size={48} />
          <SkeletonItem size={48} />
          <SkeletonItem size={48} />
        </div>
      </Skeleton>
    );
  }

  if (error) {
    return (
      <div role="alert">
        <MessageBar intent="error">
          <MessageBarBody>Failed to load pages: {(error as Error).message}</MessageBarBody>
        </MessageBar>
        <Button appearance="subtle" size="small" onClick={() => refetch()} aria-label="Retry loading pages"
          style={{ marginTop: '8px', minHeight: '44px' }}>
          Retry
        </Button>
      </div>
    );
  }

  if (!pages || pages.length === 0) {
    return (
      <div className={styles.empty}>
        <Text>No pages found.</Text>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {pages.map((page) => (
        <Card
          key={page.name}
          className={styles.card}
          role="button"
          aria-label={`Select page ${page.displayName}`}
          onClick={() => onPageSelected(page)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onPageSelected(page);
            }
          }}
          tabIndex={0}
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
                aria-label={`Export page ${page.displayName}`}
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
