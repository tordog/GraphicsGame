// Global NVMC Client
// ID 6.3

/***********************************************************************/
var NVMCClient = NVMCClient || {};
/***********************************************************************/


NVMCClient.drawTree = function(gl) {
	var stack = this.stack;
	
	stack.push();
		var M_0_tra1 = SglMat4.translation([0, 0.8, 0]);
		stack.multiply(M_0_tra1);

		var M_0_sca = SglMat4.scaling([0.6, 1.65, 0.6]);
		stack.multiply(M_0_sca);
	 
		gl.uniformMatrix4fv(this.phongSingleColorMultiLightShader.uModelViewMatrixLocation, false, stack.matrix);
		var InvT = SglMat4.inverse(this.stack.matrix)
		InvT = SglMat4.transpose(InvT);	
		gl.uniformMatrix3fv(this.phongSingleColorMultiLightShader.uViewSpaceNormalMatrixLocation, false, SglMat4.to33(InvT) );
		this.drawObject(gl, this.cone, this.phongSingleColorMultiLightShader,[0.2,0.8,0.1,1.0],[0,0,0,1]);
	stack.pop();

	stack.push();
		var M_1_sca = SglMat4.scaling([0.25, 0.4, 0.25]);
		stack.multiply(M_1_sca);

		gl.uniformMatrix4fv(this.phongSingleColorMultiLightShader.uModelViewMatrixLocation, false, stack.matrix);
		gl.uniformMatrix3fv(this.phongSingleColorMultiLightShader.uViewSpaceNormalMatrixLocation, false, SglMat4.to33(this.stack.matrix) );
		this.drawObject(gl, this.cylinder,  this.phongSingleColorMultiLightShader,[0.6,0.23,0.12,1.0],[0,0,0,1]);
	stack.pop();
};

NVMCClient.createCarTechique = function (gl, shaderToUse){

	this.sgl_renderer = new SglModelRenderer(gl);	
	this.sgl_technique = new SglTechnique( gl,
		{	vertexShader	:shaderToUse.vertex_shader, 
			fragmentShader	:shaderToUse.fragment_shader,
			vertexStreams 		: 
			{
				"aPosition"		: [ 0.0,0.0,0.0,1.0],
				"aNormal" 		: [ 1.0, 0.0, 1.0, 0.0 ],
				"aDiffuse" 	 	: [ 0.0, 0.0, 0.8, 0.0 ],
				"aAmbient" 	 	: [ 0.0, 0.0, 0.8, 0.0 ],
				"aSpecular" 	 	: [ 0.0, 0.0, 0.8, 0.0 ],
				"aShininess" 	 	: [ 0.0, 0.0, 0.8, 0.0 ],
			},
			globals : {
				"uProjectionMatrix" 			:{semantic: "PROJECTION_MATRIX", 			value: 	this.projectionMatrix 		},
				"uModelViewMatrix"			:{semantic: "WORLD_VIEW_MATRIX"	,		value:	this.stack.matrix 			},
				"uViewSpaceNormalMatrix"     	:{semantic: "VIEW_SPACE_NORMAL_MATRIX",		value: 	SglMat4.to33(this.stack.matrix) },
				"uAreaLightsFrame"			:{semantic: "AREA_LIGHTS_FRAME",		 	value:	this.areaLightsFrameViewSpace},
				"uAreaLightsSize"			:{semantic: "AREA_LIGHTS_SIZE",			 	value:	this.areaLightsSize			},
				"uAreaLightsColor"			:{semantic: "AREA_LIGHTS_COLOR",			value:	this.areaLightsColor			},
				"uLightsGeometry"           	:{semantic: "LIGHTS_GEOMETRY",       			value:	this.lightsGeometryViewSpace	},
				"uLightsColor"                  	:{semantic: "LIGHTS_COLOR",          			value:	this.lightsColor			},
				"uSpotLightsPos[0]"			:{semantic: "SPOT_LIGHTS_POS_0",				value:	this.spotLightsPosViewSpace[0]},
				"uSpotLightsPos[1]"			:{semantic: "SPOT_LIGHTS_POS_1",				value:	this.spotLightsPosViewSpace[1]},
				"uSpotLightsDir[0]"			:{semantic: "SPOT_LIGHTS_DIR_0",				value:	this.spotLightsDirViewSpace[0]},
				"uSpotLightsDir[1]"			:{semantic: "SPOT_LIGHTS_DIR_1",				value:	this.spotLightsDirViewSpace[1]},
				"uSpotLightsColor[0]"		:{semantic: "SPOT_LIGHTS_COLOR_0",			value:	[0.2,0.2,0.2,1.0]			},
				"uSpotLightsColor[1]"		:{semantic: "SPOT_LIGHTS_COLOR_1",			value:	[0.2,0.2,0.2,1.0]			},
				"uSpotLightsCutOff[0]"		:{semantic: "SPOT_LIGHTS_CUTOFF_0",			value:	this.spotLightsCutOff[0]		},
				"uSpotLightsCutOff[1]"		:{semantic: "SPOT_LIGHTS_CUTOFF_1",			value:	this.spotLightsCutOff[1]		},
				"uSpotLightsFallOff[0]"		:{semantic: "SPOT_LIGHTS_FALLOFF_0",			value:	this.spotLightsFallOff[0]		},
				"uSpotLightsFallOff[1]"		:{semantic: "SPOT_LIGHTS_FALLOFF_1",			value:	this.spotLightsFallOff[1]		},
			}
		});

};


NVMCClient.drawScene = function (gl) {
	gl.useProgram(this.phongSingleColorMultiLightShader);
	gl.uniform1f(this.phongSingleColorMultiLightShader.uKaLocation,0.5);
	gl.uniform1f(this.phongSingleColorMultiLightShader.uKdLocation,0.5);
	gl.uniform1f(this.phongSingleColorMultiLightShader.uKsLocation,0.5);
	gl.uniform1f(this.phongSingleColorMultiLightShader.uShininessLocation,0.5);

 this.drawSceneWithShader(gl,this.phongSingleColorMultiLightShader);
};

// NVMC Client Events
/***********************************************************************/
NVMCClient.onInitialize = function () {
	var gl = this.ui.gl;
	this.cameras[2].width  = this.ui.width;
	this.cameras[2].height = this.ui.height;


	/*************************************************************/
	NVMC.log("SpiderGL Version : " + SGL_VERSION_STRING + "\n");
	/*************************************************************/

	/*************************************************************/
	this.game.player.color = [ 1.0, 0.0, 0.0, 1.0 ];
	/*************************************************************/

	/*************************************************************/
	this.initMotionKeyHandlers();
	/*************************************************************/
	this.stack = new SglMatrixStack();
	this.projection_matrix =  SglMat4.identity();
	
	/*************************************************************/
	this.initializeLights();
	this.initializeObjects(gl);
	this.initializeCameras();
	this.uniformShader = new uniformShader(gl);
	this.perVertexColorShader = new perVertexColorShader(gl);
	this.phongMultiLightShader = new phongMultiLightShader(gl,this.streetLamps.length+1,2,1);
	this.phongSingleColorMultiLightShader = new phongSingleColorMultiLightShader(gl,this.streetLamps.length+1,2,1);
	/*************************************************************/
	
	this.loadCarModel(gl);
	this.createCarTechnique(gl,this.phongMultiLightShader);
	
};
