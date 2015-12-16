// Global NVMC Client
// ID 7.3
/***********************************************************************/
var NVMCClient = NVMCClient || {};
/***********************************************************************/

NVMCClient.cubeMap = null;
NVMCClient.skyBoxShader = null;

NVMCClient.setCubeFace = function (gl, texture, face, imgdata) {
	gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
	//
	gl.texImage2D(face, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imgdata);

	gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
}
NVMCClient.loadCubeFace = function (gl, texture, face, path) {
    NVMCClient.n_resources_to_wait_for++;
	var imgdata = new Image();
    imgdata.crossOrigin = "anonymous"; // this line is needed only in local-noserv mode (not in the book)
    var that = this;
	imgdata.onload = function () {
		that.setCubeFace(gl, texture, face, imgdata);
        NVMCClient.n_resources_to_wait_for--;
	}
	imgdata.src = path;
}
NVMCClient.createCubeMap = function (gl, posx, negx, posy, negy, posz, negz) {
	var texture = gl.createTexture();
	this.loadCubeFace(gl, texture, gl.TEXTURE_CUBE_MAP_POSITIVE_X, posx);
	this.loadCubeFace(gl, texture, gl.TEXTURE_CUBE_MAP_NEGATIVE_X, negx);
	this.loadCubeFace(gl, texture, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, posy);
	this.loadCubeFace(gl, texture, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, negy);
	this.loadCubeFace(gl, texture, gl.TEXTURE_CUBE_MAP_POSITIVE_Z, posz);
	this.loadCubeFace(gl, texture, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, negz);

	gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);

	return texture;
}

NVMCClient.drawSkyBox = function (gl) {//line 47, Listnig 7.6
    gl.useProgram(this.skyBoxShader);
    gl.uniformMatrix4fv(this.skyBoxShader.uProjectionMatrixLocation, false, this.projectionMatrix);
    var orientationOnly = this.stack.matrix;
    SglMat4.col$(orientationOnly, 3, [0.0, 0.0, 0.0, 1.0]);

    gl.uniformMatrix4fv(this.skyBoxShader.uModelViewMatrixLocation, false, orientationOnly);
    gl.uniform1i(this.skyBoxShader.uCubeMapLocation, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.cubeMap);
    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);
    this.drawObject(gl, this.cube, this.skyBoxShader);
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
}//line 64}

NVMCClient.drawEverything = function (gl) {
	var stack = this.stack;
	this.sunLightDirectionViewSpace = SglMat4.mul4(this.stack.matrix, this.sunLightDirection);
	var pos = this.game.state.players.me.dynamicState.position;

	// Setup projection matrix
	gl.useProgram(this.uniformShader);
	gl.uniformMatrix4fv(this.uniformShader.uProjectionMatrixLocation, false, this.projectionMatrix);

	gl.useProgram(this.phongShader);
	gl.uniformMatrix4fv(this.phongShader.uProjectionMatrixLocation, false, this.projectionMatrix);
	gl.uniformMatrix4fv(this.phongShader.uModelViewMatrixLocation, false, stack.matrix);
	gl.uniformMatrix3fv(this.phongShader.uViewSpaceNormalMatrixLocation, false, SglMat4.to33(this.stack.matrix));
	gl.uniform4fv(this.phongShader.uLightDirectionLocation, this.sunLightDirectionViewSpace);

	gl.uniform3fv(this.phongShader.uLightColorLocation, [0.9, 0.9, 0.9]);
	gl.uniform1f(this.phongShader.uShininessLocation, 0.2);
	gl.uniform1f(this.phongShader.uKaLocation, 0.5);
	gl.uniform1f(this.phongShader.uKdLocation, 0.5);
	gl.uniform1f(this.phongShader.uKsLocation, 1.0);

	gl.useProgram(this.lambertianSingleColorShader);
	gl.uniformMatrix4fv(this.lambertianSingleColorShader.uProjectionMatrixLocation, false, this.projectionMatrix);
	gl.uniform4fv(this.lambertianSingleColorShader.uLightDirectionLocation, this.sunLightDirectionViewSpace);
	gl.uniform3fv(this.lambertianSingleColorShader.uLightColorLocation, [1.0, 1.0, 1.0]);
	var trees = this.game.race.trees;
	for (var t in trees) {
		stack.push();
		var M_8 = SglMat4.translation(trees[t].position);
		stack.multiply(M_8);
		this.drawTree(gl, this.lambertianSingleColorShader);
		stack.pop();
	}

	gl.useProgram(this.textureShader);
	gl.uniformMatrix4fv(this.textureShader.uProjectionMatrixLocation, false, this.projectionMatrix);
	gl.uniformMatrix4fv(this.textureShader.uModelViewMatrixLocation, false, stack.matrix);
	gl.uniform1i(this.textureShader.uTextureLocation, 0);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, this.texture_street);

	this.drawObject(gl, this.track, this.textureShader, [0.9, 0.8, 0.7, 1.0], [0, 0, 0, 1.0]);

	gl.activeTexture(gl.TEXTURE0);
	gl.useProgram(this.textureShader);
	gl.uniformMatrix4fv(this.textureShader.uProjectionMatrixLocation, false, this.projectionMatrix);
	gl.uniformMatrix4fv(this.textureShader.uModelViewMatrixLocation, false, stack.matrix);

	gl.bindTexture(gl.TEXTURE_2D, this.texture_ground);
	this.drawObject(gl, this.ground, this.textureShader, [0.3, 0.7, 0.2, 1.0], [0, 0, 0, 1.0]);

  for (var i in this.buildings) {
 		gl.bindTexture(gl.TEXTURE_2D, this.texture_facade[i%this.texture_facade.length]);
		this.drawObject(gl, this.buildings[i], this.textureShader, [0.2, 0.2, 0.2, 1.0], [0, 0, 0, 1.0]);
  }

	gl.bindTexture(gl.TEXTURE_2D, this.texture_roof);
	for (var i in this.buildings) {
		this.drawObject(gl, this.buildings[i].roof, this.textureShader, [0.2, 0.2, 0.2, 1.0], [0, 0, 0, 1.0]);
	}

	if (this.currentCamera != 3) {
		gl.useProgram(this.phongShader);
		gl.uniformMatrix4fv(this.phongShader.uProjectionMatrixLocation, false, this.projectionMatrix);
		gl.uniformMatrix4fv(this.phongShader.uModelViewMatrixLocation, false, stack.matrix);
		stack.push();
		var M_9 = SglMat4.translation(pos);
		stack.multiply(M_9);

		var M_9bis = SglMat4.rotationAngleAxis(this.game.state.players.me.dynamicState.orientation, [0, 1, 0]);
		stack.multiply(M_9bis);

		this.drawCar(gl);
		stack.pop();
	}
}

NVMCClient.drawScene = function (gl) {
    if(NVMCClient.n_resources_to_wait_for>0)return;
    var width = this.ui.width;
	var height = this.ui.height
	var ratio = width / height;

	gl.viewport(0, 0, width, height);
	// Clear the framebuffer
	var stack = this.stack;
	gl.clearColor(0.4, 0.6, 0.8, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	this.projectionMatrix = SglMat4.perspective(3.14 / 4, ratio, 0.1, 1000);
	this.cameras[2].projectionMatrix = this.projectionMatrix;

	stack.loadIdentity();

	var pos = this.game.state.players.me.dynamicState.position;
	var orientation = this.game.state.players.me.dynamicState.orientation;
	this.cameras[this.currentCamera].setView(this.stack,this.myFrame());

	this.drawSkyBox(gl);

	gl.enable(gl.DEPTH_TEST);

	if (this.currentCamera == 3) {
		gl.useProgram(this.perVertexColorShader);
		gl.enable(gl.STENCIL_TEST);
		gl.clearStencil(0);
		gl.stencilMask(~0);
		gl.stencilFunc(gl.ALWAYS, 1, 0xFF);
		gl.stencilOp(gl.REPLACE, gl.REPLACE, gl.REPLACE);

		gl.uniformMatrix4fv(this.perVertexColorShader.uModelViewMatrixLocation, false, SglMat4.identity());
		gl.uniformMatrix4fv(this.perVertexColorShader.uProjectionMatrixLocation, false, SglMat4.identity());
		this.drawObject(gl, this.cabin, this.perVertexColorShader, [0.4, 0.8, 0.9, 1.0]);

		gl.stencilFunc(gl.GREATER, 1, 0xFF);
		gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
		gl.stencilMask(0);
	} else
		gl.disable(gl.STENCIL_TEST);

	this.drawEverything(gl);

	if (this.currentCamera == 3) {

		// draw the scene for the rear mirror
		this.stack.loadIdentity();
		gl.useProgram(this.lambertianSingleColorShader);
		var invPositionMatrix = SglMat4.translation(SglVec3.neg(SglVec3.add(this.game.state.players.me.dynamicState.position, [0, 1.8, 0])));
		var xMatrix = SglMat4.rotationAngleAxis(-0.2, [1, 0, 0]);
		var invOrientationMatrix = SglMat4.rotationAngleAxis(-this.game.state.players.me.dynamicState.orientation, [0, 1, 0]);
		var invV = SglMat4.mul(SglMat4.mul(xMatrix, invOrientationMatrix), invPositionMatrix);
		this.stack.multiply(invV);

		gl.bindFramebuffer(gl.FRAMEBUFFER, this.rearMirrorTextureTarget.framebuffer);
		gl.disable(gl.STENCIL_TEST);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		this.drawSkyBox(gl);
		this.drawEverything(gl);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		gl.useProgram(this.textureShader);
		gl.bindTexture(gl.TEXTURE_2D, this.rearMirrorTextureTarget.texture);
		gl.uniformMatrix4fv(this.textureShader.uModelViewMatrixLocation, false, SglMat4.identity());
		gl.uniformMatrix4fv(this.textureShader.uProjectionMatrixLocation, false, SglMat4.identity());
		this.drawObject(gl, this.rearMirror, this.textureShader, [1.0, 1.0, 1.0, 1.0], [1.0, 1.0, 1.0, 1.0]);

		gl.useProgram(this.perVertexColorShader);
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		gl.useProgram(this.perVertexColorShader);
		gl.uniformMatrix4fv(this.perVertexColorShader.uModelViewMatrixLocation, false, SglMat4.identity());
		gl.uniformMatrix4fv(this.perVertexColorShader.uProjectionLocation, false, SglMat4.identity());
		this.drawObject(gl, this.windshield, this.perVertexColorShader);
		gl.disable(gl.BLEND);
	}

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

	/*************************************************************/
	this.stack = new SglMatrixStack();
	this.projection_matrix = SglMat4.identity();

	/*************************************************************/
	this.initializeObjects(gl);
	this.initializeCameras();

	this.uniformShader = new uniformShader(gl);
	this.perVertexColorShader = new perVertexColorShader(gl);
	this.lambertianSingleColorShader = new lambertianSingleColorShader(gl);
	this.lambertianShader = new lambertianShader(gl);
	this.phongShader = new phongShader(gl);
	this.textureShader = new textureShader(gl);
	this.skyBoxShader = new skyBoxShader(gl);
	/*************************************************************/

    this.texture_street = this.createTexture(gl, 				NVMC.resource_path+'textures/street4.png');
    this.texture_ground = this.createTexture(gl, 				NVMC.resource_path+'textures/grass_tile_003_col.png');
    NVMCClient.texture_facade.push(this.createTexture(gl,       NVMC.resource_path+'textures/facade1.jpg'));
    NVMCClient.texture_facade.push(this.createTexture(gl,       NVMC.resource_path+'textures/facade2.jpg'));
    NVMCClient.texture_facade.push(this.createTexture(gl,       NVMC.resource_path+'textures/facade3.jpg'));
    NVMCClient.texture_roof = this.createTexture(gl,			NVMC.resource_path+'textures/concreteplane2k.jpg');


	this.cubeMap = this.createCubeMap(gl, 
		NVMC.resource_path+'textures/cubemap/posx.jpg',
		NVMC.resource_path+'textures/cubemap/negx.jpg',
		NVMC.resource_path+'textures/cubemap/posy.jpg',
		NVMC.resource_path+'textures/cubemap/negy.jpg',
		NVMC.resource_path+'textures/cubemap/posz.jpg',
		NVMC.resource_path+'textures/cubemap/negz.jpg'
	);

	this.loadCarModel(gl,NVMC.resource_path+"geometry/cars/eclipse/eclipse-white.obj");
	this.createCarTechnique(gl, this.lambertianShader);

	this.rearMirrorTextureTarget = this.prepareRenderToTextureFrameBuffer(gl);

};

/***********************************************************************/
