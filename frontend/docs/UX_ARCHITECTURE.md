# ResuMatch Frontend UX Architecture Guidelines

This document outlines the core user experience design system, page structures, and boundaries to protect against technical leakage and navigation bloat.

---

## 🏗️ The 3-Layer Navigation Model

To prevent cognitive overload, ResuMatch separates frontend views into three distinct operational layers:

### Layer 1: Primary User Experience (Outcome-Centered)
These are the real user-facing product pillars visible on the main sidebar under default settings:
* **Dashboard**: Mission Control aggregating all signals and strategic priorities.
* **Roadmap**: Actions to bridge skills gaps.
* **Opportunities**: Matching job positions and signals.
* **Market Intelligence**: Salary paths and skill trends.
* **AI Workspace**: Career strategy conversational partner.
* **Profile**: Credibility and signals portfolio.
* **Resumes**: Repository management and file uploads.

### Layer 2: Advanced Intelligence (Expandable)
Support frameworks that analyze details or provide background metrics. Grouped under a collapsible **Advanced Insights** section:
* **Predictions**: Trajectory forecast calculations.
* **Explainability**: Strategic algorithms.
* **Strategic Insights**: AI-generated career narratives.

### Layer 3: Developer / Diagnostics (Hidden Toggle)
Internal engineering controls that display runtime telemetry, transport variables, and troubleshooting states. Visible **only** when Developer Mode is active (via `?dev=true` URL query parameter or the sidebar toggle):
* **Observability**: Live metrics traces.
* **Resilience**: Simulating outages and recovery loops.
* **Convergence**: Code simplification loops.

---

## 🔒 Domain Encapsulation Rules

### Rule 1: No Engineering Leakage in Primary Navigation
Internal architectural folders, microservices, or databases must not be mapped directly to user journeys. If a service only tracks network retry cycles or compaction ratios, it belongs in **Developer Mode** or as a collapsed contextual diagnostic inline widget.

### Rule 2: Outcome-Driven Pages
Every user page must clearly answer:
1. *What goal does this help the user accomplish?*
2. *What decisions does this improve?*
3. *What action does this unlock?*

### Rule 3: Aggregation Over Fragmentation
Avoid thin pages that visualize single database records. Consolidate info into high-density dashboard layouts rather than forcing the user to browse many separate screens.

### Rule 4: Decouple Frontend Views from Backend Modularity
Backend systems may be split into separate micro-routers and database architectures. The frontend MUST abstract this complexity into unified, coherent workflows.
