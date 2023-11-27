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
  var model = initObject(gl, "cupcake.obj", 0.8);
  lightPos = gl.getUniformLocation(gl.program, "lightPos");
  Le = gl.getUniformLocation(gl.program, "Le");
  ka = gl.getUniformLocation(gl.program, "ka");
  kd = gl.getUniformLocation(gl.program, "kd");
  ks = gl.getUniformLocation(gl.program, "ks");
  s = gl.getUniformLocation(gl.program, "s");

  function initObject(gl, obj_filename, scale) {
    gl.program.a_Position = gl.getAttribLocation(gl.program, "a_Position");
    gl.program.a_Normal = gl.getAttribLocation(gl.program, "a_Normal");
    gl.program.a_Color = gl.getAttribLocation(gl.program, "a_Color");
    gl.program.a_Textures = gl.getAttribLocation(gl.program, "a_Textures");
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
    o.textureBuffer = createEmptyArrayBuffer(
      gl,
      gl.program.a_Textures,
      2,
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
    //taking the mmaterial
  
    console.log(objDoc.mtls);
    
    var k_s = objDoc.mtls[0].KsMaterials[0].color;
    var k_a = objDoc.mtls[0].KaMaterials[0].color;

    var ambientColor = vec4(k_a.r, k_a.g, k_a.b, 1.0);
    var specularColor = vec4(k_s.r, k_s.g, k_s.b, 1.0);

    gl.uniform4fv(ka, flatten(ambientColor));
    gl.uniform4fv(ks, flatten(specularColor));
    
    // Write data into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.vertices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.normals, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.colors, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.textureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.texCoords, gl.STATIC_DRAW);

    // Write the indices to the buffer object
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawingInfo.indices, gl.STATIC_DRAW);

    return drawingInfo;
  }

  MLoc = gl.getUniformLocation(gl.program, "MLoc");
  NLoc = gl.getUniformLocation(gl.program, "NLoc");
  var x_axis = document.getElementById("x-slider");
  var y_axis = document.getElementById("y-slider");
  var z_axis = document.getElementById("z-slider");
  var P = perspective(45, 1, 0.1, 100);
  var V = lookAt(vec3(0, 0, 4), vec3(0, 0, 0), vec3(0, 1, 0));
  var T = translate(0.0, -0.5, 0.0);
  var M = mat4();

  // Apply rotations (initialize)
  var Ry = rotateY(90);
  T = mult(Ry, T);
  console.log(T);
  M = mult(M, T);
  M = mult(M, Ry);
  N = normalMatrix(M, true);
  console.log(N);
  var L_emi = vec4(1.0, 0.0, 0.0, 1.0); // light emission
  var le = vec4(0.0, 0.0, -1.0, 0.0); // light direction

  var shininess = 100;

  gl.uniform4fv(Le, L_emi);
  gl.uniform4fv(lightPos, le);
  gl.uniform1f(s, shininess);

  gl.uniformMatrix4fv(MLoc, false, flatten(M));
  gl.uniformMatrix3fv(NLoc, false, flatten(N));

  var viewMatrix = gl.getUniformLocation(gl.program, "u_View");
  gl.uniformMatrix4fv(viewMatrix, false, flatten(V));

  var perspectiveMatrix = gl.getUniformLocation(gl.program, "u_Perspective");
  gl.uniformMatrix4fv(perspectiveMatrix, false, flatten(P));

  var image = document.getElementById("potion");
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  gl.generateMipmap(gl.TEXTURE_2D);

  var texMapLoc = gl.getUniformLocation(gl.program, "texMap");
  gl.uniform1i(texMapLoc, 0); // 0 is the texture unit you're using

  // Check if the image is a power of 2 in both dimensions.
  if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
    // Yes, it's a power of 2. Generate mips.
    gl.generateMipmap(gl.TEXTURE_2D);
  } else {
    // No, it's not a power of 2. Turn off mips and set wrapping to clamp to edge
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  }

  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MIN_FILTER,
    gl.NEAREST_MIPMAP_NEAREST
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  var rotate = true;
  render(gl, model);

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

  x_axis.addEventListener("input", updateObjectPosition);

  y_axis.addEventListener("input", updateObjectPosition);

  z_axis.addEventListener("input", updateObjectPosition);

  toggleRotation.addEventListener("click", function (ev) {
    rotate = !rotate;
  });

  // Function to update object position based on slider values
  function updateObjectPosition() {
    // Get slider values
    const xValue = document.getElementById("x-slider").value;
    const yValue = document.getElementById("y-slider").value;
    const zValue = document.getElementById("z-slider").value;

    document.getElementById("x-value").innerText = xValue;
    document.getElementById("y-value").innerText = yValue;
    document.getElementById("z-value").innerText = zValue;
    console.log(xValue);
    updateMatrices(xValue, yValue, zValue);
    render(gl, model);

    // Update object position based on slider values
    // Replace the following line with your actual code to update object position
    console.log(
      `Update object position: X=${xValue}, Y=${yValue}, Z=${zValue}`
    );
  }

  function updateMatrices(x, y, z) {
    T = translate(x, y, z);
    M = mat4();

    T = mult(Ry, T);
    console.log(T);
    M = mult(M, T);
    M = mult(M, Ry);

    gl.uniformMatrix4fv(MLoc, false, flatten(M));

    gl.uniformMatrix4fv(translationMatrix, false, flatten(T));
  }

  function render(gl, model) {
    if (!g_drawingInfo && g_objDoc && g_objDoc.isMTLComplete()) {
      // OBJ and all MTLs are available
      g_drawingInfo = onReadComplete(gl, model, g_objDoc);
    }
    if (!g_drawingInfo) return;

    gl.drawElements(
      gl.TRIANGLES,
      g_drawingInfo.indices.length,
      gl.UNSIGNED_INT,
      0
    );
  }

  function isPowerOf2(value) {
    return (value & (value - 1)) === 0;
  }
};
