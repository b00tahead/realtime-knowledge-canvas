export const VERT_SRC = `#version 300 es
precision highp float;

// per-vertex: x, y (world), r, g, b, a
in vec2 a_position;
in vec4 a_color;

uniform vec2 u_resolution;
uniform vec2 u_camera;
uniform float u_zoom;

out vec4 v_color;

void main() {
  vec2 screen = (a_position - u_camera) * u_zoom;
  // pixel center → clip space
  vec2 zeroToOne = screen / u_resolution;
  vec2 zeroToTwo = zeroToOne * 2.0;
  vec2 clip = zeroToTwo - 1.0;
  clip.y = -clip.y;
  gl_Position = vec4(clip, 0.0, 1.0);
  v_color = a_color;
}
`;

export const FRAG_SRC = `#version 300 es
precision highp float;

in vec4 v_color;
out vec4 outColor;

void main() {
  outColor = v_color;
}
`;
