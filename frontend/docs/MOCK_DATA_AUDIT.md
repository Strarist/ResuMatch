# Strategic Command Center — Mock Data & Simulation Audit

This document outlines the global audit, categorization, and shutdown configurations applied to all synthetic behaviors, baseline templates, and placeholder telemetry during the ResuMatch Real Data Integration phase (Phase 11.4).

---

## 📊 1. Global Metrics & Heuristics Classification

We inspected all active telemetry feeds, strategic metrics generators, and fallback mock profiles across both the frontend and backend architectures:

| Source Component / File Path | Initial State (Simulation Mode) | Targeted Resolution (Realism Mode) | Classification | Action Taken |
| :--- | :--- | :--- | :--- | :--- |
| `frontend/src/data/baseline-profiles.ts` | Complete static presets for 5 target career paths (`full-stack`, `cloud-infra`, etc.). | Used to calibrate initial expectations during offline local states. | **CATEGORY A** (Graceful Fallback) | **RETAINED** as static presets for offline/empty states. |
| `frontend/src/context/LivingSystemContext.tsx` | Defaults `simulationActive = true` at system boot. | Swapped to prioritize actual REST requests. | **CATEGORY B** (Artificial Masking) | **MUTATED** `simulationActive` default state to `false`. |
| `frontend/src/components/shell/AppShell.tsx` | Renders Active Persona & Lifecycle state selection panels. | Removed control selectors from default view. | **CATEGORY C** (Development Mock) | **HIDDEN** behind the `devMode` query parameters (`?dev=true`) block. |
| `frontend/src/app/(app)/dashboard/page.tsx` | Consumed metrics history and roadmap milestones from simulated sandbox. | Performs parallel requests to `/v1/strategic/focus` and `/v1/roadmap-intel/state`. | **CATEGORY B** (Artificial Masking) | **RESOLVED** variables to real calculated properties. |
| `backend/app/services/opportunities/engine.py` | Seeded generic "recommended for you" cards with hardcoded texts. | Deterministic scoring leveraging weighted skill overlaps, demand, and projects. | **CATEGORY B** (Artificial Masking) | **REFRACTORED** to run strict compatibility algorithms. |
| `backend/app/services/copilot/context_memory.py` | Session context sometimes drifted into general conversational templates. | Strict loading from user database `StrategicProfile` records. | **CATEGORY B** (Artificial Masking) | **WIRRED** directly to SQLite persistent profiles. |

---

## 🛠️ 2. Sandbox Simulation Controls Shutdown

The frontend command system has been hardened to restrict simulator controls exclusively to developer debug panels:

* **Strategic Indicators**: The active template persona selector and artificial lifecycle controls in `AppShell` are hidden by default from the layout.
* **Diagnostics Access**: These controls are only hydrated and rendered when `Developer Diagnostics` mode is enabled (triggered by running the app with `?dev=true` or checking the Developer Diagnostics toggle in the footer).
* **Graceful Local Fallback**: If connection to the FastAPI server is severed, the system gracefully falls back to local local-storage states, utilizing the `baselinePersonas` templates to maintain complete offline resilience.
