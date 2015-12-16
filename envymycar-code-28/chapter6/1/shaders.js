lambertianMultiLightShader = function (gl,nLamps) {

var shaderProgram = gl.createProgram();

shaderProgram.PerPixelLambertian_vs = "\
precision highp float;                                     \n\
                                                           \n\
uniform mat4 uProjectionMatrix;                            \n\
uniform mat4 uModelViewMatrix;                             \n\
uniform mat3 uViewSpaceNormalMatrix;                       \n\
attribute vec3 aPosition;                                  \n\
attribute vec3 aNormal;                                    \n\
attribute vec4 aDiffuse;                                     \n\
varying vec3 vpos;                                         \n\
varying vec3 vnormal;                                      \n\
varying vec4 vdiffuse;                                       \n\
                                                           \n\
void main()                                                \n\
{                                                          \n\
  vnormal = normalize(uViewSpaceNormalMatrix * aNormal);   \n\
  vdiffuse = aDiffuse;                                         \n\
  vec4 position = vec4(aPosition, 1.0);                    \n\
  vpos = vec3(uModelViewMatrix * position);                \n\
  gl_Position = uProjectionMatrix *uModelViewMatrix *position;\n\
}                                                          \n\
"; 







// line 34, listing 6.9
shaderProgram.PerPixelLambertian_fs = "\
precision highp float;                                    \n\
                                                          \n\
const int uNLights = " +  nLamps + ";                     \n\
varying vec3 vnormal;                                     \n\
varying vec3 vpos;                                        \n\
varying vec4 vdiffuse;                                    \n\
                                                          \n\
// positional light: position and color                   \n\
uniform vec4 uLightsGeometry[uNLights];                   \n\
uniform vec4 uLightsColor[uNLights];                      \n\
                                                          \n\
void main()                                               \n\
{                                                         \n\
  // normalize interpolated normal                        \n\
  vec3 N = normalize(vnormal);	                          \n\
  vec3 lambert= vec3(0,0,0);                              \n\
  float r,NdotL;																					\n\
  vec3 L;                                                 \n\
  for (int i = 0; i <uNLights; ++i) {                     \n\
	if (abs(uLightsGeometry[i].w-1.0)<0.01) {               \n\
	r = 0.03*3.14*3.14*length(uLightsGeometry[i].xyz-vpos); \n\
	  // light vector (positional light)                   	\n\
	  L = normalize(uLightsGeometry[i].xyz-vpos);          	\n\
	}                                                     	\n\
	else {                                                 	\n\
	 L = -uLightsGeometry[i].xyz;                         	\n\
	 r = 1.0;																								\n\
   }                                                      \n\
    // diffuse component																	\n\
    NdotL = max(0.0, dot(N, L))/(r*r);										\n\
    lambert += (vdiffuse.xyz * uLightsColor[i].xyz) * NdotL;\n\
  }																												\n\
  gl_FragColor  = vec4(lambert,1.0);                      \n\
}";// line 69


  // create the vertex shader
  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
   gl.shaderSource(vertexShader, shaderProgram.PerPixelLambertian_vs);
  gl.compileShader(vertexShader);
  
  // create the fragment shader
  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, shaderProgram.PerPixelLambertian_fs);
  gl.compileShader(fragmentShader);
  

  // Create the shader program
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  shaderProgram.aPositionIndex = 0;
  shaderProgram.aDiffuseIndex = 1;
  shaderProgram.aNormalIndex = 2;  
  gl.bindAttribLocation(shaderProgram, shaderProgram.aPositionIndex, "aPosition");
  gl.bindAttribLocation(shaderProgram, shaderProgram.aColorIndex, "aColor");
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
  shaderProgram.uModelViewMatrixLocation = gl.getUniformLocation(shaderProgram,"uModelViewMatrix");
  shaderProgram.uViewSpaceNormalMatrixLocation = gl.getUniformLocation(shaderProgram,"uViewSpaceNormalMatrix");
  
   
  shaderProgram.uLightsGeometryLocation= new Array();
  shaderProgram.uLightsColorLocation= new Array();
  
  for(var i = 0; i < nLamps; ++i){
	shaderProgram.uLightsGeometryLocation[i] = gl.getUniformLocation(shaderProgram,"uLightsGeometry["+i+"]");
	shaderProgram.uLightsColorLocation[i] = gl.getUniformLocation(shaderProgram,"uLightsColor["+i+"]");
  }
  
  shaderProgram.uLightColorLocation = gl.getUniformLocation(shaderProgram,"uLightColor");
  
  return shaderProgram;
};

/* --------------------------------------------------------------------------------------------- */





/* --------------------------------------------------------------------------------------------- */

lambertianSingleColorMultiLightShader = function (gl,nLights) {

 var shaderProgram = gl.createProgram();

shaderProgram.PerPixelLambertian_vs = "\
precision highp float;     \n\
const int uNLights ="+nLights+"; \n\
uniform  vec4 uLightsGeometry[uNLights]; \n\
\n\
uniform mat4 uProjectionMatrix;     \n\
uniform mat4 uModelViewMatrix;   \n\
uniform mat3 uViewSpaceNormalMatrix;   \n\
attribute vec3 aPosition;  \n\
attribute vec3 aNormal;    \n\
varying vec3 vpos;   \n\
varying vec3 vnormal;\n\
varying vec3 vcolor;\n\
varying vec4 vLightsPosDir [uNLights]; \n\
varying vec4 tmp_poslight;\n\
   \n\
void main()    \n\
{  \n\
  // vertex normal (in view space)     \n\
  vnormal = normalize(uViewSpaceNormalMatrix * aNormal); \n\
   \n\
  \n\
// vertex position (in view space)   \n\
  vec4 position = vec4(aPosition, 1.0);\n\
   \n\
  vpos = vec3(uModelViewMatrix * position);  \n\
  for(int i  = 0; i < uNLights; ++i) \n\
   vLightsPosDir[i] =  uLightsGeometry[i]; \n\
\n\
// output    \n\
  gl_Position = uProjectionMatrix *uModelViewMatrix * position;   \n\
}  \n\
"; 

shaderProgram.PerPixelLambertian_fs = "\
precision highp float;     \n\
   \n\
const int uNLights = "+nLights+"; \n\
uniform vec4 uColor; \n\
uniform vec4 uLightsColor[uNLights]; \n\
varying vec3 vnormal;\n\
varying vec3 vpos;   \n\
varying vec4 vLightsPosDir[uNLights]; \n\
   \n\
// positional light: position and color\n\
uniform vec3 uLightColor;  \n\
varying vec4 tmp_poslight;\n\
   \n\
void main()    \n\
{  \n\
  // normalize interpolated normal     \n\
  vec3 N = normalize(vnormal);	 \n\
  vec3 lambert= vec3(0,0,0); \n\
\n\
float NdotL; \n\
vec3 L; \n\
float r; \n\
  for(int i = 0; i < uNLights; ++i){ \n\
 	if( abs(vLightsPosDir[i].w -1.0)< 0.01 ){ \n\
 		// light vector (positional light)   \n\
 		r = 0.03*3.14 * 3.14 * length(vLightsPosDir[i].xyz-vpos); \n\
 		L = normalize(vLightsPosDir[i].xyz-vpos); \n\
 	}\n\
 	else \n\
 	{\n\
		L = -vLightsPosDir[i].xyz; \n\
		r = 1.0; \n\
 	}\n\
   \n\
	// diffuse component     \n\
	NdotL = max(0.0, dot(N, L))/(r*r);   \n\
	lambert +=   (uColor.xyz * uLightsColor[i].xyz) * NdotL;    \n\
  } \n\
   gl_FragColor  = vec4(lambert, 1.0);     \n\
  }  \n\
";


  // create the vertex shader
  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
   gl.shaderSource(vertexShader, shaderProgram.PerPixelLambertian_vs);
  gl.compileShader(vertexShader);
  
  // create the fragment shader
  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, shaderProgram.PerPixelLambertian_fs);
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
  shaderProgram.uModelViewMatrixLocation = gl.getUniformLocation(shaderProgram,"uModelViewMatrix");
  shaderProgram.uViewSpaceNormalMatrixLocation = gl.getUniformLocation(shaderProgram,"uViewSpaceNormalMatrix");
  
  shaderProgram.uLightsGeometryLocation= new Array();
  shaderProgram.uLightsColorLocation= new Array();
  
  for(var i = 0; i < nLights; ++i){
	shaderProgram.uLightsGeometryLocation[i] = gl.getUniformLocation(shaderProgram,"uLightsGeometry["+i+"]");
	shaderProgram.uLightsColorLocation[i] = gl.getUniformLocation(shaderProgram,"uLightsColor["+i+"]");
  }
  
  shaderProgram.uColorLocation = gl.getUniformLocation(shaderProgram,"uColor");

  return shaderProgram;
};

