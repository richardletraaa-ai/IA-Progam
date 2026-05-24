import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { InfraProject } from "../types";
import { Globe, ZoomIn, ZoomOut, Compass, RotateCw } from "lucide-react";

interface GlobePanelProps {
  projects: InfraProject[];
  onSelectProject: (project: InfraProject | null) => void;
  selectedProject: InfraProject | null;
  filterStatus?: string[];
  filterSector?: string;
  showConnections?: boolean;
}

export default function GlobePanel({
  projects,
  onSelectProject,
  selectedProject,
  filterStatus = [],
  filterSector = "all",
  showConnections = true,
}: GlobePanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const selectedProjectRef = useRef<InfraProject | null>(selectedProject);

  const [hoveredProject, setHoveredProject] = useState<InfraProject | null>(null);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  // Sync ref for access in animation loops
  useEffect(() => {
    selectedProjectRef.current = selectedProject;
  }, [selectedProject]);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth || 600;
    const height = mountRef.current.clientHeight || 450;

    // SCENE, CAMERA, RENDERER
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030303, 0.15);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 2.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // STARFIELD BACKGROUND (Procedural 5000 stars)
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(5000 * 3);
    for (let i = 0; i < 5000 * 3; i += 3) {
      const radius = 300 + Math.random() * 100;
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      
      starPositions[i] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i + 2] = radius * Math.cos(phi);
    }
    starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.6,
      transparent: true,
      opacity: 0.8,
    });
    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);

    // GLOBE GROUP (Contains all Earth layers and pins)
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // LIGHTS
    const ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 3, 5);
    scene.add(dirLight);

    // EARTH BASE GLOBE
    const globeRadius = 1.0;
    const sphereGeometry = new THREE.SphereGeometry(globeRadius, 64, 64);
    
    // Texture loaders with robust fallback styling (in case offline or slow)
    const textureLoader = new THREE.TextureLoader();
    let earthMaterial: THREE.Material;

    setLoading(true);
    
    // Fallback beautiful cyber-grid baseline
    const createFallbackMaterial = () => {
      return new THREE.MeshPhongMaterial({
        color: 0x070707,
        emissive: 0x0a2211,
        specular: 0x113322,
        shininess: 25,
        bumpScale: 0.05,
        wireframe: false,
      });
    };

    earthMaterial = createFallbackMaterial();

    textureLoader.load(
      "https://unpkg.com/three-globe/example/img/earth-night.jpg",
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        (earthMaterial as THREE.MeshPhongMaterial).map = texture;
        (earthMaterial as THREE.MeshPhongMaterial).needsUpdate = true;
        setLoading(false);
      },
      undefined,
      (err) => {
        console.warn("Failed night texture loading, using cyber fallback.", err);
        setLoading(false);
      }
    );

    const earthMesh = new THREE.Mesh(sphereGeometry, earthMaterial);
    globeGroup.add(earthMesh);

    // CLOUD LAYER
    const cloudGeometry = new THREE.SphereGeometry(globeRadius + 0.015, 64, 64);
    const cloudMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.0, // Default to invisible, then updated on load
      blending: THREE.NormalBlending,
    });
    const cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
    globeGroup.add(cloudMesh);

    textureLoader.load(
      "https://unpkg.com/three-globe/example/img/earth-clouds.png",
      (texture) => {
        cloudMaterial.alphaMap = texture;
        cloudMaterial.transparent = true;
        cloudMaterial.opacity = 0.25;
        cloudMaterial.needsUpdate = true;
      },
      undefined,
      (err) => console.warn("Cloud texture omitted.")
    );

    // ATMOSPHERE SHIELD (Glow)
    const atmosphereGeometry = new THREE.SphereGeometry(globeRadius + 0.03, 32, 32);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff41,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    globeGroup.add(atmosphereMesh);

    // GLOBE GRID OVERLAY (Bloomberg cyber grid lines)
    const gridGeometry = new THREE.SphereGeometry(globeRadius + 0.002, 32, 16);
    const gridMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff41,
      wireframe: true,
      transparent: true,
      opacity: 0.06,
    });
    const gridMesh = new THREE.Mesh(gridGeometry, gridMaterial);
    globeGroup.add(gridMesh);

    // PINS & HALOS LAYER
    const pinObjectsGroup = new THREE.Group();
    globeGroup.add(pinObjectsGroup);

    const selectableObjects: THREE.Object3D[] = [];
    const pulseObjectsRef: { mesh: THREE.Mesh; creationTime: number }[] = [];

    // Helper: color status code mapper
    const getStatusColor = (status: string) => {
      switch (status) {
        case "confirmed": return 0x00FF41; // Verde
        case "permitted": return 0xFFD700; // Amarillo
        case "announced": return 0x00BFFF; // Azul
        case "review": return 0xFF4444;    // Rojo
        default: return 0x00FF41;
      }
    };

    // Instantiate pins on the globe representation
    const drawPins = () => {
      // Clear previous
      while (pinObjectsGroup.children.length > 0) {
        const obj = pinObjectsGroup.children[0];
        pinObjectsGroup.remove(obj);
      }
      selectableObjects.length = 0;
      pulseObjectsRef.length = 0;

      projects.forEach((proj) => {
        // Filter actions
        if (filterStatus.length > 0 && !filterStatus.includes(proj.status)) return;
        if (filterSector && filterSector !== "all" && proj.sector !== filterSector) return;

        const colorVal = getStatusColor(proj.status);

        // Geopolitical lat/lng to espherical standard conversion
        const latRad = (proj.lat * Math.PI) / 180;
        const lngRad = (proj.lng * Math.PI) / 180;

        const x = globeRadius * Math.cos(latRad) * Math.sin(lngRad);
        const y = globeRadius * Math.sin(latRad);
        const z = globeRadius * Math.cos(latRad) * Math.cos(lngRad);
        const P = new THREE.Vector3(x, y, z);

        // Pin Container (Helps with local orientation)
        const pinContainer = new THREE.Group();
        pinContainer.position.set(0, 0, 0);
        pinContainer.lookAt(P);
        pinContainer.userData = { project: proj, positionOnSphere: P };

        // 1. The Stick (cilindro vertical)
        const stickGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.08, 8);
        stickGeo.rotateX(Math.PI / 2); // points along Z
        stickGeo.translate(0, 0, 0.04); // shifts to sit on sphere surface

        const stickMat = new THREE.MeshPhongMaterial({
          color: colorVal,
          emissive: colorVal,
          emissiveIntensity: 0.3,
        });
        const stickMesh = new THREE.Mesh(stickGeo, stickMat);
        stickMesh.position.set(0, 0, 1.0);
        pinContainer.add(stickMesh);

        // 2. The Tip (esfera final)
        const tipGeo = new THREE.SphereGeometry(0.022, 16, 16);
        const tipMat = new THREE.MeshPhongMaterial({
          color: colorVal,
          emissive: colorVal,
          emissiveIntensity: 0.5,
          shininess: 30,
        });
        const tipMesh = new THREE.Mesh(tipGeo, tipMat);
        tipMesh.position.set(0, 0, 1.08); // floats on tip
        pinContainer.add(tipMesh);

        // 3. Ambient Pulsing Halo (only for confirmed)
        if (proj.status === "confirmed") {
          const haloGeo = new THREE.SphereGeometry(0.045, 16, 16);
          const haloMat = new THREE.MeshBasicMaterial({
            color: colorVal,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending,
          });
          const haloMesh = new THREE.Mesh(haloGeo, haloMat);
          haloMesh.position.set(0, 0, 1.08);
          pinContainer.add(haloMesh);
          pulseObjectsRef.push({ mesh: haloMesh, creationTime: Date.now() });
        }

        pinObjectsGroup.add(pinContainer);
        // Add tip or container meshes for raycasting selection
        selectableObjects.push(tipMesh);
      });
    };

    drawPins();

    // DRAW CONNECTIONS BETWEEN SELECTED AND RELATED PROJECTS (If enabled)
    const connectionsGroup = new THREE.Group();
    globeGroup.add(connectionsGroup);

    const drawConnections = () => {
      // Clear old connections
      while (connectionsGroup.children.length > 0) {
        connectionsGroup.remove(connectionsGroup.children[0]);
      }

      const activeProj = selectedProjectRef.current;
      if (!showConnections || !activeProj) return;

      // Draw arcs to related/nearest projects of the same sector or region
      const relScale = projects.filter(p => p.id !== activeProj.id && (p.sector === activeProj.sector || p.investorCountry === activeProj.investorCountry));
      
      const pLatRad = (activeProj.lat * Math.PI) / 180;
      const pLngRad = (activeProj.lng * Math.PI) / 180;
      const pX = globeRadius * Math.cos(pLatRad) * Math.sin(pLngRad);
      const pY = globeRadius * Math.sin(pLatRad);
      const pZ = globeRadius * Math.cos(pLatRad) * Math.cos(pLngRad);
      const startVec = new THREE.Vector3(pX, pY, pZ);

      relScale.slice(0, 3).forEach((trg) => {
        const tLatRad = (trg.lat * Math.PI) / 180;
        const tLngRad = (trg.lng * Math.PI) / 180;
        const tX = globeRadius * Math.cos(tLatRad) * Math.sin(tLngRad);
        const tY = globeRadius * Math.sin(tLatRad);
        const tZ = globeRadius * Math.cos(tLatRad) * Math.cos(tLngRad);
        const endVec = new THREE.Vector3(tX, tY, tZ);

        // Draw a beautiful curved arc using QuadraticBezierCurve3
        const midPoint = new THREE.Vector3().addVectors(startVec, endVec).multiplyScalar(0.5);
        // elevate midPoint outwards to make dynamic bridge arc
        const dist = startVec.distanceTo(endVec);
        midPoint.normalize().multiplyScalar(globeRadius + dist * 0.25);

        const curve = new THREE.QuadraticBezierCurve3(startVec, midPoint, endVec);
        const points = curve.getPoints(30);
        const curveGeometry = new THREE.BufferGeometry().setFromPoints(points);

        const curveMaterial = new THREE.LineBasicMaterial({
          color: 0x00ff41,
          transparent: true,
          opacity: 0.65,
        });
        const line = new THREE.Line(curveGeometry, curveMaterial);
        connectionsGroup.add(line);
      });
    };

    drawConnections();

    // INTERACTION MECHANICS (Drag to rotate, inertia, click/hover detection)
    let isDragging = false;
    let dragStartPos = { x: 0, y: 0 };
    let previousMousePos = { x: 0, y: 0 };
    const dampingFactor = 0.95;
    let forceY = 0;
    let forceX = 0;

    // Zoom controls
    let targetDistance = 2.4;
    let currentDistance = 2.4;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      setAutoRotate(false);
      const rect = renderer.domElement.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      dragStartPos = { x, y };
      previousMousePos = { x, y };
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const mx = ( (e.clientX - rect.left) / rect.width ) * 2 - 1;
      const my = -( (e.clientY - rect.top) / rect.height ) * 2 + 1;

      // Hover Raycasting
      const raycaster = new THREE.Raycaster();
      const hoverMouse = new THREE.Vector2(mx, my);
      raycaster.setFromCamera(hoverMouse, camera);
      const intersects = raycaster.intersectObjects(selectableObjects, true);

      if (intersects.length > 0) {
        let parentGroup: THREE.Object3D | null = intersects[0].object;
        while (parentGroup && !parentGroup.userData.project) {
          parentGroup = parentGroup.parent;
        }
        if (parentGroup && parentGroup.userData.project) {
          setHoveredProject(parentGroup.userData.project);
          document.body.style.cursor = "pointer";
          
          // Micro interaction visual tip scaling
          parentGroup.scale.set(1.4, 1.4, 1.4);
        }
      } else {
        setHoveredProject(null);
        document.body.style.cursor = "default";
        
        // Restore scales
        pinObjectsGroup.children.forEach(child => {
          child.scale.set(1.0, 1.0, 1.0);
        });
      }

      if (!isDragging) return;

      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      const deltaMove = {
        x: currentX - previousMousePos.x,
        y: currentY - previousMousePos.y,
      };

      globeGroup.rotation.y += deltaMove.x * 0.005;
      globeGroup.rotation.x += deltaMove.y * 0.005;

      // Clamp latitude rotation to avoid going upside down
      globeGroup.rotation.x = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, globeGroup.rotation.x));

      forceY = deltaMove.x * 0.005;
      forceX = deltaMove.y * 0.005;

      previousMousePos = { x: currentX, y: currentY };
    };

    const onMouseUp = (e: MouseEvent) => {
      isDragging = false;
      const rect = renderer.domElement.getBoundingClientRect();
      const endX = e.clientX - rect.left;
      const endY = e.clientY - rect.top;

      const clickDist = Math.sqrt(Math.pow(endX - dragStartPos.x, 2) + Math.pow(endY - dragStartPos.y, 2));
      
      // Perform click raycasting if user just clicked (did not drag significantly)
      if (clickDist < 5) {
        const mx = ( (e.clientX - rect.left) / rect.width ) * 2 - 1;
        const my = -( (e.clientY - rect.top) / rect.height ) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        const clickMouse = new THREE.Vector2(mx, my);
        raycaster.setFromCamera(clickMouse, camera);
        const intersects = raycaster.intersectObjects(selectableObjects, true);

        if (intersects.length > 0) {
          let parentGroup: THREE.Object3D | null = intersects[0].object;
          while (parentGroup && !parentGroup.userData.project) {
            parentGroup = parentGroup.parent;
          }
          if (parentGroup && parentGroup.userData.project) {
            const proj = parentGroup.userData.project as InfraProject;
            onSelectProject(proj);
          }
        } else {
          onSelectProject(null);
        }
      }
    };

    // Touch Support for mobile
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      isDragging = true;
      setAutoRotate(false);
      const rect = renderer.domElement.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      const y = e.touches[0].clientY - rect.top;
      dragStartPos = { x, y };
      previousMousePos = { x, y };
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length === 0) return;
      const rect = renderer.domElement.getBoundingClientRect();
      const currentX = e.touches[0].clientX - rect.left;
      const currentY = e.touches[0].clientY - rect.top;

      const deltaMove = {
        x: currentX - previousMousePos.x,
        y: currentY - previousMousePos.y,
      };

      globeGroup.rotation.y += deltaMove.x * 0.006;
      globeGroup.rotation.x += deltaMove.y * 0.006;
      globeGroup.rotation.x = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, globeGroup.rotation.x));

      forceY = deltaMove.x * 0.006;
      forceX = deltaMove.y * 0.006;
      previousMousePos = { x: currentX, y: currentY };
    };

    const onTouchEnd = (e: TouchEvent) => {
      isDragging = false;
    };

    // Zoom on wheel
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetDistance += e.deltaY * 0.0015;
      targetDistance = Math.max(1.2, Math.min(4.0, targetDistance));
    };

    // Register event listeners
    const domElem = renderer.domElement;
    domElem.addEventListener("mousedown", onMouseDown);
    domElem.addEventListener("mousemove", onMouseMove);
    domElem.addEventListener("mouseup", onMouseUp);
    domElem.addEventListener("touchstart", onTouchStart);
    domElem.addEventListener("touchmove", onTouchMove, { passive: true });
    domElem.addEventListener("touchend", onTouchEnd);
    domElem.addEventListener("wheel", onWheel, { passive: false });

    // RENDER / TICK LOOP
    let animationFrameId: number;

    const tick = () => {
      animationFrameId = requestAnimationFrame(tick);

      // 1. Slow automatic rotation when idle
      if (!isDragging && selectedProjectRef.current === null) {
        if (autoRotate) {
          globeGroup.rotation.y += 0.0006;
        }
        // Smooth inertia
        globeGroup.rotation.y += forceY;
        globeGroup.rotation.x += forceX;
        forceY *= dampingFactor;
        forceX *= dampingFactor;
      }

      // 2. Front-center camera alignment interpolation when a project is selected
      const currentActive = selectedProjectRef.current;
      if (currentActive && !isDragging) {
        const latRad = (currentActive.lat * Math.PI) / 180;
        const lngRad = (currentActive.lng * Math.PI) / 180;

        // Front face: X rotation goes to latitude, Y rotation goes to negative longitude
        globeGroup.rotation.y = THREE.MathUtils.lerp(globeGroup.rotation.y, -lngRad, 0.05);
        globeGroup.rotation.x = THREE.MathUtils.lerp(globeGroup.rotation.x, latRad, 0.05);
        
        // Zoom in to focus on details
        targetDistance = 1.5;
      }

      // 3. Zoom interpolation
      currentDistance = THREE.MathUtils.lerp(currentDistance, targetDistance, 0.1);
      camera.position.normalize().multiplyScalar(currentDistance);

      // 4. Animate Cloud Rotation
      cloudMesh.rotation.y += 0.0001;

      // 5. Ambient pulsing halos
      pulseObjectsRef.forEach((pulse) => {
        const elapsed = (Date.now() - pulse.creationTime) / 1000;
        // Oscilate scale between 1.0 and 1.6
        const cycle = (elapsed % 2.0) / 2.0; // 0 to 1
        const scaleVal = 1.0 + Math.sin(cycle * Math.PI) * 0.4;
        pulse.mesh.scale.set(scaleVal, scaleVal, scaleVal);
        (pulse.mesh.material as THREE.MeshBasicMaterial).opacity = 0.35 * (1.0 - (cycle * 0.8));
      });

      renderer.render(scene, camera);
    };

    tick();

    // RESIZE OBSERVER
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width: rw, height: rh } = entries[0].contentRect;
      camera.aspect = rw / rh;
      camera.updateProjectionMatrix();
      renderer.setSize(rw, rh);
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // CLEANUP
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      
      domElem.removeEventListener("mousedown", onMouseDown);
      domElem.removeEventListener("mousemove", onMouseMove);
      domElem.removeEventListener("mouseup", onMouseUp);
      domElem.removeEventListener("touchstart", onTouchStart);
      domElem.removeEventListener("touchmove", onTouchMove);
      domElem.removeEventListener("touchend", onTouchEnd);
      domElem.removeEventListener("wheel", onWheel);

      // dispose geometries/materials
      starGeometry.dispose();
      starMaterial.dispose();
      sphereGeometry.dispose();
      earthMaterial.dispose();
      cloudGeometry.dispose();
      cloudMaterial.dispose();
      atmosphereGeometry.dispose();
      atmosphereMaterial.dispose();
      gridGeometry.dispose();
      gridMaterial.dispose();
      
      if (mountRef.current && renderer.domElement.parentNode) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [projects, filterStatus, filterSector, showConnections]);

  const toggleAutoRotate = () => {
    setAutoRotate(!autoRotate);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#030303] border border-[#222] rounded-lg overflow-hidden flex flex-col group transition-all duration-300 hover:border-[#333] hover:shadow-[0_0_20px_rgba(0,255,65,0.12)] selection:bg-transparent"
    >
      {/* Visual Accent bar */}
      <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-[#00FF41]"></div>

      {/* Control overlay status banner */}
      <div className="absolute top-3 left-4 z-10 pointer-events-none font-mono">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#00FF41] animate-ping"></div>
          <span className="text-[10px] uppercase font-bold text-[#FFF] tracking-tighter">
            GEOPOLITICAL INFRASTRUCTURE GALAXY // 3D GLOBE
          </span>
        </div>
        <p className="text-[9px] text-zinc-500 mt-0.5">
          {projects.length} nodos activos cargados // Arrastre para rotación // Scroll zoom
        </p>
      </div>

      {/* Manual Action Tools Panel */}
      <div className="absolute top-3 right-4 z-10 flex items-center gap-1 bg-[#0A0A0A]/85 border border-[#222] p-1 rounded backdrop-blur">
        <button
          onClick={toggleAutoRotate}
          title={autoRotate ? "Pausar rotación del globo" : "Activar rotación lenta del globo"}
          className={`p-1.5 rounded transition ${
            autoRotate ? "text-[#00FF41] bg-[#00FF41]/10" : "text-zinc-500 hover:text-zinc-200"
          }`}
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onSelectProject(null)}
          title="Restablecer posición y foco"
          className="p-1.5 text-zinc-500 hover:text-zinc-200 rounded transition"
        >
          <Compass className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Selected target indicator card */}
      {selectedProject && (
        <div className="absolute bottom-4 left-4 z-10 max-w-[280px] bg-[#0A0A0A]/90 border border-[#00FF41]/30 p-2.5 rounded backdrop-blur text-[10px] font-mono shadow-xl transition-all">
          <span className="text-zinc-600 uppercase text-[9px] block">PROYECTO SELECCIONADO:</span>
          <span className="text-[#00FF41] font-bold block truncate text-xs mt-0.5" title={selectedProject.name}>
            {selectedProject.name}
          </span>
          <div className="grid grid-cols-2 gap-x-2 mt-1 px-1 py-0.5 bg-black/60 rounded">
            <div>
              <span className="text-zinc-500 block text-[8px]">INVERSOR:</span>
              <span className="text-white block truncate">{selectedProject.investor}</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[8px]">CAPITAL:</span>
              <span className="text-[#00FF41] font-bold block">{selectedProject.currency} {selectedProject.amount}B</span>
            </div>
          </div>
          <button
            onClick={() => onSelectProject(null)}
            className="w-full text-center text-zinc-500 hover:text-white uppercase tracking-wider text-[8px] mt-1.5 pt-1 border-t border-[#111] transition-colors"
          >
            Restablecer Vista
          </button>
        </div>
      )}

      {/* Hover Info Tip (Absolute screen aligned coordinates) */}
      {hoveredProject && !selectedProject && (
        <div className="absolute bottom-4 right-4 z-10 bg-[#0A0A0A]/95 border border-[#333] p-2.5 rounded backdrop-blur text-[10px] font-mono pointer-events-none">
          <span className="text-[#00FF41] uppercase font-bold block">{hoveredProject.name}</span>
          <span className="text-[#A0A0A0] block mt-0.5">{hoveredProject.sector}</span>
          <span className="text-zinc-500 block mt-0.5">Monto: {hoveredProject.currency} {hoveredProject.amount}B // {hoveredProject.status.toUpperCase()}</span>
        </div>
      )}

      {/* Main 3D Canvas mount */}
      <div ref={mountRef} className="w-full h-full flex-1 min-h-[300px]" />

      {/* Shimmer loading curtain */}
      {loading && (
        <div className="absolute inset-0 bg-[#030303] flex flex-col items-center justify-center text-zinc-500 font-mono gap-1.5">
          <Globe className="w-6 h-6 text-[#00FF41] animate-spin" />
          <span className="text-[10px] uppercase tracking-widest text-[#00FF41] animate-pulse">Sincronizando coordenadas planetarias...</span>
        </div>
      )}
    </div>
  );
}
