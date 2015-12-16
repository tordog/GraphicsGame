/* Phong reflectance model (per-face) --> Flat shading
/*****************************************************************************/

/* NOTE: FLAT SHADING IS NOT AVAILABLE IN WEBGL (WITHOUT VERTEX DUPLICATION)
/*       DUE TO THE MISSING 'FLAT' QUALIFIER.


/* Phong reflectance model (per-vertex) --> Gouraud shading
/*****************************************************************************/

var PerVertexPhong_vs = "\
precision highp float;                                               \n\
                                                                     \n\
uniform mat4 uModelViewProjectionMatrix;                             \n\
uniform mat4 uModelViewMatrix;                                       \n\
uniform mat3 uViewSpaceNormalMatrix;                                 \n\
                                                                     \n\
// positional light: position and color                              \n\
uniform vec3 uLightPosition;                                         \n\
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
attribute vec3 aPosition;                                            \n\
attribute vec3 aNormal;                                              \n\
                                                                     \n\
varying vec3 vertexcolor;                                            \n\
                                                                     \n\
void main(void)                                                      \n\
{                                                                    \n\
  // material propertise                                             \n\
  vec3 mat_ambient = vec3(0.0, 0.0, 1.0);                            \n\
  vec3 mat_diffuse = vec3(0.0, 0.0, 1.0);                            \n\
  vec3 mat_specular= vec3(1.0, 1.0, 1.0);                            \n\
                                                                     \n\
  // vertex normal (in view space)                                   \n\
  vec3 N = uViewSpaceNormalMatrix * aNormal;                         \n\
                                                                     \n\
  // vertex position (in view space)                                 \n\
  vec4 position = vec4(aPosition, 1.0);                              \n\
  vec3 vpos = vec3(uModelViewMatrix * position);                     \n\
	                                                                 \n\
  // light vector (positional light)                                 \n\
  vec3 L = normalize(uLightPosition);                                \n\
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
  vertexcolor  = uKa * ambient + uKd * diffuse + uKs * specular;     \n\
                                                                     \n\
  gl_Position = uModelViewProjectionMatrix * position;               \n\
}                                                                    \n\
";

var PerVertexPhong_fs = "\
precision highp float;                                               \n\
                                                                     \n\
varying vec3 vertexcolor;                                            \n\
                                                                     \n\
void main(void)                                                      \n\
{                                                                    \n\
	gl_FragColor = vec4(vertexcolor, 1.0);                           \n\
}                                                                    \n\
"; 
 
/* Phong reflectance model (per-pixel) --> Phong shading
/*****************************************************************************/

var PerPixelPhong_vs = "\
precision highp float;                                               \n\
                                                                     \n\
uniform mat4 uModelViewProjectionMatrix;                             \n\
uniform mat4 uModelViewMatrix;                                       \n\
uniform mat3 uViewSpaceNormalMatrix;                                 \n\
attribute vec3 aPosition;                                            \n\
attribute vec3 aNormal;                                              \n\
varying vec3 vpos;                                                   \n\
varying vec3 vnormal;                                                \n\
                                                                     \n\
void main()                                                          \n\
{                                                                    \n\
  // vertex normal (in view space)                                   \n\
  vnormal = normalize(uViewSpaceNormalMatrix * aNormal);             \n\
                                                                     \n\
  // vertex position (in view space)                                 \n\
  vec4 position = vec4(aPosition, 1.0);                              \n\
  vpos = vec3(uModelViewMatrix * position);                          \n\
                                                                     \n\
  // output                                                          \n\
  gl_Position = uModelViewProjectionMatrix * position;               \n\
}                                                                    \n\
"; 

var PerPixelPhong_fs = "\
precision highp float;                                               \n\
                                                                     \n\
varying vec3 vnormal;                                                \n\
varying vec3 vpos;                                                   \n\
                                                                     \n\
// positional light: position and color                              \n\
uniform vec3 uLightPosition;                                         \n\
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
  vec3 mat_ambient = vec3(0.0, 0.0, 1.0);                            \n\
  vec3 mat_diffuse = vec3(0.0, 0.0, 1.0);                            \n\
  vec3 mat_specular= vec3(1.0, 1.0, 1.0);                            \n\
                                                                     \n\
  // normalize interpolated normal                                   \n\
  vec3 N = normalize(vnormal);	                                     \n\
                                                                     \n\
  // light vector (positional light)                                 \n\
  vec3 L = normalize(uLightPosition);                                \n\
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
