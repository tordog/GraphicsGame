phongMultiLightShader = function (gl, nLights, nSpotLights, nAreaLights) {

	var shaderProgram = gl.createProgram();

	shaderProgram.vertex_shader = "\
precision highp float;  \n\
\n\
uniform mat4 uProjectionMatrix;  \n\
uniform mat4 uModelViewMatrix;\n\
uniform mat3 uViewSpaceNormalMatrix;\n\
\n\
attribute vec3 aPosition;  \n\
attribute vec3 aNormal; \n\
attribute vec4 aDiffuse; \n\
attribute vec4 aAmbient; \n\
attribute vec4 aSpecular; \n\
attribute vec4 aShininess; \n\
varying vec3 vpos;\n\
varying vec3 vnormal;\n\
varying vec4 vdiffuse;\n\
varying vec4 vambient;\n\
varying vec4 vspecular;\n\
varying vec4 vshininess; \n\
void main() \n\
{  \n\
  // vertex normal (in view space)  \n\
  vnormal = (uViewSpaceNormalMatrix * aNormal); \n\
\n\
  vdiffuse = aDiffuse; \n\
  vambient = aAmbient; \n\
  vspecular = aSpecular; \n\
  vshininess = aShininess;\n\
  \n\
// vertex position (in view space)\n\
  vec4 position = vec4(aPosition, 1.0);\n\
\n\
  vpos = vec3(uModelViewMatrix * position);  \n\
\n\
// output \n\
  gl_Position = uProjectionMatrix *uModelViewMatrix * position;\n\
}  \n\
";

	shaderProgram.fragment_shader = "\
precision highp float;  \n\
\n\
const int uNLights 		=" + nLights + "; \n\
const int uNSpotLights 	=" + nSpotLights + "; \n\
const int uNAreaLights	=" + nAreaLights + ";\n\
uniform vec4 uLightsGeometry[uNLights]; \n\
uniform vec4 uLightsColor[uNLights]; \n\
uniform vec3 uSpotLightsPos[uNSpotLights]; \n\
uniform vec3 uSpotLightsDir[uNSpotLights]; \n\
uniform vec4 uSpotLightsColor[uNSpotLights]; \n\
uniform float uSpotLightsCutOff[uNSpotLights];\n\
uniform float uSpotLightsFallOff[uNSpotLights];\n\
\n\
uniform vec2 uAreaLightsSize[uNAreaLights]; \n\
uniform vec3 uAreaLightsColor[uNAreaLights]; \n\
uniform mat4 uAreaLightsFrame[uNAreaLights]; \n\
\n\
varying vec3 vnormal;\n\
varying vec3 vpos;\n\
varying vec4 vdiffuse;\n\
varying vec4 vambient;\n\
varying vec4 vspecular;\n\
varying vec4 vshininess; \n\
 \n\
// positional light: position and color\n\
\n\
\n\
// shininess exponent\n\
\n\
vec3 phongShading( vec3 L, vec3 N, vec3 V, vec3 lightColor){\n\
	vec3 mat_ambient = vambient.xyz;										\n\
	vec3 mat_diffuse = vdiffuse.xyz;										\n\
	vec3 mat_specular= vspecular.xyz;										\n\
																											\n\
	vec3 ambient = mat_ambient*lightColor;							\n\
																											\n\
	// diffuse component																\n\
	float NdotL = max(0.0, dot(N, L));									\n\
	vec3 diffuse = (mat_diffuse * lightColor) * NdotL;	\n\
																											\n\
	// specular component 															\n\
	vec3 R = (2.0 * NdotL * N) - L;											\n\
	float RdotV = max(0.0, dot(R, V));									\n\
	float spec = pow(RdotV, vshininess.x); 							\n\
	vec3 specular = (mat_specular * lightColor) * spec;	\n\
	vec3 contribution =  ambient +diffuse +  specular;  \n\
	return contribution; 										\n\
}																											\n\
float NdotL; \n\
vec3 L; \n\
float r; \n\
vec3 lc ;\n\
void main() \n\
{  \n\
  // normalize interpolated normal  \n\
  vec3 N = normalize(vnormal);	 \n\
  vec3 final= vec3(0,0,0); \n\
\n\
float NdotL; \n\
vec3 L; \n\
float r; \n\
 \n\
  for(int i = 0; i < uNLights; ++i){ \n\
 	if( abs(uLightsGeometry[i].w -1.0)< 0.01 ){ \n\
 		// light vector (positional light)\n\
 		r =  length(uLightsGeometry[i].xyz-vpos); \n\
 		L = normalize(uLightsGeometry[i].xyz-vpos); \n\
		lc= uLightsColor[i].xyz / (0.03*3.14 * 3.14 *r*r);\n\
 	}\n\
 	else \n\
 	{\n\
		L = -uLightsGeometry[i].xyz; \n\
		r = 1.0; \n\
		lc= uLightsColor[i].xyz;\n\
 	}\n\
\n\
	vec3 V=normalize(-vpos);\n\
	final +=  phongShading(L,N,V,lc) ; \n\
  } \n\
 \n\
for(int i = 0; i < uNSpotLights; ++i){ \n\
	// light vector (positional light)\n\
	r =  length(uSpotLightsPos[i] -vpos); \n\
	L = normalize(uSpotLightsPos[i] -vpos); \n\
	float LdotD = dot( uSpotLightsDir[i], -L);\n\
	if(LdotD >  uSpotLightsCutOff[i]) \n\
			LdotD = pow(LdotD,uSpotLightsFallOff[i]); \n\
		else \n\
			LdotD = 0.0; \n\
	vec3 V=normalize(-vpos);\n\
	vec3 lc = uSpotLightsColor[i].xyz  *LdotD / (0.009*3.14 * 3.14 *r*r);\n\
	if(V.x >2.0)\n\
 	final += phongShading(L,N,V,lc); \n\
  } \n\
\n\
  for(int i = 0; i < uNAreaLights; ++i)\n\
  {\n\
	vec4 n =  uAreaLightsFrame[i] * vec4(0.0,1.0,0.0,0.0);\n\
	for(int iy =  0; iy < 3;  ++iy)\n\
		for(int ix =  0; ix < 2;  ++ix)\n\
		{\n\
			float y = float(iy)* (uAreaLightsSize[i].y / 2.0 )	- uAreaLightsSize[i].y / 2.0;\n\
			float x = float(ix)* (uAreaLightsSize[i].x / 1.0 ) 	- uAreaLightsSize[i].x / 2.0;\n\
			vec4 lightPos = uAreaLightsFrame[i] * vec4(x,0.0,y,1.0);\n\
			// light vector (positional light)\n\
			r = length(lightPos.xyz-vpos); \n\
			L = normalize(lightPos.xyz-vpos); \n\
			if(dot(L,n.xyz) > 0.0) {\n\
				\n\
				vec3 V=normalize(-vpos);\n\
				vec3 lc = uAreaLightsColor[i].xyz/( 0.005*3.14 * 3.14 *r*r*3.0*2.0);\n\
				final +=phongShading(L,N,V,lc); \n\
			}\n\
		} \n\
 } \n\
\n\
 \n\
gl_FragColor  = vec4(final, 1.0);  \n\
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
	shaderProgram.aDiffuseIndex = 1;
	shaderProgram.aNormalIndex = 2;
	gl.bindAttribLocation(shaderProgram, shaderProgram.aPositionIndex, "aPosition");
	gl.bindAttribLocation(shaderProgram, shaderProgram.aDiffuseIndex, "aDiffuse");
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

	shaderProgram.uProjectionMatrixLocation = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
	shaderProgram.uModelViewMatrixLocation = gl.getUniformLocation(shaderProgram, "uModelViewMatrix");
	shaderProgram.uViewSpaceNormalMatrixLocation = gl.getUniformLocation(shaderProgram, "uViewSpaceNormalMatrix");

	shaderProgram.uLightsGeometryLocation = new Array();
	shaderProgram.uLightsColorLocation = new Array();

	for (var i = 0; i < nLights; ++i) {
		shaderProgram.uLightsGeometryLocation[i] = gl.getUniformLocation(shaderProgram, "uLightsGeometry[" + i + "]");
		shaderProgram.uLightsColorLocation[i] = gl.getUniformLocation(shaderProgram, "uLightsColor[" + i + "]");
	}

	shaderProgram.uSpotLightsPosLocation = new Array();
	shaderProgram.uSpotLightsDirLocation = new Array();
	shaderProgram.uSpotLightsCutOffLocation = new Array();
	shaderProgram.uSpotLightsFallOffLocation = new Array();
	shaderProgram.uSpotLightsColorLocation = new Array();

	shaderProgram.uNSpotLightsLocation = gl.getUniformLocation(shaderProgram, "uNSpotLights");
	for (var i = 0; i < nSpotLights; ++i) {
		shaderProgram.uSpotLightsPosLocation[i] = gl.getUniformLocation(shaderProgram, "uSpotLightsPos[" + i + "]");
		shaderProgram.uSpotLightsDirLocation[i] = gl.getUniformLocation(shaderProgram, "uSpotLightsDir[" + i + "]");
		shaderProgram.uSpotLightsCutOffLocation[i] = gl.getUniformLocation(shaderProgram, "uSpotLightsCutOff[" + i + "]");
		shaderProgram.uSpotLightsFallOffLocation[i] = gl.getUniformLocation(shaderProgram, "uSpotLightsFallOff[" + i + "]");
		shaderProgram.uSpotLightsColorLocation[i] = gl.getUniformLocation(shaderProgram, "uSpotLightsColor[" + i + "]");

	}

	shaderProgram.uAreaLightsFrameLocation = new Array();
	shaderProgram.uAreaLightsSizeLocation = new Array();
	shaderProgram.uAreaLightsColorLocation = new Array();
	shaderProgram.uNAreaLightLocation = gl.getUniformLocation(shaderProgram, "uNAreaLightsLights");
	for (var i = 0; i < nAreaLights; ++i) {
		shaderProgram.uAreaLightsFrameLocation[i] = gl.getUniformLocation(shaderProgram, "uAreaLightsFrame[" + i + "]");
		shaderProgram.uAreaLightsSizeLocation[i] = gl.getUniformLocation(shaderProgram, "uAreaLightsSize[" + i + "]");
		shaderProgram.uAreaLightsColorLocation[i] = gl.getUniformLocation(shaderProgram, "uAreaLightsColor[" + i + "]");
	}

	shaderProgram.uShininessLocation = gl.getUniformLocation(shaderProgram, "uShininess");
	shaderProgram.uKaLocation = gl.getUniformLocation(shaderProgram, "uKa");
	shaderProgram.uKdLocation = gl.getUniformLocation(shaderProgram, "uKd");
	shaderProgram.uKsLocation = gl.getUniformLocation(shaderProgram, "uKs");

	return shaderProgram;
};

/* --------------------------------------------------------------------------------------------- */

phongSingleColorMultiLightShader = function (gl, nLights, nSpotLights, nAreaLights) {

	var shaderProgram = gl.createProgram();

	shaderProgram.vertex_shader = "\
precision highp float;  \n\
\n\
uniform mat4 uProjectionMatrix;  \n\
uniform mat4 uModelViewMatrix;\n\
uniform mat3 uViewSpaceNormalMatrix;\n\
\n\
attribute vec3 aPosition;  \n\
attribute vec3 aNormal; \n\
varying vec3 vpos;\n\
varying vec3 vnormal;\n\
void main() \n\
{  \n\
  // vertex normal (in view space)  \n\
  vnormal = normalize(uViewSpaceNormalMatrix * aNormal); \n\
\n\
  \n\
// vertex position (in view space)\n\
  vec4 position = vec4(aPosition, 1.0);\n\
\n\
  vpos = vec3(uModelViewMatrix * position);  \n\
// output \n\
  gl_Position = uProjectionMatrix *uModelViewMatrix * position;\n\
}  \n\
";

	shaderProgram.fragment_shader = "\
precision highp float;  \n\
\n\
const int uNLights 		=" + nLights + "; \n\
const int uNSpotLights 	=" + nSpotLights + "; \n\
const int uNAreaLights	=" + nAreaLights + ";\n\
uniform vec4 uColor; \n\
uniform vec4 uLightsColor[uNLights]; \n\
uniform vec4 uLightsGeometry[uNLights]; \n\
uniform vec3 uSpotLightsPos[uNSpotLights]; \n\
uniform vec3 uSpotLightsDir[uNSpotLights]; \n\
uniform vec4 uSpotLightsColor[uNSpotLights]; \n\
uniform float uSpotLightsCutOff[uNSpotLights];\n\
uniform float uSpotLightsFallOff[uNSpotLights];\n\
\n\
uniform vec2 uAreaLightsSize[uNAreaLights]; \n\
uniform vec3 uAreaLightsColor[uNAreaLights]; \n\
uniform mat4 uAreaLightsFrame[uNAreaLights]; \n\
\n\
varying vec3 vnormal;\n\
varying vec3 vpos;\n\
\n\
// positional light: position and color\n\
\n\
\n\
// shininess exponent\n\
uniform float uShininess;  \n\
// amount of ambient component\n\
uniform float uKa;\n\
// amount of diffuse component\n\
uniform float uKd;\n\
// amount of specular component  \n\
uniform float uKs;\n\
\n\
vec3 phongShading( vec3 L, vec3 N, vec3 V, vec3 lightColor){\n\
	vec3 mat_ambient = uColor.xyz; \n\
	vec3 mat_diffuse = uColor.xyz; \n\
	vec3 mat_specular= uColor.xyz; \n\
	\n\
	// ambient component  \n\
	vec3 ambient = mat_ambient*lightColor; \n\
	\n\
	// diffuse component  \n\
	float NdotL = max(0.0, dot(N, L));\n\
	vec3 diffuse = (mat_diffuse * lightColor) * NdotL; \n\
							  \n\
	// specular component \n\
	vec3 R = (2.0 * NdotL * N) - L;\n\
	float RdotV = max(0.0, dot(R, V));\n\
	float spec = pow(RdotV, uShininess); \n\
	vec3 specular = (mat_specular * lightColor) * spec;\n\
								 \n\
	vec3 contribution = uKa * ambient + uKd * diffuse + uKs * specular;  \n\
	return contribution; \n\
	\n\
}\n\
void main() \n\
{  \n\
  // normalize interpolated normal  \n\
  vec3 N = normalize(vnormal);	 \n\
  vec3 final= vec3(0,0,0); \n\
\n\
float NdotL; \n\
vec3 L; \n\
float r; \n\
vec3 lc ;\n\
 \n\
  for(int i = 0; i < uNLights; ++i){ \n\
 	if( abs(uLightsGeometry[i].w -1.0)< 0.01 ){ \n\
 		// light vector (positional light)\n\
 		r =  length(uLightsGeometry[i].xyz-vpos); \n\
 		L = normalize(uLightsGeometry[i].xyz-vpos); \n\
		lc= uLightsColor[i].xyz / (0.03*3.14 * 3.14 *r*r);\n\
 	}\n\
 	else \n\
 	{\n\
		L = -uLightsGeometry[i].xyz; \n\
		r = 1.0; \n\
		lc= uLightsColor[i].xyz;\n\
 	}\n\
\n\
	vec3 V=normalize(-vpos);\n\
 	final +=  phongShading (L,N,V,lc); \n\
  } \n\
  \n\
for(int i = 0; i < uNSpotLights; ++i){ \n\
	// light vector (positional light)\n\
	r =  length(uSpotLightsPos[i] -vpos); \n\
	L = normalize(uSpotLightsPos[i] -vpos); \n\
	float LdotD = dot( uSpotLightsDir[i], -L);\n\
	if(LdotD >  uSpotLightsCutOff[i]) \n\
			LdotD = pow(LdotD,uSpotLightsFallOff[i]); \n\
		else \n\
			LdotD = 0.0; \n\
	vec3 V=normalize(-vpos);\n\
	vec3 lc = uSpotLightsColor[i].xyz  *LdotD / (0.009*3.14 * 3.14 *r*r);\n\
 	final += phongShading(L,N,V,lc); \n\
  } \n\
\n\
  for(int i = 0; i < uNAreaLights; ++i)\n\
  {\n\
	vec4 n =  uAreaLightsFrame[i] * vec4(0.0,1.0,0.0,0.0);\n\
	for(int iy =  0; iy < 3;  ++iy)\n\
		for(int ix =  0; ix < 2;  ++ix)\n\
		{\n\
			float y = float(iy)* (uAreaLightsSize[i].y / 2.0 )	- uAreaLightsSize[i].y / 2.0;\n\
			float x = float(ix)* (uAreaLightsSize[i].x / 1.0 ) 	- uAreaLightsSize[i].x / 2.0;\n\
			vec4 lightPos = uAreaLightsFrame[i] * vec4(x,0.0,y,1.0);\n\
			// light vector (positional light)\n\
			r = length(lightPos.xyz-vpos); \n\
			L = normalize(lightPos.xyz-vpos); \n\
			if(dot(L,n.xyz) > 0.0) {\n\
				\n\
				vec3 V=normalize(-vpos);\n\
				vec3 lc = uAreaLightsColor[i].xyz/( 0.005*3.14 * 3.14 *r*r*3.0*2.0);\n\
				final +=phongShading(L,N,V,lc); \n\
			}\n\
		} \n\
 } \n\
\n\
 \n\
gl_FragColor  = vec4(final, 1.0);  \n\
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

	shaderProgram.uProjectionMatrixLocation = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
	shaderProgram.uModelViewMatrixLocation = gl.getUniformLocation(shaderProgram, "uModelViewMatrix");
	shaderProgram.uViewSpaceNormalMatrixLocation = gl.getUniformLocation(shaderProgram, "uViewSpaceNormalMatrix");

	shaderProgram.uLightsGeometryLocation = new Array();
	shaderProgram.uLightsColorLocation = new Array();

	for (var i = 0; i < nLights; ++i) {
		shaderProgram.uLightsGeometryLocation[i] = gl.getUniformLocation(shaderProgram, "uLightsGeometry[" + i + "]");
		shaderProgram.uLightsColorLocation[i] = gl.getUniformLocation(shaderProgram, "uLightsColor[" + i + "]");
	}

	shaderProgram.uSpotLightsPosLocation = new Array();
	shaderProgram.uSpotLightsDirLocation = new Array();
	shaderProgram.uSpotLightsCutOffLocation = new Array();
	shaderProgram.uSpotLightsFallOffLocation = new Array();
	shaderProgram.uSpotLightsColorLocation = new Array();

	shaderProgram.uNSpotLightsLocation = gl.getUniformLocation(shaderProgram, "uNSpotLights");
	for (var i = 0; i < nSpotLights; ++i) {
		shaderProgram.uSpotLightsPosLocation[i] = gl.getUniformLocation(shaderProgram, "uSpotLightsPos[" + i + "]");
		shaderProgram.uSpotLightsDirLocation[i] = gl.getUniformLocation(shaderProgram, "uSpotLightsDir[" + i + "]");
		shaderProgram.uSpotLightsCutOffLocation[i] = gl.getUniformLocation(shaderProgram, "uSpotLightsCutOff[" + i + "]");
		shaderProgram.uSpotLightsFallOffLocation[i] = gl.getUniformLocation(shaderProgram, "uSpotLightsFallOff[" + i + "]");
		shaderProgram.uSpotLightsColorLocation[i] = gl.getUniformLocation(shaderProgram, "uSpotLightsColor[" + i + "]");

	}

	shaderProgram.uAreaLightsFrameLocation = new Array();
	shaderProgram.uAreaLightsSizeLocation = new Array();
	shaderProgram.uAreaLightsColorLocation = new Array();
	shaderProgram.uNAreaLightLocation = gl.getUniformLocation(shaderProgram, "uNAreaLightsLights");
	for (var i = 0; i < nAreaLights; ++i) {
		shaderProgram.uAreaLightsFrameLocation[i] = gl.getUniformLocation(shaderProgram, "uAreaLightsFrame[" + i + "]");
		shaderProgram.uAreaLightsSizeLocation[i] = gl.getUniformLocation(shaderProgram, "uAreaLightsSize[" + i + "]");
		shaderProgram.uAreaLightsColorLocation[i] = gl.getUniformLocation(shaderProgram, "uAreaLightsColor[" + i + "]");
	}

	shaderProgram.uShininessLocation = gl.getUniformLocation(shaderProgram, "uShininess");
	shaderProgram.uKaLocation = gl.getUniformLocation(shaderProgram, "uKa");
	shaderProgram.uKdLocation = gl.getUniformLocation(shaderProgram, "uKd");
	shaderProgram.uKsLocation = gl.getUniformLocation(shaderProgram, "uKs");

	shaderProgram.uColorLocation = gl.getUniformLocation(shaderProgram, "uColor");

	return shaderProgram;
};
