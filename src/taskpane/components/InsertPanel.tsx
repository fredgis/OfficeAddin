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
  SlideLayout24Regular,
  ImageMultiple24Regular,
} from '@fluentui/react-icons';
import type { ExportResult } from '../types/powerbi';
import {
  insertImageToCurrentSlide,
  LayoutOption,
} from '../services/officeInsert';

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
    ...shorthands.borderBottom('2px', 'solid', '#0078d4'),
    color: '#0078d4',
  },
  preview: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    alignItems: 'center',
    paddingTop: '8px',
    paddingBottom: '8px',
  },
  previewImage: {
    maxWidth: '100%',
    ...shorthands.borderRadius('6px'),
    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
    transitionProperty: 'box-shadow, transform',
    transitionDuration: '200ms',
    ':hover': {
      boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
      transform: 'scale(1.01)',
    },
  },
  layoutLabel: {
    color: '#616161',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  layoutGroup: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  actions: {
    display: 'flex',
    flexDirection: 'row',
    gap: '8px',
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

  if (!exportResult) return null;

  return (
    <div className={styles.root}>
      <div className={styles.sectionHeader}>
        <ImageMultiple24Regular />
        <Text weight="semibold" size={300}>Preview & Insert</Text>
      </div>

      <div className={styles.preview}>
        <img
          className={styles.previewImage}
          src={`data:${exportResult.mimeType};base64,${exportResult.image}`}
          alt={`Export of ${pageName}`}
        />
      </div>

      <Text className={styles.layoutLabel}>Layout</Text>
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
          Insert to Current Slide
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
