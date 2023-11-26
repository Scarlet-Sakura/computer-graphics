"use strict";
var gl;
var canvas;
var V, M, P;
var eye;
var VLoc, PLoc, MLoc, NLoc, lightPos, Le, kd, ka, ks, s, eyePoint;
var R, T, S, N;
var pointsArray = [];
var normalArray = [];
var numDivide = 1;
var vBuffer;
var nBuffer;
var theta = 0.05;
const radius = 5.0;
var dr = 0.2*(Math.PI / 180);

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
  NLoc = gl.getUniformLocation(program, "NLoc");
  lightPos = gl.getUniformLocation(program, "lightPos");
  Le = gl.getUniformLocation(program, "Le");
  ka = gl.getUniformLocation(program, "ka");
  kd = gl.getUniformLocation(program, "kd");
  ks = gl.getUniformLocation(program, "ks");
  s = gl.getUniformLocation(program, "s");
  eyePoint = gl.getUniformLocation(program, "eyePoint");

  const at = vec3(0.0, 0.0, 0.0);
  const up = vec3(0.0, 1.0, 0.0);

  var L_emi = vec4(1.0, 1.0, 1.0, 1.0); // light emission
  var le = vec4(0.0, 0.0, -1.0, 0.0); // light direction


  var k_d = vec4(0.0, 0.0, 0.0, 1); // Diffuse Reflection Coefficient
  var k_a = vec4(0.0, 0.0, 0.0, 1); // Ambiend Reflection Coefficient
  var k_s = vec4(0.0, 0.0, 0.0, 1);
  var shininess = 0.0;

  gl.uniform4fv(Le, L_emi);
  gl.uniform4fv(lightPos, le);

  P = perspective(45, 1.0, 0.1, 10);

  tetrahedron(vertices, numDivide);
  render();

  // Get all the slider elements by class name
  var sliders = document.querySelectorAll(".slide");

  // Loop through each slider element and add an event listener
  sliders.forEach(function (slider) {
    slider.addEventListener("input", function (event) {
      var sliderId = event.target.id;
      // Update the appropriate variable based on the slider that was changed
      if (sliderId === "kd") {
        k_d = vec4(
          event.target.value,
          event.target.value,
          event.target.value,
          1.0
        );
      } else if (sliderId === "ks") {
        k_s = vec4(
          event.target.value,
          event.target.value,
          event.target.value,
          1.0
        );
      } else if (sliderId === "ka") {
        k_a = vec4(
          event.target.value,
          event.target.value,
          event.target.value,
          1.0
        );
      } else if (sliderId === "s") {
        shininess = event.target.value;
      }

      render();
    });
  });

  document.getElementById("Button1").onclick = function () {
    if (numDivide > 10) numDivide = 10;
    numDivide++;
    pointsArray = [];
    normalArray = [];
    init();
  };
  document.getElementById("Button2").onclick = function () {
    if (numDivide) numDivide--;
    pointsArray = [];
    normalArray = [];
    init();
  };

  function render() {
    gl.clearColor(0.4, 0.1, 0.5, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    theta+=dr;
    eye = vec3(radius * Math.sin(theta), 0, radius * Math.cos(theta));

    gl.uniform3fv(eyePoint, eye);
    console.log(eye);
    modelMatrix();
    V = lookAt(eye, at, up);
    N = normalMatrix(M, true);

    console.log(normalArray);
    console.log(N);
    gl.uniform1f(s, shininess);
    gl.uniform4fv(kd, flatten(k_d));
    gl.uniform4fv(ka, k_a);
    gl.uniform4fv(ks, k_s);

    gl.uniformMatrix4fv(MLoc, false, flatten(M));
    gl.uniformMatrix4fv(PLoc, false, flatten(P));
    gl.uniformMatrix4fv(VLoc, false, flatten(V));
    gl.uniformMatrix3fv(NLoc, false, flatten(N));

    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalArray), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    gl.drawArrays(gl.TRIANGLES, 0, pointsArray.length);
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

      // normalArray.push(cross(subtract(b, a), subtract(c, a)));
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
