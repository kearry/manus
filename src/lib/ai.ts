/**
 * AI Service
 * 
 * Provides utilities for interacting with AI models for text generation,
 * planning, reasoning, and other capabilities.
 */

// Changed from using OpenAI from 'ai' to SDK directly
import OpenAI from 'openai';

// Initialize the OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
});

export interface LLMOptions {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    systemPrompt?: string;
}

const defaultOptions: LLMOptions = {
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2000,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
    systemPrompt: 'You are a helpful AI assistant named Manus.',
};

/**
 * Get a response from a language model
 */
export async function getLLMResponse(
    prompt: string,
    options: LLMOptions = {}
): Promise<string> {
    const mergedOptions = { ...defaultOptions, ...options };

    try {
        const response = await openai.chat.completions.create({
            model: mergedOptions.model!,
            messages: [
                {
                    role: 'system',
                    content: mergedOptions.systemPrompt!,
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: mergedOptions.temperature,
            max_tokens: mergedOptions.maxTokens,
            top_p: mergedOptions.topP,
            frequency_penalty: mergedOptions.frequencyPenalty,
            presence_penalty: mergedOptions.presencePenalty,
        });

        // Extract the response text
        return response.choices[0]?.message?.content || '';
    } catch (error) {
        console.error('Error getting LLM response:', error);
        throw error;
    }
}

/**
 * Generate a structured plan for a task
 */
export async function generateTaskPlan(
    taskTitle: string,
    taskDescription: string,
    options: LLMOptions = {}
): Promise<any[]> {
    const prompt = `
Task Planning Request:

I need to break down the following task into a detailed step-by-step plan:

Task Title: ${taskTitle}
Task Description: ${taskDescription || 'No additional description provided'}

Please create a step-by-step plan to accomplish this task. Each step should be clear, 
actionable, and specific. The plan should cover all necessary stages from initial 
data gathering to final output/completion.

Format your response as a JSON array of steps, where each step is an object with:
1. "description": A clear description of what needs to be done
2. "tools": An array of tools that might be needed (e.g. "browser", "shell", "filesystem", "code")
3. "estimatedTimeMinutes": An estimate of the time required in minutes

Example format:
[
  {
    "description": "Search for recent market data on renewable energy",
    "tools": ["browser"],
    "estimatedTimeMinutes": 10
  },
  {
    "description": "Extract and process data using Python",
    "tools": ["code", "filesystem"],
    "estimatedTimeMinutes": 15
  }
]
`;

    try {
        const response = await getLLMResponse(prompt, {
            ...options,
            systemPrompt: 'You are a helpful AI task planner. You break down complex tasks into clear, actionable steps. You only respond with valid JSON, no explanations.',
            temperature: 0.2,  // Lower temperature for more consistent planning
        });

        // Parse the response as JSON
        try {
            const plan = JSON.parse(response);
            if (Array.isArray(plan)) {
                return plan;
            } else {
                throw new Error('Response is not an array');
            }
        } catch (parseError) {
            console.error('Failed to parse LLM response as JSON:', parseError);
            // Fallback: try to extract JSON from the response using regex
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                try {
                    const extractedJson = JSON.parse(jsonMatch[0]);
                    if (Array.isArray(extractedJson)) {
                        return extractedJson;
                    }
                } catch (extractError) {
                    console.error('Failed to extract JSON from response:', extractError);
                }
            }

            // If all parsing attempts fail, return a minimal plan
            return [{
                description: `Execute task: ${taskTitle}`,
                tools: [],
                estimatedTimeMinutes: 30
            }];
        }
    } catch (error) {
        console.error('Error generating task plan:', error);
        throw error;
    }
}

/**
 * Extract information from text
 */
export async function extractInformation(
    text: string,
    schema: Record<string, string>,
    options: LLMOptions = {}
): Promise<Record<string, any>> {
    const schemaDescription = Object.entries(schema)
        .map(([key, description]) => `- "${key}": ${description}`)
        .join('\n');

    const prompt = `
Please extract the following information from the text below:

${schemaDescription}

Text:
${text}

Respond with a JSON object containing the extracted information. If a piece of information is not present, use null for that field.
`;

    try {
        const response = await getLLMResponse(prompt, {
            ...options,
            systemPrompt: 'You are a helpful AI information extractor. You extract structured information from text according to a schema. You only respond with valid JSON, no explanations.',
            temperature: 0.1,  // Lower temperature for more consistent extraction
        });

        // Parse the response as JSON
        try {
            return JSON.parse(response);
        } catch (parseError) {
            console.error('Failed to parse LLM response as JSON:', parseError);

            // Fallback: try to extract JSON from the response using regex
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    return JSON.parse(jsonMatch[0]);
                } catch (extractError) {
                    console.error('Failed to extract JSON from response:', extractError);
                }
            }

            // If all parsing attempts fail, return an empty object
            return {};
        }
    } catch (error) {
        console.error('Error extracting information:', error);
        throw error;
    }
}

/**
 * Generate code to solve a specific problem
 */
export async function generateCode(
    problem: string,
    language: string,
    options: LLMOptions = {}
): Promise<string> {
    const prompt = `
Please write ${language} code to solve the following problem:

${problem}

The code should be well-commented, efficient, and handle potential errors gracefully.
Only provide the code without any additional explanations or markdown formatting.
`;

    try {
        const response = await getLLMResponse(prompt, {
            ...options,
            systemPrompt: `You are an expert ${language} programmer. You write clean, efficient, and well-commented code.`,
            temperature: 0.2,  // Lower temperature for more deterministic code
        });

        // Extract code (remove markdown formatting if present)
        const codeRegex = new RegExp(`\`\`\`(?:${language})?(.*?)\`\`\``, 's');
        const match = response.match(codeRegex);

        if (match && match[1]) {
            return match[1].trim();
        }

        // If no code block is found, return the raw response
        return response;
    } catch (error) {
        console.error('Error generating code:', error);
        throw error;
    }
}