var theta = 0.0;
var thetaLoc;
var canvas;
var gl;
    
window.onload= function init(){
   canvas= document.getElementById("canvas");
   gl = WebGLUtils.setupWebGL( canvas );
   //set up canvas and change color 
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
   
    //  Configure WebGL 
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
   
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
   

    var vertices = [  vec2(1.0, 0.0), vec2(1.0, 1.0), vec2(0.0, 0.0), vec2(0.0,1.0)];
    
    var centerX = (vertices[2][0] + vertices[1][0])/2  ;
    var centerY = (vertices[2][1] + vertices[1][1])/2  ;
    
    

    var translationMatrix = translate(-centerX,-centerY,0.0);
    var rotationMatrix = rotateZ(45)
    for (var i = 0; i < vertices.length; i++) {
        var vertex = vec4(vertices[i][0], vertices[i][1], 0.0, 1.0); // Convert to homogeneous coordinates
        vertex = mult(translationMatrix, vertex); // Apply translation
        vertex = mult(rotationMatrix, vertex); // Apply rotation
        
        
        vertices[i] = vec2(vertex[0], vertex[1]); // Convert back to 2D coordinates
    }
   
 
        
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
    


    //this look up the location of the attribute for the program 
    var vPosition = gl.getAttribLocation(program, "vPosition");
    
    
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    thetaLoc = gl.getUniformLocation( program, "theta" );

    render();
    
};
    
    function render() {
        gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
        gl.clear( gl.COLOR_BUFFER_BIT );
    
        theta += 0.1;
        gl.uniform1f( thetaLoc, theta );
    
        gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
    
        window.requestAnimationFrame(render);
    }

