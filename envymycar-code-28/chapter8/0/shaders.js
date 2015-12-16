shadowMapShader = function (gl){
 	var shaderProgram = null;

	var vertex_shader = "\
	uniform   mat4 uModelViewMatrix;\n\
	uniform   mat4 uProjectionMatrix;\n\
	uniform   mat4 uShadowMatrix;\n\
	attribute vec3 aPosition;\n\
	varying   vec4 vShadowPosition;\n\
	void main(void)\n\
	{\n\
		vec4 position   = vec4(aPosition, 1.0);\n\
		vShadowPosition = uShadowMatrix    * position;\n\
		gl_Position     = uProjectionMatrix * uModelViewMatrix * position;\n\
	}";

  
 	var fragment_shader = "\
	precision highp float;\n\
	uniform sampler2D uShadowMap;\n\
	varying vec4      vShadowPosition;\n\
	float Unpack(vec4 v){\n\
		return v.x   + v.y / (256.0) + v.z/(256.0*256.0)+v.w/ (256.0*256.0*256.0);\n\
	}\n\
	bool IsInShadow(){\n\
		vec3  normShadowPos = vShadowPosition.xyz / vShadowPosition.w;\n\
		vec3  shadowPos     = normShadowPos * 0.5 + vec3(0.5);\n\
		float Fz = shadowPos.z;\n\
		float Sz = Unpack(texture2D(uShadowMap, shadowPos.xy));\n\
		bool  inShadow = (Sz < Fz);\n\
		return inShadow;\n\
	}\n\
	void main(void)\n\
	{\n\
		if (IsInShadow())\n\
			gl_FragColor=vec4(0.3,0.3,0.3,1.0);\n\
		else\n\
			gl_FragColor=vec4(0.6,0.6,0.6,1.0);\n\
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
	var aPositionIndex = 0;
	shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.bindAttribLocation(shaderProgram, aPositionIndex, "aPosition");
	gl.linkProgram(shaderProgram);

	shaderProgram.vertex_shader = vertex_shader;
	shaderProgram.fragment_shader = fragment_shader;
  
	// If creating the shader program failed, alert
	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		var str = "Unable to initialize the shader program.\n\n";
		str += "VS:\n"   + gl.getShaderInfoLog(vertexShader)   + "\n\n";
		str += "FS:\n"   + gl.getShaderInfoLog(fragmentShader) + "\n\n";
		str += "PROG:\n" + gl.getProgramInfoLog(shaderProgram);
		alert(str);
	}

	shaderProgram.aPositionIndex = aPositionIndex;
	shaderProgram.uModelViewMatrixLocation = gl.getUniformLocation(shaderProgram, "uModelViewMatrix");
	shaderProgram.uProjectionMatrixLocation = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
	shaderProgram.uShadowMatrixLocation = gl.getUniformLocation(shaderProgram, "uShadowMatrix");
	shaderProgram.uShadowMapLocation = gl.getUniformLocation(shaderProgram, "uShadowMap");
	return shaderProgram;

};

shadowMapCreateShader = function (gl){
 	var shaderProgram = null;
//lie 83, Listing8.1{
	var vertex_shader = "\
	uniform   mat4 uShadowMatrix;\n\
	attribute vec3 aPosition;\n\
	void main(void)\n\
	{\n\
		gl_Position = uShadowMatrix * vec4(aPosition, 1.0);\n\
	}";
// line 91}, line 92 Listing 8,2{
 	var fragment_shader = "\
	precision highp float;\n\
	float Unpack(vec4 v){\n\
		return v.x  + v.y / (256.0 ) + v.z/( 256.0*256.0)+v.w/ ( 256.0*256.0*256.0);\n\
//		return v.x;	\n\
	}\n\
	vec4 pack_depth(const in float d)\n\
	{	if(d==1.0) return vec4(1.0,1.0,1.0,1.0);\n\
		float a =d*1.001;\n\
		const vec4 bit_shift = vec4( 1.0	, 256.0		,256.0*256.0	,	256.0*256.0*256.0 );\n\
		const vec4 bit_mask  = vec4( 1.0/256.0	, 1.0/256.0	, 1.0/256.0	,	0.0);\n\
		vec4 res = fract(a * bit_shift);\n\
		res -= res.yzwx  * bit_mask;\n\
		return res;\n\
	}\n\
	void main(void)\n\
	{\n\
 		gl_FragColor = vec4(pack_depth(gl_FragCoord.z));\n\
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
	var aPositionIndex = 0;
	shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.bindAttribLocation(shaderProgram, aPositionIndex, "aPosition");
	gl.linkProgram(shaderProgram);

	shaderProgram.vertex_shader = vertex_shader;
	shaderProgram.fragment_shader = fragment_shader;
  
	// If creating the shader program failed, alert
	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		var str = "Unable to initialize the shader program.\n\n";
		str += "VS:\n"   + gl.getShaderInfoLog(vertexShader)   + "\n\n";
		str += "FS:\n"   + gl.getShaderInfoLog(fragmentShader) + "\n\n";
		str += "PROG:\n" + gl.getProgramInfoLog(shaderProgram);
		alert(str);
	}

	shaderProgram.aPositionIndex = aPositionIndex;
	shaderProgram.uProjectionMatrixLocation = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
	shaderProgram.uShadowMatrixLocation = gl.getUniformLocation(shaderProgram, "uShadowMatrix");
	
	return shaderProgram;

};

textureShadowShader = function (gl) {
	var vertex_shader = "\
		uniform   mat4 uModelViewMatrix;                        \n\
		uniform   mat4 uProjectionMatrix;                       \n\
		uniform   mat4 uShadowMatrix;														\n\
		attribute vec3 aPosition;                               \n\
		attribute vec2 aTextureCoords;													\n\
		varying vec2 vTextureCoords;														\n\
		varying   vec4 vShadowPosition;													\n\
		void main(void)                                         \n\
		{                                                       \n\
			vTextureCoords 	= aTextureCoords; 										\n\
			vec4 position   = vec4(aPosition, 1.0);								\n\
			vShadowPosition = uShadowMatrix    * position;				\n\
			gl_Position 		= uProjectionMatrix * uModelViewMatrix\n\
			* vec4(aPosition, 1.0);  															\n\
		}";
  
	var fragment_shader = "\
		precision highp float;                            	\n\
		uniform sampler2D uTexture;													\n\
		uniform sampler2D uShadowMap;												\n\
		varying vec2 vTextureCoords;												\n\
		varying vec4 vShadowPosition;												\n\
		float Unpack(vec4 v){																\n\
			return v.x   + v.y / (256.0) + 										\n\
			v.z/(256.0*256.0)+v.w/ (256.0*256.0*256.0);				\n\
		}																										\n\
		bool IsInShadow(){																	\n\
			vec3  normShadowPos = vShadowPosition.xyz / vShadowPosition.w;\n\
			vec3  shadowPos     = normShadowPos * 0.5 + vec3(0.5);				\n\
			float Fz = shadowPos.z;														\n\
			float Sz = Unpack(texture2D(uShadowMap, shadowPos.xy));				\n\
			bool  inShadow = (Sz +0.007< Fz);												\n\
			return inShadow;																	\n\
			}																									\n\
		void main(void){																		\n\
				vec4 color = texture2D(uTexture,vTextureCoords);\n\
				if(IsInShadow())																\n\
						color.xyz*=0.6;															\n\
				gl_FragColor = color;														\n\
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
	
	shaderProgram.uModelViewMatrixLocation 	= gl.getUniformLocation(shaderProgram, "uModelViewMatrix");
	shaderProgram.uProjectionMatrixLocation = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
	shaderProgram.uShadowMatrixLocation     = gl.getUniformLocation(shaderProgram, "uShadowMatrix");
	shaderProgram.uTextureLocation          = gl.getUniformLocation(shaderProgram, "uTexture");
	shaderProgram.uShadowMapLocation        = gl.getUniformLocation(shaderProgram, "uShadowMap");
	
	
	return shaderProgram;
};

textureNormalMapShadowShader = function (gl) {
	var vertexShaderSource = "\
		uniform   mat4 uModelViewMatrix;                            \n\
		uniform   mat4 uProjectionMatrix;                            \n\
		uniform   mat4 uShadowMatrix;\n\
		attribute vec3 aPosition;                                       \n\
		attribute vec2 aTextureCoords;				\n\
		varying vec2 vTextureCoords;			\n\
		varying   vec4 vShadowPosition;\n\
		void main(void)                                                 \n\
		{                                                               \n\
			vTextureCoords = aTextureCoords; \n\
			vec4 position   = vec4(aPosition, 1.0);\n\
			vShadowPosition = uShadowMatrix    * position;\n\
			gl_Position = uProjectionMatrix * uModelViewMatrix * position;  \n\
		}                                                               \n\
	";
  
	var fragmentShaderSource = "\
		precision highp float;                                          \n\
		uniform sampler2D texture; 				\n\
		uniform sampler2D normalMap; 				\n\
		uniform sampler2D uShadowMap;\n\
		uniform vec4	uLightDirection; \n\
		uniform vec4 uColor;                                            \n\
		varying vec2 vTextureCoords;			\n\
		varying vec4 vShadowPosition;\n\
		float Unpack(vec4 v){\n\
			return v.x   + v.y / (256.0) + v.z/(256.0*256.0)+v.w/ (256.0*256.0*256.0);\n\
		}\n\
		bool IsInShadow(){\n\
			// perspective division:\n\
			// from clip space to normalized space [-1..+1]^3\n\
			vec3  normShadowPos = vShadowPosition.xyz / vShadowPosition.w;\n\
			\n\
			// from [-1..+1] to [0..+1] (for texture coordinates and stored depth)\n\
			vec3  shadowPos     = normShadowPos * 0.5 + vec3(0.5);\n\
			float Fz = shadowPos.z;\n\
			float Sz = Unpack(texture2D(uShadowMap, shadowPos.xy));\n\
			\n\
			// shadow test\n\
			bool  inShadow = (Sz +0.007< Fz);\n\
			return inShadow;\n\
			}\n\
		void main(void)                                                 \n\
		{                                                               \n\
			vec4 n=texture2D(normalMap, vTextureCoords);          \n\
			n.x =n.x*2.0 -1.0; \n\
			n.y =n.y*2.0 -1.0; \n\
			n.z =n.z*2.0 -1.0; \n\
			vec3 N=normalize(vec3(n.x,n.z,n.y));\n\
			float shade =  dot(-uLightDirection.xyz , N);         \n\
			vec4 color=texture2D(texture, vTextureCoords);          \n\
			if(IsInShadow()){\n\
				\n\
					color.x*=0.6;\n\
					color.y*=0.6;\n\
					color.z*=0.6;\n\
				}\n\
			gl_FragColor = vec4(color.xyz*shade,1.0);          \n\
		}                                                               \n\
	";




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
	shaderProgram.uProjectionMatrixLocation 	= gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
	shaderProgram.uShadowMatrixLocation 	= gl.getUniformLocation(shaderProgram, "uShadowMatrix");
	shaderProgram.uColorLocation               		= gl.getUniformLocation(shaderProgram, "uColor");
	shaderProgram.uNormalMapLocation		= gl.getUniformLocation(shaderProgram, "normalMap");
	shaderProgram.uShadowMapLocation		= gl.getUniformLocation(shaderProgram, "uShadowMap");
	shaderProgram.uLightDirectionLocation		= gl.getUniformLocation(shaderProgram, "uLightDirection");
	
	
	
	return shaderProgram;
};



reflectionMapShadowShader = function (gl) {
	
	var shaderProgram = gl.createProgram();
	
	shaderProgram.vertex_shader = "\
		uniform   mat4 uModelViewMatrix;                            \n\
		uniform   mat4 uProjectionMatrix;                            \n\
		uniform   mat3  uViewSpaceNormalMatrix; \n\
		uniform   mat4 uShadowMatrix;\n\
		attribute vec3 aPosition;                                       \n\
		attribute vec4 aDiffuse;                                       \n\
		attribute vec4 aSpecular;                                       \n\
		attribute vec3 aNormal;                                       \n\
		attribute vec4 aAmbient;                                       \n\
		varying  vec3 vPos;                                       \n\
		varying  vec3 vNormal;                                       \n\
		varying  vec4 vdiffuse;                                       \n\
		varying  vec4 vspecular;                                       \n\
		varying  vec4 vambient;                                       \n\
		varying vec4 vShadowPosition;\n\
		void main(void)                                                 \n\
		{                                                               \n\
			  // vertex normal (in view space)                                   \n\
			vec4 position   = vec4(aPosition, 1.0);\n\
			vShadowPosition = uShadowMatrix    * position;\n\
			vPos = vec3(uModelViewMatrix * position);\n\
			vspecular= aSpecular;\n\
			vdiffuse= aDiffuse;\n\
			vambient = aAmbient;\n\
			vNormal = normalize( uViewSpaceNormalMatrix *  aNormal);             \n\
			gl_Position = uProjectionMatrix*uModelViewMatrix * vec4(aPosition, 1.0)  ;                         \n\
		}";
  
	shaderProgram.fragment_shader = "\
		precision highp float;                                          \n\
		uniform vec4 uLightDirection;			\n\
		uniform vec3 uLightColor;					\n\
		uniform vec3 uAmbient;						\n\
		uniform mat4 uViewToWorldMatrix; \n\
		uniform  samplerCube uCubeMap; 				\n\
		uniform sampler2D uShadowMap;\n\
		varying  vec3 vPos;                                       \n\
		varying  vec4 vdiffuse;                                       \n\
		varying  vec4 vspecular;                                       \n\
		varying vec3 vNormal;\n\
		varying vec4 vambient;\n\
		varying vec4 vShadowPosition;\n\
		float Unpack(vec4 v){\n\
			return v.x   + v.y / (256.0) + v.z/(256.0*256.0)+v.w/ (256.0*256.0*256.0);\n\
		}\n\
		bool IsInShadow(){\n\
			// perspective division:\n\
			// from clip space to normalized space [-1..+1]^3\n\
			vec3  normShadowPos = vShadowPosition.xyz / vShadowPosition.w;\n\
			\n\
			// from [-1..+1] to [0..+1] (for texture coordinates and stored depth)\n\
			vec3  shadowPos     = normShadowPos * 0.5 + vec3(0.5);\n\
			float Fz = shadowPos.z;\n\
			float Sz = Unpack(texture2D(uShadowMap, shadowPos.xy));\n\
			\n\
			// shadow test\n\
			bool  inShadow = (Sz +0.007< Fz);\n\
			return inShadow;\n\
			}\n\
		void main(void)                                                 \n\
		{                                                               \n\
		// normalize interpolated normal                         \n\
		vec3 N = normalize(vNormal);                             \n\
				                                                   \n\
		// light vector (positional light)                       \n\
		vec3 L = normalize(-uLightDirection.xyz);                \n\
				                                                   \n\
		// diffuse component                                     \n\
		float NdotL = max(0.0, dot(N, L));                       \n\
		vec3 lambert = (vdiffuse.xyz * uLightColor) * NdotL+vambient.xyz * uLightColor;     \n\
		vec3 reflected_ray = vec3(uViewToWorldMatrix* vec4(reflect(vPos,vNormal),0.0));\n\
		vec4 reflected_color 	= textureCube (uCubeMap,reflected_ray);\n\
		vec4 color = reflected_color*vspecular  + vec4(lambert,1.0);\n\
\n\
 			if(IsInShadow()){\n\
				\n\
					color.x*=0.6;\n\
					color.y*=0.6;\n\
					color.z*=0.6;\n\
					}\n\
			gl_FragColor = color;\n\
		}                                                               \n\
	";




	// create the vertex shader
	var vertexShader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vertexShader, shaderProgram.vertex_shader);
	gl.compileShader(vertexShader);

	// create the fragment shader
	var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fragmentShader, shaderProgram.fragment_shader);
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
	shaderProgram.uShadowMatrixLocation 	= gl.getUniformLocation(shaderProgram, "uShadowMatrix");
	shaderProgram.uViewSpaceNormalMatrixLocation = gl.getUniformLocation(shaderProgram,"uViewSpaceNormalMatrix");
	shaderProgram.uShadowMapLocation		= gl.getUniformLocation(shaderProgram, "uShadowMap");
	return shaderProgram;
};

showCubeMapShader = function (gl) {
	
	var shaderProgram = gl.createProgram();
	
	shaderProgram.vertex_shader = "\
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
  
	shaderProgram.fragment_shader = "\
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
	gl.shaderSource(vertexShader, shaderProgram.vertex_shader);
	gl.compileShader(vertexShader);

	// create the fragment shader
	var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fragmentShader, shaderProgram.fragment_shader);
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


lambertianSingleColorShadowShader = function (gl) {

 var shaderProgram = gl.createProgram();
    
shaderProgram.vertex_shader = "\
precision highp float;     \n\
   \n\
uniform mat4 uProjectionMatrix;     \n\
uniform mat4 uModelMatrix;   \n\
uniform mat4 uViewMatrix;\n\
uniform mat4 uShadowMatrix;\n\
uniform mat3 uViewSpaceNormalMatrix;   \n\
uniform vec4    uLightDirection; \n\
attribute vec3 aPosition;  \n\
attribute vec3 aNormal;    \n\
varying vec3 vnormal;\n\
varying vec3 vcolor;\n\
varying vec4 vShadowPosition;\n\
   \n\
void main()    \n\
{  \n\
  // vertex normal (in view space)     \n\
  vnormal = normalize(uViewSpaceNormalMatrix * aNormal); \n\
   \n\
	vec4 position   = vec4(aPosition, 1.0);\n\
	vShadowPosition =  uShadowMatrix    * uModelMatrix *	position;\n\
   \n\
   \n\
   \n\
  // output    \n\
  gl_Position = uProjectionMatrix * uViewMatrix *uModelMatrix *position;   \n\
}  \n\
"; 

shaderProgram.fragment_shader = "\
precision highp float;     \n\
   \n\
varying vec3 vnormal;\n\
varying vec3 vcolor;   \n\
uniform vec4 uLightDirection;\n\
uniform sampler2D uShadowMap;\n\
   \n\
// positional light: position and color\n\
uniform vec3 uLightColor;  \n\
uniform vec4 uColor;    \n\
varying vec4 vShadowPosition;\n\
float Unpack(vec4 v){\n\
	return v.x   + v.y / (256.0) + v.z/(256.0*256.0)+v.w/ (256.0*256.0*256.0);\n\
}\n\
\n\
bool IsInShadow(){\n\
	// perspective division:\n\
	// from clip space to normalized space [-1..+1]^3\n\
	vec3  normShadowPos = vShadowPosition.xyz / vShadowPosition.w;\n\
	\n\
	// from [-1..+1] to [0..+1] (for texture coordinates and stored depth)\n\
	vec3  shadowPos     = normShadowPos * 0.5 + vec3(0.5);\n\
	float Fz = shadowPos.z;\n\
	float Sz = Unpack(texture2D(uShadowMap, shadowPos.xy));\n\
	\n\
	// shadow test\n\
	bool  inShadow = (Sz  +0.007< Fz);\n\
	return inShadow;\n\
}\n\
void main()    \n\
{  \n\
  // normalize interpolated normal     \n\
  vec3 N = normalize(vnormal);     \n\
   \n\
  // light vector (positional light)   \n\
  vec3 L = normalize(-uLightDirection.xyz); \n\
   \n\
  // diffuse component     \n\
  float NdotL = max(0.0, dot(N, L));   \n\
  vec3 color = (uColor.xyz * uLightColor) * NdotL;    \n\
	if( IsInShadow()){\n\
		color.x*=0.6;\n\
		color.y*=0.6;\n\
		color.z*=0.6;\n\
		}\n\
   gl_FragColor  = vec4(color, 1.0);     \n\
  }  \n\
";


  // create the vertex shader
  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
   gl.shaderSource(vertexShader, shaderProgram.vertex_shader);
  gl.compileShader(vertexShader);
  
  // create the fragment shader
  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, shaderProgram.fragment_shader);
  gl.compileShader(fragmentShader);
  

  // Create the shader program
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  shaderProgram.aPositionIndex = 0;
  shaderProgram.aNormalIndex = 2;  
  gl.bindAttribLocation(shaderProgram, shaderProgram.aPositionIndex, "aPosition");
  gl.bindAttribLocation(shaderProgram, shaderProgram.aNormalIndex, "aNormal");
  gl.linkProgram(shaderProgram);
      
shaderProgram.vertexShader = vertexShader;
shaderProgram.fragmentShader = fragmentShader;
    
  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Unable to initialize the shader program.");
    var str = "";
    str += "VS:\n" + gl.getShaderInfoLog(vertexShader) + "\n\n";
    str += "FS:\n" + gl.getShaderInfoLog(fragmentShader) + "\n\n";
    str += "PROG:\n" + gl.getProgramInfoLog(shaderProgram);
    alert(str);
  }
  

  shaderProgram.uProjectionMatrixLocation = gl.getUniformLocation(shaderProgram,"uProjectionMatrix");
  shaderProgram.uShadowMatrixLocation = gl.getUniformLocation(shaderProgram,"uShadowMatrix");
  shaderProgram.uModelMatrixLocation = gl.getUniformLocation(shaderProgram,"uModelMatrix");
  shaderProgram.uViewMatrixLocation = gl.getUniformLocation(shaderProgram,"uViewMatrix");
  shaderProgram.uViewSpaceNormalMatrixLocation = gl.getUniformLocation(shaderProgram,"uViewSpaceNormalMatrix");
  shaderProgram.uLightDirectionLocation = gl.getUniformLocation(shaderProgram,"uLightDirection");
  shaderProgram.uLightColorLocation = gl.getUniformLocation(shaderProgram,"uLightColor");
  shaderProgram.uColorLocation = gl.getUniformLocation(shaderProgram,"uColor");
  shaderProgram.uShadowMapLocation = gl.getUniformLocation(shaderProgram,"uShadowMap");
  
  return shaderProgram;
};
