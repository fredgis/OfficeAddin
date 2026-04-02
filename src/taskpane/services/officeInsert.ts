/**
 * Service for inserting images and text into PowerPoint slides via Office.js API.
 * Uses the Common API (setSelectedDataAsync) for image insertion with positioning,
 * and the PowerPoint-specific API for slide management and text boxes.
 */

export type LayoutOption = 'full' | 'left-half' | 'right-half' | 'quarter-tl' | 'quarter-tr' | 'quarter-bl' | 'quarter-br';

interface InsertPosition {
  left: number;
  top: number;
  width: number;
  height: number;
}

// Slide dimensions in points (standard 16:9 = 960 x 540)
const SLIDE_WIDTH = 960;
const SLIDE_HEIGHT = 540;
const MARGIN = 20;

const LAYOUT_POSITIONS: Record<LayoutOption, InsertPosition> = {
  'full': { left: MARGIN, top: MARGIN, width: SLIDE_WIDTH - 2 * MARGIN, height: SLIDE_HEIGHT - 2 * MARGIN },
  'left-half': { left: MARGIN, top: MARGIN, width: (SLIDE_WIDTH / 2) - 1.5 * MARGIN, height: SLIDE_HEIGHT - 2 * MARGIN },
  'right-half': { left: SLIDE_WIDTH / 2 + MARGIN / 2, top: MARGIN, width: (SLIDE_WIDTH / 2) - 1.5 * MARGIN, height: SLIDE_HEIGHT - 2 * MARGIN },
  'quarter-tl': { left: MARGIN, top: MARGIN, width: (SLIDE_WIDTH / 2) - 1.5 * MARGIN, height: (SLIDE_HEIGHT / 2) - 1.5 * MARGIN },
  'quarter-tr': { left: SLIDE_WIDTH / 2 + MARGIN / 2, top: MARGIN, width: (SLIDE_WIDTH / 2) - 1.5 * MARGIN, height: (SLIDE_HEIGHT / 2) - 1.5 * MARGIN },
  'quarter-bl': { left: MARGIN, top: SLIDE_HEIGHT / 2 + MARGIN / 2, width: (SLIDE_WIDTH / 2) - 1.5 * MARGIN, height: (SLIDE_HEIGHT / 2) - 1.5 * MARGIN },
  'quarter-br': { left: SLIDE_WIDTH / 2 + MARGIN / 2, top: SLIDE_HEIGHT / 2 + MARGIN / 2, width: (SLIDE_WIDTH / 2) - 1.5 * MARGIN, height: (SLIDE_HEIGHT / 2) - 1.5 * MARGIN },
};

/** Promisified wrapper around Office.context.document.setSelectedDataAsync for image insertion */
function setImageAsync(base64Image: string, pos: InsertPosition): Promise<void> {
  return new Promise((resolve, reject) => {
    Office.context.document.setSelectedDataAsync(
      base64Image,
      {
        coercionType: Office.CoercionType.Image,
        imageLeft: pos.left,
        imageTop: pos.top,
        imageWidth: pos.width,
        imageHeight: pos.height,
      },
      (result) => {
        if (result.status === Office.AsyncResultStatus.Failed) {
          reject(new Error(result.error.message));
        } else {
          resolve();
        }
      }
    );
  });
}

/**
 * Insert a base64 image into the current slide
 */
export async function insertImageToCurrentSlide(base64Image: string, layout: LayoutOption = 'full'): Promise<void> {
  const pos = LAYOUT_POSITIONS[layout];
  await setImageAsync(base64Image, pos);
}

/**
 * Insert a base64 image into a new slide
 */
export async function insertImageToNewSlide(base64Image: string, layout: LayoutOption = 'full', title?: string): Promise<void> {
  const pos = LAYOUT_POSITIONS[layout];

  await PowerPoint.run(async (context) => {
    const slides = context.presentation.slides;
    slides.add();
    await context.sync();

    slides.load('items/id');
    await context.sync();

    const newSlide = slides.items[slides.items.length - 1];
    context.presentation.setSelectedSlides([newSlide.id]);

    if (title) {
      newSlide.shapes.addTextBox(title, {
        left: MARGIN,
        top: 5,
        width: SLIDE_WIDTH - 2 * MARGIN,
        height: 30,
      });
    }

    await context.sync();
  });

  await setImageAsync(base64Image, pos);
}

/**
 * Insert a text box into the current slide
 */
export async function insertTextBoxToCurrentSlide(
  text: string,
  options?: { left?: number; top?: number; width?: number; height?: number }
): Promise<void> {
  const left = options?.left ?? MARGIN;
  const top = options?.top ?? MARGIN;
  const width = options?.width ?? SLIDE_WIDTH - 2 * MARGIN;
  const height = options?.height ?? SLIDE_HEIGHT - 2 * MARGIN;
  await PowerPoint.run(async (context) => {
    const slides = context.presentation.slides;
    slides.load('items');
    await context.sync();

    const currentSlide = slides.items[slides.items.length - 1];
    currentSlide.shapes.addTextBox(text, { left, top, width, height });
    await context.sync();
  });
}

/**
 * Insert an image (left 60%) and insights text (right 40%) on a new slide
 */
export async function insertImageWithInsights(
  imageBase64: string,
  insightsText: string,
  title?: string
): Promise<void> {
  const titleHeight = title ? 35 : 0;
  const titleGap = title ? MARGIN / 2 : 0;
  const contentTop = MARGIN + titleHeight + titleGap;
  const contentHeight = SLIDE_HEIGHT - contentTop - MARGIN;
  const imgWidth = (SLIDE_WIDTH - 3 * MARGIN) * 0.6;
  const txtWidth = (SLIDE_WIDTH - 3 * MARGIN) * 0.4;

  await PowerPoint.run(async (context) => {
    const slides = context.presentation.slides;
    slides.add();
    await context.sync();

    slides.load('items/id');
    await context.sync();

    const newSlide = slides.items[slides.items.length - 1];
    context.presentation.setSelectedSlides([newSlide.id]);

    if (title) {
      newSlide.shapes.addTextBox(title, {
        left: MARGIN,
        top: 5,
        width: SLIDE_WIDTH - 2 * MARGIN,
        height: titleHeight,
      });
    }

    newSlide.shapes.addTextBox(insightsText, {
      left: MARGIN + imgWidth + MARGIN,
      top: contentTop,
      width: txtWidth,
      height: contentHeight,
    });
    await context.sync();
  });

  await setImageAsync(imageBase64, {
    left: MARGIN,
    top: contentTop,
    width: imgWidth,
    height: contentHeight,
  });
}

/**
 * Batch insert: multiple images, each on a new slide
 */
export async function batchInsertImages(
  images: Array<{ base64: string; title?: string }>,
  layout: LayoutOption = 'full',
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  for (let i = 0; i < images.length; i++) {
    onProgress?.(i + 1, images.length);
    await insertImageToNewSlide(images[i].base64, layout, images[i].title);
  }
}
