import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	Users,
	Briefcase,
	FileText,
	TrendingUp,
	TrendingDown,
	Award,
	Target,
	BarChart3,
	Activity,
	CheckCircle,
	Clock,
	XCircle,
	AlertCircle,
	RefreshCw,
	Download,
	Calendar,
	Filter,
	ArrowUpRight,
	ArrowDownRight,
	Sparkles,
	Brain,
	Zap,
} from "lucide-react";
import api from "../services/api";
import {
	StatCard,
	Card,
	CardHeader,
	CardTitle,
	CardContent,
	LoadingCard,
} from "../components/EnterpriseCard";
import {
	TrendLineChart,
	TrendAreaChart,
	HorizontalBarChart,
	VerticalBarChart,
	DonutChart,
} from "../components/ChartComponents";

export default function AdminDashboardEnhanced() {
	const [loading, setLoading] = useState(true);
	const [dashboardData, setDashboardData] = useState(null);
	const [timeRange, setTimeRange] = useState(30);
	const [refreshing, setRefreshing] = useState(false);
	const [lastUpdated, setLastUpdated] = useState(new Date());

	useEffect(() => {
		loadDashboardData();
	}, [timeRange]);

	const loadDashboardData = async () => {
		try {
			setLoading(true);
			const response = await api.get("/admin/dashboard");
			setDashboardData(response.data);
			setLastUpdated(new Date());
		} catch (error) {
			console.error("Failed to load dashboard:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleRefresh = async () => {
		setRefreshing(true);
		await loadDashboardData();
		setTimeout(() => setRefreshing(false), 500);
	};

	if (loading && !dashboardData) {
		return (
			<div className="space-y-6">
				<div className="skeleton h-32 rounded-2xl"></div>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					{[...Array(4)].map((_, i) => (
						<LoadingCard key={i} lines={3} />
					))}
				</div>
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{[...Array(4)].map((_, i) => (
						<div key={i} className="skeleton h-80 rounded-2xl"></div>
					))}
				</div>
			</div>
		);
	}

	const stats = dashboardData?.statistics?.overview || {};
	const trends = dashboardData?.statistics?.trends || {};
	const charts = dashboardData?.charts || {};
	const aiPerformance = dashboardData?.aiPerformance || {};
	const engagement = dashboardData?.engagement || {};

	return (
		<div className="space-y-8 pb-8">
			{/* Hero Section with Gradient */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-secondary-600 to-primary-700 text-white shadow-elevated"
			>
				<div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40"></div>
				
				<div className="relative px-8 py-8">
					<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
						<div className="flex-1">
							<div className="flex items-center gap-2 mb-3">
								<div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg">
									<Brain className="h-6 w-6" />
								</div>
								<span className="text-sm font-semibold text-white/90 uppercase tracking-wider">AI-Powered Intelligence</span>
							</div>
							<h1 className="text-4xl font-bold mb-3 tracking-tight">
								Administrative Dashboard
							</h1>
							<p className="text-lg text-white/90 max-w-2xl">
								Real-time analytics and insights for the PM Internship Scheme platform with advanced AI recommendations
							</p>
						</div>

						<div className="flex items-center gap-3">
							<div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/20">
								<div className="text-xs text-white/80 mb-1">Last Updated</div>
								<div className="text-sm font-semibold">{lastUpdated.toLocaleTimeString()}</div>
							</div>
							<select
								value={timeRange}
								onChange={(e) => setTimeRange(Number(e.target.value))}
								className="bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/50"
							>
								<option value="7" className="text-surface-900">Last 7 days</option>
								<option value="30" className="text-surface-900">Last 30 days</option>
								<option value="90" className="text-surface-900">Last 90 days</option>
								<option value="365" className="text-surface-900">Last year</option>
							</select>
							<button
								onClick={handleRefresh}
								disabled={refreshing}
								className="p-3 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-lg transition-all border border-white/20 group"
							>
								<RefreshCw className={`h-5 w-5 transition-transform ${refreshing ? 'animate-spin' : 'group-hover:rotate-180 duration-500'}`} />
							</button>
						</div>
					</div>
				</div>
			</motion.div>

			{/* Key Performance Indicators */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.1 }}
			>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					<EnterpriseStatCard
						title="Total Students"
						value={stats.totalStudents?.toLocaleString() || "0"}
						change={trends.studentGrowth}
						trend={trends.studentGrowth > 0 ? "up" : trends.studentGrowth < 0 ? "down" : "neutral"}
						icon={Users}
						color="blue"
						description="Active learners"
					/>
					<EnterpriseStatCard
						title="Active Internships"
						value={stats.activeInternships?.toLocaleString() || "0"}
						change={trends.internshipGrowth}
						trend={trends.internshipGrowth > 0 ? "up" : trends.internshipGrowth < 0 ? "down" : "neutral"}
						icon={Briefcase}
						color="purple"
						description="Open positions"
					/>
					<EnterpriseStatCard
						title="Applications"
						value={stats.totalApplications?.toLocaleString() || "0"}
						change={trends.applicationGrowth}
						trend={trends.applicationGrowth > 0 ? "up" : trends.applicationGrowth < 0 ? "down" : "neutral"}
						icon={FileText}
						color="green"
						description="Total submitted"
					/>
					<EnterpriseStatCard
						title="Success Rate"
						value={`${stats.acceptanceRate || 0}%`}
						change={trends.successRateChange}
						trend={trends.successRateChange > 0 ? "up" : "neutral"}
						icon={Award}
						color="amber"
						description="Acceptance rate"
					/>
				</div>
			</motion.div>

			{/* AI Performance Section */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.2 }}
			>
				<Card className="overflow-hidden border-2 border-primary-200 shadow-elevated">
					<div className="bg-gradient-to-r from-primary-50 to-secondary-50 border-b border-primary-200">
						<div className="px-8 py-6">
							<div className="flex items-center justify-between mb-1">
								<div className="flex items-center gap-3">
									<div className="p-3 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-xl shadow-soft">
										<Sparkles className="h-6 w-6 text-white" />
									</div>
									<div>
										<h2 className="text-2xl font-bold text-surface-900">AI Recommendation Engine</h2>
										<p className="text-sm text-surface-600 mt-1">Machine learning model performance metrics and insights</p>
									</div>
								</div>
								<div className="flex items-center gap-2 px-4 py-2 bg-success-100 text-success-800 rounded-full border border-success-200">
									<Zap className="h-4 w-4" />
									<span className="text-sm font-semibold">Operational</span>
								</div>
							</div>
						</div>
					</div>
					<CardContent className="p-8">
						<div className="grid grid-cols-2 md:grid-cols-4 gap-8">
							<AIMetricCard
								label="Skill Alignment"
								value={`${aiPerformance.averageSkillAlignment || 0}%`}
								icon={Target}
								color="blue"
								description="Avg match accuracy"
							/>
							<AIMetricCard
								label="Acceptance Rate"
								value={`${aiPerformance.acceptanceRate || 0}%`}
								icon={CheckCircle}
								color="green"
								description="Offer acceptance"
							/>
							<AIMetricCard
								label="User Rating"
								value={aiPerformance.averageRating || "N/A"}
								icon={Award}
								color="purple"
								description="Satisfaction score"
							/>
							<AIMetricCard
								label="Coverage"
								value={`${aiPerformance.feedbackCoverage || 0}%`}
								icon={BarChart3}
								color="amber"
								description="Feedback collected"
							/>
						</div>
					</CardContent>
				</Card>
			</motion.div>

			{/* Application Status Overview */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.3 }}
			>
				<Card className="shadow-card">
					<CardHeader className="bg-surface-50 border-b border-surface-200">
						<div className="flex items-center justify-between">
							<CardTitle className="text-xl">Application Pipeline</CardTitle>
							<button className="btn-ghost text-sm py-2">
								<Download className="h-4 w-4" />
								Export Report
							</button>
						</div>
					</CardHeader>
					<CardContent className="p-8">
						<div className="grid grid-cols-2 md:grid-cols-4 gap-6">
							<PipelineCard
								icon={CheckCircle}
								label="Accepted"
								count={dashboardData?.statistics?.applicationStatus?.accepted || 0}
								color="success"
								percentage={Math.round((dashboardData?.statistics?.applicationStatus?.accepted / stats.totalApplications) * 100) || 0}
							/>
							<PipelineCard
								icon={Clock}
								label="Pending"
								count={dashboardData?.statistics?.applicationStatus?.applied || 0}
								color="warning"
								percentage={Math.round((dashboardData?.statistics?.applicationStatus?.applied / stats.totalApplications) * 100) || 0}
							/>
							<PipelineCard
								icon={AlertCircle}
								label="Shortlisted"
								count={dashboardData?.statistics?.applicationStatus?.shortlisted || 0}
								color="info"
								percentage={Math.round((dashboardData?.statistics?.applicationStatus?.shortlisted / stats.totalApplications) * 100) || 0}
							/>
							<PipelineCard
								icon={XCircle}
								label="Rejected"
								count={dashboardData?.statistics?.applicationStatus?.rejected || 0}
								color="danger"
								percentage={Math.round((dashboardData?.statistics?.applicationStatus?.rejected / stats.totalApplications) * 100) || 0}
							/>
						</div>
					</CardContent>
				</Card>
			</motion.div>

			{/* Analytics Charts Grid */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.4 }}
				className="grid grid-cols-1 lg:grid-cols-2 gap-6"
			>
				{/* Application Trends */}
				<Card className="shadow-card">
					<CardHeader className="border-b border-surface-200">
						<CardTitle>Application Trends</CardTitle>
						<p className="text-sm text-surface-600 mt-1">Daily application volume and status distribution</p>
					</CardHeader>
					<CardContent className="p-6">
						<TrendAreaChart
							data={formatTimeSeriesData(charts.applicationTrends)}
							xAxisKey="date"
							dataKeys={[
								{ key: "total", name: "Total", color: "#2563eb" },
								{ key: "accepted", name: "Accepted", color: "#10b981" },
								{ key: "rejected", name: "Rejected", color: "#ef4444" },
							]}
							height={280}
						/>
					</CardContent>
				</Card>

				{/* Domain Distribution */}
				<Card className="shadow-card">
					<CardHeader className="border-b border-surface-200">
						<CardTitle>Internships by Domain</CardTitle>
						<p className="text-sm text-surface-600 mt-1">Distribution across different industry sectors</p>
					</CardHeader>
					<CardContent className="p-6">
						<DonutChart
							data={formatDomainData(charts.domainDistribution)}
							dataKey="internshipCount"
							nameKey="domain"
							height={280}
						/>
					</CardContent>
				</Card>

				{/* Top Skills */}
				<Card className="shadow-card">
					<CardHeader className="border-b border-surface-200">
						<CardTitle>Most In-Demand Skills</CardTitle>
						<p className="text-sm text-surface-600 mt-1">Top 10 skills requested by employers</p>
					</CardHeader>
					<CardContent className="p-6">
						<HorizontalBarChart
							data={(charts.topSkills || []).slice(0, 10).map((s) => ({
								name: s.skill,
								value: s.count,
							}))}
							dataKey="value"
							categoryKey="name"
							height={320}
						/>
					</CardContent>
				</Card>

				{/* Location Analytics */}
				<Card className="shadow-card">
					<CardHeader className="border-b border-surface-200">
						<CardTitle>Geographic Distribution</CardTitle>
						<p className="text-sm text-surface-600 mt-1">Internship opportunities by location</p>
					</CardHeader>
					<CardContent className="p-6">
						<VerticalBarChart
							data={(charts.locationDistribution || []).slice(0, 8).map((l) => ({
								name: l.location,
								internships: l.count,
							}))}
							xAxisKey="name"
							dataKeys={[
								{ key: "internships", name: "Internships", color: "#2563eb" },
							]}
							height={320}
						/>
					</CardContent>
				</Card>
			</motion.div>

			{/* Engagement Metrics */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.5 }}
			>
				<Card className="shadow-card">
					<CardHeader className="bg-surface-50 border-b border-surface-200">
						<CardTitle className="text-xl">Student Engagement Analytics</CardTitle>
					</CardHeader>
					<CardContent className="p-8">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
							<EngagementMetric
								title="Profile Completion"
								segments={engagement.profileCompletion || []}
							/>
							<EngagementMetric
								title="With Certifications"
								value={`${Math.round((engagement.skillDevelopment?.withCertifications / engagement.skillDevelopment?.total) * 100) || 0}%`}
								subtitle={`${engagement.skillDevelopment?.withCertifications || 0} students`}
								color="success"
							/>
							<EngagementMetric
								title="Active Skills Listed"
								value={`${Math.round((engagement.skillDevelopment?.withSkills / engagement.skillDevelopment?.total) * 100) || 0}%`}
								subtitle={`${engagement.skillDevelopment?.withSkills || 0} students`}
								color="primary"
							/>
						</div>
					</CardContent>
				</Card>
			</motion.div>
		</div>
	);
}

// Enterprise Stat Card Component
const EnterpriseStatCard = ({ title, value, change, trend, icon: Icon, color, description }) => {
	const colorSchemes = {
		blue: {
			bg: "from-blue-500 to-blue-600",
			icon: "bg-blue-500",
			text: "text-blue-600",
			light: "bg-blue-50",
			border: "border-blue-200",
		},
		purple: {
			bg: "from-purple-500 to-purple-600",
			icon: "bg-purple-500",
			text: "text-purple-600",
			light: "bg-purple-50",
			border: "border-purple-200",
		},
		green: {
			bg: "from-green-500 to-green-600",
			icon: "bg-green-500",
			text: "text-green-600",
			light: "bg-green-50",
			border: "border-green-200",
		},
		amber: {
			bg: "from-amber-500 to-amber-600",
			icon: "bg-amber-500",
			text: "text-amber-600",
			light: "bg-amber-50",
			border: "border-amber-200",
		},
	};

	const scheme = colorSchemes[color] || colorSchemes.blue;

	return (
		<motion.div
			whileHover={{ y: -4, transition: { duration: 0.2 } }}
			className="relative group"
		>
			<div className="card-elevated p-6 h-full">
				<div className="flex items-start justify-between mb-4">
					<div className={`p-3 rounded-xl bg-gradient-to-br ${scheme.bg} shadow-soft`}>
						<Icon className="h-6 w-6 text-white" />
					</div>
					{change !== undefined && (
						<div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
							trend === 'up' ? 'bg-success-100 text-success-700' :
							trend === 'down' ? 'bg-danger-100 text-danger-700' :
							'bg-surface-200 text-surface-700'
						}`}>
							{trend === 'up' ? <ArrowUpRight className="h-3.5 w-3.5" /> : trend === 'down' ? <ArrowDownRight className="h-3.5 w-3.5" /> : null}
							{Math.abs(change)}%
						</div>
					)}
				</div>
				<div>
					<p className="text-sm font-semibold text-surface-600 mb-1">{title}</p>
					<h3 className="text-3xl font-bold text-surface-900 mb-1">{value}</h3>
					<p className="text-xs text-surface-500">{description}</p>
				</div>
			</div>
		</motion.div>
	);
};

// AI Metric Card
const AIMetricCard = ({ label, value, icon: Icon, color, description }) => {
	const colors = {
		blue: "text-primary-600 bg-primary-100",
		green: "text-success-600 bg-success-100",
		purple: "text-secondary-600 bg-secondary-100",
		amber: "text-warning-600 bg-warning-100",
	};

	return (
		<div className="text-center">
			<div className="flex justify-center mb-3">
				<div className={`p-3 rounded-xl ${colors[color]}`}>
					<Icon className="h-5 w-5" />
				</div>
			</div>
			<div className="text-3xl font-bold text-surface-900 mb-1">{value}</div>
			<div className="text-sm font-semibold text-surface-700 mb-1">{label}</div>
			<div className="text-xs text-surface-500">{description}</div>
		</div>
	);
};

// Pipeline Card
const PipelineCard = ({ icon: Icon, label, count, color, percentage }) => {
	const colors = {
		success: {
			bg: "bg-success-50",
			border: "border-success-200",
			text: "text-success-700",
			icon: "text-success-600",
			bar: "bg-success-500",
		},
		warning: {
			bg: "bg-warning-50",
			border: "border-warning-200",
			text: "text-warning-700",
			icon: "text-warning-600",
			bar: "bg-warning-500",
		},
		info: {
			bg: "bg-primary-50",
			border: "border-primary-200",
			text: "text-primary-700",
			icon: "text-primary-600",
			bar: "bg-primary-500",
		},
		danger: {
			bg: "bg-danger-50",
			border: "border-danger-200",
			text: "text-danger-700",
			icon: "text-danger-600",
			bar: "bg-danger-500",
		},
	};

	const scheme = colors[color];

	return (
		<div className={`border-2 ${scheme.border} ${scheme.bg} rounded-xl p-5`}>
			<div className="flex items-start justify-between mb-3">
				<Icon className={`h-7 w-7 ${scheme.icon}`} />
				<span className={`text-xs font-bold ${scheme.text}`}>{percentage}%</span>
			</div>
			<div className="text-3xl font-bold text-surface-900 mb-1">{count.toLocaleString()}</div>
			<div className={`text-sm font-semibold ${scheme.text} mb-3`}>{label}</div>
			<div className="h-1.5 bg-surface-200 rounded-full overflow-hidden">
				<motion.div
					initial={{ width: 0 }}
					animate={{ width: `${percentage}%` }}
					transition={{ duration: 1, delay: 0.5 }}
					className={`h-full ${scheme.bar} rounded-full`}
				/>
			</div>
		</div>
	);
};

// Engagement Metric
const EngagementMetric = ({ title, value, subtitle, color, segments }) => {
	if (segments) {
		return (
			<div>
				<h4 className="text-sm font-bold text-surface-900 mb-4">{title}</h4>
				<div className="space-y-3">
					{segments.map((seg, idx) => (
						<div key={idx}>
							<div className="flex justify-between text-xs font-semibold mb-1.5">
								<span className="text-surface-700">{seg.range}</span>
								<span className="text-surface-900">{seg.count} students</span>
							</div>
							<div className="h-2.5 bg-surface-200 rounded-full overflow-hidden">
								<motion.div
									initial={{ width: 0 }}
									animate={{ width: `${(seg.count / Math.max(...segments.map((s) => s.count))) * 100}%` }}
									transition={{ duration: 0.8, delay: idx * 0.1 }}
									className="h-full bg-gradient-to-r from-primary-600 to-secondary-600 rounded-full"
								/>
							</div>
						</div>
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="text-center">
			<div className="text-5xl font-bold text-surface-900 mb-2">{value}</div>
			<h4 className="text-sm font-bold text-surface-900 mb-1">{title}</h4>
			<p className="text-xs text-surface-600">{subtitle}</p>
		</div>
	);
};

// Data formatting helpers
function formatTimeSeriesData(data) {
	if (!data || !data.dates) return [];
	return data.dates.map((date, idx) => ({
		date: new Date(date).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
		}),
		total: data.total[idx] || 0,
		accepted: data.accepted[idx] || 0,
		shortlisted: data.shortlisted[idx] || 0,
		rejected: data.rejected[idx] || 0,
	}));
}

function formatDomainData(data) {
	if (!data || !Array.isArray(data)) return [];
	return data.map((d) => ({
		domain: d.domain || "Other",
		internshipCount: d.internshipCount || 0,
		applicationCount: d.applicationCount || 0,
	}));
}
