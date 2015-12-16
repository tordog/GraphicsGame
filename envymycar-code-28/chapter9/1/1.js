// Global NVMC Client
// ID 9.1

/***********************************************************************/
var NVMCClient = NVMCClient || {};
/***********************************************************************/
 
function OnScreenBillboard(gl,pos,s,texture){
	this.s = s;
	this.pos = pos;
	this.texture = texture;
};

function LensFlares(gl){
	this.billboards = [];
	this.lightSourcePos = [];
};
 
 
NVMCClient.createLensFlares = function (gl){
	var quad_geo 	= 	[-1,-1,0,1,-1,0,1,1,0,-1,1,0];
	var text_coords = 	[ 0.0,0.0, 1.0,0.0, 1.0,1.0, 0.0,1.0];
	this.billboard_quad = new TexturedQuadrilateral(quad_geo,text_coords);
	this.createObjectBuffers(gl, this.billboard_quad,false,false,true);

	var main_flare_texture  = this.createTexture(gl,NVMC.resource_path+'textures/starbust.png');




	var main_flare_texture      = this.createTexture(gl,NVMC.resource_path+'textures/SunGlowRainbow.png');
	var flare_texture 			= this.createTexture(gl,NVMC.resource_path+'textures/Glow.png');
	var flare_texture2 			= this.createTexture(gl,NVMC.resource_path+'textures/FlareHexagon1.png');
	var flare_texture3 			= this.createTexture(gl,NVMC.resource_path+'textures/FlareHexagon1.png');


	this.lens_flares = new  LensFlares(gl);

	this.lens_flares.billboards.push(new OnScreenBillboard(gl,1.0,0.4,main_flare_texture));
	this.lens_flares.billboards.push(new OnScreenBillboard(gl,0.5,0.3,flare_texture));
	this.lens_flares.billboards.push(new OnScreenBillboard(gl,0.1,0.2,flare_texture2));
	this.lens_flares.billboards.push(new OnScreenBillboard(gl,-0.35,0.3,flare_texture3));
	this.lens_flares.billboards.push(new OnScreenBillboard(gl,0.08,0.8,flare_texture2));
	this.lens_flares.billboards.push(new OnScreenBillboard(gl,-0.04,0.65,flare_texture3));
	this.lens_flares.billboards.push(new OnScreenBillboard(gl,-0.51,0.4,flare_texture2));
	this.lens_flares.billboards.push(new OnScreenBillboard(gl,-0.51,0.6,flare_texture));
};
 
 
NVMCClient.drawLensFlares = function (gl,ratio) { 
	gl.disable(gl.DEPTH_TEST);
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.ONE,gl.ONE);
	gl.useProgram(this.flaresShader);
	gl.uniformMatrix4fv(this.flaresShader.uProjectionMatrixLocation, false, this.projectionMatrix);
	gl.uniformMatrix4fv(this.flaresShader.uModelViewMatrixLocation, false, this.stack.matrix);
	gl.uniform4fv(this.flaresShader.uLightPositionLocation,  this.sunpos);

 
	for(var bi in this.lens_flares.billboards){
			var bb = this.lens_flares.billboards[bi];
			gl.activeTexture(gl.TEXTURE0);
		 	gl.bindTexture(gl.TEXTURE_2D,this.shadowMapTextureTarget.texture);
			gl.uniform1i(this.flaresShader.uDepthLocation,0);
			gl.activeTexture(gl.TEXTURE1);
		 	gl.bindTexture(gl.TEXTURE_2D,this.lens_flares.billboards[bi].texture);
			gl.uniform1i(this.flaresShader.uTextureLocation,1);
			var pos = SglVec2.muls(this.lens_flares.lightSourcePos,bb.pos);
			var model2viewMatrix = SglMat4.mul(SglMat4.translation([ pos[0], pos[1],0.0,0.0]),	
				SglMat4.scaling([bb.s,ratio*bb.s,1.0,1.0]));
		 	gl.uniformMatrix4fv(this.flaresShader.uQuadPosMatrixLocation, false, model2viewMatrix);
			this.drawObject(gl, this.billboard_quad,this.flaresShader);
		}
	gl.disable(gl.BLEND);
	gl.enable(gl.DEPTH_TEST);
};
 

NVMCClient.drawScene = function (gl) {
    if(NVMCClient.n_resources_to_wait_for>0)return;
	var width  = this.ui.width;
	var height = this.ui.height
	var ratio  = width / height;
	
	// compute the shadow matrix
	var bbox =  this.game.race.bbox 
		

//	var sl3 = SglVec3.normalize([0.6279479759792294,-0.569837487007564,0.5300628055848606]);
//	this.sunLightDirection[0] =  sl3[0];
//	this.sunLightDirection[1] =  sl3[1];
//	this.sunLightDirection[2] =  sl3[2];
	this.sunpos = SglVec3.to4(SglVec3.muls(this.sunLightDirection,-300));
	
	var eye = SglVec3.muls(this.sunLightDirection,-0.0);
	var target = SglVec3.add(eye,	this.sunLightDirection);
	var mview = SglMat4.lookAt(eye,target, [0,1,0]);

	 
	var newbbox = this.findMinimumViewWindow(bbox,mview);
	var proj = SglMat4.ortho([ newbbox[0],newbbox[1],-newbbox[5] ], [ newbbox[3], newbbox[4],-newbbox[2] ] );

	this.shadowMatrix = SglMat4.mul(proj,mview);

	this.drawOnReflectionMap(gl,SglVec3.add(this.game.state.players.me.dynamicState.position,[0.0,1.5,0.0]));
		 
	gl.viewport(0, 0, width, height);

	// Clear the framebuffer
	var stack  = this.stack;
	gl.clearColor(0.4, 0.6, 0.8, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	 

	this.projectionMatrix = SglMat4.perspective(3.14/4,ratio,0.1,300);
	this.cameras[2].projectionMatrix = this.projectionMatrix;

	stack.loadIdentity();
	var pos  = this.game.state.players.me.dynamicState.position;
	var orientation  = this.game.state.players.me.dynamicState.orientation;
	this.cameras[this.currentCamera].setView(this.stack,this.myFrame());

	this.viewFrame = SglMat4.inverse(this.stack.matrix);
	this.drawSkyBox(gl);
	 
	gl.enable(gl.DEPTH_TEST);
	

 	if( this.currentCamera==3 ){
	 		gl.useProgram(this.perVertexColorShader);
			gl.enable(gl.STENCIL_TEST);
			gl.clearStencil(0);
			gl.stencilMask(~0);
			gl.stencilFunc(gl.ALWAYS,1,0xFF);
			gl.stencilOp(gl.REPLACE,gl.REPLACE,gl.REPLACE);
		
			gl.uniformMatrix4fv(this.perVertexColorShader.uModelViewMatrixLocation, false, SglMat4.identity());
			gl.uniformMatrix4fv(this.perVertexColorShader.uProjectionMatrixLocation, false, SglMat4.identity());
			this.drawObject(gl, this.cabin,this.perVertexColorShader, [0.4, 0.8, 0.9,1.0]);
		
			gl.stencilFunc(gl.GREATER,1,0xFF);
			gl.stencilOp(gl.KEEP,gl.KEEP,gl.KEEP);
			gl.stencilMask(0);
	}else
		gl.disable(gl.STENCIL_TEST);
	

	// set view for creating the shadow map
	this.stack.push();
	this.stack.loadIdentity();
	this.stack.multiply(this.shadowMatrix);

	gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowMapTextureTarget.framebuffer);
	gl.clearColor(1.0, 1.0, 1.0, 1.0);
 	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.viewport(0,0,this.shadowMapTextureTarget.framebuffer.width,this.shadowMapTextureTarget.framebuffer.height);
	gl.useProgram(this.shadowMapCreateShader);
	gl.uniformMatrix4fv(this.shadowMapCreateShader.uShadowMatrixLocation, false, this.stack.matrix);

	this.drawShadowCastersDepthOnly(gl);// that is,draw everything with shadowMapCreateShader

	gl.bindFramebuffer(gl.FRAMEBUFFER,null);
	this.stack.pop();

	gl.viewport(0, 0, width, height);
	this.drawEverything(gl);


	// make the shadowmap from the point of view
	this.stack.push();
	var shadowMatrix =  SglMat4.mul(this.projectionMatrix,this.stack.matrix);
	this.stack.loadIdentity();
	this.stack.multiply(shadowMatrix);

	gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowMapTextureTarget.framebuffer);
	gl.clearColor(1.0, 1.0, 1.0, 1.0);
 	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.viewport(0,0,this.shadowMapTextureTarget.framebuffer.width,this.shadowMapTextureTarget.framebuffer.height);
	gl.useProgram(this.shadowMapCreateShader);
	gl.uniformMatrix4fv(this.shadowMapCreateShader.uShadowMatrixLocation, false, this.stack.matrix);

	this.drawShadowCastersDepthOnly(gl);// that is,draw everything with shadowMapCreateShader

	gl.bindFramebuffer(gl.FRAMEBUFFER,null);
	this.stack.pop();
	gl.viewport(0, 0, width, height);

	var posH = SglMat4.mul4( SglMat4.mul(this.projectionMatrix,this.stack.matrix),this.sunpos);
	this.lens_flares.lightSourcePos = [posH[0]/posH[3],posH[1]/posH[3],posH[2]/posH[3]];
 

 	this.drawLensFlares(gl,ratio);

	if( this.currentCamera==3 ){
		
		// draw the scene for the back mirror
		this.stack.loadIdentity();
		gl.useProgram(this.lambertianSingleColorShader);
		var invPositionMatrix 	= SglMat4.translation		(SglVec3.neg(SglVec3.add(this.game.state.players.me.dynamicState.position,[0,1.8,0])));
		var xMatrix 	= SglMat4.rotationAngleAxis	(-0.2, [1, 0, 0]);
		var invOrientationMatrix 	= SglMat4.rotationAngleAxis	(-this.game.state.players.me.dynamicState.orientation, [0, 1, 0]);
		var invV = SglMat4.mul(SglMat4.mul(xMatrix,invOrientationMatrix),invPositionMatrix);
		this.stack.multiply(invV);
		
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.rearMirrorTextureTarget.framebuffer);
		gl.disable(gl.STENCIL_TEST);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		this.drawSkyBox(gl);
		this.drawEverything(gl);
		gl.bindFramebuffer(gl.FRAMEBUFFER,  null);
		
	 
		gl.useProgram(this.textureShader);
		gl.bindTexture(gl.TEXTURE_2D,this.rearMirrorTextureTarget.texture);
		gl.uniformMatrix4fv(this.textureShader.uModelViewMatrixLocation, false, SglMat4.identity());
		gl.uniformMatrix4fv(this.textureShader.uProjectionMatrixLocation, false, SglMat4.identity());
		this.drawObject( gl, this.rearMirror, this.textureShader,[1.0,1.0,1.0,1.0],[1.0,1.0,1.0,1.0]);
		
		gl.useProgram(this.perVertexColorShader);
		gl.enable(gl.BLEND);
		gl.blendFunc( gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
		gl.useProgram(this.perVertexColorShader);
		gl.uniformMatrix4fv(this.perVertexColorShader.uModelViewMatrixLocation, false, SglMat4.identity());
		gl.uniformMatrix4fv(this.perVertexColorShader.uProjectionLocation, false, SglMat4.identity());
		this.drawObject(gl, this.windshield, this.perVertexColorShader);
		gl.disable(gl.BLEND);
	}  
	if(this.screenshot){
		var url=this.ui._canvas.toDataURL();
		window.open(url,'new_tab');
		this.screenshot = false;
	}
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
	
	/*************************************************************/
	this.stack 			= new SglMatrixStack();
	this.projection_matrix 	=  SglMat4.identity();
	enlargeBBox(this.game.race.bbox,0.01);
	/*************************************************************/
	this.initializeObjects(gl);
	this.createFullScreenQuad(gl);
	this.initializeCameras();

	this.uniformShader 			            = new uniformShader(gl);
	this.perVertexColorShader 	            = new perVertexColorShader(gl);
	this.lambertianSingleColorShader 	    = new lambertianSingleColorShader(gl);
	this.phongShader 			            = new phongShader(gl);
	this.textureShader 			            = new textureShader(gl);
	this.skyBoxShader 			            = new skyBoxShader(gl);
	this.showCubeMapShader			        = new showCubeMapShader(gl);
	this.shadowMapCreateShader		        = new shadowMapCreateShader(gl);
	this.shadowMapShader			        = new shadowMapShader(gl);
	this.textureShadowShader		        = new texturePCFShadowShader(gl);
	this.textureNormalMapShadowShader 	    = new textureNormalMapShadowShader(gl);
	this.reflectionMapShader 		    = new reflectionMapShader(gl);
	this.reflectionMapShadowShader 	        = new reflectionMapPCFShadowShader(gl);
	this.lambertianSingleColorShadowShader  = new lambertianSingleColorPCFShadowShader(gl);
	this.flaresShader 			            = new flaresShader(gl);
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
	
 
	this.createReflectionMap(gl);
	this.createLensFlares(gl);
	this.loadCarModel(gl,NVMC.resource_path+"geometry/cars/eclipse/eclipse-white.obj");
	this.createTechniqueReflection(gl);
	this.createDepthOnlyTechnique(gl);

	this.rearMirrorTextureTarget = this.prepareRenderToTextureFrameBuffer(gl);
	this.shadowMapTextureTarget = this.prepareRenderToTextureFrameBuffer(gl,false,4096,4096);
	this.prepareRenderToCubeMapFrameBuffer(gl);

    this.sunLightDirection = SglVec3.to4(SglVec3.normalize([0.6279479759792294,-0.569837487007564,0.5300628055848606]),0.0);

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

	if (keyCode == "4") {
		this.screenshot = true;
		return;
	}

	if (keyCode == "5") {
		this.sunLightDirection[1]+=0.05;
		return;
	}
	if (keyCode == "6") {
		this.sunLightDirection[1]-=0.05;
		return;
	}

	if (keyCode == "7") {
		this.sunLightDirection[2]+=0.05;
		return;
	}
	if (keyCode == "8") {
		this.sunLightDirection[2]-=0.05;
		return;
	}

	if (this.carMotionKey[keyCode])
		this.carMotionKey[keyCode](false);

	this.cameras[this.currentCamera].keyUp(keyCode);
};
