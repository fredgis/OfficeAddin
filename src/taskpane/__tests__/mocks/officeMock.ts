/**
 * Mock for Office.js APIs used in frontend tests.
 * Sets up global Office and PowerPoint namespaces.
 */

const mockAsyncResult = (status: 'succeeded' | 'failed', errorMessage?: string) => ({
  status: status === 'succeeded' ? 0 : 1, // Office.AsyncResultStatus.Succeeded = 0
  error: errorMessage ? { message: errorMessage } : undefined,
});

const mockSetSelectedDataAsync = jest.fn(
  (_data: unknown, _options: unknown, callback: (result: unknown) => void) => {
    callback(mockAsyncResult('succeeded'));
  }
);

const mockDocument = {
  setSelectedDataAsync: mockSetSelectedDataAsync,
};

const mockContext = {
  document: mockDocument,
};

// Slide mock
const createSlideMock = (id: string) => ({
  id,
  shapes: {
    addTextBox: jest.fn(),
  },
});

const mockSlideItems = [createSlideMock('slide-1')];

const mockSlides = {
  add: jest.fn(() => {
    mockSlideItems.push(createSlideMock(`slide-${mockSlideItems.length + 1}`));
  }),
  load: jest.fn(),
  items: mockSlideItems,
};

const mockPresentation = {
  slides: mockSlides,
  setSelectedSlides: jest.fn(),
};

const mockPowerPointRun = jest.fn(async (callback: (ctx: unknown) => Promise<void>) => {
  const ctx = {
    presentation: mockPresentation,
    sync: jest.fn().mockResolvedValue(undefined),
  };
  await callback(ctx);
});

// Set globals
(global as Record<string, unknown>).Office = {
  context: mockContext,
  CoercionType: { Image: 'image' },
  AsyncResultStatus: { Succeeded: 0, Failed: 1 },
  onReady: jest.fn((callback?: () => void) => {
    callback?.();
    return Promise.resolve();
  }),
};

(global as Record<string, unknown>).PowerPoint = {
  run: mockPowerPointRun,
};

export {
  mockSetSelectedDataAsync,
  mockDocument,
  mockContext,
  mockSlides,
  mockPresentation,
  mockPowerPointRun,
  mockSlideItems,
};
