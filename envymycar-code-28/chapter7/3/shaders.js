skyBoxShader = function (gl) {
	var vertexShaderSource = "\
		uniform   mat4 uModelViewMatrix;	\n\
		uniform   mat4 uProjectionMatrix;	\n\
		attribute vec3 aPosition;					\n\
		varying vec3 vpos;								\n\
		void main(void)										\n\
		{																	\n\
			vpos = normalize(aPosition);		\n\
			gl_Position = uProjectionMatrix*uModelViewMatrix * vec4(aPosition, 1.0);\n\
		}";
	var fragmentShaderSource = "\
		precision highp float;					\n\
		uniform  samplerCube  uCubeMap;	\n\
		varying vec3 vpos;							\n\
		void main(void)									\n\
		{																\n\
 			gl_FragColor = textureCube (uCubeMap,normalize(vpos));\n\
		} ";
	// create the vertex shader
	var vertexShader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vertexShader, vertexShaderSource);
	gl.compileShader(vertexShader);

	// create the fragment shader
	var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fragmentShader, fragmentShaderSource);
	gl.compileShader(fragmentShader);

	// Create the shader program

	var shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	
	shaderProgram.aPositionIndex = 0;
	
	gl.bindAttribLocation(shaderProgram,shaderProgram. aPositionIndex, "aPosition");
	gl.linkProgram(shaderProgram);
  
	// If creating the shader program failed, alert
	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		var str = "Unable to initialize the shader program.\n\n";
		str += "VS:\n"   + gl.getShaderInfoLog(vertexShader)   + "\n\n";
		str += "FS:\n"   + gl.getShaderInfoLog(fragmentShader) + "\n\n";
		str += "PROG:\n" + gl.getProgramInfoLog(shaderProgram);
		alert(str);
	}
	
	shaderProgram.uModelViewMatrixLocation 	= gl.getUniformLocation(shaderProgram, "uModelViewMatrix");
	shaderProgram.uProjectionMatrixLocation 	= gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
	shaderProgram.uCubeMapLocation		= gl.getUniformLocation(shaderProgram, "uCubeMap");
	
	
	
	return shaderProgram;
};


