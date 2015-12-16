// Global NVMC Client
// ID 10.0
/***********************************************************************/
var NVMCClient = NVMCClient || {};
/***********************************************************************/

NVMCClient.depth_of_field_enabled = false;
NVMCClient.firstPassTextureTarget = null;
NVMCClient.depthOfFieldShader = null;
NVMCClient.texture_facade = [];
NVMCClient.drawDepthOnly = function (gl) {
	var pos = this.game.state.players.me.dynamicState.position;

	for (var i in this.buildings) {
		this.drawObject(gl, this.buildings[i], this.shadowMapCreateShader);
	}
	for (var i in this.buildings) {
		this.drawObject(gl, this.buildings[i].roof, this.shadowMapCreateShader);
	}

	this.drawObject(gl, this.ground, this.shadowMapCreateShader);

	var trees = this.game.race.trees;
	for (var t in trees) {
		this.stack.push();
		var M_8 = SglMat4.translation(trees[t].position);
		this.stack.multiply(M_8);
		this.drawTreeDepthOnly(gl, this.shadowMapCreateShader);
		this.stack.pop();
	}

	var M_9 = SglMat4.translation(pos);
	this.stack.multiply(M_9);

	var M_9bis = SglMat4.rotationAngleAxis(this.game.state.players.me.dynamicState.orientation, [0, 1, 0]);
	this.stack.multiply(M_9bis);

	this.drawCarDepthOnly(gl);
};

NVMCClient.drawCar = function (gl, framebuffer){
	if (!this.sgl_car_model) return;
	var fb;
	if (framebuffer) fb = new SglFramebuffer(gl, {handle: framebuffer,autoViewport: false});
 	this.sgl_renderer.begin();

  if (framebuffer) this.sgl_renderer.setFramebuffer(fb);

	 	this.sgl_renderer.setTechnique(this.sgl_technique);
  	this.sgl_renderer.setGlobals({
 				"PROJECTION_MATRIX":this.projectionMatrix,
				"WORLD_VIEW_MATRIX":this.stack.matrix,
				"VIEW_SPACE_NORMAL_MATRIX" : SglMat4.to33(this.stack.matrix) ,
				"CUBE_MAP"            : 2,
				"VIEW_TO_WORLD_MATRIX": this.viewFrame,
				"LIGHTS_GEOMETRY":		this.sunLightDirectionViewSpace,
				"LIGHT_COLOR":	[0.9,0.9,0.9],
				"AMBIENT": [0.3,0.3,0.3]
		});
   
   	this.sgl_renderer.setPrimitiveMode("FILL");
   	
  	this.sgl_renderer.setModel(this.sgl_car_model);
 	this.sgl_renderer.setTexture(2,new SglTextureCubeMap(gl,this.reflectionMap));
	this.sgl_renderer.renderModel();
	this.sgl_renderer.end();
};

NVMCClient.drawEverything = function (gl, excludeCar, framebuffer) {
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

	gl.useProgram(this.textureNormalMapShader);
	gl.uniformMatrix4fv(this.textureNormalMapShader.uProjectionMatrixLocation, false, this.projectionMatrix);
	gl.uniformMatrix4fv(this.textureNormalMapShader.uModelViewMatrixLocation, false, stack.matrix);
	gl.uniform1i(this.textureNormalMapShader.uTextureLocation, 0);
	gl.uniform1i(this.textureNormalMapShader.uNormalMapLocation, 1);
	gl.uniform4fv(this.textureNormalMapShader.uLightDirectionLocation, this.sunLightDirection);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, this.texture_street);
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, this.normal_map_street);
	this.drawObject(gl, this.track, this.textureNormalMapShader, [0.9, 0.8, 0.7, 1.0]);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, this.texture_ground);
	gl.useProgram(this.textureShader);
	gl.uniformMatrix4fv(this.textureShader.uProjectionMatrixLocation, false, this.projectionMatrix);
	gl.uniformMatrix4fv(this.textureShader.uModelViewMatrixLocation, false, stack.matrix);
	gl.uniform1i(this.textureShader.uTextureLocation, 0);
	this.drawObject(gl, this.ground, this.textureShader, [0.3, 0.7, 0.2, 1.0], [0, 0, 0, 1.0]);

	for (var i in this.buildings) {
		gl.bindTexture(gl.TEXTURE_2D, this.texture_facade[i%this.texture_facade.length]);
		this.drawObject(gl, this.buildings[i], this.textureShader, [0.2, 0.2, 0.2, 1.0], [0, 0, 0, 1.0]);
	}

	gl.bindTexture(gl.TEXTURE_2D, this.texture_roof);
	for (var i in this.buildings) {
		this.drawObject(gl, this.buildings[i].roof, this.textureShader, [0.2, 0.2, 0.2, 1.0], [0, 0, 0, 1.0]);
	}

	if (!excludeCar && this.currentCamera != 3) {
		stack.push();
		var M_9 = SglMat4.translation(pos);
		stack.multiply(M_9);

		var M_9bis = SglMat4.rotationAngleAxis(this.game.state.players.me.dynamicState.orientation, [0, 1, 0]);
		stack.multiply(M_9bis);

		this.drawCar(gl, framebuffer);
		stack.pop();
	}
	this.drawTrees(gl, framebuffer);
}

NVMCClient.drawScene = function (gl) {
    if(NVMCClient.n_resources_to_wait_for>0)return;
    var width = this.ui.width;
	var height = this.ui.height
	var ratio = width / height;

	this.drawOnReflectionMap(gl, SglVec3.add(this.game.state.players.me.dynamicState.position, [0.0, 1.5, 0.0]));
	gl.viewport(0, 0, width, height);

	// Clear the framebuffer
	var stack = this.stack;
	gl.clearColor(0.4, 0.6, 0.8, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	var near = 0.1;
	var far = 1000.0;
	this.projectionMatrix = SglMat4.perspective(3.14 / 4, ratio, near, far);
	this.cameras[2].projectionMatrix = this.projectionMatrix;

	stack.loadIdentity();
	var pos = this.game.state.players.me.dynamicState.position;
	var orientation = this.game.state.players.me.dynamicState.orientation;
	this.cameras[this.currentCamera].setView(this.stack, this.myFrame());
	this.viewFrame = SglMat4.inverse(this.stack.matrix);
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

	if (this.depth_of_field_enabled) {
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowMapTextureTarget.framebuffer);
	
		this.shadowMatrix = SglMat4.mul(this.projectionMatrix, this.stack.matrix);
		this.stack.push();
		this.stack.load(this.shadowMatrix);

		gl.clearColor(1.0, 1.0, 1.0, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.viewport(0, 0, this.shadowMapTextureTarget.framebuffer.width, this.shadowMapTextureTarget.framebuffer.height);
		gl.useProgram(this.shadowMapCreateShader);
		gl.uniformMatrix4fv(this.shadowMapCreateShader.uShadowMatrixLocation, false, this.stack.matrix);
		this.drawDepthOnly(gl); 
		this.stack.pop();

		gl.bindFramebuffer(gl.FRAMEBUFFER, this.firstPassTextureTarget.framebuffer);
		gl.clearColor(1.0, 1.0, 1.0, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.viewport(0, 0, this.firstPassTextureTarget.framebuffer.width, this.firstPassTextureTarget.framebuffer.height);
		this.drawSkyBox(gl);
		this.drawEverything(gl, false, this.firstPassTextureTarget.framebuffer);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		gl.viewport(0, 0, width, height);
		gl.disable(gl.DEPTH_TEST);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.firstPassTextureTarget.texture);
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, this.shadowMapTextureTarget.texture);

		gl.useProgram(this.depthOfFieldShader);
		gl.uniform1i(this.depthOfFieldShader.uTextureLocation, 0);
		gl.uniform1i(this.depthOfFieldShader.uDepthTextureLocation, 1);
		var dof = [1.0, 16.0];
		var A = (far + near) / (far - near);
		var B = 2 * far * near / (far - near);
		gl.uniform2fv(this.depthOfFieldShader.uDofLocation, dof);
		gl.uniform1f(this.depthOfFieldShader.uALocation, A);
		gl.uniform1f(this.depthOfFieldShader.uBLocation, B);

		var pxs = [1.0 / this.firstPassTextureTarget.framebuffer.width, 1.0 / 		this.firstPassTextureTarget.framebuffer.width];
		gl.uniform2fv(this.depthOfFieldShader.uPxsLocation, pxs);

		this.drawObject(gl, this.quad, this.depthOfFieldShader);
		gl.enable(gl.DEPTH_TEST);
	}
		else
	this.drawEverything(gl, false);

	if (this.currentCamera == 3) {

		// draw the scene for the back mirror
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
	this.phongShader = new phongShader(gl);
	this.textureShader = new textureShader(gl);
	this.textureNormalMapShader = new textureNormalMapShader(gl);
	this.skyBoxShader = new skyBoxShader(gl);
	this.reflectionMapShader = new reflectionMapShader(gl);
	this.lambertianSingleColorShader 	= new lambertianSingleColorShader(gl);
	this.showCubeMapShader = new showCubeMapShader(gl);
	this.billboardShader = new billboardShader(gl);
	this.shadowMapCreateShader = new shadowMapCreateShader(gl);
	this.depthOfFieldShader = new depthOfFieldShader(gl, 7);
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

	this.normal_map_street = this.createTexture(gl, NVMC.resource_path+'textures/asphalt_normal_map.jpg');

	this.createReflectionMap(gl);
	this.loadCarModel(gl);
	this.createTechniqueReflection(gl);
	this.createDepthOnlyTechnique(gl);

	this.loadBillboardCloud(gl);

	this.firstPassTextureTarget = this.prepareRenderToTextureFrameBuffer(gl, false, 1024, 1024);
	this.rearMirrorTextureTarget = this.prepareRenderToTextureFrameBuffer(gl);
	this.prepareRenderToCubeMapFrameBuffer(gl);
	this.shadowMapTextureTarget = this.prepareRenderToTextureFrameBuffer(gl, false, 1024, 1024);

	this.createFullScreenQuad(gl);
};

NVMCClient.onKeyUp = function (keyCode, event) {
	if (keyCode == "2") {
		this.nextCamera();
		return;
	}
	if (keyCode == "1") {
		this.prevCamera();
		return;
	}
	if (keyCode == "3") {
		this.depth_of_field_enabled = !this.depth_of_field_enabled;
		return;
	}

	if (this.carMotionKey[keyCode])
		this.carMotionKey[keyCode](false);

	this.cameras[this.currentCamera].keyUp(keyCode);
};
