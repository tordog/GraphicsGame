reflectionMapShader = function (gl) {
	
	var shaderProgram = gl.createProgram();
	
	shaderProgram.vertexShaderSource = "\
		uniform   mat4 uModelViewMatrix;   			\n\
		uniform   mat4 uProjectionMatrix;				\n\
		uniform   mat3 uViewSpaceNormalMatrix; \n\
		attribute vec3 aPosition;								\n\
		attribute vec4 aDiffuse;								\n\
		attribute vec4 aSpecular;								\n\
		attribute vec3 aNormal;									\n\
		attribute vec4 aAmbient;									\n\
		varying  vec3 vPos;											\n\
		varying  vec3 vNormal;									\n\
		varying  vec4 vdiffuse;									\n\
		varying  vec4 vspecular;								\n\
		varying  vec4 vambient;								\n\
		void main(void)													\n\
		{																				\n\
			vdiffuse = aDiffuse;										\n\
			vspecular = aSpecular;								\n\
			vambient = aAmbient; \n\
			vPos = vec3(uModelViewMatrix * vec4(aPosition, 1.0));	\n\
			vNormal =normalize( uViewSpaceNormalMatrix *  aNormal);\n\
			gl_Position = uProjectionMatrix*uModelViewMatrix * vec4(aPosition, 1.0);\n\
		}";
	shaderProgram.fragmentShaderSource = "\
		precision highp float;						\n\
		uniform vec4 uLightDirection;			\n\
		uniform vec3 uLightColor;					\n\
		uniform mat4 uViewToWorldMatrix;	\n\
		uniform  samplerCube uCubeMap;		\n\
		varying  vec3 vPos;								\n\
		varying vec4 vdiffuse;						\n\
		varying vec3 vNormal;							\n\
		varying vec4 vspecular;						\n\
		varying vec4 vambient;\n\
		void main(void)										\n\
		{																	\n\
		// normalize interpolated normal                         \n\
		vec3 N = normalize(vNormal);                             \n\
				                                                   \n\
		// light vector (positional light)                       \n\
		vec3 L = normalize(-uLightDirection.xyz);                \n\
				                                                   \n\
		// diffuse component                                     \n\
		float NdotL = max(0.0, dot(N, L));                       \n\
		vec3 lambert = (vdiffuse.xyz * uLightColor) * NdotL+vambient.xyz*uLightColor;     \n\
\n\
		vec3 reflected_ray 		= vec3(uViewToWorldMatrix* vec4(reflect(vPos,vNormal),0.0));\n\
		vec4 reflected_color 	= textureCube (uCubeMap,reflected_ray);\n\
		gl_FragColor = reflected_color*vspecular + vec4(lambert,1.0);		}";

	// create the vertex shader
	var vertexShader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vertexShader, shaderProgram.vertexShaderSource);
	gl.compileShader(vertexShader);

	// create the fragment shader
	var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fragmentShader, shaderProgram.fragmentShaderSource);
	gl.compileShader(fragmentShader);

	// Create the shader program


	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	
	shaderProgram.aPositionIndex = 0;
	shaderProgram.aColorIndex = 1;
	shaderProgram.aNormalIndex = 2;  

	gl.bindAttribLocation(shaderProgram,shaderProgram. aPositionIndex, "aPosition");
	gl.bindAttribLocation(shaderProgram,shaderProgram. aColorIndex, "aColor");
	gl.bindAttribLocation(shaderProgram, shaderProgram.aNormalIndex, "aNormal");

	gl.linkProgram(shaderProgram);
  
	shaderProgram.vertexShader = vertexShader;
	shaderProgram.fragmentShader = fragmentShader;

	// If creating the shader program failed, alert
	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		var str = "Unable to initialize the shader program.\n\n";
		str += "VS:\n"   + gl.getShaderInfoLog(vertexShader)   + "\n\n";
		str += "FS:\n"   + gl.getShaderInfoLog(fragmentShader) + "\n\n";
		str += "PROG:\n" + gl.getProgramInfoLog(shaderProgram);
		alert(str);
	}
	
	shaderProgram.uProjectionMatrixLocation = gl.getUniformLocation(shaderProgram,"uProjectionMatrix");
	shaderProgram.uModelViewMatrixLocation = gl.getUniformLocation(shaderProgram,"uModelViewMatrix");
	shaderProgram.uViewSpaceNormalMatrixLocation = gl.getUniformLocation(shaderProgram,"uViewSpaceNormalMatrix");

	return shaderProgram;
};

showCubeMapShader = function (gl) {
	
	var shaderProgram = gl.createProgram();
	
	shaderProgram.vertexShaderSource = "\
		uniform   mat4 uModelViewMatrix;                            \n\
		uniform   mat4 uProjectionMatrix;                            \n\
		attribute vec3 aPosition;                                       \n\
		varying vec3 vPos;                                       \n\
		void main(void)                                                 \n\
		{                                                               \n\
			  // vertex normal (in view space)                                   \n\
			vPos = aPosition;\n\
			gl_Position = uProjectionMatrix*uModelViewMatrix * vec4(aPosition, 1.0)  ;                         \n\
		}";
  
	shaderProgram.fragmentShaderSource = "\
		precision highp float;                                          \n\
		varying vec3 vPos;                                       \n\
		uniform  samplerCube uCubeMap; 				\n\
		void main(void)                                                 \n\
		{                                                               \n\
 			gl_FragColor = textureCube (uCubeMap,normalize(vPos));\n\
		}                                                               \n\
	";




	// create the vertex shader
	var vertexShader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vertexShader, shaderProgram.vertexShaderSource);
	gl.compileShader(vertexShader);

	// create the fragment shader
	var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fragmentShader, shaderProgram.fragmentShaderSource);
	gl.compileShader(fragmentShader);

	// Create the shader program


	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	
	shaderProgram.aPositionIndex = 0;

	gl.bindAttribLocation(shaderProgram,shaderProgram. aPositionIndex, "aPosition");

	gl.linkProgram(shaderProgram);
  
	shaderProgram.vertexShader = vertexShader;
	shaderProgram.fragmentShader = fragmentShader;

	// If creating the shader program failed, alert
	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		var str = "Unable to initialize the shader program.\n\n";
		str += "VS:\n"   + gl.getShaderInfoLog(vertexShader)   + "\n\n";
		str += "FS:\n"   + gl.getShaderInfoLog(fragmentShader) + "\n\n";
		str += "PROG:\n" + gl.getProgramInfoLog(shaderProgram);
		alert(str);
	}
	
	shaderProgram.uProjectionMatrixLocation = gl.getUniformLocation(shaderProgram,"uProjectionMatrix");
	shaderProgram.uModelViewMatrixLocation = gl.getUniformLocation(shaderProgram,"uModelViewMatrix");
	shaderProgram.uCubeMapLocation = gl.getUniformLocation(shaderProgram,"uCubeMap");

	return shaderProgram;
};

