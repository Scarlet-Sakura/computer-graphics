
window.onload= function init(){
    var canvas = document.getElementById("canvas");
    var gl = WebGLUtils.setupWebGL(canvas);
    
   //set up canvas and change color 
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
   
    //  Configure WebGL
    gl.viewport(0, 0, canvas.width, canvas.height);
   
    var program = initShaders(gl, "vertex-shader", "fragment-shader")
    gl.useProgram(program)

}