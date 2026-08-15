/* ============================================================
   WEBGL2 HERO, domain-warped fractal Brownian motion

   Renders a single full-screen triangle and does all the work in
   the fragment shader. Nothing is loaded, nothing is textured:
   the whole image is noise folded through itself twice.

   The draw loop pauses whenever the hero scrolls out of view.
   ============================================================ */

const VERT = `#version 300 es
in vec2 p; void main(){gl_Position=vec4(p,0.,1.);}`;

const FRAG = `#version 300 es
precision highp float;
out vec4 o;
uniform vec2 uRes; uniform float uTime; uniform vec3 uHue; uniform float uSpeed;

float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){
  vec2 i=floor(p),f=fract(p); vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),
             mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);
}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<6;i++){v+=a*noise(p);p*=2.03;a*=.5;}return v;}
vec3 hsv2rgb(vec3 c){
  vec4 K=vec4(1.,2./3.,1./3.,3.);
  vec3 p=abs(fract(c.xxx+K.xyz)*6.-K.www);
  return c.z*mix(K.xxx,clamp(p-K.xxx,0.,1.),c.y);
}
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*uRes)/uRes.y;
  float t=uTime*uSpeed;
  /* DOMAIN WARP: q warps r, r warps the final sample. this is the whole effect. */
  vec2 q=vec2(fbm(uv*2.3+vec2(0.,t*.26)), fbm(uv*2.3+vec2(5.2,1.3)-t*.19));
  vec2 r=vec2(fbm(uv*2.3+3.3*q+vec2(1.7,9.2)+t*.15), fbm(uv*2.3+3.3*q+vec2(8.3,2.8)-t*.11));
  float f=fbm(uv*2.3+3.5*r);
  f=pow(smoothstep(.16,1.04,f),1.4);
  f*=1.-smoothstep(.14,1.18,length(uv*vec2(.76,1.)));
  vec3 hot=hsv2rgb(vec3(uHue.x,uHue.y*.70,uHue.z));
  vec3 mid=hsv2rgb(vec3(uHue.x-.05,uHue.y,uHue.z*.56));
  /* Darkest tone matches --bg in the CSS. If these drift apart the vignette
     fades to a different black than the shader's own floor and the seam shows. */
  vec3 col=mix(vec3(.043,.047,.055),mid,smoothstep(.02,.54,f));
  col=mix(col,hot,smoothstep(.44,1.,f));
  col+=(hash(gl_FragCoord.xy+uTime)-.5)*.024;   /* grain kills banding */
  o=vec4(col,1.);
}`;

const HUE = [0.045, 0.88, 0.95]; /* ember: h,s,v, edit here to reskin the hero */

function compile(gl, type, src) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
}

/**
 * Boot the hero background.
 *
 * Returns false and leaves the canvas blank if WebGL2 is unavailable or the
 * program fails to build. The hero still reads fine in that case: the vignette
 * and the flat page background sit on top of an empty canvas. The caller must
 * not treat a false return as fatal, because the rest of the page does not
 * depend on this running.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {Element} visibilityTarget element watched to pause the loop offscreen
 * @returns {boolean} whether the shader is running
 */
export function initShader(canvas, visibilityTarget) {
  if (!canvas) return false;

  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false });
  if (!gl) {
    console.warn('[hero] WebGL2 unavailable, skipping background shader.');
    return false;
  }

  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return false;

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error('[hero] program link failed:', gl.getProgramInfoLog(prog));
    return false;
  }
  gl.useProgram(prog);

  /* One oversized triangle covers the viewport with no index buffer. */
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const al = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(al);
  gl.vertexAttribPointer(al, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, 'uRes');
  const uTime = gl.getUniformLocation(prog, 'uTime');
  const uHue = gl.getUniformLocation(prog, 'uHue');
  const uSpeed = gl.getUniformLocation(prog, 'uSpeed');

  function resize() {
    const d = Math.min(devicePixelRatio || 1, 1.7);
    canvas.width = canvas.clientWidth * d;
    canvas.height = canvas.clientHeight * d;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  addEventListener('resize', resize);
  resize();

  let heroVisible = true;
  const t0 = performance.now();

  (function draw(now) {
    requestAnimationFrame(draw);
    if (!heroVisible) return; /* stop rendering offscreen */
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, (now - t0) / 1000);
    gl.uniform3f(uHue, HUE[0], HUE[1], HUE[2]);
    gl.uniform1f(uSpeed, 1);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  })(t0);

  if (visibilityTarget) {
    new IntersectionObserver((e) => {
      heroVisible = e[0].isIntersecting;
    }, { threshold: 0 }).observe(visibilityTarget);
  }

  return true;
}
