/**
 * The paper mats lying on the desk in table scenes. Each is laid out flat (width × height) and
 * projected onto the desk with a homography fitted to its mockup: corners from the outline,
 * aspect ratio from the round "i" icon (04: verified by aligning every text block; 05: calibrated
 * against 04). Everything on a mat is placed in its flat coordinates.
 */
export const MATS = {
  /** Mockup 04. Corners (288.6, 438.3) (1282.7, 432.3) (1444.7, 872.5) (132, 885.7). */
  accountType: {
    width: 1200,
    height: 614,
    transform:
      'matrix3d(0.838084871, -0.001741588, 0, 0.000007537, -0.30746664, 0.376949134, 0, -0.000397104, 0, 0, 1, 0, 288.6, 438.3, 0, 1)',
  },
  /** Mockup 05. Corners (262.4, 436.7) (1280.3, 431.6) (1469, 915.5) (85.1, 925.9). */
  verifyIdentity: {
    width: 1200,
    height: 671,
    transform:
      'matrix3d(0.853854813, -0.00236057, 0, 0.000004378, -0.297864907, 0.363135652, 0, -0.000395211, 0, 0, 1, 0, 262.4, 436.7, 0, 1)',
  },
  /** Mockup 08. Corners (134.5, 517) (1347, 517) (1437, 877.5) (40.8, 877.5); aspect from the title's glyph proportions. */
  closingBalance: {
    width: 1200,
    height: 425,
    transform: 'matrix3d(1.010416667, 0, 0, 0, -0.233101443, 0.576579034, 0, -0.00030958, 0, 0, 1, 0, 134.5, 517, 0, 1)',
  },
} as const

export type MatName = keyof typeof MATS
