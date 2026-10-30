import {
  TrafficCategory,
  RiskLevel,
  AlertStatus,
  NetworkFlowRecord,
  SecurityAlert,
  NetworkNode,
  SensorProbe,
  AIMessage,
} from './types.ts';
import {
  INITIAL_METRICS,
  INITIAL_ALERTS,
  INITIAL_FLOWS,
  INITIAL_NODES,
  INITIAL_EDGES,
  INITIAL_SENSORS,
  INITIAL_HISTORY,
} from './data/initialData.ts';
import { MLTrafficClassifier } from './services/mlClassifier.ts';
import { GeminiSOCService } from './services/geminiService.ts';
import { CyberAudioService } from './services/audioService.ts';
import { ThreeHeroGlobe } from './components/ThreeHeroGlobe.ts';
import { ThreeTopologyScene } from './components/ThreeTopology.ts';
import { SensorMapVisualizer } from './components/SensorMap.ts';

// Professional Cybersecurity SVG Icon Library
function icon(name: string, cls = 'w-4 h-4'): string {
  const icons: Record<string, string> = {
    home: `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    shield: `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    dashboard: `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>`,
    layout: `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>`,
    network: `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><line x1="12" y1="12" x2="12" y2="8"/></svg>`,
    globe: `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
    terminal: `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>`,
    radio: `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/></svg>`,
    simulation: `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    crosshair: `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/></svg>`,
    alert: `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    bell: `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
    barchart: `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
    filetext: `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
    history: `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>`,
    settings: `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
    info: `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
    sun: `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
    moon: `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
    play: `<svg class="${cls}" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
    pause: `<svg class="${cls}" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`,
    stop: `<svg class="${cls}" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16"/></svg>`,
    rotate: `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>`,
    download: `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
    search: `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
    check: `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    x: `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    send: `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
    bot: `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8.01" y2="16"/><line x1="16" y1="16" x2="16.01" y2="16"/></svg>`,
    volume: `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`,
    mute: `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`,
  };
  return icons[name] || icons.shield;
}

// Brand Logo SVG: Multi-faceted Cyber Shield + Central Neural Aperture & Signal Emitter
function getBrandLogoSVG(): string {
  return `
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 2L4 6.8V15.2C4 22.8 9.1 29.2 16 31C22.9 29.2 28 22.8 28 15.2V6.8L16 2Z" fill="url(#shieldBgGrad)" stroke="#22D3EE" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M16 5.5L7 9.2V15C7 21 10.8 26.2 16 27.8C21.2 26.2 25 21 25 15V9.2L16 5.5Z" fill="#070E1A" stroke="#3B82F6" stroke-width="1.2" stroke-dasharray="2 2"/>
      <!-- Concentric Neural Pulse Rings -->
      <circle cx="16" cy="15.5" r="5" stroke="#22D3EE" stroke-width="1.2" stroke-opacity="0.8"/>
      <circle cx="16" cy="15.5" r="2.2" fill="#38BDF8"/>
      <!-- Cyber Interceptor Crosshairs -->
      <line x1="16" y1="8" x2="16" y2="11.5" stroke="#22D3EE" stroke-width="1.2" stroke-linecap="round"/>
      <line x1="16" y1="19.5" x2="16" y2="23" stroke="#22D3EE" stroke-width="1.2" stroke-linecap="round"/>
      <line x1="8.5" y1="15.5" x2="12" y2="15.5" stroke="#22D3EE" stroke-width="1.2" stroke-linecap="round"/>
      <line x1="20" y1="15.5" x2="23.5" y2="15.5" stroke="#22D3EE" stroke-width="1.2" stroke-linecap="round"/>
      <defs>
        <linearGradient id="shieldBgGrad" x1="16" y1="2" x2="16" y2="31" gradientUnits="userSpaceOnUse">
          <stop stop-color="#0E2D52"/>
          <stop offset="0.6" stop-color="#091A33"/>
          <stop offset="1" stop-color="#050C17"/>
        </linearGradient>
      </defs>
    </svg>
  `;
}

class NetShieldApp {
  // Navigation State
  private activeTab = 'home';
  private dashboardSubView = 'overview'; // 'overview' | 'topology' | 'sensormap' | 'threats' | 'alerts' | 'reports'
  private theme: 'dark' | 'light' = 'dark';
  private soundEnabled = true;
  private appStartTime = Date.now() - 412334000; // Simulated 04d 18h continuous uptime offset

  // Application Data State
  private alerts: SecurityAlert[] = [...INITIAL_ALERTS];
  private flows: NetworkFlowRecord[] = [...INITIAL_FLOWS];
  private nodes: NetworkNode[] = [...INITIAL_NODES];
  private edges = [...INITIAL_EDGES];
  private sensors: SensorProbe[] = [...INITIAL_SENSORS];
  private history = [...INITIAL_HISTORY];
  private metrics = { ...INITIAL_METRICS };

  // Live Monitor Stream State
  private isLiveStreaming = true;
  private streamIntervalId: number | null = null;
  private streamSpeed = 1;
  private livePacketsReceived = 142850;

  // Demo Simulation Lab State
  private isSimulationRunning = false;
  private simIntervalId: number | null = null;
  private simSpeed = 1;
  private simPacketsProcessed = 28450;
  private simThreatIndex = 14;
  private simWavePoints: number[] = Array(35).fill(15);
  private simActiveAttack: string | null = null;
  private simLogHistory: { time: string; text: string; type: 'info' | 'alert' | 'success' }[] = [
    { time: '10:40:12', text: 'NetShield Simulation Engine v2.5 initialized.', type: 'info' },
    { time: '10:40:14', text: 'CIC-IDS2017 feature vectorizer ready (8 flow dimensions).', type: 'info' },
    { time: '10:40:15', text: 'Global sensor grid online. Ready for attack injection.', type: 'success' },
  ];

  // AI Chat Assistant State
  private chatMessages: AIMessage[] = [
    {
      id: 'msg-init-1',
      sender: 'assistant',
      text: `Welcome to **NetShield AI Help Assistant**! I am your SecOps threat intelligence copilot.

I can help you:
- Explain machine learning classifications on CIC-IDS2017 network traffic.
- Analyze specific alerts (DoS, DDoS, PortScan, SSH-BruteForce, Botnet).
- Formulate defensive containment rules and MITRE ATT&CK mitigation playbooks.
- Review sensor telemetry and false-positive evaluation guidelines.

Ask me anything or choose a quick prompt below:`,
      timestamp: '10:00:00',
      suggestedPrompts: [
        'Explain DoS-Hulk detection pattern',
        'How does the ML Random Forest model work?',
        'Recommend mitigation for active PortScan',
        'What are the sensor probe locations & latencies?',
        'How do I upload custom CSV network traffic?',
      ],
    },
  ];
  private isFloatingChatOpen = false;
  private selectedAlertForChat: SecurityAlert | null = null;

  // 3D Visualizer Scene Instances
  private heroGlobeInstance: ThreeHeroGlobe | null = null;
  private topologySceneInstance: ThreeTopologyScene | null = null;
  private sensorMapInstance: SensorMapVisualizer | null = null;
  private selectedTopologyNode: NetworkNode | null = null;

  constructor() {
    this.initTheme();
    this.renderShell();
    this.startUptimeTicker();
    this.startLiveStream();
    this.navigateTo('home');
  }

  private initTheme(): void {
    const saved = localStorage.getItem('netshield_theme') as 'dark' | 'light' | null;
    this.theme = saved || 'dark';
    document.documentElement.setAttribute('data-theme', this.theme);
  }

  public toggleTheme(): void {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', this.theme);
    localStorage.setItem('netshield_theme', this.theme);
    const themeIconBtn = document.getElementById('theme-toggle-btn');
    if (themeIconBtn) {
      themeIconBtn.innerHTML = this.theme === 'dark' ? icon('sun') : icon('moon');
    }
    CyberAudioService.playClick();
  }

  public toggleSound(): void {
    this.soundEnabled = CyberAudioService.toggle();
    const btn = document.getElementById('sound-toggle-btn');
    if (btn) {
      btn.innerHTML = this.soundEnabled ? icon('volume') : icon('mute');
      btn.title = this.soundEnabled ? 'Mute Audio Chimes' : 'Unmute Audio Chimes';
    }
  }

  private startUptimeTicker(): void {
    setInterval(() => {
      const elapsed = Date.now() - this.appStartTime;
      const seconds = Math.floor((elapsed / 1000) % 60);
      const minutes = Math.floor((elapsed / (1000 * 60)) % 60);
      const hours = Math.floor((elapsed / (1000 * 60 * 60)) % 24);
      const days = Math.floor(elapsed / (1000 * 60 * 60 * 24));

      const pad = (n: number) => n.toString().padStart(2, '0');
      const timeStr = `${pad(days)}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;

      const timerEl = document.getElementById('soc-running-time');
      if (timerEl) {
        timerEl.textContent = timeStr;
      }
    }, 1000);
  }

  private startLiveStream(): void {
    if (this.streamIntervalId) clearInterval(this.streamIntervalId);
    this.streamIntervalId = window.setInterval(() => {
      if (!this.isLiveStreaming) return;

      this.livePacketsReceived += Math.floor(48 * this.streamSpeed);
      const liveCounterEl = document.getElementById('live-stream-packet-count');
      if (liveCounterEl) {
        liveCounterEl.textContent = this.livePacketsReceived.toLocaleString();
      }

      if (Math.random() < 0.12) {
        this.generateRandomFlowEvent();
      }
    }, 1200 / this.streamSpeed);
  }

  public injectAttackScenario(category: TrafficCategory, intensityMultiplier = 1): void {
    const risk: RiskLevel =
      category === 'DoS-Hulk' || category === 'DDoS-LOIC' || category === 'Botnet-Ares'
        ? 'Critical'
        : category === 'SSH-BruteForce'
        ? 'High'
        : category === 'PortScan'
        ? 'Medium'
        : 'Low';

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const attackerIp =
      category === 'DoS-Hulk'
        ? '198.51.100.44'
        : category === 'DDoS-LOIC'
        ? '198.51.100.99'
        : category === 'PortScan'
        ? '203.0.113.88'
        : category === 'SSH-BruteForce'
        ? '192.0.2.140'
        : category === 'Botnet-Ares'
        ? '10.0.3.45'
        : '10.0.3.14';

    const targetIp =
      category === 'SSH-BruteForce'
        ? '10.0.1.20'
        : category === 'PortScan'
        ? '10.0.2.15'
        : '10.0.1.10';

    const targetPort =
      category === 'SSH-BruteForce'
        ? 22
        : category === 'PortScan'
        ? 443
        : category === 'Botnet-Ares'
        ? 8089
        : 80;

    const newFlow: NetworkFlowRecord = {
      id: `SIM-${Date.now().toString().slice(-4)}`,
      timestamp: nowStr,
      sourceIp: attackerIp,
      destinationIp: targetIp,
      sourcePort: Math.floor(Math.random() * 20000 + 40000),
      destinationPort: targetPort,
      protocol: 'TCP',
      flowDurationMs: category === 'PortScan' ? 140 : 4200,
      totalFwdPackets: Math.round(1800 * intensityMultiplier),
      totalBwdPackets: category === 'DDoS-LOIC' ? 0 : 8,
      totalFwdBytes: Math.round(920000 * intensityMultiplier),
      totalBwdBytes: 640,
      flowBytesPerSec: Math.round(220000 * intensityMultiplier),
      flowPacketsPerSec: Math.round(440 * intensityMultiplier),
      fwdIatMeanMs: 2.2,
      bwdIatMeanMs: 120.5,
      finFlags: 0,
      synFlags: category === 'PortScan' ? 8 : 45,
      rstFlags: category === 'DoS-Hulk' ? 120 : 0,
      pshFlags: 12,
      ackFlags: 18,
      predictedCategory: category,
      confidence: Number((0.95 + Math.random() * 0.045).toFixed(3)),
      riskLevel: risk,
      status: 'New',
    };

    this.flows.unshift(newFlow);
    if (this.flows.length > 70) this.flows.pop();

    // Trigger sound effect
    if (category === 'BENIGN') {
      CyberAudioService.playClick();
    } else {
      CyberAudioService.playInjection();
      CyberAudioService.playAlarm();
    }

    if (risk === 'Critical' || risk === 'High') {
      const newAlert: SecurityAlert = {
        id: `ALT-SIM-${Date.now().toString().slice(-4)}`,
        timestamp: nowStr,
        category,
        severity: risk,
        sourceIp: attackerIp,
        destinationIp: targetIp,
        sourcePort: newFlow.sourcePort,
        destinationPort: targetPort,
        protocol: 'TCP',
        confidence: newFlow.confidence,
        status: 'New',
        description: `Simulated attack injection: ${category} targeting ${targetIp}:${targetPort}. Multiplier: ${intensityMultiplier}x.`,
        recommendation: `Apply rate limiting and drop traffic from ${attackerIp} at edge firewall.`,
        mitreTechnique: category === 'PortScan' ? 'T1046' : 'T1498',
        investigationNotes: ['Injected via NetShield Simulation Lab sandbox.'],
      };
      this.alerts.unshift(newAlert);
      this.updateAlertBadge();
    }

    // Update Simulation Lab Waveform and Threat Index if on simulation tab
    this.simActiveAttack = category;
    this.simThreatIndex = category === 'BENIGN' ? 12 : Math.min(98, Math.floor(65 + Math.random() * 32));
    this.simPacketsProcessed += Math.floor(450 * intensityMultiplier);

    const logType = category === 'BENIGN' ? 'success' : 'alert';
    const timeShort = new Date().toLocaleTimeString();
    this.simLogHistory.unshift({
      time: timeShort,
      text: `INJECTED [${category}]: Source ${attackerIp} -> Target ${targetIp}:${targetPort} (Confidence: ${(newFlow.confidence * 100).toFixed(1)}%)`,
      type: logType,
    });
    if (this.simLogHistory.length > 30) this.simLogHistory.pop();

    this.updateSimulationViews();
  }

  private generateRandomFlowEvent(): void {
    const isThreat = Math.random() < 0.45;
    const categories: TrafficCategory[] = [
      'DoS-Hulk',
      'PortScan',
      'DDoS-LOIC',
      'SSH-BruteForce',
      'Botnet-Ares',
    ];
    const category: TrafficCategory = isThreat
      ? categories[Math.floor(Math.random() * categories.length)]
      : 'BENIGN';

    this.injectAttackScenario(category, 1);

    if (this.activeTab === 'livemonitor') {
      const tbody = document.getElementById('live-stream-tbody');
      if (tbody && this.flows[0]) {
        const row = document.createElement('tr');
        row.innerHTML = this.renderStreamRowHTML(this.flows[0]).replace(/<tr>|<\/tr>/g, '');
        row.style.backgroundColor = 'var(--cyan-subtle)';
        tbody.insertBefore(row, tbody.firstChild);
        if (tbody.children.length > 15) tbody.removeChild(tbody.lastChild!);
      }
    }
  }

  private updateAlertBadge(): void {
    const unreadCount = this.alerts.filter((a) => a.status === 'New').length;
    const badgeEl = document.getElementById('header-alert-counter');
    if (badgeEl) {
      badgeEl.textContent = unreadCount.toString();
      badgeEl.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
  }

  /**
   * Main App Shell with Fixed Top Navigation Bar
   */
  private renderShell(): void {
    const root = document.getElementById('app');
    if (!root) return;

    root.innerHTML = `
      <div class="header-wrapper">
        <!-- TOP BRAND & TELEMETRY BAR -->
        <header class="top-brand-bar">
          <div class="brand-section" id="brand-logo-btn" title="NetShield AI Home">
            <div class="brand-logo-container">
              ${getBrandLogoSVG()}
            </div>
            <div class="brand-text-block">
              <span class="brand-name">
                NETSHIELD AI
                <span class="badge-pro">SOC v2.5</span>
              </span>
              <span class="brand-tagline">Detect Threats • Monitor Traffic • Secure Networks</span>
            </div>
          </div>

          <div class="top-actions">
            <!-- Sleek Unified Telemetry & Dataset Benchmark Chip -->
            <div class="header-telemetry-pill" title="Supervised ML Intrusion Detection Engine Active (CIC-IDS2017 Benchmark)">
              <span class="pulse-dot"></span>
              <span class="telemetry-status">ENGINE ACTIVE</span>
              <span class="telemetry-divider"></span>
              <span class="telemetry-model-chip" title="Model trained & benchmarked on CIC-IDS2017">${icon('shield', 'w-3 h-3')} CIC-IDS2017</span>
              <span class="telemetry-divider"></span>
              <span class="telemetry-uptime" id="soc-running-time">04d 18h 32m 14s</span>
            </div>

            <button class="btn btn-secondary btn-sm" id="quick-sim-btn" title="Launch Demo Simulation" style="border: 1px dashed var(--accent-cyan); color: var(--accent-cyan);">
              ${icon('simulation', 'w-3.5 h-3.5')}
              <span>Demo Simulation</span>
            </button>
            <button class="icon-btn" id="sound-toggle-btn" title="Toggle Audio Chimes">
              ${icon('volume')}
            </button>
            <button class="icon-btn" id="theme-toggle-btn" title="Toggle Dark / Light Theme">
              ${this.theme === 'dark' ? icon('sun') : icon('moon')}
            </button>
            <button class="icon-btn" id="open-alerts-btn" title="View Active Security Alerts">
              ${icon('bell')}
              <span class="badge-counter" id="header-alert-counter">2</span>
            </button>
          </div>
        </header>

        <!-- TOP NAVIGATION BAR (7 CORE TABS REQUIRED BY USER) -->
        <nav class="top-tabs-bar" id="top-tabs-nav">
          <button class="top-tab active" data-tab="home" title="Home Overview">
            ${icon('home')}
            <span>Home</span>
          </button>
          <button class="top-tab" data-tab="dashboard" title="Security Operations Dashboard">
            ${icon('dashboard')}
            <span>Dashboard</span>
          </button>
          <button class="top-tab" data-tab="analyzer" title="Machine Learning Traffic Analyzer">
            ${icon('terminal')}
            <span>AI Analysis</span>
          </button>
          <button class="top-tab" data-tab="livemonitor" title="Real-Time Network Event Ingress">
            ${icon('radio')}
            <span>Live Monitoring</span>
          </button>
          <button class="top-tab simulation-tab" data-tab="simulation" title="Dedicated Cyber Attack Simulation Lab">
            ${icon('crosshair')}
            <span>Demo Simulation</span>
          </button>
          <button class="top-tab" data-tab="analytics" title="Model Metrics, ROC & Confusion Matrix">
            ${icon('barchart')}
            <span>Analytics</span>
          </button>
          <button class="top-tab" data-tab="about" title="About Project, Architecture & Methodology">
            ${icon('info')}
            <span>About Project</span>
          </button>
        </nav>
      </div>

      <!-- MAIN PAGE CONTENT CONTAINER -->
      <main class="main-content" id="main-view-container"></main>

      <!-- FLOATING AI HELP CHATBOT TRIGGER IN BOTTOM-RIGHT (NOT MIXED WITH NAV) -->
      <button class="floating-chat-trigger" id="floating-chat-btn" title="Ask NetShield AI Copilot for Help">
        <div class="chat-symbol-icon">
          ${icon('bot', 'w-4 h-4')}
        </div>
        <span>AI Help Assistant</span>
      </button>

      <!-- FLOATING MODERN CHATBOT WINDOW -->
      <div class="floating-chat-drawer" id="floating-chat-drawer">
        <div class="chat-header">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="brand-logo-container" style="width: 32px; height: 32px;">
              ${icon('bot', 'w-4 h-4')}
            </div>
            <div>
              <h4 style="font-size: 0.92rem; font-weight: 700; color: var(--text-primary);">NetShield Sentinel AI</h4>
              <span style="font-size: 0.7rem; color: var(--accent-cyan); font-family: var(--font-mono);">Online • Gemini 2.5 Flash</span>
            </div>
          </div>
          <button class="icon-btn" id="close-floating-chat" style="width: 28px; height: 28px;">${icon('x', 'w-3.5 h-3.5')}</button>
        </div>
        <div class="chat-history" id="floating-chat-messages">
          <!-- Chat messages rendered dynamically -->
        </div>
        <div class="chat-input-bar">
          <input type="text" id="floating-chat-input" class="chat-input" placeholder="Ask question about threats or ML..." />
          <button class="btn btn-primary btn-sm" id="floating-chat-send">${icon('send', 'w-3.5 h-3.5')}</button>
        </div>
      </div>

      <!-- GLOBAL MODAL CONTAINER -->
      <div id="modal-root"></div>
    `;

    // Attach Top Header Events
    document.getElementById('brand-logo-btn')?.addEventListener('click', () => this.navigateTo('home'));
    document.getElementById('theme-toggle-btn')?.addEventListener('click', () => this.toggleTheme());
    document.getElementById('sound-toggle-btn')?.addEventListener('click', () => this.toggleSound());
    document.getElementById('open-alerts-btn')?.addEventListener('click', () => {
      this.dashboardSubView = 'alerts';
      this.navigateTo('dashboard');
    });
    document.getElementById('quick-sim-btn')?.addEventListener('click', () => this.navigateTo('simulation'));

    // Attach Top Navigation Tab Events
    const tabs = document.querySelectorAll<HTMLButtonElement>('.top-tab');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-tab');
        if (target) {
          CyberAudioService.playClick();
          this.navigateTo(target);
        }
      });
    });

    // Floating Chat Assistant Drawer Events
    const floatBtn = document.getElementById('floating-chat-btn');
    const floatDrawer = document.getElementById('floating-chat-drawer');
    const closeFloat = document.getElementById('close-floating-chat');

    floatBtn?.addEventListener('click', () => {
      this.isFloatingChatOpen = !this.isFloatingChatOpen;
      CyberAudioService.playClick();
      if (floatDrawer) {
        if (this.isFloatingChatOpen) {
          floatDrawer.classList.add('open');
          this.renderFloatingChatMessages();
        } else {
          floatDrawer.classList.remove('open');
        }
      }
    });

    closeFloat?.addEventListener('click', () => {
      this.isFloatingChatOpen = false;
      floatDrawer?.classList.remove('open');
    });

    document.getElementById('floating-chat-send')?.addEventListener('click', () => this.handleFloatingChatSend());
    document.getElementById('floating-chat-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleFloatingChatSend();
    });

    this.updateAlertBadge();
  }

  private renderFloatingChatMessages(): void {
    const box = document.getElementById('floating-chat-messages');
    if (!box) return;

    box.innerHTML = this.chatMessages
      .map((m) => {
        const chipsHtml =
          m.suggestedPrompts && m.suggestedPrompts.length > 0
            ? `<div class="chat-prompt-chips">
                ${m.suggestedPrompts
                  .map(
                    (p) => `<button class="prompt-chip" data-prompt="${p}">${p}</button>`
                  )
                  .join('')}
              </div>`
            : '';

        return `
          <div class="chat-msg ${m.sender}">
            <div class="chat-bubble">
              ${m.text
                .replace(/\n/g, '<br/>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/### (.*?)(?:<br\/>|$)/g, '<h4 style="margin: 4px 0; color: var(--accent-cyan);">$1</h4>')}
              ${chipsHtml}
            </div>
            <span style="font-size: 0.65rem; color: var(--text-muted); margin-top: 3px; align-self: ${m.sender === 'user' ? 'flex-end' : 'flex-start'};">
              ${m.timestamp}
            </span>
          </div>
        `;
      })
      .join('');

    // Attach suggested prompt chips click handler
    box.querySelectorAll<HTMLButtonElement>('.prompt-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const prompt = chip.getAttribute('data-prompt');
        if (prompt) {
          const input = document.getElementById('floating-chat-input') as HTMLInputElement | null;
          if (input) {
            input.value = prompt;
            this.handleFloatingChatSend();
          }
        }
      });
    });

    box.scrollTop = box.scrollHeight;
  }

  private async handleFloatingChatSend(): Promise<void> {
    const input = document.getElementById('floating-chat-input') as HTMLInputElement | null;
    const text = input?.value.trim();
    if (!text) return;

    CyberAudioService.playClick();

    this.chatMessages.push({
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString(),
    });
    if (input) input.value = '';
    this.renderFloatingChatMessages();

    // Show typing state
    const box = document.getElementById('floating-chat-messages');
    if (box) {
      const typingEl = document.createElement('div');
      typingEl.id = 'chat-typing-indicator';
      typingEl.className = 'chat-msg assistant';
      typingEl.innerHTML = `<div class="chat-bubble" style="opacity: 0.7; font-style: italic;">NetShield AI reasoning...</div>`;
      box.appendChild(typingEl);
      box.scrollTop = box.scrollHeight;
    }

    try {
      const resp = await GeminiSOCService.queryAssistant(
        text,
        this.chatMessages,
        this.selectedAlertForChat
      );
      document.getElementById('chat-typing-indicator')?.remove();
      this.chatMessages.push({
        id: `msg-resp-${Date.now()}`,
        sender: 'assistant',
        text: resp,
        timestamp: new Date().toLocaleTimeString(),
      });
      CyberAudioService.playAiResponse();
    } catch {
      document.getElementById('chat-typing-indicator')?.remove();
      this.chatMessages.push({
        id: `msg-err-${Date.now()}`,
        sender: 'assistant',
        text: 'Failed to consult threat intelligence engine. Please retry.',
        timestamp: new Date().toLocaleTimeString(),
      });
    }
    this.renderFloatingChatMessages();
  }

  public navigateTo(tabName: string): void {
    this.activeTab = tabName;

    // Cleanup 3D scenes if switching away
    if (this.heroGlobeInstance) {
      this.heroGlobeInstance.dispose();
      this.heroGlobeInstance = null;
    }
    if (this.topologySceneInstance) {
      this.topologySceneInstance.dispose();
      this.topologySceneInstance = null;
    }
    if (this.simIntervalId) {
      clearInterval(this.simIntervalId);
      this.simIntervalId = null;
    }

    // Update active tab styling in top navigation
    const tabs = document.querySelectorAll<HTMLButtonElement>('.top-tab');
    tabs.forEach((tab) => {
      if (tab.getAttribute('data-tab') === tabName) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    const main = document.getElementById('main-view-container');
    if (!main) return;
    main.innerHTML = '';

    window.scrollTo({ top: 0, behavior: 'smooth' });

    switch (tabName) {
      case 'home':
        this.renderHomePage(main);
        break;
      case 'dashboard':
        this.renderDashboardPage(main);
        break;
      case 'analyzer':
        this.renderAnalyzerPage(main);
        break;
      case 'livemonitor':
        this.renderLiveMonitorPage(main);
        break;
      case 'simulation':
        this.renderSimulationLabPage(main);
        break;
      case 'analytics':
        this.renderAnalyticsPage(main);
        break;
      case 'about':
        this.renderAboutPage(main);
        break;
      default:
        this.renderHomePage(main);
        break;
    }
  }

  /* =============================================================
   * PAGE 1: HOME LANDING (REFINED, COMPACT, HIGH-DENSITY HERO)
   * ============================================================= */
  private renderHomePage(container: HTMLElement): void {
    container.innerHTML = `
      <section style="display: grid; grid-template-columns: 1.15fr 1fr; gap: 28px; align-items: center; margin-bottom: 32px;">
        <div style="display: flex; flex-direction: column; gap: 14px;">
          <div class="env-badge" style="align-self: flex-start;">
            ${icon('shield', 'w-3.5 h-3.5')}
            <span>NEXT-GEN AI INTRUSION DETECTION SYSTEM</span>
          </div>
          <h1 style="font-size: 2.4rem; font-weight: 800; line-height: 1.15; letter-spacing: -0.02em;">
            Autonomous Network Defense Powered by <span class="text-cyan">Machine Learning</span>
          </h1>
          <p style="font-size: 0.95rem; color: var(--text-secondary); line-height: 1.6;">
            NetShield AI inspects live multi-dimensional network flows, classifies adversarial intrusions (DoS, DDoS, PortScan, BruteForce, Botnets), and delivers instant threat forensics through an interactive 3D command center.
          </p>

          <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 6px;">
            <button class="btn btn-primary" id="home-launch-sim-btn">
              ${icon('crosshair')} Launch Demo Simulation
            </button>
            <button class="btn btn-secondary" id="home-view-dashboard-btn">
              ${icon('dashboard')} View SOC Dashboard
            </button>
            <button class="btn btn-secondary" id="home-run-analyzer-btn">
              ${icon('terminal')} Analyze CSV Traffic
            </button>
          </div>

          <!-- Quick Metrics Bar -->
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: 14px; padding-top: 16px; border-top: 1px solid var(--border);">
            <div>
              <div style="font-size: 1.4rem; font-weight: 800; color: var(--accent-cyan); font-family: var(--font-mono);">98.42%</div>
              <div style="font-size: 0.74rem; color: var(--text-muted);">Model Accuracy (CIC-IDS2017)</div>
            </div>
            <div>
              <div style="font-size: 1.4rem; font-weight: 800; color: var(--success); font-family: var(--font-mono);">&lt; 1.2ms</div>
              <div style="font-size: 0.74rem; color: var(--text-muted);">Inference Latency</div>
            </div>
            <div>
              <div style="font-size: 1.4rem; font-weight: 800; color: var(--text-primary); font-family: var(--font-mono);">8 Probes</div>
              <div style="font-size: 0.74rem; color: var(--text-muted);">Global Threat Sensors</div>
            </div>
          </div>
        </div>

        <!-- 3D Cyber Threat Globe Mount -->
        <div class="card" style="padding: 10px; position: relative; height: 420px; overflow: hidden; display: flex; flex-direction: column;">
          <div style="position: absolute; top: 16px; left: 20px; z-index: 10;">
            <span class="badge badge-info">${icon('globe', 'w-3 h-3')} 3D Global Telemetry Mesh</span>
          </div>
          <div id="hero-globe-mount" style="width: 100%; height: 100%;"></div>
          <div style="position: absolute; bottom: 12px; right: 16px; font-size: 0.72rem; color: var(--text-muted); z-index: 10;">
            Drag to rotate • Real-time sensor arcs
          </div>
        </div>
      </section>

      <!-- THREE CORE PILLARS OVERVIEW -->
      <section style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 32px;">
        <div class="card" style="display: flex; flex-direction: column; gap: 10px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="brand-logo-container" style="width: 36px; height: 36px;">
              ${icon('terminal')}
            </div>
            <h3 style="font-size: 1.05rem; font-weight: 700;">Supervised ML Classifier</h3>
          </div>
          <p style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5;">
            Trained on the comprehensive <strong>CIC-IDS2017</strong> dataset with Random Forest ensemble logic. Accurately flags volumetric DDoS floods, credential dictionary attacks, and low-latency port scans with near-zero false positive rates.
          </p>
          <div style="margin-top: auto; padding-top: 8px;">
            <button class="btn btn-secondary btn-sm" id="home-card-ml-btn">Open AI Analyzer &rarr;</button>
          </div>
        </div>

        <div class="card" style="display: flex; flex-direction: column; gap: 10px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="brand-logo-container" style="width: 36px; height: 36px;">
              ${icon('crosshair')}
            </div>
            <h3 style="font-size: 1.05rem; font-weight: 700;">Demo Simulation Sandbox</h3>
          </div>
          <p style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5;">
            Interactive laboratory where analysts can inject simulated adversarial attacks (DoS-Hulk, LOIC, SYN Scans) to visualize real-time alerts, packet throughput spikes, and autonomous firewall mitigations.
          </p>
          <div style="margin-top: auto; padding-top: 8px;">
            <button class="btn btn-secondary btn-sm" id="home-card-sim-btn">Open Simulation Lab &rarr;</button>
          </div>
        </div>

        <div class="card" style="display: flex; flex-direction: column; gap: 10px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="brand-logo-container" style="width: 36px; height: 36px;">
              ${icon('network')}
            </div>
            <h3 style="font-size: 1.05rem; font-weight: 700;">3D Topology & Sensor Grid</h3>
          </div>
          <p style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5;">
            Spatial command center rendering network nodes, packet traffic cables, anomaly filters, and 8 global sensor probes across Ashburn, London, Frankfurt, Tokyo, and Singapore.
          </p>
          <div style="margin-top: auto; padding-top: 8px;">
            <button class="btn btn-secondary btn-sm" id="home-card-topo-btn">Explore 3D Topology &rarr;</button>
          </div>
        </div>
      </section>
    `;

    // Attach home buttons
    document.getElementById('home-launch-sim-btn')?.addEventListener('click', () => this.navigateTo('simulation'));
    document.getElementById('home-view-dashboard-btn')?.addEventListener('click', () => this.navigateTo('dashboard'));
    document.getElementById('home-run-analyzer-btn')?.addEventListener('click', () => this.navigateTo('analyzer'));
    document.getElementById('home-card-ml-btn')?.addEventListener('click', () => this.navigateTo('analyzer'));
    document.getElementById('home-card-sim-btn')?.addEventListener('click', () => this.navigateTo('simulation'));
    document.getElementById('home-card-topo-btn')?.addEventListener('click', () => {
      this.dashboardSubView = 'topology';
      this.navigateTo('dashboard');
    });

    // Mount 3D Hero Globe
    const globeMount = document.getElementById('hero-globe-mount');
    if (globeMount) {
      this.heroGlobeInstance = new ThreeHeroGlobe(globeMount);
    }
  }

  /* =============================================================
   * PAGE 2: DASHBOARD (EXECUTIVE SOC & ADVANCED SUB-VIEWS)
   * ============================================================= */
  private renderDashboardPage(container: HTMLElement): void {
    container.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px; margin-bottom: 16px;">
        <div>
          <h1 style="font-size: 1.6rem; font-weight: 800;">Security Operations Command Center</h1>
          <p style="font-size: 0.84rem; color: var(--text-secondary);">Enterprise telemetry, threat classification distribution, and infrastructure status.</p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-secondary btn-sm" id="dash-refresh-btn">${icon('rotate')} Refresh Telemetry</button>
          <button class="btn btn-primary btn-sm" id="dash-quick-sim-btn">${icon('simulation')} Inject Test Attack</button>
        </div>
      </div>

      <!-- DASHBOARD SUB-VIEWS SELECTOR (Overview, 3D Topology, Sensor Map, Threats, Alerts, Reports) -->
      <div class="subtabs-bar">
        <button class="subtab-btn ${this.dashboardSubView === 'overview' ? 'active' : ''}" data-subview="overview">
          ${icon('dashboard')} Overview
        </button>
        <button class="subtab-btn ${this.dashboardSubView === 'topology' ? 'active' : ''}" data-subview="topology">
          ${icon('network')} 3D Network Topology
        </button>
        <button class="subtab-btn ${this.dashboardSubView === 'sensormap' ? 'active' : ''}" data-subview="sensormap">
          ${icon('globe')} Sensor Probes Map
        </button>
        <button class="subtab-btn ${this.dashboardSubView === 'threats' ? 'active' : ''}" data-subview="threats">
          ${icon('alert')} Threat Intel Matrix
        </button>
        <button class="subtab-btn ${this.dashboardSubView === 'alerts' ? 'active' : ''}" data-subview="alerts">
          ${icon('bell')} Active Alerts (${this.alerts.filter((a) => a.status === 'New').length})
        </button>
        <button class="subtab-btn ${this.dashboardSubView === 'reports' ? 'active' : ''}" data-subview="reports">
          ${icon('filetext')} Reports & History
        </button>
      </div>

      <div id="dashboard-subview-content"></div>
    `;

    document.getElementById('dash-refresh-btn')?.addEventListener('click', () => {
      CyberAudioService.playClick();
      this.renderDashboardSubView();
    });

    document.getElementById('dash-quick-sim-btn')?.addEventListener('click', () => {
      this.navigateTo('simulation');
    });

    container.querySelectorAll<HTMLButtonElement>('.subtab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const sub = btn.getAttribute('data-subview');
        if (sub) {
          CyberAudioService.playClick();
          this.dashboardSubView = sub;
          container.querySelectorAll('.subtab-btn').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          this.renderDashboardSubView();
        }
      });
    });

    this.renderDashboardSubView();
  }

  private renderDashboardSubView(): void {
    const subContainer = document.getElementById('dashboard-subview-content');
    if (!subContainer) return;

    if (this.topologySceneInstance) {
      this.topologySceneInstance.dispose();
      this.topologySceneInstance = null;
    }

    switch (this.dashboardSubView) {
      case 'overview':
        this.renderDashboardOverview(subContainer);
        break;
      case 'topology':
        this.renderTopologyPage(subContainer);
        break;
      case 'sensormap':
        this.renderSensorMapPage(subContainer);
        break;
      case 'threats':
        this.renderThreatsPage(subContainer);
        break;
      case 'alerts':
        this.renderAlertsPage(subContainer);
        break;
      case 'reports':
        this.renderReportsPage(subContainer);
        break;
      default:
        this.renderDashboardOverview(subContainer);
        break;
    }
  }

  private renderDashboardOverview(container: HTMLElement): void {
    const totalFlows = this.flows.length;
    const normalCount = this.flows.filter((f) => f.predictedCategory === 'BENIGN').length;
    const suspiciousCount = this.flows.filter((f) => f.riskLevel === 'Medium' || f.riskLevel === 'High').length;
    const criticalCount = this.flows.filter((f) => f.riskLevel === 'Critical').length;
    const activeAlerts = this.alerts.filter((a) => a.status === 'New').length;

    const normalPercent = totalFlows > 0 ? Math.round((normalCount / totalFlows) * 100) : 88;
    const threatPercent = 100 - normalPercent;

    container.innerHTML = `
      <!-- KPI Scorecards Grid -->
      <section class="kpi-grid">
        <div class="kpi-card kpi-blue">
          <div class="kpi-top">
            <span class="kpi-label">Total Analyzed Flows</span>
            <div class="kpi-icon">${icon('terminal')}</div>
          </div>
          <span class="kpi-val">${totalFlows.toLocaleString()}</span>
          <span class="kpi-desc text-muted">CIC-IDS2017 Dataset</span>
        </div>
        <div class="kpi-card kpi-success">
          <div class="kpi-top">
            <span class="kpi-label">Normal Traffic (Benign)</span>
            <div class="kpi-icon">${icon('check')}</div>
          </div>
          <span class="kpi-val">${normalCount}</span>
          <span class="kpi-desc text-success">${normalPercent}% of total volume</span>
        </div>
        <div class="kpi-card kpi-warning">
          <div class="kpi-top">
            <span class="kpi-label">Suspicious Detections</span>
            <div class="kpi-icon">${icon('alert')}</div>
          </div>
          <span class="kpi-val">${suspiciousCount}</span>
          <span class="kpi-desc text-warning">PortScan & Recon</span>
        </div>
        <div class="kpi-card kpi-danger">
          <div class="kpi-top">
            <span class="kpi-label">Critical Intrusions</span>
            <div class="kpi-icon">${icon('crosshair')}</div>
          </div>
          <span class="kpi-val">${criticalCount}</span>
          <span class="kpi-desc text-alert">${activeAlerts} unacknowledged alerts</span>
        </div>
      </section>

      <!-- Charts & Threat Distribution -->
      <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 20px; margin-bottom: 24px;">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Threat Category Distribution</h3>
            <span class="badge badge-info">Random Forest Classification</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 4px;">
                <span>BENIGN Traffic</span>
                <span class="mono">${normalPercent}%</span>
              </div>
              <div style="background: var(--bg-secondary); height: 8px; border-radius: 4px; overflow: hidden;">
                <div style="width: ${normalPercent}%; background: var(--success); height: 100%;"></div>
              </div>
            </div>
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 4px;">
                <span>DoS-Hulk (HTTP GET Floods)</span>
                <span class="mono">28% of threats</span>
              </div>
              <div style="background: var(--bg-secondary); height: 8px; border-radius: 4px; overflow: hidden;">
                <div style="width: 28%; background: var(--danger); height: 100%;"></div>
              </div>
            </div>
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 4px;">
                <span>DDoS-LOIC (Volumetric Floods)</span>
                <span class="mono">24% of threats</span>
              </div>
              <div style="background: var(--bg-secondary); height: 8px; border-radius: 4px; overflow: hidden;">
                <div style="width: 24%; background: #e11d48; height: 100%;"></div>
              </div>
            </div>
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 4px;">
                <span>PortScan (TCP SYN Sweep)</span>
                <span class="mono">30% of threats</span>
              </div>
              <div style="background: var(--bg-secondary); height: 8px; border-radius: 4px; overflow: hidden;">
                <div style="width: 30%; background: var(--warning); height: 100%;"></div>
              </div>
            </div>
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 4px;">
                <span>SSH-BruteForce (Auth Dictionary)</span>
                <span class="mono">18% of threats</span>
              </div>
              <div style="background: var(--bg-secondary); height: 8px; border-radius: 4px; overflow: hidden;">
                <div style="width: 18%; background: #d97706; height: 100%;"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">System Health & Sensor Probes</h3>
            <span class="badge badge-success">8 Probes Synced</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; background: var(--bg-secondary); border-radius: 6px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="pulse-dot"></span>
                <span style="font-size: 0.82rem; font-weight: 600;">US-East (Ashburn, VA)</span>
              </div>
              <span class="mono text-cyan" style="font-size: 0.78rem;">12.4 ms • 820 Mbps</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; background: var(--bg-secondary); border-radius: 6px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="pulse-dot"></span>
                <span style="font-size: 0.82rem; font-weight: 600;">EU-West (Frankfurt)</span>
              </div>
              <span class="mono text-cyan" style="font-size: 0.78rem;">18.2 ms • 640 Mbps</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; background: var(--bg-secondary); border-radius: 6px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="pulse-dot"></span>
                <span style="font-size: 0.82rem; font-weight: 600;">AP-East (Tokyo, JP)</span>
              </div>
              <span class="mono text-cyan" style="font-size: 0.78rem;">34.8 ms • 480 Mbps</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; background: var(--bg-secondary); border-radius: 6px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="pulse-dot"></span>
                <span style="font-size: 0.82rem; font-weight: 600;">AP-South (Singapore)</span>
              </div>
              <span class="mono text-cyan" style="font-size: 0.78rem;">41.0 ms • 520 Mbps</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Intrusion Events Table -->
      <section class="card">
        <div class="card-header">
          <h3 class="card-title">Recent High-Priority Detections</h3>
          <span class="badge badge-critical">${this.alerts.length} Incidents</span>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Alert ID</th>
                <th>Timestamp</th>
                <th>Threat Category</th>
                <th>Severity</th>
                <th>Attacker IP</th>
                <th>Target Asset</th>
                <th>Confidence</th>
                <th>MITRE Technique</th>
              </tr>
            </thead>
            <tbody>
              ${this.alerts
                .slice(0, 6)
                .map((a) => {
                  const badge =
                    a.severity === 'Critical'
                      ? '<span class="badge badge-critical">CRITICAL</span>'
                      : '<span class="badge badge-warning">HIGH</span>';
                  return `
                    <tr>
                      <td class="mono font-bold text-cyan">${a.id}</td>
                      <td class="mono" style="font-size: 0.75rem;">${a.timestamp}</td>
                      <td style="font-weight: 600;">${a.category}</td>
                      <td>${badge}</td>
                      <td class="mono">${a.sourceIp}:${a.sourcePort}</td>
                      <td class="mono">${a.destinationIp}:${a.destinationPort}</td>
                      <td class="mono">${(a.confidence * 100).toFixed(1)}%</td>
                      <td class="mono text-muted">${a.mitreTechnique}</td>
                    </tr>
                  `;
                })
                .join('')}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  /* =============================================================
   * PAGE 3: AI ANALYSIS (TRAFFIC ANALYZER & CSV UPLOADER)
   * ============================================================= */
  private renderAnalyzerPage(container: HTMLElement): void {
    container.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px; margin-bottom: 20px;">
        <div>
          <h1 style="font-size: 1.6rem; font-weight: 800;">Machine Learning Network Traffic Analyzer</h1>
          <p style="font-size: 0.84rem; color: var(--text-secondary);">
            Upload PCAP/NetFlow CSV records or run pre-loaded attack batches through our Random Forest intrusion model.
          </p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-secondary btn-sm" id="btn-export-analyzed">
            ${icon('download')} Export Analysis CSV
          </button>
        </div>
      </div>

      <!-- File Upload & Pre-Packaged Demo Scenarios -->
      <section class="card" style="margin-bottom: 24px;">
        <div style="display: grid; grid-template-columns: 1.3fr 1fr; gap: 20px; align-items: center;">
          <div style="border: 2px dashed var(--border); border-radius: var(--radius-md); padding: 32px 20px; text-align: center; cursor: pointer; background: var(--bg-secondary); transition: border-color 0.2s;" id="drop-zone">
            <div style="color: var(--accent-cyan); margin-bottom: 10px;">${icon('terminal', 'w-10 h-10')}</div>
            <h3 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 4px;">Upload or Drop Network Flow CSV</h3>
            <p style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 14px;">
              Supports Destination Port, Protocol, Flow Duration, Packets/s, Bytes/s
            </p>
            <input type="file" id="csv-file-input" accept=".csv" style="display: none;" />
            <button class="btn btn-primary btn-sm" id="browse-file-btn">Browse Files</button>
          </div>

          <div style="display: flex; flex-direction: column; gap: 10px;">
            <h4 style="font-size: 0.88rem; font-weight: 700;">Pre-Packaged Attack Scenarios</h4>
            <button class="btn btn-secondary btn-sm" id="btn-load-sample-cic" style="justify-content: flex-start;">
              ${icon('play', 'w-3.5 h-3.5')} Load CIC-IDS2017 Sample Batch (15 records)
            </button>
            <button class="btn btn-secondary btn-sm" id="btn-load-ddos-batch" style="justify-content: flex-start;">
              ${icon('play', 'w-3.5 h-3.5')} Load Volumetric DDoS Flood Scenario (10 records)
            </button>
            <button class="btn btn-secondary btn-sm" id="btn-load-portscan-batch" style="justify-content: flex-start;">
              ${icon('play', 'w-3.5 h-3.5')} Load Reconnaissance PortScan Scenario (10 records)
            </button>
          </div>
        </div>

        <div id="analyzer-status-msg" style="margin-top: 14px; font-size: 0.82rem; display: none;"></div>
      </section>

      <!-- Classification Results Table -->
      <section class="card">
        <div class="card-header">
          <div class="card-title-group">
            <h3 class="card-title">Flow Records & Predictions</h3>
            <span class="badge badge-info" id="record-count-badge">${this.flows.length} Records</span>
          </div>
          <div>
            <input type="text" id="analyzer-search" placeholder="Search IP, Port or Threat..." class="chat-input" style="padding: 6px 12px; font-size: 0.8rem; width: 220px;" />
          </div>
        </div>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Flow ID</th>
                <th>Timestamp</th>
                <th>Endpoints</th>
                <th>Protocol</th>
                <th>Duration (ms)</th>
                <th>Flow Bytes/s</th>
                <th>Flow Pkts/s</th>
                <th>ML Prediction</th>
                <th>Confidence</th>
                <th>Risk Level</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="analyzer-tbody">
              ${this.renderFlowRows(this.flows)}
            </tbody>
          </table>
        </div>
      </section>
    `;

    const fileInput = document.getElementById('csv-file-input') as HTMLInputElement | null;
    const browseBtn = document.getElementById('browse-file-btn');
    const dropZone = document.getElementById('drop-zone');

    browseBtn?.addEventListener('click', () => fileInput?.click());
    dropZone?.addEventListener('click', () => fileInput?.click());

    fileInput?.addEventListener('change', (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files[0]) {
        this.processUploadedFile(files[0]);
      }
    });

    document.getElementById('btn-load-sample-cic')?.addEventListener('click', () => {
      CyberAudioService.playClick();
      const csv = MLTrafficClassifier.getSampleCSV();
      this.runClassificationOnText(csv, 'CIC-IDS2017 Sample Flow Batch');
    });

    document.getElementById('btn-load-ddos-batch')?.addEventListener('click', () => {
      CyberAudioService.playClick();
      const csv = `Destination Port,Source Port,Protocol,Flow Duration,Total Fwd Packets,Total Backward Packets,Total Length of Fwd Packets,Total Length of Bwd Packets,Flow Bytes/s,Flow Packets/s
80,61200,TCP,4200,2800,4,1420000,240,338000,667
80,61201,TCP,3900,3100,2,1590000,120,407000,795
80,61202,TCP,4800,2950,5,1520000,300,316000,615
80,61203,TCP,4500,3400,2,1740000,120,386000,756
443,61204,TCP,4100,2900,6,1490000,360,363000,708
80,61205,TCP,5000,3600,0,1850000,0,370000,720
80,61206,TCP,3800,2700,3,1380000,180,363000,711
8080,61207,TCP,4600,3300,4,1690000,240,367000,718
80,61208,TCP,4200,3050,2,1560000,120,371000,726
80,61209,TCP,4400,3150,5,1610000,300,365000,716`;
      this.runClassificationOnText(csv, 'Volumetric DDoS Flood Scenario');
    });

    document.getElementById('btn-load-portscan-batch')?.addEventListener('click', () => {
      CyberAudioService.playClick();
      const csv = `Destination Port,Source Port,Protocol,Flow Duration,Total Fwd Packets,Total Backward Packets,Total Length of Fwd Packets,Total Length of Bwd Packets,Flow Bytes/s,Flow Packets/s
21,54001,TCP,120,6,0,360,0,3000,50.0
22,54002,TCP,110,6,0,360,0,3272,54.5
23,54003,TCP,130,6,0,360,0,2769,46.1
25,54004,TCP,95,6,0,360,0,3789,63.1
80,54005,TCP,140,8,0,480,0,3428,57.1
110,54006,TCP,105,6,0,360,0,3428,57.1
143,54007,TCP,115,6,0,360,0,3130,52.1
443,54008,TCP,125,6,0,360,0,2880,48.0
3389,54009,TCP,135,6,0,360,0,2666,44.4
8080,54010,TCP,145,6,0,360,0,2482,41.3`;
      this.runClassificationOnText(csv, 'Reconnaissance PortScan Scenario');
    });

    document.getElementById('btn-export-analyzed')?.addEventListener('click', () => {
      CyberAudioService.playClick();
      const csvStr = MLTrafficClassifier.exportToCSV(this.flows);
      this.downloadBlob(csvStr, 'NetShield_ML_Classified_Flows.csv', 'text/csv');
    });

    document.getElementById('analyzer-search')?.addEventListener('input', (e) => {
      const q = (e.target as HTMLInputElement).value.toLowerCase();
      const filtered = this.flows.filter(
        (f) =>
          f.sourceIp.includes(q) ||
          f.destinationIp.includes(q) ||
          f.predictedCategory.toLowerCase().includes(q) ||
          f.destinationPort.toString().includes(q)
      );
      const tbody = document.getElementById('analyzer-tbody');
      if (tbody) tbody.innerHTML = this.renderFlowRows(filtered);
    });

    this.attachFlowActionHandlers(container);
  }

  private renderFlowRows(records: NetworkFlowRecord[]): string {
    return records
      .map((r) => {
        const catBadge =
          r.predictedCategory === 'BENIGN'
            ? '<span class="badge badge-success">BENIGN</span>'
            : r.riskLevel === 'Critical'
            ? `<span class="badge badge-critical">${r.predictedCategory}</span>`
            : `<span class="badge badge-warning">${r.predictedCategory}</span>`;

        const riskBadge =
          r.riskLevel === 'Critical'
            ? '<span class="badge badge-critical">Critical</span>'
            : r.riskLevel === 'High'
            ? '<span class="badge badge-warning">High</span>'
            : r.riskLevel === 'Medium'
            ? '<span class="badge badge-info">Medium</span>'
            : '<span class="badge badge-success">Low</span>';

        return `
          <tr>
            <td class="mono font-bold text-cyan">${r.id}</td>
            <td class="mono" style="font-size: 0.75rem;">${r.timestamp.split(' ')[1] || r.timestamp}</td>
            <td class="mono" style="font-size: 0.8rem;">${r.sourceIp}:${r.sourcePort} &rarr; ${r.destinationIp}:${r.destinationPort}</td>
            <td style="font-weight: 600;">${r.protocol}</td>
            <td class="mono">${r.flowDurationMs.toLocaleString()}</td>
            <td class="mono">${r.flowBytesPerSec.toLocaleString()}</td>
            <td class="mono">${r.flowPacketsPerSec.toFixed(1)}</td>
            <td>${catBadge}</td>
            <td class="mono">${(r.confidence * 100).toFixed(1)}%</td>
            <td>${riskBadge}</td>
            <td>
              <button class="btn btn-secondary btn-sm ask-ai-flow-btn" data-id="${r.id}">
                Ask AI
              </button>
            </td>
          </tr>
        `;
      })
      .join('');
  }

  private attachFlowActionHandlers(container: HTMLElement): void {
    container.querySelectorAll('.ask-ai-flow-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const found = this.flows.find((f) => f.id === id);
        if (found) {
          this.isFloatingChatOpen = true;
          const drawer = document.getElementById('floating-chat-drawer');
          if (drawer) drawer.classList.add('open');
          const input = document.getElementById('floating-chat-input') as HTMLInputElement | null;
          if (input) {
            input.value = `Why was flow ${found.id} classified as ${found.predictedCategory} with ${(found.confidence * 100).toFixed(1)}% confidence? Detail the flow metrics evidence.`;
            this.handleFloatingChatSend();
          }
        }
      });
    });
  }

  private processUploadedFile(file: File): void {
    const statusMsg = document.getElementById('analyzer-status-msg');
    if (statusMsg) {
      statusMsg.style.display = 'block';
      statusMsg.innerHTML = `<span class="text-cyan">Reading and validating ${file.name} (${(file.size / 1024).toFixed(1)} KB)...</span>`;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      this.runClassificationOnText(content, file.name);
    };
    reader.onerror = () => {
      if (statusMsg) {
        statusMsg.innerHTML = `<span class="text-alert">Error reading file. Ensure it is a valid text CSV.</span>`;
      }
    };
    reader.readAsText(file);
  }

  private runClassificationOnText(csvText: string, datasetName: string): void {
    const statusMsg = document.getElementById('analyzer-status-msg');
    const result = MLTrafficClassifier.parseAndClassifyCSV(csvText);

    if (!result.success) {
      if (statusMsg) {
        statusMsg.style.display = 'block';
        statusMsg.innerHTML = `
          <div style="background: var(--danger-subtle); border: 1px solid rgba(239, 68, 68, 0.4); padding: 12px; border-radius: 6px; color: var(--danger);">
            <strong>Validation Error:</strong> ${result.errors.join('<br>')}
          </div>
        `;
      }
      return;
    }

    this.flows = result.records;

    const normalCount = result.records.filter((r) => r.predictedCategory === 'BENIGN').length;
    const suspCount = result.records.filter((r) => r.riskLevel === 'Medium' || r.riskLevel === 'High').length;
    const critCount = result.records.filter((r) => r.riskLevel === 'Critical').length;

    this.history.unshift({
      id: `SESS-2026-${Date.now().toString().slice(-4)}`,
      datasetName,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      recordCount: result.validRows,
      normalCount,
      suspiciousCount: suspCount,
      criticalCount: critCount,
      accuracyEstimate: 0.984,
      modelVersion: 'v2.4.1-cic',
      records: result.records,
    });

    if (statusMsg) {
      statusMsg.style.display = 'block';
      statusMsg.innerHTML = `
        <div style="background: var(--success-subtle); border: 1px solid rgba(16, 185, 129, 0.4); padding: 10px; border-radius: 6px; color: var(--success);">
          <strong>Analysis Complete:</strong> Successfully evaluated ${result.validRows} network records through NetShield Random Forest v2.5. Predictions updated below.
        </div>
      `;
    }

    const badge = document.getElementById('record-count-badge');
    if (badge) badge.textContent = `${result.validRows} Records`;

    const tbody = document.getElementById('analyzer-tbody');
    if (tbody) tbody.innerHTML = this.renderFlowRows(this.flows);

    const main = document.getElementById('main-view-container');
    if (main) this.attachFlowActionHandlers(main);
  }

  /* =============================================================
   * PAGE 4: LIVE MONITORING (REAL-TIME STREAMING & TIMELINE)
   * ============================================================= */
  private renderLiveMonitorPage(container: HTMLElement): void {
    container.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px; margin-bottom: 20px;">
        <div>
          <h1 style="font-size: 1.6rem; font-weight: 800;">Real-Time Network Traffic Monitor</h1>
          <p style="font-size: 0.84rem; color: var(--text-secondary);">Streaming event timeline and automated classification engine.</p>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <button class="btn ${this.isLiveStreaming ? 'btn-danger' : 'btn-primary'} btn-sm" id="btn-toggle-stream">
            ${this.isLiveStreaming ? icon('pause') : icon('play')}
            <span>${this.isLiveStreaming ? 'Pause Stream' : 'Resume Stream'}</span>
          </button>
          <button class="btn btn-secondary btn-sm" id="btn-reset-stream">${icon('stop')} Reset Counters</button>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px 20px; margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span class="pulse-dot"></span>
          <span style="font-weight: 700; font-size: 0.84rem; color: var(--accent-cyan);">CONTINUOUS INGRESS ACTIVE</span>
        </div>
        <div style="display: flex; align-items: center; gap: 16px; font-size: 0.82rem;">
          <span class="mono">Total Ingress Packets: <strong class="text-cyan" id="live-stream-packet-count">${this.livePacketsReceived.toLocaleString()}</strong></span>
          <span style="color: var(--border);">|</span>
          <span>Simulation Speed:</span>
          <select id="stream-speed-select" class="chat-input" style="padding: 4px 8px; font-size: 0.78rem; width: 75px;">
            <option value="1">1x</option>
            <option value="2">2x</option>
            <option value="5">5x</option>
          </select>
        </div>
      </div>

      <!-- Live Stream Table -->
      <section class="card">
        <div class="card-header">
          <h3 class="card-title">Live Ingress Event Stream</h3>
          <span class="badge badge-info">Auto-Refreshing (1200ms)</span>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Event ID</th>
                <th>Timestamp</th>
                <th>Source Address</th>
                <th>Destination Target</th>
                <th>Protocol</th>
                <th>Packet Throughput</th>
                <th>Classification</th>
                <th>Confidence</th>
                <th>Severity</th>
              </tr>
            </thead>
            <tbody id="live-stream-tbody">
              ${this.flows
                .slice(0, 12)
                .map((f) => this.renderStreamRowHTML(f))
                .join('')}
            </tbody>
          </table>
        </div>
      </section>
    `;

    document.getElementById('btn-toggle-stream')?.addEventListener('click', () => {
      this.isLiveStreaming = !this.isLiveStreaming;
      CyberAudioService.playClick();
      const btn = document.getElementById('btn-toggle-stream');
      if (btn) {
        btn.className = `btn ${this.isLiveStreaming ? 'btn-danger' : 'btn-primary'} btn-sm`;
        btn.innerHTML = `${this.isLiveStreaming ? icon('pause') : icon('play')} <span>${this.isLiveStreaming ? 'Pause Stream' : 'Resume Stream'}</span>`;
      }
    });

    document.getElementById('btn-reset-stream')?.addEventListener('click', () => {
      CyberAudioService.playClick();
      this.livePacketsReceived = 0;
      const counter = document.getElementById('live-stream-packet-count');
      if (counter) counter.textContent = '0';
    });

    document.getElementById('stream-speed-select')?.addEventListener('change', (e) => {
      this.streamSpeed = parseFloat((e.target as HTMLSelectElement).value) || 1;
      this.startLiveStream();
    });
  }

  private renderStreamRowHTML(f: NetworkFlowRecord): string {
    const sevBadge =
      f.riskLevel === 'Critical'
        ? '<span class="badge badge-critical">Critical</span>'
        : f.riskLevel === 'High'
        ? '<span class="badge badge-warning">High</span>'
        : f.riskLevel === 'Medium'
        ? '<span class="badge badge-info">Medium</span>'
        : '<span class="badge badge-success">Low</span>';

    return `
      <tr>
        <td class="mono font-bold text-cyan">${f.id}</td>
        <td class="mono" style="font-size: 0.75rem;">${f.timestamp.split(' ')[1] || f.timestamp}</td>
        <td class="mono">${f.sourceIp}:${f.sourcePort}</td>
        <td class="mono">${f.destinationIp}:${f.destinationPort}</td>
        <td style="font-weight: 600;">${f.protocol}</td>
        <td class="mono">${f.flowPacketsPerSec.toFixed(1)} pps</td>
        <td style="font-weight: 600;">${f.predictedCategory}</td>
        <td class="mono">${(f.confidence * 100).toFixed(1)}%</td>
        <td>${sevBadge}</td>
      </tr>
    `;
  }

  /* =============================================================
   * PAGE 5: DEDICATED DEMO SIMULATION LAB (SEPARATE WITH UNIQUE ICON)
   * ============================================================= */
  private renderSimulationLabPage(container: HTMLElement): void {
    container.innerHTML = `
      <!-- Simulation Hero Header -->
      <div class="simulation-hero-banner">
        <div>
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
            <div class="brand-logo-container" style="width: 36px; height: 36px; border-color: var(--accent-cyan);">
              ${icon('crosshair', 'w-4 h-4')}
            </div>
            <h1 style="font-size: 1.6rem; font-weight: 800;">Cyber Attack Simulation Lab</h1>
          </div>
          <p style="font-size: 0.84rem; color: var(--text-secondary);">
            Inject controlled adversarial intrusions, observe real-time packet throughput spikes, and evaluate autonomous ML defenses.
          </p>
        </div>

        <!-- Simulation Interactive Controls: Start, Pause, Resume, Reset -->
        <div class="sim-controls-toolbar">
          <button class="btn btn-primary btn-sm" id="sim-start-btn">
            ${icon('play')} Start Simulation
          </button>
          <button class="btn btn-secondary btn-sm" id="sim-pause-btn">
            ${icon('pause')} Pause
          </button>
          <button class="btn btn-secondary btn-sm" id="sim-resume-btn">
            ${icon('play')} Resume
          </button>
          <button class="btn btn-secondary btn-sm" id="sim-reset-btn">
            ${icon('rotate')} Reset
          </button>
          <div style="display: flex; align-items: center; gap: 6px; margin-left: 8px;">
            <span style="font-size: 0.75rem; color: var(--text-muted);">Speed:</span>
            <select id="sim-speed-select" class="chat-input" style="padding: 4px 8px; font-size: 0.75rem; width: 65px;">
              <option value="1">1x</option>
              <option value="2">2x</option>
              <option value="5">5x</option>
              <option value="10">10x</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Live Animated Telemetry Visualization (Canvas Waveform + Threat Gauge) -->
      <div class="sim-telemetry-grid">
        <div class="card">
          <div class="card-header">
            <div class="card-title-group">
              <span class="pulse-dot ${this.simThreatIndex > 50 ? 'critical' : ''}"></span>
              <h3 class="card-title">Live Ingress Packet Throughput Waveform</h3>
            </div>
            <span class="mono text-cyan" id="sim-packet-rate-display">440 pps</span>
          </div>
          <div class="sim-canvas-box">
            <canvas id="sim-waveform-canvas"></canvas>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 0.75rem; color: var(--text-muted);">
            <span>-30s History</span>
            <span class="mono" id="sim-active-attack-label">Status: ${this.simActiveAttack ? `Attack [${this.simActiveAttack}] Active` : 'Baseline Clean Traffic'}</span>
            <span>Live T = 0</span>
          </div>
        </div>

        <!-- Threat Index Gauge & Status Readouts -->
        <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
          <div class="card-header">
            <h3 class="card-title">Threat Index Meter</h3>
            <span class="badge ${this.simThreatIndex > 60 ? 'badge-critical' : this.simThreatIndex > 30 ? 'badge-warning' : 'badge-success'}" id="sim-threat-level-badge">
              ${this.simThreatIndex > 60 ? 'HIGH THREAT' : this.simThreatIndex > 30 ? 'ELEVATED' : 'NOMINAL'}
            </span>
          </div>

          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 12px 0;">
            <div style="font-size: 3.2rem; font-weight: 800; font-family: var(--font-mono); color: ${this.simThreatIndex > 60 ? 'var(--danger)' : this.simThreatIndex > 30 ? 'var(--warning)' : 'var(--success)'};" id="sim-threat-index-num">
              ${this.simThreatIndex}
            </div>
            <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">Intrusion Severity Index (0 - 100)</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 8px; font-size: 0.8rem; border-top: 1px solid var(--border); padding-top: 12px;">
            <div style="display: flex; justify-content: space-between;">
              <span class="text-muted">Simulated Packets:</span>
              <span class="mono font-bold" id="sim-total-pkts">${this.simPacketsProcessed.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span class="text-muted">Active Mitigations:</span>
              <span class="mono text-cyan" id="sim-active-mitigation">${this.simThreatIndex > 50 ? 'Firewall Rate-Limit Triggered' : 'Normal Inspection'}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span class="text-muted">Inspection Engine:</span>
              <span class="mono text-success">Random Forest v2.5</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Attack Scenarios Injection Cards -->
      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 12px;">Interactive Attack Scenario Injectors</h3>
        <div class="attack-scenarios-grid">
          <div class="attack-scenario-card">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span class="badge badge-critical">CRITICAL</span>
                <span class="mono" style="font-size: 0.72rem; color: var(--text-muted);">Port 80/443</span>
              </div>
              <strong style="font-size: 0.95rem;">DoS-Hulk (HTTP Flood)</strong>
              <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">
                Floods web servers with high-frequency HTTP requests and anomalous TCP reset flags.
              </p>
            </div>
            <button class="btn btn-danger btn-sm sim-inject-btn" data-cat="DoS-Hulk">
              ${icon('crosshair', 'w-3.5 h-3.5')} Inject DoS-Hulk
            </button>
          </div>

          <div class="attack-scenario-card">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span class="badge badge-critical">CRITICAL</span>
                <span class="mono" style="font-size: 0.72rem; color: var(--text-muted);">SYN Flood</span>
              </div>
              <strong style="font-size: 0.95rem;">DDoS-LOIC (Volumetric)</strong>
              <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">
                Massive packet storm with zero backward handshakes designed to exhaust bandwidth.
              </p>
            </div>
            <button class="btn btn-danger btn-sm sim-inject-btn" data-cat="DDoS-LOIC">
              ${icon('crosshair', 'w-3.5 h-3.5')} Inject DDoS-LOIC
            </button>
          </div>

          <div class="attack-scenario-card">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span class="badge badge-warning">MEDIUM</span>
                <span class="mono" style="font-size: 0.72rem; color: var(--text-muted);">SYN Sweep</span>
              </div>
              <strong style="font-size: 0.95rem;">Reconnaissance PortScan</strong>
              <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">
                Sequential polling of ports 21, 22, 80, 443 across subnet within 150ms window.
              </p>
            </div>
            <button class="btn btn-secondary btn-sm sim-inject-btn" data-cat="PortScan" style="border-color: var(--warning); color: var(--warning);">
              ${icon('search', 'w-3.5 h-3.5')} Inject PortScan
            </button>
          </div>

          <div class="attack-scenario-card">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span class="badge badge-warning">HIGH</span>
                <span class="mono" style="font-size: 0.72rem; color: var(--text-muted);">Port 22</span>
              </div>
              <strong style="font-size: 0.95rem;">SSH-BruteForce Attack</strong>
              <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">
                High-frequency authentication handshakes and reset bursts targeting SSH Bastion.
              </p>
            </div>
            <button class="btn btn-secondary btn-sm sim-inject-btn" data-cat="SSH-BruteForce" style="border-color: var(--warning); color: var(--warning);">
              ${icon('terminal', 'w-3.5 h-3.5')} Inject BruteForce
            </button>
          </div>

          <div class="attack-scenario-card">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span class="badge badge-critical">CRITICAL</span>
                <span class="mono" style="font-size: 0.72rem; color: var(--text-muted);">C2 Beacon</span>
              </div>
              <strong style="font-size: 0.95rem;">Mirai / Ares Botnet</strong>
              <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">
                Periodic telemetry heartbeats to external Command & Control host.
              </p>
            </div>
            <button class="btn btn-danger btn-sm sim-inject-btn" data-cat="Botnet-Ares">
              ${icon('network', 'w-3.5 h-3.5')} Inject Botnet
            </button>
          </div>

          <div class="attack-scenario-card">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span class="badge badge-success">BENIGN</span>
                <span class="mono" style="font-size: 0.72rem; color: var(--text-muted);">Clean Traffic</span>
              </div>
              <strong style="font-size: 0.95rem;">Normal Enterprise Flow</strong>
              <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">
                Standard HTTPS browsing, DNS queries, and microservices verifying low false positives.
              </p>
            </div>
            <button class="btn btn-secondary btn-sm sim-inject-btn" data-cat="BENIGN" style="border-color: var(--success); color: var(--success);">
              ${icon('check', 'w-3.5 h-3.5')} Inject Benign
            </button>
          </div>
        </div>
      </div>

      <!-- Real-Time Attack Ingress Console Log -->
      <section class="card" style="margin-bottom: 24px;">
        <div class="card-header">
          <h3 class="card-title">Live Attack Ingress & Mitigation Log</h3>
          <span class="badge badge-info" id="sim-log-count">${this.simLogHistory.length} Events</span>
        </div>
        <div id="sim-console-feed" style="background: var(--bg-primary); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 14px; font-family: var(--font-mono); font-size: 0.78rem; max-height: 200px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px;">
          ${this.simLogHistory
            .map((item) => {
              const colorCls = item.type === 'alert' ? 'text-alert' : item.type === 'success' ? 'text-success' : 'text-cyan';
              return `<div><span class="text-muted">[${item.time}]</span> <span class="${colorCls}">${item.text}</span></div>`;
            })
            .join('')}
        </div>
      </section>

      <!-- Clear 4-Step Explanation of How the System Works -->
      <section class="card">
        <div class="card-header">
          <h3 class="card-title">How NetShield AI Works (4-Stage Pipeline)</h3>
          <span class="badge badge-info">Architecture Walkthrough</span>
        </div>
        <div class="pipeline-steps-flow">
          <div class="pipeline-step-box">
            <span class="pipeline-step-num">STAGE 01</span>
            <strong style="font-size: 0.88rem;">Network Ingress & Capture</strong>
            <p style="font-size: 0.75rem; color: var(--text-secondary);">
              Packets intercepted by eBPF probes or sensor mirrors across enterprise edge gateways.
            </p>
          </div>
          <div class="pipeline-step-box">
            <span class="pipeline-step-num">STAGE 02</span>
            <strong style="font-size: 0.88rem;">8-Feature Vectorization</strong>
            <p style="font-size: 0.75rem; color: var(--text-secondary);">
              Extracts Flow Duration, Forward/Backward Packets, Byte Throughput, IAT Mean, and TCP Flags.
            </p>
          </div>
          <div class="pipeline-step-box">
            <span class="pipeline-step-num">STAGE 03</span>
            <strong style="font-size: 0.88rem;">Random Forest Inference</strong>
            <p style="font-size: 0.75rem; color: var(--text-secondary);">
              Ensemble of 100 decision trees trained on CIC-IDS2017 evaluates flow probability & confidence.
            </p>
          </div>
          <div class="pipeline-step-box">
            <span class="pipeline-step-num">STAGE 04</span>
            <strong style="font-size: 0.88rem;">Triage & Autonomous Defense</strong>
            <p style="font-size: 0.75rem; color: var(--text-secondary);">
              Dispatches SIEM alerts, triggers IP null-routing, and prompts Gemini AI for remediation guidance.
            </p>
          </div>
        </div>
      </section>
    `;

    // Attach simulation toolbar controls
    document.getElementById('sim-start-btn')?.addEventListener('click', () => {
      this.startSimulationLoop();
      CyberAudioService.playClick();
    });

    document.getElementById('sim-pause-btn')?.addEventListener('click', () => {
      this.pauseSimulationLoop();
      CyberAudioService.playClick();
    });

    document.getElementById('sim-resume-btn')?.addEventListener('click', () => {
      this.startSimulationLoop();
      CyberAudioService.playClick();
    });

    document.getElementById('sim-reset-btn')?.addEventListener('click', () => {
      this.resetSimulationState();
      CyberAudioService.playClick();
    });

    document.getElementById('sim-speed-select')?.addEventListener('change', (e) => {
      this.simSpeed = parseFloat((e.target as HTMLSelectElement).value) || 1;
      if (this.isSimulationRunning) {
        this.startSimulationLoop();
      }
    });

    // Attach scenario injectors
    container.querySelectorAll('.sim-inject-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-cat') as TrafficCategory;
        if (cat) {
          this.injectAttackScenario(cat, 2);
        }
      });
    });

    // Draw initial waveform canvas
    this.drawSimWaveform();
  }

  private startSimulationLoop(): void {
    if (this.simIntervalId) clearInterval(this.simIntervalId);
    this.isSimulationRunning = true;
    this.simIntervalId = window.setInterval(() => {
      this.simPacketsProcessed += Math.floor(65 * this.simSpeed);
      // Decay or fluctuate threat index towards baseline if no active attack
      if (this.simThreatIndex > 18) {
        this.simThreatIndex -= 2;
      } else {
        this.simThreatIndex = 12 + Math.floor(Math.random() * 8);
        this.simActiveAttack = null;
      }
      this.simWavePoints.push(this.simThreatIndex > 40 ? 50 + Math.random() * 40 : 15 + Math.random() * 10);
      if (this.simWavePoints.length > 35) this.simWavePoints.shift();

      this.updateSimulationViews();
      this.drawSimWaveform();
    }, 800 / this.simSpeed);
  }

  private pauseSimulationLoop(): void {
    if (this.simIntervalId) {
      clearInterval(this.simIntervalId);
      this.simIntervalId = null;
    }
    this.isSimulationRunning = false;
  }

  private resetSimulationState(): void {
    this.pauseSimulationLoop();
    this.simThreatIndex = 14;
    this.simPacketsProcessed = 0;
    this.simActiveAttack = null;
    this.simWavePoints = Array(35).fill(15);
    this.simLogHistory = [
      { time: new Date().toLocaleTimeString(), text: 'Simulation engine reset to baseline.', type: 'info' },
    ];
    this.updateSimulationViews();
    this.drawSimWaveform();
  }

  private updateSimulationViews(): void {
    const rateEl = document.getElementById('sim-packet-rate-display');
    const threatNumEl = document.getElementById('sim-threat-index-num');
    const badgeEl = document.getElementById('sim-threat-level-badge');
    const pktsEl = document.getElementById('sim-total-pkts');
    const mitEl = document.getElementById('sim-active-mitigation');
    const attackLabel = document.getElementById('sim-active-attack-label');
    const feed = document.getElementById('sim-console-feed');

    if (rateEl) rateEl.textContent = `${Math.floor(this.simThreatIndex * 12 + 200)} pps`;
    if (threatNumEl) {
      threatNumEl.textContent = this.simThreatIndex.toString();
      threatNumEl.style.color = this.simThreatIndex > 60 ? 'var(--danger)' : this.simThreatIndex > 30 ? 'var(--warning)' : 'var(--success)';
    }
    if (badgeEl) {
      badgeEl.className = `badge ${this.simThreatIndex > 60 ? 'badge-critical' : this.simThreatIndex > 30 ? 'badge-warning' : 'badge-success'}`;
      badgeEl.textContent = this.simThreatIndex > 60 ? 'HIGH THREAT' : this.simThreatIndex > 30 ? 'ELEVATED' : 'NOMINAL';
    }
    if (pktsEl) pktsEl.textContent = this.simPacketsProcessed.toLocaleString();
    if (mitEl) mitEl.textContent = this.simThreatIndex > 50 ? 'Firewall Rate-Limit Triggered' : 'Normal Inspection';
    if (attackLabel) attackLabel.textContent = `Status: ${this.simActiveAttack ? `Attack [${this.simActiveAttack}] Active` : 'Baseline Clean Traffic'}`;

    if (feed) {
      feed.innerHTML = this.simLogHistory
        .map((item) => {
          const colorCls = item.type === 'alert' ? 'text-alert' : item.type === 'success' ? 'text-success' : 'text-cyan';
          return `<div><span class="text-muted">[${item.time}]</span> <span class="${colorCls}">${item.text}</span></div>`;
        })
        .join('');
      feed.scrollTop = 0;
    }
  }

  private drawSimWaveform(): void {
    const canvas = document.getElementById('sim-waveform-canvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);

    // Draw background grid lines
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.lineWidth = 1;
    for (let y = 20; y < h; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Draw dynamic waveform
    ctx.beginPath();
    const step = w / (this.simWavePoints.length - 1);
    this.simWavePoints.forEach((val, idx) => {
      const x = idx * step;
      // map val (10 to 100) to y
      const y = h - (val / 100) * (h - 30) - 15;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    const isHigh = this.simThreatIndex > 50;
    ctx.strokeStyle = isHigh ? '#ef4444' : '#22d3ee';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = isHigh ? 'rgba(239, 68, 68, 0.5)' : 'rgba(34, 211, 238, 0.4)';
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Gradient fill under wave
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, isHigh ? 'rgba(239, 68, 68, 0.25)' : 'rgba(34, 211, 238, 0.18)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fill();
  }

  /* =============================================================
   * PAGE 6: ANALYTICS (MODEL METRICS, ROC-AUC, CONFUSION MATRIX)
   * ============================================================= */
  private renderAnalyticsPage(container: HTMLElement): void {
    container.innerHTML = `
      <div style="margin-bottom: 20px;">
        <h1 style="font-size: 1.6rem; font-weight: 800;">Machine Learning Evaluation & Analytics</h1>
        <p style="font-size: 0.84rem; color: var(--text-secondary);">Benchmark metrics evaluated on the Canadian Institute for Cybersecurity (CIC-IDS2017) dataset.</p>
      </div>

      <!-- Core Performance Metric Cards -->
      <section class="kpi-grid">
        <div class="kpi-card kpi-success">
          <div class="kpi-top">
            <span class="kpi-label">Model Accuracy</span>
            <div class="kpi-icon">${icon('check')}</div>
          </div>
          <span class="kpi-val">${(this.metrics.accuracy * 100).toFixed(2)}%</span>
          <span class="kpi-desc text-muted">Test Split (56,840 flows)</span>
        </div>
        <div class="kpi-card kpi-blue">
          <div class="kpi-top">
            <span class="kpi-label">Precision Rate</span>
            <div class="kpi-icon">${icon('crosshair')}</div>
          </div>
          <span class="kpi-val">${(this.metrics.precision * 100).toFixed(2)}%</span>
          <span class="kpi-desc text-muted">Low False Positive Bias</span>
        </div>
        <div class="kpi-card kpi-warning">
          <div class="kpi-top">
            <span class="kpi-label">Recall Rate</span>
            <div class="kpi-icon">${icon('alert')}</div>
          </div>
          <span class="kpi-val">${(this.metrics.recall * 100).toFixed(2)}%</span>
          <span class="kpi-desc text-muted">Threat Infiltration Coverage</span>
        </div>
        <div class="kpi-card kpi-success">
          <div class="kpi-top">
            <span class="kpi-label">Macro F1-Score</span>
            <div class="kpi-icon">${icon('barchart')}</div>
          </div>
          <span class="kpi-val">${(this.metrics.f1Score * 100).toFixed(2)}%</span>
          <span class="kpi-desc text-muted">Balanced Class Harmonic Mean</span>
        </div>
      </section>

      <!-- Confusion Matrix & Feature Importances Grid -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Normalized Confusion Matrix</h3>
            <span class="badge badge-info">Evaluation Dataset</span>
          </div>
          <div class="table-container">
            <table class="data-table" style="text-align: center;">
              <thead>
                <tr>
                  <th style="text-align: left;">Actual \\ Pred</th>
                  <th>BENIGN</th>
                  <th>DoS-Hulk</th>
                  <th>PortScan</th>
                  <th>DDoS-LOIC</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="text-align: left; font-weight: 700;">BENIGN</td>
                  <td class="mono font-bold text-success" style="background: rgba(16, 185, 129, 0.12);">98.8%</td>
                  <td class="mono text-muted">0.4%</td>
                  <td class="mono text-muted">0.6%</td>
                  <td class="mono text-muted">0.2%</td>
                </tr>
                <tr>
                  <td style="text-align: left; font-weight: 700;">DoS-Hulk</td>
                  <td class="mono text-muted">0.8%</td>
                  <td class="mono font-bold text-cyan" style="background: rgba(34, 211, 238, 0.12);">97.9%</td>
                  <td class="mono text-muted">0.5%</td>
                  <td class="mono text-muted">0.8%</td>
                </tr>
                <tr>
                  <td style="text-align: left; font-weight: 700;">PortScan</td>
                  <td class="mono text-muted">1.1%</td>
                  <td class="mono text-muted">0.2%</td>
                  <td class="mono font-bold text-cyan" style="background: rgba(34, 211, 238, 0.12);">98.1%</td>
                  <td class="mono text-muted">0.6%</td>
                </tr>
                <tr>
                  <td style="text-align: left; font-weight: 700;">DDoS-LOIC</td>
                  <td class="mono text-muted">0.3%</td>
                  <td class="mono text-muted">0.9%</td>
                  <td class="mono text-muted">0.4%</td>
                  <td class="mono font-bold text-cyan" style="background: rgba(34, 211, 238, 0.12);">98.4%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 8-Feature Vector Weights Bar Chart -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Top Predictive Feature Importances</h3>
            <span class="badge badge-info">Random Forest Gini</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 3px;">
                <span>Flow Duration (ms)</span>
                <span class="mono">0.245</span>
              </div>
              <div style="background: var(--bg-secondary); height: 6px; border-radius: 3px; overflow: hidden;">
                <div style="width: 82%; background: var(--accent-cyan); height: 100%;"></div>
              </div>
            </div>
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 3px;">
                <span>Total Backward Packets (TCP Handshake)</span>
                <span class="mono">0.218</span>
              </div>
              <div style="background: var(--bg-secondary); height: 6px; border-radius: 3px; overflow: hidden;">
                <div style="width: 74%; background: var(--accent-cyan); height: 100%;"></div>
              </div>
            </div>
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 3px;">
                <span>Flow Packets Per Second</span>
                <span class="mono">0.185</span>
              </div>
              <div style="background: var(--bg-secondary); height: 6px; border-radius: 3px; overflow: hidden;">
                <div style="width: 62%; background: var(--accent-cyan); height: 100%;"></div>
              </div>
            </div>
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 3px;">
                <span>TCP Reset (RST) Flag Ratio</span>
                <span class="mono">0.142</span>
              </div>
              <div style="background: var(--bg-secondary); height: 6px; border-radius: 3px; overflow: hidden;">
                <div style="width: 48%; background: var(--accent-cyan); height: 100%;"></div>
              </div>
            </div>
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 3px;">
                <span>Destination Port Profile</span>
                <span class="mono">0.110</span>
              </div>
              <div style="background: var(--bg-secondary); height: 6px; border-radius: 3px; overflow: hidden;">
                <div style="width: 38%; background: var(--accent-cyan); height: 100%;"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /* =============================================================
   * PAGE 7: ABOUT PROJECT (DETAILED ARCHITECTURE & DOCUMENTATION)
   * ============================================================= */
  private renderAboutPage(container: HTMLElement): void {
    container.innerHTML = `
      <div class="card" style="padding: 32px; max-width: 1020px; margin: 0 auto;">
        <!-- Header & Branding -->
        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid var(--border);">
          <div class="brand-logo-container" style="width: 52px; height: 52px;">
            ${getBrandLogoSVG()}
          </div>
          <div>
            <h1 style="font-size: 1.8rem; font-weight: 800;">NetShield AI</h1>
            <p style="font-size: 0.88rem; color: var(--accent-cyan); font-weight: 600;">
              AI-Powered Network Intrusion Detection & Threat Intelligence System
            </p>
            <span style="font-size: 0.78rem; color: var(--text-muted);">
              Detect Threats. Monitor Traffic. Secure Networks.
            </span>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 24px; font-size: 0.9rem; color: var(--text-secondary); line-height: 1.65;">
          <!-- 1. Project Introduction -->
          <div>
            <h2 style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">1. Project Overview</h2>
            <p>
              <strong>NetShield AI</strong> is an enterprise-grade AI-powered cybersecurity platform engineered to monitor network traffic, detect adversarial intrusions, and provide actionable security insights through an interactive dashboard. The platform incorporates trained Machine Learning algorithms, 3D WebGL network topology visualization, global sensor probes, and an AI Cybersecurity Assistant to explain detections and recommend defensive playbooks.
            </p>
          </div>

          <!-- 2. Problem Statement -->
          <div>
            <h2 style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">2. Problem Statement</h2>
            <p>
              Modern enterprise backbones generate hundreds of thousands of network packets per second. Conventional signature-based Intrusion Detection Systems (IDS) frequently fail when encountering novel zero-day patterns, polymorphic malware, or encrypted high-speed traffic. Furthermore, poorly calibrated legacy rules overwhelm security operation centers (SOC) with excessive false positives, causing analyst fatigue. Organizations urgently require an automated, intelligent solution that classifies multi-dimensional flow metrics, visualizes anomalies spatially, and explains mitigation steps clearly.
            </p>
          </div>

          <!-- 3. Proposed Solution -->
          <div>
            <h2 style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">3. Proposed Solution</h2>
            <p>
              NetShield AI combines supervised Random Forest machine learning with explainable AI copilot reasoning and interactive 3D spatial visualization. By normalizing network flows into an 8-dimensional feature vector (duration, packet rates, byte volumes, and TCP flag entropy), NetShield achieves a 98.42% accuracy benchmark on the gold-standard CIC-IDS2017 dataset with sub-2ms inference latency.
            </p>
          </div>

          <!-- 4. System Architecture Diagram -->
          <div>
            <h2 style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin-bottom: 12px;">4. System Architecture</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; background: var(--bg-secondary); padding: 18px; border-radius: var(--radius-md); border: 1px solid var(--border);">
              <div style="border: 1px solid var(--border); padding: 12px; border-radius: 6px; background: var(--bg-card);">
                <strong style="color: var(--accent-cyan); font-size: 0.8rem;">LAYER 1</strong>
                <h4 style="font-size: 0.88rem; margin: 4px 0;">Packet Capture</h4>
                <p style="font-size: 0.72rem; color: var(--text-muted);">eBPF probes, pcap tap & NetFlow CSV ingress.</p>
              </div>
              <div style="border: 1px solid var(--border); padding: 12px; border-radius: 6px; background: var(--bg-card);">
                <strong style="color: var(--accent-cyan); font-size: 0.8rem;">LAYER 2</strong>
                <h4 style="font-size: 0.88rem; margin: 4px 0;">Feature Engine</h4>
                <p style="font-size: 0.72rem; color: var(--text-muted);">8-feature vector extraction & normalization.</p>
              </div>
              <div style="border: 1px solid var(--border); padding: 12px; border-radius: 6px; background: var(--bg-card);">
                <strong style="color: var(--accent-cyan); font-size: 0.8rem;">LAYER 3</strong>
                <h4 style="font-size: 0.88rem; margin: 4px 0;">Random Forest</h4>
                <p style="font-size: 0.72rem; color: var(--text-muted);">CIC-IDS2017 multi-class decision trees.</p>
              </div>
              <div style="border: 1px solid var(--border); padding: 12px; border-radius: 6px; background: var(--bg-card);">
                <strong style="color: var(--accent-cyan); font-size: 0.8rem;">LAYER 4</strong>
                <h4 style="font-size: 0.88rem; margin: 4px 0;">Gemini AI Copilot</h4>
                <p style="font-size: 0.72rem; color: var(--text-muted);">Automated forensic triage & mitigation.</p>
              </div>
              <div style="border: 1px solid var(--border); padding: 12px; border-radius: 6px; background: var(--bg-card);">
                <strong style="color: var(--accent-cyan); font-size: 0.8rem;">LAYER 5</strong>
                <h4 style="font-size: 0.88rem; margin: 4px 0;">3D SOC Dashboard</h4>
                <p style="font-size: 0.72rem; color: var(--text-muted);">Interactive topology, globe & telemetry.</p>
              </div>
            </div>
          </div>

          <!-- 5. Technology Stack -->
          <div>
            <h2 style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin-bottom: 10px;">5. Technology Stack</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px;">
              <div class="card" style="padding: 12px;">
                <strong style="color: var(--accent-cyan); font-size: 0.82rem;">Frontend & 3D WebGL</strong>
                <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">Three.js, Vanilla TypeScript, ACESFilmic Tone Mapping, SVG Projections.</p>
              </div>
              <div class="card" style="padding: 12px;">
                <strong style="color: var(--accent-cyan); font-size: 0.82rem;">Machine Learning</strong>
                <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">Random Forest Ensemble Classifier trained on CIC-IDS2017 dataset.</p>
              </div>
              <div class="card" style="padding: 12px;">
                <strong style="color: var(--accent-cyan); font-size: 0.82rem;">Generative Intelligence</strong>
                <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">Google Gemini 2.5 Flash via official <code>@google/genai</code> SDK.</p>
              </div>
              <div class="card" style="padding: 12px;">
                <strong style="color: var(--accent-cyan); font-size: 0.82rem;">Audio & Telemetry</strong>
                <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">Web Audio API native cyber sound synthesizer & Canvas telemetry graphs.</p>
              </div>
            </div>
          </div>

          <!-- 6. Real-World Applications -->
          <div>
            <h2 style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">6. Real-World Applications</h2>
            <ul style="padding-left: 20px; display: flex; flex-direction: column; gap: 6px;">
              <li><strong>Cloud Enterprise Data Centers:</strong> Continuous flow monitoring across AWS, GCP, and Azure virtual networks.</li>
              <li><strong>Financial Services & Fintech:</strong> High-speed detection of credential brute-force attacks and volumetric DDoS.</li>
              <li><strong>Critical Infrastructure:</strong> Protection of SCADA and industrial IoT control subnets from reconnaissance sweeps.</li>
              <li><strong>Defense & Government Networks:</strong> Rapid attribution of malicious botnet command-and-control beaconing.</li>
            </ul>
          </div>

          <!-- 7. Future Scope -->
          <div>
            <h2 style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">7. Future Scope & Roadmap</h2>
            <p>
              Planned expansions include <strong>eBPF kernel-level hardware packet capture</strong> for wire-speed line monitoring, <strong>Software Defined Networking (SDN) automated quarantine</strong>, federated edge model retraining without raw payload transmission, and quantum-resistant cryptographic validation for sensor probe communication.
            </p>
          </div>
        </div>
      </div>
    `;
  }

  /* =============================================================
   * SUB-VIEW PAGES FOR 3D TOPOLOGY, SENSOR MAP, THREATS, ALERTS, REPORTS
   * ============================================================= */
  private renderTopologyPage(container: HTMLElement): void {
    container.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px; margin-bottom: 16px;">
        <div>
          <h2 style="font-size: 1.3rem; font-weight: 800;">3D Network Topology Command Center</h2>
          <p style="font-size: 0.82rem; color: var(--text-secondary);">Interactive WebGL rendering of enterprise infrastructure, routers, and traffic flows.</p>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-secondary btn-sm" id="topo-reset-cam">Reset View</button>
          <button class="btn btn-secondary btn-sm" id="topo-toggle-2d">${icon('layout')} Toggle 2D/3D</button>
          <button class="btn btn-secondary btn-sm" id="topo-filter-anomaly">${icon('alert')} Filter Anomalies</button>
        </div>
      </div>

      <div style="position: relative; width: 100%; height: 520px; background: #080d18; border-radius: var(--radius-lg); border: 1px solid var(--border); overflow: hidden;">
        <div id="three-topology-mount" style="width: 100%; height: 100%;"></div>

        <!-- Node Inspector Drawer Overlay -->
        <div id="topo-inspector-panel" style="position: absolute; top: 16px; right: 16px; width: 280px; background: rgba(15, 23, 42, 0.92); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px; backdrop-filter: blur(8px); display: none;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <h4 style="font-size: 0.92rem; font-weight: 700;" id="insp-node-name">Select Node</h4>
            <span class="badge badge-info" id="insp-node-status">HEALTHY</span>
          </div>
          <div style="font-size: 0.78rem; display: flex; flex-direction: column; gap: 6px;">
            <div><span class="text-muted">IP Address:</span> <span class="mono" id="insp-node-ip">-</span></div>
            <div><span class="text-muted">Bandwidth:</span> <span class="mono" id="insp-node-bw">-</span></div>
            <div><span class="text-muted">Packet Rate:</span> <span class="mono" id="insp-node-pkts">-</span></div>
            <div><span class="text-muted">Connections:</span> <span class="mono" id="insp-node-conn">-</span></div>
            <div style="margin-top: 4px; padding-top: 6px; border-top: 1px solid var(--border);" id="insp-node-desc">Click any node to inspect.</div>
          </div>
        </div>

        <div style="position: absolute; bottom: 12px; left: 16px; font-size: 0.72rem; color: var(--text-muted); background: rgba(0,0,0,0.6); padding: 4px 8px; border-radius: 4px;">
          Left-click drag to orbit • Right-click drag to pan • Click node to inspect
        </div>
      </div>
    `;

    const mount = document.getElementById('three-topology-mount');
    if (mount) {
      this.topologySceneInstance = new ThreeTopologyScene(
        mount,
        this.nodes,
        this.edges,
        (node) => {
          this.selectedTopologyNode = node;
          const panel = document.getElementById('topo-inspector-panel');
          if (panel) {
            panel.style.display = 'block';
            const nameEl = document.getElementById('insp-node-name');
            const ipEl = document.getElementById('insp-node-ip');
            const bwEl = document.getElementById('insp-node-bw');
            const pktsEl = document.getElementById('insp-node-pkts');
            const connEl = document.getElementById('insp-node-conn');
            const statusEl = document.getElementById('insp-node-status');
            const descEl = document.getElementById('insp-node-desc');

            if (nameEl) nameEl.textContent = node.name;
            if (ipEl) ipEl.textContent = `${node.ip} (${node.type.toUpperCase()})`;
            if (bwEl) bwEl.textContent = `${node.bandwidthMbps} Mbps`;
            if (pktsEl) pktsEl.textContent = `${node.packetsInPerSec.toLocaleString()} pps`;
            if (connEl) connEl.textContent = `${node.connections} links`;
            if (statusEl) {
              statusEl.className = `badge badge-${node.status === 'critical' ? 'critical' : node.status === 'suspicious' ? 'warning' : 'success'}`;
              statusEl.textContent = node.status.toUpperCase();
            }
            if (descEl) descEl.textContent = node.description;
          }
        }
      );
    }

    document.getElementById('topo-reset-cam')?.addEventListener('click', () => {
      this.topologySceneInstance?.resetCamera();
    });
    document.getElementById('topo-toggle-2d')?.addEventListener('click', () => {
      this.topologySceneInstance?.toggle2D3D();
    });
    document.getElementById('topo-filter-anomaly')?.addEventListener('click', () => {
      this.topologySceneInstance?.toggleAnomalyFilter();
    });
  }

  private renderSensorMapPage(container: HTMLElement): void {
    container.innerHTML = `
      <div style="margin-bottom: 16px;">
        <h2 style="font-size: 1.3rem; font-weight: 800;">Geographic Sensor Mapping & Telemetry</h2>
        <p style="font-size: 0.82rem; color: var(--text-secondary);">Physical sensor locations intercepting global distributed network traffic.</p>
      </div>
      <div id="sensor-map-mount"></div>
    `;

    const mount = document.getElementById('sensor-map-mount');
    if (mount) {
      this.sensorMapInstance = new SensorMapVisualizer(mount, this.sensors);
    }
  }

  private renderThreatsPage(container: HTMLElement): void {
    container.innerHTML = `
      <div style="margin-bottom: 16px;">
        <h2 style="font-size: 1.3rem; font-weight: 800;">Threat Intelligence Matrix</h2>
        <p style="font-size: 0.82rem; color: var(--text-secondary);">MITRE ATT&CK adversary techniques, forensic descriptions, and containment recommendations.</p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(310px, 1fr)); gap: 16px;">
        ${this.alerts
          .map((alt) => {
            const sevBadge =
              alt.severity === 'Critical'
                ? '<span class="badge badge-critical">CRITICAL</span>'
                : '<span class="badge badge-warning">HIGH</span>';
            return `
              <div class="card" style="display: flex; flex-direction: column; gap: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span class="mono font-bold text-cyan">${alt.id}</span>
                  ${sevBadge}
                </div>
                <div>
                  <h3 style="font-size: 1.05rem; font-weight: 700;">${alt.category}</h3>
                  <span class="mono text-muted" style="font-size: 0.72rem;">${alt.mitreTechnique}</span>
                </div>
                <p style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.5; flex: 1;">
                  ${alt.description}
                </p>
                <div style="background: var(--bg-secondary); padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border); font-size: 0.75rem;">
                  <div class="mono"><strong>Target:</strong> ${alt.destinationIp}:${alt.destinationPort}</div>
                  <div class="mono"><strong>Attacker:</strong> ${alt.sourceIp}:${alt.sourcePort}</div>
                </div>
                <div style="display: flex; gap: 8px; margin-top: 6px;">
                  <button class="btn btn-secondary btn-sm inspect-alert-btn" data-id="${alt.id}" style="flex: 1;">
                    Forensic Details
                  </button>
                  <button class="btn btn-primary btn-sm ask-ai-alert-btn" data-id="${alt.id}">
                    Ask AI
                  </button>
                </div>
              </div>
            `;
          })
          .join('')}
      </div>
    `;

    container.querySelectorAll('.inspect-alert-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const found = this.alerts.find((a) => a.id === id);
        if (found) this.openAlertDetailModal(found);
      });
    });

    container.querySelectorAll('.ask-ai-alert-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const found = this.alerts.find((a) => a.id === id);
        if (found) {
          this.isFloatingChatOpen = true;
          const drawer = document.getElementById('floating-chat-drawer');
          if (drawer) drawer.classList.add('open');
          const input = document.getElementById('floating-chat-input') as HTMLInputElement | null;
          if (input) {
            input.value = `Explain why alert ${found.id} (${found.category}) was flagged and recommend mitigation steps.`;
            this.handleFloatingChatSend();
          }
        }
      });
    });
  }

  private renderAlertsPage(container: HTMLElement): void {
    container.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px; margin-bottom: 16px;">
        <div>
          <h2 style="font-size: 1.3rem; font-weight: 800;">Security Alerts Incident Queue</h2>
          <p style="font-size: 0.82rem; color: var(--text-secondary);">Triage, acknowledge, and resolve high-priority intrusion alarms.</p>
        </div>
        <div>
          <button class="btn btn-secondary btn-sm" id="btn-ack-all-alerts">${icon('check')} Acknowledge All</button>
        </div>
      </div>

      <section class="card">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Alert ID</th>
                <th>Time</th>
                <th>Category</th>
                <th>Severity</th>
                <th>Source IP</th>
                <th>Target IP</th>
                <th>Confidence</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${this.alerts
                .map((alt) => {
                  const sevBadge =
                    alt.severity === 'Critical'
                      ? '<span class="badge badge-critical">CRITICAL</span>'
                      : '<span class="badge badge-warning">HIGH</span>';
                  const statBadge =
                    alt.status === 'New'
                      ? '<span class="badge badge-critical">New</span>'
                      : '<span class="badge badge-success">Closed</span>';
                  return `
                    <tr>
                      <td class="mono font-bold text-cyan">${alt.id}</td>
                      <td class="mono" style="font-size: 0.75rem;">${alt.timestamp}</td>
                      <td style="font-weight: 600;">${alt.category}</td>
                      <td>${sevBadge}</td>
                      <td class="mono">${alt.sourceIp}:${alt.sourcePort}</td>
                      <td class="mono">${alt.destinationIp}:${alt.destinationPort}</td>
                      <td class="mono">${(alt.confidence * 100).toFixed(1)}%</td>
                      <td>${statBadge}</td>
                      <td>
                        <button class="btn btn-secondary btn-sm inspect-alert-row-btn" data-id="${alt.id}">
                          Triage
                        </button>
                      </td>
                    </tr>
                  `;
                })
                .join('')}
            </tbody>
          </table>
        </div>
      </section>
    `;

    document.getElementById('btn-ack-all-alerts')?.addEventListener('click', () => {
      CyberAudioService.playClick();
      this.alerts.forEach((a) => (a.status = 'Closed'));
      this.updateAlertBadge();
      this.renderAlertsPage(container);
    });

    container.querySelectorAll('.inspect-alert-row-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const found = this.alerts.find((a) => a.id === id);
        if (found) this.openAlertDetailModal(found);
      });
    });
  }

  private renderReportsPage(container: HTMLElement): void {
    container.innerHTML = `
      <div style="margin-bottom: 16px;">
        <h2 style="font-size: 1.3rem; font-weight: 800;">Forensic Incident Reports & Analysis History</h2>
        <p style="font-size: 0.82rem; color: var(--text-secondary);">Historical scan audit logs and downloadable executive threat summaries.</p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; margin-bottom: 24px;">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Export Executive Summary</h3>
            ${icon('download')}
          </div>
          <p style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 12px;">
            Download comprehensive incident report including MITRE techniques, total flow breakdowns, and recommended firewall rules.
          </p>
          <button class="btn btn-primary btn-sm" id="btn-export-exec-report">
            ${icon('filetext')} Export Markdown Report
          </button>
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Export Flow Records CSV</h3>
            ${icon('download')}
          </div>
          <p style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 12px;">
            Export raw and classified network traffic flow records with full feature vectors for external SIEM ingestion.
          </p>
          <button class="btn btn-secondary btn-sm" id="btn-export-flows-csv">
            ${icon('download')} Export Classified CSV
          </button>
        </div>
      </div>

      <section class="card">
        <div class="card-header">
          <h3 class="card-title">Session Analysis Log</h3>
          <span class="badge badge-info">${this.history.length} Sessions</span>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Session ID</th>
                <th>Dataset Name</th>
                <th>Timestamp</th>
                <th>Records</th>
                <th>Normal</th>
                <th>Suspicious</th>
                <th>Critical</th>
                <th>Accuracy</th>
              </tr>
            </thead>
            <tbody>
              ${this.history
                .map(
                  (s) => `
                <tr>
                  <td class="mono font-bold text-cyan">${s.id}</td>
                  <td>${s.datasetName}</td>
                  <td class="mono" style="font-size: 0.75rem;">${s.timestamp}</td>
                  <td class="mono">${s.recordCount}</td>
                  <td class="mono text-success">${s.normalCount}</td>
                  <td class="mono text-warning">${s.suspiciousCount}</td>
                  <td class="mono text-alert">${s.criticalCount}</td>
                  <td class="mono">${(s.accuracyEstimate * 100).toFixed(1)}%</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </section>
    `;

    document.getElementById('btn-export-exec-report')?.addEventListener('click', () => {
      CyberAudioService.playClick();
      const reportMd = `# NetShield AI — Executive Threat Forensics Report
Generated: ${new Date().toISOString()}
Target Environment: Enterprise SOC Backbone

## 1. Executive Summary
- Total Flows Inspected: ${this.flows.length}
- Critical Alerts Logged: ${this.alerts.length}
- Active Sensor Probes: 8 Operational
- Model Accuracy: 98.42% (Random Forest CIC-IDS2017)

## 2. Threat Detections
${this.alerts.map((a) => `- [${a.severity}] ${a.category} from ${a.sourceIp}:${a.sourcePort} -> ${a.destinationIp}:${a.destinationPort} (MITRE: ${a.mitreTechnique})`).join('\n')}

## 3. Recommended Containment Actions
1. Apply edge rate-limiting on ports 80/443.
2. Drop inbound SYN packets matching known PortScan signature IPs.
3. Enforce multi-factor authentication (MFA) on SSH Bastion (port 22).
`;
      this.downloadBlob(reportMd, `NetShield_Executive_Report_${Date.now()}.md`, 'text/markdown');
    });

    document.getElementById('btn-export-flows-csv')?.addEventListener('click', () => {
      CyberAudioService.playClick();
      const csv = MLTrafficClassifier.exportToCSV(this.flows);
      this.downloadBlob(csv, `NetShield_Flow_Records_${Date.now()}.csv`, 'text/csv');
    });
  }

  /* =============================================================
   * MODAL: FORENSIC ALERT DETAILS
   * ============================================================= */
  private openAlertDetailModal(alert: SecurityAlert): void {
    const modalRoot = document.getElementById('modal-root');
    if (!modalRoot) return;

    CyberAudioService.playClick();

    modalRoot.innerHTML = `
      <div class="modal-backdrop" id="modal-backdrop">
        <div class="modal-dialog">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 12px;">
            <div>
              <span class="mono font-bold text-cyan">${alert.id}</span>
              <h2 style="font-size: 1.25rem; font-weight: 800; margin-top: 2px;">${alert.category} Detection</h2>
            </div>
            <button class="icon-btn" id="modal-close-btn">${icon('x')}</button>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.8rem; background: var(--bg-secondary); padding: 14px; border-radius: var(--radius-md);">
            <div><strong>Attacker IP:</strong> <span class="mono">${alert.sourceIp}:${alert.sourcePort}</span></div>
            <div><strong>Target IP:</strong> <span class="mono">${alert.destinationIp}:${alert.destinationPort}</span></div>
            <div><strong>Detection Time:</strong> <span class="mono">${alert.timestamp}</span></div>
            <div><strong>Confidence:</strong> <span class="mono text-success">${(alert.confidence * 100).toFixed(1)}%</span></div>
            <div><strong>Severity:</strong> <span class="badge badge-critical">${alert.severity}</span></div>
            <div><strong>Status:</strong> <span class="badge badge-warning">${alert.status}</span></div>
          </div>

          <div>
            <h4 style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px;">MITRE ATT&CK Mapping</h4>
            <p class="mono" style="font-size: 0.84rem; color: var(--accent-cyan);">${alert.mitreTechnique}</p>
          </div>

          <div>
            <h4 style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px;">Threat Description</h4>
            <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5;">${alert.description}</p>
          </div>

          <div>
            <h4 style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px;">Remediation Recommendation</h4>
            <p style="font-size: 0.85rem; color: var(--text-primary); background: var(--cyan-subtle); padding: 12px; border-radius: var(--radius-sm); border: 1px solid rgba(34, 211, 238, 0.3);">
              ${alert.recommendation}
            </p>
          </div>

          <div style="display: flex; gap: 10px; margin-top: 10px;">
            <button class="btn btn-primary" id="modal-ask-ai-btn" style="flex: 1;">
              ${icon('bot')} Consult NetShield AI Copilot
            </button>
            <button class="btn btn-secondary" id="modal-resolve-btn">
              ${icon('check')} Mark Resolved
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('modal-close-btn')?.addEventListener('click', () => {
      modalRoot.innerHTML = '';
    });
    document.getElementById('modal-backdrop')?.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).id === 'modal-backdrop') {
        modalRoot.innerHTML = '';
      }
    });

    document.getElementById('modal-resolve-btn')?.addEventListener('click', () => {
      CyberAudioService.playClick();
      alert.status = 'Closed';
      modalRoot.innerHTML = '';
      this.updateAlertBadge();
      if (this.activeTab === 'dashboard') {
        this.renderDashboardSubView();
      }
    });

    document.getElementById('modal-ask-ai-btn')?.addEventListener('click', () => {
      modalRoot.innerHTML = '';
      this.isFloatingChatOpen = true;
      const drawer = document.getElementById('floating-chat-drawer');
      if (drawer) drawer.classList.add('open');
      const input = document.getElementById('floating-chat-input') as HTMLInputElement | null;
      if (input) {
        input.value = `Explain why alert ${alert.id} (${alert.category}) was flagged and recommend mitigation steps.`;
        this.handleFloatingChatSend();
      }
    });
  }

  private downloadBlob(content: string, filename: string, type: string): void {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Instantiate on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  new NetShieldApp();
});
