"use strict";
var gl, canvas;

var VLoc, PLoc;
var V, P;

window.onload = function init() {
  canvas = document.getElementById("canvas");
  gl = WebGLUtils.setupWebGL(canvas);

  gl.clearColor(0.7, 0.0, 0.5, 1.0);
  gl.viewport(0, 0, canvas.width, canvas.height); //convert from the clip space values to back into pixels
  gl.enable(gl.DEPTH_TEST); // Enable depth testing
  gl.enable(gl.CULL_FACE);
  gl.frontFace(gl.CCW); // Adjust if needed (CCW or CW)
  gl.depthFunc(gl.LESS); // Adjust if needed

  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  var vertices = [
    vec4(-2.0, -1.0, -1.0, 1.0),
    vec4(2.0, -1.0, -1.0, 1.0),
    vec4(2.0, -1.0, -5.0, 1.0),
    vec4(-2.0, -1.0, -5.0, 1.0),

    //smallquad1
    vec4(-1.0, 0.0, -2.5, 1.0),
    vec4(-1.0, -1.0, -2.5, 1.0),
    vec4(-1.0, -1.0, -3.0, 1.0),
    vec4(-1.0, 0.0, -3.0, 1.0),

    //smallquad2
    vec4(0.25, -0.5, -1.25, 1.0),
    vec4(0.75, -0.5, -1.25, 1.0),
    vec4(0.75, -0.5, -1.75, 1.0),
    vec4(0.25, -0.5, -1.75, 1.0),
  ];

  var texCoord = [
    vec2(0.0, 0.0),
    vec2(1.0, 0.0),
    vec2(1.0, 1.0),
    vec2(0.0, 1.0),

    vec2(0.0, 0.0),
    vec2(1.0, 0.0),
    vec2(1.0, 1.0),
    vec2(0.0, 1.0),

    vec2(0.0, 0.0),
    vec2(1.0, 0.0),
    vec2(1.0, 1.0),
    vec2(0.0, 1.0),
  ];

  var vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

  var vPosition = gl.getAttribLocation(program, "a_position");
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  PLoc = gl.getUniformLocation(program, "PLoc");
  VLoc = gl.getUniformLocation(program, "VLoc");

  P = perspective(90, 1.0, 0.1, 1000);

  var eye = vec3(0.0, 0.0, 0.0);
  var at = vec3(0.0, 0.0, 0.0);
  var up = vec3(0.0, 1.0, 0.0);
  var theta = 0.0;
  var rotation = true;

  V = lookAt(eye, at, up);
  var theta = 0.0;
  var light = vec3(0.0, 2.0, -2.0);
  var radius = 2.0;

  var m = mat4(); // Shadow projection matrix initially an identity matrix
  m[3][3] = 0.0;
  m[3][1] = -1.0 / (light[1] + 1);

  gl.uniformMatrix4fv(PLoc, false, flatten(P));
  //gl.uniformMatrix4fv(VLoc, false, flatten(V));

  var tBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoord), gl.STATIC_DRAW);

  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  var vTexCoord = gl.getAttribLocation(program, "vTexCoord");
  gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vTexCoord);

  var myTexels = new Image();
  myTexels.src = "xamp23.png";
  myTexels.onload = function () {
    gl.activeTexture(gl.TEXTURE0);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, myTexels);

    render(gl, program);
  };
  myTexels.onerror = function () {
    console.error("Failed to load the image.");
  };
  console.log(myTexels);
  var texMapLoc = gl.getUniformLocation(program, "texMap");
  gl.uniform1i(texMapLoc, 0); // 0 is the texture unit you're using
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

  var stopButton = document.getElementById("stopButton");
  stopButton.addEventListener("click", function () {
    rotation = !rotation; // Toggle rotation on button click
  });

  function reframe() {
    render(gl, program);
    requestAnimationFrame(reframe);
  }

  reframe();

  function render(gl, program) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.uniformMatrix4fv(VLoc, false, flatten(lookAt(eye, at, up)));
    gl.uniform1i(gl.getUniformLocation(program, "texMap"), 0);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

    light[0] = radius * Math.sin(theta);
    light[2] = radius * Math.cos(theta) - 2;
    if (rotation) {
      theta += 0.02;
      if (theta > 2 * Math.PI) {
        theta -= 2 * Math.PI;
      }
    }
    // Model-view matrix for shadow then render
    V = mult(V, translate(light[0], light[1], light[2]));
    V = mult(V, m);
    V = mult(V, translate(-light[0], -light[1], -light[2]));
    // Send color and matrix for shadow
    iniTextureColor(gl);
    gl.uniformMatrix4fv(VLoc, false, flatten(V));
    gl.uniform1i(gl.getUniformLocation(program, "texMap"), 1);

    gl.drawArrays(gl.TRIANGLE_FAN, 4, 4);
    gl.drawArrays(gl.TRIANGLE_FAN, 8, 4);

    console.log(rotation);
    iniTextureColor(gl);
    gl.uniformMatrix4fv(VLoc, false, flatten(lookAt(eye, at, up)));
    gl.uniform1i(gl.getUniformLocation(program, "texMap"), 1);

    gl.drawArrays(gl.TRIANGLE_FAN, 4, 4);
    gl.drawArrays(gl.TRIANGLE_FAN, 8, 4);
  }

  function iniTextureColor(gl) {
    gl.activeTexture(gl.TEXTURE1);
    var texture1 = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture1);

    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGB,
      1,
      1,
      0,
      gl.RGB,
      gl.UNSIGNED_BYTE,
      new Uint8Array([255, 0, 0])
    );

    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MIN_FILTER,
      gl.NEAREST_MIPMAP_LINEAR
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  }
};
