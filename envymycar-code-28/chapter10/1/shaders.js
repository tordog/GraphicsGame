toonShader = function (gl) {
	var vertex_shader = "\
		attribute vec3 aPosition;                                      \n\
		attribute vec2 aTextureCoords;                                 \n\
		varying vec2 vTextureCoords;                                   \n\
		void main(void)                                                \n\
		{                                                              \n\
			vTextureCoords = aTextureCoords;                           \n\
			gl_Position = vec4(aPosition, 1.0);                        \n\
		}                                                              \n\
	";

	var fragment_shader = "\
		uniform sampler2D uTexture;                                   \n\
		precision highp float;                                        \n\
		uniform vec4 uColor;                                          \n\
		uniform vec2 uPxs;                                            \n\
		varying vec2 vTextureCoords;                                  \n\
		                                                              \n\
		float B(vec3 col){                                            \n\
			return (col.x+col.y+col.z)/3.0;                           \n\
		}                                                             \n\
vec4 colorQuantization( vec4 color ){                  	\n\
	float intensity = 	(color.x+color.y+color.z)/3.0;    \n\
	// normal                                             \n\
	float brightness = 0.7;                               \n\
	// dark                                               \n\
	if ( intensity < 0.3)                                 \n\
	brightness = 0.3;                                     \n\
	// light                                              \n\
	if ( intensity > 0.7)                                 \n\
	brightness = 0.9;                                     \n\
	color.xyz = color.xyz * brightness / intensity;   		\n\
	return color ; }                                      \n\
                                                       	\n\
\n\
float edgeStrength(){																		\n\
	vec2 tc = vTextureCoords;                              		\n\
	vec4 deltax = texture2D(uTexture,tc+vec2(-uPxs.x,uPxs.y)) \n\
		+texture2D(uTexture,tc+vec2(-uPxs.x,0.0))*2.0         \n\
		+texture2D(uTexture,tc+vec2(-uPxs.x,-uPxs.y))         \n\
		-texture2D(uTexture,tc+vec2(+uPxs.x,+uPxs.y))         \n\
		-texture2D(uTexture,tc+vec2(+uPxs.x,0.0))*2.0         \n\
		-texture2D(uTexture,tc+vec2(+uPxs.x,-uPxs.y));        \n\
 \n\
	vec4 deltay = -texture2D(uTexture,tc+vec2(-uPxs.x,uPxs.y))\n\
		-texture2D(uTexture,tc+vec2(0.0,uPxs.y))*2.0          \n\
		-texture2D(uTexture,tc+vec2(+uPxs.x,uPxs.y))          \n\
		+texture2D(uTexture,tc+vec2(-uPxs.x,-uPxs.y))         \n\
		+texture2D(uTexture,tc+vec2(0.0,-uPxs.y))*2.0         \n\
		+texture2D(uTexture,tc+vec2(+uPxs.x,-uPxs.y));        \n\
	                                                        \n\
	float edgeR =sqrt(deltax.x*deltax.x + deltay.x*deltay.x);	\n\
	float edgeG =sqrt(deltax.y*deltax.y + deltay.y*deltay.y);	\n\
	float edgeB =sqrt(deltax.z*deltax.z + deltay.z*deltay.z);	\n\
	return (edgeR + edgeG + edgeB) / 3.0;}										\n\
		void main(void) 									\n\
		{     														\n\
			vec4 color;            					\n\
			float es = edgeStrength();	 		\n\
	 			if(es > 0.12)									\n\
 				color = vec4(0.0,0.0,0.0,1.0);\n\
			else{  													\n\
				color = texture2D(uTexture, vTextureCoords);	\n\
				color = colorQuantization( color ); 					\n\
			}																\n\
			gl_FragColor = color;						\n\
		}	";


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

	shaderProgram.uTextureLocation = gl.getUniformLocation(shaderProgram, "uTexture");
	shaderProgram.uPxsLocation = gl.getUniformLocation(shaderProgram, "uPxs");

	return shaderProgram;
};
