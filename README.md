# Manus AI

Manus AI is an autonomous artificial intelligence agent capable of executing complex tasks with minimal human intervention. This self-operating AI system bridges the gap between human thought and action, taking initiative and adapting dynamically to complete tasks.

## Features

- **Autonomous Task Execution**: Executes complex tasks without requiring continuous user prompting
- **Multi-agent Architecture**: Coordinates specialized sub-agents for different aspects of task execution
- **Advanced Planning**: Decomposes high-level objectives into executable steps
- **Tool Integration**: Leverages web browsers, file systems, and shell commands to accomplish tasks
- **Real-time Monitoring**: Transparent execution with "Manus's Computer" visualization

## System Architecture

The system consists of several key components:

1. **Agent System**
   - Executor: Coordinates task execution flow
   - Planner: Breaks down complex tasks into steps
   - Specialized Agents: Handle specific domains

2. **Sandbox Environment**
   - Secure execution of code and commands
   - Container-based isolation
   - Resource limits and security controls

3. **Tool Integrations**
   - Web browser automation
   - File system operations
   - Shell command execution
   - Code execution environments

4. **User Interface**
   - Dashboard for task overview
   - Task creation interface
   - "Manus's Computer" monitoring panel
   - Result visualization

## Tech Stack

- **Frontend**: React, Next.js, TypeScript, Tailwind CSS
- **Backend**: Node.js, Prisma ORM, SQLite
- **Authentication**: NextAuth.js (Google OAuth)
- **AI**: OpenAI API
- **Containerization**: Docker

## Getting Started

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- OpenAI API Key
- Google OAuth credentials

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/manus-ai.git
   cd manus-ai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Initialize the database:
   ```bash
   npx prisma migrate dev
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

### Running with Docker

1. Build and start the containers:
   ```bash
   docker-compose -f docker/docker-compose.yml up -d
   ```

2. The application will be available at http://localhost:3000

## Usage

1. Sign in using your Google account
2. Create a new task with a clear description
3. Manus AI will break down the task into executable steps
4. Monitor the execution in real-time via "Manus's Computer"
5. Review results when the task is complete

## Development

### Project Structure

```
manus-ai/
├── .env                      # Environment variables
├── package.json              # Project dependencies
├── prisma/                   # Database schema and migrations
├── public/                   # Static assets
├── src/
│   ├── app/                  # Next.js App Router
│   ├── components/           # Reusable UI components
│   ├── core/                 # Core business logic
│   │   ├── agent/            # Agent implementation
│   │   ├── sandbox/          # Sandbox environment
│   │   └── tools/            # Tool integrations
│   ├── lib/                  # Utility functions
│   └── providers/            # React context providers
└── docker/                   # Docker configuration
```

### Running Tests

```bash
npm test
```

## Security Considerations

Manus AI implements several security measures:

- Sandbox execution environment for all operations
- Container isolation for external tools
- Permission controls for file system and network access
- Audit logging for all actions
- Resource limitations to prevent abuse

## License

[MIT License](LICENSE)

## Acknowledgments

- Inspired by concepts from autonomous agent research
- Built on open-source tools and libraries