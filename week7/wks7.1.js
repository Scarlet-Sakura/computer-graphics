"use strict";
var gl;
var canvas;
var g_tex_ready = 0;
var V, M, P;
var eye;
var VLoc, PLoc, MLoc;
var R, T, S, N;
var pointsArray = [];
var normalArray = [];
var numDivide = 4;
var vBuffer;
var nBuffer;

var theta = 0.05;
const radius = 5.0;
var dr = 5 * (Math.PI / 180);

window.onload = function init() {
  canvas = document.getElementById("canvas");
  gl = WebGLUtils.setupWebGL(canvas);

  var ext = gl.getExtension("OES_element_index_uint");
  if (!ext) {
    console.log("Warning: Unable to use an extension");
  }

  gl.viewport(0, 0, canvas.width, canvas.height); //convert from the clip space values to back into pixels
  gl.enable(gl.DEPTH_TEST); // Enable depth testing
  gl.enable(gl.CULL_FACE); //  Enable backface culling
  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  var vertices = [
    vec4(0.0, 0.0, 1.0, 1), // va
    vec4(0.0, 0.942809, -0.333333, 1), //vb
    vec4(-0.816497, -0.471405, -0.333333, 1), //vc
    vec4(0.816497, -0.471405, -0.333333, 1), //vd
  ];

  vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);

  var vPosition = gl.getAttribLocation(program, "a_position");
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  nBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);

  var normal = gl.getAttribLocation(program, "vNormal");
  gl.vertexAttribPointer(normal, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(normal);

  PLoc = gl.getUniformLocation(program, "PLoc");
  VLoc = gl.getUniformLocation(program, "VLoc");
  MLoc = gl.getUniformLocation(program, "MLoc");

  const at = vec3(0.0, 0.0, 0.0);
  const up = vec3(0.0, 1.0, 0.0);

  P = perspective(45, 1.0, 0.1, 10);

  tetrahedron(vertices, numDivide);
  initTexture(gl);

  function initTexture(gl) {
    var cubemap = [
      "../textures/cm_left.png", // POSITIVE_X
      "../textures/cm_right.png", // NEGATIVE_X
      "../textures/cm_top.png", // POSITIVE_Y
      "../textures/cm_bottom.png", // NEGATIVE_Y
      "../textures/cm_back.png", // POSITIVE_Z
      "../textures/cm_front.png",
    ]; // NEGATIVE_Z

    gl.activeTexture(gl.TEXTURE0);
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    for (var i = 0; i < 6; ++i) {
      var image = document.createElement("img");
      image.crossorigin = "anonymous";
      image.textarget = gl.TEXTURE_CUBE_MAP_POSITIVE_X + i;
      image.onload = function (event) {
        var image = event.target;
        gl.activeTexture(gl.TEXTURE0);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(
          image.textarget,
          0,
          gl.RGB,
          gl.RGB,
          gl.UNSIGNED_BYTE,
          image
        );
        ++g_tex_ready;
        if (g_tex_ready >= 6) render();
      };
      image.src = cubemap[i];
    }
    var texMapLoc = gl.getUniformLocation(program, "texMap");

    gl.uniform1i(texMapLoc, 0);
  }

  var toggleButton = document.getElementById("toggleButton");
  var rotationPaused = false; // Variable to track whether rotation is paused

 
   toggleButton.addEventListener("click", function() {
    rotationPaused = !rotationPaused; 
    if (!rotationPaused) {
        // If rotation is not paused, start rendering
        render();
    }
});

  function render() {
    gl.clearColor(0.4, 0.1, 0.5, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    theta+=dr;
    eye = vec3(radius * Math.sin(theta), 0, radius * Math.cos(theta));
    console.log(eye);
    modelMatrix();
    V = lookAt(eye, at, up);

    gl.uniformMatrix4fv(MLoc, false, flatten(M));
    gl.uniformMatrix4fv(PLoc, false, flatten(P));
    gl.uniformMatrix4fv(VLoc, false, flatten(V));
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalArray), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    gl.drawArrays(gl.TRIANGLES, 0, pointsArray.length);

    if (rotationPaused) {
      return;
    }
    requestAnimationFrame(render);
  }
  function tetrahedron(vert, n) {
    divideTriangle(vert[0], vert[1], vert[2], n);
    divideTriangle(vert[3], vert[2], vert[1], n);
    divideTriangle(vert[0], vert[3], vert[1], n);
    divideTriangle(vert[0], vert[2], vert[3], n);
  }

  function divideTriangle(a, b, c, count) {
    if (count > 0) {
      var ab = normalize(mix(a, b, 0.5), true);
      var ac = normalize(mix(a, c, 0.5), true);
      var bc = normalize(mix(b, c, 0.5), true);

      divideTriangle(a, ab, ac, count - 1);
      divideTriangle(ab, b, bc, count - 1);
      divideTriangle(bc, c, ac, count - 1);
      divideTriangle(ab, bc, ac, count - 1);
    } else {
      triangle(a, b, c);
    }

    function triangle(a, b, c) {
      pointsArray.push(a);
      pointsArray.push(b);
      pointsArray.push(c);

      normalArray.push(vec4(a[0], a[1], a[2], 0.0));
      normalArray.push(vec4(b[0], b[1], b[2], 0.0));
      normalArray.push(vec4(c[0], c[1], c[2], 0.0));
    }
  }

  function modelMatrix() {
    R = mat4();
    R = mult(R, rotateZ(0));
    R = mult(R, rotateX(0));
    R = mult(R, rotateY(0));
    T = translate(0.0, 0.0, 0.0);
    S = scalem(1, 1, 1);

    M = mat4();
    M = mult(M, S);
    M = mult(M, T);
    M = mult(M, R);
  }
};
