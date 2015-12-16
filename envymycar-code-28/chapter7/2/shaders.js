textureNormalMapShader = function (gl) {
	var vertexShaderSource = "\
		uniform   mat4 uModelViewMatrix;                            \n\
		uniform   mat4 uProjectionMatrix;                            \n\
		attribute vec3 aPosition;                                       \n\
		attribute vec2 aTextureCoords;				\n\
		varying vec2 vTextureCoords;			\n\
		void main(void)                                                 \n\
		{                                                               \n\
			vTextureCoords = aTextureCoords; \n\
			gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);  \n\
		}                                                               \n\
	";

	var fragmentShaderSource = "\
		precision highp float;						\n\
		uniform sampler2D texture;				\n\
		uniform sampler2D normalMap;			\n\
		uniform vec4	uLightDirection;		\n\
		uniform vec4 uColor;							\n\
		varying vec2 vTextureCoords;			\n\
		void main(void)										\n\
		{  																							\n\
			vec4 n=texture2D(normalMap, vTextureCoords);	\n\
			n.x =n.x*2.0 -1.0; 														\n\
			n.y =n.y*2.0 -1.0;														\n\
			n.z =n.z*2.0 -1.0;														\n\
			vec3 N=normalize(vec3(n.x,n.z,n.y));					\n\
			float shade =  dot(-uLightDirection.xyz , N);	\n\
			vec4 color=texture2D(texture, vTextureCoords);\n\
		gl_FragColor = vec4(color.xyz*shade,1.0);			\n\
		}"; 
	

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
	shaderProgram.aTextureCoordIndex = 3;

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
	shaderProgram.uNormalMapLocation = gl.getUniformLocation(shaderProgram, "normalMap");
	shaderProgram.uLightDirectionLocation = gl.getUniformLocation(shaderProgram, "uLightDirection");

	return shaderProgram;
};
