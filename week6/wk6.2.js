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
  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  var vertices = [
    vec4(-4.0, -1.0, -1.0, 1.0),
    vec4(4.0, -1.0, -1.0, 1.0),
    vec4(4.0, -1.0, -21.0, 1.0),
    vec4(-4.0, -1.0, -21.0, 1.0),
  ];

  var texCoord = [vec2(-1.5, 0), vec2(2.5, 0), vec2(2.5, 10), vec2(-1.5, 10)];

  var vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

  var vPosition = gl.getAttribLocation(program, "a_position");
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  PLoc = gl.getUniformLocation(program, "PLoc");
  VLoc = gl.getUniformLocation(program, "VLoc");

  P = perspective(90, 1.0, 0.1, 10);
  V = mat4();

  gl.uniformMatrix4fv(PLoc, false, flatten(P));
  gl.uniformMatrix4fv(VLoc, false, flatten(V));

  var texSize = 64;
  var numRows = 8;
  var numCols = 8;
  var myTexels = new Uint8Array(4 * texSize * texSize);
  for (var i = 0; i < texSize; ++i) {
    for (var j = 0; j < texSize; ++j) {
      var patchx = Math.floor(i / (texSize / numRows));
      var patchy = Math.floor(j / (texSize / numCols));
      var c = patchx % 2 !== patchy % 2 ? 255 : 0;
      myTexels[4 * i * texSize + 4 * j] = c;
      myTexels[4 * i * texSize + 4 * j + 1] = c;
      myTexels[4 * i * texSize + 4 * j + 2] = c;
      myTexels[4 * i * texSize + 4 * j + 3] = 255;
    }
  }

  var tBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoord), gl.STATIC_DRAW);

  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  var vTexCoord = gl.getAttribLocation(program, "vTexCoord");
  gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vTexCoord);

  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    texSize,
    texSize,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    myTexels
  );

  //texture mapping options
  var menu1 = document.getElementById("menu1"); // Get the dropdown element

  menu1.addEventListener("change", function () {
    // Get the selected value from menu1
    var selectedOption = menu1.value;

    switch (selectedOption) {
      case "option1":
        // texture parameters for repeat

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

        break;

      case "option2":
        //  texture parameters for clamp to edge

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        break;

      default:
        break;
    }
    render(gl);
  });

  //texture filtering modes
  var menu2 = document.getElementById("menu2"); // Get the dropdown element
  gl.generateMipmap(gl.TEXTURE_2D);
  menu2.addEventListener("change", function () {
    // Get the selected value from menu1
    var selectedOption = menu2.value;

    switch (selectedOption) {
      case "choice1":
        // texture parameters for nearest

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

        break;

      case "choice2":
        //  texture parameters for linear

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

        break;
      case "choice3":
        // texture parameters for nearest mipmap nearest

        gl.texParameteri(
          gl.TEXTURE_2D,
          gl.TEXTURE_MAG_FILTER,
          gl.NEAREST_MIPMAP_NEAREST
        );
        gl.texParameteri(
          gl.TEXTURE_2D,
          gl.TEXTURE_MIN_FILTER,
          gl.NEAREST_MIPMAP_NEAREST
        );

        break;
      case "choice4":
        // texture parameters for linear mipmap nearest

        gl.texParameteri(
          gl.TEXTURE_2D,
          gl.TEXTURE_MAG_FILTER,
          gl.LINEAR_MIPMAP_NEAREST
        );
        gl.texParameteri(
          gl.TEXTURE_2D,
          gl.TEXTURE_MIN_FILTER,
          gl.LINEAR_MIPMAP_NEAREST
        );

        break;

      case "choice5":
        // texture parameters for nearest mipmap linear

        gl.texParameteri(
          gl.TEXTURE_2D,
          gl.TEXTURE_MAG_FILTER,
          gl.NEAREST_MIPMAP_LINEAR
        );
        gl.texParameteri(
          gl.TEXTURE_2D,
          gl.TEXTURE_MIN_FILTER,
          gl.NEAREST_MIPMAP_LINEAR
        );

        break;

      case "choice6":
        // texture parameters for linear mipmap linear

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

        break;
      default:
        break;
    }

    render(gl);
  });

  var texMapLoc = gl.getUniformLocation(program, "texMap");
  gl.uniform1i(texMapLoc, 0); // 0 is the texture unit you're using
  render(gl);
};

function render(gl) {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}
