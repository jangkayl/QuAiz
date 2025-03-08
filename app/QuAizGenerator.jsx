"use client";

import { useState, useRef } from "react";
import Image from "next/image";

export default function QuAizGenerator() {
	const [topic, setTopic] = useState("");
	const [quiz, setQuiz] = useState(null);
	const [loading, setLoading] = useState(false);
	const [selectedAnswer, setSelectedAnswer] = useState(null);
	const [feedback, setFeedback] = useState("");
	const [showNext, setShowNext] = useState(false);
	const quizRef = useRef(null);

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
				const lines = data.quiz
					.split("\n")
					.map((line) => line.trim())
					.filter((line) => line !== "");

				const question = lines[1];
				const options = lines
					.slice(2, 7)
					.map((line) => {
						const match = line.match(/^([A-D])\)\s(.+)$/);
						return match ? { letter: match[1], text: match[2] } : null;
					})
					.filter(Boolean);

				let correctAnswer = "";
				for (let i = 0; i < lines.length; i++) {
					if (lines[i] === "**Correct Answer:**") {
						correctAnswer = lines[i + 1]?.trim();
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
		if (!selectedAnswer) return;

		const correctLetter = quiz.correctAnswer.charAt(0);

		setFeedback(
			selectedAnswer === correctLetter ? (
				"✅ Correct!"
			) : (
				<>
					❌ Incorrect. <br />
					The correct answer was <strong>{quiz.correctAnswer}</strong>
				</>
			)
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
						disabled={!selectedAnswer || feedback}
						className={`mt-4 w-full py-2 rounded-md text-lg transition ${
							!selectedAnswer || feedback
								? "bg-gray-500 cursor-not-allowed"
								: "bg-green-500 text-white hover:bg-green-600"
						}`}>
						Submit
					</button>

					{feedback && <p className="mt-4 text-lg">{feedback}</p>}

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
