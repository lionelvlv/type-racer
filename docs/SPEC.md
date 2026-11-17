# Type Racer — Technical Specification & Architecture

## Overview
A high-performance typing speed testing application built with clean, reactive vanilla JavaScript to measure words-per-minute (WPM) and accuracy.

## Architecture
- **Rendering:** DOM-based text rendering with class-based state updates (correct/incorrect highlighting).
- **Core Engine:** Event-based text input listener measuring timing metrics (input latency, typing speed).
- **Styling:** CSS-driven dynamic feedback for current word/character status.

## Directory Structure
- `index.html` — Main layout and typing area.
- `js/` — Typing engine, timing statistics, text generation, and state management.
- `style.css` — Visual feedback states and layout.
- `docs/` — Technical specs.
- `tests/` — Performance testing for typing logic.
