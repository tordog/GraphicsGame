// Global NVMC Client
// ID 9.0
/***********************************************************************/
var NVMCClient = NVMCClient || {};
/***********************************************************************/
function OnScreenBillboard(pos, sx, sy, texture, texcoords) {
	this.sx = sx;						// scale width
	this.sy = sy;						// scale height
	this.pos = pos;					// position
	this.texture = texture; // texture
	var quad_geo = [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0];
	this.billboard_quad = new TexturedQuadrilateral(quad_geo, texcoords);
};

NVMCClient.initializeScreenAlignedBillboard = function (gl) {
	var textureSpeedometer 		= this.createTexture(gl, NVMC.resource_path+'textures/speedometer.png');
	var textureNeedle 				= this.createTexture(gl, NVMC.resource_path+'textures/needle2.png');
	this.billboardSpeedometer	= new OnScreenBillboard([-0.8, -0.65], 0.15, 0.15, textureSpeedometer, [0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0]);
	this.createObjectBuffers(gl, this.billboardSpeedometer.billboard_quad, false, false, true);
	this.billboardNeedle 			= new OnScreenBillboard([-0.8, -0.58], 0.09, 0.09, textureNeedle, [0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0]);
	this.createObjectBuffers(gl, this.billboardNeedle.billboard_quad);

	var textureNumbers = this.createTexture(gl, NVMC.resource_path+'textures/numbers.png');
	this.billboardDigits = [];
	for (var i = 0; i < 10; ++i) {
		this.billboardDigits[i] = new OnScreenBillboard([-0.84, -0.27], 0.05, 0.08, textureNumbers, [0.1 * i, 0.0, 0.1 * i + 0.1, 0.0, 0.1 * i + 0.1, 1.0, 0.1 * i, 1.0]);
		this.createObjectBuffers(gl, this.billboardDigits[i].billboard_quad, false, false, true);
	}
};

NVMCClient.drawSpeedometer = function (gl, ratio) {

	gl.disable(gl.DEPTH_TEST);

	gl.enable(gl.BLEND);
	gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

	gl.useProgram(this.onScreenBillboardShader);
	gl.uniformMatrix4fv(this.onScreenBillboardShader.uProjectionMatrixLocation, false, this.projectionMatrix);
	gl.uniformMatrix4fv(this.onScreenBillboardShader.uModelViewMatrixLocation, false, this.stack.matrix);

	var bb = this.billboardSpeedometer;
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, bb.texture);
	gl.uniform1i(this.onScreenBillboardShader.uTextureLocation, 0);
	var model2viewMatrix = SglMat4.mul(SglMat4.translation([bb.pos[0], bb.pos[1], 0.0, 0.0]),
		SglMat4.scaling([bb.sx, ratio * bb.sy, 1.0, 1.0]));
	gl.uniformMatrix4fv(this.onScreenBillboardShader.uQuadPosMatrixLocation, false, model2viewMatrix);
	this.drawObject(gl, bb.billboard_quad, this.onScreenBillboardShader);

	// compute speed 
	var velocity = this.game.state.players.me.dynamicState.linearVelocity;
	var speed = SglVec3.length(velocity) * 3.6;

	// update and draw needle
	bb = this.billboardNeedle;
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, bb.texture);
	gl.uniform1i(this.onScreenBillboardShader.uTextureLocation, 0);
	var rotationMatrix = SglMat4.rotationAngleAxis(sglDegToRad(140.0 - speed * 4.0), [0.0, 0.0, 1.0]);
	var pivotx = 0.0;
	var pivoty = -(132 / 256);
	var translationMat1 = SglMat4.translation([pivotx, pivoty, 0.0, 0.0]);
	var translationMat2 = SglMat4.translation([-pivotx, -pivoty, 0.0, 0.0]);

	var model2viewMatrix2 = SglMat4.mul(translationMat1, rotationMatrix);
	var model2viewMatrix22 = SglMat4.mul(model2viewMatrix2, translationMat2);
	var model2viewMatrix3 = SglMat4.mul(SglMat4.translation([bb.pos[0], bb.pos[1], 0.0, 0.0]), SglMat4.scaling([bb.sx, ratio * bb.sy, 1.0, 1.0]));
	model2viewMatrix = SglMat4.mul(model2viewMatrix3, model2viewMatrix22);
	gl.uniformMatrix4fv(this.onScreenBillboardShader.uQuadPosMatrixLocation, false, model2viewMatrix);
	this.drawObject(gl, bb.billboard_quad, this.onScreenBillboardShader);

	// update and draw numbers representing the speed (two digits)
	var tenths = Math.floor(speed / 10);

	var first_digit = Math.floor(tenths);
	var second_digit = Math.floor(speed - tenths * 10);

	bb = this.billboardDigits[first_digit];
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, bb.texture);
	gl.uniform1i(this.onScreenBillboardShader.uTextureLocation, 0);
	model2viewMatrix = SglMat4.mul(SglMat4.translation([bb.pos[0], bb.pos[1], 0.0, 0.0]),
		SglMat4.scaling([bb.sx, ratio * bb.sy, 1.0, 1.0]));
	gl.uniformMatrix4fv(this.onScreenBillboardShader.uQuadPosMatrixLocation, false, model2viewMatrix);
	this.drawObject(gl, bb.billboard_quad, this.onScreenBillboardShader);

	bb = this.billboardDigits[second_digit];
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, bb.texture);
	gl.uniform1i(this.onScreenBillboardShader.uTextureLocation, 0);
	model2viewMatrix = SglMat4.mul(SglMat4.translation([bb.pos[0] + 0.1, bb.pos[1], 0.0, 0.0]),
		SglMat4.scaling([bb.sx, ratio * bb.sy, 1.0, 1.0]));
	gl.uniformMatrix4fv(this.onScreenBillboardShader.uQuadPosMatrixLocation, false, model2viewMatrix);
	this.drawObject(gl, bb.billboard_quad, this.onScreenBillboardShader);

	gl.disable(gl.BLEND);
	gl.enable(gl.DEPTH_TEST);
};

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

	this.projectionMatrix = SglMat4.perspective(3.14 / 4, ratio, 0.1, 1000);
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

	this.drawEverything(gl);

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

	if (this.currentCamera == 0)
		this.drawSpeedometer(gl, ratio);

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
	this.showCubeMapShader = new showCubeMapShader(gl);
	this.onScreenBillboardShader = new onScreenBillboardShader(gl);

	/*************************************************************/

    this.texture_street = this.createTexture(gl, 				NVMC.resource_path+'textures/street4.png');
    this.normal_map_street = this.createTexture(gl, NVMC.resource_path+'textures/asphalt_normal_map.jpg');
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



    this.createReflectionMap(gl);

	this.loadCarModel(gl,NVMC.resource_path+"geometry/cars/eclipse/eclipse-white.obj");
	this.createTechniqueReflection(gl);

	this.rearMirrorTextureTarget = this.prepareRenderToTextureFrameBuffer(gl);
	this.prepareRenderToCubeMapFrameBuffer(gl);

	this.initializeScreenAlignedBillboard(gl);

};

/***********************************************************************/
