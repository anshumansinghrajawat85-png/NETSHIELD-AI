import { SensorProbe } from '../types.ts';

export class SensorMapVisualizer {
  private container: HTMLElement;
  private sensors: SensorProbe[];
  private selectedSensor: SensorProbe | null = null;
  private activeRegion = 'All';
  private onSelectSensorCallback?: (sensor: SensorProbe) => void;

  constructor(
    container: HTMLElement,
    sensors: SensorProbe[],
    onSelectSensor?: (sensor: SensorProbe) => void
  ) {
    this.container = container;
    this.sensors = sensors;
    this.onSelectSensorCallback = onSelectSensor;
    this.selectedSensor = sensors[0]; // default select US-East
    this.render();
  }

  public updateSensors(sensors: SensorProbe[]): void {
    this.sensors = sensors;
    this.render();
  }

  public setFilter(region: string): void {
    this.activeRegion = region;
    this.render();
  }

  /**
   * Converts Equirectangular Latitude / Longitude to SVG coordinates (1000 x 500 projection)
   */
  private projectLatLng(lat: number, lng: number): { x: number; y: number } {
    const x = ((lng + 180) / 360) * 1000;
    const y = ((90 - lat) / 180) * 500;
    return { x, y };
  }

  public render(): void {
    this.container.innerHTML = '';

    const filtered =
      this.activeRegion === 'All'
        ? this.sensors
        : this.sensors.filter((s) => s.region.toLowerCase().includes(this.activeRegion.toLowerCase()));

    // Wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'sensor-map-wrapper';

    // Top Controls Bar
    const controls = document.createElement('div');
    controls.className = 'sensor-map-controls';
    controls.innerHTML = `
      <div class="sensor-title-group">
        <div class="status-indicator-dot ${this.sensors.some(s => s.status === 'critical') ? 'critical' : 'operational'}"></div>
        <div>
          <h3 class="sensor-heading">GLOBAL THREAT SENSOR PROBES</h3>
          <p class="sensor-subheading">8 Distributed Edge BGP Scrubbing & Deep-Packet Monitoring Points</p>
        </div>
      </div>
      <div class="sensor-filters">
        ${['All', 'North America', 'Europe', 'Asia Pacific', 'Oceania', 'South America']
          .map(
            (reg) =>
              `<button class="sensor-filter-btn ${this.activeRegion === reg ? 'active' : ''}" data-region="${reg}">${reg}</button>`
          )
          .join('')}
      </div>
    `;

    wrapper.appendChild(controls);

    // Map Area with SVG
    const mapArea = document.createElement('div');
    mapArea.className = 'sensor-map-canvas-container';

    // SVG World Projection & Markers
    let markersHtml = '';
    for (const sensor of filtered) {
      const { x, y } = this.projectLatLng(sensor.lat, sensor.lng);
      const isSelected = this.selectedSensor?.id === sensor.id;
      const color =
        sensor.status === 'critical'
          ? '#ef4444'
          : sensor.status === 'warning'
          ? '#f59e0b'
          : '#22c55e';

      markersHtml += `
        <g class="sensor-marker ${isSelected ? 'selected' : ''}" data-id="${sensor.id}" transform="translate(${x}, ${y})">
          <!-- Radar ping wave -->
          <circle cx="0" cy="0" r="14" fill="${color}" opacity="0.25">
            <animate attributeName="r" values="8;24;32" dur="2.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.4;0.1;0" dur="2.4s" repeatCount="indefinite" />
          </circle>
          <!-- Inner beacon -->
          <circle cx="0" cy="0" r="6" fill="${color}" stroke="#080D18" stroke-width="2" />
          <!-- Pin Label -->
          <rect x="10" y="-12" width="${sensor.name.length * 6.5 + 14}" height="20" rx="4" fill="#0D1424" stroke="#263449" stroke-width="1" />
          <text x="16" y="2" fill="#F1F5F9" font-size="10" font-family="'JetBrains Mono', monospace" font-weight="600">${sensor.location.split(',')[0]}</text>
        </g>
      `;
    }

    // Connect threat vector arcs from selected sensor
    let threatArcsHtml = '';
    if (this.selectedSensor) {
      const p1 = this.projectLatLng(this.selectedSensor.lat, this.selectedSensor.lng);
      // Threat sources
      const attacks = [
        { lat: 40.71, lng: -74.0, color: '#ef4444' }, // NYC
        { lat: 55.75, lng: 37.61, color: '#f59e0b' }, // Moscow
        { lat: 31.23, lng: 121.47, color: '#ef4444' }, // Shanghai
      ];

      for (const atk of attacks) {
        const p2 = this.projectLatLng(atk.lat, atk.lng);
        const midX = (p1.x + p2.x) / 2;
        const midY = Math.min(p1.y, p2.y) - 40;
        threatArcsHtml += `
          <path d="M ${p2.x} ${p2.y} Q ${midX} ${midY} ${p1.x} ${p1.y}" fill="none" stroke="${atk.color}" stroke-width="1.8" stroke-dasharray="4,4" opacity="0.75">
            <animate attributeName="stroke-dashoffset" values="40;0" dur="1.5s" repeatCount="indefinite" />
          </path>
        `;
      }
    }

    mapArea.innerHTML = `
      <svg class="sensor-svg-map" viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="gridGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0F172A" />
            <stop offset="100%" stop-color="#080D18" />
          </linearGradient>
          <pattern id="dotPattern" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill="#1E293B" opacity="0.6" />
          </pattern>
        </defs>

        <!-- Base Background -->
        <rect width="1000" height="500" fill="url(#gridGrad)" />
        <rect width="1000" height="500" fill="url(#dotPattern)" />

        <!-- Continents Outline Approximation in High-Tech Vector Path -->
        <g class="world-vector-continents" fill="#111B2D" stroke="#1E293B" stroke-width="1.2" opacity="0.85">
          <!-- North America -->
          <path d="M 120 70 L 290 60 L 320 110 L 280 180 L 230 190 L 210 240 L 190 280 L 170 230 L 130 180 L 90 120 Z" />
          <!-- South America -->
          <path d="M 270 290 L 370 320 L 380 390 L 330 470 L 290 450 L 270 350 Z" />
          <!-- Europe -->
          <path d="M 460 70 L 590 60 L 610 130 L 550 180 L 480 170 L 450 120 Z" />
          <!-- Africa -->
          <path d="M 470 190 L 580 190 L 620 270 L 570 390 L 520 400 L 470 300 L 450 220 Z" />
          <!-- Asia -->
          <path d="M 600 60 L 890 60 L 910 180 L 840 260 L 750 250 L 690 190 L 610 140 Z" />
          <!-- Australia -->
          <path d="M 780 330 L 900 320 L 920 400 L 820 420 L 770 370 Z" />
          <!-- UK & Japan Islands -->
          <circle cx="470" cy="110" r="12" />
          <path d="M 870 140 Q 880 180 860 210" stroke="#334155" stroke-width="3" fill="none" />
        </g>

        <!-- Latitude & Longitude Guidelines -->
        <line x1="0" y1="250" x2="1000" y2="250" stroke="#22D3EE" stroke-width="0.75" stroke-dasharray="3,3" opacity="0.3" />
        <line x1="500" y1="0" x2="500" y2="500" stroke="#22D3EE" stroke-width="0.75" stroke-dasharray="3,3" opacity="0.3" />

        <!-- Threat arcs -->
        ${threatArcsHtml}

        <!-- Sensor Markers -->
        ${markersHtml}
      </svg>
    `;

    wrapper.appendChild(mapArea);

    // Bottom Selected Sensor Telemetry HUD Card
    if (this.selectedSensor) {
      const s = this.selectedSensor;
      const statusBadge =
        s.status === 'critical'
          ? '<span class="badge badge-critical">CRITICAL THREATS</span>'
          : s.status === 'warning'
          ? '<span class="badge badge-warning">ANOMALOUS LOAD</span>'
          : '<span class="badge badge-success">OPERATIONAL</span>';

      const hud = document.createElement('div');
      hud.className = 'sensor-telemetry-hud';
      hud.innerHTML = `
        <div class="hud-main-col">
          <div class="hud-header">
            <span class="hud-id">${s.id.toUpperCase()}</span>
            ${statusBadge}
          </div>
          <h4 class="hud-name">${s.name}</h4>
          <p class="hud-loc">${s.location} • Public Ingress IP: <span class="mono">${s.ip}</span></p>
        </div>
        <div class="hud-stats-grid">
          <div class="hud-stat-box">
            <span class="hud-stat-label">PACKET THROUGHPUT</span>
            <span class="hud-stat-val">${s.packetRateKpps.toFixed(1)} <small>kpps</small></span>
          </div>
          <div class="hud-stat-box">
            <span class="hud-stat-label">AVERAGE LATENCY</span>
            <span class="hud-stat-val">${s.latencyMs} <small>ms</small></span>
          </div>
          <div class="hud-stat-box">
            <span class="hud-stat-label">ATTACKS INTERCEPTED</span>
            <span class="hud-stat-val text-alert">${s.threatsDetected}</span>
          </div>
          <div class="hud-stat-box">
            <span class="hud-stat-label">HEARTBEAT</span>
            <span class="hud-stat-val text-success">${s.lastHeartbeat}</span>
          </div>
        </div>
      `;
      wrapper.appendChild(hud);
    }

    this.container.appendChild(wrapper);

    // Attach Event Listeners
    controls.querySelectorAll('.sensor-filter-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const reg = btn.getAttribute('data-region') || 'All';
        this.setFilter(reg);
      });
    });

    mapArea.querySelectorAll('.sensor-marker').forEach((el) => {
      el.addEventListener('click', () => {
        const id = el.getAttribute('data-id');
        const found = this.sensors.find((s) => s.id === id);
        if (found) {
          this.selectedSensor = found;
          this.render();
          if (this.onSelectSensorCallback) {
            this.onSelectSensorCallback(found);
          }
        }
      });
    });
  }
}
