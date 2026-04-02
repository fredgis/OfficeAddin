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
import type { ExportResult, ReportPage } from '../types/powerbi';
import type { InsightItem } from '../types/insights';
import { useGenerateInsights } from '../hooks/useInsights';
import {
  insertTextBoxToCurrentSlide,
  insertImageWithInsights,
} from '../services/officeInsert';

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
  insightItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
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
});

interface InsightsPanelProps {
  reportId: string;
  page: ReportPage;
  exportResult: ExportResult | null;
}

function formatInsightsText(insights: InsightItem[]): string {
  return insights.map((item, i) => `${i + 1}. ${item.headline}\n${item.detail}`).join('\n\n');
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({
  reportId,
  page,
  exportResult,
}) => {
  const styles = useStyles();
  const insightsMutation = useGenerateInsights();
  const [editedText, setEditedText] = useState<string>('');
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
        pageName: page.name,
        imageBase64: exportResult?.image,
      },
      {
        onSuccess: (response) => {
          setEditedText(formatInsightsText(response.insights));
          setIsEditing(false);
        },
      }
    );
  }, [reportId, page.name, exportResult, insightsMutation, clearMessages]);

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

  const handleInsertWithImage = useCallback(async () => {
    if (!exportResult) return;
    clearMessages();
    setInserting(true);
    try {
      await insertImageWithInsights(exportResult.image, editedText);
      setSuccessMsg('Page and insights inserted into a new slide.');
    } catch (err) {
      setErrorMsg(`Insert failed: ${(err as Error).message}`);
    } finally {
      setInserting(false);
    }
  }, [exportResult, editedText, clearMessages]);

  const insights = insightsMutation.data?.insights;

  return (
    <div className={styles.root} role="region" aria-label="AI Insights">
      <Card>
        <CardHeader
          header={<Body1 className={styles.header}>AI Insights: {page.displayName}</Body1>}
          description={<Caption1>Generate executive insights for this report page</Caption1>}
        />
      </Card>

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
        <Spinner size="medium" label="Generating insights… This may take a moment." />
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
                  <div key={index} className={styles.insightItem}>
                    <Text weight="semibold">{item.headline}</Text>
                    <Text>{item.detail}</Text>
                  </div>
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
            {exportResult && (
              <Button
                appearance="secondary"
                onClick={handleInsertWithImage}
                disabled={inserting || !editedText}
                aria-label="Insert page image with insights"
              >
                Insert Page + Insights
              </Button>
            )}
          </div>
        </>
      )}

      {inserting && <Spinner size="small" label="Inserting…" />}

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
  );
};
