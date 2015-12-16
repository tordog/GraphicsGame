depthOfFieldShader = function (gl,constMAXRADIUS) {
	var vertex_shader = "\
		attribute vec3 aPosition;                                       \n\
		attribute vec2 aTextureCoords;				\n\
		varying vec2 vTexCoord;			\n\
		void main(void)                                                 \n\
		{                                                               \n\
			vTexCoord = aTextureCoords; \n\
			gl_Position = vec4(aPosition, 1.0);  \n\
		}                                                               \n\
	";
  
	var fragment_shader = "\
		precision highp float;                   	\n\
		const int MAXRADIUS ="+ constMAXRADIUS+";	\n\
		uniform sampler2D uDepthTexture;					\n\
		uniform sampler2D uTexture;								\n\
		uniform float uA,uB;											\n\
		uniform float near;												\n\
		uniform vec2 uDof;												\n\
		uniform vec2 uPxs;												\n\
		varying vec2 vTexCoord;										\n\
		float Unpack(vec4 v){											\n\
			return v.x   + v.y / (256.0) +								\n\
				v.z/(256.0*256.0)+v.w/ (256.0*256.0*256.0);	\n\
		}																					\n\
		float ComputeRadiusCoC( float z ) {				\n\
			float c = 0.0;													\n\
			// circle of confusion is computed here	\n\
			if ( z < uDof[0] )											\n\
 				c = float(MAXRADIUS)/(uDof[0]-near)*(uDof[0]-z);\n\
			if ( z > uDof[1] )																\n\
 				c = float(MAXRADIUS)/(uDof[0]-near)*(z-uDof[1]);\n\
			// clamp c between 1.0 and 7.0 pixels of radius	\n\
 			if ( int(c) > MAXRADIUS)												\n\
				return float(MAXRADIUS);											\n\
			else																						\n\
				return c;																			\n\
 			}																								\n\
		void main(void)																		\n\
		{																									\n\
			float z_01 =Unpack(texture2D(uDepthTexture,vTexCoord));\n\
			float z_NDC = z_01*2.0-1.0;\n\
			float z_V		= -uB / (z_NDC-uA);\n\
			int radius 	= int(ComputeRadiusCoC(z_V));						\n\
			vec4 accum_color = vec4(0.0 ,0.0 ,0.0 ,0.0) ;				\n\
																													\n\
			for ( int i = -MAXRADIUS ; i <= MAXRADIUS ; ++i )		\n\
				for ( int j = -MAXRADIUS ; j <= MAXRADIUS ; ++j )	\n\
					if ( 		(i >= -radius ) && ( i <= radius )			\n\
							&& 	(j >= -radius ) && ( j <= radius ) )		\n\
							accum_color += texture2D( uTexture ,				\n\
								vec2(	vTexCoord.x +float(i) *uPxs[0],			\n\
											vTexCoord.y+float(j) *uPxs[1]));		\n\
			accum_color /= vec4((radius*2+1)*(radius*2+1));			\n\
			vec4 color = accum_color;														\n\
		//	if(radius > 1) color+=vec4(1,0,0,1);\n\
	 		gl_FragColor = color;																\n\
	}";
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
	
	shaderProgram.uTextureLocation=  gl.getUniformLocation(shaderProgram, "uTexture");
	shaderProgram.uDepthTextureLocation=  gl.getUniformLocation(shaderProgram, "uDepthTexture");
	shaderProgram.uDofLocation=  gl.getUniformLocation(shaderProgram, "uDof");
	shaderProgram.uPxsLocation=  gl.getUniformLocation(shaderProgram, "uPxs");
	shaderProgram.uALocation=  gl.getUniformLocation(shaderProgram, "uA");
	shaderProgram.uBLocation=  gl.getUniformLocation(shaderProgram, "uB");
	return shaderProgram;
};

