# CapyPlan

**CapyPlan** is a collaborative estimation tool designed to help engineering teams estimate work with clarity and confidence.

Unlike traditional Estimation Poker which focuses on single numbers, CapyPlan emphasizes **Uncertainty Analysis**.

## ✨ Key Features

-   **PERT Estimation**: Users provide three values: *Optimistic, Most Likely, and Pessimistic*.
-   **Risk Analysis**:
    -   **Individual Risk**: Automatically flags estimates as **Low**, **Medium**, or **High Risk** based on the spread of an individual's confidence.
    -   **Team Disagreement**: Calculates the standard deviation of the team's responses to highlight when the team has conflicting understandings of a task.
-   **Real-Time Collaboration**: Instant updates for all participants using WebSockets.
-   **Configurable Decks**: Supports standard Fibonacci, T-Shirt sizes, or custom numeric decks.

## 🛠️ Tech Stack

-   **Frontend**: React, Vite, Vanilla CSS.
-   **Backend**: Node.js, `ws` (Raw WebSockets).
-   **Protocol**: Shared TypeScript Zod schemas (Monorepo).
-   **Package Manager**: pnpm workspaces.

## 🚀 How to Run

1.  **Install dependencies**:
    ```bash
    pnpm install
    ```

2.  **Start Development Servers**:
    ```bash
    pnpm dev
    ```
    This will start both the WebSocket signal server (port 3001) and the Web Client (port 5173).

3.  **Open in Browser**:
    Visit `http://localhost:5173` to join a room!

## 📂 Project Structure

-   `apps/web`: The React client.
-   `apps/signal`: The Node.js WebSocket server.
-   `packages/protocol`: Shared types and validation logic.
