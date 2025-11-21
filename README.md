# Orbital OS LEO Constellation Demo

React + TypeScript single-page demo that simulates a 100+ satellite LEO constellation, orbit/energy dynamics, and a mobility-aware cloud scheduler. Everything runs locally with deterministic state (seeded RNG, no external APIs).

## Highlights
- 3D orbit view with ISL rings, ground-station handovers, energy/workload overlays, and hoverable satellite telemetry (battery, sunlight, zone, GS, ISLs, workloads).
- Mobility-aware scheduler for five workload types; live policy editor (min battery, replicas, Krios latency anchors, energy preference) and decision bars for latency/energy/resilience/mobility.
- Modes: Krios prewarm (1 active + 1 warm per zone with predicted handovers), StarLoom federation (cohort control-plane liveness), and Energy budget (shed/shift workloads during eclipse).
- Energy awareness: sunlit vs eclipse counts, battery sparklines, and scheduler actions that migrate AI to sunlit craft and pause batch jobs when power is scarce.
- Outage simulation: Starlink-style ISL plane cut + GS drops with side-by-side views (no OS vs Orbital OS blast radius, workload failures, control-plane liveness).
- Operator mode: paste TLEs, set zones, deploy an image to the healthiest sats, run fault drills (plane/GS/battery), nudge shell altitude and ground stations, and view config hashes.

## Run locally
1. Install Node.js 20+ and install deps: `npm install`.
2. Start the dev server: `npm run dev` then open `http://localhost:5173`.
3. Production build: `npm run build`; preview the build: `npm run preview`.
4. Lint (optional): `npm run lint`.

## Demo flow (quick script)
- Overview: keep 1x speed, toggle ISLs/energy/workloads, hover satellites to show battery/GS/zone; note deterministic engine and automatic GS handovers.
- Cloud layer: adjust policies in the editor, enable Krios mode to show active+warm per zone and predictive handover timeline; watch placement cards and scheduler bars shift.
- Energy: bump to 10x, watch sunlit/eclipse counts and sparklines; describe migrations and batch pausing under Energy budget.
- Outage: return to 1x, compare “Without Orbital OS” vs “With Orbital OS” panels for blast radius, workload failures, and liveness under a plane cut + GS drops.
- Operator: paste a TLE, set custom zones, deploy an image, run fault drills, and use floating controls (pause/+1s/speed) to stage the narrative. Full beats live in `demo-script.md`.

## Controls & tips
- Speed toggles in the top bar and floating widget (1x/10x/100x); pause/+1s for deterministic steps.
- Layer filters: shells, zones, ISL links, energy heatmap, workload overlay, and availability heatmap.
- Mode chips: Krios prewarm, StarLoom federation, Energy budget. Handover timeline and path explainer appear with Krios enabled.
- Use the operator panel to change shell altitude or ground-station longitude to demo mobility-aware re-placement.

## Tech stack
- React 19 + TypeScript + Vite + Tailwind CSS.
- Zustand-powered simulation state, seeded RNG, and fixed-step scheduler in `src/simulation`.
- Three.js + @react-three/fiber/@react-three/drei for the orbital scene.
