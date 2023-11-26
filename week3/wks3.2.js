"use strict";
var gl;
var canvas;

var theta = 0.0;
var phi = 0.0;
var dr = Math.PI / 180.0;
var radius = 4.0;
var mvMatrix, pMatrix, tMatrix;
var VLoc, PLoc, TLoc;
var dx, dy;
var eye;
const NumVertices = 36;
var transform;
window.onload = function init() {
  canvas = document.getElementById("canvas");
  gl = WebGLUtils.setupWebGL(canvas);

  var ext = gl.getExtension("OES_element_index_uint");
  if (!ext) {
    console.log("Warning: Unable to use an extension");
  }

  gl.clearColor(0.7, 0.0, 0.5, 1.0);
  //gl.clear(gl.COLOR_BUFFER_BIT);

  //convert from the clip space values to back into pixels
  gl.viewport(0, 0, canvas.width, canvas.height);
  // Enable depth testing
  gl.enable(gl.DEPTH_TEST);

  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  var colors = [
    [0.0, 0.0, 0.0, 1.0], // black
    [1.0, 0.0, 0.0, 1.0], // red
    [1.0, 1.0, 0.0, 1.0], // yellow
    [0.0, 1.0, 0.0, 1.0], // green
    [0.0, 0.0, 1.0, 1.0], // blue
    [1.0, 0.0, 1.0, 1.0], // magenta
    [1.0, 1.0, 1.0, 1.0], // white
    [0.0, 1.0, 1.0, 1.0], // cyan
  ];

  var vertices = [
    vec3(0.0, 0.0, 1.0),
    vec3(0.0, 1.0, 1.0),
    vec3(1.0, 1.0, 1.0),
    vec3(1.0, 0.0, 1.0),
    vec3(0.0, 0.0, 0.0),
    vec3(0.0, 1.0, 0.0),
    vec3(1.0, 1.0, 0.0),
    vec3(1.0, 0.0, 0.0),
  ];
  var wire_indices = new Uint32Array([
    0, 1, 1, 2, 2, 3, 3, 0, 2, 3, 3, 7, 7, 6, 6, 2, 0, 3, 3, 7, 7, 4, 4, 0, 1,
    2, 2, 6, 6, 5, 5, 1, 4, 5, 5, 6, 6, 7, 7, 4, 0, 1, 1, 5, 5, 4, 4, 0,
  ]);

  var indices = new Uint32Array([
    1, 0, 3, 3, 2, 1, 2, 3, 7, 7, 6, 2, 3, 0, 4, 4, 7, 3, 6, 5, 1, 1, 2, 6, 4,
    5, 6, 6, 7, 4, 5, 4, 0, 0, 1, 5,
  ]);

  //gl.uniformMatrix4fv(VLoc, false, flatten(V));

  var iBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint32Array(wire_indices),
    gl.STATIC_DRAW
  );

  var vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

  var vPosition = gl.getAttribLocation(program, "a_position");
  gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  //gl.drawElements(gl.LINES,wire_indices.length,gl.UNSIGNED_INT,0);

  PLoc = gl.getUniformLocation(program, "PLoc");

  //var P = rotateZ(45);
  //P = mult(rotateY(45),P);
  //P = mult(rotateX(45),P);
  //gl.uniformMatrix4fv(PLoc, false, flatten(P));

  VLoc = gl.getUniformLocation(program, "VLoc");

  TLoc = gl.getUniformLocation(program, "TLoc");

  document.getElementById("Button1").onclick = function () {
    theta = 0;
    phi = 0;
    dx = -0.5;
    dy = -0.5;
    render(wire_indices.length);
  };
  document.getElementById("Button2").onclick = function () {
    theta = 45 * (Math.PI / 180);
    phi = 0;
    dx = 0.0;
    dy = -0.5;
    render(wire_indices.length);
  };
  document.getElementById("Button3").onclick = function () {
    theta = 45 * (Math.PI / 180);
    phi = 45 * (Math.PI / 180);
    dx = 0.0;
    dy = 0.0;
    render(wire_indices.length);
  };

  //gl.drawElements(gl.TRIANGLES,indices.length, gl.UNSIGNED_INT,0);

  //gl.drawElements(gl.LINES,wire_indices.length, gl.UNSIGNED_INT,0);
};
var render = function (num) {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const at = vec3(0.0, 0.0, 0.0);
  const up = vec3(0.0, 1.0, 0.0);
  eye = vec3(
    radius * Math.sin(theta) * Math.cos(phi),
    radius * Math.sin(theta) * Math.sin(phi),
    radius * Math.cos(theta)
  );

  tMatrix = translate(dx, dy, -1.0);

  var t_neg = translate(at);

  mvMatrix = lookAt(eye, at, up); // modelview
  pMatrix = perspective(45, 1.0, 0.1, 10);
  console.log(eye);
  gl.uniformMatrix4fv(TLoc, false, flatten(tMatrix));

  gl.uniformMatrix4fv(VLoc, false, flatten(mvMatrix));
  gl.uniformMatrix4fv(PLoc, false, flatten(pMatrix));

  gl.drawElements(gl.LINES, num, gl.UNSIGNED_INT, 0);
};
