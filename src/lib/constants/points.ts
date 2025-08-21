/**
 * Core point system constants
 * These values should be used throughout the application
 * to ensure consistent point calculations
 */
export const POINTS = {
  /** Base points every user gets */
  BASE: 1000,

  /** Additional bonus points for OG members */
  OG_BONUS: 10000,

  /** Minimum total points any user should have */
  MIN_TOTAL: 1000,

  /** Minimum total points any OG member should have (BASE + OG_BONUS) */
  OG_MIN_TOTAL: 11000,
} as const;

/**
 * Calculate minimum points a user should have
 * @param isOG - Whether the user is an OG member
 * @returns Minimum points the user should have
 */
export function calculateMinimumPoints(isOG: boolean): number {
  return isOG ? POINTS.OG_MIN_TOTAL : POINTS.MIN_TOTAL;
}

/**
 * Calculate base points (excluding session points)
 * @param isOG - Whether the user is an OG member
 * @returns Base points including OG bonus if applicable
 */
export function calculateBasePoints(isOG: boolean): number {
  return POINTS.BASE + (isOG ? POINTS.OG_BONUS : 0);
}

/**
 * Validate that points meet minimum requirements
 * @param points - Current point total
 * @param isOG - Whether the user is an OG member
 * @returns Whether points meet minimum requirements
 */
export function validateMinimumPoints(points: number, isOG: boolean): boolean {
  return points >= calculateMinimumPoints(isOG);
}
