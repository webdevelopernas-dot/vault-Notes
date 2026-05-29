import { useEffect, useRef } from "react";
import * as THREE from "three";

const fragmentShader = `
precision highp float;

uniform float u_time;
uniform vec2 u_mouse;
uniform vec2 u_resolution;
uniform float u_intensity;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

vec2 random2(vec2 st) {
  st = vec2(dot(st, vec2(127.1, 311.7)), dot(st, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(st) * 43758.5453123);
}

float voronoi(vec2 x, out vec2 center) {
  vec2 n = floor(x);
  vec2 f = fract(x);
  float md = 8.0;
  vec2 mg, mr, centerCell;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 o = random2(n + g) * 0.5 + 0.5;
      o = 0.5 + 0.4 * sin(u_time * 0.15 + 6.2831 * o);
      vec2 r = g + o - f;
      float d = dot(r, r);
      if (d < md) {
        md = d;
        mr = r;
        mg = g;
        centerCell = o;
      }
    }
  }
  center = n + mg + centerCell;
  return sqrt(md);
}

vec3 getColor(float cellId) {
  if (cellId < 0.15) return vec3(0.05, 0.08, 0.12);
  else if (cellId < 0.35) return vec3(0.08, 0.15, 0.18);
  else if (cellId < 0.55) return vec3(0.06, 0.12, 0.15);
  else if (cellId < 0.75) return vec3(0.10, 0.18, 0.20);
  else return vec3(0.07, 0.14, 0.16);
}

void main() {
  vec2 st = gl_FragCoord.xy / u_resolution.xy;
  st.x *= u_resolution.x / u_resolution.y;
  vec2 pos = st;
  if (u_mouse.x > 0.0) {
    vec2 mouseNorm = u_mouse / u_resolution;
    mouseNorm.x *= u_resolution.x / u_resolution.y;
    vec2 diff = pos - mouseNorm;
    float dist = length(diff);
    float influence = exp(-dist * dist * 8.0);
    pos += diff * influence * 0.4;
  }
  float scale = 5.0;
  pos *= scale;
  vec2 cellCenter;
  float cellDist = voronoi(pos, cellCenter);
  float cellId = fract(sin(dot(cellCenter, vec2(127.1, 311.7))) * 43758.5453);
  float edgeDist = cellDist;
  float edge = 1.0 - smoothstep(0.0, 0.06, edgeDist);
  vec3 baseColor = getColor(cellId);
  float breath = 0.5 + 0.5 * sin(u_time * 0.4 + cellId * 10.0);
  vec3 lineColor = mix(vec3(0.15, 0.35, 0.40), vec3(0.20, 0.50, 0.55), breath);
  float glow = (1.0 - smoothstep(0.0, 0.25, edgeDist)) * 0.3;
  vec3 finalColor = mix(baseColor, lineColor, edge);
  finalColor += vec3(0.15, 0.40, 0.45) * glow;
  float ambient = snoise(st * 1.5 + u_time * 0.05) * 0.03;
  finalColor += vec3(ambient * 0.5, ambient * 0.8, ambient);
  float vignette = 1.0 - smoothstep(0.5, 1.5, length(st - vec2(0.5 * u_resolution.x / u_resolution.y, 0.5)));
  finalColor *= mix(0.7, 1.0, vignette);
  gl_FragColor = vec4(finalColor, 1.0);
}
`;

const vertexShader = `
void main() {
  gl_Position = vec4(position, 1.0);
}
`;

export function GlowingNetworkBackground() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    mount.appendChild(renderer.domElement);

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        u_time: { value: 0 },
        u_mouse: { value: new THREE.Vector2(0.0, 0.0) },
        u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        u_intensity: { value: 1.0 },
      },
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    let animationFrameId: number;

    const animate = (time: number) => {
      animationFrameId = requestAnimationFrame(animate);
      material.uniforms.u_time.value = time * 0.001;
      renderer.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(animate);

    const handleMouseMove = (event: MouseEvent) => {
      material.uniforms.u_mouse.value.set(event.clientX, window.innerHeight - event.clientY);
    };

    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      material.uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
