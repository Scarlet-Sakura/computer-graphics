var g_objDoc = null; // Info parsed from OBJ file
var g_drawingInfo = null; // Info for drawing the 3D model with WebGL
var MLoc, NLoc;
var M, N;
window.onload = function init() {
  var canvas = document.getElementById("canvas");
  var gl = WebGLUtils.setupWebGL(canvas);

  var ext = gl.getExtension("OES_element_index_uint");
  if (!ext) {
    console.log("Warning: Unable to use an extension");
  }
  gl.clearColor(0.5, 0.2, 0.4, 1.0);
  gl.viewport(0, 0, canvas.width, canvas.height); //convert from the clip space values to back into pixels

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.program = initShaders(gl, "vertex-shader", "fragment-shader");

  gl.useProgram(gl.program);

  lightPos = gl.getUniformLocation(gl.program, "lightPos");
  Le = gl.getUniformLocation(gl.program, "Le");
  ka = gl.getUniformLocation(gl.program, "ka");
  kd = gl.getUniformLocation(gl.program, "kd");
  ks = gl.getUniformLocation(gl.program, "ks");
  s = gl.getUniformLocation(gl.program, "s");

  var model = initObject(gl, "potion_version.obj", 0.4);

  function initObject(gl, obj_filename, scale) {
    gl.program.a_Position = gl.getAttribLocation(gl.program, "a_Position");
    gl.program.a_Normal = gl.getAttribLocation(gl.program, "a_Normal");
    gl.program.a_Color = gl.getAttribLocation(gl.program, "a_Color");

    // Prepare empty buffer objects for vertex coordinates, colors, and normals
    var model = initVertexBuffers(gl);

    if (!model) {
      console.log("Failed to set the vertex information");
      return;
    }

    // Start reading the OBJ file
    readOBJFile(obj_filename, gl, model, scale, true);

    return model;
  }
  // Create a buffer object and perform the initial configuration
  function initVertexBuffers(gl) {
    var o = new Object(); //utilize Object object to return multiple buffer objects
    o.vertexBuffer = createEmptyArrayBuffer(
      gl,
      gl.program.a_Position,
      3,
      gl.FLOAT
    );
    o.normalBuffer = createEmptyArrayBuffer(
      gl,
      gl.program.a_Normal,
      3,
      gl.FLOAT
    );

    o.colorBuffer = createEmptyArrayBuffer(gl, gl.program.a_Color, 4, gl.FLOAT);
    o.indexBuffer = gl.createBuffer();

    return o;
  }
  //Create a buffer object, assign it to attribute variables, and enable the assignment
  function createEmptyArrayBuffer(gl, a_attribute, num, type) {
    var buffer = gl.createBuffer(); // Create a buffer onject
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0); //Assign the buffer object to the attribute variable
    gl.enableVertexAttribArray(a_attribute); // Enable the assignment
    return buffer;
  }

  // Asynchronous file loading (request, parse, send to GPU buffers)
  function readOBJFile(fileName, gl, model, scale, reverse) {
    var request = new XMLHttpRequest();

    request.onreadystatechange = function () {
      if (request.readyState === 4 && request.status !== 404) {
        onReadOBJFile(
          request.responseText,
          fileName,
          gl,
          model,
          scale,
          reverse
        );
      }
    };
    request.open("GET", fileName, true); // Create a request to acquire the file
    request.send(); // Send the request
  }

  function onReadOBJFile(fileString, fileName, gl, o, scale, reverse) {
    var objDoc = new OBJDoc(fileName); // Create a OBJDoc object
    var result = objDoc.parse(fileString, scale, reverse); // Parse the file
    if (!result) {
      g_objDoc = null;
      g_drawingInfo = null;
      console.log("OBJ file parsing error.");
      return;
    } else {
      g_objDoc = objDoc;
      console.log("OBJ file parsing successful.");
    }
  }

  function onReadComplete(gl, model, objDoc) {
    // Acquire the vertex coordinates and colors from OBJ file
    var drawingInfo = objDoc.getDrawingInfo();
    console.log("Vertices:", drawingInfo.vertices);
    console.log("Normals:", drawingInfo.normals);
    console.log("Colors:", drawingInfo.colors);
    console.log(drawingInfo);
    // console.log("Colors:", drawingInfo.colors);

    // Write date into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.vertices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.normals, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.colors, gl.STATIC_DRAW);

    // Write the indices to the buffer object
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawingInfo.indices, gl.STATIC_DRAW);

    return drawingInfo;
  }

  MLoc = gl.getUniformLocation(gl.program, "MLoc");
  NLoc = gl.getUniformLocation(gl.program, "NLoc");

  var P = perspective(45, 1, 0.1, 100);
  var V = lookAt(vec3(0, 0, 4), vec3(0, 0, 0), vec3(0, 1, 0));
  var T = translate(0, 0, 0);
  var M = mat4();

  // Apply rotations
  var Ry = rotateY(90);
  T = mult(Ry, T);
  console.log(T);
  M = mult(M, T);
  M = mult(M, Ry);

  N = normalMatrix(M, true);
  console.log(N);
  var L_emi = vec4(1.0, 0.0, 0.0, 1.0); // light emission
  var le = vec4(0.0, 0.0, -1.0, 0.0); // light direction

  //var directionToLight = vec4(0, 0, 1, 1);

  var k_d = vec4(0.25, 0.25, 0.25, 1); // Diffuse Reflection Coefficient
  var k_a = vec4(0.2, 0.2, 0.2, 1); // Ambiend Reflection Coefficient
  var k_s = vec4(0.5, 0.5, 0.5, 1);
  var shininess = 100;

  gl.uniform4fv(Le, L_emi);
  gl.uniform4fv(lightPos, le);
  gl.uniform1f(s, shininess);
  gl.uniform4fv(kd, flatten(k_d));
  gl.uniform4fv(ka, k_a);
  gl.uniform4fv(ks, k_s);

  gl.uniformMatrix4fv(MLoc, false, flatten(M));
  gl.uniformMatrix3fv(NLoc, false, flatten(N));

  var viewMatrix = gl.getUniformLocation(gl.program, "u_View");
  gl.uniformMatrix4fv(viewMatrix, false, flatten(V));

  var perspectiveMatrix = gl.getUniformLocation(gl.program, "u_Perspective");
  gl.uniformMatrix4fv(perspectiveMatrix, false, flatten(P));

  var translationMatrix = gl.getUniformLocation(gl.program, "u_Translation");
  gl.uniformMatrix4fv(translationMatrix, false, flatten(T));

  var rotate = true;

  var cameraAlpha = 0;
  var cameraRadius = 4;

  function tick() {
    var cameraPosition = vec3(
      cameraRadius * Math.sin(cameraAlpha),
      0,
      cameraRadius * Math.cos(cameraAlpha)
    );
    if (rotate) cameraAlpha += 0.04;
    V = lookAt(cameraPosition, vec3(0, 0, 0), vec3(0, 1, 0));
    gl.uniformMatrix4fv(viewMatrix, false, flatten(V));
    render(gl, model);
    requestAnimationFrame(tick);
  }
  tick();

  toggleRotation.addEventListener("click", function (ev) {
    rotate = !rotate;
  });

  function render(gl, model) {
    if (!g_drawingInfo && g_objDoc && g_objDoc.isMTLComplete()) {
      // OBJ and all MTLs are available
      g_drawingInfo = onReadComplete(gl, model, g_objDoc);
    }
    if (!g_drawingInfo) return;

    gl.drawElements(
      gl.TRIANGLES,
      g_drawingInfo.indices.length,
      gl.UNSIGNED_SHORT,
      0
    );
  }
};
