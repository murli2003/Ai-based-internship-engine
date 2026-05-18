import Application from "../models/Application.js";
import Internship from "../models/Internship.js";
import StudentProfile from "../models/StudentProfile.js";
import Provider from "../models/Provider.js";
import User from "../models/User.js";

/**
 * Advanced Analytics Service
 * Provides comprehensive insights, metrics, and data visualization support
 * For enterprise-grade dashboards
 */

/**
 * Get comprehensive statistics for admin dashboard
 * @returns {Object} - Complete system statistics
 */
export async function getSystemStatistics() {
	try {
		const [
			totalStudents,
			activeStudents,
			totalProviders,
			verifiedProviders,
			totalInternships,
			activeInternships,
			totalApplications,
			applicationsByStatus,
		] = await Promise.all([
			User.countDocuments({ role: "student" }),
			StudentProfile.countDocuments({ "skills.0": { $exists: true } }),
			User.countDocuments({ role: "provider" }),
			Provider.countDocuments({ verified: true }),
			Internship.countDocuments(),
			Internship.countDocuments({ status: "active" }),
			Application.countDocuments(),
			Application.aggregate([
				{ $group: { _id: "$status", count: { $sum: 1 } } },
			]),
		]);

		const statusBreakdown = {};
		applicationsByStatus.forEach((item) => {
			statusBreakdown[item._id] = item.count;
		});

		// Calculate trends (comparing with last month)
		const lastMonth = new Date();
		lastMonth.setMonth(lastMonth.getMonth() - 1);

		const [lastMonthStudents, lastMonthInternships, lastMonthApplications] =
			await Promise.all([
				User.countDocuments({
					role: "student",
					createdAt: { $lt: lastMonth },
				}),
				Internship.countDocuments({ createdAt: { $lt: lastMonth } }),
				Application.countDocuments({ createdAt: { $lt: lastMonth } }),
			]);

		return {
			overview: {
				totalStudents,
				activeStudents,
				totalProviders,
				verifiedProviders,
				totalInternships,
				activeInternships,
				totalApplications,
				completionRate:
					totalApplications > 0
						? Math.round(
								((statusBreakdown.completed || 0) /
									totalApplications) *
									100,
							)
						: 0,
				acceptanceRate:
					totalApplications > 0
						? Math.round(
								((statusBreakdown.accepted || 0) /
									totalApplications) *
									100,
							)
						: 0,
			},
			applicationStatus: statusBreakdown,
			trends: {
				studentGrowth: calculateGrowthRate(
					lastMonthStudents,
					totalStudents,
				),
				internshipGrowth: calculateGrowthRate(
					lastMonthInternships,
					totalInternships,
				),
				applicationGrowth: calculateGrowthRate(
					lastMonthApplications,
					totalApplications,
				),
			},
			timestamp: new Date(),
		};
	} catch (error) {
		console.error("Error getting system statistics:", error);
		throw error;
	}
}

/**
 * Get time-series data for applications
 * @param {number} days - Number of days to look back
 * @returns {Object} - Time series data
 */
export async function getApplicationTimeSeries(days = 30) {
	const startDate = new Date();
	startDate.setDate(startDate.getDate() - days);

	const applications = await Application.aggregate([
		{
			$match: { createdAt: { $gte: startDate } },
		},
		{
			$group: {
				_id: {
					$dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
				},
				count: { $sum: 1 },
				accepted: {
					$sum: { $cond: [{ $eq: ["$status", "accepted"] }, 1, 0] },
				},
				shortlisted: {
					$sum: {
						$cond: [{ $eq: ["$status", "shortlisted"] }, 1, 0],
					},
				},
				rejected: {
					$sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] },
				},
			},
		},
		{ $sort: { _id: 1 } },
	]);

	return {
		dates: applications.map((a) => a._id),
		total: applications.map((a) => a.count),
		accepted: applications.map((a) => a.accepted),
		shortlisted: applications.map((a) => a.shortlisted),
		rejected: applications.map((a) => a.rejected),
	};
}

/**
 * Get top skills analysis
 * @param {number} limit - Number of top skills to return
 * @returns {Array} - Top skills with counts
 */
export async function getTopSkills(limit = 20) {
	const skills = await StudentProfile.aggregate([
		{ $unwind: "$skills" },
		{
			$group: {
				_id: { $toLower: "$skills.name" },
				count: { $sum: 1 },
				avgProficiency: { $avg: "$skills.level" },
			},
		},
		{ $sort: { count: -1 } },
		{ $limit: limit },
		{
			$project: {
				skill: "$_id",
				count: 1,
				avgProficiency: { $round: ["$avgProficiency", 1] },
				_id: 0,
			},
		},
	]);

	return skills;
}

/**
 * Get domain distribution analysis
 * @returns {Array} - Domain distribution with internship and application counts
 */
export async function getDomainDistribution() {
	const domains = await Internship.aggregate([
		{ $match: { status: "active" } },
		{
			$group: {
				_id: "$domain",
				internshipCount: { $sum: 1 },
			},
		},
		{
			$lookup: {
				from: "applications",
				let: { domain: "$_id" },
				pipeline: [
					{
						$lookup: {
							from: "internships",
							localField: "internshipRef",
							foreignField: "_id",
							as: "internship",
						},
					},
					{ $unwind: "$internship" },
					{
						$match: {
							$expr: { $eq: ["$internship.domain", "$$domain"] },
						},
					},
				],
				as: "applications",
			},
		},
		{
			$project: {
				domain: "$_id",
				internshipCount: 1,
				applicationCount: { $size: "$applications" },
				_id: 0,
			},
		},
		{ $sort: { internshipCount: -1 } },
	]);

	return domains;
}

/**
 * Get location-wise analytics
 * @returns {Array} - Location distribution
 */
export async function getLocationAnalytics() {
	const locations = await Internship.aggregate([
		{ $match: { status: "active" } },
		{
			$group: {
				_id: "$location",
				count: { $sum: 1 },
				avgStipend: { $avg: "$stipend" },
			},
		},
		{ $sort: { count: -1 } },
		{ $limit: 15 },
		{
			$project: {
				location: "$_id",
				count: 1,
				avgStipend: { $round: ["$avgStipend", 0] },
				_id: 0,
			},
		},
	]);

	return locations;
}

/**
 * Get student engagement metrics
 * @returns {Object} - Engagement analytics
 */
export async function getStudentEngagement() {
	const [profileCompletion, applicationActivity, skillDevelopment] =
		await Promise.all([
			// Profile completion distribution
			StudentProfile.aggregate([
				{
					$project: {
						completionScore: {
							$add: [
								{
									$cond: [
										{
											$gt: [
												{
													$size: {
														$ifNull: [
															"$skills",
															[],
														],
													},
												},
												2,
											],
										},
										25,
										0,
									],
								},
								{ $cond: ["$cgpa", 15, 0] },
								{ $cond: ["$branch", 10, 0] },
								{
									$cond: [
										{
											$gt: [
												{
													$size: {
														$ifNull: [
															"$projects",
															[],
														],
													},
												},
												0,
											],
										},
										20,
										0,
									],
								},
								{
									$cond: [
										{
											$gt: [
												{
													$size: {
														$ifNull: [
															"$certifications",
															[],
														],
													},
												},
												0,
											],
										},
										15,
										0,
									],
								},
								{ $cond: ["$preferences.domains", 15, 0] },
							],
						},
					},
				},
				{
					$bucket: {
						groupBy: "$completionScore",
						boundaries: [0, 25, 50, 75, 100],
						default: "incomplete",
						output: { count: { $sum: 1 } },
					},
				},
			]),

			// Application activity
			Application.aggregate([
				{
					$group: {
						_id: "$studentRef",
						applicationCount: { $sum: 1 },
					},
				},
				{
					$bucket: {
						groupBy: "$applicationCount",
						boundaries: [0, 1, 3, 6, 10],
						default: "high",
						output: { count: { $sum: 1 } },
					},
				},
			]),

			// Skill development (students with certifications)
			StudentProfile.aggregate([
				{
					$project: {
						certificationCount: {
							$size: { $ifNull: ["$certifications", []] },
						},
						hasSkills: {
							$gt: [{ $size: { $ifNull: ["$skills", []] } }, 0],
						},
					},
				},
				{
					$group: {
						_id: null,
						withCertifications: {
							$sum: {
								$cond: [
									{ $gt: ["$certificationCount", 0] },
									1,
									0,
								],
							},
						},
						withSkills: { $sum: { $cond: ["$hasSkills", 1, 0] } },
						total: { $sum: 1 },
					},
				},
			]),
		]);

	return {
		profileCompletion: profileCompletion.map((bucket) => ({
			range: `${bucket._id}-${parseInt(bucket._id) + 25}%`,
			count: bucket.count,
		})),
		applicationActivity,
		skillDevelopment: skillDevelopment[0] || {},
	};
}

/**
 * Get provider performance metrics
 * @param {string} providerId - Provider ID (optional)
 * @returns {Object} - Provider metrics
 */
export async function getProviderMetrics(providerId = null) {
	const matchStage = providerId ? { providerRef: providerId } : {};

	const metrics = await Internship.aggregate([
		{ $match: matchStage },
		{
			$lookup: {
				from: "applications",
				localField: "_id",
				foreignField: "internshipRef",
				as: "applications",
			},
		},
		{
			$project: {
				title: 1,
				status: 1,
				applicationCount: { $size: "$applications" },
				acceptedCount: {
					$size: {
						$filter: {
							input: "$applications",
							cond: { $eq: ["$$this.status", "accepted"] },
						},
					},
				},
				completedCount: {
					$size: {
						$filter: {
							input: "$applications",
							cond: { $eq: ["$$this.status", "completed"] },
						},
					},
				},
			},
		},
	]);

	const summary = {
		totalInternships: metrics.length,
		activeInternships: metrics.filter((m) => m.status === "active").length,
		totalApplications: metrics.reduce(
			(sum, m) => sum + m.applicationCount,
			0,
		),
		acceptedApplications: metrics.reduce(
			(sum, m) => sum + m.acceptedCount,
			0,
		),
		completedInternships: metrics.reduce(
			(sum, m) => sum + m.completedCount,
			0,
		),
		avgApplicationsPerInternship:
			metrics.length > 0
				? Math.round(
						metrics.reduce(
							(sum, m) => sum + m.applicationCount,
							0,
						) / metrics.length,
					)
				: 0,
	};

	return { summary, internships: metrics };
}

/**
 * Get matching quality metrics (for AI performance evaluation)
 * @returns {Object} - Matching quality insights
 */
export async function getMatchingQualityMetrics() {
	const applications = await Application.aggregate([
		{
			$lookup: {
				from: "internships",
				localField: "internshipRef",
				foreignField: "_id",
				as: "internship",
			},
		},
		{ $unwind: "$internship" },
		{
			$lookup: {
				from: "studentprofiles",
				localField: "studentRef",
				foreignField: "userId",
				as: "profile",
			},
		},
		{ $unwind: "$profile" },
		{
			$project: {
				status: 1,
				rating: 1,
				hasRating: { $gt: ["$rating", 0] },
				skillAlignment: {
					$size: {
						$setIntersection: [
							{
								$map: {
									input: "$profile.skills",
									as: "s",
									in: { $toLower: "$$s.name" },
								},
							},
							{
								$map: {
									input: "$internship.requiredSkills",
									as: "r",
									in: { $toLower: "$$r" },
								},
							},
						],
					},
				},
				totalRequired: {
					$size: { $ifNull: ["$internship.requiredSkills", []] },
				},
			},
		},
		{
			$group: {
				_id: null,
				avgSkillAlignment: {
					$avg: {
						$cond: [
							{ $gt: ["$totalRequired", 0] },
							{ $divide: ["$skillAlignment", "$totalRequired"] },
							0,
						],
					},
				},
				acceptanceRate: {
					$avg: {
						$cond: [
							{ $in: ["$status", ["accepted", "completed"]] },
							1,
							0,
						],
					},
				},
				avgRating: { $avg: { $cond: ["$hasRating", "$rating", null] } },
				ratedApplications: { $sum: { $cond: ["$hasRating", 1, 0] } },
				totalApplications: { $sum: 1 },
			},
		},
	]);

	const result = applications[0] || {};

	return {
		averageSkillAlignment: Math.round(
			(result.avgSkillAlignment || 0) * 100,
		),
		acceptanceRate: Math.round((result.acceptanceRate || 0) * 100),
		averageRating: result.avgRating ? result.avgRating.toFixed(2) : "N/A",
		feedbackCoverage:
			result.totalApplications > 0
				? Math.round(
						(result.ratedApplications / result.totalApplications) *
							100,
					)
				: 0,
		totalEvaluations: result.totalApplications || 0,
	};
}

/**
 * Calculate growth rate percentage
 * @param {number} previous - Previous period value
 * @param {number} current - Current value
 * @returns {number} - Growth rate percentage
 */
function calculateGrowthRate(previous, current) {
	if (previous === 0) return current > 0 ? 100 : 0;
	return Math.round(((current - previous) / previous) * 100);
}

/**
 * Get real-time dashboard data (comprehensive)
 * @param {string} role - User role (admin/provider/student)
 * @param {string} userId - User ID for role-specific data
 * @returns {Object} - Complete dashboard data
 */
export async function getDashboardData(role, userId = null) {
	switch (role) {
		case "admin":
			return await getAdminDashboard();
		case "provider":
			return await getProviderDashboard(userId);
		case "student":
			return await getStudentDashboard(userId);
		default:
			throw new Error("Invalid role");
	}
}

async function getAdminDashboard() {
	const [
		stats,
		timeSeries,
		topSkills,
		domains,
		locations,
		engagement,
		matchingQuality,
	] = await Promise.all([
		getSystemStatistics(),
		getApplicationTimeSeries(30),
		getTopSkills(10),
		getDomainDistribution(),
		getLocationAnalytics(),
		getStudentEngagement(),
		getMatchingQualityMetrics(),
	]);

	return {
		statistics: stats,
		charts: {
			applicationTrends: timeSeries,
			topSkills,
			domainDistribution: domains,
			locationDistribution: locations,
		},
		engagement,
		aiPerformance: matchingQuality,
	};
}

async function getProviderDashboard(providerId) {
	const provider = await Provider.findOne({ userId: providerId });
	if (!provider) throw new Error("Provider not found");

	const metrics = await getProviderMetrics(provider._id);
	const recentApplications = await Application.find()
		.populate("studentRef", "fullName email")
		.populate("internshipRef", "title")
		.sort({ createdAt: -1 })
		.limit(10)
		.lean();

	return {
		metrics: metrics.summary,
		internships: metrics.internships,
		recentApplications,
	};
}

async function getStudentDashboard(userId) {
	const profile = await StudentProfile.findOne({ userId });
	const applications = await Application.find({ studentRef: userId })
		.populate("internshipRef")
		.sort({ createdAt: -1 })
		.lean();

	const stats = {
		totalApplications: applications.length,
		accepted: applications.filter((a) => a.status === "accepted").length,
		shortlisted: applications.filter((a) => a.status === "shortlisted")
			.length,
		pending: applications.filter((a) => a.status === "applied").length,
	};

	return {
		stats,
		applications: applications.slice(0, 10),
		profileCompletion: calculateProfileCompletion(profile),
	};
}

function calculateProfileCompletion(profile) {
	if (!profile) return 0;

	let score = 0;
	if (profile.skills?.length > 2) score += 25;
	if (profile.cgpa) score += 15;
	if (profile.branch) score += 10;
	if (profile.projects?.length > 0) score += 20;
	if (profile.certifications?.length > 0) score += 15;
	if (profile.preferences?.domains?.length > 0) score += 15;

	return score;
}

export default {
	getSystemStatistics,
	getApplicationTimeSeries,
	getTopSkills,
	getDomainDistribution,
	getLocationAnalytics,
	getStudentEngagement,
	getProviderMetrics,
	getMatchingQualityMetrics,
	getDashboardData,
};
