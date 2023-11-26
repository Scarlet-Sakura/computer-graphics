var velocityY = 0.01;
var velocityLoc;
var canvas;
var gl;
var direction = 0.01;
var speed = 0.01;

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
   
// WebGL initialization and shader program setup

var numSegments = 100; // Adjust the number of segments as needed
var center = vec2(0.0, 0.0); // Center of the circle
var radius = 0.5; // Radius of the circle
var vertices = [];

// Calculate angular spacing between vertices
var angleIncrement = (2 * Math.PI) / numSegments;

// Create vertices for the circle
for (var i = 0; i <= numSegments; i++) {
    var angle = i * angleIncrement;
    var x = center[0] + radius * Math.cos(angle);
    var y = center[1] + radius * Math.sin(angle);
    vertices.push(vec2(x, y));
}

// Append the center as the first vertex (required for triangle fan)
vertices.unshift(center);

var vBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

// Define and enable the vertex attribute pointer (similar to previous examples)
var vPosition = gl.getAttribLocation(program, "vPosition");
gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(vPosition);
velocityLoc = gl.getUniformLocation( program, "velocityY" );

render(vertices.length);


    
};

function render(verticesLength) {
    var rad = 0.5
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    velocityY+=direction
    direction = Math.sign( 1- rad - Math.abs(velocityY))*direction;

    gl.uniform1f( velocityLoc, velocityY );

    gl.drawArrays(gl.TRIANGLE_FAN, 0, verticesLength);

    requestAnimationFrame(render);
}