"use strict";
var gl;
var canvas;

var V, M, P;

var VLoc, PLoc, MLoc;

var R, T, S;

var pointsArray = [];
var numDivide = 1;
var vBuffer;

window.onload = function init() {
  canvas = document.getElementById("canvas");
  gl = WebGLUtils.setupWebGL(canvas);

  var ext = gl.getExtension("OES_element_index_uint");
  if (!ext) {
    console.log("Warning: Unable to use an extension");
  }

  gl.clearColor(0.7, 0.0, 0.5, 1.0);
  gl.viewport(0, 0, canvas.width, canvas.height); //convert from the clip space values to back into pixels
  gl.enable(gl.DEPTH_TEST); // Enable depth testing

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

  var vColor = gl.getAttribLocation(program, "a_color");
  gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vColor);

  PLoc = gl.getUniformLocation(program, "PLoc");
  VLoc = gl.getUniformLocation(program, "VLoc");
  MLoc = gl.getUniformLocation(program, "MLoc");

  const at = vec3(0.0, 0.0, 0.0);
  const up = vec3(0.0, 1.0, 0.0);
  const eye = vec3(0.0, 0.0, 4.0);

  P = perspective(45, 1.0, 0.1, 10);
  V = lookAt(eye, at, up);

  tetrahedron(vertices, numDivide);
  render(pointsArray.length, pointsArray);

  document.getElementById("Button1").onclick = function () {
    if (numDivide > 10) numDivide = 10;
    numDivide++;
    pointsArray = [];
    init();
  };
  document.getElementById("Button2").onclick = function () {
    if (numDivide) numDivide--;
    pointsArray = [];
    init();
  };

  console.log(pointsArray.length);

  function render(num, points) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    modelMatrix();

    gl.uniformMatrix4fv(MLoc, false, flatten(M));
    gl.uniformMatrix4fv(PLoc, false, flatten(P));
    gl.uniformMatrix4fv(VLoc, false, flatten(V));
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    gl.drawArrays(gl.TRIANGLES, 0, num);
  }

  function tetrahedron(vert, n) {
    divideTriangle(vert[0], vert[1], vert[2], n);
    divideTriangle(vert[3], vert[2], vert[1], n);
    divideTriangle(vert[0], vert[3], vert[1], n);
    divideTriangle(vert[0], vert[2], vert[3], n);
    console.log(vert[0]);
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
