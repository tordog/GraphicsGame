motionBlurShader = function (gl) {
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
		precision highp float;										\n\
		const int STEPS =	40;											\n\
		uniform sampler2D uVelocityTexture;				\n\
		uniform sampler2D uTexture;								\n\
		varying vec2 vTexCoord;										\n\
		vec2 Vel(vec2 p){													\n\
			vec2 vel = texture2D ( uVelocityTexture , p ).xy;	\n\
  			vel = vel* 2.0- 1.0;														\n\
			return vel;																				\n\
		}																										\n\
		void main(void)																			\n\
		{																							\n\
			vec2 vel = Vel(vTexCoord);									\n\
			vec4 accum_color = vec4(0.0 ,0.0 ,0.0 ,0.0);\n\
																									\n\
			float l = length(vel);											\n\
			if ( l < 4.0/255.0) vel=vec2(0.0,0.0);			\n\
			vec2 delta = -vel/vec2(STEPS);							\n\
			int steps_done = 0;													\n\
			accum_color= texture2D( uTexture , vTexCoord);\n\
			float i = (accum_color.x+accum_color.y+accum_color.z)/3.0;\n\
			for ( int i = 1 ; i <=   STEPS ; ++i )				\n\
					{																					\n\
					vec2 p = vTexCoord + float(i)*delta;			\n\
						if( (p.x <1.0) && (p.x > 0.0)						\n\
								&& (p.y <1.0) && (p.y >0.0) )				\n\
								{			\n\
								if(length(Vel(p)-vel)<0.01){\n\
	 							steps_done++;												\n\
								accum_color += texture2D( uTexture , p);\n\
							}\n\
						};																					\n\
					}																							\n\
			accum_color /= float(steps_done+1);								\n\
			vec4 vcol=vec4(0.0,0.0,0.0,1.0);\n\
			if(vel.x>0.01) vcol+=vec4(vel.x,0.0,0.0,0.0);\n\
			if(vel.x<-0.01) vcol+=vec4(0.0,-vel.x,0.0,0.0);\n\
			gl_FragColor = vec4(accum_color.xyz ,1.0);//*0.000001+vec4(i,i,i,1.0)+vcol;	\n\
 		}                                                   \n\
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
	
	shaderProgram.uTextureLocation=  gl.getUniformLocation(shaderProgram, "uTexture");
	shaderProgram.uVelocityTextureLocation=  gl.getUniformLocation(shaderProgram, "uVelocityTexture");
	return shaderProgram;
};


velocityVectorShader = function (gl) {
	var vertex_shader = "\
		uniform   mat4 uPreviousModelViewMatrix;		\n\
		uniform   mat4 uModelViewMatrix;				\n\
		uniform   mat4 uProjectionMatrix;				\n\
		attribute vec3 aPosition;										\n\
		varying vec4 prev_position;									\n\
		varying vec4 curr_position;									\n\
		void main(void)											\n\
		{																	\n\
			prev_position 	= uProjectionMatrix*uPreviousModelViewMatrix	*vec4(aPosition, 1.0);\n\
			curr_position 	= uProjectionMatrix*uModelViewMatrix		*vec4(aPosition, 1.0); \n\
			gl_Position 	= uProjectionMatrix*uPreviousModelViewMatrix	*vec4(aPosition, 1.0);  \n\
		}																	  \n\
	";
  
	var fragment_shader = "\
		precision highp float;		\n\
		varying vec4 prev_position;	\n\
		varying vec4 curr_position;	\n\
		void main(void)							\n\
		{ 										\n\
			vec4 pp = prev_position / prev_position.w;	\n\
			vec4 cp	= curr_position / curr_position.w;	\n\
			vec2 vel= cp.xy- pp.xy;					\n\
			vel 	= vel*0.5+0.5;						\n\
			gl_FragColor =vec4(vel,0.0,1.0);			\n\
 		}										\n\
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
	
	shaderProgram.vertex_shader = vertex_shader;
	shaderProgram.fragment_shader = fragment_shader;
	
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
	
	shaderProgram.uModelViewMatrixLocation=  gl.getUniformLocation(shaderProgram, "uModelViewMatrix");
	shaderProgram.uPreviousModelViewMatrixLocation=  gl.getUniformLocation(shaderProgram, "uPreviousModelViewMatrix");
	shaderProgram.uProjectionMatrixLocation=  gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
	return shaderProgram;
};


