/**
 * Computes success rate as a percentage (0–100) from resolved outcomes.
 * Pending submissions are excluded from the denominator.
 */
export function calculateSuccessRate(successCount: number, failureCount: number): number {
  const resolvedCount = successCount + failureCount;
  if (resolvedCount === 0) {
    return 0;
  }

  return (successCount / resolvedCount) * 100;
}
