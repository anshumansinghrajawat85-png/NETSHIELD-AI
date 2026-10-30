import * as THREE from 'three';
import { NetworkNode, NetworkEdge } from '../types.ts';

export class ThreeTopologyScene {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private nodesGroup: THREE.Group;
  private edgesGroup: THREE.Group;
  private packetsGroup: THREE.Group;
  private animationFrameId: number | null = null;

  private nodes: NetworkNode[];
  private edges: NetworkEdge[];
  private onSelectNode: (node: NetworkNode) => void;

  private isDragging = false;
  private isRightDragging = false;
  private previousMousePosition = { x: 0, y: 0 };
  private cameraTarget = new THREE.Vector3(0, 3, 0);
  private cameraRadius = 14;
  private cameraTheta = Math.PI / 4;
  private cameraPhi = Math.PI / 3.2;
  private is2DMode = false;
  private showOnlyAnomalies = false;

  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private nodeMeshMap = new Map<string, THREE.Group>();
  private nodeDataMap = new Map<string, NetworkNode>();

  private edgePackets: {
    mesh: THREE.Mesh;
    start: THREE.Vector3;
    end: THREE.Vector3;
    progress: number;
    speed: number;
    status: string;
  }[] = [];

  private theme: 'dark' | 'light' = 'dark';

  constructor(
    container: HTMLElement,
    nodes: NetworkNode[],
    edges: NetworkEdge[],
    onSelectNode: (node: NetworkNode) => void,
    theme: 'dark' | 'light' = 'dark'
  ) {
    this.container = container;
    this.nodes = nodes;
    this.edges = edges;
    this.onSelectNode = onSelectNode;
    this.theme = theme;

    this.scene = new THREE.Scene();
    const bgColor = theme === 'dark' ? 0x080d18 : 0xf1f5f9;
    this.scene.background = new THREE.Color(bgColor);
    this.scene.fog = new THREE.FogExp2(bgColor, 0.025);

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 550;

    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    this.updateCameraPosition();

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.3;

    container.appendChild(this.renderer.domElement);

    this.nodesGroup = new THREE.Group();
    this.edgesGroup = new THREE.Group();
    this.packetsGroup = new THREE.Group();

    this.scene.add(this.edgesGroup);
    this.scene.add(this.nodesGroup);
    this.scene.add(this.packetsGroup);

    this.initLights();
    this.initGroundGrid();
    this.buildTopology();
    this.initEvents();
    this.animate();
  }

  private initLights(): void {
    const ambientLight = new THREE.AmbientLight(0x0f1d38, 2.2);
    this.scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0x22d3ee, 0x070b14, 2.0);
    this.scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0x38bdf8, 3.5);
    keyLight.position.set(12, 18, 10);
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x3b82f6, 2.0);
    fillLight.position.set(-12, -8, -10);
    this.scene.add(fillLight);
  }

  private initGroundGrid(): void {
    const gridHelper = new THREE.GridHelper(30, 30, 0x1e3a6a, 0x112240);
    gridHelper.position.y = -0.05;
    this.scene.add(gridHelper);
  }

  private getNodeColor(status: string): number {
    switch (status) {
      case 'critical':
        return 0xef4444; // red
      case 'suspicious':
        return 0xf59e0b; // amber
      case 'normal':
      default:
        return 0x22c55e; // green
    }
  }

  private buildTopology(): void {
    this.nodesGroup.clear();
    this.edgesGroup.clear();
    this.packetsGroup.clear();
    this.nodeMeshMap.clear();
    this.nodeDataMap.clear();
    this.edgePackets = [];

    // Map data
    for (const node of this.nodes) {
      this.nodeDataMap.set(node.id, node);
      const nodeGroup = this.createProceduralNode(node);
      this.nodeMeshMap.set(node.id, nodeGroup);
      this.nodesGroup.add(nodeGroup);
    }

    // Build connections
    for (const edge of this.edges) {
      const srcNode = this.nodeDataMap.get(edge.source);
      const tgtNode = this.nodeDataMap.get(edge.target);
      if (!srcNode || !tgtNode) continue;

      const p1 = new THREE.Vector3(...srcNode.position);
      const p2 = new THREE.Vector3(...tgtNode.position);

      const color =
        edge.status === 'critical'
          ? 0xef4444
          : edge.status === 'suspicious'
          ? 0xf59e0b
          : 0x22d3ee;

      // Cable line
      const points = [p1, p2];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: edge.status === 'critical' ? 0.9 : 0.45,
        linewidth: edge.status === 'critical' ? 2 : 1,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      this.edgesGroup.add(line);

      // Packet pulse
      const packetGeo = new THREE.SphereGeometry(0.12, 12, 12);
      const packetMat = new THREE.MeshBasicMaterial({ color });
      const packet = new THREE.Mesh(packetGeo, packetMat);
      this.packetsGroup.add(packet);

      this.edgePackets.push({
        mesh: packet,
        start: p1,
        end: p2,
        progress: Math.random(),
        speed: 0.008 + (edge.packetRate / 10000) * 0.005,
        status: edge.status,
      });
    }
  }

  /**
   * Constructs a 3-8 part composite procedural network device model
   */
  private createProceduralNode(node: NetworkNode): THREE.Group {
    const group = new THREE.Group();
    group.position.set(...node.position);
    group.userData = { nodeId: node.id };

    const statusColor = this.getNodeColor(node.status);

    // Part 1: Circular pedestal base with contact ring
    const baseGeo = new THREE.CylinderGeometry(0.65, 0.75, 0.12, 24);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x0c1a32,
      roughness: 0.4,
      metalness: 0.8,
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.06;
    group.add(base);

    // Part 2: Glowing base ring
    const ringGeo = new THREE.TorusGeometry(0.68, 0.03, 16, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: statusColor });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.12;
    group.add(ring);

    // Part 3: Main Device Chassis based on device type
    let chassisGeo: THREE.BufferGeometry;
    if (node.type === 'gateway' || node.type === 'firewall') {
      // Octagonal firewall bastion
      chassisGeo = new THREE.CylinderGeometry(0.48, 0.52, 0.75, 8);
    } else if (node.type === 'database') {
      // Database stack cylinders
      chassisGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.8, 24);
    } else if (node.type === 'server') {
      // Rack unit blade chassis
      chassisGeo = new THREE.BoxGeometry(0.7, 0.65, 0.7);
    } else {
      // Workstation / client node
      chassisGeo = new THREE.BoxGeometry(0.55, 0.5, 0.55);
    }

    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x162646,
      roughness: 0.3,
      metalness: 0.7,
    });
    const chassis = new THREE.Mesh(chassisGeo, chassisMat);
    chassis.position.y = 0.5;
    group.add(chassis);

    // Part 4: LED Activity Bar Array on front
    const ledGeo = new THREE.BoxGeometry(0.4, 0.06, 0.02);
    const ledMat = new THREE.MeshBasicMaterial({
      color: node.status === 'critical' ? 0xef4444 : 0x22d3ee,
    });
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.position.set(0, 0.6, 0.37);
    group.add(led);

    // Part 5: Floating Status Orb / Shield over node
    const orbGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const orbMat = new THREE.MeshStandardMaterial({
      color: statusColor,
      emissive: statusColor,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.8,
    });
    const orb = new THREE.Mesh(orbGeo, orbMat);
    orb.position.y = 1.25;
    group.add(orb);

    // Part 6: Translucent outer pulse halo
    const haloGeo = new THREE.SphereGeometry(0.26, 16, 16);
    const haloMat = new THREE.MeshBasicMaterial({
      color: statusColor,
      transparent: true,
      opacity: node.status === 'critical' ? 0.35 : 0.15,
      wireframe: true,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.position.y = 1.25;
    group.add(halo);

    return group;
  }

  private updateCameraPosition(): void {
    if (this.is2DMode) {
      this.camera.position.set(0, 15, 0.001);
      this.camera.lookAt(0, 3, 0);
      return;
    }

    const x =
      this.cameraTarget.x +
      this.cameraRadius * Math.sin(this.cameraPhi) * Math.sin(this.cameraTheta);
    const y = this.cameraTarget.y + this.cameraRadius * Math.cos(this.cameraPhi);
    const z =
      this.cameraTarget.z +
      this.cameraRadius * Math.sin(this.cameraPhi) * Math.cos(this.cameraTheta);

    this.camera.position.set(x, y, z);
    this.camera.lookAt(this.cameraTarget);
  }

  private initEvents(): void {
    const dom = this.renderer.domElement;

    dom.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.isDragging = true;
      } else if (e.button === 2) {
        this.isRightDragging = true;
      }
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    dom.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
      this.isRightDragging = false;
    });

    window.addEventListener('mousemove', (e) => {
      const rect = dom.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (this.isDragging && !this.is2DMode) {
        const deltaX = e.clientX - this.previousMousePosition.x;
        const deltaY = e.clientY - this.previousMousePosition.y;

        this.cameraTheta -= deltaX * 0.008;
        this.cameraPhi = Math.max(0.1, Math.min(Math.PI / 2.05, this.cameraPhi - deltaY * 0.008));
        this.updateCameraPosition();
      } else if (this.isRightDragging || (this.isDragging && this.is2DMode)) {
        const deltaX = e.clientX - this.previousMousePosition.x;
        const deltaY = e.clientY - this.previousMousePosition.y;

        const panSpeed = 0.02;
        this.cameraTarget.x -= deltaX * panSpeed;
        this.cameraTarget.z -= deltaY * panSpeed;
        this.updateCameraPosition();
      }

      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    // Zoom
    dom.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.cameraRadius = Math.max(5, Math.min(30, this.cameraRadius + e.deltaY * 0.015));
      this.updateCameraPosition();
    });

    // Raycast click
    dom.addEventListener('click', (e) => {
      const rect = dom.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.nodesGroup.children, true);

      if (intersects.length > 0) {
        let current: THREE.Object3D | null = intersects[0].object;
        while (current && !current.userData.nodeId && current.parent) {
          current = current.parent;
        }
        if (current && current.userData.nodeId) {
          const selectedNode = this.nodeDataMap.get(current.userData.nodeId);
          if (selectedNode) {
            this.onSelectNode(selectedNode);
          }
        }
      }
    });

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

    const now = Date.now();

    // Pulse node orbs and floating animation
    for (const [id, group] of this.nodeMeshMap.entries()) {
      const node = this.nodeDataMap.get(id);
      if (!node) continue;

      if (this.showOnlyAnomalies && node.status === 'normal') {
        group.visible = false;
      } else {
        group.visible = true;
      }

      const orb = group.children[4];
      if (orb) {
        orb.position.y = 1.25 + Math.sin(now * 0.003 + node.position[0]) * 0.06;
      }
      const halo = group.children[5];
      if (halo) {
        halo.position.y = 1.25 + Math.sin(now * 0.003 + node.position[0]) * 0.06;
        const scale = 1 + (node.status === 'critical' ? Math.sin(now * 0.008) * 0.2 : 0);
        halo.scale.set(scale, scale, scale);
      }
    }

    // Move packet pulses
    for (const p of this.edgePackets) {
      p.progress += p.speed;
      if (p.progress > 1) p.progress = 0;
      p.mesh.position.lerpVectors(p.start, p.end, p.progress);
      p.mesh.position.y += Math.sin(p.progress * Math.PI) * 0.35; // arc slightly upwards
    }

    this.renderer.render(this.scene, this.camera);
  };

  // Public control methods
  public resetCamera(): void {
    this.cameraTarget.set(0, 3, 0);
    this.cameraRadius = 14;
    this.cameraTheta = Math.PI / 4;
    this.cameraPhi = Math.PI / 3.2;
    this.is2DMode = false;
    this.updateCameraPosition();
  }

  public toggle2D3D(): boolean {
    this.is2DMode = !this.is2DMode;
    this.updateCameraPosition();
    return this.is2DMode;
  }

  public toggleAnomalyFilter(): boolean {
    this.showOnlyAnomalies = !this.showOnlyAnomalies;
    return this.showOnlyAnomalies;
  }

  public zoomIn(): void {
    this.cameraRadius = Math.max(5, this.cameraRadius - 2);
    this.updateCameraPosition();
  }

  public zoomOut(): void {
    this.cameraRadius = Math.min(30, this.cameraRadius + 2);
    this.updateCameraPosition();
  }

  public setTheme(theme: 'dark' | 'light'): void {
    this.theme = theme;
    const bgColor = theme === 'dark' ? 0x080d18 : 0xf1f5f9;
    this.scene.background = new THREE.Color(bgColor);
    if (this.scene.fog) {
      this.scene.fog.color.setHex(bgColor);
    }
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
