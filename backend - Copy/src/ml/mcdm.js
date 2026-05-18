/**
 * Multi-Criteria Decision Making (MCDM) Module
 * Implements advanced ranking algorithms including TOPSIS and AHP
 * Used for final internship ranking considering multiple criteria
 */

/**
 * Normalize decision matrix using vector normalization
 * @param {Array<Array<number>>} matrix - Decision matrix
 * @returns {Array<Array<number>>} - Normalized matrix
 */
function normalizeMatrix(matrix) {
	const normalized = [];
	const cols = matrix[0].length;

	for (let j = 0; j < cols; j++) {
		let sumSquares = 0;
		for (let i = 0; i < matrix.length; i++) {
			sumSquares += matrix[i][j] * matrix[i][j];
		}
		const norm = Math.sqrt(sumSquares);

		for (let i = 0; i < matrix.length; i++) {
			if (!normalized[i]) normalized[i] = [];
			normalized[i][j] = norm > 0 ? matrix[i][j] / norm : 0;
		}
	}

	return normalized;
}

/**
 * Calculate weighted normalized matrix
 * @param {Array<Array<number>>} normalized - Normalized matrix
 * @param {Array<number>} weights - Criteria weights
 * @returns {Array<Array<number>>} - Weighted matrix
 */
function applyWeights(normalized, weights) {
	return normalized.map((row) => row.map((val, j) => val * weights[j]));
}

/**
 * Euclidean distance between two vectors
 * @param {Array<number>} a - First vector
 * @param {Array<number>} b - Second vector
 * @returns {number} - Distance
 */
function euclideanDistance(a, b) {
	return Math.sqrt(
		a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0),
	);
}

/**
 * TOPSIS (Technique for Order of Preference by Similarity to Ideal Solution)
 * Advanced MCDM algorithm for ranking alternatives
 * @param {Array<Object>} alternatives - List of alternatives with criteria scores
 * @param {Object} criteriaConfig - Configuration for each criterion
 * @returns {Array<Object>} - Ranked alternatives with TOPSIS scores
 */
export function topsis(alternatives, criteriaConfig) {
	if (!alternatives || alternatives.length === 0) return [];

	const criteriaNames = Object.keys(criteriaConfig);

	// Build decision matrix
	const matrix = alternatives.map((alt) =>
		criteriaNames.map((criterion) => alt[criterion] || 0),
	);

	// Extract weights and benefit/cost indicators
	const weights = criteriaNames.map((name) => criteriaConfig[name].weight);
	const isBenefit = criteriaNames.map(
		(name) => criteriaConfig[name].benefit !== false,
	);

	// Normalize matrix
	const normalized = normalizeMatrix(matrix);

	// Apply weights
	const weighted = applyWeights(normalized, weights);

	// Determine ideal best and ideal worst solutions
	const idealBest = [];
	const idealWorst = [];

	for (let j = 0; j < criteriaNames.length; j++) {
		const column = weighted.map((row) => row[j]);
		if (isBenefit[j]) {
			idealBest[j] = Math.max(...column);
			idealWorst[j] = Math.min(...column);
		} else {
			idealBest[j] = Math.min(...column);
			idealWorst[j] = Math.max(...column);
		}
	}

	// Calculate distances to ideal best and worst
	const results = weighted.map((row, idx) => {
		const distanceToBest = euclideanDistance(row, idealBest);
		const distanceToWorst = euclideanDistance(row, idealWorst);
		const topsisScore =
			distanceToWorst / (distanceToBest + distanceToWorst);

		return {
			...alternatives[idx],
			topsisScore: isNaN(topsisScore) ? 0 : topsisScore,
			distanceToBest,
			distanceToWorst,
		};
	});

	// Sort by TOPSIS score (higher is better)
	return results.sort((a, b) => b.topsisScore - a.topsisScore);
}

/**
 * Analytic Hierarchy Process (AHP) - Calculate priority vector
 * @param {Array<Array<number>>} pairwiseMatrix - Pairwise comparison matrix
 * @returns {Object} - Priority vector and consistency ratio
 */
export function ahp(pairwiseMatrix) {
	const n = pairwiseMatrix.length;

	// Calculate column sums
	const columnSums = Array(n).fill(0);
	for (let j = 0; j < n; j++) {
		for (let i = 0; i < n; i++) {
			columnSums[j] += pairwiseMatrix[i][j];
		}
	}

	// Normalize matrix
	const normalized = pairwiseMatrix.map((row) =>
		row.map((val, j) => val / columnSums[j]),
	);

	// Calculate priority vector (row averages)
	const priorities = normalized.map(
		(row) => row.reduce((sum, val) => sum + val, 0) / n,
	);

	// Calculate consistency (lambda max)
	const weightedSum = Array(n).fill(0);
	for (let i = 0; i < n; i++) {
		for (let j = 0; j < n; j++) {
			weightedSum[i] += pairwiseMatrix[i][j] * priorities[j];
		}
	}

	const lambdaMax =
		weightedSum.reduce((sum, val, i) => sum + val / priorities[i], 0) / n;

	// Consistency Index (CI)
	const ci = (lambdaMax - n) / (n - 1);

	// Random Index (RI) values for different matrix sizes
	const riValues = [0, 0, 0.58, 0.9, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49];
	const ri = riValues[n - 1] || 1.49;

	// Consistency Ratio (CR)
	const cr = ci / ri;

	return {
		priorities,
		lambdaMax,
		consistencyRatio: cr,
		isConsistent: cr < 0.1, // CR < 0.1 is acceptable
	};
}

/**
 * Calculate comprehensive ranking score for internship recommendations
 * @param {Object} recommendation - Recommendation object
 * @param {Object} studentProfile - Student profile
 * @param {Object} weights - Weights for different criteria
 * @returns {number} - Comprehensive score
 */
export function calculateComprehensiveScore(
	recommendation,
	studentProfile,
	weights = {},
) {
	const defaultWeights = {
		skillMatch: 0.3,
		academicFit: 0.15,
		domainPreference: 0.15,
		locationPreference: 0.1,
		modePreference: 0.05,
		collaborativeScore: 0.15,
		providerReputation: 0.05,
		learningOpportunity: 0.05,
	};

	const finalWeights = { ...defaultWeights, ...weights };

	// Extract scores
	const scores = {
		skillMatch: recommendation.matchPercent / 100,
		academicFit: calculateAcademicFit(
			recommendation.internship,
			studentProfile,
		),
		domainPreference: recommendation.explanation?.factors?.domainMatch
			? 1
			: 0.3,
		locationPreference: recommendation.explanation?.factors?.locationMatch
			? 1
			: 0.3,
		modePreference: calculateModeMatch(
			recommendation.internship,
			studentProfile,
		),
		collaborativeScore: recommendation.collaborativeScore || 0,
		providerReputation: calculateProviderReputation(
			recommendation.internship,
		),
		learningOpportunity: calculateLearningOpportunity(recommendation),
	};

	// Calculate weighted sum
	let comprehensiveScore = 0;
	Object.keys(finalWeights).forEach((key) => {
		comprehensiveScore += (scores[key] || 0) * finalWeights[key];
	});

	return Math.min(Math.max(comprehensiveScore, 0), 1);
}

/**
 * Calculate academic fit score
 * @param {Object} internship - Internship details
 * @param {Object} studentProfile - Student profile
 * @returns {number} - Academic fit score (0-1)
 */
function calculateAcademicFit(internship, studentProfile) {
	let score = 0.5; // Base score

	// CGPA match
	if (internship.minCgpa && studentProfile.cgpa) {
		const cgpaDiff = studentProfile.cgpa - internship.minCgpa;
		if (cgpaDiff >= 2) score += 0.5;
		else if (cgpaDiff >= 1) score += 0.3;
		else if (cgpaDiff >= 0) score += 0.1;
		else score -= 0.3;
	}

	// Branch/degree match
	if (internship.eligibleBranches && studentProfile.branch) {
		const branchMatch = internship.eligibleBranches.some(
			(b) =>
				b.toLowerCase().includes(studentProfile.branch.toLowerCase()) ||
				studentProfile.branch.toLowerCase().includes(b.toLowerCase()),
		);
		if (branchMatch) score += 0.2;
	}

	return Math.min(Math.max(score, 0), 1);
}

/**
 * Calculate mode preference match
 * @param {Object} internship - Internship details
 * @param {Object} studentProfile - Student profile
 * @returns {number} - Mode match score (0-1)
 */
function calculateModeMatch(internship, studentProfile) {
	if (!internship.mode || !studentProfile.preferences?.mode) return 0.5;

	if (internship.mode === studentProfile.preferences.mode) return 1;
	if (
		internship.mode === "hybrid" ||
		studentProfile.preferences.mode === "hybrid"
	)
		return 0.7;

	return 0.3;
}

/**
 * Calculate provider reputation score
 * @param {Object} internship - Internship details
 * @returns {number} - Reputation score (0-1)
 */
function calculateProviderReputation(internship) {
	let score = 0.5; // Base score

	const provider = internship.providerRef;
	if (!provider) return score;

	// Based on verification status
	if (provider.verified) score += 0.3;

	// Based on company size/type
	if (provider.companySize === "Large" || provider.companySize === "MNC") {
		score += 0.2;
	} else if (provider.companySize === "Medium") {
		score += 0.1;
	}

	return Math.min(score, 1);
}

/**
 * Calculate learning opportunity score based on skill gaps
 * @param {Object} recommendation - Recommendation object
 * @returns {number} - Learning opportunity score (0-1)
 */
function calculateLearningOpportunity(recommendation) {
	if (!recommendation.skillGaps) return 0.5;

	const missingCount = recommendation.skillGaps.length;
	const totalRequired = recommendation.internship.requiredSkills?.length || 1;

	// Ideal is to have some (but not too many) skills to learn
	const gapRatio = missingCount / totalRequired;

	if (gapRatio < 0.1) return 0.6; // Too easy, less learning
	if (gapRatio < 0.3) return 1.0; // Perfect - some learning opportunity
	if (gapRatio < 0.5) return 0.8; // Good learning opportunity
	if (gapRatio < 0.7) return 0.5; // Challenging

	return 0.3; // Too difficult
}

/**
 * Apply diversity and fairness constraints to ranking
 * @param {Array<Object>} rankedRecommendations - Ranked recommendations
 * @param {Object} studentProfile - Student profile
 * @param {Object} fairnessConfig - Fairness configuration
 * @returns {Array<Object>} - Reranked recommendations
 */
export function applyDiversityConstraints(
	rankedRecommendations,
	studentProfile,
	fairnessConfig = {},
) {
	const {
		maxSameProvider = 3,
		maxSameDomain = 4,
		maxSameLocation = 4,
		promoteDiversity = true,
	} = fairnessConfig;

	if (!promoteDiversity) return rankedRecommendations;

	const result = [];
	const providerCount = new Map();
	const domainCount = new Map();
	const locationCount = new Map();

	for (const rec of rankedRecommendations) {
		const providerId = rec.internship.providerRef?._id?.toString();
		const domain = rec.internship.domain;
		const location = rec.internship.location;

		const currentProviderCount = providerCount.get(providerId) || 0;
		const currentDomainCount = domainCount.get(domain) || 0;
		const currentLocationCount = locationCount.get(location) || 0;

		// Apply diversity penalty
		let diversityPenalty = 0;

		if (currentProviderCount >= maxSameProvider) diversityPenalty += 0.1;
		if (currentDomainCount >= maxSameDomain) diversityPenalty += 0.1;
		if (currentLocationCount >= maxSameLocation) diversityPenalty += 0.05;

		result.push({
			...rec,
			comprehensiveScore:
				(rec.comprehensiveScore || rec.matchPercent / 100) *
				(1 - diversityPenalty),
			diversityPenalty,
		});

		// Update counts
		providerCount.set(providerId, currentProviderCount + 1);
		domainCount.set(domain, currentDomainCount + 1);
		locationCount.set(location, currentLocationCount + 1);
	}

	// Re-sort by adjusted score
	return result.sort((a, b) => b.comprehensiveScore - a.comprehensiveScore);
}

/**
 * Generate ranking explanation with detailed breakdown
 * @param {Object} recommendation - Recommendation with comprehensive score
 * @param {Object} scores - Individual criterion scores
 * @returns {Object} - Detailed ranking explanation
 */
export function generateRankingExplanation(recommendation, scores) {
	const factors = [];

	// Identify top contributing factors
	const sortedScores = Object.entries(scores)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5);

	sortedScores.forEach(([factor, score]) => {
		factors.push({
			factor: formatFactorName(factor),
			score: Math.round(score * 100),
			impact: score > 0.8 ? "high" : score > 0.5 ? "medium" : "low",
		});
	});

	return {
		overallScore: Math.round(recommendation.comprehensiveScore * 100),
		topFactors: factors,
		interpretation: generateScoreInterpretation(
			recommendation.comprehensiveScore,
		),
	};
}

/**
 * Format factor name for display
 * @param {string} factor - Factor name
 * @returns {string} - Formatted name
 */
function formatFactorName(factor) {
	const names = {
		skillMatch: "Skill Match",
		academicFit: "Academic Fit",
		domainPreference: "Domain Preference",
		locationPreference: "Location Preference",
		modePreference: "Work Mode Preference",
		collaborativeScore: "Similar Students Success",
		providerReputation: "Provider Reputation",
		learningOpportunity: "Learning Opportunity",
	};
	return names[factor] || factor;
}

/**
 * Generate human-readable score interpretation
 * @param {number} score - Comprehensive score (0-1)
 * @returns {string} - Interpretation
 */
function generateScoreInterpretation(score) {
	if (score >= 0.9) return "Excellent match - Highly recommended";
	if (score >= 0.75) return "Very good match - Strong candidate";
	if (score >= 0.6) return "Good match - Worth considering";
	if (score >= 0.4) return "Moderate match - Review carefully";
	return "Lower match - May require additional development";
}

export default {
	topsis,
	ahp,
	calculateComprehensiveScore,
	applyDiversityConstraints,
	generateRankingExplanation,
};
