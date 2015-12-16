phongShader = function (gl) {

 var shaderProgram = gl.createProgram();
	
shaderProgram.vertex_shader = "\
precision highp float;                                               \n\
                                                                     \n\
uniform mat4 uProjectionMatrix;                             \n\
uniform mat4 uModelViewMatrix;                                       \n\
uniform mat3 uViewSpaceNormalMatrix;                                 \n\
uniform vec4 uLightDirection; \n\
attribute vec3 aPosition;                                            \n\
attribute vec3 aNormal;                                              \n\
attribute vec4 aDiffuse; \n\
attribute vec4 aAmbient; \n\
attribute vec4 aSpecular; \n\
attribute vec4 aShininess; \n\
varying vec3 vpos;                                                   \n\
varying vec3 vnormal;                                                \n\
varying vec4 vLightDirection;                                                \n\
varying vec4 vdiffuse;\n\
varying vec4 vambient;\n\
varying vec4 vspecular;\n\
varying vec4 vshininess; \n\
\n\
\n\
void main()                                                          \n\
{                                                                    \n\
  // vertex normal (in view space)                                   \n\
  vnormal = normalize(uViewSpaceNormalMatrix * aNormal);             \n\
                                                                     \n\
  // color   (in view space)                                   \n\
  vdiffuse = aDiffuse;             \n\
  vambient = aAmbient;  \n\
  vspecular = aSpecular;  \n\
  vshininess = aShininess;  \n\
// vertex position (in view space)                                 \n\
  vec4 position = vec4(aPosition, 1.0);                              \n\
  vpos = vec3(uModelViewMatrix * position);                          \n\
                                                                     \n\
  vLightDirection =  uLightDirection; \n\
  // output                                                          \n\
  gl_Position = uProjectionMatrix *uModelViewMatrix * position;               \n\
}                                                                    \n\
"; 

shaderProgram.fragment_shader = "\
precision highp float;                                               \n\
                                                                     \n\
varying vec3 vnormal;                                                \n\
varying vec3 vpos;                                                   \n\
varying vec4 vLightDirection;                                                \n\
varying vec4 vdiffuse;\n\
varying vec4 vambient;\n\
varying vec4 vspecular;\n\
varying vec4 vshininess; \n\
                                                                     \n\
// positional light:  color                              \n\
uniform vec3 uLightColor;                                            \n\
                                                                     \n\
vec3 phongShading( vec3 L, vec3 N, vec3 V, vec3 lightColor){\n\
	vec3 mat_ambient = vambient.xyz;                            \n\
	vec3 mat_diffuse = vdiffuse.xyz;                            \n\
	vec3 mat_specular= vspecular.xyz;                            \n\
	\n\
	// ambient component (ambient light is assumed white)              \n\
	vec3 ambient = mat_ambient*lightColor;                                        \n\
	\n\
	// diffuse component                                               \n\
	float NdotL = max(0.0, dot(N, L));                                 \n\
	vec3 diffuse = (mat_diffuse * lightColor) * NdotL;                \n\
							     \n\
	// specular component                                              \n\
	vec3 R = normalize((2.0 * NdotL * N) - L);                                    \n\
	float RdotV = max(0.0, dot(R, V));                                 \n\
	float spec = pow(RdotV, vshininess.x);                               \n\
	vec3 specular = (mat_specular * lightColor) * spec;               \n\
								 \n\
	vec3 contribution = ambient + diffuse + specular;  \n\
	return    contribution  ; \n\
}\n\
void main()                                                          \n\
{                                                                    \n\
  // normalize interpolated normal                                   \n\
  vec3 N = normalize(vnormal);	                                     \n\
                                                                     \n\
  // light vector (positional light)                                 \n\
  vec3 L =	normalize(-vLightDirection.xyz);                         \n\
                                                                     \n\
  // vertex-to-eye (view vector)                                     \n\
  vec3 V = normalize(-vpos);                                         \n\
                                                                     \n\
  vec3 finalcolor  = phongShading(   L,   N,   V,  uLightColor);  \n\
   gl_FragColor  = vec4(finalcolor,1.0);                             \n\
  }                                                                    \n\
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
  shaderProgram.uLightDirectionLocation = gl.getUniformLocation(shaderProgram,"uLightDirection");
  
  return shaderProgram;
};


phongSingleColorShader = function (gl) {

 var shaderProgram = gl.createProgram();
	
shaderProgram.PerPixelPhong_vs = "\
precision highp float;                                               \n\
                                                                     \n\
uniform mat4 uProjectionMatrix;                             \n\
uniform mat4 uModelViewMatrix;                                       \n\
uniform mat3 uViewSpaceNormalMatrix;                                 \n\
uniform vec3	uLightPosition; \n\
attribute vec3 aPosition;                                            \n\
attribute vec3 aNormal;                                              \n\
varying vec3 vpos;                                                   \n\
varying vec3 vnormal;                                                \n\
varying vec3 vcolor;                                                \n\
varying vec3 vLightPosition;                                                \n\
                                                                     \n\
void main()                                                          \n\
{                                                                    \n\
  // vertex normal (in view space)                                   \n\
  vnormal = normalize(uViewSpaceNormalMatrix * aNormal);             \n\
                                                                     \n\
  \n\
// vertex position (in view space)                                 \n\
  vec4 position = vec4(aPosition, 1.0);                              \n\
  vpos = vec3(uModelViewMatrix * position);                          \n\
                                                                     \n\
  vec4 light_position = vec4(uLightPosition,1.0); \n\
  vLightPosition =  uLightPosition; \n\
  // output                                                          \n\
  gl_Position = uProjectionMatrix *uModelViewMatrix * position;               \n\
}                                                                    \n\
"; 

shaderProgram.PerPixelPhong_fs = "\
precision highp float;                                               \n\
                                                                     \n\
varying vec3 vnormal;                                                \n\
varying vec3 vpos;                                                   \n\
varying vec3 vLightPosition;                                                \n\
                                                                     \n\
// ambient, diffuse and specular color                               \n\
uniform vec4 uColor;                                            \n\
// positional light: position and color                              \n\
uniform vec3 uLightColor;                                            \n\
// shininess exponent                                                \n\
uniform float uShininess;                                            \n\
// amount of ambient component                                       \n\
uniform float uKa;                                                   \n\
// amount of diffuse component                                       \n\
uniform float uKd;                                                   \n\
// amount of specular component                                      \n\
uniform float uKs;                                                   \n\
                                                                     \n\
void main()                                                          \n\
{                                                                    \n\
  // material propertise                                             \n\
  vec3 mat_ambient = uColor.xyz;                            \n\
  vec3 mat_diffuse = uColor.xyz;                            \n\
  vec3 mat_specular= uColor.xyz;                            \n\
                                                                     \n\
  // normalize interpolated normal                                   \n\
  vec3 N = normalize(vnormal);	                                     \n\
                                                                     \n\
  // light vector (positional light)                                 \n\
  vec3 L = normalize(vLightPosition - vpos);                         \n\
                                                                     \n\
  // vertex-to-eye (view vector)                                     \n\
  vec3 V = normalize(-vpos);                                         \n\
                                                                     \n\
  // ambient component (ambient light is assumed white)              \n\
  vec3 ambient = mat_ambient;                                        \n\
                                                                     \n\
  // diffuse component                                               \n\
  float NdotL = max(0.0, dot(N, L));                                 \n\
  vec3 diffuse = (mat_diffuse * uLightColor) * NdotL;                \n\
                                                                     \n\
  // specular component                                              \n\
  vec3 R = (2.0 * NdotL * N) - L;                                    \n\
  float RdotV = max(0.0, dot(R, V));                                 \n\
  float spec = pow(RdotV, uShininess);                               \n\
  vec3 specular = (mat_specular * uLightColor) * spec;               \n\
	                                                                 \n\
  vec3 finalcolor = uKa * ambient + uKd * diffuse + uKs * specular;  \n\
  gl_FragColor  = vec4(finalcolor, 1.0);                             \n\
 }                                                                    \n\
";


  // create the vertex shader
  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
   gl.shaderSource(vertexShader, shaderProgram.PerPixelPhong_vs);
  gl.compileShader(vertexShader);
  
  // create the fragment shader
  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, shaderProgram.PerPixelPhong_fs);
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
  shaderProgram.uLightPositionLocation = gl.getUniformLocation(shaderProgram,"uLightPosition");
  shaderProgram.uLightColorLocation = gl.getUniformLocation(shaderProgram,"uLightColor");
  shaderProgram.uColorLocation = gl.getUniformLocation(shaderProgram,"uColor");
  shaderProgram.uShininessLocation = gl.getUniformLocation(shaderProgram,"uShininess");
  shaderProgram.uKaLocation = gl.getUniformLocation(shaderProgram,"uKa");
  shaderProgram.uKdLocation = gl.getUniformLocation(shaderProgram,"uKd");
  shaderProgram.uKsLocation = gl.getUniformLocation(shaderProgram,"uKs");
  
  return shaderProgram;
};


