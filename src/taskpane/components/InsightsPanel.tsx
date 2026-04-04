import React, { useState, useCallback } from 'react';
import {
  Button,
  Spinner,
  Text,
  Textarea,
  MessageBar,
  MessageBarBody,
  Card,
  CardHeader,
  Body1,
  Caption1,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import type { InsightItem, InsightResult } from '../services/api/powerbiClient';
import { useGenerateInsights } from '../hooks/usePowerBI';
import { insertTextBoxToCurrentSlide } from '../services/officeInsert';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    width: '100%',
    paddingTop: tokens.spacingVerticalM,
  },
  header: {
    fontWeight: tokens.fontWeightSemibold,
  },
  insightsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  insightCard: {
    padding: tokens.spacingVerticalS,
  },
  actions: {
    display: 'flex',
    flexDirection: 'row',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
  editArea: {
    width: '100%',
  },
  promptArea: {
    width: '100%',
  },
});

interface InsightsPanelProps {
  reportId: string;
  pageName: string;
  reportName?: string;
  workspaceName?: string;
  datasetId?: string;
  imageBase64?: string;
  onInsightsGenerated?: (result: InsightResult) => void;
}

function formatInsightsText(insights: InsightItem[]): string {
  return insights.map((item, i) => `${i + 1}. ${item.headline}\n${item.detail}`).join('\n\n');
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({
  reportId,
  pageName,
  reportName,
  workspaceName,
  datasetId,
  imageBase64,
  onInsightsGenerated,
}) => {
  const styles = useStyles();
  const insightsMutation = useGenerateInsights();
  const [customPrompt, setCustomPrompt] = useState('');
  const [editedText, setEditedText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [inserting, setInserting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const clearMessages = useCallback(() => {
    setSuccessMsg(null);
    setErrorMsg(null);
  }, []);

  const handleGenerate = useCallback(() => {
    clearMessages();
    insightsMutation.mutate(
      {
        reportId,
        pageName,
        reportName,
        workspaceName,
        datasetId,
        imageBase64,
        customPrompt: customPrompt || undefined,
      },
      {
        onSuccess: (result) => {
          setEditedText(formatInsightsText(result.insights));
          setIsEditing(false);
          onInsightsGenerated?.(result);
        },
      }
    );
  }, [reportId, pageName, reportName, workspaceName, datasetId, imageBase64, customPrompt, insightsMutation, clearMessages, onInsightsGenerated]);

  const handleInsertText = useCallback(async () => {
    clearMessages();
    setInserting(true);
    try {
      await insertTextBoxToCurrentSlide(editedText);
      setSuccessMsg('Insights inserted into current slide.');
    } catch (err) {
      setErrorMsg(`Insert failed: ${(err as Error).message}`);
    } finally {
      setInserting(false);
    }
  }, [editedText, clearMessages]);

  const insights = insightsMutation.data?.insights;

  return (
    <div className={styles.root} role="region" aria-label="AI Insights">
      <Card>
        <CardHeader
          header={<Body1 className={styles.header}>AI Insights</Body1>}
          description={<Caption1>{imageBase64 ? 'AI will analyze the exported report image' : 'Generate insights based on report metadata'}</Caption1>}
        />
      </Card>

      <Textarea
        className={styles.promptArea}
        placeholder="Optional: custom prompt for insights…"
        value={customPrompt}
        onChange={(_e, data) => setCustomPrompt(data.value)}
        resize="vertical"
        rows={2}
        aria-label="Custom prompt for insights"
      />

      <div className={styles.actions}>
        <Button
          appearance="primary"
          onClick={handleGenerate}
          disabled={insightsMutation.isPending}
          aria-label="Generate AI insights"
        >
          Generate Insights
        </Button>
      </div>

      {insightsMutation.isPending && (
        <Spinner size="medium" label="Generating insights…" />
      )}

      {insightsMutation.isError && (
        <MessageBar intent="error">
          <MessageBarBody>
            Insights generation failed: {(insightsMutation.error as Error).message}
          </MessageBarBody>
        </MessageBar>
      )}

      {insights && !insightsMutation.isPending && (
        <>
          {!isEditing ? (
            <>
              <Text weight="semibold">Generated Insights</Text>
              <div className={styles.insightsList}>
                {insights.map((item, index) => (
                  <Card key={index} className={styles.insightCard}>
                    <Text weight="semibold">{item.headline}</Text>
                    <Text>{item.detail}</Text>
                  </Card>
                ))}
              </div>
              <Button
                appearance="subtle"
                size="small"
                onClick={() => setIsEditing(true)}
                aria-label="Edit insights before inserting"
              >
                Edit before inserting
              </Button>
            </>
          ) : (
            <>
              <Text weight="semibold">Edit Insights</Text>
              <Textarea
                className={styles.editArea}
                value={editedText}
                onChange={(_e, data) => setEditedText(data.value)}
                resize="vertical"
                rows={8}
                aria-label="Edit insights text"
              />
              <Button
                appearance="subtle"
                size="small"
                onClick={() => setIsEditing(false)}
              >
                Done editing
              </Button>
            </>
          )}

          <div className={styles.actions}>
            <Button
              appearance="primary"
              onClick={handleInsertText}
              disabled={inserting || !editedText}
              aria-label="Insert insights as text box"
            >
              Insert Insights
            </Button>
          </div>
        </>
      )}

      {inserting && <Spinner size="small" label="Inserting…" />}

      <div aria-live="polite">
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
    </div>
  );
};
