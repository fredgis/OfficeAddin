/**
 * Tests for Office.js insertion service.
 * The Office.js globals are mocked via the setupFiles in jest.config.js.
 */
import {
  mockSetSelectedDataAsync,
  mockPowerPointRun,
  mockPresentation,
  mockSlides,
  mockSlideItems,
} from '../mocks/officeMock';

import {
  insertImageToCurrentSlide,
  insertImageToNewSlide,
  insertTextBoxToCurrentSlide,
  insertImageWithInsights,
  batchInsertImages,
} from '../../services/officeInsert';

describe('officeInsert service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset slide items to initial state
    mockSlideItems.length = 0;
    mockSlideItems.push({
      id: 'slide-1',
      shapes: { addTextBox: jest.fn() },
    });
  });

  // ── insertImageToCurrentSlide ─────────────────────────────────────────
  describe('insertImageToCurrentSlide', () => {
    it('calls setSelectedDataAsync with full layout by default', async () => {
      await insertImageToCurrentSlide('base64data');

      expect(mockSetSelectedDataAsync).toHaveBeenCalledWith(
        'base64data',
        expect.objectContaining({
          coercionType: 'image',
          imageLeft: 20,
          imageTop: 20,
          imageWidth: 920,
          imageHeight: 500,
        }),
        expect.any(Function),
      );
    });

    it('uses left-half layout positions', async () => {
      await insertImageToCurrentSlide('base64data', 'left-half');

      expect(mockSetSelectedDataAsync).toHaveBeenCalledWith(
        'base64data',
        expect.objectContaining({
          imageLeft: 20,
          imageTop: 20,
        }),
        expect.any(Function),
      );
    });

    it('uses right-half layout positions', async () => {
      await insertImageToCurrentSlide('base64data', 'right-half');

      expect(mockSetSelectedDataAsync).toHaveBeenCalledWith(
        'base64data',
        expect.objectContaining({
          imageLeft: 490, // SLIDE_WIDTH / 2 + MARGIN / 2
        }),
        expect.any(Function),
      );
    });

    it('rejects when Office.js reports failure', async () => {
      mockSetSelectedDataAsync.mockImplementationOnce(
        (_data: unknown, _options: unknown, callback: (result: { status: number; error: { message: string } }) => void) => {
          callback({ status: 1, error: { message: 'Insert failed' } });
        },
      );

      await expect(insertImageToCurrentSlide('base64data')).rejects.toThrow('Insert failed');
    });
  });

  // ── insertImageToNewSlide ─────────────────────────────────────────────
  describe('insertImageToNewSlide', () => {
    it('adds a new slide via PowerPoint.run then inserts the image', async () => {
      await insertImageToNewSlide('base64data');

      expect(mockPowerPointRun).toHaveBeenCalled();
      expect(mockSetSelectedDataAsync).toHaveBeenCalled();
    });

    it('adds a title text box when title is provided', async () => {
      await insertImageToNewSlide('base64data', 'full', 'My Title');

      expect(mockPowerPointRun).toHaveBeenCalled();
      // The last slide item should have had addTextBox called
      const lastSlide = mockSlideItems[mockSlideItems.length - 1];
      expect(lastSlide.shapes.addTextBox).toHaveBeenCalledWith(
        'My Title',
        expect.objectContaining({ left: 20, top: 5 }),
      );
    });
  });

  // ── insertTextBoxToCurrentSlide ───────────────────────────────────────
  describe('insertTextBoxToCurrentSlide', () => {
    it('inserts text via PowerPoint.run', async () => {
      await insertTextBoxToCurrentSlide('Hello World');

      expect(mockPowerPointRun).toHaveBeenCalled();
    });

    it('passes custom position options', async () => {
      await insertTextBoxToCurrentSlide('Test', { left: 100, top: 200, width: 300, height: 400 });

      expect(mockPowerPointRun).toHaveBeenCalled();
    });
  });

  // ── insertImageWithInsights ───────────────────────────────────────────
  describe('insertImageWithInsights', () => {
    it('creates a new slide and inserts both image and text box', async () => {
      await insertImageWithInsights('base64img', 'Key insight: Revenue up 15%');

      expect(mockPowerPointRun).toHaveBeenCalled();
      expect(mockSetSelectedDataAsync).toHaveBeenCalled();
    });
  });

  // ── batchInsertImages ─────────────────────────────────────────────────
  describe('batchInsertImages', () => {
    it('inserts each image on a new slide', async () => {
      const images = [
        { base64: 'img1', title: 'Slide 1' },
        { base64: 'img2', title: 'Slide 2' },
      ];

      await batchInsertImages(images);

      // PowerPoint.run called once per image
      expect(mockPowerPointRun).toHaveBeenCalledTimes(2);
      expect(mockSetSelectedDataAsync).toHaveBeenCalledTimes(2);
    });

    it('reports progress via onProgress callback', async () => {
      const images = [{ base64: 'img1' }, { base64: 'img2' }, { base64: 'img3' }];
      const onProgress = jest.fn();

      await batchInsertImages(images, 'full', onProgress);

      expect(onProgress).toHaveBeenCalledTimes(3);
      expect(onProgress).toHaveBeenCalledWith(1, 3);
      expect(onProgress).toHaveBeenCalledWith(2, 3);
      expect(onProgress).toHaveBeenCalledWith(3, 3);
    });
  });

  // ── Layout calculations ───────────────────────────────────────────────
  describe('layout calculations', () => {
    it('quarter-tl positions image in top-left quadrant', async () => {
      await insertImageToCurrentSlide('base64data', 'quarter-tl');

      expect(mockSetSelectedDataAsync).toHaveBeenCalledWith(
        'base64data',
        expect.objectContaining({
          imageLeft: 20,
          imageTop: 20,
        }),
        expect.any(Function),
      );
    });

    it('quarter-br positions image in bottom-right quadrant', async () => {
      await insertImageToCurrentSlide('base64data', 'quarter-br');

      expect(mockSetSelectedDataAsync).toHaveBeenCalledWith(
        'base64data',
        expect.objectContaining({
          imageLeft: 490, // SLIDE_WIDTH / 2 + MARGIN / 2
          imageTop: 280,  // SLIDE_HEIGHT / 2 + MARGIN / 2
        }),
        expect.any(Function),
      );
    });
  });
});
