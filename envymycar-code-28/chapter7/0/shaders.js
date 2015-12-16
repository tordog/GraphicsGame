textureShader = function (gl) {
	var vertex_shader = "\
		uniform   mat4 uModelViewMatrix;	\n\
		uniform   mat4 uProjectionMatrix;	\n\
		attribute vec3 aPosition;					\n\
		attribute vec2 aTextureCoords;		\n\
		varying vec2 vTextureCoords;			\n\
		void main(void)										\n\
		{																	\n\
			vTextureCoords = aTextureCoords;				\n\
			gl_Position = uProjectionMatrix *				\n\
 			uModelViewMatrix * vec4(aPosition, 1.0);\n\
		}";
	var fragment_shader = "\
		precision highp float;					\n\
		uniform sampler2D uTexture;			\n\
		uniform vec4 uColor;						\n\
		varying vec2 vTextureCoords;		\n\
		void main(void)									\n\
		{																\n\
			gl_FragColor = texture2D(uTexture, vTextureCoords);	\n\
		} ";  


	// create the vertex shader
	var vertexShader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vertexShader, vertex_shader);
	gl.compileShader(vertexShader);

	// create the fragment shader
	var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fragmentShader, fragment_shader);
	gl.compileShader(fragmentShader);

	// Create the shader program

	var shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);

	shaderProgram.aPositionIndex = 0;
	shaderProgram.aTextureCoordIndex = 3;

	shaderProgram.vertex_shader = vertex_shader;
	shaderProgram.fragment_shader = fragment_shader;

	gl.bindAttribLocation(shaderProgram, shaderProgram.aPositionIndex, "aPosition");
	gl.bindAttribLocation(shaderProgram, shaderProgram.aTextureCoordIndex, "aTextureCoords");
	gl.linkProgram(shaderProgram);

	// If creating the shader program failed, alert
	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		var str = "Unable to initialize the shader program.\n\n";
		str += "VS:\n" + gl.getShaderInfoLog(vertexShader) + "\n\n";
		str += "FS:\n" + gl.getShaderInfoLog(fragmentShader) + "\n\n";
		str += "PROG:\n" + gl.getProgramInfoLog(shaderProgram);
		alert(str);
	}

	shaderProgram.uModelViewMatrixLocation = gl.getUniformLocation(shaderProgram, "uModelViewMatrix");
	shaderProgram.uProjectionMatrixLocation = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
	shaderProgram.uColorLocation = gl.getUniformLocation(shaderProgram, "uColor");
	shaderProgram.uTextureLocation = gl.getUniformLocation(shaderProgram, "uTexture");

	return shaderProgram;
};
