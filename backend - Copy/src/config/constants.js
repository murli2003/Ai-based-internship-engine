/**
 * PM Scheme & policy constants – configurable without code change.
 * In production these could be loaded from DB (admin config).
 */
export const ELIGIBILITY = {
  MIN_CGPA: 6.0,
  MAX_BACKLOGS: 0,
  MIN_YEAR_OF_STUDY: 2,
  MAX_PRIOR_INTERNSHIPS: 3,
};

export const RESERVATION = {
  ENABLED: true,
  SC_ST_PERCENT: 15,
  OBC_PERCENT: 27,
  EWS_PERCENT: 10,
  PWD_PERCENT: 5,
};

export const RANKING = {
  CONTENT_WEIGHT: 0.5,
  ML_WEIGHT: 0.5,
  TOP_K: 20,
};

/** Global API rate limit (per IP). SPAs issue many parallel calls on load — keep dev generous. */
const isProd = process.env.NODE_ENV === 'production';

export const RATE_LIMIT = {
  WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  MAX_REQUESTS:
    process.env.RATE_LIMIT_MAX != null && process.env.RATE_LIMIT_MAX !== ''
      ? Number(process.env.RATE_LIMIT_MAX)
      : isProd
        ? 400
        : 5000,
};
