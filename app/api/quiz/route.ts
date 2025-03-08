import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import { NextResponse } from "next/server";

const token = process.env.GITHUB_TOKEN;

if (!token) {
	console.error("❌ Missing GITHUB_TOKEN in .env.local");
	throw new Error("Missing GITHUB_TOKEN in environment variables");
}

const client = ModelClient(
	"https://models.inference.ai.azure.com",
	new AzureKeyCredential(token)
);

export async function POST(req: Request) {
	try {
		const { topic } = await req.json();
		if (!topic) {
			return NextResponse.json({ error: "Topic is required" }, { status: 400 });
		}

		console.log("✅ User input received:", topic);

		const response = await client.path("/chat/completions").post({
			body: {
				messages: [
					{
						role: "user",
						content: `Generate a random multiple-choice question about ${topic} with 4 options. Indicate the correct answer. ${
							process.env.OUTPUT_FORMAT || ""
						}`,
					},
				],
				model: "DeepSeek-V3",
				temperature: 0.8,
				max_tokens: 2048,
				top_p: 0.1,
			},
		});

		if (isUnexpected(response)) {
			console.error("❌ Unexpected response:", response.body);
			return NextResponse.json(
				{ error: "Unexpected API response" },
				{ status: 500 }
			);
		}

		const quiz = response.body.choices?.[0]?.message?.content;
		if (!quiz) {
			console.error("❌ No quiz generated:", response.body);
			return NextResponse.json(
				{ error: "No response from DeepSeek" },
				{ status: 500 }
			);
		}

		console.log("✅ Generated Quiz:", quiz);
		return NextResponse.json({ quiz }, { status: 200 });
	} catch (error) {
		console.error("❌ Error generating quiz:", error);
		return NextResponse.json(
			{ error: "Failed to generate quiz" },
			{ status: 500 }
		);
	}
}

// CHATGPT API
// import OpenAI from "openai";

// const openai = new OpenAI({
// 	baseURL: "https://models.inference.ai.azure.com",
// 	apiKey: process.env.GITHUB_TOKEN,
// });

// export async function POST(req: Request) {
// 	if (req.method !== "POST") {
// 		return new Response(JSON.stringify({ error: "Method not allowed" }), {
// 			status: 405,
// 		});
// 	}

// 	try {
// 		const { topic } = await req.json();
// 		if (!topic) {
// 			return new Response(JSON.stringify({ error: "Topic is required" }), {
// 				status: 400,
// 			});
// 		}

// 		console.log("User input received:", topic);

// 		const completion = await openai.chat.completions.create({
// 			model: "gpt-4o",
// 			messages: [
// 				{
// 					role: "system",
// 					content:
// 						"You are a quiz master who generates multiple-choice questions. Provide the question, 4 answer choices, and indicate the correct answer.",
// 				},
// 				{
// 					role: "user",
// 					content: Generate a random multiple-choice question about ${topic} with 4 options. Indicate the correct answer. ${process.env.OUTPUT_FORMAT},
// 				},
// 			],
// 		});

// 		const messageContent = completion.choices?.[0]?.message?.content;

// 		if (!messageContent) {
// 			throw new Error("No response from OpenAI");
// 		}

// 		console.log("Generated Quiz:", messageContent);
// 		return new Response(JSON.stringify({ quiz: messageContent }), {
// 			status: 200,
// 		});
// 	} catch (error) {
// 		console.error("Error generating quiz:", error);
// 		return new Response(JSON.stringify({ error: "Failed to generate quiz" }), {
// 			status: 500,
// 		});
// 	}
// }
