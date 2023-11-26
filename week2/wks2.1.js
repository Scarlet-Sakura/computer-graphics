var gl;
var canvas;
var index = 0;
var vertices = [];

window.onload= function init(){
    canvas = document.getElementById("canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    
   //set up canvas and change color 
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
   
    //  Configure WebGL
    gl.viewport(0, 0, canvas.width, canvas.height);

    var program = initShaders(gl, "vertex-shader", "fragment-shader")
    gl.useProgram(program)

    const max_points = 1000;
    var vPosition = gl.getAttribLocation(program, "a_position");
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer); 
    gl.bufferData(gl.ARRAY_BUFFER,max_points*sizeof['vec2'],gl.STATIC_DRAW);
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition)
    
    var vColor = gl.getAttribLocation(program, "a_color");  
    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,max_points*sizeof['vec4'],gl.STATIC_DRAW);
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor)
    
    var color = vec4(0.0,0.0,0.0,1.0);
   
    //event listener for drawing points

    var pointButton = document.getElementById("pointButton");
    pointButton.addEventListener("click",function(){
        canvas.addEventListener("click", function(event) {
            
            var canvasRect = event.target.getBoundingClientRect(); 
            var offsetX = canvasRect.left;
            var offsetY = canvasRect.top;   
            gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
            var t = vec2(-1 + 2 *( event.clientX- offsetX) / canvas.width,
                -1 + 2 * (canvas.height - (event.clientY-offsetY)) / canvas.height);
            gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec2'] * index, flatten(t));
    
            gl.bindBuffer(gl.ARRAY_BUFFER,cBuffer);
            gl.bufferSubData(gl.ARRAY_BUFFER,sizeof['vec4'] * index, flatten(color));
    
            index++;
            render();
            
        });
    });
    
  
  
    };
    function render()
    {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, index);
    window.requestAnimationFrame(render);
    }
    

   
