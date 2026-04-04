import React, { useState, useCallback } from 'react';
import {
  Button,
  Spinner,
  Text,
  Textarea,
  MessageBar,
  MessageBarBody,
  makeStyles,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import {
  Lightbulb24Regular,
  TextBulletListSquare24Regular,
  Edit24Regular,
  Checkmark24Regular,
} from '@fluentui/react-icons';
import type { InsightItem, InsightResult } from '../services/api/powerbiClient';
import { useGenerateInsights } from '../hooks/usePowerBI';
import { insertTextBoxToCurrentSlide } from '../services/officeInsert';

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
    ...shorthands.borderBottom('2px', 'solid', '#5c2d91'),
    color: '#5c2d91',
  },
  insightsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  insightCard: {
    backgroundColor: '#faf9ff',
    ...shorthands.border('1px', 'solid', '#e8e0f0'),
    ...shorthands.borderRadius('6px'),
    paddingTop: '10px',
    paddingBottom: '10px',
    paddingLeft: '12px',
    paddingRight: '12px',
  },
  actions: {
    display: 'flex',
    flexDirection: 'row',
    gap: '8px',
    flexWrap: 'wrap',
  },
  editArea: {
    width: '100%',
  },
  promptArea: {
    width: '100%',
  },
  subLabel: {
    color: '#616161',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
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
  return insights.map((item, i) => `${i + 1}. ${item.headline}\n${item.body}`).join('\n\n');
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
      <div className={styles.sectionHeader}>
        <Lightbulb24Regular />
        <Text weight="semibold" size={300}>AI Insights</Text>
      </div>
      <Text size={200} style={{ color: '#616161' }}>
        {imageBase64 ? 'AI will analyze the exported report image' : 'Generate insights based on report metadata'}
      </Text>

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
          icon={<Lightbulb24Regular />}
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
              <Text className={styles.subLabel}>Generated Insights</Text>
              <div className={styles.insightsList}>
                {insights.map((item, index) => (
                  <div key={index} className={styles.insightCard}>
                    <Text weight="semibold" size={300}>{item.headline}</Text>
                    <br />
                    <Text size={200}>{item.body}</Text>
                  </div>
                ))}
              </div>
              <Button
                appearance="subtle"
                size="small"
                icon={<Edit24Regular />}
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
                icon={<Checkmark24Regular />}
                onClick={() => setIsEditing(false)}
              >
                Done editing
              </Button>
            </>
          )}

          <div className={styles.actions}>
            <Button
              appearance="primary"
              icon={<TextBulletListSquare24Regular />}
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
