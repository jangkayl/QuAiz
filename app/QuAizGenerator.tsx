"use client";

import { useState, useRef } from "react";
import Image from "next/image";

interface QuizOption {
	letter: string;
	text: string;
}

interface QuizData {
	question: string;
	options: QuizOption[];
	correctAnswer: string;
}

export default function QuAizGenerator() {
	const [topic, setTopic] = useState<string>("");
	const [quiz, setQuiz] = useState<QuizData | null>(null);
	const [loading, setLoading] = useState<boolean>(false);
	const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
	const [feedback, setFeedback] = useState<string>("");
	const [showNext, setShowNext] = useState<boolean>(false);
	const quizRef = useRef<HTMLDivElement | null>(null);

	const generateQuiz = async () => {
		setLoading(true);
		setQuiz(null);
		setSelectedAnswer(null);
		setFeedback("");
		setShowNext(false);

		try {
			const response = await fetch("/api/quiz", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ topic }),
			});

			const data = await response.json();

			if (response.ok) {
				const lines: string[] = data.quiz
					.split("\n")
					.map((line: string) => line.trim())
					.filter((line: string) => line !== "");

				const question = lines[1];
				const options: QuizOption[] = lines
					.slice(2, 7)
					.map((line) => {
						const match = line.match(/^([A-D])\)\s(.+)$/);
						return match ? { letter: match[1], text: match[2] } : null;
					})
					.filter((option): option is QuizOption => option !== null);

				let correctAnswer = "";
				for (let i = 0; i < lines.length; i++) {
					if (lines[i] === "**Correct Answer:**") {
						correctAnswer = lines[i + 1]?.trim() || "";
						break;
					}
				}

				setQuiz({ question, options, correctAnswer });

				setTimeout(() => {
					quizRef.current?.scrollIntoView({ behavior: "smooth" });
				}, 100);
			} else {
				setQuiz(null);
			}
		} catch (error) {
			console.error("Request failed:", error);
			setQuiz(null);
		}
		setLoading(false);
	};

	const handleSubmit = () => {
		if (!selectedAnswer || !quiz) return;

		const correctLetter = quiz.correctAnswer.charAt(0);

		setFeedback(
			selectedAnswer === correctLetter
				? "✅ Correct!"
				: `❌ Incorrect. \nThe correct answer was ${quiz.correctAnswer}`
		);

		setShowNext(true);
	};

	return (
		<div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-gray-800 via-gray-900 to-black text-white">
			<div className="mb-6">
				<Image
					src="/QuAiz.png"
					alt="Quiz Image"
					width={300}
					height={0}
				/>
			</div>

			<div className="w-full max-w-md bg-gray-900 p-6 rounded-lg shadow-2xl">
				<h1 className="text-2xl font-bold text-center mb-4 text-gray-200">
					QuAiz Generator
				</h1>

				<input
					type="text"
					value={topic}
					onChange={(e) => setTopic(e.target.value)}
					placeholder="Enter a topic (e.g., Space, History)"
					className="w-full p-3 text-gray-900 rounded-md bg-gray-200 outline-none focus:ring-2 focus:ring-blue-400"
				/>

				<button
					onClick={generateQuiz}
					disabled={loading}
					className="w-full mt-4 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition">
					{loading ? "Generating..." : "Generate QuAiz"}
				</button>
			</div>

			{quiz && (
				<div
					ref={quizRef}
					className="mt-6 p-6 bg-gray-900 text-white shadow-lg rounded-lg w-full max-w-md text-center">
					<h2 className="text-xl font-semibold mb-4">{quiz.question}</h2>

					<div className="grid grid-cols-1 gap-3">
						{quiz.options.map((option) => (
							<button
								key={option.letter}
								onClick={() => setSelectedAnswer(option.letter)}
								className={`px-4 py-2 rounded-md text-lg font-medium transition ${
									selectedAnswer === option.letter
										? "bg-blue-600 text-white"
										: "bg-gray-700 hover:bg-gray-600"
								}`}>
								{option.letter}) {option.text}
							</button>
						))}
					</div>

					<button
						onClick={handleSubmit}
						disabled={!selectedAnswer || feedback !== ""}
						className="mt-4 w-full py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition">
						Submit
					</button>

					{feedback && (
						<p className="mt-4 text-lg whitespace-pre-wrap">{feedback}</p>
					)}

					{showNext && (
						<button
							onClick={generateQuiz}
							className="mt-4 w-full bg-purple-500 text-white py-2 rounded-md hover:bg-purple-600 transition">
							Next Question ➡️
						</button>
					)}
				</div>
			)}
		</div>
	);
}
