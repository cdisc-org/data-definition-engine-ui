export const modals = {
  ERROR: 'ERROR',
} as const;

export const paths = {
  STEP1: '/step-1',
  STEP2: '/step-2',
  STEP3: '/step-3',
  DEFINEXML: '/definexml',
} as const;

export type ModalType = (typeof modals)[keyof typeof modals];
export type AllowedPathnames = (typeof paths)[keyof typeof paths];
