var gl;
var canvas;
var index = 0;
var vertices = [];
var cBuffer;
var positions = [];
var drawMode;


window.onload= function init(){
    canvas = document.getElementById("canvas");
    gl = WebGLUtils.setupWebGL(canvas);
  
    //initial color to orange
    gl.clearColor(0.9,0.5,0.3,1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
   
    //convert from the clip space values to back into pixels 
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
    cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,max_points*sizeof['vec4'],gl.STATIC_DRAW);
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor)
   
   //point colors
   var colors = [
    vec4(0.0,0.0,0.0,1.0),
    vec4(1.0,0.0,1.0,1.0),
    vec4(0.0,1.0,1.0,1.0)
   ]
   var color;
   var cIndex;

   var c = document.getElementById("colormenu");
    c.addEventListener("click", function() {
        cIndex = c.selectedIndex;
    });

    //event listener for points 
    //enable  choice for points first 
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
            
            color = vec4(colors[cIndex])
            gl.bindBuffer(gl.ARRAY_BUFFER,cBuffer);
            gl.bufferSubData(gl.ARRAY_BUFFER,sizeof['vec4'] * index, flatten(color));
            
            index++;
            render();
            
        });
    });
    
    //event listener for clear backgrounf
    //enable choice for clear
    var clearButton = document.getElementById("clearButton");
    clearButton.addEventListener("click",function(){
        var m = document.getElementById("mymenu");
        m.addEventListener("click", function() {
            switch(m.selectedIndex){
                case 0:
                    gl.clearColor(0.9,0.5,0.3,1.0);
                    break;
                case 1:
                    gl.clearColor(0.5,0.2,0.8,1.0);
                    break;
                case 2:
                    gl.clearColor(0.1,0.7,0.4,1.0);        
            }
    });
    });

    
    };

    function render(){

        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.POINTS, 0, index);
        window.requestAnimationFrame(render);   
       
    }
    

   
