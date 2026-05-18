/**
 * Fairness layer: optional boost/cap by reservation/region to balance ranking.
 */
export function applyFairnessWeights(rankedList, studentProfile) {
  const category = studentProfile.reservationCategory || 'general';
  const boost = { SC: 1.05, ST: 1.05, OBC: 1.02, EWS: 1.02, PWD: 1.03, general: 1 };
  const weight = boost[category] ?? 1;
  return rankedList.map((item) => ({
    ...item,
    score: item.score * weight,
  })).sort((a, b) => b.score - a.score);
}
