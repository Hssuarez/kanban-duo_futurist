'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { CommandCenterModuleConfig } from './commandCenterConfig';

interface PlanetSurfaceProps {
  module: CommandCenterModuleConfig;
  size: number;
  rotationYawRef: React.MutableRefObject<number>;
  rotationPitchRef: React.MutableRefObject<number>;
  velocityYawRef: React.MutableRefObject<number>;
  isDraggingRef: React.MutableRefObject<boolean>;
  isHovered: boolean;
}

interface SurfaceNode {
  lat: number;
  lon: number;
  size: number;
  isAnchor?: boolean;
}

interface IdentityItem {
  lat: number;
  lon: number;
  type: string;
  val: number;
}

export const PlanetSurface: React.FC<PlanetSurfaceProps> = ({
  module,
  size,
  rotationYawRef,
  rotationPitchRef,
  velocityYawRef,
  isDraggingRef,
  isHovered,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());

  // Datos superficiales estables precalculados por planeta
  const surfaceGridRef = useRef<{
    meridians: number[];
    latitudes: number[];
    nodes: SurfaceNode[];
    identityItems: IdentityItem[];
  } | null>(null);

  if (!surfaceGridRef.current) {
    // 6 meridianos principales cada 60 grados (PI / 3)
    const meridians = [0, Math.PI / 3, (2 * Math.PI) / 3, Math.PI, (4 * Math.PI) / 3, (5 * Math.PI) / 3];
    // 5 paralelos
    const latitudes = [-0.62, -0.32, 0, 0.32, 0.62];

    const nodes: SurfaceNode[] = [];
    for (let m = 0; m < meridians.length; m++) {
      const lon = meridians[m];
      for (let l = 0; l < latitudes.length; l++) {
        const lat = latitudes[l];
        nodes.push({
          lat,
          lon,
          size: lat === 0 ? 2.2 : 1.5,
          isAnchor: lat === 0 && m % 2 === 0,
        });
      }
    }

    // Motivos superficiales tecnológicos de cada módulo
    const identityItems: IdentityItem[] = [];
    if (module.id === 'board') {
      // TABLERO: 3 columnas de micro-tarjetas kanban a 120°
      for (let c = 0; c < 3; c++) {
        const baseLon = (c * Math.PI * 2) / 3;
        for (let r = -2; r <= 2; r++) {
          identityItems.push({
            lat: r * 0.2,
            lon: baseLon,
            type: 'card_col',
            val: (c + r + 5) % 3,
          });
        }
      }
    } else if (module.id === 'calendar') {
      // CALENDARIO: 12 marcas cronológicas en el ecuador
      for (let i = 0; i < 12; i++) {
        identityItems.push({
          lat: 0,
          lon: (i * Math.PI * 2) / 12,
          type: 'dial_tick',
          val: i,
        });
      }
    } else if (module.id === 'dashboard') {
      // MÉTRICAS: Micro barras de histograma y marcadores de pulso
      for (let q = 0; q < 4; q++) {
        const qLon = (q * Math.PI) / 2;
        for (let b = 0; b < 3; b++) {
          identityItems.push({
            lat: -0.15 + b * 0.15,
            lon: qLon + b * 0.08,
            type: 'chart_bar',
            val: (b + 1) * 2,
          });
        }
      }
    } else if (module.id === 'habits') {
      // HÁBITOS: Anillo bio-rítmico ondulante
      for (let i = 0; i < 16; i++) {
        identityItems.push({
          lat: Math.sin(i * 1.2) * 0.28,
          lon: (i * Math.PI * 2) / 16,
          type: 'bio_node',
          val: i % 2,
        });
      }
    } else if (module.id === 'challenges') {
      // RETOS: Diamantes de victoria distribuidos
      for (let i = 0; i < 6; i++) {
        identityItems.push({
          lat: i % 2 === 0 ? 0.35 : -0.35,
          lon: (i * Math.PI * 2) / 6,
          type: 'trophy_crest',
          val: i,
        });
      }
    } else if (module.id === 'goals') {
      // OBJETIVOS: Cruz de calibración balística
      for (let i = 0; i < 4; i++) {
        identityItems.push({
          lat: 0,
          lon: (i * Math.PI) / 2,
          type: 'target_cross',
          val: i,
        });
      }
    } else if (module.id === 'pomodoro') {
      // POMODORO: 8 perlas de concentración temporizada
      for (let i = 0; i < 8; i++) {
        identityItems.push({
          lat: 0.18 * Math.cos((i * Math.PI * 2) / 8),
          lon: (i * Math.PI * 2) / 8,
          type: 'timer_pip',
          val: i,
        });
      }
    }

    surfaceGridRef.current = {
      meridians,
      latitudes,
      nodes,
      identityItems,
    };
  }

  // Bucle de renderizado continuo a 60 FPS
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2.5) : 1;
    const displaySize = size;
    const targetW = Math.round(displaySize * dpr);
    const targetH = Math.round(displaySize * dpr);

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    const now = performance.now();
    const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1);
    lastTimeRef.current = now;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Física de rotación axial (Inercia al soltar o crucero continuo)
    if (!isDraggingRef.current && !prefersReducedMotion) {
      if (Math.abs(velocityYawRef.current) > 0.05) {
        // Inercia de desaceleración suave (400-800ms)
        rotationYawRef.current += velocityYawRef.current;
        velocityYawRef.current *= 0.938;
      } else {
        velocityYawRef.current = 0;
        // Velocidad de crucero ambiental propia
        const baseSpeed = isHovered
          ? module.axialSpinSpeedDegPerSec * 1.35
          : module.axialSpinSpeedDegPerSec;
        rotationYawRef.current += baseSpeed * dt;
      }

      // Suave retorno elástico del pitch al ángulo canónico del anillo
      if (Math.abs(rotationPitchRef.current - module.ringTiltDeg) > 0.08) {
        rotationPitchRef.current +=
          (module.ringTiltDeg - rotationPitchRef.current) * (3.5 * dt);
      }
    }

    // Configuración del contexto con DPI
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, displaySize, displaySize);

    const radius = displaySize * 0.44;
    const cx = displaySize / 2;
    const cy = displaySize / 2;

    const yawRad = (rotationYawRef.current * Math.PI) / 180;
    const pitchRad = (rotationPitchRef.current * Math.PI) / 180;
    const cosPitch = Math.cos(pitchRad);
    const sinPitch = Math.sin(pitchRad);

    // Función de proyección ortográfica 3D (X: derecha, Y: arriba, Z: hacia espectador)
    const project = (lat: number, lon: number) => {
      const lambda = lon + yawRad;
      const cosLat = Math.cos(lat);
      const sinLat = Math.sin(lat);

      const X = cosLat * Math.sin(lambda);
      const Y = sinLat;
      const Z = cosLat * Math.cos(lambda);

      // Inclinación sobre eje horizontal X (pitch)
      const Yp = Y * cosPitch - Z * sinPitch;
      const Zp = Y * sinPitch + Z * cosPitch;
      const Xp = X;

      return {
        x: cx + Xp * radius,
        y: cy - Yp * radius,
        z: Zp,
        visible: Zp > -0.05,
      };
    };

    // ========================================================
    // 1. CUERPO ESFÉRICO 3D (BASE PROFUNDA Y LUZ DIRECCIONAL)
    // ========================================================
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);

    // Gradiente esférico con foco de luz en top-left
    const lightX = cx - radius * 0.35;
    const lightY = cy - radius * 0.38;
    const baseGrad = ctx.createRadialGradient(
      lightX,
      lightY,
      radius * 0.08,
      cx,
      cy,
      radius * 1.05
    );
    baseGrad.addColorStop(0, '#1e293b');
    baseGrad.addColorStop(0.35, '#0f172a');
    baseGrad.addColorStop(0.7, '#080d1a');
    baseGrad.addColorStop(1, '#020617');

    ctx.fillStyle = baseGrad;
    ctx.fill();

    // Máscara de recorte esférico perfecta para toda la superficie
    ctx.clip();

    // ========================================================
    // 2. PARALELOS DE LATITUD (CURVAS DE PERSPECTIVA 3D)
    // ========================================================
    const grid = surfaceGridRef.current!;
    ctx.lineWidth = 0.85;

    for (const lat of grid.latitudes) {
      ctx.beginPath();
      let hasStarted = false;
      const step = Math.PI / 24;

      for (let lon = 0; lon <= Math.PI * 2 + 0.01; lon += step) {
        const pt = project(lat, lon);
        if (pt.visible) {
          if (!hasStarted) {
            ctx.moveTo(pt.x, pt.y);
            hasStarted = true;
          } else {
            ctx.lineTo(pt.x, pt.y);
          }
        } else {
          hasStarted = false;
        }
      }

      ctx.strokeStyle = module.accentHex;
      ctx.globalAlpha = lat === 0 ? 0.35 : 0.16;
      ctx.stroke();
    }

    // ========================================================
    // 3. MERIDIANOS LONGITUDINALES (ROTACIÓN VISIBLE 3D)
    // ========================================================
    for (const baseLon of grid.meridians) {
      ctx.beginPath();
      let hasStarted = false;
      const latSteps = 30;

      for (let s = 0; s <= latSteps; s++) {
        const lat = -Math.PI / 2 + (s / latSteps) * Math.PI;
        const pt = project(lat, baseLon);

        if (pt.visible) {
          if (!hasStarted) {
            ctx.moveTo(pt.x, pt.y);
            hasStarted = true;
          } else {
            ctx.lineTo(pt.x, pt.y);
          }
        } else {
          hasStarted = false;
        }
      }

      ctx.strokeStyle = module.accentHex;
      ctx.globalAlpha = 0.28;
      ctx.stroke();
    }

    // ========================================================
    // 4. MICRO-TICKS DE TELEMETRÍA EN EL ECUADOR
    // ========================================================
    ctx.strokeStyle = module.accentHex;
    ctx.lineWidth = 1;
    const equatorTicks = 24;
    for (let t = 0; t < equatorTicks; t++) {
      const lon = (t * Math.PI * 2) / equatorTicks;
      const ptBottom = project(-0.04, lon);
      const ptTop = project(0.04, lon);

      if (ptBottom.visible && ptTop.visible && ptBottom.z > 0.1) {
        ctx.globalAlpha = ptBottom.z * 0.45;
        ctx.beginPath();
        ctx.moveTo(ptBottom.x, ptBottom.y);
        ctx.lineTo(ptTop.x, ptTop.y);
        ctx.stroke();
      }
    }

    // ========================================================
    // 5. MOTIVOS TECNOLÓGICOS ESPECÍFICOS DEL MÓDULO (3D)
    // ========================================================
    for (const item of grid.identityItems) {
      const pt = project(item.lat, item.lon);
      if (pt.visible && pt.z > 0.05) {
        const depth = Math.max(0.2, pt.z);

        if (item.type === 'card_col') {
          // Mini tarjetas kanban en órbita superficial
          ctx.fillStyle = module.accentHex;
          ctx.globalAlpha = depth * (isHovered ? 0.85 : 0.6);
          const w = 4 * depth;
          const h = 2.5 * depth;
          ctx.fillRect(pt.x - w / 2, pt.y - h / 2, w, h);
        } else if (item.type === 'dial_tick') {
          // Marcas del dial cronológico
          ctx.strokeStyle = '#ffffff';
          ctx.globalAlpha = depth * 0.7;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 1.2 * depth, 0, Math.PI * 2);
          ctx.stroke();
        } else if (item.type === 'chart_bar') {
          // Columnas de histograma
          ctx.fillStyle = module.color;
          ctx.globalAlpha = depth * 0.8;
          ctx.fillRect(pt.x - 1, pt.y - item.val * depth, 2, item.val * depth);
        } else if (item.type === 'bio_node') {
          // Nodos bio-rítmicos
          ctx.fillStyle = '#10b981';
          ctx.globalAlpha = depth * (item.val === 1 ? 0.9 : 0.5);
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, (item.val === 1 ? 2 : 1.2) * depth, 0, Math.PI * 2);
          ctx.fill();
        } else if (item.type === 'trophy_crest') {
          // Diamante estelar
          ctx.fillStyle = '#fde047';
          ctx.globalAlpha = depth * 0.85;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 1.8 * depth, 0, Math.PI * 2);
          ctx.fill();
        } else if (item.type === 'target_cross') {
          // Cruz de calibración
          ctx.strokeStyle = module.accentHex;
          ctx.lineWidth = 1;
          ctx.globalAlpha = depth * 0.75;
          ctx.beginPath();
          ctx.moveTo(pt.x - 3 * depth, pt.y);
          ctx.lineTo(pt.x + 3 * depth, pt.y);
          ctx.moveTo(pt.x, pt.y - 3 * depth);
          ctx.lineTo(pt.x, pt.y + 3 * depth);
          ctx.stroke();
        } else if (item.type === 'timer_pip') {
          // Perlas de cuenta regresiva
          ctx.fillStyle = module.accentHex;
          ctx.globalAlpha = depth * 0.8;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 1.5 * depth, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // ========================================================
    // 6. NODOS DE RED E INTERSECCIONES DE DATOS (SUPERFICIE)
    // ========================================================
    for (const node of grid.nodes) {
      const pt = project(node.lat, node.lon);
      if (pt.visible) {
        const depth = Math.max(0.1, pt.z);
        const nodeRadius = node.size * (0.6 + depth * 0.7);

        ctx.fillStyle = node.isAnchor ? '#ffffff' : module.accentHex;
        ctx.globalAlpha = depth * (isHovered ? 0.95 : 0.7);

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, nodeRadius, 0, Math.PI * 2);
        ctx.fill();

        // Conector de circuito sutil en nodos frontales
        if (node.isAnchor && pt.z > 0.4) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 0.6;
          ctx.globalAlpha = depth * 0.4;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, nodeRadius + 2, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }

    // ========================================================
    // 7. SOMBRA DE TERMINADOR LATERAL (PROFUNDIDAD ESFÉRICA)
    // ========================================================
    const shadowGrad = ctx.createRadialGradient(
      cx + radius * 0.45,
      cy + radius * 0.45,
      radius * 0.25,
      cx,
      cy,
      radius * 1.08
    );
    shadowGrad.addColorStop(0, 'rgba(2, 6, 23, 0)');
    shadowGrad.addColorStop(0.55, 'rgba(2, 6, 23, 0.45)');
    shadowGrad.addColorStop(0.85, 'rgba(2, 6, 23, 0.82)');
    shadowGrad.addColorStop(1, 'rgba(2, 6, 23, 0.96)');

    ctx.globalAlpha = 1;
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // ========================================================
    // 8. FRESNEL NEON RIM LIGHT (BORDE LUMINOSO CIBERNÉTICO)
    // ========================================================
    const rimGrad = ctx.createRadialGradient(
      lightX,
      lightY,
      radius * 0.3,
      cx,
      cy,
      radius
    );
    rimGrad.addColorStop(0.72, 'rgba(255, 255, 255, 0)');
    rimGrad.addColorStop(0.92, module.accentHex);
    rimGrad.addColorStop(1, 'rgba(255, 255, 255, 0.85)');

    ctx.globalAlpha = isHovered ? 0.85 : 0.6;
    ctx.fillStyle = rimGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // ========================================================
    // 9. DESTELLO ESPECULAR DE CRISTAL (TOP-LEFT GLINT)
    // ========================================================
    ctx.save();
    ctx.translate(lightX, lightY);
    ctx.rotate(-Math.PI / 4);
    const glintGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 0.35);
    glintGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
    glintGrad.addColorStop(0.4, 'rgba(255, 255, 255, 0.15)');
    glintGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = glintGrad;
    ctx.beginPath();
    ctx.scale(1.2, 0.6);
    ctx.arc(0, 0, radius * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore(); // Restaura el ctx.clip() de la esfera

    ctx.restore(); // Restaura escala DPR

    animFrameRef.current = requestAnimationFrame(draw);
  }, [module, isHovered, size]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: size,
        height: size,
      }}
      className="rounded-full drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)]"
    />
  );
};
