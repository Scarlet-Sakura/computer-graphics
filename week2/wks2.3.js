var gl;
var canvas;



window.onload= function init(){
    canvas = document.getElementById("canvas");
    gl = WebGLUtils.setupWebGL(canvas);
  
    //initial color to orange
    gl.clearColor(0.9,0.5,0.3,1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
   
    //convert from the clip space values to back into pixels 
    gl.viewport(0, 0, canvas.width, canvas.height);
    
    var drawMode = 0;
    var PointSize = 0.025;
    var max_points = 10000;
    var index = 0;
  
   
   
    var pointsButton = document.getElementById("pointsButton");
    pointsButton.addEventListener("click", function() { 
        drawMode = 0; 
        formerPoints = [];
        formerColors = [];
    });

    var triangleButton = document.getElementById("triangleButton");
    triangleButton.addEventListener("click",function(){
         drawMode = 1;
         formerPoints = [];
         formerColors = [];

    });

    //colors for points
    var colors = [
        vec4(0.0,0.0,0.0,1.0),
        vec4(1.0,0.0,1.0,1.0),
        vec4(0.0,1.0,1.0,1.0)
    ]
    

    var cIndex=0;
    var c = document.getElementById("colormenu");
    c.addEventListener("click",function(){
        cIndex = c.selectedIndex;
    });

  
    function Point(x, y) {
        var bottomLeft = vec2(x - PointSize, y - PointSize);
        var topLeft = vec2(x - PointSize, y + PointSize);
        var bottomRight = vec2(x + PointSize, y - PointSize);
        var topRight = vec2(x + PointSize, y + PointSize);
        var points = [topLeft, bottomLeft, bottomRight, bottomRight, topRight, topLeft];
        var currentColor = colors[cIndex];
        var Colors = [];
        for (let index = 0; index < 6; index++) {
            Colors.push(currentColor);       
        }
        gl.bufferSubData(gl.ARRAY_BUFFER, index *sizeof["vec2"], flatten(points));
        gl.bufferSubData(gl.ARRAY_BUFFER, max_points * sizeof["vec2"] + index * sizeof["vec4"] , flatten(Colors));
        index += 6;

        
    }

    function Triangle(x,y){
        formerPoints.push(vec2(x,y));
        var currentColor= colors[cIndex];
        formerColors.push(currentColor)
        if(formerPoints.length == 3){
            gl.bufferSubData(gl.ARRAY_BUFFER, index * sizeof["vec2"], flatten(formerPoints));
            gl.bufferSubData(gl.ARRAY_BUFFER, max_points * sizeof["vec2"] + index * sizeof["vec4"], flatten(formerColors));
            index += 3;
            formerPoints = [];
            formerColors = [];
        }
    }

    
    var program = initShaders(gl, "vertex-shader", "fragment-shader")
    gl.useProgram(program)
    
    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    var bufferDataSize = max_points * (Float32Array.BYTES_PER_ELEMENT * 2 + Float32Array.BYTES_PER_ELEMENT * 4);
    gl.bufferData(gl.ARRAY_BUFFER, bufferDataSize, gl.STATIC_DRAW);
    var vPosition = gl.getAttribLocation(program, "a_position");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);


    var vColor = gl.getAttribLocation(program, "a_color");  
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0,  max_points*(Float32Array.BYTES_PER_ELEMENT*2));
    gl.enableVertexAttribArray(vColor);
        
    //event listener for clear background
    //enable choice for clear
    var clearButton = document.getElementById("clearButton");
    clearButton.addEventListener("click",function(){
        var m = document.getElementById("mymenu");
        m.addEventListener("click", function() {
        gl.bufferData(gl.ARRAY_BUFFER,  max_points * (sizeof["vec2"] + sizeof["vec4"]), gl.STATIC_DRAW);
            index = 0;
            numPoints = 0;
            
            switch(m.selectedIndex){
                case 0:
                    gl.clearColor(0.9,0.5,0.3,1.0);
                    gl.clear(gl.COLOR_BUFFER_BIT);
                    break;
                case 1:
                    gl.clearColor(0.5,0.2,0.8,1.0);
                    gl.clear(gl.COLOR_BUFFER_BIT);
                    break;
                case 2:
                    gl.clearColor(0.1,0.7,0.4,1.0);    
                    gl.clear(gl.COLOR_BUFFER_BIT);    
            }
            
        });
    });



    canvas.addEventListener("click", function (event) {
        var canvasRect = event.target.getBoundingClientRect(); 
        var offsetX = canvasRect.left;
        var offsetY = canvasRect.top;   
        var x = -1 + 2 *( event.clientX- offsetX) / canvas.width;
        var y = -1 + 2 * (canvas.height - (event.clientY-offsetY)) / canvas.height;
        switch (drawMode) {
            case 0:
                Point(x, y);
                break;
            case 1:
                Triangle(x, y);
                break;  
            default:
                break;
        }

    })

    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, max_points);
    }

    
    function update(){
        render();
        requestAnimationFrame(update);
    }

    update();
    
    }
    

   
