# Orbital OS demo run
A narrated, deterministic flow for VC pitches and operator pilots.

## 0:00 - Open and frame
- Show the Overview dashboard. Mention: "100 LEO sats across 3 shells, dark cosmic console, runs entirely local." 
- Point at control plane liveness chip (Live) and speed toggles (1x/10x/100x). Keep speed at 1x initially.

## 0:30 - Constellation tour
- Hover satellites: call out battery %, sunlight, assigned GS, ISL count, workloads, and zone.
- Toggle layers: ISL links, energy heatmap, workloads. Note automatic GS handover as nodes move.
- Mention deterministic engine: seeded RNG, fixed-step scheduler, no external APIs.

## 1:30 - Cloud layer & scheduler
- Scroll to Cloud Layer. Highlight workload catalog (AI gateway, imagery pipeline, comm relay, batch, custom app).
- Point out placement chips (replicas + zones). Explain policy controls: min battery, replicas, Krios latency anchors (city + max ms), energy preference.
- Toggle Krios mode to show active+warm per zone; highlight predictive handover timeline.
- Drag policy editor (e.g., set AI gateway min battery to 50%, replicas to 4) and note placements update live.
- Narrate scheduler bars: latency, energy, resilience, mobility. Explain mobility-aware pre-warm ahead of handovers.

## 2:30 - Energy awareness
- Jump to Energy Awareness. Note sunlit vs eclipse counts and average battery.
- Mention automatic actions: migrate AI to sunlit, pause batch, keep essential services on diverse shells.
- Call out sparklines (battery, workload moves, completions). Speed up to 10x to see eclipse cycles.

## 3:20 - Outage wow moment
- Set speed back to 1x. In Outage Simulation, describe fault: ISL plane cut + 2 GS drops.
- Left panel (no OS): blast radius >30%, control plane Partitioned, workloads fail, no reschedule.
- Right panel (Orbital OS with StarLoom federation): blast radius <1/3, control plane Live, auto-migration keeps workloads online; ISLs reroute around survivors.
- Emphasize: resilient federated control plane + constrained blast radius.

## 4:10 - Operator mode (hidden)
- Scroll to Operator Mode. Paste a TLE, set zones, deploy an image to sats, then pause/step via floating controls.
- Inject plane outage and battery drain; resume to show recovery. Plane cut shows a red arc/ISL sever, but with StarLoom on cohorts fence blast radius and stay Live; deployment targets remain visible.
- Adjust shell altitude slider ±20km; move GS east/west to demonstrate mobility-aware re-placement.
- Show config hashes per sat for drift detection.

## 5:00 - Close
- Mention offline-ready SPA (React + TS + Tailwind + Three.js). No external APIs.
- Optional: run at 100x to show smooth animation and stability.
