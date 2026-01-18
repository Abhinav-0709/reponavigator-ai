# RepoNavigator AI 🧭

> **Instantaneously generate architectural insights and chat with any GitHub repository.**

RepoNavigator AI is a next-generation codebase analysis tool powered by a **Hybrid AI Orchestrator**. It leverages the low-latency reasoning of **Groq (Llama 3)** for search planning and the high-context window of **Google Gemini 2.5 Flash** for deep code synthesis.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-Production-green.svg)
![Tech](https://img.shields.io/badge/stack-Next.js_15_%7C_Tailwind_%7C_MongoDB-black.svg)

---

## 🏗 System Architecture

RepoNavigator is built on a **Dual-Agent Pipeline** designed to overcome the limitations of traditional RAG (Retrieval-Augmented Generation) systems. Instead of simple vector embeddings, we use active reasoning to "navigate" the codebase.

### The Hybrid AI Pipeline
The core logic resides in `src/lib/agents/orchestrator.ts`. Every user query triggers a two-step process:

1.  **The Librarian (Groq / Llama-3-70b)**
    *   **Role**: Planner & Context Selector.
    *   **Function**: Analyzes the directory structure and user query to formulate a "Research Plan". It identifies exactly which files or components are relevant without needing to read the entire codebase.
    *   **Latency**: <300ms.

2.  **The Architect (Google Gemini 2.5 Flash)**
    *   **Role**: Synthesizer & Generator.
    *   **Function**: Receives the Librarian's plan and the raw file context. It uses its massive context window to reason across files and generate a precise, Markdown-formatted answer, including Mermaid.js diagrams if requested.

### Data Ingestion & Caching Layer
Located in `src/app/actions/ingestRepo.ts`.
*   **Structure Extraction**: recurses through the GitHub API to map the file tree.
*   **Atomic Persistence**: Repository metadata and architectural summaries are stored in **MongoDB**.
*   **Smart Caching**: Subsequent requests for the same repository bypass the AI analysis phase, serving the cached architecture summary instantly `(O(1) lookup)`.

---

## 🛠 Tech Stack

### Core Platform
*   **Framework**: [Next.js 15 (App Router)](https://nextjs.org/) - Server Actions for backend logic.
*   **Runtime**: Node.js.
*   **Styling**: Tailwind CSS v4 + Framer Motion (for "smooth" interfaces).

### Database & Persistence
*   **Primary DB**: MongoDB (via Mongoose).
*   **Schemas**:
    *   `Repository`: Stores repo metadata, file tree structure, and the AI-generated architecture summary.
    *   `Message`: Stores chat history for persistent conversations across sessions.

### AI & Agents
*   **Orchestration**: `ai` (Vercel AI SDK).
*   **Providers**:
    *   `@ai-sdk/google`: Interface for Gemini models.
    *   `@ai-sdk/openai`: Interface for Groq (via OpenAI-compatible endpoint).

### Client Features
*   **PDF Generation**: `html-to-image` + `jspdf` for vector-quality export of architecture reports.
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
*   **Floating Chat Interface**: A persistent, expandable chat window that stays with you.
*   **History Persistence**: Chat sessions are saved to MongoDB. You can leave and come back to your conversation.
*   **Smart Context**: The agents are aware of the file structure injected during ingestion.

### 3. Exportable Artifacts
*   **PDF Reports**: One-click export of the AI-generated Architecture Summary.
*   **Modern CSS Support**: Uses browser-native rendering (foreignObject) to correctly capture modern CSS variables and layouts in the PDF.

### 4. Flexible API Authentication & Security
*   **Dual-Mode Authentication**:
    *   **Global Mode (Blue)**: Uses server-configured API keys for seamless onboarding.
    *   **Personal Mode (Green)**: Users can input their own Groq/Gemini keys via the Settings Drawer. This overrides the global keys for their session.
*   **Zero-Persistence**: Personal keys are stored **locally in your browser** (localStorage) and are never saved to the database. They are transmitted securely only for the duration of the request.
*   **Visual Status Bar**: Real-time indicators in the header show exactly which key set is currently active.

### 5. Secure User Authentication
*   **GitHub OAuth**: One-click sign-in using your GitHub account.
*   **Self-Hosted Auth**: Powered by **Better Auth** for complete data ownership. No third-party tracking.
*   **Session Management**: Secure, database-backed sessions stored in MongoDB.

---

## 📦 Installation

### Prerequisites
*   Node.js 18+
*   MongoDB Instance (Local or Atlas)
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
*   **Lazy Loading**: Heavy components like the PDF generator are only loaded/executed on demand.

---

## 🤝 Contributing

I value **Systems Thinking**. When contributing, please focus on:
1.  **Scalability**: Ensure database queries are indexed.
2.  **Modularity**: Keep the "Librarian" and "Architect" roles distinct in the orchestrator.
3.  **Type Safety**: Maintain strict TypeScript definitions for all AI responses.

---

Built with ❤️ by Abhinav.