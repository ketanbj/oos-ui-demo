import './styles.css';
import * as THREE from 'three';
import * as satellite from 'satellite.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const EARTH_RADIUS_UNITS = 1.24;
const EARTH_RADIUS_KM = 6378.137;
const ALTITUDE_VISUAL_SCALE = 2.9;
const TIME_SCALE = 90;

const SCENARIOS = {
  control_update: {
    label: 'Control-plane bad update',
    baseline: { blast: 97, mttrMinutes: 165, continuity: 58, impactFraction: 0.88 },
    orbital: { blast: 31, mttrSeconds: 42, continuity: 95, impactFraction: 0.29 },
    notes: [
      'Baseline propagation rapidly expands from a single control-plane fault.',
      'Orbital OS isolates fault domains and preserves service continuity.',
      'Identical incident profile produces materially different outcomes.'
    ]
  },
  ground_cluster: {
    label: 'Ground station cluster outage',
    baseline: { blast: 74, mttrMinutes: 92, continuity: 67, impactFraction: 0.67 },
    orbital: { blast: 23, mttrSeconds: 36, continuity: 96, impactFraction: 0.22 },
    notes: [
      'Centralized fallback overloads adjacent regions.',
      'Distributed coordination keeps impact localized.',
      'Fast reassignment avoids prolonged service degradation.'
    ]
  },
  demand_surge: {
    label: 'Demand surge + handover stress',
    baseline: { blast: 56, mttrMinutes: 64, continuity: 73, impactFraction: 0.52 },
    orbital: { blast: 18, mttrSeconds: 29, continuity: 97, impactFraction: 0.17 },
    notes: [
      'Reactive handovers create control saturation under burst load.',
      'Predictive scheduling suppresses avoidable handover churn.',
      'Higher continuity translates into stronger enterprise confidence.'
    ]
  }
};

const MODE_META = {
  baseline: {
    lineColor: 0xff6f7f,
    warningColor: 0xffb253,
    failColor: 0xff4f68,
    recoverColor: 0x47d895,
    defaultBody: 0x557fb3,
    defaultPanel: 0x8bb7e7,
    defaultEmissive: 0x2f5d92
  },
  orbital: {
    lineColor: 0x42d7ff,
    warningColor: 0xf8a344,
    failColor: 0xff596f,
    recoverColor: 0x3de09f,
    defaultBody: 0x3b8cc8,
    defaultPanel: 0x35c7b5,
    defaultEmissive: 0x1f6f95
  }
};

const state = {
  scenarioKey: 'control_update'
};

const replayBtn = document.getElementById('replayBtn');
const scenarioLabel = document.getElementById('scenarioLabel');
const scenarioButtons = document.getElementById('scenarioButtons');
const simpleScenarioButtons = document.getElementById('simpleScenarioButtons');
const simpleReplayBtn = document.getElementById('simpleReplayBtn');
const simpleBaselineCanvas = document.getElementById('simpleBaselineCanvas');
const simpleOrbitalCanvas = document.getElementById('simpleOrbitalCanvas');
const simpleBaselineCtx = simpleBaselineCanvas.getContext('2d');
const simpleOrbitalCtx = simpleOrbitalCanvas.getContext('2d');
const simpleBaselineImpactLabel = document.getElementById('simpleBaselineImpactLabel');
const simpleOrbitalImpactLabel = document.getElementById('simpleOrbitalImpactLabel');
const demoTabs = Array.from(document.querySelectorAll('.demo-tab'));
const tabPanels = {
  replay: document.getElementById('panel-replay'),
  starloom: document.getElementById('panel-starloom'),
  krios: document.getElementById('panel-krios'),
  energy: document.getElementById('panel-energy'),
  ai: document.getElementById('panel-ai')
};

const blastBaselineOut = document.getElementById('blastBaselineOut');
const blastOrbitalOut = document.getElementById('blastOrbitalOut');
const mttrBaselineOut = document.getElementById('mttrBaselineOut');
const mttrOrbitalOut = document.getElementById('mttrOrbitalOut');
const continuityBaselineOut = document.getElementById('continuityBaselineOut');
const continuityOrbitalOut = document.getElementById('continuityOrbitalOut');

const fleetSize = document.getElementById('fleetSize');
const incidentsPerYear = document.getElementById('incidentsPerYear');
const enterpriseArr = document.getElementById('enterpriseArr');
const fleetSizeVal = document.getElementById('fleetSizeVal');
const incidentsPerYearVal = document.getElementById('incidentsPerYearVal');
const enterpriseArrVal = document.getElementById('enterpriseArrVal');
const baselineExposureOut = document.getElementById('baselineExposureOut');
const oosExposureOut = document.getElementById('oosExposureOut');
const avoidableExposureOut = document.getElementById('avoidableExposureOut');
const paybackOut = document.getElementById('paybackOut');
const impactChart = document.getElementById('impactChart');
const chartCtx = impactChart.getContext('2d');

const helperNotes = document.getElementById('helperNotes');
const eventClock = document.getElementById('eventClock');
const eventPhaseText = document.getElementById('eventPhaseText');
const timelineFill = document.getElementById('timelineFill');
const stageEls = Array.from(document.querySelectorAll('.stage'));
const baselineImpactBar = document.getElementById('baselineImpactBar');
const orbitalImpactBar = document.getElementById('orbitalImpactBar');
const baselineImpactPct = document.getElementById('baselineImpactPct');
const orbitalImpactPct = document.getElementById('orbitalImpactPct');

const kriosBaselineCanvas = document.getElementById('kriosBaselineCanvas');
const kriosOosCanvas = document.getElementById('kriosOosCanvas');
const kriosBaselineCtx = kriosBaselineCanvas.getContext('2d');
const kriosOosCtx = kriosOosCanvas.getContext('2d');
const kriosZones = document.getElementById('kriosZones');
const kriosDemand = document.getElementById('kriosDemand');
const kriosZonesVal = document.getElementById('kriosZonesVal');
const kriosDemandVal = document.getElementById('kriosDemandVal');
const kriosBaselineAccess = document.getElementById('kriosBaselineAccess');
const kriosOosAccess = document.getElementById('kriosOosAccess');
const kriosBaselineHandovers = document.getElementById('kriosBaselineHandovers');
const kriosOosHandovers = document.getElementById('kriosOosHandovers');
const kriosBaselineInstances = document.getElementById('kriosBaselineInstances');
const kriosOosInstances = document.getElementById('kriosOosInstances');
const kriosArrRisk = document.getElementById('kriosArrRisk');
const kriosSlaPenalty = document.getElementById('kriosSlaPenalty');
const kriosIncidents = document.getElementById('kriosIncidents');
const kriosArrRiskVal = document.getElementById('kriosArrRiskVal');
const kriosSlaPenaltyVal = document.getElementById('kriosSlaPenaltyVal');
const kriosIncidentsVal = document.getElementById('kriosIncidentsVal');
const kriosBaselineExposureOut = document.getElementById('kriosBaselineExposureOut');
const kriosOosExposureOut = document.getElementById('kriosOosExposureOut');
const kriosAvoidedOut = document.getElementById('kriosAvoidedOut');
const kriosPaybackOut = document.getElementById('kriosPaybackOut');
const kriosNotes = document.getElementById('kriosNotes');

const energyBaselineCanvas = document.getElementById('energyBaselineCanvas');
const energyOosCanvas = document.getElementById('energyOosCanvas');
const energyBaselineCtx = energyBaselineCanvas.getContext('2d');
const energyOosCtx = energyOosCanvas.getContext('2d');
const energyLoad = document.getElementById('energyLoad');
const energyEclipse = document.getElementById('energyEclipse');
const energyStorage = document.getElementById('energyStorage');
const energyLoadVal = document.getElementById('energyLoadVal');
const energyEclipseVal = document.getElementById('energyEclipseVal');
const energyStorageVal = document.getElementById('energyStorageVal');
const energyBaselineBrownouts = document.getElementById('energyBaselineBrownouts');
const energyOosBrownouts = document.getElementById('energyOosBrownouts');
const energyBaselineCompletion = document.getElementById('energyBaselineCompletion');
const energyOosCompletion = document.getElementById('energyOosCompletion');
const energyFleetMw = document.getElementById('energyFleetMw');
const energyValueRate = document.getElementById('energyValueRate');
const energyBrownoutPenalty = document.getElementById('energyBrownoutPenalty');
const energyFleetMwVal = document.getElementById('energyFleetMwVal');
const energyValueRateVal = document.getElementById('energyValueRateVal');
const energyBrownoutPenaltyVal = document.getElementById('energyBrownoutPenaltyVal');
const energyBaselineExposureOut = document.getElementById('energyBaselineExposureOut');
const energyOosExposureOut = document.getElementById('energyOosExposureOut');
const energyAvoidedOut = document.getElementById('energyAvoidedOut');
const energyPaybackOut = document.getElementById('energyPaybackOut');
const energyNotes = document.getElementById('energyNotes');

const aiBaselineCanvas = document.getElementById('aiBaselineCanvas');
const aiOosCanvas = document.getElementById('aiOosCanvas');
const aiBaselineCtx = aiBaselineCanvas.getContext('2d');
const aiOosCtx = aiOosCanvas.getContext('2d');
const aiQps = document.getElementById('aiQps');
const aiModelSize = document.getElementById('aiModelSize');
const aiIncidentStress = document.getElementById('aiIncidentStress');
const aiQpsVal = document.getElementById('aiQpsVal');
const aiModelSizeVal = document.getElementById('aiModelSizeVal');
const aiIncidentStressVal = document.getElementById('aiIncidentStressVal');
const aiBaselineLatency = document.getElementById('aiBaselineLatency');
const aiOosLatency = document.getElementById('aiOosLatency');
const aiBaselineDrop = document.getElementById('aiBaselineDrop');
const aiOosDrop = document.getElementById('aiOosDrop');
const aiBaselineUtil = document.getElementById('aiBaselineUtil');
const aiOosUtil = document.getElementById('aiOosUtil');
const aiValuePerK = document.getElementById('aiValuePerK');
const aiPenaltyPerDrop = document.getElementById('aiPenaltyPerDrop');
const aiGpuCost = document.getElementById('aiGpuCost');
const aiValuePerKVal = document.getElementById('aiValuePerKVal');
const aiPenaltyPerDropVal = document.getElementById('aiPenaltyPerDropVal');
const aiGpuCostVal = document.getElementById('aiGpuCostVal');
const aiBaselineExposureOut = document.getElementById('aiBaselineExposureOut');
const aiOosExposureOut = document.getElementById('aiOosExposureOut');
const aiAvoidedOut = document.getElementById('aiAvoidedOut');
const aiPaybackOut = document.getElementById('aiPaybackOut');
const aiProtectedValue = document.getElementById('aiProtectedValue');
const aiNotes = document.getElementById('aiNotes');

let activeTab = 'replay';

const replayProgress = {
  active: false,
  start: 0,
  durationMs: 4300,
  elapsedMs: 0
};

const sharedTextureLoader = new THREE.TextureLoader();
const sharedTextures = {
  earthMap: sharedTextureLoader.load('/textures/earth_atmos_2048.jpg'),
  earthNormal: sharedTextureLoader.load('/textures/earth_normal_2048.jpg'),
  earthRoughness: sharedTextureLoader.load('/textures/earth_specular_2048.jpg'),
  cloudMap: sharedTextureLoader.load('/textures/earth_clouds_1024.png')
};

function latLonToVector3(latDeg, lonDeg, radius) {
  const lat = THREE.MathUtils.degToRad(latDeg);
  const lon = THREE.MathUtils.degToRad(lonDeg);
  const x = radius * Math.cos(lat) * Math.sin(lon);
  const y = radius * Math.sin(lat);
  const z = radius * Math.cos(lat) * Math.cos(lon);
  return new THREE.Vector3(x, y, z);
}

function makeSeededRandom(seed) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

function buildArc(start, end, lift = 0.3) {
  const mid = start.clone().add(end).multiplyScalar(0.5);
  mid.normalize().multiplyScalar(mid.length() + lift);
  const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
  return new THREE.BufferGeometry().setFromPoints(curve.getPoints(22));
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatPayback(programAnnualCost, avoidableAnnual) {
  if (!(avoidableAnnual > 0)) {
    return 'N/A';
  }
  const months = (programAnnualCost / avoidableAnnual) * 12;
  return `${months.toFixed(1)} months`;
}

function formatUsd(value, digits = 2) {
  return `$${Number(value).toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  })}`;
}

function parseTleBlocks(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const blocks = [];
  for (let i = 0; i < lines.length - 2; i += 3) {
    const name = lines[i];
    const line1 = lines[i + 1];
    const line2 = lines[i + 2];
    if (line1.startsWith('1 ') && line2.startsWith('2 ')) {
      blocks.push({ name, line1, line2 });
    }
  }
  return blocks;
}

function parseRaanDeg(line2) {
  return Number(line2.slice(17, 25));
}

function selectEvenlyByRaan(blocks, limit) {
  const withRaan = blocks
    .map((block) => ({ ...block, raan: parseRaanDeg(block.line2) }))
    .filter((block) => Number.isFinite(block.raan))
    .sort((a, b) => a.raan - b.raan);

  if (withRaan.length <= limit) {
    return withRaan;
  }

  const selected = [];
  const step = withRaan.length / limit;
  for (let i = 0; i < limit; i += 1) {
    selected.push(withRaan[Math.floor(i * step)]);
  }
  return selected;
}

async function loadStarlinkShell1(limit = 150) {
  const response = await fetch('/data/starlink-shell1.tle', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to load shell-1 TLEs (${response.status})`);
  }

  const text = await response.text();
  const blocks = parseTleBlocks(text);
  if (!blocks.length) {
    throw new Error('No shell-1 TLE blocks were found');
  }

  return selectEvenlyByRaan(blocks, limit);
}

async function loadGroundStations() {
  const response = await fetch('/data/starlink-ground-stations.json', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to load ground station data (${response.status})`);
  }
  return response.json();
}

class ConstellationView {
  constructor({
    mode,
    sceneHostId,
    phaseLabelId,
    impactedLabelId,
    shellSatellites,
    simulationStartMs,
    groundStations,
    mirroredSites
  }) {
    this.mode = mode;
    this.meta = MODE_META[mode];
    this.host = document.getElementById(sceneHostId);
    this.phaseLabelEl = document.getElementById(phaseLabelId);
    this.impactedLabelEl = document.getElementById(impactedLabelId);

    this.phase = 0;
    this.replayActive = false;
    this.replayStart = 0;
    this.scenarioKey = state.scenarioKey;
    this.simulationStartMs = simulationStartMs;
    this.shellSatellites = shellSatellites;
    this.groundStations = groundStations;
    this.mirroredSites = mirroredSites;

    this.satelliteCount = shellSatellites.length;
    this.satellites = [];
    this.orbitalHubs = [];
    this.impactedSet = new Set();
    this.spreadSet = new Set();
    this.liveImpacted = 0;
    this.frame = 0;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.host.clientWidth, this.host.clientHeight);
    this.host.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0xe8f2fc, 0.05);

    this.camera = new THREE.PerspectiveCamera(42, this.host.clientWidth / this.host.clientHeight, 0.1, 100);
    this.camera.position.set(0, 1.25, 5.5);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enablePan = false;
    this.controls.enableDamping = true;
    this.controls.enableZoom = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 3.2;
    this.controls.maxDistance = 8.2;
    this.controls.maxPolarAngle = Math.PI * 0.82;

    this.setupScene();
    this.setScenario(this.scenarioKey);
    this.setPhase(0);
  }

  setupScene() {
    const hemi = new THREE.HemisphereLight(0xe6f3ff, 0xaec3d7, 1.05);
    this.scene.add(hemi);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.1);
    dirLight.position.set(3.8, 1.8, 3.6);
    this.scene.add(dirLight);

    const fillLight = new THREE.PointLight(0x8ad0ff, 0.75, 16);
    fillLight.position.set(-3, -1.5, -2.8);
    this.scene.add(fillLight);

    this.earthGroup = new THREE.Group();
    this.scene.add(this.earthGroup);

    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(EARTH_RADIUS_UNITS, 72, 72),
      new THREE.MeshStandardMaterial({
        map: sharedTextures.earthMap,
        normalMap: sharedTextures.earthNormal,
        roughnessMap: sharedTextures.earthRoughness,
        roughness: 0.72,
        metalness: 0.03,
        emissive: new THREE.Color(0x28517a),
        emissiveIntensity: 0.24
      })
    );
    this.earthGroup.add(earth);

    this.clouds = new THREE.Mesh(
      new THREE.SphereGeometry(1.265, 64, 64),
      new THREE.MeshStandardMaterial({
        map: sharedTextures.cloudMap,
        transparent: true,
        opacity: 0.34,
        depthWrite: false
      })
    );
    this.earthGroup.add(this.clouds);

    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.32, 64, 64),
      new THREE.MeshBasicMaterial({
        color: 0x89cff7,
        transparent: true,
        opacity: 0.18,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide
      })
    );
    this.earthGroup.add(atmosphere);

    const starsGeometry = new THREE.BufferGeometry();
    const starCount = 1600;
    const starPositions = new Float32Array(starCount * 3);
    const random = makeSeededRandom(this.mode === 'baseline' ? 19 : 23);
    for (let i = 0; i < starCount; i += 1) {
      const r = 9 + random() * 15;
      const theta = random() * Math.PI * 2;
      const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.cos(phi);
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    this.stars = new THREE.Points(
      starsGeometry,
      new THREE.PointsMaterial({ color: 0x83a7c8, size: 0.014, transparent: true, opacity: 0.22 })
    );
    this.scene.add(this.stars);

    this.groundGroup = new THREE.Group();
    this.earthGroup.add(this.groundGroup);
    const groundDCs = this.groundStations;

    groundDCs.forEach((dc) => {
      const antenna = new THREE.Group();
      const normal = latLonToVector3(dc.lat, dc.lon, 1).normalize();

      const mastMaterial = new THREE.MeshStandardMaterial({
        color: 0x4d647b,
        emissive: 0x2c4359,
        emissiveIntensity: 0.26,
        metalness: 0.28,
        roughness: 0.42
      });
      const dishMaterial = new THREE.MeshStandardMaterial({
        color: 0x68cbde,
        emissive: 0x2f879d,
        emissiveIntensity: 0.52,
        metalness: 0.22,
        roughness: 0.3
      });

      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.013, 0.014, 12), mastMaterial);
      base.position.y = 0.008;

      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.05, 10), mastMaterial);
      mast.position.y = 0.038;

      const dish = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.016, 12), dishMaterial);
      dish.position.set(0.0, 0.064, 0.005);
      dish.rotation.z = -Math.PI * 0.35;
      dish.rotation.x = Math.PI;

      const crossBeam = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.002, 0.002), mastMaterial);
      crossBeam.position.y = 0.054;

      antenna.add(base, mast, dish, crossBeam);
      antenna.position.copy(normal.multiplyScalar(EARTH_RADIUS_UNITS + 0.02));
      antenna.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
      this.groundGroup.add(antenna);
    });

    this.mirrorControllers = [];
    if (this.mode === 'baseline') {
      const mirrorGroup = new THREE.Group();
      this.earthGroup.add(mirrorGroup);

      this.mirroredSites.forEach((dc, siteIdx) => {
        const controller = new THREE.Group();

        const core = new THREE.Mesh(
          new THREE.SphereGeometry(0.028, 14, 14),
          new THREE.MeshBasicMaterial({ color: 0xff7d91, transparent: true, opacity: 0.95 })
        );
        const halo = new THREE.Mesh(
          new THREE.TorusGeometry(0.055, 0.0035, 8, 28),
          new THREE.MeshBasicMaterial({ color: 0xff8ea5, transparent: true, opacity: 0.48 })
        );
        halo.rotation.x = Math.PI * 0.5;

        controller.add(core);
        controller.add(halo);

        const position = latLonToVector3(dc.lat, dc.lon, EARTH_RADIUS_UNITS + 0.13 + siteIdx * 0.01);
        controller.position.copy(position);
        controller.lookAt(position.clone().multiplyScalar(2));
        mirrorGroup.add(controller);

        this.mirrorControllers.push({ controller, halo, name: dc.name });
      });
    }

    this.orbitalGroup = new THREE.Group();
    this.scene.add(this.orbitalGroup);
    for (let i = 0; i < 7; i += 1) {
      const hub = new THREE.Group();
      const coreMat = new THREE.MeshStandardMaterial({
        color: 0x56ecff,
        emissive: 0x2baec2,
        emissiveIntensity: 0.8,
        roughness: 0.34,
        metalness: 0.3
      });
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x4ad4f7, transparent: true, opacity: 0.42 });

      const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.052, 0), coreMat);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.004, 8, 26), ringMat);
      ring.rotation.x = Math.PI * 0.5;

      hub.add(core);
      hub.add(ring);

      this.orbitalHubs.push({
        group: hub,
        coreMat,
        ring,
        orbitRadius: 2.3 + (i % 3) * 0.25,
        angle: (Math.PI * 2 * i) / 7,
        inclination: THREE.MathUtils.degToRad(26 + i * 9),
        speed: 0.0038 + i * 0.00015
      });

      this.orbitalGroup.add(hub);
    }

    this.satelliteGroup = new THREE.Group();
    this.scene.add(this.satelliteGroup);
    const randomSat = makeSeededRandom(this.mode === 'baseline' ? 97 : 171);

    for (let i = 0; i < this.satelliteCount; i += 1) {
      const tle = this.shellSatellites[i];
      const bodyMat = new THREE.MeshStandardMaterial({
        color: this.meta.defaultBody,
        emissive: this.meta.defaultEmissive,
        emissiveIntensity: 0.92,
        roughness: 0.3,
        metalness: 0.24
      });
      const panelMat = new THREE.MeshStandardMaterial({
        color: this.meta.defaultPanel,
        emissive: 0x2b6997,
        emissiveIntensity: 0.76,
        roughness: 0.3,
        metalness: 0.3
      });

      const sat = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.024, 0.022), bodyMat);
      const panelL = new THREE.Mesh(new THREE.BoxGeometry(0.056, 0.004, 0.022), panelMat);
      const panelR = panelL.clone();
      panelL.position.x = -0.047;
      panelR.position.x = 0.047;

      const antenna = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0018, 0.0018, 0.025, 8),
        new THREE.MeshStandardMaterial({
          color: 0xe8f5ff,
          emissive: 0x4b80ad,
          emissiveIntensity: 0.7,
          metalness: 0.3,
          roughness: 0.35
        })
      );
      antenna.position.y = 0.017;

      sat.add(body, panelL, panelR, antenna);

      this.satellites.push({
        group: sat,
        bodyMat,
        panelMat,
        satrec: satellite.twoline2satrec(tle.line1, tle.line2),
        spinRate: 0.008 + randomSat() * 0.01
      });

      this.satelliteGroup.add(sat);
    }

    this.linkGroup = new THREE.Group();
    this.scene.add(this.linkGroup);

  }

  setScenario(scenarioKey) {
    this.scenarioKey = scenarioKey;
    const scenario = SCENARIOS[scenarioKey][this.mode];
    const impactedCount = Math.round(this.satelliteCount * scenario.impactFraction);
    const scenarioIndex = Object.keys(SCENARIOS).indexOf(scenarioKey) + 1;

    this.impactedSet.clear();
    this.spreadSet.clear();

    for (let i = 0; i < impactedCount; i += 1) {
      const idx = (i * (this.mode === 'baseline' ? 5 : 7) + scenarioIndex * 13) % this.satelliteCount;
      this.impactedSet.add(idx);
    }

    const spreadFactor = this.mode === 'baseline' ? 0.19 : 0.05;
    const spreadCount = Math.round(this.satelliteCount * spreadFactor);
    for (let i = 0; i < spreadCount; i += 1) {
      const idx = (i * (this.mode === 'baseline' ? 9 : 11) + scenarioIndex * 17) % this.satelliteCount;
      this.spreadSet.add(idx);
    }

    this.rebuildLinks();
  }

  clearLinks() {
    while (this.linkGroup.children.length) {
      const child = this.linkGroup.children.pop();
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        child.material.dispose();
      }
    }
  }

  rebuildLinks() {
    this.clearLinks();

    const activeSet = new Set([...this.impactedSet, ...this.spreadSet]);
    const targetCount = Math.min(this.mode === 'baseline' ? 42 : 24, activeSet.size);
    const indices = Array.from(activeSet).slice(0, targetCount);

    const sourcePoints =
      this.mode === 'baseline'
        ? this.mirrorControllers.map((site) => site.controller.getWorldPosition(new THREE.Vector3()))
        : this.orbitalHubs.map((hub) => hub.group.position.clone());

    if (!sourcePoints.length) {
      return;
    }

    indices.forEach((satIndex, idx) => {
      const satPos = this.satellites[satIndex].group.position.clone();
      const target = sourcePoints[idx % sourcePoints.length];
      const line = new THREE.Line(
        buildArc(satPos, target, this.mode === 'baseline' ? 0.16 : 0.24),
        new THREE.LineBasicMaterial({
          color: this.meta.lineColor,
          transparent: true,
          opacity: 0.58
        })
      );
      this.linkGroup.add(line);
    });
  }

  setPhase(phase) {
    this.phase = phase;

    if (phase === 0) {
      this.phaseLabelEl.textContent = 'Nominal';
    }
    if (phase === 1) {
      this.phaseLabelEl.textContent = 'At Risk';
    }
    if (phase === 2) {
      this.phaseLabelEl.textContent = 'Failure Propagation';
    }
    if (phase === 3) {
      this.phaseLabelEl.textContent = this.mode === 'orbital' ? 'Recovered' : 'Long-tail Outage';
    }

    this.setSatelliteVisualState();
    this.updateImpactedOverlay();
  }

  updateImpactedOverlay() {
    let impacted = this.impactedSet.size;
    if (this.phase >= 2) {
      impacted += this.spreadSet.size;
    }
    if (this.phase === 3 && this.mode === 'orbital') {
      impacted = Math.round(impacted * 0.18);
    }

    this.liveImpacted = Math.min(impacted, this.satelliteCount);
    this.impactedLabelEl.textContent = `${Math.min(impacted, this.satelliteCount)} / ${this.satelliteCount}`;
  }

  setSatelliteVisualState() {
    this.satellites.forEach((satellite, index) => {
      let bodyColor = this.meta.defaultBody;
      let panelColor = this.meta.defaultPanel;
      let emissive = this.meta.defaultEmissive;

      const isImpacted = this.impactedSet.has(index);
      const isSpread = this.spreadSet.has(index);

      if (this.phase === 1 && (isImpacted || isSpread)) {
        bodyColor = this.meta.warningColor;
        panelColor = 0x9f6e35;
        emissive = 0x62411f;
      }

      if (this.phase === 2) {
        if (isImpacted) {
          bodyColor = this.meta.failColor;
          panelColor = 0x6e2935;
          emissive = 0x721f2b;
        } else if (isSpread) {
          bodyColor = this.mode === 'baseline' ? this.meta.failColor : this.meta.warningColor;
          panelColor = this.mode === 'baseline' ? 0x6e2935 : 0x9f6e35;
          emissive = this.mode === 'baseline' ? 0x721f2b : 0x62411f;
        }
      }

      if (this.phase === 3 && this.mode === 'orbital' && (isImpacted || isSpread)) {
        bodyColor = this.meta.recoverColor;
        panelColor = 0x2e7f68;
        emissive = 0x1f6a4a;
      }

      satellite.bodyMat.color.setHex(bodyColor);
      satellite.bodyMat.emissive.setHex(emissive);
      satellite.panelMat.color.setHex(panelColor);
    });
  }

  startReplay(startTime) {
    this.replayActive = true;
    this.replayStart = startTime;
    this.setPhase(1);
  }

  updateReplay(now) {
    if (!this.replayActive) {
      return;
    }

    const elapsed = now - this.replayStart;

    if (elapsed < 1100) {
      this.setPhase(1);
      return;
    }
    if (elapsed < 2400) {
      this.setPhase(2);
      return;
    }
    if (elapsed < 4300) {
      this.setPhase(3);
      return;
    }

    this.replayActive = false;
  }

  updateOrbitalHubs(timeMs) {
    const t = timeMs * 0.001;

    this.orbitalHubs.forEach((hub, idx) => {
      hub.angle += hub.speed;
      const x = hub.orbitRadius * Math.cos(hub.angle);
      const y = hub.orbitRadius * Math.sin(hub.inclination) * Math.sin(hub.angle * 0.9 + idx * 0.2);
      const z = hub.orbitRadius * Math.sin(hub.angle);
      hub.group.position.set(x, y, z);
      hub.group.rotation.y += 0.01;

      const pulse = 0.52 + Math.sin(t * 1.7 + idx) * 0.18;
      hub.coreMat.emissiveIntensity = pulse;
      hub.ring.material.opacity = 0.22 + pulse * 0.25;
    });
  }

  updateMirrorControllers(timeMs) {
    if (this.mode !== 'baseline') {
      return;
    }
    const t = timeMs * 0.001;
    this.mirrorControllers.forEach((site, idx) => {
      site.halo.rotation.z += 0.018;
      site.halo.material.opacity = 0.34 + 0.16 * (0.5 + 0.5 * Math.sin(t * 2.1 + idx));
    });
  }

  updateSatellites(timeMs) {
    const simDate = new Date(this.simulationStartMs + timeMs * TIME_SCALE);
    const gmst = satellite.gstime(simDate);

    this.satellites.forEach((satelliteEntry) => {
      const propagated = satellite.propagate(satelliteEntry.satrec, simDate);
      if (!propagated.position) {
        satelliteEntry.group.visible = false;
        return;
      }

      const geodetic = satellite.eciToGeodetic(propagated.position, gmst);
      const latDeg = satellite.degreesLat(geodetic.latitude);
      const lonDeg = satellite.degreesLong(geodetic.longitude);
      const altitudeKm = Math.max(0, geodetic.height);
      const radius =
        EARTH_RADIUS_UNITS * (1 + ((altitudeKm / EARTH_RADIUS_KM) * ALTITUDE_VISUAL_SCALE));

      const position = latLonToVector3(latDeg, lonDeg, radius);
      satelliteEntry.group.position.copy(position);
      satelliteEntry.group.visible = true;

      // Face away from Earth with a subtle local spin to keep panels visually readable.
      satelliteEntry.group.lookAt(position.clone().multiplyScalar(1.6));
      satelliteEntry.group.rotation.y += satelliteEntry.spinRate;
    });
  }

  resize() {
    const width = this.host.clientWidth;
    const height = this.host.clientHeight;
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  update(timeMs) {
    this.frame += 1;

    this.earthGroup.rotation.y += 0.00145;
    this.clouds.rotation.y += 0.0021;
    this.stars.rotation.y += 0.00007;

    this.updateSatellites(timeMs);
    this.updateOrbitalHubs(timeMs);
    this.updateMirrorControllers(timeMs);
    this.updateReplay(timeMs);

    if (this.frame % 20 === 0) {
      this.rebuildLinks();
      this.updateImpactedOverlay();
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

let baselineView = null;
let orbitalView = null;

function renderHelperNotes() {
  const scenario = SCENARIOS[state.scenarioKey];
  helperNotes.innerHTML = '';
  const modelNotes = [
    'Annual exposure = infra outage cost + SLA exposure + incident response overhead.',
    'Infra outage uses fleet × incidents × value/sat-hour × MTTR × blast radius.',
    'Avoidable exposure = baseline annual exposure − Orbital OS annual exposure.'
  ];
  [...modelNotes, ...scenario.notes].forEach((note) => {
    const li = document.createElement('li');
    li.textContent = note;
    helperNotes.appendChild(li);
  });
}

function updateScenarioMetrics() {
  const scenario = SCENARIOS[state.scenarioKey];
  scenarioLabel.textContent = scenario.label;

  blastBaselineOut.textContent = `${scenario.baseline.blast}%`;
  blastOrbitalOut.textContent = `${scenario.orbital.blast}%`;
  mttrBaselineOut.textContent = `${scenario.baseline.mttrMinutes} min`;
  mttrOrbitalOut.textContent = `${scenario.orbital.mttrSeconds} sec`;
  continuityBaselineOut.textContent = `${scenario.baseline.continuity}%`;
  continuityOrbitalOut.textContent = `${scenario.orbital.continuity}%`;

  renderHelperNotes();
  recalcEconomics();
}

function runReplay() {
  if (!baselineView || !orbitalView) {
    return;
  }
  const start = performance.now();
  replayProgress.active = true;
  replayProgress.start = start;
  replayProgress.elapsedMs = 0;
  baselineView.startReplay(start);
  orbitalView.startReplay(start);
}

function selectScenario(key) {
  state.scenarioKey = key;

  [scenarioButtons, simpleScenarioButtons].forEach((container) => {
    if (!container) {
      return;
    }
    Array.from(container.children).forEach((child) => {
      child.classList.toggle('active', child.dataset.scenario === key);
    });
  });

  if (baselineView && orbitalView) {
    baselineView.setScenario(key);
    orbitalView.setScenario(key);
    baselineView.setPhase(0);
    orbitalView.setPhase(0);
  }

  updateScenarioMetrics();
  runReplay();
}

function buildScenarioButtons() {
  const containers = [
    { el: scenarioButtons, cls: 'scenario-btn' },
    { el: simpleScenarioButtons, cls: 'impact-preset-btn' }
  ];

  containers.forEach(({ el, cls }) => {
    if (!el) {
      return;
    }
    el.innerHTML = '';

    Object.entries(SCENARIOS).forEach(([key, scenario]) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = cls;
      btn.dataset.scenario = key;
      btn.textContent = scenario.label;
      if (key === state.scenarioKey) {
        btn.classList.add('active');
      }
      btn.addEventListener('click', () => selectScenario(key));
      el.appendChild(btn);
    });
  });
}

function drawImpactChart(avoidableAnnual, programAnnual) {
  const ctx = chartCtx;
  const width = impactChart.width;
  const height = impactChart.height;

  ctx.clearRect(0, 0, width, height);

  const left = 32;
  const right = width - 12;
  const top = 12;
  const bottom = height - 22;
  const chartWidth = right - left;
  const chartHeight = bottom - top;

  const months = 12;
  const monthlyBenefit = avoidableAnnual / months;
  const monthlyProgram = programAnnual / months;

  const benefitSeries = [];
  const costSeries = [];
  let benefitAcc = 0;
  let costAcc = 0;

  for (let m = 0; m < months; m += 1) {
    benefitAcc += monthlyBenefit;
    costAcc += monthlyProgram;
    benefitSeries.push(benefitAcc);
    costSeries.push(costAcc);
  }

  const maxY = Math.max(...benefitSeries, ...costSeries, 1);

  ctx.strokeStyle = 'rgba(126, 153, 178, 0.34)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const y = top + (chartHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
  }

  const x = (index) => left + (index / (months - 1)) * chartWidth;
  const y = (value) => top + chartHeight - (value / maxY) * chartHeight;

  const drawSeries = (series, stroke, fill) => {
    ctx.beginPath();
    series.forEach((value, index) => {
      const px = x(index);
      const py = y(value);
      if (index === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    });

    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.lineTo(x(months - 1), bottom);
    ctx.lineTo(x(0), bottom);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  };

  drawSeries(costSeries, 'rgba(255, 116, 129, 0.95)', 'rgba(255, 116, 129, 0.13)');
  drawSeries(benefitSeries, 'rgba(45, 214, 185, 0.95)', 'rgba(45, 214, 185, 0.13)');

  ctx.fillStyle = 'rgba(58, 84, 110, 0.9)';
  ctx.font = '10px Inter';
  ctx.fillText('M1', left - 2, bottom + 14);
  ctx.fillText('M12', right - 16, bottom + 14);
}

function recalcEconomics() {
  const scenario = SCENARIOS[state.scenarioKey];

  const fleet = Number(fleetSize.value);
  const incidents = Number(incidentsPerYear.value);
  const arrAtRisk = Number(enterpriseArr.value) * 1_000_000;

  const baseline = scenario.baseline;
  const orbital = scenario.orbital;

  const valuePerSatHour = 30;

  const baselineInfra = fleet * incidents * valuePerSatHour * (baseline.mttrMinutes / 60) * (baseline.blast / 100);
  const orbitalInfra = fleet * incidents * valuePerSatHour * (orbital.mttrSeconds / 3600) * (orbital.blast / 100);

  const baselineSla = arrAtRisk * incidents * 0.022;
  const orbitalSla = arrAtRisk * incidents * 0.0048;

  const baselineOps = incidents * 410000;
  const orbitalOps = incidents * 125000;

  const baselineExposure = baselineInfra + baselineSla + baselineOps;
  const oosExposure = orbitalInfra + orbitalSla + orbitalOps;
  const avoidable = Math.max(baselineExposure - oosExposure, 0);

  const programAnnual = 15_000_000;

  fleetSizeVal.textContent = `${formatNumber(fleet)} sats`;
  incidentsPerYearVal.textContent = `${incidents}`;
  enterpriseArrVal.textContent = formatCurrency(arrAtRisk);

  baselineExposureOut.textContent = formatCurrency(baselineExposure);
  oosExposureOut.textContent = formatCurrency(oosExposure);
  avoidableExposureOut.textContent = formatCurrency(avoidable);
  paybackOut.textContent = formatPayback(programAnnual, avoidable);

  drawImpactChart(avoidable, programAnnual);
}

[fleetSize, incidentsPerYear, enterpriseArr].forEach((input) => {
  input.addEventListener('input', recalcEconomics);
  input.addEventListener('change', recalcEconomics);
});

[kriosZones, kriosDemand, kriosArrRisk, kriosSlaPenalty, kriosIncidents].forEach((input) => {
  input.addEventListener('input', recalcKriosDemo);
  input.addEventListener('change', recalcKriosDemo);
});

[energyLoad, energyEclipse, energyStorage, energyFleetMw, energyValueRate, energyBrownoutPenalty].forEach((input) => {
  input.addEventListener('input', recalcEnergyDemo);
  input.addEventListener('change', recalcEnergyDemo);
});

[aiQps, aiModelSize, aiIncidentStress, aiValuePerK, aiPenaltyPerDrop, aiGpuCost].forEach((input) => {
  input.addEventListener('input', recalcAiDemo);
  input.addEventListener('change', recalcAiDemo);
});

replayBtn.addEventListener('click', runReplay);
if (simpleReplayBtn) {
  simpleReplayBtn.addEventListener('click', runReplay);
}

window.addEventListener('resize', () => {
  if (baselineView && orbitalView) {
    baselineView.resize();
    orbitalView.resize();
  }
  recalcKriosDemo();
  recalcEnergyDemo();
  recalcAiDemo();
});

function animate(now) {
  requestAnimationFrame(animate);
  if (!baselineView || !orbitalView) {
    return;
  }
  if (activeTab === 'replay') {
    baselineView.update(now);
    orbitalView.update(now);
    updateReplayProgressUi(now);
    updateSimpleImpactView();
  } else if (activeTab === 'krios') {
    const progress = ((now * 0.00009) % 1 + 1) % 1;
    recalcKriosDemo(progress);
  } else if (activeTab === 'energy') {
    const progress = ((now * 0.00008) % 1 + 1) % 1;
    recalcEnergyDemo(progress);
  } else if (activeTab === 'ai') {
    const progress = ((now * 0.0001) % 1 + 1) % 1;
    recalcAiDemo(progress);
  }
}

function replayPhaseInfo(elapsedMs) {
  if (elapsedMs < 1100) {
    return { stage: 0, label: 'Fault injected' };
  }
  if (elapsedMs < 2400) {
    return { stage: 1, label: 'Control plane at risk' };
  }
  if (elapsedMs < 4300) {
    return { stage: 2, label: 'Failure propagation' };
  }
  return { stage: 3, label: 'Outcome divergence / recovery' };
}

function updateReplayProgressUi(now) {
  if (!baselineView || !orbitalView) {
    return;
  }

  if (replayProgress.active) {
    replayProgress.elapsedMs = Math.max(now - replayProgress.start, 0);
  }

  let elapsed = replayProgress.elapsedMs;
  let progress = 0;
  let stage = 0;
  let phaseText = 'Awaiting replay';

  if (replayProgress.active) {
    progress = Math.min(elapsed / replayProgress.durationMs, 1);
    const phase = replayPhaseInfo(elapsed);
    stage = phase.stage;
    phaseText = phase.label;
  } else if (baselineView.phase === 3 || orbitalView.phase === 3) {
    elapsed = replayProgress.durationMs;
    progress = 1;
    stage = 3;
    phaseText = 'Replay complete';
  } else if (baselineView.phase > 0 || orbitalView.phase > 0) {
    progress = 0.5;
    stage = Math.max(baselineView.phase, orbitalView.phase) - 1;
    phaseText = 'Paused';
  }

  eventClock.textContent = `T+${(elapsed / 1000).toFixed(1)}s`;
  eventPhaseText.textContent = phaseText;
  timelineFill.style.width = `${Math.round(progress * 100)}%`;

  stageEls.forEach((el, idx) => {
    el.classList.toggle('complete', idx < stage || (!replayProgress.active && progress >= 1 && idx <= stage));
    el.classList.toggle('active', idx === stage && replayProgress.active);
  });

  const baselinePct = Math.round((baselineView.liveImpacted / baselineView.satelliteCount) * 100);
  const orbitalPct = Math.round((orbitalView.liveImpacted / orbitalView.satelliteCount) * 100);

  baselineImpactBar.style.width = `${baselinePct}%`;
  orbitalImpactBar.style.width = `${orbitalPct}%`;
  baselineImpactPct.textContent = `${baselinePct}%`;
  orbitalImpactPct.textContent = `${orbitalPct}%`;

  if (replayProgress.active && elapsed >= replayProgress.durationMs) {
    replayProgress.active = false;
    replayProgress.elapsedMs = replayProgress.durationMs;
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function setActiveTab(tabKey) {
  activeTab = tabKey;
  Object.entries(tabPanels).forEach(([key, panel]) => {
    panel.classList.toggle('active', key === tabKey);
  });

  demoTabs.forEach((button) => {
    const selected = button.dataset.tab === tabKey;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-selected', selected ? 'true' : 'false');
  });

  if (tabKey === 'replay' && baselineView && orbitalView) {
    baselineView.resize();
    orbitalView.resize();
    updateSimpleImpactView();
  }

  if (tabKey === 'krios') {
    recalcKriosDemo();
  }
  if (tabKey === 'energy') {
    recalcEnergyDemo();
  }
  if (tabKey === 'ai') {
    recalcAiDemo();
  }
}

function initTabs() {
  demoTabs.forEach((button) => {
    button.addEventListener('click', () => {
      setActiveTab(button.dataset.tab);
    });
  });
}

function getSimpleImpactSets(mode) {
  const ringCounts = [32, 24, 16];
  const totalNodes = ringCounts.reduce((sum, value) => sum + value, 0);
  const scenario = SCENARIOS[state.scenarioKey][mode];
  const impactedCount = Math.round(totalNodes * scenario.impactFraction);
  const spreadCount = Math.round(totalNodes * (mode === 'baseline' ? 0.2 : 0.06));

  const impacted = new Set();
  const spread = new Set();
  const scenarioIndex = Object.keys(SCENARIOS).indexOf(state.scenarioKey) + 1;

  for (let i = 0; i < impactedCount; i += 1) {
    impacted.add((i * (mode === 'baseline' ? 5 : 7) + scenarioIndex * 11) % totalNodes);
  }
  for (let i = 0; i < spreadCount; i += 1) {
    spread.add((i * (mode === 'baseline' ? 7 : 9) + scenarioIndex * 17) % totalNodes);
  }

  return { impacted, spread, totalNodes, ringCounts };
}

function drawSimpleImpactCanvas(ctx, { mode, phase }) {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = 'rgba(248, 252, 255, 0.96)';
  ctx.fillRect(0, 0, width, height);

  const { impacted, spread, totalNodes, ringCounts } = getSimpleImpactSets(mode);
  const centerX = width * 0.5;
  const centerY = height * 0.52;
  const baseRadius = Math.min(width, height) * 0.21;
  const gap = 34;

  let nodeIndex = 0;
  const nodes = [];

  ringCounts.forEach((count, ringIdx) => {
    const radius = baseRadius + ringIdx * gap;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(140, 165, 190, 0.34)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    for (let i = 0; i < count; i += 1) {
      const angle = ((Math.PI * 2) / count) * i - Math.PI / 2;
      nodes.push({
        idx: nodeIndex,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius
      });
      nodeIndex += 1;
    }
  });

  let liveImpacted = impacted.size;
  if (phase >= 2) {
    liveImpacted += spread.size;
  }
  if (phase === 3 && mode === 'orbital') {
    liveImpacted = Math.round(liveImpacted * 0.2);
  }
  const impactedPct = Math.round((Math.min(liveImpacted, totalNodes) / totalNodes) * 100);

  nodes.forEach((node) => {
    const isImpacted = impacted.has(node.idx);
    const isSpread = spread.has(node.idx);
    let color = '#9ab1c8';

    if (phase === 1 && (isImpacted || isSpread)) {
      color = '#f4aa50';
    }
    if (phase === 2 && (isImpacted || isSpread)) {
      color = mode === 'baseline' || isImpacted ? '#ff6277' : '#f4aa50';
    }
    if (phase === 3) {
      if (mode === 'orbital' && (isImpacted || isSpread)) {
        color = '#44d88f';
      } else if (mode === 'baseline' && (isImpacted || isSpread)) {
        color = '#ff6277';
      }
    }

    ctx.beginPath();
    ctx.arc(node.x, node.y, 5.8, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 0.7;
    ctx.stroke();
  });

  return impactedPct;
}

function updateSimpleImpactView() {
  if (!baselineView || !orbitalView) {
    return;
  }
  const baselinePct = drawSimpleImpactCanvas(simpleBaselineCtx, {
    mode: 'baseline',
    phase: baselineView.phase
  });
  const orbitalPct = drawSimpleImpactCanvas(simpleOrbitalCtx, {
    mode: 'orbital',
    phase: orbitalView.phase
  });

  simpleBaselineImpactLabel.textContent = `${baselinePct}%`;
  simpleOrbitalImpactLabel.textContent = `${orbitalPct}%`;
}

function drawAvailabilityPanel(ctx, options) {
  const { title, directAccess, variability, color, demandFactor, progress = 1 } = options;
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  const left = 46;
  const right = width - 16;
  const top = 18;
  const bottom = height - 32;
  const chartWidth = right - left;
  const chartHeight = bottom - top;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = 'rgba(247, 251, 255, 0.96)';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(126, 153, 178, 0.34)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i += 1) {
    const y = top + (chartHeight / 5) * i;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
  }

  const samples = [];
  for (let t = 0; t <= 100; t += 1) {
    const seasonal = Math.sin(t * 0.12) * variability;
    const rapid = Math.sin(t * 0.42) * (variability * 0.35);
    const dips = Math.max(0, Math.sin((t - 20) * 0.33)) * (variability * 0.55);
    const val = clamp(directAccess + seasonal + rapid - dips * demandFactor, 25, 100);
    samples.push(val);
  }

  const x = (idx) => left + (idx / (samples.length - 1)) * chartWidth;
  const y = (value) => top + chartHeight - (value / 100) * chartHeight;

  ctx.beginPath();
  samples.forEach((val, idx) => {
    const px = x(idx);
    const py = y(val);
    if (idx === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.6;
  ctx.stroke();

  ctx.lineTo(x(samples.length - 1), bottom);
  ctx.lineTo(x(0), bottom);
  ctx.closePath();
  ctx.fillStyle = color === '#ff7c8d' ? 'rgba(255,124,141,0.14)' : 'rgba(66,215,255,0.13)';
  ctx.fill();

  const targetY = y(95);
  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = 'rgba(108, 138, 166, 0.55)';
  ctx.beginPath();
  ctx.moveTo(left, targetY);
  ctx.lineTo(right, targetY);
  ctx.stroke();
  ctx.setLineDash([]);

  const markerX = x(Math.floor((samples.length - 1) * clamp(progress, 0, 1)));
  ctx.beginPath();
  ctx.moveTo(markerX, top);
  ctx.lineTo(markerX, bottom);
  ctx.strokeStyle = 'rgba(37, 70, 102, 0.5)';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  ctx.fillStyle = 'rgba(58, 84, 110, 0.95)';
  ctx.font = '11px Inter';
  ctx.fillText(title, left, 13);
  ctx.fillText('95% target', right - 58, targetY - 5);
  ctx.fillText('0 min', left, bottom + 15);
  ctx.fillText('100 min', right - 38, bottom + 15);
}

function recalcKriosDemo(progress = 1) {
  const zones = Number(kriosZones.value);
  const demandFactor = Number(kriosDemand.value) / 100;
  const arrRisk = Number(kriosArrRisk.value) * 1_000_000;
  const slaPenaltyPerHour = Number(kriosSlaPenalty.value) * 1_000;
  const annualIncidents = Number(kriosIncidents.value);

  const baselineInstances = Math.round(475 * zones * demandFactor);
  const oosInstances = 1.03 * zones * demandFactor;

  const baselineAccess = clamp(79 - zones * 1.9 - (demandFactor - 1) * 24, 52, 90);
  const oosAccess = clamp(97 - zones * 0.5 - (demandFactor - 1) * 8, 84, 99.5);

  const baselineHandovers = Math.round(240 * zones * demandFactor);
  const oosHandovers = Math.round(22 * zones * demandFactor);

  kriosZonesVal.textContent = `${zones} zones`;
  kriosDemandVal.textContent = `${Math.round(demandFactor * 100)}%`;
  kriosBaselineInstances.textContent = formatNumber(baselineInstances);
  kriosOosInstances.textContent = oosInstances.toFixed(1);
  kriosBaselineAccess.textContent = `${baselineAccess.toFixed(1)}%`;
  kriosOosAccess.textContent = `${oosAccess.toFixed(1)}%`;
  kriosBaselineHandovers.textContent = formatNumber(baselineHandovers);
  kriosOosHandovers.textContent = formatNumber(oosHandovers);

  const baselineOutageHours = clamp(
    2.1 + zones * 0.7 + (demandFactor - 0.8) * 7.5 + (100 - baselineAccess) * 0.28,
    1.2,
    36
  );
  const oosOutageHours = clamp(
    0.65 + zones * 0.2 + (demandFactor - 0.8) * 2.1 + (100 - oosAccess) * 0.11,
    0.25,
    10
  );

  const baselineSlaLoss = annualIncidents * baselineOutageHours * slaPenaltyPerHour;
  const oosSlaLoss = annualIncidents * oosOutageHours * slaPenaltyPerHour * 0.68;

  const baselineRevenueLeak = arrRisk * annualIncidents * ((100 - baselineAccess) / 100) * 0.011;
  const oosRevenueLeak = arrRisk * annualIncidents * ((100 - oosAccess) / 100) * 0.0042;

  const baselineOpsOverhead = annualIncidents * baselineHandovers * 46;
  const oosOpsOverhead = annualIncidents * oosHandovers * 19;

  const baselineExposure = baselineSlaLoss + baselineRevenueLeak + baselineOpsOverhead;
  const oosExposure = oosSlaLoss + oosRevenueLeak + oosOpsOverhead;
  const avoided = Math.max(baselineExposure - oosExposure, 0);

  kriosArrRiskVal.textContent = formatCurrency(arrRisk);
  kriosSlaPenaltyVal.textContent = `${formatCurrency(slaPenaltyPerHour)} / hr`;
  kriosIncidentsVal.textContent = `${annualIncidents}`;
  kriosBaselineExposureOut.textContent = formatCurrency(baselineExposure);
  kriosOosExposureOut.textContent = formatCurrency(oosExposure);
  kriosAvoidedOut.textContent = formatCurrency(avoided);
  kriosPaybackOut.textContent = formatPayback(9_000_000, avoided);

  drawAvailabilityPanel(kriosBaselineCtx, {
    title: 'Baseline direct access',
    directAccess: baselineAccess,
    variability: 14 + zones * 1.2,
    color: '#ff7c8d',
    demandFactor,
    progress
  });
  drawAvailabilityPanel(kriosOosCtx, {
    title: 'Orbital OS direct access',
    directAccess: oosAccess,
    variability: 5 + zones * 0.3,
    color: '#42d7ff',
    demandFactor: demandFactor * 0.45,
    progress
  });

  kriosNotes.innerHTML = `
    <li>Direct access is computed from zone count and demand pressure with continuity clamps.</li>
    <li>Economic exposure combines SLA loss, ARR leakage, and handover-driven operational overhead.</li>
    <li>Avoided annual exposure is baseline minus Orbital OS under identical incident frequency.</li>
  `;
}

function drawEnergyPanel(ctx, options) {
  const { title, load, eclipse, storage, efficient, color, progress = 1 } = options;
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  const left = 42;
  const right = width - 16;
  const top = 20;
  const bottom = height - 30;
  const chartWidth = right - left;
  const chartHeight = bottom - top;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = 'rgba(247, 251, 255, 0.96)';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(126, 153, 178, 0.33)';
  for (let i = 0; i <= 4; i += 1) {
    const y = top + (chartHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
  }

  const satCurves = [];
  for (let s = 0; s < 3; s += 1) {
    const curve = [];
    for (let t = 0; t <= 100; t += 1) {
      const base = 52 + 18 * Math.sin((t + s * 11) * 0.1);
      const eclipseDrop = Math.max(0, Math.sin((t + s * 8) * 0.22)) * eclipse * (efficient ? 0.55 : 0.95);
      const storageLift = storage * (efficient ? 0.22 : 0.08);
      curve.push(clamp(base - eclipseDrop + storageLift + (efficient ? 6 : 0), 0, 100));
    }
    satCurves.push(curve);
  }

  const demandLine = [];
  for (let t = 0; t <= 100; t += 1) {
    const burst = Math.max(0, Math.sin((t - 26) * 0.24)) * (efficient ? 8 : 15);
    demandLine.push(clamp(load + burst, 0, 100));
  }

  const x = (idx) => left + (idx / 100) * chartWidth;
  const y = (value) => top + chartHeight - (value / 100) * chartHeight;

  ['#879dc2', '#6d89b7', '#5873a7'].forEach((curveColor, idx) => {
    ctx.beginPath();
    satCurves[idx].forEach((value, t) => {
      const px = x(t);
      const py = y(value);
      if (t === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    });
    ctx.strokeStyle = curveColor;
    ctx.lineWidth = 1.4;
    ctx.stroke();
  });

  ctx.beginPath();
  demandLine.forEach((value, t) => {
    const px = x(t);
    const py = y(value);
    if (t === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.3;
  ctx.stroke();

  const markerX = x(Math.floor(100 * clamp(progress, 0, 1)));
  ctx.beginPath();
  ctx.moveTo(markerX, top);
  ctx.lineTo(markerX, bottom);
  ctx.strokeStyle = 'rgba(37, 70, 102, 0.5)';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  ctx.fillStyle = 'rgba(58, 84, 110, 0.95)';
  ctx.font = '11px Inter';
  ctx.fillText(title, left, 13);
  ctx.fillText('Harvested energy', left, bottom + 14);
  ctx.fillText('Workload demand', right - 78, top + 12);
}

function recalcEnergyDemo(progress = 1) {
  const load = Number(energyLoad.value);
  const eclipse = Number(energyEclipse.value);
  const storage = Number(energyStorage.value);
  const fleetMw = Number(energyFleetMw.value);
  const valueRate = Number(energyValueRate.value) / 100;
  const brownoutPenalty = Number(energyBrownoutPenalty.value) * 1_000;

  const loadFactor = load / 100;
  const eclipseFactor = eclipse / 100;
  const storageFactor = storage / 100;

  const baselineBrownouts = Math.round(clamp(loadFactor * 18 + eclipseFactor * 24 - storageFactor * 12, 0, 42));
  const oosBrownouts = Math.round(clamp(baselineBrownouts * 0.24, 0, 14));
  const baselineCompletion = clamp(100 - baselineBrownouts * 1.4, 45, 99.5);
  const oosCompletion = clamp(100 - oosBrownouts * 0.7, 80, 99.8);

  energyLoadVal.textContent = `${load}%`;
  energyEclipseVal.textContent = `${eclipse}%`;
  energyStorageVal.textContent = `${storage}%`;
  energyBaselineBrownouts.textContent = `${baselineBrownouts}`;
  energyOosBrownouts.textContent = `${oosBrownouts}`;
  energyBaselineCompletion.textContent = `${baselineCompletion.toFixed(1)}%`;
  energyOosCompletion.textContent = `${oosCompletion.toFixed(1)}%`;

  const annualMwh = fleetMw * 8_760;
  const idealAnnualValue = annualMwh * 1_000 * valueRate;
  const baselineValueDelivered = idealAnnualValue * (baselineCompletion / 100);
  const oosValueDelivered = idealAnnualValue * (oosCompletion / 100);

  const redispatchRatePerMwh = 42;
  const baselineRedispatch = annualMwh * ((100 - baselineCompletion) / 100) * redispatchRatePerMwh;
  const oosRedispatch = annualMwh * ((100 - oosCompletion) / 100) * redispatchRatePerMwh * 0.72;

  const baselineExposure =
    (idealAnnualValue - baselineValueDelivered) + baselineBrownouts * brownoutPenalty + baselineRedispatch;
  const oosExposure =
    (idealAnnualValue - oosValueDelivered) + oosBrownouts * brownoutPenalty * 0.65 + oosRedispatch;
  const avoided = Math.max(baselineExposure - oosExposure, 0);

  energyFleetMwVal.textContent = `${fleetMw} MW`;
  energyValueRateVal.textContent = `${formatUsd(valueRate)} / kWh`;
  energyBrownoutPenaltyVal.textContent = `${formatCurrency(brownoutPenalty)} / event`;
  energyBaselineExposureOut.textContent = formatCurrency(baselineExposure);
  energyOosExposureOut.textContent = formatCurrency(oosExposure);
  energyAvoidedOut.textContent = formatCurrency(avoided);
  energyPaybackOut.textContent = formatPayback(12_000_000, avoided);

  drawEnergyPanel(energyBaselineCtx, {
    title: 'Baseline: reactive placement',
    load,
    eclipse,
    storage,
    efficient: false,
    color: '#ff7c8d',
    progress
  });

  drawEnergyPanel(energyOosCtx, {
    title: 'Orbital OS: energy-aware placement',
    load: load * 0.95,
    eclipse,
    storage,
    efficient: true,
    color: '#42d7ff',
    progress
  });

  energyNotes.innerHTML = `
    <li>Completion rate is derived from workload intensity, eclipse severity, and reserve policy.</li>
    <li>Annual exposure = undelivered energy value + brownout penalties + redispatch overhead.</li>
    <li>Orbital OS protection is measured as baseline exposure minus energy-aware exposure.</li>
  `;
}

function drawAiPanel(ctx, options) {
  const {
    title,
    servedQps,
    droppedPct,
    latencyMs,
    demandQps = servedQps,
    resilience = 0.5,
    color,
    progress = 1
  } = options;
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  const left = 42;
  const right = width - 16;
  const top = 20;
  const bottom = height - 30;
  const chartWidth = right - left;
  const chartHeight = bottom - top;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = 'rgba(247, 251, 255, 0.96)';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(126, 153, 178, 0.33)';
  for (let i = 0; i <= 4; i += 1) {
    const y = top + (chartHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
  }

  const maxQps = Math.max(demandQps * 1.08, servedQps * 1.05, 1);
  const series = [];
  for (let t = 0; t <= 100; t += 1) {
    const spikeWindow = Math.exp(-((t - 34) ** 2) / 170);
    const periodicStress = Math.max(0, Math.sin((t - 24) * 0.2));
    const turbulence =
      (Math.sin(t * 0.23) + Math.sin(t * 0.58) * 0.42) * servedQps * 0.015 * (0.5 + droppedPct / 28);

    const majorDrop = servedQps * (droppedPct / 100) * (0.95 + latencyMs / 1200) * spikeWindow * (1.2 - resilience);
    const periodicDrop = servedQps * (droppedPct / 100) * 0.26 * periodicStress * (1.1 - resilience);
    series.push(clamp(servedQps - majorDrop - periodicDrop + turbulence, 0, maxQps));
  }

  const x = (idx) => left + (idx / 100) * chartWidth;
  const y = (value) => top + chartHeight - (value / maxQps) * chartHeight;

  ctx.beginPath();
  series.forEach((value, idx) => {
    const px = x(idx);
    const py = y(value);
    if (idx === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.4;
  ctx.stroke();

  ctx.lineTo(x(100), bottom);
  ctx.lineTo(x(0), bottom);
  ctx.closePath();
  ctx.fillStyle = color === '#ff7c8d' ? 'rgba(255,124,141,0.14)' : 'rgba(66,215,255,0.13)';
  ctx.fill();

  const markerX = x(Math.floor(100 * clamp(progress, 0, 1)));
  ctx.beginPath();
  ctx.moveTo(markerX, top);
  ctx.lineTo(markerX, bottom);
  ctx.strokeStyle = 'rgba(37, 70, 102, 0.5)';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  ctx.fillStyle = 'rgba(58, 84, 110, 0.95)';
  ctx.font = '11px Inter';
  ctx.fillText(title, left, 13);
  ctx.fillText(`p95 ${latencyMs} ms`, right - 68, 13);
  ctx.fillText('Effective served QPS', left, bottom + 14);
  ctx.fillText('Incident window', right - 84, bottom + 14);
}

function recalcAiDemo(progress = 1) {
  const qps = Number(aiQps.value);
  const modelSizeGb = Number(aiModelSize.value);
  const incidentStress = Number(aiIncidentStress.value);
  const valuePerK = Number(aiValuePerK.value);
  const penaltyPerDrop = Number(aiPenaltyPerDrop.value) / 100;
  const gpuCostPerHour = Number(aiGpuCost.value);

  const baselineLatency = Math.round(110 + qps * 0.011 + modelSizeGb * 5 + incidentStress * 22);
  const oosLatency = Math.round(60 + qps * 0.006 + modelSizeGb * 2.8 + incidentStress * 8);

  const baselineDropPct = clamp(2 + incidentStress * 2.6 + modelSizeGb * 0.5 + qps / 3500, 3, 38);
  const oosDropPct = clamp(baselineDropPct * 0.26, 0.6, 12);

  const baselineUtilPct = clamp(60 + qps / 420 - incidentStress * 2.8 - modelSizeGb * 0.7, 32, 82);
  const oosUtilPct = clamp(baselineUtilPct + 16 - incidentStress * 0.7, 58, 95);

  const annualRequests = qps * 31_536_000;
  const baselineDropped = annualRequests * (baselineDropPct / 100);
  const oosDropped = annualRequests * (oosDropPct / 100);

  const baselineThroughputLoss = (baselineDropped / 1_000) * valuePerK;
  const oosThroughputLoss = (oosDropped / 1_000) * valuePerK;
  const baselineSlaLoss = baselineDropped * penaltyPerDrop;
  const oosSlaLoss = oosDropped * penaltyPerDrop * 0.62;

  const effectiveGpuFleet = clamp((qps * modelSizeGb) / 1_100, 60, 1_800);
  const annualGpuHours = effectiveGpuFleet * 8_760;
  const baselineIdleCost = annualGpuHours * gpuCostPerHour * ((100 - baselineUtilPct) / 100) * 0.45;
  const oosIdleCost = annualGpuHours * gpuCostPerHour * ((100 - oosUtilPct) / 100) * 0.3;

  const baselineExposure = baselineThroughputLoss + baselineSlaLoss + baselineIdleCost;
  const oosExposure = oosThroughputLoss + oosSlaLoss + oosIdleCost;
  const protectedAnnualValue = Math.max(baselineExposure - oosExposure, 0);

  aiQpsVal.textContent = `${formatNumber(qps)} qps`;
  aiModelSizeVal.textContent = `${modelSizeGb} GB`;
  aiIncidentStressVal.textContent = `${incidentStress}`;
  aiValuePerKVal.textContent = `${formatUsd(valuePerK)} / 1k`;
  aiPenaltyPerDropVal.textContent = `${formatUsd(penaltyPerDrop)} / drop`;
  aiGpuCostVal.textContent = `${formatUsd(gpuCostPerHour)} / hr`;
  aiBaselineLatency.textContent = `${baselineLatency} ms`;
  aiOosLatency.textContent = `${oosLatency} ms`;
  aiBaselineDrop.textContent = `${baselineDropPct.toFixed(1)}%`;
  aiOosDrop.textContent = `${oosDropPct.toFixed(1)}%`;
  aiBaselineUtil.textContent = `${baselineUtilPct.toFixed(1)}%`;
  aiOosUtil.textContent = `${oosUtilPct.toFixed(1)}%`;
  aiProtectedValue.textContent = formatCurrency(protectedAnnualValue);
  aiBaselineExposureOut.textContent = formatCurrency(baselineExposure);
  aiOosExposureOut.textContent = formatCurrency(oosExposure);
  aiAvoidedOut.textContent = formatCurrency(protectedAnnualValue);
  aiPaybackOut.textContent = formatPayback(20_000_000, protectedAnnualValue);

  drawAiPanel(aiBaselineCtx, {
    title: 'Baseline AI throughput',
    servedQps: qps * (1 - baselineDropPct / 100),
    droppedPct: baselineDropPct,
    latencyMs: baselineLatency,
    demandQps: qps,
    resilience: 0.22,
    color: '#ff7c8d',
    progress
  });

  drawAiPanel(aiOosCtx, {
    title: 'Orbital OS AI throughput',
    servedQps: qps * (1 - oosDropPct / 100),
    droppedPct: oosDropPct,
    latencyMs: oosLatency,
    demandQps: qps,
    resilience: 0.82,
    color: '#42d7ff',
    progress
  });

  aiNotes.innerHTML = `
    <li>Latency, drop rate, and utilization are modeled from QPS, model size, and incident stress.</li>
    <li>Annual AI exposure = throughput loss + SLA penalties on dropped requests + idle GPU cost.</li>
    <li>Protected AI value is the baseline exposure minus the Orbital OS exposure.</li>
  `;
}

async function init() {
  const [shellSatellites, groundStationData] = await Promise.all([
    loadStarlinkShell1(150),
    loadGroundStations()
  ]);
  const simulationStartMs = Date.now();
  const groundStations = Array.isArray(groundStationData.stations) ? groundStationData.stations : [];
  const mirroredSites = Array.isArray(groundStationData.mirrored_sites) ? groundStationData.mirrored_sites : [];

  baselineView = new ConstellationView({
    mode: 'baseline',
    sceneHostId: 'baselineSceneHost',
    phaseLabelId: 'baselinePhaseLabel',
    impactedLabelId: 'baselineImpactedCount',
    shellSatellites,
    simulationStartMs,
    groundStations,
    mirroredSites
  });

  orbitalView = new ConstellationView({
    mode: 'orbital',
    sceneHostId: 'orbitalSceneHost',
    phaseLabelId: 'orbitalPhaseLabel',
    impactedLabelId: 'orbitalImpactedCount',
    shellSatellites,
    simulationStartMs,
    groundStations,
    mirroredSites
  });

  initTabs();
  buildScenarioButtons();
  updateScenarioMetrics();
  recalcKriosDemo();
  recalcEnergyDemo();
  recalcAiDemo();
  setActiveTab('replay');
  runReplay();
  animate(0);
}

init().catch((error) => {
  console.error(error);
  eventPhaseText.textContent = 'Failed to load Starlink shell-1 TLEs';
});
