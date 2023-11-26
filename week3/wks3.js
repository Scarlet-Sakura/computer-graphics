var gl;
var canvas;

window.onload= function init(){
   

    canvas = document.getElementById("canvas");
    gl = WebGLUtils.setupWebGL(canvas);
  
    var ext = gl.getExtension('OES_element_index_uint');
    if(!ext)
    {
    console.log('Warning: Unable to use an extension');
    }
    
    // gl.clearColor(1.0,1.0,1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
   
    //convert from the clip space values to back into pixels 
    //gl.viewport(0, 0, canvas.width, canvas.height);
    
    var program = initShaders(gl, "vertex-shader", "fragment-shader")
    gl.useProgram(program)
    
    var vertices = [
        vec3(0.0,0.0,1.0),
        vec3(0.0, 1.0, 1.0),
        vec3(1.0, 1.0, 1.0),
        vec3(1.0, 0.0, 1.0),
        vec3(0.0, 0.0, 0.0),
        vec3(0.0, 1.0, 0.0),
        vec3(1.0, 1.0, 0.0),
        vec3(1.0, 0.0, 0.0),
 ];
    var wire_indices = new Uint32Array([
        0, 1, 1, 2, 2, 3, 3, 0, 
        2, 3, 3, 7, 7, 6, 6, 2, 
        0, 3, 3, 7, 7, 4, 4, 0, 
        1, 2, 2, 6, 6, 5, 5, 1, 
        4, 5, 5, 6, 6, 7, 7, 4, 
        0, 1, 1, 5, 5, 4, 4, 0 
        ]);

   var indices = new Uint32Array([
    1,0,3,3,2,1,
    2,3,7,7,6,2,
    3,0,4,4,7,3,
    6,5,1,1,2,6,
    4,5,6,6,7,4,
    5,4,0,0,1,5
   ]);

   const eye = vec3(2.0,2.0,2.0);
   const at = vec3(0.5,0.5,0.5);
   const up = vec3(0.0,1.0,0.0);
   
   var PLoc = gl.getUniformLocation(program,"PLoc");
   var P = ortho(-1.0,1.0,-1.0,1.0,-4.0,4.0);
   
   var VLoc = gl.getUniformLocation(program,"VLoc");
   var V = lookAt(eye, at, up);
   
   console.log(VLoc,PLoc);

  

   gl.uniformMatrix4fv(VLoc, false, flatten(V));
 
   gl.uniformMatrix4fv(PLoc, false, flatten(P));

   
   console.log(wire_indices);
   console.log(vertices);

   var iBuffer = gl.createBuffer();
   gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,iBuffer);
   gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(wire_indices),gl.STATIC_DRAW);

   var vBuffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
   gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
    
   var vPosition = gl.getAttribLocation(program, "a_position");
   gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
   gl.enableVertexAttribArray(vPosition);
 

   //gl.drawElements(gl.LINES,wire_indices.length,gl.UNSIGNED_INT,0);

   //gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices),gl.STATIC_DRAW);
   
   gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

   
   
  
  
  gl.drawElements(gl.LINES,wire_indices.length, gl.UNSIGNED_INT,0);
  
}