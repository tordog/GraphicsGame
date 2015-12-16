// Global NVMC Client
// ID 10.2

/***********************************************************************/
var NVMCClient = NVMCClient || {};
/***********************************************************************/
function PanCamera() {
	this.position 				= [0.0,0.0,0.0];
	this.keyDown 					= function (keyCode) {}
	this.keyUp						= function (keyCode) {}
	this.mouseMove				= function (event) {};
	this.mouseButtonDown	= function (event) {};
	this.mouseButtonUp 		= function () {}
	this.setView 					= function ( stack, F_0) {
		var Rx = SglMat4.rotationAngleAxis(sglDegToRad(-90), [0.0, 1.0, 0.0]);
		var T = SglMat4.translation([-6.0, 1.0, 0.0]);
		var Vc_0 = SglMat4.mul(T, Rx);
		var V_0 = SglMat4.mul(F_0, Vc_0);
		this.position = SglMat4.col(V_0,3);
		var invV = SglMat4.inverse(V_0);
		stack.multiply(invV);
	};
};

NVMCClient.cameras[4] = new PanCamera();
NVMCClient.n_cameras = 5;


NVMCClient.velocityBufferTextureTarget = null;
NVMCClient.motionblur_enabled = false;

NVMCClient.drawObjectVelocity = function (gl, obj) {
	// Draw the primitive
	if(!obj.previous_transform)	
		obj.previous_transform = SglMat4.identity()
	gl.useProgram(this.velocityVectorShader);
	gl.uniformMatrix4fv(this.velocityVectorShader.uPreviousModelViewMatrixLocation,false,obj.previous_transform);
	gl.uniformMatrix4fv(this.velocityVectorShader.uModelViewMatrixLocation,false,this.stack.matrix);
	gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
	gl.enableVertexAttribArray(this.velocityVectorShader.aPositionIndex);
	gl.vertexAttribPointer(this.velocityVectorShader.aPositionIndex, 3, gl.FLOAT, false, 0, 0);
	gl.enable(gl.POLYGON_OFFSET_FILL);

	gl.polygonOffset(1.0, 1.0);
		
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferTriangles);
	gl.drawElements(gl.TRIANGLES, obj.triangleIndices.length, gl.UNSIGNED_SHORT, 0);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	obj.previous_transform = this.stack.matrix;
 };




NVMCClient.drawTreeVelocity = function (gl,previous_transform){

	var fb = new SglFramebuffer(gl, {handle: this.velocityBufferTextureTarget.framebuffer,autoViewport:false});

  	this.velocityRenderer.begin();
     	this.velocityRenderer.setFramebuffer(fb);  

	this.velocityRenderer.setTechnique(this.techniqueVelocity);

 
	this.velocityRenderer.setGlobals({
	"PROJECTION_MATRIX": this.projectionMatrix,
	"WORLD_VIEW_MATRIX": this.stack.matrix,
	"PREV_WORLD_VIEW_MATRIX": 	previous_transform,
	});

	this.velocityRenderer.setPrimitiveMode("FILL");
	this.velocityRenderer.setModel(this.billboardCloudTree);
	this.velocityRenderer.renderModel();
	this.velocityRenderer.end();
};

NVMCClient.drawCarVelocity = function (gl){
	if(!this.sgl_car_model.previous_transform)
		this.sgl_car_model.previous_transform = SglMat4.identity();
 	var fb = new SglFramebuffer(gl, {handle: this.velocityBufferTextureTarget.framebuffer,autoViewport:false});

  	this.velocityRenderer.begin();
    	this.velocityRenderer.setFramebuffer(fb);  
   	this.velocityRenderer.setTechnique(this.techniqueVelocity);
   
	 
    	this.velocityRenderer.setGlobals({
   					"PROJECTION_MATRIX":this.projectionMatrix,
					"WORLD_VIEW_MATRIX":this.stack.matrix,
					"PREV_WORLD_VIEW_MATRIX":this.sgl_car_model.previous_transform
		});
   
   	this.velocityRenderer.setPrimitiveMode("FILL");
   	
  	this.velocityRenderer.setModel(this.sgl_car_model);
	this.velocityRenderer.renderModel();
	this.velocityRenderer.end();
	this.sgl_car_model.previous_transform = this.stack.matrix;
};

NVMCClient.drawTreesVelocity = function (gl){
	var ma = this.stack.matrix;
	var pos  = this.cameras[this.currentCamera].position;	
	var bbt = this.billboardCloudTree;
	var trees = this.game.race.trees;
	for(var i in trees){ 
		var tpos = trees[ i].position;
		this.stack.push();
	 	this.stack.multiply(SglMat4.translation(tpos));
		this.drawTreeVelocity(gl,trees[i].previous_transform);
		trees[i].previous_transform =this.stack.matrix;
		this.stack.pop();
	}
};

	


NVMCClient.drawEverythingVelocity = function (gl,excludeCar) {
	var stack  = this.stack;
	this.sunLightDirectionViewSpace = SglMat4.mul4(this.stack.matrix,this.sunLightDirection);
	var pos  = this.game.state.players.me.dynamicState.position;	
	 
	for (var i in this.buildings){this.drawObjectVelocity(gl, this.buildings[i]);}
 	for (var i in this.buildings){this.drawObjectVelocity(gl, this.buildings[i].roof);}
	this.drawObjectVelocity(gl, this.track);
	this.drawObjectVelocity(gl, this.ground);

 	this.drawTreesVelocity(gl);
 	if( !excludeCar &&  this.currentCamera!=3 ){
 		stack.push();
			var M_9 = SglMat4.translation(pos);
			stack.multiply(M_9);

			var M_9bis = SglMat4.rotationAngleAxis(this.game.state.players.me.dynamicState.orientation, [0, 1, 0]);
			stack.multiply(M_9bis);

			this.drawCarVelocity(gl);
		stack.pop();		
	}	

}
 
NVMCClient.createVelocityTechnique = function (gl){
	this.velocityRenderer = new SglModelRenderer(gl);
	this.techniqueVelocity = new SglTechnique( gl,
		{	vertexShader	:this.velocityVectorShader.vertex_shader, 
			fragmentShader	:this.velocityVectorShader.fragment_shader,
			vertexStreams 		: 
			{
				"a_position"		: [ 0.0,0.0,0.0],
			},
			globals : {
				"uProjectionMatrix" : { semantic : "PROJECTION_MATRIX", value : this.projectionMatrix },
				"uModelViewMatrix":{semantic:"WORLD_VIEW_MATRIX",value : this.stack.matrix },
				"uPreviousModelViewMatrix"     : { semantic : "PREV_WORLD_VIEW_MATRIX", value: this.stack.matrix },
			}
		});

};
 

NVMCClient.drawScene = function (gl) {
    if(NVMCClient.n_resources_to_wait_for>0)return;
	var width  = this.ui.width;
	var height = this.ui.height
	var ratio  = width / height;
	
	 
	this.drawOnReflectionMap(gl,SglVec3.add(this.game.state.players.me.dynamicState.position,[0.0,1.5,0.0]));
		 
	gl.viewport(0, 0, width, height);

	// Clear the framebuffer
	var stack  = this.stack;
	gl.clearColor(0.4, 0.6, 0.8, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	 
	var near = 0.1;
	var far = 1000.0;
	this.projectionMatrix = SglMat4.perspective(3.14/4,ratio,near,far);
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

	if(this.motionblur_enabled){
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.velocityBufferTextureTarget.framebuffer);

		this.stack.push();

		gl.clearColor(0.5, 0.5, 0.0, 1.0);
	 	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.useProgram(this.velocityVectorShader);
		gl.uniformMatrix4fv(this.velocityVectorShader.uProjectionMatrixLocation,false,this.projectionMatrix);
		gl.viewport(0,0,this.velocityBufferTextureTarget.framebuffer.width,this.velocityBufferTextureTarget.framebuffer.height);
		this.drawEverythingVelocity(gl);

		gl.bindFramebuffer(gl.FRAMEBUFFER,null);
		this.stack.pop();		
	}
	gl.viewport(0, 0, width, height);
	if(this.motionblur_enabled){
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.firstPassTextureTarget.framebuffer);
		gl.clearColor(1.0, 1.0, 1.0, 1.0);
	 	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.viewport(0,0,this.firstPassTextureTarget.framebuffer.width,this.firstPassTextureTarget.framebuffer.height);
 		this.drawSkyBox(gl);
		this.drawEverything(gl,false,this.firstPassTextureTarget.framebuffer);
		gl.viewport(0, 0, width, height);
	}
	this.drawEverything(gl,false);

	if(this.motionblur_enabled){
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	}
	 
	if(this.motionblur_enabled){
		gl.disable(gl.DEPTH_TEST);
		gl.activeTexture(gl.TEXTURE0);
	  	gl.bindTexture(gl.TEXTURE_2D,this.firstPassTextureTarget.texture);
		gl.activeTexture(gl.TEXTURE1);
	  	gl.bindTexture(gl.TEXTURE_2D,this.velocityBufferTextureTarget.texture);

		gl.useProgram(this.motionBlurShader);
		gl.uniform1i(this.motionBlurShader.uTextureLocation, 0);
		gl.uniform1i(this.motionBlurShader.uVelocityTextureLocation,1);
	
		var pxs = [1.0/this.velocityBufferTextureTarget.framebuffer.width,1.0/this.velocityBufferTextureTarget.framebuffer.width];
		gl.uniform2fv(this.motionBlurShader.uPxsLocation,pxs);

		this.drawObject(gl,this.quad ,this.motionBlurShader,[0.3, 0.7, 0.2,1.0], [0, 0, 0,1.0]);
		gl.enable(gl.DEPTH_TEST);
	return;
	}
	
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
	
};
/***********************************************************************/



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
	
	var trees = this.game.race.trees;
	for(var i in trees){ trees[i].previous_transform = SglMat4.identity();}

	/*************************************************************/
	this.initializeObjects(gl);
	this.initializeCameras();

	this.uniformShader 			= new uniformShader(gl);
	this.perVertexColorShader 		= new perVertexColorShader(gl);
	this.lambertianSingleColorShader 	= new lambertianSingleColorShader(gl);
	this.phongShader 			= new phongShader(gl);
	this.textureShader 			= new textureShader(gl);
	this.textureNormalMapShader 		= new textureNormalMapShader(gl);
	this.skyBoxShader 			= new skyBoxShader(gl);
	this.reflectionMapShader 		= new reflectionMapShader(gl);
	this.showCubeMapShader	= new showCubeMapShader(gl);
	this.billboardShader 			= new billboardShader(gl);
	this.shadowMapCreateShader		= new shadowMapCreateShader(gl);
	this.depthOfFieldShader		= new depthOfFieldShader(gl, 7);
	this.velocityVectorShader			= new velocityVectorShader(gl);
	this.motionBlurShader			= new motionBlurShader(gl);
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
    );;

	this.normal_map_street = this.createTexture(gl, NVMC.resource_path+'textures/asphalt_normal_map.jpg');


	this.createReflectionMap(gl);
 	this.loadCarModel(gl);
	this.createTechniqueReflection(gl);	
	this.createDepthOnlyTechnique(gl);
	this.createVelocityTechnique(gl);

	this.loadBillboardCloud(gl);

	this.velocityBufferTextureTarget = this.prepareRenderToTextureFrameBuffer(gl,false,1024,1024);
	this.firstPassTextureTarget = this.prepareRenderToTextureFrameBuffer(gl,false,1024,1024);
	this.rearMirrorTextureTarget = this.prepareRenderToTextureFrameBuffer(gl);
	this.prepareRenderToCubeMapFrameBuffer(gl);
	this.velocityBufferTextureTarget = this.prepareRenderToTextureFrameBuffer(gl,false,1024,1024);

	this.createFullScreenQuad(gl);
};

NVMCClient.onKeyUp = function (keyCode, event) {
	if( keyCode == "2"){ this.nextCamera(); return;}
	if( keyCode == "1"){ this.prevCamera(); return;}		
	if( keyCode == "3"){ this.motionblur_enabled = !this.motionblur_enabled;return;}		
	
	if(this.carMotionKey[keyCode])
		this.carMotionKey[keyCode](false);
	
	this.cameras[this.currentCamera].keyUp(keyCode) ;
};
	

