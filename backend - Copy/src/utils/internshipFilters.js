/**
 * Returns a MongoDB filter for "active" internships.
 * Considers both the legacy `status` field and the newer `isActive` boolean.
 */
export const activeInternshipFilter = {
  $or: [
    { status: 'active', isActive: { $ne: false } },
    { isActive: true },
  ],
};
