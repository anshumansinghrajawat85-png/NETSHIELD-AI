import * as THREE from 'three';

export class ThreeHeroGlobe {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private globeGroup: THREE.Group;
  private animationFrameId: number | null = null;
  private isDragging = false;
  private previousMousePosition = { x: 0, y: 0 };
  private rotationSpeed = { x: 0.002, y: 0.003 };
  private packetParticles: {
    mesh: THREE.Mesh;
    curve: THREE.QuadraticBezierCurve3;
    progress: number;
    speed: number;
  }[] = [];

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();

    const width = container.clientWidth || 500;
    const height = container.clientHeight || 450;

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, 7.5);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    container.appendChild(this.renderer.domElement);

    this.globeGroup = new THREE.Group();
    this.scene.add(this.globeGroup);

    this.initLights();
    this.initGlobe();
    this.initSensorPoints();
    this.initThreatArcs();
    this.initCentralShield();
    this.initEvents();
    this.animate();
  }

  private initLights(): void {
    const ambientLight = new THREE.AmbientLight(0x0f2040, 1.8);
    this.scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0x22d3ee, 0x080d18, 2.5);
    this.scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0x38bdf8, 3.5);
    keyLight.position.set(5, 8, 6);
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x3b82f6, 2.8);
    rimLight.position.set(-6, -4, -4);
    this.scene.add(rimLight);
  }

  private initGlobe(): void {
    // 1. Inner glowing atmospheric core
    const coreGeo = new THREE.SphereGeometry(2.3, 36, 36);
    const coreMat = new THREE.MeshPhongMaterial({
      color: 0x071124,
      emissive: 0x0c214d,
      specular: 0x22d3ee,
      shininess: 40,
      transparent: true,
      opacity: 0.88,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    this.globeGroup.add(coreMesh);

    // 2. Wireframe longitude & latitude cyber grid
    const wireGeo = new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(2.42, 3));
    const wireMat = new THREE.LineBasicMaterial({
      color: 0x1e3a6a,
      transparent: true,
      opacity: 0.45,
    });
    const wireMesh = new THREE.LineSegments(wireGeo, wireMat);
    this.globeGroup.add(wireMesh);

    // 3. Equatorial & tropic orbital rings
    const ringMat = new THREE.LineBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.65,
    });
    for (const radius of [2.5, 2.8, 3.1]) {
      const ringGeo = new THREE.BufferGeometry();
      const points: THREE.Vector3[] = [];
      const segments = 64;
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
      }
      ringGeo.setFromPoints(points);
      const ring = new THREE.Line(ringGeo, ringMat);
      ring.rotation.x = (radius === 2.5 ? 0.35 : radius === 2.8 ? -0.45 : 0.85);
      this.globeGroup.add(ring);
    }
  }

  private latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    return new THREE.Vector3(x, y, z);
  }

  private initSensorPoints(): void {
    const coords = [
      { lat: 39.0, lng: -77.5, color: 0xef4444, name: 'Ashburn' },
      { lat: 37.3, lng: -121.9, color: 0x22c55e, name: 'San Jose' },
      { lat: 51.5, lng: -0.1, color: 0x3b82f6, name: 'London' },
      { lat: 50.1, lng: 8.7, color: 0xf59e0b, name: 'Frankfurt' },
      { lat: 35.7, lng: 139.7, color: 0x22d3ee, name: 'Tokyo' },
      { lat: 1.35, lng: 103.8, color: 0x38bdf8, name: 'Singapore' },
      { lat: -33.9, lng: 151.2, color: 0x22c55e, name: 'Sydney' },
      { lat: -23.5, lng: -46.6, color: 0x3b82f6, name: 'São Paulo' },
    ];

    const beaconGeo = new THREE.SphereGeometry(0.065, 16, 16);
    const ringGeo = new THREE.RingGeometry(0.08, 0.12, 24);

    for (const c of coords) {
      const pos = this.latLngToVector3(c.lat, c.lng, 2.44);

      const beaconMat = new THREE.MeshBasicMaterial({ color: c.color });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.copy(pos);
      this.globeGroup.add(beacon);

      const ringMat = new THREE.MeshBasicMaterial({
        color: c.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pos.clone().multiplyScalar(1.01));
      ring.lookAt(new THREE.Vector3(0, 0, 0));
      this.globeGroup.add(ring);
    }
  }

  private initThreatArcs(): void {
    const arcPairs = [
      { from: { lat: 50.1, lng: 8.7 }, to: { lat: 39.0, lng: -77.5 }, color: 0xef4444 },
      { from: { lat: 35.7, lng: 139.7 }, to: { lat: 37.3, lng: -121.9 }, color: 0x38bdf8 },
      { from: { lat: 51.5, lng: -0.1 }, to: { lat: 1.35, lng: 103.8 }, color: 0x22c55e },
      { from: { lat: -23.5, lng: -46.6 }, to: { lat: 39.0, lng: -77.5 }, color: 0xf59e0b },
    ];

    for (const pair of arcPairs) {
      const p1 = this.latLngToVector3(pair.from.lat, pair.from.lng, 2.45);
      const p2 = this.latLngToVector3(pair.to.lat, pair.to.lng, 2.45);

      // Mid-point arched upwards
      const mid = p1.clone().add(p2).multiplyScalar(0.5);
      const distance = p1.distanceTo(p2);
      mid.normalize().multiplyScalar(2.45 + distance * 0.45);

      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
      const points = curve.getPoints(40);
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({
        color: pair.color,
        transparent: true,
        opacity: 0.5,
      });
      const arc = new THREE.Line(lineGeo, lineMat);
      this.globeGroup.add(arc);

      // Animated packet travelling on this curve
      const packetGeo = new THREE.SphereGeometry(0.045, 12, 12);
      const packetMat = new THREE.MeshBasicMaterial({ color: pair.color });
      const packet = new THREE.Mesh(packetGeo, packetMat);
      this.globeGroup.add(packet);

      this.packetParticles.push({
        mesh: packet,
        curve,
        progress: Math.random(),
        speed: 0.004 + Math.random() * 0.004,
      });
    }
  }

  private initCentralShield(): void {
    // 3-part composite cyber shield core inside globe
    const shieldGroup = new THREE.Group();

    // 1. Diamond-faceted shield prism
    const shieldGeo = new THREE.ConeGeometry(0.45, 0.9, 4);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0x22d3ee,
      emissive: 0x0284c7,
      roughness: 0.2,
      metalness: 0.8,
      transparent: true,
      opacity: 0.9,
    });
    const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    shieldMesh.rotation.y = Math.PI / 4;
    shieldMesh.rotation.z = Math.PI;
    shieldGroup.add(shieldMesh);

    // 2. Protective outer cyber ring
    const ringGeo = new THREE.TorusGeometry(0.65, 0.03, 16, 48);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    shieldGroup.add(ring);

    this.globeGroup.add(shieldGroup);
  }

  private initEvents(): void {
    const dom = this.renderer.domElement;

    dom.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const deltaX = e.clientX - this.previousMousePosition.x;
      const deltaY = e.clientY - this.previousMousePosition.y;

      this.globeGroup.rotation.y += deltaX * 0.005;
      this.globeGroup.rotation.x += deltaY * 0.005;

      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    // Touch support
    dom.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    });

    window.addEventListener('touchend', () => {
      this.isDragging = false;
    });

    window.addEventListener('touchmove', (e) => {
      if (!this.isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - this.previousMousePosition.x;
      const deltaY = e.touches[0].clientY - this.previousMousePosition.y;

      this.globeGroup.rotation.y += deltaX * 0.006;
      this.globeGroup.rotation.x += deltaY * 0.006;

      this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    });

    // Window resize
    window.addEventListener('resize', this.onResize);
  }

  private onResize = (): void => {
    if (!this.container || !this.renderer) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width === 0 || height === 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private animate = (): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    if (!this.isDragging) {
      this.globeGroup.rotation.y += this.rotationSpeed.y;
      this.globeGroup.rotation.x = Math.sin(Date.now() * 0.0008) * 0.12;
    }

    // Update travelling packets along arcs
    for (const p of this.packetParticles) {
      p.progress += p.speed;
      if (p.progress > 1) p.progress = 0;
      const pt = p.curve.getPoint(p.progress);
      p.mesh.position.copy(pt);
    }

    this.renderer.render(this.scene, this.camera);
  };

  public resetView(): void {
    this.globeGroup.rotation.set(0, 0, 0);
  }

  public dispose(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.onResize);

    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });

    if (this.renderer && this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
