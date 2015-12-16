// Global NVMC Client
// ID 6.2
/***********************************************************************/
var NVMCClient = NVMCClient || {};
/***********************************************************************/
NVMCClient.spotLights = [];

//line 8,Listing 6.10{
SpotLight = function () {
	this.pos = [];
	this.dir = [];
	this.posViewSpace = [];
	this.dirViewSpace = [];
	this.cutOff = [];
	this.fallOff = [];
}//line 15}
NVMCClient.initializeLights = function () {
	var lamps = this.game.race.lamps;
	for (var i = 0; i < 7; ++i) {
		var g = lamps[i].position;
		var lightPos = [lamps[i].position[0], lamps[i].position[1], lamps[i].position[2], 1.0];
		lightPos[1] = lightPos[1] + 2.0;
		this.streetLamps[i] = new Lamp(g, new Light(lightPos, [0.3, 0.3, 0.2, 1]));
	}

	this.spotLights[0] = new SpotLight();
	this.spotLights[0].pos = [-0.6, 0.5, -1.9, 1.0];
	this.spotLights[0].dir =SglVec4.normalize([-0.2, 0.2, -1, 0.0]);
	this.spotLights[0].cutOff = 0.2;
	this.spotLights[0].fallOff = 8.0;

	this.spotLights[1] = new SpotLight();
	this.spotLights[1].pos = [0.6, 0.5, -1.9, 1];
	this.spotLights[1].dir = SglVec4.normalize([0.0,  0.2, -1, 0]);
	this.spotLights[1].cutOff = 0.2;
	this.spotLights[1].fallOff = 8.0;
}

NVMCClient.areaLightsFrameViewSpace = [];
NVMCClient.areaLightsSize = [];
NVMCClient.areaLightsColor = [];

// 	temporary		
NVMCClient.tunnels = [];
NVMCClient.areaLights = [];

NVMCClient.areaLigthQuad = null;
NVMCClient.createObjects = function () {
	this.cube = new Cube(10);
	this.cylinder = new Cylinder(10);
	this.cylinder10 = new Cylinder(10,10);
	this.cone = new Cone(10);

	this.track = new Track(this.game.race.track);
	for (var i = 0; i < this.game.race.tunnels.length; ++i)
		this.tunnels[i] = new Tunnel(this.game.race.tunnels[i]);

	var bbox = this.game.race.bbox;
	var quad = [bbox[0], bbox[1] - 0.01, bbox[2],
		bbox[3], bbox[1] - 0.01, bbox[2],
		bbox[3], bbox[1] - 0.01, bbox[5],
		bbox[0], bbox[1] - 0.01, bbox[5]
	];
	this.ground = new Quadrilateral(quad);

	var areaQuad = [-1, 0.0, -1,
		1, 0.0, -1,
		1, 0.0, 1, -1.0, 0.0, 1.0
	];
	this.areaLigthQuad = new Quadrilateral(areaQuad);

	for (var al in this.game.race.arealigths) {
		this.areaLightsFrameViewSpace[al] = SglMat4.identity();
		this.areaLightsSize[al] = this.game.race.arealigths[al].size;
		this.areaLightsColor[al] = this.game.race.arealigths[al].color;
		this.areaLightsColor[al] = [0.5,0.5,0.5];
	}

	this.cabin = new Cabin();
	this.windshield = new Windshield();
	this.rearmirror = new RearMirror();

	var gameBuildings = this.game.race.buildings;
	this.buildings = new Array(gameBuildings.length);
	for (var i = 0; i < gameBuildings.length; ++i) {
		this.buildings[i] = new Building(gameBuildings[i]);
	}
};
NVMCClient.createBuffers = function (gl) {
	this.createObjectBuffers(gl, this.cube, false, false);

	ComputeNormals(this.cylinder);
	this.createObjectBuffers(gl, this.cylinder, false, true);

	ComputeNormals(this.cylinder10);
	this.createObjectBuffers(gl, this.cylinder10, false, true);

	ComputeNormals(this.cone);
	this.createObjectBuffers(gl, this.cone, false, true);

	ComputeNormals(this.track);
	this.createObjectBuffers(gl, this.track, false, true);

	for (var i = 0; i < this.tunnels.length; ++i) {
		ComputeNormals(this.tunnels[i]);
		this.createObjectBuffers(gl, this.tunnels[i], false, true);
	}
	ComputeNormals(this.ground);
	this.createObjectBuffers(gl, this.ground, false, true);

	this.createObjectBuffers(gl, this.areaLigthQuad, false, false);

	this.createObjectBuffers(gl, this.cabin, true, false);
	this.createObjectBuffers(gl, this.windshield, true, false);

	for (var i = 0; i < this.buildings.length; ++i) {
		this.buildings[i] = ComputeNormals(this.buildings[i]);
		this.createObjectBuffers(gl, this.buildings[i], false, true);
	}
};

NVMCClient.drawAreaLigth = function (gl, areaLigth) {
	var stack = this.stack;
	stack.push();
	stack.multiply(areaLigth.frame);
	stack.multiply(SglMat4.scaling([areaLigth.size[0], 1.0, areaLigth.size[1]]));
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.areaLigthQuad, this.uniformShader, [0.9, 0.9, 0.9, 1.0]);
	stack.pop();
};

NVMCClient.drawTree = function (gl, mainShader) {
	var stack = this.stack;

	stack.push();
	var M_0_tra1 = SglMat4.translation([0, 0.8, 0]);
	stack.multiply(M_0_tra1);

	var M_0_sca = SglMat4.scaling([0.6, 1.65, 0.6]);
	stack.multiply(M_0_sca);

	gl.uniformMatrix4fv(mainShader.uModelViewMatrixLocation, false, stack.matrix);
	var InvT = SglMat4.inverse(this.stack.matrix)
	InvT = SglMat4.transpose(InvT);
	gl.uniformMatrix3fv(mainShader.uViewSpaceNormalMatrixLocation, false, SglMat4.to33(InvT));
	this.drawObject(gl, this.cone, mainShader, [0.2, 0.8, 0.1, 1.0], [0, 0, 0, 1]);
	stack.pop();

	stack.push();
	var M_1_sca = SglMat4.scaling([0.25, 0.4, 0.25]);
	stack.multiply(M_1_sca);

	gl.uniformMatrix4fv(mainShader.uModelViewMatrixLocation, false, stack.matrix);
	gl.uniformMatrix3fv(mainShader.uViewSpaceNormalMatrixLocation, false, SglMat4.to33(this.stack.matrix));
	this.drawObject(gl, this.cylinder, mainShader, [0.6, 0.23, 0.12, 1.0], [0, 0, 0, 1]);
	stack.pop();
};

NVMCClient.drawCar = function (gl) {
	this.sgl_renderer.begin();
	this.sgl_renderer.setTechnique(this.sgl_technique);

	this.sgl_renderer.setGlobals({
		"PROJECTION_MATRIX": this.projectionMatrix,
		"WORLD_VIEW_MATRIX": this.stack.matrix,
		"VIEW_SPACE_NORMAL_MATRIX": SglMat4.to33(this.stack.matrix),
		"AREA_LIGHTS_FRAME": this.areaLightsFrameViewSpace,
		"AREA_LIGHTS_SIZE": this.areaLightsSize,
		"AREA_LIGHTS_COLOR": this.areaLightsColor,
		"LIGHTS_GEOMETRY": this.lightsGeometryViewSpace,
		"LIGHTS_COLOR": this.lightsColor,
		"SPOT_LIGHTS_POS_0": this.spotLights[0].posViewSpace,
		"SPOT_LIGHTS_POS_1": this.spotLights[1].posViewSpace,
		"SPOT_LIGHTS_DIR_0": this.spotLights[0].dirViewSpace,
		"SPOT_LIGHTS_DIR_1": this.spotLights[1].dirViewSpace,
	});

	this.sgl_renderer.setPrimitiveMode("FILL");

	this.sgl_renderer.setModel(this.sgl_car_model);
	this.sgl_renderer.renderModel();
	this.sgl_renderer.end();
};

NVMCClient.createCarTechnique = function (gl, shaderToUse) {
	this.sgl_renderer = new SglModelRenderer(gl);
	this.sgl_technique = new SglTechnique(gl, {
		vertexShader: shaderToUse.vertex_shader,
		fragmentShader: shaderToUse.fragment_shader,
		vertexStreams: {
			"aPosition": [0.0, 0.0, 0.0, 1.0],
			"aNormal": [0.0, 0.0, 1.0, 0.0],
			"aDiffuse": [0.0, 0.0, 0.8, 0.0],
			"aAmbient": [0.0,0.0,0.9,0.0]
		},
		globals: {
			"uProjectionMatrix": {
				semantic: "PROJECTION_MATRIX",
				value: this.projectionMatrix
			},
			"uModelViewMatrix": {
				semantic: "WORLD_VIEW_MATRIX",
				value: this.stack.matrix
			},
			"uViewSpaceNormalMatrix": {
				semantic: "VIEW_SPACE_NORMAL_MATRIX",
				value: SglMat4.to33(this.stack.matrix)
			},
			"uAreaLightsFrame": {
				semantic: "AREA_LIGHTS_FRAME",
				value: this.areaLightsFrameViewSpace
			},
			"uAreaLightsSize": {
				semantic: "AREA_LIGHTS_SIZE",
				value: this.areaLightsSize
			},
			"uAreaLightsColor": {
				semantic: "AREA_LIGHTS_COLOR",
				value: this.areaLightsColor
			},
			"uLightsGeometry": {
				semantic: "LIGHTS_GEOMETRY",
				value: this.lightsGeometryViewSpace
			},
			"uLightsColor": {
				semantic: "LIGHTS_COLOR",
				value: this.lightsColor
			},
			"uSpotLightsPos[0]": {
				semantic: "SPOT_LIGHTS_POS_0",
				value: this.spotLights[0].posViewSpace
			},
			"uSpotLightsPos[1]": {
				semantic: "SPOT_LIGHTS_POS_1",
				value: this.spotLights[1].posViewSpace
			},
			"uSpotLightsDir[0]": {
				semantic: "SPOT_LIGHTS_DIR_0",
				value: this.spotLights[0].dirViewSpace
			},
			"uSpotLightsDir[1]": {
				semantic: "SPOT_LIGHTS_DIR_1",
				value: this.spotLights[1].dirViewSpace
			},
			"uSpotLightsColor[0]": {
				semantic: "SPOT_LIGHTS_COLOR_0",
				value: [0.2, 0.2, 0.2, 1.0]
			},
			"uSpotLightsColor[1]": {
				semantic: "SPOT_LIGHTS_COLOR_1",
				value: [0.2, 0.2, 0.2, 1.0]
			},
			"uSpotLightsCutOff[0]": {
				semantic: "SPOT_LIGHTS_CUTOFF_0",
				value: this.spotLights[0].cutOff
			},
			"uSpotLightsCutOff[1]": {
				semantic: "SPOT_LIGHTS_CUTOFF_1",
				value: this.spotLights[1].cutOff
			},
			"uSpotLightsFallOff[0]": {
				semantic: "SPOT_LIGHTS_FALLOFF_0",
				value: this.spotLights[0].fallOff
			},
			"uSpotLightsFallOff[1]": {
				semantic: "SPOT_LIGHTS_FALLOFF_1",
				value: this.spotLights[1].fallOff
			},
		}
	});

};

NVMCClient.drawScene = function (gl) {
	this.drawSceneWithShader(gl, this.lambertianSingleColorMultiLightShader);
};

NVMCClient.drawSceneWithShader = function (gl, mainShader) {
	var width = this.ui.width;
	var height = this.ui.height
	var ratio = width / height;
	var stack = this.stack;

	gl.viewport(0, 0, width, height);

	// Clear the framebuffer
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.enable(gl.DEPTH_TEST);

	stack.loadIdentity();

	if (this.currentCamera == 3) {
		gl.enable(gl.STENCIL_TEST);
		gl.clearStencil(0);
		gl.stencilMask(~0);
		gl.stencilFunc(gl.ALWAYS, 1, 0xFF);
		gl.stencilOp(gl.REPLACE, gl.REPLACE, gl.REPLACE);

		gl.useProgram(this.perVertexColorShader);
		gl.uniformMatrix4fv(this.perVertexColorShader.uModelViewMatrixLocation, false, SglMat4.identity());
		gl.uniformMatrix4fv(this.perVertexColorShader.uProjectionMatrixLocation, false, SglMat4.identity());
		this.drawObject(gl, this.cabin, this.perVertexColorShader);

		gl.stencilFunc(gl.EQUAL, 0, 0xFF);
		gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
		gl.stencilMask(0);
	} else
		gl.disable(gl.STENCIL_TEST);

	this.projectionMatrix = SglMat4.perspective(3.14 / 4, ratio, 1, 1000);

	var orientation = this.myOri();
	var pos = this.myPos();
	this.cameras[this.currentCamera].setView(this.stack, this.myFrame());

	this.lightsGeometryViewSpace[0] = SglMat4.mul4(this.stack.matrix, this.sunLightDirection);
	this.lightsColor[0] = [0.3, 0.3, 0.3, 1.0];
	for (var i = 0; i < this.streetLamps.length; ++i) {
		this.lightsGeometryViewSpace[i + 1] = SglMat4.mul4(this.stack.matrix, this.streetLamps[i].light.geometry);
		this.lightsColor[i + 1] = this.streetLamps[i].light.color;
	} 
	for(var i in this.spotLights){//line 324, Listing 6.11{
		this.spotLights[i].posViewSpace = SglMat4.mul4(this.stack.matrix, SglMat4.mul4(this.myFrame(), this.spotLights[i].pos));
		this.spotLights[i].dirViewSpace = SglMat4.mul4(this.stack.matrix, SglMat4.mul4(this.myFrame(), 	this.spotLights[i].dir));
	}//line 327}

	{ // setting area lights
		for (var al in this.game.race.arealigths)
			this.areaLightsFrameViewSpace[al] = SglMat4.mul(this.stack.matrix, this.game.race.arealigths[al].frame);
	}

	gl.useProgram(mainShader);
	for (var i = 0; i < this.streetLamps.length + 1; ++i) {
		gl.uniform4fv(mainShader.uLightsGeometryLocation[i],
			this.lightsGeometryViewSpace[i]);
		gl.uniform4fv(mainShader.uLightsColorLocation[i],
			this.lightsColor[i]);
	}

	// spotlights
	gl.uniform3fv(mainShader.uSpotLightsPosLocation[0], SglVec4.to3(this.spotLights[0].posViewSpace));
	gl.uniform3fv(mainShader.uSpotLightsPosLocation[1], SglVec4.to3(this.spotLights[1].posViewSpace));
	gl.uniform3fv(mainShader.uSpotLightsDirLocation[0], SglVec4.to3(this.spotLights[0].dirViewSpace));
	gl.uniform3fv(mainShader.uSpotLightsDirLocation[1], SglVec4.to3(this.spotLights[1].dirViewSpace));
	gl.uniform4fv(mainShader.uSpotLightsColorLocation[0], [0.4, 0.3, 0.0, 1.0]);
	gl.uniform4fv(mainShader.uSpotLightsColorLocation[1], [0.4, 0.3, 0.0, 1.0]);

	gl.uniform1f(mainShader.uSpotLightsCutOffLocation[0], this.spotLights[0].cutOff);
	gl.uniform1f(mainShader.uSpotLightsCutOffLocation[1], this.spotLights[1].cutOff);
	gl.uniform1f(mainShader.uSpotLightsFallOffLocation[0], this.spotLights[0].fallOff);
	gl.uniform1f(mainShader.uSpotLightsFallOffLocation[1], this.spotLights[1].fallOff);

	// areaLights
	for (var i = 0; i < this.areaLightsFrameViewSpace.length; ++i) {
		gl.uniformMatrix4fv(mainShader.uAreaLightsFrameLocation[i], false, this.areaLightsFrameViewSpace[i]);
		gl.uniform2fv(mainShader.uAreaLightsSizeLocation[i], this.areaLightsSize[i]);
		gl.uniform3fv(mainShader.uAreaLightsColorLocation[i], this.areaLightsColor[i]);
	}

	gl.uniform3fv(mainShader.uLightColorLocation, [0.9, 0.9, 0.9]);
	gl.uniformMatrix4fv(mainShader.uProjectionMatrixLocation, false, this.projectionMatrix);
	gl.uniformMatrix4fv(mainShader.uModelViewMatrixLocation, false, stack.matrix);
	gl.uniformMatrix3fv(mainShader.uViewSpaceNormalMatrixLocation, false, SglMat4.to33(this.stack.matrix));

	this.drawObject(gl, this.track, mainShader, [1,1,1, 1.0]);
	for (var i = 0; i < this.tunnels.length; ++i)
		this.drawObject(gl, this.tunnels[i], mainShader, [0.9, 0.8, 0.7, 1.0]);
	this.drawObject(gl, this.ground, mainShader, [0.3, 0.7, 0.2, 1.0]);

	var trees = this.game.race.trees;
	for (var t in trees) {
		stack.push();
		var M_8 = SglMat4.translation(trees[t].position);
		stack.multiply(M_8);
		this.drawTree(gl, mainShader);
		stack.pop();
	}

	gl.useProgram(this.uniformShader);
	gl.uniformMatrix4fv(this.uniformShader.uProjectionMatrixLocation, false, this.projectionMatrix);
	var areaLigths = this.game.race.arealigths;
	for (var al in areaLigths) {
		this.drawAreaLigth(gl, areaLigths[al]);
	}

	var streetLamps = this.streetLamps;
	for (var t in streetLamps) {
		stack.push();
		var M_8 = SglMat4.translation(streetLamps[t].position);
		stack.multiply(M_8);
		this.drawLamp(gl);
		stack.pop();
	}

	gl.useProgram(mainShader);
	gl.uniformMatrix4fv(mainShader.uModelViewMatrixLocation, false, stack.matrix);
	for (var i in this.buildings) {
		this.drawObject(gl, this.buildings[i], mainShader, [0.7, 0.8, 0.9, 1.0], [1, 1, 1, 1]);
	}

	if (this.currentCamera != 3) {
		stack.push();
		var M_9 = SglMat4.translation(pos);
		stack.multiply(M_9);

		var M_9bis = SglMat4.rotationAngleAxis(this.game.state.players.me.dynamicState.orientation, [0, 1, 0]);
		stack.multiply(M_9bis);

		this.drawCar(gl);
		stack.pop();
	}

	gl.disable(gl.DEPTH_TEST);
	if (this.currentCamera == 3) {
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		gl.useProgram(this.perVertexColorShader);
		gl.uniformMatrix4fv(this.uModelViewMatrixLocation, false, SglMat4.identity());
		gl.uniformMatrix4fv(this.uProjectionMatrixLocation, false, SglMat4.identity());
		this.drawObject(gl, this.windshield, this.perVertexColorShader);
		gl.disable(gl.BLEND);

	}

	gl.disable(gl.DEPTH_TEST);
	gl.useProgram(null);
};
/***********************************************************************/

// NVMC Client Events
/***********************************************************************/
NVMCClient.onInitialize = function () {

	var gl = this.ui.gl;
	this.cameras[2].width = this.ui.width;
	this.cameras[2].height = this.ui.height;

	/*************************************************************/
	NVMC.log("SpiderGL Version : " + SGL_VERSION_STRING + "\n");
	/*************************************************************/

	/*************************************************************/
	this.game.player.color = [1.0, 0.0, 0.0, 1.0];
	/*************************************************************/

	/*************************************************************/
	this.initMotionKeyHandlers();
	/*************************************************************/
	this.stack = new SglMatrixStack();
	this.projection_matrix = SglMat4.identity();

	/*************************************************************/
	this.initializeLights();
	this.initializeObjects(gl);
	this.initializeCameras();
	this.uniformShader = new uniformShader(gl);
	this.perVertexColorShader = new perVertexColorShader(gl);
	this.lambertianMultiLightShader = new lambertianMultiLightShader(gl, this.streetLamps.length + 1, 2, 1);
	this.lambertianSingleColorMultiLightShader = new lambertianSingleColorMultiLightShader(gl, this.streetLamps.length + 1, 2, 1);
	/*************************************************************/

	this.loadCarModel(gl);
	this.createCarTechnique(gl, this.lambertianMultiLightShader);

};
