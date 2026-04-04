import React, { useState, useCallback } from 'react';
import {
  Button,
  Spinner,
  Text,
  MessageBar,
  MessageBarBody,
  Card,
  CardHeader,
  Caption1,
  ProgressBar,
  makeStyles,
  tokens,
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
    gap: tokens.spacingVerticalM,
    width: '100%',
    paddingTop: tokens.spacingVerticalM,
  },
  progress: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
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
      <Card size="small">
        <CardHeader
          image={<Sparkle24Regular />}
          header={<Text weight="semibold">One-Click Insert</Text>}
          description={
            <Caption1>Image (60%) + AI insights (40%) on a new slide</Caption1>
          }
        />
      </Card>

      <Button
        appearance="primary"
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
            <Text>Slide created with page image and AI insights.</Text>
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
