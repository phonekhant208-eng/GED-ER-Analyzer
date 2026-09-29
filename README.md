# Official GED RLA Extended Response Simulator & AI Grader

## Project Overview
An authentic, exam-accurate simulator for the GED Reasoning Through Language Arts (RLA) Extended Response essay section. Built with UI parity matching the official GED testing environment, it provides students with a realistic exam environment paired with an automated double-weighted rubric evaluation engine.

### Key Features
- **GED-Accurate Split Workspace:** Dual-passage tabbed viewing (Passage A/B) and a practice essay editor with standard test toolbar actions (cut, copy, paste).
- **Exam Environment Controls:** 45-minute practice timer with real-time countdown, overtime tracking, and refresh/exit warning guards (`beforeunload`).
- **Flexible Test Modes:** Practice with custom user-provided passages or pre-loaded database prompts pulled dynamically via Supabase.
- **Automated Rubric Evaluation:** Standardized 3-trait, 12-point double-weighted scoring engine delivering structured JSON feedback and actionable improvement points.

## Technologies Used
- **Frontend:** HTML5, CSS3, JavaScript (Vanilla ES6)
- **Backend & Database:** Supabase (Database & Data Fetching), Vercel Serverless Functions
- **AI Evaluation Engine:** `openai/gpt-oss-120b` (via OpenAI-compatible serverless endpoint)
- **Version Control:** Git & GitHub

## AI Usage Disclosure
In accordance with First Commit Rule 5, AI tools were used during development as learning and debugging assistants for:
- Architecture planning and serverless API error hardening.
- Refining JSON schema structures and mathematical weighted score calculations.
- Brainstorming edge-case handling for passage validation and timer UI logic.
All core application architecture, UI layout, Supabase schema configuration, and code integration were implemented and understood by the developer.

## External Resources & Credits
- **Database Hosting:** [Supabase](https://supabase.com)
- **Serverless Hosting:** [Vercel](https://vercel.com)
- **AI Model:** `openai/gpt-oss-120b`
- **Rubric Standard:** Based on the official GED Testing Service 3-trait, 12-point Extended Response Scoring Guide.

## Local Setup Instructions
1. Clone the repository:
   ```bash
   git clone https://github.com/phonekhan1208-eng/GED-ER-Analyzer.git
