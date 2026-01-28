# RepoNavigator AI 🧭

> **Instantaneously generate architectural insights and chat with any GitHub repository.**

RepoNavigator AI is a next-generation codebase analysis tool powered by a **Hybrid AI Orchestrator**. It leverages the low-latency reasoning of **Groq (Llama 3)** for search planning and the high-context window of **Google Gemini 2.5 Flash** for deep code synthesis.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-Production-green.svg)
![Tech](https://img.shields.io/badge/stack-Next.js_16_%7C_Tailwind_%7C_MongoDB-black.svg)

---

## 🏗 System Architecture

RepoNavigator is built on a **Dual-Agent Pipeline** designed to overcome the limitations of traditional RAG (Retrieval-Augmented Generation) systems. Instead of simple vector embeddings, we use active reasoning to "navigate" the codebase.

### The Hybrid AI Pipeline
The core logic resides in `src/lib/agents/orchestrator.ts`. Every user query triggers a two-step process:

1.  **The Librarian (Smart Context Algorithm)**
    *   **Role**: Planner & Context Selector.
    *   **Function**: A deterministic ranking engine that prioritizes critical files (`package.json`, `README.md`, entry points) to maximize AI context quality while minimizing noise.
    *   **Latency**: <10ms.

2.  **The Architect (Google Gemini 2.5 Flash)**
    *   **Role**: Synthesizer & Generator.
    *   **Function**: Receives the Librarian's plan and the raw file context. It uses its massive context window and reasoning capabilities to generate a precise, Markdown-formatted answer, including **Mermaid.js diagrams** when requested.

### Data Ingestion & Caching Layer
Located in `src/app/actions/ingestRepo.ts`.
*   **Structure Extraction**: recurses through the GitHub API to map the file tree.
*   **Atomic Persistence**: Repository metadata and architectural summaries are stored in **MongoDB**.
*   **Smart Caching**: subsequent requests for the same repository bypass the AI analysis phase, serving the cached architecture summary instantly `(O(1) lookup)`.

---

## 🛠 Tech Stack

### Core Platform
*   **Framework**: [Next.js 16 (App Router)](https://nextjs.org/) - Server Actions for backend logic.
*   **Runtime**: Node.js.
*   **Styling**: Tailwind CSS v4 + Framer Motion (for "smooth" interfaces).

### Database & Persistence
*   **Primary DB**: MongoDB (via Mongoose).
*   **Schemas**:
    *   `Repository`: Stores repo metadata, file tree structure, and the AI-generated architecture summary.
    *   `Message`: Stores chat history for persistent conversations across sessions.
    *   `UserHistory` & `ActivityLog`: Tracks authentication-aware user actions.

### AI & Agents
*   **Orchestration**: `ai` (Vercel AI SDK).
*   **Providers**:
    *   `@ai-sdk/google`: Interface for Gemini models.
    *   `@ai-sdk/openai`: Interface for Groq (via OpenAI-compatible endpoint).

### Client Features
*   **PDF Generation**: `html-to-image` + `jspdf` for vector-quality report export.
*   **State Management**: React Server Components + Client Hooks.

---

## 🚀 Key Features

### 1. Zero-Setup Codebase Analysis
Just paste a GitHub URL. The system automatically:
1.  Validates the repository.
2.  Fetches the file structure.
3.  **Agents** analyze the tech stack and architecture pattern.
4.  Persists the result for future users.

### 2. Context-Aware Chat
*   **Dedicated Chat Page**: Deep-dive into any repository with a full-screen, focused chat interface (`/chat/[repoId]`).
*   **Diagram Support**: Automatically renders interactive **Mermaid.js** diagrams (Flowcharts, Class Diagrams) to visualize the architecture.
    *   **Smart Rendering**: Custom renderer ensures secure and glitch-free visualization of complex systems.
*   **History Persistence**: Chat sessions are saved to MongoDB. You can leave and come back to your conversation.

### 3. User Dashboard
A personalized workspace for logged-in users:
*   **Repository Grid**: View all repositories you've analyzed, complete with "Last Visited" dates and one-click access.
*   **Activity Feed**: A real-time timeline tracking your analysis and viewing habits.
*   **Credit Meter**: Real-time tracking of AI Token Usage per repository, helping you monitor the cost/complexity of your analyses.
*   **Management**: Iterate on your history—delete old repositories or revisit cached ones instantly.

### 4. Flexible Authentication
*   **GitHub OAuth**: One-click sign-in via Better Auth.
*   **API Key Management**:
    *   **Global Mode**: Use server-configured keys for quick setup.
    *   **Personal Mode**: Override with your own Groq/Gemini keys securely (stored only in browser `localStorage`).

### 5. Smart Sync & Differential Scanning 🔄
*   **Stale Data Prevention**: Automatically fetches the latest commit hash from GitHub on every visit.
*   **Intelligent Validation**:
    *   **Cache Hit**: If the hash matches, serves instant cached results (`O(1)`).
    *   **Auto-Update**: If the hash differs, triggers a re-analysis.
*   **Patch Updates**: If <20 files changed, only the *diff* is analyzed to save AI tokens.

### 6. Repository Battle Arena ⚔️
*   **Side-by-Side Comparison**: Select any two analyzed repositories to see them face off.
*   **AI Verdict**: The Architect analyzes both tech stacks and patterns to generate a comparative report on strengths, weaknesses, and ideal use cases.

---

## 📦 Installation

### Prerequisites
*   Node.js 18+
*   MongoDB Instance (Local or Atlas)
*   API Keys: `GITHUB_TOKEN` (Required), `GOOGLE_GENERATIVE_AI_API_KEY` & `GROQ_API_KEY` (Optional if using Personal Mode)
*   **Auth Secrets**: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `BETTER_AUTH_SECRET`

### Setup

1.  **Clone the repository**
    ```bash
    git clone https://github.com/Abhinav-0709/reponavigator-ai.git
    cd reponavigator-ai
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Configuration**
    Create a `.env.local` file:
    ```env
    MONGODB_URI=your-mongodb-url
    GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_key
    GROQ_API_KEY=your_groq_key
    GITHUB_TOKEN=your_github_pat_token

    # Authentication (Better Auth)
    GITHUB_CLIENT_ID=your_github_oauth_client_id
    GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
    BETTER_AUTH_SECRET=generate_using_openssl_rand_base64_32
    NEXT_PUBLIC_BASE_URL=http://localhost:3000
    ```

    > **GitHub OAuth Setup**:
    > 1. Go to Developer Settings > OAuth Apps > New OAuth App.
    > 2. Homepage URL: `http://localhost:3000`
    > 3. **Authorization Callback URL**: `http://localhost:3000/api/auth/callback/github`

4.  **Run Development Server**
    ```bash
    npm run dev
    ```

---

## 🎯 Implementation Details

### Message Handling (Backend)
The chat endpoint `src/app/api/chat/route.ts` handles multi-modal message formats. It intelligently parses `content` vs `parts` to ensures compatibility with the latest AI SDKs and stores clean text data in MongoDB.

### Performance Optimization
*   **Typewriter Effect**: Custom React hook for smooth text streaming without blocking the UI thread.
*   **Smart Caching**: Logic in `ingestRepo.ts` detects re-visits to existing repositories, serving cached data while still updating User History and Activity Logs.
*   **Optimized Rendering**: Extensive use of `z-index` layering and sticky headers ensures a glitch-free experience on mobile and desktop.

---

## 🤝 Contributing

I value **Systems Thinking**. When contributing, please focus on:
1.  **Scalability**: Ensure database queries are indexed.
2.  **Modularity**: Keep the "Librarian" and "Architect" roles distinct in the orchestrator.
3.  **Type Safety**: Maintain strict TypeScript definitions for all AI responses.

---

---

## 🔮 Future Roadmap

### 1. Infrastructure Specialist (DevOps Agent) 🏗️
*   **Deep Dive**: Specialized agent to analyze `Dockerfile`, `k8s`, and `Terraform` files.
*   **Deployment**: Generates AWS/GCP/Azure deployment strategies.

### 2. Enterprise Infrastructure
*   **Redis + BullMQ**: Move ingestion to background job queues to handle large repositories and prevent timeouts.
*   **Rate Limiting**: Protect API usage.

### 3. Team Workspaces
*   Share analysis history with team members.


---

Built with ❤️ by Abhinav.