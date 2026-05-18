import natural from "natural";
import compromise from "compromise";
import { removeStopwords } from "stopword";

const tokenizer = new natural.WordTokenizer();
const TfIdf = natural.TfIdf;

/**
 * Advanced NLP module for processing resumes, job descriptions, and extracting insights
 * Implements sophisticated text analysis for the PM Internship Scheme
 */

/**
 * Extract skills from unstructured text using NLP
 * @param {string} text - Raw text from resume or profile
 * @returns {Array<string>} - Extracted skills
 */
export function extractSkills(text) {
	if (!text) return [];

	// Common technical and soft skills dictionary
	const skillPatterns = [
		// Programming Languages
		/\b(javascript|python|java|c\+\+|c#|ruby|php|swift|kotlin|go|rust|typescript|scala|r|matlab)\b/gi,
		// Frameworks & Libraries
		/\b(react|angular|vue|node\.?js|express|django|flask|spring|laravel|rails|\.net|tensorflow|pytorch)\b/gi,
		// Databases
		/\b(mysql|postgresql|mongodb|oracle|redis|cassandra|elasticsearch|dynamodb|sqlite)\b/gi,
		// DevOps & Cloud
		/\b(docker|kubernetes|aws|azure|gcp|jenkins|gitlab|ci\/cd|terraform|ansible)\b/gi,
		// Methodologies
		/\b(agile|scrum|kanban|devops|tdd|bdd|waterfall)\b/gi,
		// Soft Skills
		/\b(leadership|communication|teamwork|problem[- ]solving|analytical|creative|time[- ]management|presentation)\b/gi,
		// Tools
		/\b(git|github|jira|slack|figma|photoshop|illustrator|excel|powerpoint|tableau|power[- ]bi)\b/gi,
		// Data Science & AI
		/\b(machine[- ]learning|deep[- ]learning|nlp|computer[- ]vision|data[- ]science|statistics|pandas|numpy|scikit-learn)\b/gi,
		// Marketing & Business
		/\b(seo|sem|content[- ]marketing|social[- ]media|google[- ]analytics|marketing[- ]strategy|brand[- ]management)\b/gi,
	];

	const extractedSkills = new Set();

	// Extract using regex patterns
	skillPatterns.forEach((pattern) => {
		const matches = text.match(pattern);
		if (matches) {
			matches.forEach((skill) =>
				extractedSkills.add(skill.toLowerCase().trim()),
			);
		}
	});

	// Use compromise for entity extraction
	const doc = compromise(text);

	// Extract technical terms
	const topics = doc.topics().out("array");
	topics.forEach((topic) => {
		if (topic.length > 2 && topic.length < 30) {
			extractedSkills.add(topic.toLowerCase());
		}
	});

	return Array.from(extractedSkills);
}

/**
 * Extract education information from text
 * @param {string} text - Resume text
 * @returns {Object} - Education details
 */
export function extractEducation(text) {
	if (!text) return {};

	const doc = compromise(text);
	const education = {
		degrees: [],
		institutions: [],
		gpa: null,
	};

	// Extract degrees
	const degreePatterns =
		/\b(b\.?tech|b\.?e\.?|m\.?tech|m\.?e\.?|mba|bba|bca|mca|b\.?sc|m\.?sc|phd|bachelor|master|diploma)\b/gi;
	const degrees = text.match(degreePatterns);
	if (degrees) {
		education.degrees = [...new Set(degrees.map((d) => d.toLowerCase()))];
	}

	// Extract GPA/CGPA
	const gpaPattern =
		/\b(gpa|cgpa)[:\s]*(\d+\.?\d*)\s*(?:\/|out of)?\s*(\d+\.?\d*)?\b/gi;
	const gpaMatch = gpaPattern.exec(text);
	if (gpaMatch) {
		const score = parseFloat(gpaMatch[2]);
		const outOf = gpaMatch[3] ? parseFloat(gpaMatch[3]) : 10;
		education.gpa = outOf === 10 ? score : (score / outOf) * 10;
	}

	return education;
}

/**
 * Calculate semantic similarity between two texts using TF-IDF
 * @param {string} text1 - First text
 * @param {string} text2 - Second text
 * @returns {number} - Similarity score (0-1)
 */
export function calculateTextSimilarity(text1, text2) {
	if (!text1 || !text2) return 0;

	const tfidf = new TfIdf();
	tfidf.addDocument(text1.toLowerCase());
	tfidf.addDocument(text2.toLowerCase());

	const terms1 = new Set();
	tfidf.listTerms(0).forEach((term) => terms1.add(term.term));

	const terms2 = new Set();
	tfidf.listTerms(1).forEach((term) => terms2.add(term.term));

	const intersection = new Set([...terms1].filter((x) => terms2.has(x)));
	const union = new Set([...terms1, ...terms2]);

	return union.size > 0 ? intersection.size / union.size : 0;
}

/**
 * Extract key phrases from text using statistical methods
 * @param {string} text - Input text
 * @param {number} topN - Number of phrases to return
 * @returns {Array<string>} - Key phrases
 */
export function extractKeyPhrases(text, topN = 10) {
	if (!text) return [];

	const doc = compromise(text);

	// Extract noun phrases
	const nounPhrases = doc.match("#Noun+ #Noun").out("array");

	// Extract verbs with objects
	const verbPhrases = doc.match("#Verb #Noun").out("array");

	// Combine and rank by frequency
	const phrases = new Map();
	[...nounPhrases, ...verbPhrases].forEach((phrase) => {
		const normalized = phrase.toLowerCase().trim();
		if (normalized.length > 3) {
			phrases.set(normalized, (phrases.get(normalized) || 0) + 1);
		}
	});

	return Array.from(phrases.entries())
		.sort((a, b) => b[1] - a[1])
		.slice(0, topN)
		.map(([phrase]) => phrase);
}

/**
 * Analyze sentiment of feedback text
 * @param {string} text - Feedback text
 * @returns {Object} - Sentiment analysis result
 */
export function analyzeSentiment(text) {
	if (!text) return { score: 0, comparative: 0, positive: [], negative: [] };

	const Analyzer = natural.SentimentAnalyzer;
	const stemmer = natural.PorterStemmer;
	const analyzer = new Analyzer("English", stemmer, "afinn");

	const tokens = tokenizer.tokenize(text.toLowerCase());
	const score = analyzer.getSentiment(tokens);

	return {
		score,
		comparative: score / (tokens.length || 1),
		classification:
			score > 0 ? "positive" : score < 0 ? "negative" : "neutral",
		confidence: Math.abs(score),
	};
}

/**
 * Extract experience years from text
 * @param {string} text - Resume text
 * @returns {number} - Years of experience
 */
export function extractExperience(text) {
	if (!text) return 0;

	// Patterns for experience
	const patterns = [
		/(\d+)\s*\+?\s*years?\s+(?:of\s+)?experience/gi,
		/experience\s*[:=]\s*(\d+)\s*\+?\s*years?/gi,
		/(\d+)\s*\+?\s*yrs?\s+(?:of\s+)?exp/gi,
	];

	let maxYears = 0;
	patterns.forEach((pattern) => {
		const matches = text.matchAll(pattern);
		for (const match of matches) {
			const years = parseInt(match[1]);
			if (years > maxYears && years < 50) {
				maxYears = years;
			}
		}
	});

	return maxYears;
}

/**
 * Generate resume summary using extractive summarization
 * @param {string} text - Resume text
 * @param {number} sentences - Number of sentences in summary
 * @returns {string} - Summary
 */
export function generateSummary(text, sentences = 3) {
	if (!text) return "";

	const doc = compromise(text);
	const allSentences = doc.sentences().out("array");

	if (allSentences.length <= sentences) {
		return allSentences.join(" ");
	}

	// Score sentences based on keyword density
	const tfidf = new TfIdf();
	allSentences.forEach((sentence) =>
		tfidf.addDocument(sentence.toLowerCase()),
	);

	const scores = allSentences.map((sentence, idx) => {
		let score = 0;
		tfidf
			.listTerms(idx)
			.slice(0, 5)
			.forEach((term) => {
				score += term.tfidf;
			});
		return { sentence, score, idx };
	});

	// Select top sentences and maintain order
	return scores
		.sort((a, b) => b.score - a.score)
		.slice(0, sentences)
		.sort((a, b) => a.idx - b.idx)
		.map((s) => s.sentence)
		.join(" ");
}

/**
 * Match job requirements with candidate profile using advanced NLP
 * @param {string} jobDescription - Job description text
 * @param {string} candidateProfile - Candidate resume/profile text
 * @returns {Object} - Match analysis
 */
export function matchJobToCandidate(jobDescription, candidateProfile) {
	const jobSkills = extractSkills(jobDescription);
	const candidateSkills = extractSkills(candidateProfile);

	const jobKeyPhrases = extractKeyPhrases(jobDescription, 15);
	const candidateKeyPhrases = extractKeyPhrases(candidateProfile, 15);

	// Calculate matches
	const matchedSkills = jobSkills.filter((skill) =>
		candidateSkills.some((cs) => cs.includes(skill) || skill.includes(cs)),
	);

	const matchedPhrases = jobKeyPhrases.filter((phrase) =>
		candidateKeyPhrases.some(
			(cp) =>
				cp.includes(phrase) ||
				phrase.includes(cp) ||
				calculateTextSimilarity(phrase, cp) > 0.7,
		),
	);

	const semanticSimilarity = calculateTextSimilarity(
		jobDescription,
		candidateProfile,
	);

	const skillMatchRate =
		jobSkills.length > 0 ? matchedSkills.length / jobSkills.length : 0;

	const overallMatch = skillMatchRate * 0.6 + semanticSimilarity * 0.4;

	return {
		overallMatch,
		skillMatchRate,
		semanticSimilarity,
		matchedSkills,
		missingSkills: jobSkills.filter(
			(skill) => !matchedSkills.includes(skill),
		),
		matchedPhrases,
		matchedSkillsCount: matchedSkills.length,
		totalRequiredSkills: jobSkills.length,
		confidence:
			overallMatch > 0.7 ? "high" : overallMatch > 0.4 ? "medium" : "low",
	};
}

/**
 * Process and clean text for analysis
 * @param {string} text - Raw text
 * @returns {Array<string>} - Cleaned tokens
 */
export function preprocessText(text) {
	if (!text) return [];

	// Tokenize
	let tokens = tokenizer.tokenize(text.toLowerCase());

	// Remove stopwords
	tokens = removeStopwords(tokens);

	// Stem words
	const stemmer = natural.PorterStemmer;
	tokens = tokens.map((token) => stemmer.stem(token));

	// Filter short tokens
	tokens = tokens.filter((token) => token.length > 2);

	return tokens;
}

export default {
	extractSkills,
	extractEducation,
	calculateTextSimilarity,
	extractKeyPhrases,
	analyzeSentiment,
	extractExperience,
	generateSummary,
	matchJobToCandidate,
	preprocessText,
};
