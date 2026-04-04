import React, { useState, useCallback } from 'react';
import {
  Button,
  Spinner,
  Text,
  MessageBar,
  MessageBarBody,
  ProgressBar,
  makeStyles,
  shorthands,
} from '@fluentui/react-components';
import {
  Sparkle24Regular,
  CheckmarkCircle24Regular,
} from '@fluentui/react-icons';
import type { ExportResult, ReportPage } from '../types/powerbi';
import type { InsightItem } from '../types/insights';
import { useGenerateInsights } from '../hooks/useInsights';
import { insertImageWithInsights } from '../services/officeInsert';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '100%',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    paddingBottom: '6px',
    ...shorthands.borderBottom('2px', 'solid', '#d83b01'),
    color: '#d83b01',
  },
  description: {
    color: '#616161',
    fontSize: '12px',
  },
  progress: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  insertBtn: {
    background: 'linear-gradient(135deg, #d83b01 0%, #a4262c 100%)',
    color: '#ffffff',
    ':hover': {
      background: 'linear-gradient(135deg, #a4262c 0%, #8a2121 100%)',
      color: '#ffffff',
    },
  },
});

interface CombinedInsertPanelProps {
  reportId: string;
  page: ReportPage;
  exportResult: ExportResult | null;
}

type InsertStep = 'idle' | 'generating' | 'inserting' | 'done' | 'error';

function formatInsightsText(insights: InsightItem[]): string {
  return insights
    .map((item, i) => `${i + 1}. ${item.headline}\n${item.body}`)
    .join('\n\n');
}

export const CombinedInsertPanel: React.FC<CombinedInsertPanelProps> = ({
  reportId,
  page,
  exportResult,
}) => {
  const styles = useStyles();
  const insightsMutation = useGenerateInsights();
  const [step, setStep] = useState<InsertStep>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCombinedInsert = useCallback(async () => {
    if (!exportResult) return;
    setStep('generating');
    setErrorMsg(null);

    try {
      const response = await insightsMutation.mutateAsync({
        reportId,
        pageName: page.name,
        imageBase64: exportResult.image,
      });

      setStep('inserting');
      const insightsText = formatInsightsText(response.insights);
      await insertImageWithInsights(exportResult.image, insightsText, page.displayName);

      setStep('done');
    } catch (err) {
      setStep('error');
      setErrorMsg((err as Error).message);
    }
  }, [exportResult, reportId, page, insightsMutation]);

  const progressValue =
    step === 'generating' ? 0.33 :
    step === 'inserting' ? 0.66 :
    step === 'done' ? 1 : 0;

  const progressLabel =
    step === 'generating' ? 'Generating AI insights…' :
    step === 'inserting' ? 'Inserting slide…' :
    step === 'done' ? 'Complete!' : '';

  return (
    <div className={styles.root}>
      <div className={styles.sectionHeader}>
        <Sparkle24Regular />
        <Text weight="semibold" size={300}>One-Click Insert</Text>
      </div>
      <Text className={styles.description}>
        Image (60%) + AI insights (40%) on the current slide
      </Text>

      <Button
        appearance="primary"
        className={styles.insertBtn}
        icon={<Sparkle24Regular />}
        onClick={handleCombinedInsert}
        disabled={!exportResult || step === 'generating' || step === 'inserting'}
        aria-label="Insert page with AI insights"
      >
        Insert Page with Insights
      </Button>

      {(step === 'generating' || step === 'inserting') && (
        <div className={styles.progress}>
          <ProgressBar value={progressValue} />
          <Spinner size="tiny" label={progressLabel} />
        </div>
      )}

      {step === 'done' && (
        <MessageBar intent="success" icon={<CheckmarkCircle24Regular />}>
          <MessageBarBody>
            <Text>Image and AI insights added to current slide.</Text>
          </MessageBarBody>
        </MessageBar>
      )}

      {step === 'error' && errorMsg && (
        <MessageBar intent="error">
          <MessageBarBody>{errorMsg}</MessageBarBody>
        </MessageBar>
      )}
    </div>
  );
};
