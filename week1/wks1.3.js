
window.onload= function init(){
    var canvas = document.getElementById("canvas");
    var gl = WebGLUtils.setupWebGL(canvas);
    
   //set up canvas and change color 
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
   
    //  Configure WebGL 
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
   
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
   
    var vertices = [ vec2(0.0, 0.0), vec2(1.0, 1.0), vec2(1.0, 0.0) ];
    var colors = [
        vec3(1.0, 0.0, 0.0),
        vec3(0.0, 0.0, 1.0),
        vec3(0.0, 1.0, 0.0)
        ];

    var colorsArray = [ ];
    for (var index = 0; index < 3; ++index) {
    //determine which color[i] to assign to pointsArray[index]
    colorsArray.push(colors[index]);
    }
        
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
    
    //color buffer
    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "a_color" );
    gl.bindBuffer(gl.ARRAY_BUFFER,cBuffer)
    gl.vertexAttribPointer( vColor, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    //this look up the location of the attribute for the program 
    var vPosition = gl.getAttribLocation(program, "a_position");
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition)
    
    gl.drawArrays(gl.TRIANGLES,0,3)
}