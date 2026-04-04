import React, { useState, useCallback } from 'react';
import {
  Button,
  Spinner,
  RadioGroup,
  Radio,
  Text,
  MessageBar,
  MessageBarBody,
  makeStyles,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import {
  SlideAdd24Regular,
  SlideLayout24Regular,
} from '@fluentui/react-icons';
import type { ExportResult } from '../types/powerbi';
import {
  insertImageToCurrentSlide,
  insertImageToNewSlide,
  LayoutOption,
} from '../services/officeInsert';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    width: '100%',
  },
  sectionLabel: {
    color: tokens.colorNeutralForeground3,
  },
  preview: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    alignItems: 'center',
  },
  previewImage: {
    maxWidth: '100%',
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    boxShadow: tokens.shadow8,
    transitionProperty: 'box-shadow',
    transitionDuration: '200ms',
    ':hover': {
      boxShadow: tokens.shadow16,
    },
  },
  layoutGroup: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  actions: {
    display: 'flex',
    flexDirection: 'row',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
});

interface InsertPanelProps {
  exportResult: ExportResult | null;
  pageName: string;
}

export const InsertPanel: React.FC<InsertPanelProps> = ({ exportResult, pageName }) => {
  const styles = useStyles();
  const [layout, setLayout] = useState<LayoutOption>('full');
  const [inserting, setInserting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const clearMessages = useCallback(() => {
    setSuccessMsg(null);
    setErrorMsg(null);
  }, []);

  const handleInsertCurrent = useCallback(async () => {
    if (!exportResult) return;
    clearMessages();
    setInserting(true);
    try {
      await insertImageToCurrentSlide(exportResult.image, layout);
      setSuccessMsg('Image inserted into current slide.');
    } catch (err) {
      setErrorMsg(`Insert failed: ${(err as Error).message}`);
    } finally {
      setInserting(false);
    }
  }, [exportResult, layout, clearMessages]);

  const handleInsertNew = useCallback(async () => {
    if (!exportResult) return;
    clearMessages();
    setInserting(true);
    try {
      await insertImageToNewSlide(exportResult.image, layout, pageName);
      setSuccessMsg('Image inserted into a new slide.');
    } catch (err) {
      setErrorMsg(`Insert failed: ${(err as Error).message}`);
    } finally {
      setInserting(false);
    }
  }, [exportResult, layout, pageName, clearMessages]);

  if (!exportResult) return null;

  return (
    <div className={styles.root}>
      <div className={styles.preview}>
        <Text className={styles.sectionLabel} size={200} weight="semibold">PREVIEW</Text>
        <img
          className={styles.previewImage}
          src={`data:${exportResult.mimeType};base64,${exportResult.image}`}
          alt={`Export of ${pageName}`}
        />
      </div>

      <Text className={styles.sectionLabel} size={200} weight="semibold">LAYOUT</Text>
      <RadioGroup
        className={styles.layoutGroup}
        layout="horizontal"
        value={layout}
        onChange={(_e, data) => setLayout(data.value as LayoutOption)}
      >
        <Radio value="full" label="Full" />
        <Radio value="left-half" label="Left" />
        <Radio value="right-half" label="Right" />
        <Radio value="quarter-tl" label="↖" />
        <Radio value="quarter-tr" label="↗" />
        <Radio value="quarter-bl" label="↙" />
        <Radio value="quarter-br" label="↘" />
      </RadioGroup>

      <div className={styles.actions}>
        <Button
          appearance="primary"
          icon={<SlideLayout24Regular />}
          onClick={handleInsertCurrent}
          disabled={inserting}
          aria-label="Insert image into current slide"
        >
          Current Slide
        </Button>
        <Button
          appearance="secondary"
          icon={<SlideAdd24Regular />}
          onClick={handleInsertNew}
          disabled={inserting}
          aria-label="Insert image into new slide"
        >
          New Slide
        </Button>
      </div>

      {inserting && <Spinner size="small" label="Inserting image…" />}

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
