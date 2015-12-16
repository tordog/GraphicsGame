flaresShader = function (gl) {
	var vertex_shader = "\
		uniform   mat4 uModelViewMatrix;                            \n\
		uniform   mat4 uProjectionMatrix;                            \n\
		uniform   mat4 uQuadPosMatrix;				\n\
		uniform   vec4 uLightPosition;				\n\
		attribute vec3 aPosition;                                       \n\
		attribute vec2 aTextureCoords;				\n\
		varying vec2 vTextureCoords;			\n\
		varying vec4 vLightPosition;\n\
		void main(void)                                                 \n\
		{                                                               \n\
			vTextureCoords = aTextureCoords; \n\
			gl_Position = uQuadPosMatrix*vec4(aPosition, 1.0);  \n\
			vLightPosition=  uProjectionMatrix * uModelViewMatrix * uLightPosition ;\n\
		}                                                               \n\
	";
  
	var fragment_shader = "\
		uniform sampler2D uTexture;				\n\
		uniform sampler2D uDepth;					\n\
		precision highp float;						\n\
		uniform vec4 uColor;							\n\
		varying vec2 vTextureCoords;			\n\
		varying vec4 vLightPosition;			\n\
		float Unpack(vec4 v){							\n\
			return v.x   + v.y / (256.0) + v.z/(256.0*256.0)+v.w/ (256.0*256.0*256.0);\n\
		}																	\n\
		void main(void)												 \n\
		{	vec3 proj2d = vec3(vLightPosition.x/vLightPosition.w,vLightPosition.y/vLightPosition.w,vLightPosition.z/vLightPosition.w);\n\
			proj2d = proj2d * 0.5 + vec3(0.5); 		\n\
 	 		if(proj2d.x <0.0) discard;						\n\
			if(proj2d.x >1.0) discard;						\n\
 	 		if(proj2d.y <0.0) discard;						\n\
 	 		if(proj2d.y >1.0) discard;						\n\
		 	if(vLightPosition.w < 0.0) discard;		\n\
		 	if(proj2d.z < -1.0) discard;					\n\
			vec4 d = texture2D(uDepth, proj2d.xy);\n\
 			if(Unpack(d) < proj2d.z)							\n\
			discard;															\n\
 			gl_FragColor = texture2D(uTexture, vTextureCoords); \n\
		}																											\n\
	";

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
	
	gl.bindAttribLocation(shaderProgram,shaderProgram. aPositionIndex, "aPosition");
	gl.bindAttribLocation(shaderProgram, shaderProgram.aTextureCoordIndex, "aTextureCoords");
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
	shaderProgram.uProjectionMatrixLocation = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
	shaderProgram.uColorLocation            = gl.getUniformLocation(shaderProgram, "uColor");
	shaderProgram.uDepthLocation            = gl.getUniformLocation(shaderProgram, "uDepth");
	shaderProgram.uTextureLocation          = gl.getUniformLocation(shaderProgram, "uTexture");
	shaderProgram.uQuadPosMatrixLocation          = gl.getUniformLocation(shaderProgram, "uQuadPosMatrix");
	shaderProgram.uLightPositionLocation          = gl.getUniformLocation(shaderProgram, "uLightPosition");
	
	
	return shaderProgram;
};


