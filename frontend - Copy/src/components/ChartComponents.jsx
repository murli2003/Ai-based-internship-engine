import React from "react";
import {
	LineChart,
	Line,
	BarChart,
	Bar,
	PieChart,
	Pie,
	AreaChart,
	Area,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
	Cell,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "./EnterpriseCard";

/**
 * Enterprise-grade Chart Components with Recharts
 * Beautiful, responsive visualizations for dashboards
 */

const COLORS = {
	primary: "#4F46E5",
	secondary: "#7C3AED",
	success: "#10B981",
	warning: "#F59E0B",
	danger: "#EF4444",
	info: "#3B82F6",
	gray: "#6B7280",
};

const CHART_COLORS = [
	"#4F46E5",
	"#7C3AED",
	"#10B981",
	"#F59E0B",
	"#EF4444",
	"#3B82F6",
	"#8B5CF6",
	"#EC4899",
];

/**
 * Custom Tooltip Component
 */
const CustomTooltip = ({ active, payload, label }) => {
	if (!active || !payload || !payload.length) return null;

	return (
		<div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
			<p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
			{payload.map((entry, index) => (
				<div key={index} className="flex items-center gap-2 text-xs">
					<div
						className="w-3 h-3 rounded-full"
						style={{ backgroundColor: entry.color }}
					/>
					<span className="text-gray-600">{entry.name}:</span>
					<span className="font-semibold text-gray-900">
						{entry.value}
					</span>
				</div>
			))}
		</div>
	);
};

/**
 * Line Chart Component
 */
export const TrendLineChart = ({
	data,
	dataKeys = [],
	title,
	xAxisKey = "date",
	height = 300,
	loading = false,
}) => {
	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>{title}</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="animate-pulse h-[300px] bg-gray-200 rounded"></div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
			</CardHeader>
			<CardContent>
				<ResponsiveContainer width="100%" height={height}>
					<LineChart data={data}>
						<CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
						<XAxis
							dataKey={xAxisKey}
							stroke="#6B7280"
							style={{ fontSize: "12px" }}
						/>
						<YAxis stroke="#6B7280" style={{ fontSize: "12px" }} />
						<Tooltip content={<CustomTooltip />} />
						<Legend
							wrapperStyle={{ fontSize: "12px" }}
							iconType="circle"
						/>
						{dataKeys.map((key, index) => (
							<Line
								key={key.key || key}
								type="monotone"
								dataKey={key.key || key}
								name={key.name || key}
								stroke={
									key.color ||
									CHART_COLORS[index % CHART_COLORS.length]
								}
								strokeWidth={2}
								dot={{
									fill:
										key.color ||
										CHART_COLORS[
											index % CHART_COLORS.length
										],
									r: 4,
								}}
								activeDot={{ r: 6 }}
							/>
						))}
					</LineChart>
				</ResponsiveContainer>
			</CardContent>
		</Card>
	);
};

/**
 * Area Chart Component
 */
export const TrendAreaChart = ({
	data,
	dataKeys = [],
	title,
	xAxisKey = "date",
	height = 300,
	loading = false,
}) => {
	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>{title}</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="animate-pulse h-[300px] bg-gray-200 rounded"></div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
			</CardHeader>
			<CardContent>
				<ResponsiveContainer width="100%" height={height}>
					<AreaChart data={data}>
						<defs>
							{dataKeys.map((key, index) => {
								const color =
									key.color ||
									CHART_COLORS[index % CHART_COLORS.length];
								return (
									<linearGradient
										key={key.key || key}
										id={`color${index}`}
										x1="0"
										y1="0"
										x2="0"
										y2="1"
									>
										<stop
											offset="5%"
											stopColor={color}
											stopOpacity={0.8}
										/>
										<stop
											offset="95%"
											stopColor={color}
											stopOpacity={0}
										/>
									</linearGradient>
								);
							})}
						</defs>
						<CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
						<XAxis
							dataKey={xAxisKey}
							stroke="#6B7280"
							style={{ fontSize: "12px" }}
						/>
						<YAxis stroke="#6B7280" style={{ fontSize: "12px" }} />
						<Tooltip content={<CustomTooltip />} />
						<Legend
							wrapperStyle={{ fontSize: "12px" }}
							iconType="circle"
						/>
						{dataKeys.map((key, index) => (
							<Area
								key={key.key || key}
								type="monotone"
								dataKey={key.key || key}
								name={key.name || key}
								stroke={
									key.color ||
									CHART_COLORS[index % CHART_COLORS.length]
								}
								strokeWidth={2}
								fill={`url(#color${index})`}
							/>
						))}
					</AreaChart>
				</ResponsiveContainer>
			</CardContent>
		</Card>
	);
};

/**
 * Bar Chart Component
 */
export const HorizontalBarChart = ({
	data,
	dataKey = "value",
	categoryKey = "name",
	title,
	height = 300,
	color = COLORS.primary,
	loading = false,
}) => {
	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>{title}</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="animate-pulse h-[300px] bg-gray-200 rounded"></div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
			</CardHeader>
			<CardContent>
				<ResponsiveContainer width="100%" height={height}>
					<BarChart data={data} layout="vertical">
						<CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
						<XAxis
							type="number"
							stroke="#6B7280"
							style={{ fontSize: "12px" }}
						/>
						<YAxis
							type="category"
							dataKey={categoryKey}
							stroke="#6B7280"
							style={{ fontSize: "12px" }}
							width={120}
						/>
						<Tooltip content={<CustomTooltip />} />
						<Bar
							dataKey={dataKey}
							fill={color}
							radius={[0, 8, 8, 0]}
						>
							{data.map((entry, index) => (
								<Cell
									key={`cell-${index}`}
									fill={
										CHART_COLORS[
											index % CHART_COLORS.length
										]
									}
								/>
							))}
						</Bar>
					</BarChart>
				</ResponsiveContainer>
			</CardContent>
		</Card>
	);
};

/**
 * Vertical Bar Chart
 */
export const VerticalBarChart = ({
	data,
	dataKeys = [],
	title,
	xAxisKey = "name",
	height = 300,
	loading = false,
}) => {
	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>{title}</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="animate-pulse h-[300px] bg-gray-200 rounded"></div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
			</CardHeader>
			<CardContent>
				<ResponsiveContainer width="100%" height={height}>
					<BarChart data={data}>
						<CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
						<XAxis
							dataKey={xAxisKey}
							stroke="#6B7280"
							style={{ fontSize: "12px" }}
						/>
						<YAxis stroke="#6B7280" style={{ fontSize: "12px" }} />
						<Tooltip content={<CustomTooltip />} />
						<Legend
							wrapperStyle={{ fontSize: "12px" }}
							iconType="circle"
						/>
						{dataKeys.map((key, index) => (
							<Bar
								key={key.key || key}
								dataKey={key.key || key}
								name={key.name || key}
								fill={
									key.color ||
									CHART_COLORS[index % CHART_COLORS.length]
								}
								radius={[8, 8, 0, 0]}
							/>
						))}
					</BarChart>
				</ResponsiveContainer>
			</CardContent>
		</Card>
	);
};

/**
 * Pie Chart Component
 */
export const DonutChart = ({
	data,
	dataKey = "value",
	nameKey = "name",
	title,
	height = 300,
	loading = false,
}) => {
	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>{title}</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="animate-pulse h-[300px] bg-gray-200 rounded"></div>
				</CardContent>
			</Card>
		);
	}

	const RADIAN = Math.PI / 180;
	const renderCustomizedLabel = ({
		cx,
		cy,
		midAngle,
		innerRadius,
		outerRadius,
		percent,
	}) => {
		const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
		const x = cx + radius * Math.cos(-midAngle * RADIAN);
		const y = cy + radius * Math.sin(-midAngle * RADIAN);

		return (
			<text
				x={x}
				y={y}
				fill="white"
				textAnchor={x > cx ? "start" : "end"}
				dominantBaseline="central"
				style={{ fontSize: "12px", fontWeight: "600" }}
			>
				{`${(percent * 100).toFixed(0)}%`}
			</text>
		);
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
			</CardHeader>
			<CardContent>
				<ResponsiveContainer width="100%" height={height}>
					<PieChart>
						<Pie
							data={data}
							cx="50%"
							cy="50%"
							labelLine={false}
							label={renderCustomizedLabel}
							outerRadius={100}
							innerRadius={60}
							fill="#8884d8"
							dataKey={dataKey}
							nameKey={nameKey}
						>
							{data.map((entry, index) => (
								<Cell
									key={`cell-${index}`}
									fill={
										CHART_COLORS[
											index % CHART_COLORS.length
										]
									}
								/>
							))}
						</Pie>
						<Tooltip content={<CustomTooltip />} />
						<Legend
							wrapperStyle={{ fontSize: "12px" }}
							iconType="circle"
							layout="vertical"
							align="right"
							verticalAlign="middle"
						/>
					</PieChart>
				</ResponsiveContainer>
			</CardContent>
		</Card>
	);
};

/**
 * Mini Sparkline Chart (for inline stats)
 */
export const SparklineChart = ({
	data,
	dataKey = "value",
	color = COLORS.primary,
	height = 60,
}) => {
	return (
		<ResponsiveContainer width="100%" height={height}>
			<AreaChart data={data}>
				<defs>
					<linearGradient
						id="sparklineGradient"
						x1="0"
						y1="0"
						x2="0"
						y2="1"
					>
						<stop offset="5%" stopColor={color} stopOpacity={0.3} />
						<stop offset="95%" stopColor={color} stopOpacity={0} />
					</linearGradient>
				</defs>
				<Area
					type="monotone"
					dataKey={dataKey}
					stroke={color}
					strokeWidth={2}
					fill="url(#sparklineGradient)"
				/>
			</AreaChart>
		</ResponsiveContainer>
	);
};

export default {
	TrendLineChart,
	TrendAreaChart,
	HorizontalBarChart,
	VerticalBarChart,
	DonutChart,
	SparklineChart,
	COLORS,
	CHART_COLORS,
};
