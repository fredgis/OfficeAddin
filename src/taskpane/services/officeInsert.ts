/**
 * Service for inserting images and text into PowerPoint slides via Office.js API.
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

/**
 * Insert a base64 image into the current slide
 */
export async function insertImageToCurrentSlide(base64Image: string, layout: LayoutOption = 'full'): Promise<void> {
  const pos = LAYOUT_POSITIONS[layout];
  await PowerPoint.run(async (context) => {
    const slides = context.presentation.slides;
    slides.load('items');
    await context.sync();

    const currentSlide = slides.items[slides.items.length - 1];
    currentSlide.shapes.addImage(base64Image, {
      left: pos.left,
      top: pos.top,
      width: pos.width,
      height: pos.height,
    });
    await context.sync();
  });
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

    slides.load('items');
    await context.sync();

    const newSlide = slides.items[slides.items.length - 1];
    newSlide.shapes.addImage(base64Image, {
      left: pos.left,
      top: pos.top,
      width: pos.width,
      height: pos.height,
    });

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
