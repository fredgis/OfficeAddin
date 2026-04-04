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
  Badge,
  makeStyles,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import {
  Document24Regular,
  ArrowExportLtr20Regular,
  ArrowSync20Regular,
} from '@fluentui/react-icons';
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
    transitionProperty: 'background-color, box-shadow',
    transitionDuration: '150ms',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      boxShadow: tokens.shadow4,
    },
  },
  cardContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  pageIcon: {
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
      <div className={styles.errorRetry} role="alert">
        <MessageBar intent="error">
          <MessageBarBody>Failed to load pages: {(error as Error).message}</MessageBarBody>
        </MessageBar>
        <Button
          appearance="subtle"
          size="small"
          icon={<ArrowSync20Regular />}
          onClick={() => refetch()}
          aria-label="Retry loading pages"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!pages || pages.length === 0) {
    return (
      <div className={styles.empty}>
        <Document24Regular style={{ fontSize: '32px', display: 'block', margin: '0 auto 8px' }} />
        <Text>No pages found.</Text>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <Text className={styles.count} size={200}>{pages.length} page{pages.length !== 1 ? 's' : ''}</Text>
      {pages.map((page) => (
        <Card
          key={page.name}
          className={styles.card}
          size="small"
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
              image={<Document24Regular className={styles.pageIcon} />}
              header={<Text weight="semibold">{page.displayName}</Text>}
              description={<Caption1>Page {page.order}</Caption1>}
            />
            {onExportPage && (
              <Button
                size="small"
                appearance="subtle"
                icon={<ArrowExportLtr20Regular />}
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
