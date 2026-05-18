import React from "react";
import { motion } from "framer-motion";

/**
 * Enterprise-grade Card components with advanced styling
 */

export const Card = ({ children, className = "", hover = false, ...props }) => {
	const baseClasses = "bg-white rounded-xl border border-gray-200 shadow-sm";
	const hoverClasses = hover
		? "transition-all duration-300 hover:shadow-lg hover:border-primary-300"
		: "";

	return (
		<div
			className={`${baseClasses} ${hoverClasses} ${className}`}
			{...props}
		>
			{children}
		</div>
	);
};

export const CardHeader = ({ children, className = "", action, ...props }) => {
	return (
		<div
			className={`px-6 py-5 border-b border-gray-100 ${className}`}
			{...props}
		>
			<div className="flex items-center justify-between">
				{children}
				{action && <div>{action}</div>}
			</div>
		</div>
	);
};

export const CardTitle = ({ children, className = "", ...props }) => {
	return (
		<h3
			className={`text-lg font-semibold text-gray-900 ${className}`}
			{...props}
		>
			{children}
		</h3>
	);
};

export const CardContent = ({ children, className = "", ...props }) => {
	return (
		<div className={`px-6 py-5 ${className}`} {...props}>
			{children}
		</div>
	);
};

export const AnimatedCard = ({
	children,
	className = "",
	delay = 0,
	...props
}) => {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4, delay }}
			className={className}
			{...props}
		>
			<Card>{children}</Card>
		</motion.div>
	);
};

/**
 * Stat Card for Dashboard Metrics
 */
export const StatCard = ({
	title,
	value,
	change,
	trend = "neutral",
	icon: Icon,
	description,
	loading = false,
}) => {
	const trendColors = {
		up: "text-green-600 bg-green-50",
		down: "text-red-600 bg-red-50",
		neutral: "text-gray-600 bg-gray-50",
	};

	const trendIcons = {
		up: "↑",
		down: "↓",
		neutral: "→",
	};

	if (loading) {
		return (
			<Card className="p-6">
				<div className="animate-pulse">
					<div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
					<div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
					<div className="h-3 bg-gray-200 rounded w-1/3"></div>
				</div>
			</Card>
		);
	}

	return (
		<Card hover className="p-6">
			<div className="flex items-start justify-between">
				<div className="flex-1">
					<p className="text-sm font-medium text-gray-600 mb-2">
						{title}
					</p>
					<motion.h3
						className="text-3xl font-bold text-gray-900 mb-2"
						initial={{ scale: 0.5 }}
						animate={{ scale: 1 }}
						transition={{ type: "spring", stiffness: 200 }}
					>
						{value}
					</motion.h3>
					{change !== undefined && (
						<div className="flex items-center gap-2">
							<span
								className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${trendColors[trend]}`}
							>
								{trendIcons[trend]} {Math.abs(change)}%
							</span>
							{description && (
								<span className="text-xs text-gray-500">
									{description}
								</span>
							)}
						</div>
					)}
				</div>
				{Icon && (
					<div className="flex-shrink-0">
						<div className="p-3 bg-primary-50 rounded-lg">
							<Icon className="w-6 h-6 text-primary-600" />
						</div>
					</div>
				)}
			</div>
		</Card>
	);
};

/**
 * Progress Card
 */
export const ProgressCard = ({
	title,
	current,
	total,
	percentage,
	color = "primary",
}) => {
	const colorVariants = {
		primary: "bg-primary-500",
		success: "bg-green-500",
		warning: "bg-amber-500",
		danger: "bg-red-500",
		info: "bg-blue-500",
	};

	return (
		<Card className="p-5">
			<div className="flex items-center justify-between mb-3">
				<h4 className="text-sm font-medium text-gray-700">{title}</h4>
				<span className="text-sm font-semibold text-gray-900">
					{percentage}%
				</span>
			</div>
			<div className="relative">
				<div className="overflow-hidden h-2 text-xs flex rounded-full bg-gray-200">
					<motion.div
						initial={{ width: 0 }}
						animate={{ width: `${percentage}%` }}
						transition={{ duration: 1, ease: "easeOut" }}
						className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${colorVariants[color]}`}
					/>
				</div>
			</div>
			{current !== undefined && total !== undefined && (
				<p className="text-xs text-gray-500 mt-2">
					{current} of {total}
				</p>
			)}
		</Card>
	);
};

/**
 * Info Card with Icon
 */
export const InfoCard = ({
	icon: Icon,
	title,
	description,
	action,
	variant = "default",
}) => {
	const variants = {
		default: "border-gray-200 bg-white",
		primary: "border-primary-200 bg-primary-50",
		success: "border-green-200 bg-green-50",
		warning: "border-amber-200 bg-amber-50",
		danger: "border-red-200 bg-red-50",
	};

	const iconColors = {
		default: "text-gray-600",
		primary: "text-primary-600",
		success: "text-green-600",
		warning: "text-amber-600",
		danger: "text-red-600",
	};

	return (
		<div className={`rounded-xl border p-5 ${variants[variant]}`}>
			<div className="flex items-start gap-4">
				{Icon && (
					<div className="flex-shrink-0">
						<Icon className={`w-6 h-6 ${iconColors[variant]}`} />
					</div>
				)}
				<div className="flex-1 min-w-0">
					<h4 className="text-sm font-semibold text-gray-900 mb-1">
						{title}
					</h4>
					<p className="text-sm text-gray-600">{description}</p>
					{action && <div className="mt-3">{action}</div>}
				</div>
			</div>
		</div>
	);
};

/**
 * Loading Card
 */
export const LoadingCard = ({ lines = 3 }) => {
	return (
		<Card className="p-6">
			<div className="animate-pulse space-y-4">
				{Array.from({ length: lines }).map((_, i) => (
					<div
						key={i}
						className="h-4 bg-gray-200 rounded"
						style={{ width: `${100 - i * 10}%` }}
					></div>
				))}
			</div>
		</Card>
	);
};

/**
 * Empty State Card
 */
export const EmptyStateCard = ({ icon: Icon, title, description, action }) => {
	return (
		<Card className="p-12">
			<div className="text-center">
				{Icon && (
					<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
						<Icon className="w-8 h-8 text-gray-400" />
					</div>
				)}
				<h3 className="text-lg font-medium text-gray-900 mb-2">
					{title}
				</h3>
				<p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
					{description}
				</p>
				{action && <div>{action}</div>}
			</div>
		</Card>
	);
};

export default {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
	AnimatedCard,
	StatCard,
	ProgressCard,
	InfoCard,
	LoadingCard,
	EmptyStateCard,
};
