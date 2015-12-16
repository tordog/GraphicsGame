var shaderProgram  = null;
var vertexBuffer = null;
var uColorLocation = -1;
var aPositionIndex = -1;

///// Initialize the data buffer to pass to the rendering pipeline the geometry.
function initBuffers(gl) {

	var triangleVertices = new Float32Array([
		 -0.3,  0.0,  0.0,
		 0.3,  0.0,  0.0,
		 0.0,  0.714,  0.0]);

	vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, triangleVertices, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

///// Define and compile a very simple shader.
function initShaders(gl) {

  var vertexShaderSource = "\
	attribute vec3 a_position;                \n\
	void main(void)                           \n\
	{                                         \n\
		gl_Position = vec4(a_position, 1.0);  \n\
	}                                         \n\
	";
  
  var fragmentShaderSource = "\
	precision highp float;                    \n\
	uniform vec3 u_color;                     \n\
	void main(void)                           \n\
	{                                         \n\
		gl_FragColor = vec4(u_color, 1.0);    \n\
	}                                         \n\
	";
  
  // Create the vertex shader
  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertexShaderSource);
  gl.compileShader(vertexShader);
  
  // Create the fragment shader
  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragmentShaderSource);
  gl.compileShader(fragmentShader);
  
  // Create the shader program
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  
  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Unable to initialize the shader program.");
	var str = "";
	str += "VS:\n" + gl.getShaderInfoLog(vertexShader) + "\n\n";
	str += "FS:\n" + gl.getShaderInfoLog(fragmentShader) + "\n\n";
    str += "PROG:\n" + gl.getProgramInfoLog(shaderProgram);
	alert(str);
  }

  uColorLocation = gl.getUniformLocation(shaderProgram, "u_color");
}

///// Draw the given triangle using uniform color.
function renderTriangle(gl) {

	// Clear the framebuffer of the rendering context
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);

	// enable the current shader program
	gl.useProgram(shaderProgram);
	
	// connect the buffer containing the vertices of the triangle with the position attribute
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	aPositionIndex = gl.getAttribLocation(shaderProgram, "a_position");
	gl.enableVertexAttribArray(aPositionIndex);
	gl.vertexAttribPointer(aPositionIndex, 3, gl.FLOAT, false, 0, 0);
	
	// set the value of 'u_color' variable of the fragment shader
	gl.uniform3f(uColorLocation, 0.0, 0.0, 1.0);
	
	// start to draw (!)
    gl.drawArrays(gl.TRIANGLES, 0, 3);	

	// disable the current shading program
	gl.useProgram(null);
}
