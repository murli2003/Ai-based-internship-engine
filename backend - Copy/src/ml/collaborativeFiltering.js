import { Matrix } from "ml-matrix";
import { cosineSimilarity } from "./similarity.js";

/**
 * Collaborative Filtering Module for Hybrid Recommendation Engine
 * Implements user-based and item-based collaborative filtering
 * Uses historical internship application and selection data
 */

/**
 * Build user-item interaction matrix from application history
 * @param {Array} applications - Application history data
 * @param {Array} students - All students
 * @param {Array} internships - All internships
 * @returns {Object} - Interaction matrix and mappings
 */
export function buildInteractionMatrix(applications, students, internships) {
	const studentIdMap = new Map(
		students.map((s, idx) => [s._id.toString(), idx]),
	);
	const internshipIdMap = new Map(
		internships.map((i, idx) => [i._id.toString(), idx]),
	);

	const rows = students.length;
	const cols = internships.length;
	const matrix = Matrix.zeros(rows, cols);

	// Fill matrix with interaction scores
	applications.forEach((app) => {
		const studentIdx = studentIdMap.get(app.studentRef?.toString());
		const internshipIdx = internshipIdMap.get(
			app.internshipRef?.toString(),
		);

		if (studentIdx !== undefined && internshipIdx !== undefined) {
			// Score based on application status
			let score = 0;
			switch (app.status) {
				case "accepted":
				case "completed":
					score = 5;
					break;
				case "shortlisted":
					score = 4;
					break;
				case "applied":
					score = 3;
					break;
				case "interviewed":
					score = 4.5;
					break;
				case "rejected":
					score = 1;
					break;
				default:
					score = 2;
			}

			// Boost score if feedback is positive
			if (app.rating && app.rating >= 4) {
				score += 1;
			}

			matrix.set(studentIdx, internshipIdx, score);
		}
	});

	return {
		matrix,
		studentIdMap,
		internshipIdMap,
		students,
		internships,
	};
}

/**
 * Calculate user similarity matrix using cosine similarity
 * @param {Matrix} interactionMatrix - User-item interaction matrix
 * @returns {Matrix} - User similarity matrix
 */
export function calculateUserSimilarity(interactionMatrix) {
	const numUsers = interactionMatrix.rows;
	const similarityMatrix = Matrix.zeros(numUsers, numUsers);

	for (let i = 0; i < numUsers; i++) {
		for (let j = i; j < numUsers; j++) {
			if (i === j) {
				similarityMatrix.set(i, j, 1);
			} else {
				const userI = interactionMatrix.getRow(i);
				const userJ = interactionMatrix.getRow(j);
				const similarity = cosineSimilarity(userI, userJ);
				similarityMatrix.set(i, j, similarity);
				similarityMatrix.set(j, i, similarity);
			}
		}
	}

	return similarityMatrix;
}

/**
 * Calculate item similarity matrix using cosine similarity
 * @param {Matrix} interactionMatrix - User-item interaction matrix
 * @returns {Matrix} - Item similarity matrix
 */
export function calculateItemSimilarity(interactionMatrix) {
	const numItems = interactionMatrix.columns;
	const similarityMatrix = Matrix.zeros(numItems, numItems);

	for (let i = 0; i < numItems; i++) {
		for (let j = i; j < numItems; j++) {
			if (i === j) {
				similarityMatrix.set(i, j, 1);
			} else {
				const itemI = interactionMatrix.getColumn(i);
				const itemJ = interactionMatrix.getColumn(j);
				const similarity = cosineSimilarity(itemI, itemJ);
				similarityMatrix.set(i, j, similarity);
				similarityMatrix.set(j, i, similarity);
			}
		}
	}

	return similarityMatrix;
}

/**
 * User-based collaborative filtering prediction
 * @param {number} studentIdx - Target student index
 * @param {number} internshipIdx - Target internship index
 * @param {Matrix} interactionMatrix - User-item matrix
 * @param {Matrix} userSimilarity - User similarity matrix
 * @param {number} k - Number of similar users to consider
 * @returns {number} - Predicted score
 */
export function userBasedPrediction(
	studentIdx,
	internshipIdx,
	interactionMatrix,
	userSimilarity,
	k = 10,
) {
	// Find k most similar users who have interacted with this internship
	const similarities = [];
	const targetRow = userSimilarity.getRow(studentIdx);

	for (let i = 0; i < interactionMatrix.rows; i++) {
		if (i !== studentIdx && interactionMatrix.get(i, internshipIdx) > 0) {
			similarities.push({
				userIdx: i,
				similarity: targetRow[i],
				rating: interactionMatrix.get(i, internshipIdx),
			});
		}
	}

	// Sort by similarity and take top k
	similarities.sort((a, b) => b.similarity - a.similarity);
	const topK = similarities.slice(0, k);

	if (topK.length === 0) return 0;

	// Calculate weighted average
	let numerator = 0;
	let denominator = 0;

	topK.forEach(({ similarity, rating }) => {
		numerator += similarity * rating;
		denominator += Math.abs(similarity);
	});

	return denominator > 0 ? numerator / denominator : 0;
}

/**
 * Item-based collaborative filtering prediction
 * @param {number} studentIdx - Target student index
 * @param {number} internshipIdx - Target internship index
 * @param {Matrix} interactionMatrix - User-item matrix
 * @param {Matrix} itemSimilarity - Item similarity matrix
 * @param {number} k - Number of similar items to consider
 * @returns {number} - Predicted score
 */
export function itemBasedPrediction(
	studentIdx,
	internshipIdx,
	interactionMatrix,
	itemSimilarity,
	k = 10,
) {
	// Find k most similar internships that this student has interacted with
	const similarities = [];
	const targetCol = itemSimilarity.getRow(internshipIdx);
	const studentInteractions = interactionMatrix.getRow(studentIdx);

	for (let i = 0; i < interactionMatrix.columns; i++) {
		if (i !== internshipIdx && studentInteractions[i] > 0) {
			similarities.push({
				itemIdx: i,
				similarity: targetCol[i],
				rating: studentInteractions[i],
			});
		}
	}

	// Sort by similarity and take top k
	similarities.sort((a, b) => b.similarity - a.similarity);
	const topK = similarities.slice(0, k);

	if (topK.length === 0) return 0;

	// Calculate weighted average
	let numerator = 0;
	let denominator = 0;

	topK.forEach(({ similarity, rating }) => {
		numerator += similarity * rating;
		denominator += Math.abs(similarity);
	});

	return denominator > 0 ? numerator / denominator : 0;
}

/**
 * Matrix Factorization using Singular Value Decomposition (SVD)
 * @param {Matrix} interactionMatrix - User-item matrix
 * @param {number} factors - Number of latent factors
 * @returns {Object} - Factorized matrices
 */
export function matrixFactorization(interactionMatrix, factors = 20) {
	try {
		const svd = new Matrix.DC.SVD(interactionMatrix, {
			computeLeftSingularVectors: true,
			computeRightSingularVectors: true,
		});

		const U = svd.leftSingularVectors;
		const S = Matrix.diag(svd.diagonal.slice(0, factors));
		const V = svd.rightSingularVectors;

		// Reduce to k factors
		const Uk = U.subMatrix(0, U.rows - 1, 0, factors - 1);
		const Vk = V.subMatrix(0, V.rows - 1, 0, factors - 1);

		// Reconstruct approximation
		const approximation = Uk.mmul(S).mmul(Vk.transpose());

		return {
			userFactors: Uk,
			itemFactors: Vk,
			approximation,
			explainedVariance: calculateExplainedVariance(
				svd.diagonal,
				factors,
			),
		};
	} catch (error) {
		console.error("Matrix factorization error:", error);
		return null;
	}
}

/**
 * Calculate explained variance ratio
 * @param {Array} singularValues - Singular values from SVD
 * @param {number} k - Number of components
 * @returns {number} - Explained variance ratio
 */
function calculateExplainedVariance(singularValues, k) {
	const totalVariance = singularValues.reduce(
		(sum, val) => sum + val * val,
		0,
	);
	const explainedVariance = singularValues
		.slice(0, k)
		.reduce((sum, val) => sum + val * val, 0);

	return totalVariance > 0 ? explainedVariance / totalVariance : 0;
}

/**
 * Hybrid prediction combining user-based and item-based CF
 * @param {number} studentIdx - Target student index
 * @param {number} internshipIdx - Target internship index
 * @param {Matrix} interactionMatrix - User-item matrix
 * @param {Matrix} userSimilarity - User similarity matrix
 * @param {Matrix} itemSimilarity - Item similarity matrix
 * @param {Object} weights - Weights for combining predictions
 * @returns {number} - Predicted score
 */
export function hybridCollaborativeFiltering(
	studentIdx,
	internshipIdx,
	interactionMatrix,
	userSimilarity,
	itemSimilarity,
	weights = { user: 0.5, item: 0.5 },
) {
	const userPred = userBasedPrediction(
		studentIdx,
		internshipIdx,
		interactionMatrix,
		userSimilarity,
	);
	const itemPred = itemBasedPrediction(
		studentIdx,
		internshipIdx,
		interactionMatrix,
		itemSimilarity,
	);

	return userPred * weights.user + itemPred * weights.item;
}

/**
 * Get collaborative filtering score for a student-internship pair
 * @param {string} studentId - Student ID
 * @param {string} internshipId - Internship ID
 * @param {Object} cfData - Precomputed CF data
 * @returns {number} - CF score (0-1)
 */
export function getCollaborativeScore(studentId, internshipId, cfData) {
	if (!cfData || !cfData.matrix) return 0;

	const studentIdx = cfData.studentIdMap.get(studentId?.toString());
	const internshipIdx = cfData.internshipIdMap.get(internshipId?.toString());

	if (studentIdx === undefined || internshipIdx === undefined) return 0;

	// Check if there's existing interaction
	const existingScore = cfData.matrix.get(studentIdx, internshipIdx);
	if (existingScore > 0) {
		return Math.min(existingScore / 5, 1); // Normalize to 0-1
	}

	// Use collaborative filtering to predict
	const prediction = hybridCollaborativeFiltering(
		studentIdx,
		internshipIdx,
		cfData.matrix,
		cfData.userSimilarity,
		cfData.itemSimilarity,
	);

	return Math.min(Math.max(prediction / 5, 0), 1); // Normalize to 0-1
}

/**
 * Find similar students based on interaction patterns
 * @param {string} studentId - Target student ID
 * @param {Object} cfData - Precomputed CF data
 * @param {number} topK - Number of similar students to return
 * @returns {Array} - Similar students with scores
 */
export function findSimilarStudents(studentId, cfData, topK = 5) {
	if (!cfData || !cfData.userSimilarity) return [];

	const studentIdx = cfData.studentIdMap.get(studentId?.toString());
	if (studentIdx === undefined) return [];

	const similarities = cfData.userSimilarity.getRow(studentIdx);
	const similar = [];

	cfData.studentIdMap.forEach((idx, id) => {
		if (id !== studentId.toString() && similarities[idx] > 0.1) {
			similar.push({
				studentId: id,
				similarity: similarities[idx],
				student: cfData.students[idx],
			});
		}
	});

	return similar.sort((a, b) => b.similarity - a.similarity).slice(0, topK);
}

/**
 * Find similar internships based on interaction patterns
 * @param {string} internshipId - Target internship ID
 * @param {Object} cfData - Precomputed CF data
 * @param {number} topK - Number of similar internships to return
 * @returns {Array} - Similar internships with scores
 */
export function findSimilarInternships(internshipId, cfData, topK = 5) {
	if (!cfData || !cfData.itemSimilarity) return [];

	const internshipIdx = cfData.internshipIdMap.get(internshipId?.toString());
	if (internshipIdx === undefined) return [];

	const similarities = cfData.itemSimilarity.getRow(internshipIdx);
	const similar = [];

	cfData.internshipIdMap.forEach((idx, id) => {
		if (id !== internshipId.toString() && similarities[idx] > 0.1) {
			similar.push({
				internshipId: id,
				similarity: similarities[idx],
				internship: cfData.internships[idx],
			});
		}
	});

	return similar.sort((a, b) => b.similarity - a.similarity).slice(0, topK);
}

/**
 * Initialize and compute all collaborative filtering data
 * This should be run periodically to update the model
 * @param {Array} applications - All applications
 * @param {Array} students - All students
 * @param {Array} internships - All internships
 * @returns {Object} - Complete CF data structure
 */
export function initializeCollaborativeFiltering(
	applications,
	students,
	internships,
) {
	console.log("Initializing Collaborative Filtering model...");

	const { matrix, studentIdMap, internshipIdMap } = buildInteractionMatrix(
		applications,
		students,
		internships,
	);

	console.log(
		`Built interaction matrix: ${matrix.rows} students × ${matrix.columns} internships`,
	);

	const userSimilarity = calculateUserSimilarity(matrix);
	console.log("Calculated user similarity matrix");

	const itemSimilarity = calculateItemSimilarity(matrix);
	console.log("Calculated item similarity matrix");

	const mf = matrixFactorization(matrix, 15);
	console.log(
		`Matrix factorization complete. Explained variance: ${(mf?.explainedVariance * 100).toFixed(2)}%`,
	);

	return {
		matrix,
		studentIdMap,
		internshipIdMap,
		userSimilarity,
		itemSimilarity,
		matrixFactorization: mf,
		students,
		internships,
		lastUpdated: new Date(),
	};
}

export default {
	buildInteractionMatrix,
	calculateUserSimilarity,
	calculateItemSimilarity,
	userBasedPrediction,
	itemBasedPrediction,
	matrixFactorization,
	hybridCollaborativeFiltering,
	getCollaborativeScore,
	findSimilarStudents,
	findSimilarInternships,
	initializeCollaborativeFiltering,
};
