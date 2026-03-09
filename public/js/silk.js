/**
 * Silk Shader Background Effect — Vanilla JS (converted from React/Three.js)
 * A flowing silk-like animated pattern using raw WebGL
 */

(function () {
    'use strict';

    const vertexShader = `
    precision highp float;
    attribute vec2 position;
    varying vec2 vUv;
    void main() {
      vUv = position * 0.5 + 0.5;
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

    const fragmentShader = `
    precision highp float;

    varying vec2 vUv;

    uniform float uTime;
    uniform vec3  uColor;
    uniform float uSpeed;
    uniform float uScale;
    uniform float uRotation;
    uniform float uNoiseIntensity;
    uniform vec2  uResolution;

    const float e = 2.71828182845904523536;

    float noise(vec2 texCoord) {
      float G = e;
      vec2  r = (G * sin(G * texCoord));
      return fract(r.x * r.y * (1.0 + texCoord.x));
    }

    vec2 rotateUvs(vec2 uv, float angle) {
      float c = cos(angle);
      float s = sin(angle);
      mat2  rot = mat2(c, -s, s, c);
      return rot * uv;
    }

    void main() {
      float rnd        = noise(gl_FragCoord.xy);
      vec2  uv         = rotateUvs(vUv * uScale, uRotation);
      vec2  tex        = uv * uScale;
      float tOffset    = uSpeed * uTime;

      tex.y += 0.03 * sin(8.0 * tex.x - tOffset);

      float pattern = 0.6 +
                      0.4 * sin(5.0 * (tex.x + tex.y +
                                       cos(3.0 * tex.x + 5.0 * tex.y) +
                                       0.02 * tOffset) +
                               sin(20.0 * (tex.x + tex.y - 0.1 * tOffset)));

      vec4 col = vec4(uColor, 1.0) * vec4(pattern) - rnd / 15.0 * uNoiseIntensity;
      col.a = 1.0;
      gl_FragColor = col;
    }
  `;

    function createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Silk shader error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    function createProgram(gl, vs, fs) {
        const program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Silk program error:', gl.getProgramInfoLog(program));
            return null;
        }
        return program;
    }

    function hexToRGB(hex) {
        hex = hex.replace('#', '');
        return [
            parseInt(hex.slice(0, 2), 16) / 255,
            parseInt(hex.slice(2, 4), 16) / 255,
            parseInt(hex.slice(4, 6), 16) / 255
        ];
    }

    function initSilk(container, options) {
        const opts = Object.assign({
            speed: 5,
            scale: 1,
            color: '#7B7481',
            noiseIntensity: 1.5,
            rotation: 0
        }, options);

        const canvas = document.createElement('canvas');
        container.appendChild(canvas);

        const gl = canvas.getContext('webgl', { alpha: false });
        if (!gl) {
            console.warn('WebGL not supported for Silk');
            return;
        }

        const vs = createShader(gl, gl.VERTEX_SHADER, vertexShader);
        const fs = createShader(gl, gl.FRAGMENT_SHADER, fragmentShader);
        if (!vs || !fs) return;

        const program = createProgram(gl, vs, fs);
        if (!program) return;

        gl.useProgram(program);

        // Full-screen triangle
        const posBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1,
            3, -1,
            -1, 3
        ]), gl.STATIC_DRAW);

        const posLoc = gl.getAttribLocation(program, 'position');
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        // Uniforms
        const uTime = gl.getUniformLocation(program, 'uTime');
        const uColor = gl.getUniformLocation(program, 'uColor');
        const uSpeed = gl.getUniformLocation(program, 'uSpeed');
        const uScale = gl.getUniformLocation(program, 'uScale');
        const uRotation = gl.getUniformLocation(program, 'uRotation');
        const uNoiseIntensity = gl.getUniformLocation(program, 'uNoiseIntensity');
        const uResolution = gl.getUniformLocation(program, 'uResolution');

        const rgb = hexToRGB(opts.color);
        let time = 0;
        let rafId;

        function resize() {
            const dpr = Math.min(window.devicePixelRatio || 1, 1); // Cap DPR for background shader
            const w = container.clientWidth;
            const h = container.clientHeight;
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            canvas.style.width = w + 'px';
            canvas.style.height = h + 'px';
            gl.viewport(0, 0, canvas.width, canvas.height);
        }
        window.addEventListener('resize', resize);
        resize();

        function frame(t) {
            rafId = requestAnimationFrame(frame);

            time += 0.1 * (1 / 60); // Approximate delta

            gl.useProgram(program);
            gl.uniform1f(uTime, time);
            gl.uniform3f(uColor, rgb[0], rgb[1], rgb[2]);
            gl.uniform1f(uSpeed, opts.speed);
            gl.uniform1f(uScale, opts.scale);
            gl.uniform1f(uRotation, opts.rotation);
            gl.uniform1f(uNoiseIntensity, opts.noiseIntensity);
            gl.uniform2f(uResolution, canvas.width, canvas.height);

            gl.drawArrays(gl.TRIANGLES, 0, 3);
        }
        rafId = requestAnimationFrame(frame);

        return function destroy() {
            cancelAnimationFrame(rafId);
            window.removeEventListener('resize', resize);
            gl.getExtension('WEBGL_lose_context')?.loseContext();
            canvas.remove();
        };
    }

    // Auto-init
    document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('.silk-wrapper').forEach(function (el) {
            initSilk(el, {
                speed: parseFloat(el.dataset.speed || 5),
                scale: parseFloat(el.dataset.scale || 1),
                color: el.dataset.color || '#7B7481',
                noiseIntensity: parseFloat(el.dataset.noiseIntensity || 1.5),
                rotation: parseFloat(el.dataset.rotation || 0)
            });
        });
    });
})();
