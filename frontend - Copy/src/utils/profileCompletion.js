/**
 * Returns a 0-100 completion score for a student profile.
 */
export function getProfileCompletion(profile) {
  if (!profile) return 0;
  const checks = [
    !!profile.fullName,
    !!profile.university,
    !!profile.phone,
    !!profile.github || !!profile.linkedin,
    (profile.skills?.length ?? 0) >= 2,
    !!profile.bio,
    !!(profile.resumeProfile?.education?.length ?? 0),
    !!(profile.resumeProfile?.experiences?.length ?? 0) || !!(profile.resumeProfile?.projects?.length ?? 0),
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}

export function getMissingFields(profile) {
  const items = [];
  if (!profile?.fullName)    items.push('Full name');
  if (!profile?.university)  items.push('University');
  if (!profile?.phone)       items.push('Phone number');
  if (!profile?.github && !profile?.linkedin) items.push('GitHub or LinkedIn');
  if ((profile?.skills?.length ?? 0) < 2)    items.push('At least 2 skills');
  if (!profile?.bio)         items.push('Short bio');
  if (!(profile?.resumeProfile?.education?.length))   items.push('Education details');
  if (!(profile?.resumeProfile?.experiences?.length) && !(profile?.resumeProfile?.projects?.length)) {
    items.push('Experience or projects');
  }
  return items;
}
