"use strict";
var gl;
var canvas;
var V, M, P;
var eye;
var VLoc, PLoc, MLoc, NLoc, lightPos, Le;
var R, T, S, N;
var pointsArray = [];
var normalArray = [];
var numDivide = 5;
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
  NLoc = gl.getUniformLocation(program, "NLoc");
  lightPos = gl.getUniformLocation(program, "lightPos");
  Le = gl.getUniformLocation(program,"Le");

  const at = vec3(0.0, 0.0, 0.0);
  const up = vec3(0.0, 1.0, 0.0);

  var L_emi = vec4(1.0, 1.0, 1.0, 1.0); // light emission
  var le = vec4(0.0, 0.0, -1.0, 0.0); // light direction

  gl.uniform4fv(lightPos, le);
  gl.uniform4fv(Le, L_emi);

  P = perspective(45, 1.0, 0.1, 10);

  tetrahedron(vertices, numDivide);
  var image = document.getElementById("earth");
  //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  gl.generateMipmap(gl.TEXTURE_2D);

  var texMapLoc = gl.getUniformLocation(program, "texMap");
  gl.uniform1i(texMapLoc, 0); // 0 is the texture unit you're using

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MAG_FILTER,
    gl.LINEAR_MIPMAP_LINEAR
  );
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MIN_FILTER,
    gl.LINEAR_MIPMAP_LINEAR
  );

  render();

  function render() {
    gl.clearColor(0.4, 0.1, 0.5, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    theta += dr;
    eye = vec3(radius * Math.sin(theta), 0, radius * Math.cos(theta));
    console.log(eye);
    modelMatrix();
    V = lookAt(eye, at, up);
    N = normalMatrix(M, true);

    console.log(normalArray);
    console.log(N);

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
