import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Seed the database with initial data
 */
async function main() {
    console.log('Starting seeding...');

    // Create a test user
    const user = await prisma.user.upsert({
        where: { email: 'test@example.com' },
        update: {},
        create: {
            email: 'test@example.com',
            name: 'Test User',
            // In a real application, you'd use a secure password hashing solution
            // This is just for demonstration purposes
            emailVerified: new Date(),
        },
    });

    console.log(`Created user: ${user.name} (${user.email})`);

    // Create some sample tasks
    const tasks = [
        {
            title: 'Research AI advancements in healthcare',
            description: 'Gather and analyze information about the latest AI applications in healthcare, focusing on diagnostic tools and patient care improvements.',
            status: 'COMPLETED',
            priority: 'HIGH',
            userId: user.id,
            completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        },
        {
            title: 'Analyze quarterly sales data',
            description: 'Analyze the Q1 sales data to identify trends, compare to previous quarters, and generate visualizations for the executive meeting.',
            status: 'RESOLVED',
            priority: 'MEDIUM',
            userId: user.id,
            completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        },
        {
            title: 'Create a marketing strategy report',
            description: 'Develop a comprehensive report on digital marketing strategy for Q2, including social media, content, and email campaigns.',
            status: 'IN_PROGRESS',
            priority: 'MEDIUM',
            userId: user.id,
        },
        {
            title: 'Market research on renewable energy sector',
            description: 'Conduct market research on the renewable energy sector to identify investment opportunities and market trends for the next 5 years.',
            status: 'PENDING',
            priority: 'HIGH',
            userId: user.id,
        },
        {
            title: 'Prepare financial forecast',
            description: 'Create a financial forecast for the next fiscal year based on current performance and market projections.',
            status: 'PENDING',
            priority: 'MEDIUM',
            userId: user.id,
        }
    ];

    // Create each task and add sample steps and logs
    for (const taskData of tasks) {
        const task = await prisma.task.create({
            data: taskData,
        });

        console.log(`Created task: ${task.title} (${task.status})`);

        // Add task steps for the IN_PROGRESS task
        if (task.status === 'IN_PROGRESS') {
            const steps = [
                {
                    taskId: task.id,
                    stepNumber: 1,
                    description: 'Research current marketing trends in the industry',
                    status: 'COMPLETED',
                    startedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
                    completedAt: new Date(Date.now() - 36 * 60 * 60 * 1000),
                },
                {
                    taskId: task.id,
                    stepNumber: 2,
                    description: 'Analyze competitor strategies and identify gaps',
                    status: 'COMPLETED',
                    startedAt: new Date(Date.now() - 30 * 60 * 60 * 1000),
                    completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
                },
                {
                    taskId: task.id,
                    stepNumber: 3,
                    description: 'Develop content calendar for social media campaigns',
                    status: 'IN_PROGRESS',
                    startedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
                },
                {
                    taskId: task.id,
                    stepNumber: 4,
                    description: 'Create email marketing templates and sequences',
                    status: 'PENDING',
                },
                {
                    taskId: task.id,
                    stepNumber: 5,
                    description: 'Compile findings and recommendations into final report',
                    status: 'PENDING',
                }
            ];

            for (const stepData of steps) {
                const step = await prisma.taskStep.create({
                    data: stepData,
                });

                console.log(`Created step: ${step.description} (${step.status})`);
            }

            // Add logs for the IN_PROGRESS task
            const logs = [
                {
                    taskId: task.id,
                    level: 'INFO',
                    message: 'Task execution started',
                    agentType: 'ExecutorAgent',
                    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
                },
                {
                    taskId: task.id,
                    level: 'INFO',
                    message: 'Created execution plan with 5 steps',
                    agentType: 'ExecutorAgent',
                    timestamp: new Date(Date.now() - 47.5 * 60 * 60 * 1000),
                },
                {
                    taskId: task.id,
                    stepId: (await prisma.taskStep.findFirst({ where: { taskId: task.id, stepNumber: 1 } }))?.id,
                    level: 'INFO',
                    message: 'Starting execution of step 1: Research current marketing trends in the industry',
                    agentType: 'ExecutorAgent',
                    timestamp: new Date(Date.now() - 47 * 60 * 60 * 1000),
                },
                {
                    taskId: task.id,
                    stepId: (await prisma.taskStep.findFirst({ where: { taskId: task.id, stepNumber: 1 } }))?.id,
                    level: 'INFO',
                    message: 'WebBrowsingAgent executing step: Research current marketing trends in the industry',
                    agentType: 'WebBrowsingAgent',
                    timestamp: new Date(Date.now() - 46 * 60 * 60 * 1000),
                },
                {
                    taskId: task.id,
                    stepId: (await prisma.taskStep.findFirst({ where: { taskId: task.id, stepNumber: 1 } }))?.id,
                    level: 'INFO',
                    message: 'Executing web action: search',
                    agentType: 'WebBrowsingAgent',
                    timestamp: new Date(Date.now() - 45 * 60 * 60 * 1000),
                },
                {
                    taskId: task.id,
                    stepId: (await prisma.taskStep.findFirst({ where: { taskId: task.id, stepNumber: 1 } }))?.id,
                    level: 'INFO',
                    message: 'Completed step 1: Research current marketing trends in the industry',
                    agentType: 'ExecutorAgent',
                    timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000),
                },
                {
                    taskId: task.id,
                    stepId: (await prisma.taskStep.findFirst({ where: { taskId: task.id, stepNumber: 2 } }))?.id,
                    level: 'INFO',
                    message: 'Starting execution of step 2: Analyze competitor strategies and identify gaps',
                    agentType: 'ExecutorAgent',
                    timestamp: new Date(Date.now() - 30 * 60 * 60 * 1000),
                },
                {
                    taskId: task.id,
                    stepId: (await prisma.taskStep.findFirst({ where: { taskId: task.id, stepNumber: 2 } }))?.id,
                    level: 'INFO',
                    message: 'DataAnalysisAgent executing step: Analyze competitor strategies and identify gaps',
                    agentType: 'DataAnalysisAgent',
                    timestamp: new Date(Date.now() - 29 * 60 * 60 * 1000),
                },
                {
                    taskId: task.id,
                    stepId: (await prisma.taskStep.findFirst({ where: { taskId: task.id, stepNumber: 2 } }))?.id,
                    level: 'INFO',
                    message: 'Completed step 2: Analyze competitor strategies and identify gaps',
                    agentType: 'ExecutorAgent',
                    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
                },
                {
                    taskId: task.id,
                    stepId: (await prisma.taskStep.findFirst({ where: { taskId: task.id, stepNumber: 3 } }))?.id,
                    level: 'INFO',
                    message: 'Starting execution of step 3: Develop content calendar for social media campaigns',
                    agentType: 'ExecutorAgent',
                    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
                },
                {
                    taskId: task.id,
                    stepId: (await prisma.taskStep.findFirst({ where: { taskId: task.id, stepNumber: 3 } }))?.id,
                    level: 'INFO',
                    message: 'GeneralPurposeAgent executing step: Develop content calendar for social media campaigns',
                    agentType: 'GeneralPurposeAgent',
                    timestamp: new Date(Date.now() - 11 * 60 * 60 * 1000),
                },
            ];

            for (const logData of logs) {
                const log = await prisma.agentLog.create({
                    data: logData,
                });

                console.log(`Created log: ${log.message}`);
            }
        }

        // Add a result for the RESOLVED tasks
        if (task.status === 'RESOLVED') {
            const result = await prisma.taskResult.create({
                data: {
                    taskId: task.id,
                    content: `# ${task.title} - Analysis Report

## Executive Summary
This report presents an analysis of the quarterly sales data for Q1. The analysis reveals several key trends and insights that can help inform business decisions for the upcoming quarters.

## Key Findings
1. Overall sales increased by 15% compared to Q4 of the previous year
2. Product category A showed the strongest growth at 22%
3. The Western region outperformed other regions with a 27% increase
4. Customer retention rate improved to 78%, up from 72% in the previous quarter

## Recommendations
Based on the analysis, the following recommendations are made:
1. Increase marketing investment in Product category A
2. Implement the successful strategies from the Western region in other regions
3. Continue with the current customer retention programs
4. Explore opportunities to cross-sell between product categories

## Detailed Analysis
[Full detailed analysis with visualizations would be included here]
`,
                    contentType: 'text/markdown',
                },
            });

            console.log(`Created result for task: ${task.title}`);
        }
    }

    console.log('Seeding complete!');
}

main()
    .catch((e) => {
        console.error('Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });