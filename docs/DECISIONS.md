# Type Racer — Decision Log

This log documents the "why" behind key architectural and implementation choices for Type Racer.

## 1. Core Architecture

### 1.1 UI Logic: DOM-based rendering
*   **Decision:** Manual DOM manipulation rather than a framework (React/Vue).
*   **Rationale:** Typing speed testing requires extremely low latency. Bypassing virtual DOM diffing ensures the UI updates instantly on every keystroke.
*   **Tradeoff:** Harder to scale to complex UI features; requires imperative state management.

### 1.2 State Management
*   **Decision:** Class-based engine (`Engine` class).
*   **Rationale:** Keeps logic (timing, error counting, word pointer) encapsulated away from DOM events.
