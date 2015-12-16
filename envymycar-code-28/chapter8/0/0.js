// Global NVMC Client
// ID 8.0

/***********************************************************************/
var NVMCClient = NVMCClient || {};
/***********************************************************************/

NVMCClient.texture_facade = [];
NVMCClient.texture_roof = null;


NVMCClient.createFullScreenQuad = function (gl) {
	var quad = [	-1.0,-1,0,
			1.0,-1,0,
			1.0,1,0,
			-1.0,1,0];
	var text_coords = 	[ 0.0,0.0, 1.0,0.0, 1.0,1.0, 0.0,1.0];
	this.quad = new TexturedQuadrilateral(quad,text_coords);
	this.createObjectBuffers(gl, this.quad,false,false,true);
};

NVMCClient.shadowMapTextureTarget = null;
NVMCClient.shadowMatrix = null;
NVMCClient.viewMatrix = null;

NVMCClient.drawTree = function (gl) {
  var stack = this.stack;

  stack.push();
  var M_0_tra1 = SglMat4.translation([0, 0.8, 0]);
  stack.multiply(M_0_tra1);

  var M_0_sca = SglMat4.scaling([0.6, 1.65, 0.6]);
  stack.multiply(M_0_sca);

  gl.uniformMatrix4fv(this.lambertianSingleColorShadowShader.uModelMatrixLocation, false, stack.matrix);
  var InvT = SglMat4.inverse(SglMat4.mul(this.viewMatrix,this.stack.matrix));
  InvT = SglMat4.transpose(InvT);
  gl.uniformMatrix3fv(this.lambertianSingleColorShadowShader.uViewSpaceNormalMatrixLocation, false, SglMat4.to33(InvT));
  this.drawObject(gl, this.cone, this.lambertianSingleColorShadowShader, [0.2, 0.8, 0.1, 1.0]);
  stack.pop();

  stack.push();
  var M_1_sca = SglMat4.scaling([0.25, 0.4, 0.25]);
  stack.multiply(M_1_sca);

  gl.uniformMatrix4fv(this.lambertianSingleColorShadowShader.uModelMatrixLocation, false, stack.matrix);
  var InvT = SglMat4.inverse(SglMat4.mul(this.viewMatrix,this.stack.matrix));
  InvT = SglMat4.transpose(InvT);
  gl.uniformMatrix3fv(this.lambertianSingleColorShadowShader.uViewSpaceNormalMatrixLocation, false, SglMat4.to33(InvT));
  this.drawObject(gl, this.cylinder, this.lambertianSingleColorShadowShader, [0.6, 0.23, 0.12, 1.0]);
  stack.pop();
};


NVMCClient.drawTreeDepthOnly = function (gl) {
  var stack = this.stack;

  stack.push();
  var M_0_tra1 = SglMat4.translation([0, 0.8, 0]);
  stack.multiply(M_0_tra1);

  var M_0_sca = SglMat4.scaling([0.6, 1.65, 0.6]);
  stack.multiply(M_0_sca);

  gl.uniformMatrix4fv(this.shadowMapCreateShader.uShadowMatrixLocation, false, stack.matrix);
  var InvT = SglMat4.inverse(this.stack.matrix)
  InvT = SglMat4.transpose(InvT);
  this.drawObject(gl, this.cone, this.shadowMapCreateShader);
  stack.pop();

  stack.push();
  var M_1_sca = SglMat4.scaling([0.25, 0.4, 0.25]);
  stack.multiply(M_1_sca);

  gl.uniformMatrix4fv(this.shadowMapCreateShader.uShadowMatrixLocation, false, stack.matrix);
   this.drawObject(gl, this.cylinder, this.shadowMapCreateShader);
  stack.pop();
};


NVMCClient.drawCarDepthOnly = function (gl) {
	var fb = new SglFramebuffer(gl, {handle: this.shadowMapTextureTarget.framebuffer,autoViewport:false});

  	this.depthOnlyRenderer.begin();
  	this.depthOnlyRenderer.setFramebuffer(fb);

   	this.depthOnlyRenderer.setTechnique(this.depthOnlyTechnique);

  	this.depthOnlyRenderer.setGlobals({
	"SHADOW_MATRIX": this.stack.matrix
	});

	this.depthOnlyRenderer.setPrimitiveMode("FILL");

	this.depthOnlyRenderer.setModel(this.sgl_car_model);
	this.depthOnlyRenderer.renderModel();
	this.depthOnlyRenderer.end();
};



NVMCClient.drawShadowCastersDepthOnly = function (gl) {

	var pos  = this.game.state.players.me.dynamicState.position;	
 
	for (var i in this.buildings){
		this.drawObject(gl, this.buildings[i],this.shadowMapCreateShader);
	}	
	for (var i in this.buildings){
		this.drawObject(gl, this.buildings[i].roof,this.shadowMapCreateShader);
	}	
 
	var trees = this.game.race.trees;
	for (var t in trees) {
		this.stack.push();
			var M_8 = SglMat4.translation(trees[t].position);
			this.stack.multiply(M_8);
			this.drawTreeDepthOnly(gl,this.shadowMapCreateShader);
		this.stack.pop();
	}
 
	var M_9 = SglMat4.translation(pos);
	this.stack.multiply(M_9);

	var M_9bis = SglMat4.rotationAngleAxis(this.game.state.players.me.dynamicState.orientation, [0, 1, 0]);
	this.stack.multiply(M_9bis);

	this.drawCarDepthOnly(gl);
};


NVMCClient.drawCar = function (gl,toWordMatrix){
  	this.sgl_renderer.begin();
   	this.sgl_renderer.setTechnique(this.sgl_technique);
   
	 
    	this.sgl_renderer.setGlobals({
   					"PROJECTION_MATRIX":this.projectionMatrix,
					"WORLD_VIEW_MATRIX":this.stack.matrix,
					"SHADOW_MATRIX": SglMat4.mul(this.shadowMatrix ,toWordMatrix),
					"VIEW_SPACE_NORMAL_MATRIX"     : SglMat4.to33(this.stack.matrix) ,
					"CUBE_MAP"            : 2,
					"SHADOW_MAP"            : 3,
					"VIEW_TO_WORLD_MATRIX": this.viewFrame,
					"LIGHTS_GEOMETRY":		this.sunLightDirectionViewSpace,
					"LIGHT_COLOR":	[0.9,0.9,0.9]	});
   
   	this.sgl_renderer.setPrimitiveMode("FILL");
   	
  	this.sgl_renderer.setModel(this.sgl_car_model);
 	this.sgl_renderer.setTexture(2,new SglTextureCubeMap(gl,this.reflectionMap));
 	this.sgl_renderer.setTexture(3,new SglTexture2D(gl,this.shadowMapTextureTarget.texture));
	this.sgl_renderer.renderModel();
	this.sgl_renderer.end();
};		

NVMCClient.createTechniqueShadow = function (gl){	
	this.sgl_renderer = new SglModelRenderer(gl);	
	this.sgl_technique = new SglTechnique( gl,
		{	vertexShader	:this.reflectionMapShadowShader.vertex_shader, 
			fragmentShader	:this.reflectionMapShadowShader.fragment_shader,
			vertexStreams 		: 
			{
				"aPosition"		: [ 0.0,0.0,0.0],
				"aDiffuse"		: [ 0.0,0.0,0.0,1.0],
				"aSpecular"		: [ 0.0,0.0,0.0,1.0],
				"aNormal" 		: [ 0.0,1.0,1.0 ],
				"aAmbient"		: [ 0.0,0.0,0.0,1.0]
			},
			globals : {
				"uProjectionMatrix" : { semantic : "PROJECTION_MATRIX", value : this.projectionMatrix },
				"uModelViewMatrix":{semantic:"WORLD_VIEW_MATRIX",value : this.stack.matrix },
				"uViewSpaceNormalMatrix"     : { semantic : "VIEW_SPACE_NORMAL_MATRIX",     value :SglMat4.to33(this.stack.matrix) },
				"uViewToWorldMatrix"     : { semantic : "VIEW_TO_WORLD_MATRIX",     value :SglMat4.identity()},
				"uShadowMatrix"     : { semantic : "SHADOW_MATRIX",     value :SglMat4.identity()},
 				"uCubeMap":{semantic: "CUBE_MAP", value:2},
				"uShadowMap":{semantic:"SHADOW_MAP",value:1},
				"uLightDirection": 		{semantic: "LIGHTS_GEOMETRY",value: this.sunLightDirectionViewSpace},
				"uLightColor": 				{semantic: "LIGHT_COLOR",value: [0.9,0.9,0.9]},
				"uAmbient": 					{semantic: "AMBIENT",value: [0.4,0.4,0.4]},			}
		});

};

NVMCClient.createDepthOnlyTechnique = function (gl) {
  this.depthOnlyRenderer = new SglModelRenderer(gl);
  this.depthOnlyTechnique = new SglTechnique(gl, {
    vertexShader: this.shadowMapCreateShader.vertex_shader,
    fragmentShader: this.shadowMapCreateShader.fragment_shader,
    vertexStreams: {
      "a_position": [0.0, 0.0, 0.0, 1.0]
    },
    globals: {
      "uShadowMatrix": {
        semantic: "SHADOW_MATRIX",
        value: this.stack.matrix
      }
}
    
  });

};

NVMCClient.drawEverything = function (gl,excludeCar) {
	var stack  = this.stack;
	this.viewMatrix = this.stack.matrix;
	this.sunLightDirectionViewSpace = SglMat4.mul4(this.stack.matrix,this.sunLightDirection);
	var pos  = this.game.state.players.me.dynamicState.position;	
	
	// Setup projection matrix
	gl.useProgram(this.uniformShader);
	gl.uniformMatrix4fv(this.uniformShader.uProjectionMatrixLocation, false, this.projectionMatrix);
	
	

	gl.useProgram(this.phongShader);
	gl.uniformMatrix4fv(this.phongShader.uProjectionMatrixLocation,false,this.projectionMatrix);
	gl.uniformMatrix4fv(this.phongShader.uModelViewMatrixLocation,false,stack.matrix  );
	gl.uniformMatrix3fv(this.phongShader.uViewSpaceNormalMatrixLocation,false, SglMat4.to33(this.stack.matrix) );	
	gl.uniform4fv(this.phongShader.uLightDirectionLocation,this.sunLightDirectionViewSpace);
	
	gl.uniform3fv(this.phongShader.uLightColorLocation,[0.9,0.9,0.9]);
	gl.uniform1f(this.phongShader.uShininessLocation,0.2);
	gl.uniform1f(this.phongShader.uKaLocation,0.5);
	gl.uniform1f(this.phongShader.uKdLocation,0.5);
	gl.uniform1f(this.phongShader.uKsLocation, 1.0);
 
	gl.useProgram(this.lambertianSingleColorShadowShader);

	gl.activeTexture(gl.TEXTURE2);
  	gl.bindTexture(gl.TEXTURE_2D,this.shadowMapTextureTarget.texture);
	gl.uniform1i(this.lambertianSingleColorShadowShader.uShadowMapLocation, 2);

	gl.uniformMatrix4fv(this.lambertianSingleColorShadowShader.uProjectionMatrixLocation,false,this.projectionMatrix);
	gl.uniformMatrix4fv(this.lambertianSingleColorShadowShader.uViewMatrixLocation,false, this.stack.matrix);
	gl.uniformMatrix4fv(this.lambertianSingleColorShadowShader.uShadowMatrixLocation,false, this.shadowMatrix);


	gl.uniform4fv(this.lambertianSingleColorShadowShader.uLightDirectionLocation,this.sunLightDirectionViewSpace);
	gl.uniform3fv(this.lambertianSingleColorShadowShader.uLightColorLocation,[1.0,1.0,1.0]);
	var trees = this.game.race.trees;
	

 	for (var t in trees) {
		stack.push();
		stack.loadIdentity();
			var M_8 = SglMat4.translation(trees[t].position);
			this.stack.multiply(M_8);
  			this.drawTree(gl);
		stack.pop();
	}
 
	
	gl.useProgram(this.textureNormalMapShadowShader);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D,this.texture_street);
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D,this.normal_map_street);
	gl.activeTexture(gl.TEXTURE2);
	gl.bindTexture(gl.TEXTURE_2D,this.shadowMapTextureTarget.texture);

	gl.uniformMatrix4fv(this.textureNormalMapShadowShader.uProjectionMatrixLocation, false, this.projectionMatrix);
	gl.uniformMatrix4fv(this.textureNormalMapShadowShader.uModelViewMatrixLocation, false, stack.matrix);
	gl.uniformMatrix4fv(this.textureNormalMapShadowShader.uShadowMatrixLocation, false, this.shadowMatrix);
	gl.uniform4fv(this.textureNormalMapShadowShader.uLightDirectionLocation,this.sunLightDirection);
	gl.uniform1i(this.textureNormalMapShadowShader.uTextureLocation,0);
	gl.uniform1i(this.textureNormalMapShadowShader.uNormalMapLocation,1);
	gl.uniform1i(this.textureNormalMapShadowShader.uShadowMapLocation,2);
	this.drawObject(gl, this.track,this.textureNormalMapShadowShader, [0.9, 0.8, 0.7,1.0]);


	gl.useProgram(this.textureShadowShader);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D,this.texture_ground);
	gl.uniform1i(this.textureShadowShader.uTextureLocation, 0);

	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D,this.shadowMapTextureTarget.texture);
	gl.uniform1i(this.textureShadowShader.uShadowMapLocation, 1);

	gl.uniformMatrix4fv(this.textureShadowShader.uProjectionMatrixLocation, false, this.projectionMatrix);
	gl.uniformMatrix4fv(this.textureShadowShader.uModelViewMatrixLocation, false, this.stack.matrix);
	gl.uniformMatrix4fv(this.textureShadowShader.uShadowMatrixLocation, false, this.shadowMatrix);

	this.drawObject(gl,this.ground,this.textureShadowShader);
 

	gl.activeTexture(gl.TEXTURE0);
	gl.uniformMatrix4fv(this.textureShadowShader.uModelViewMatrixLocation, false, this.stack.matrix);

  for (var i in this.buildings) {
 		gl.bindTexture(gl.TEXTURE_2D, this.texture_facade[i%this.texture_facade.length]);
		this.drawObject(gl, this.buildings[i], this.textureShadowShader);
  }
 
	gl.bindTexture(gl.TEXTURE_2D,this.texture_roof);
	for (var i in this.buildings){
		this.drawObject(gl, this.buildings[i].roof,this.textureShadowShader);
	}


	if( !excludeCar &&  this.currentCamera!=3 ){
 		stack.push();
			var M_9 = SglMat4.translation(pos);
			stack.multiply(M_9);

			var M_9bis = SglMat4.rotationAngleAxis(this.game.state.players.me.dynamicState.orientation, [0, 1, 0]);
			stack.multiply(M_9bis);

			var toWordMatrix = SglMat4.mul(M_9, M_9bis);

			this.drawCar(gl,toWordMatrix);
		stack.pop();
		
	}
}


updateBBox = function ( bbox, newpoint){
	if(newpoint[0] < bbox[0]) bbox[0] = newpoint[0]; 
		else
			if(newpoint[0] > bbox[3]) bbox[3] = newpoint[0];

	if(newpoint[1] < bbox[1]) bbox[1] = newpoint[1]; 
		else
			if(newpoint[1] > bbox[4]) bbox[4] = newpoint[1];

	if(newpoint[2] < bbox[2]) bbox[2] = newpoint[2]; 
		else
			if(newpoint[2] > bbox[5]) bbox[5] = newpoint[2];

	return bbox;

};

enlargeBBox = function (bbox,perc){
	var center =[];
	center[0] =  (bbox[0]+bbox[3])*0.5;
	center[1] =  (bbox[1]+bbox[4])*0.5;
	center[2] =  (bbox[2]+bbox[5])*0.5;
	
	bbox[0] += (bbox[0] - center[0]) * perc;
	bbox[1] += (bbox[1] - center[1]) * perc;
	bbox[2] += (bbox[2] - center[2]) * perc;
	bbox[3] += (bbox[3] - center[0]) * perc;
	bbox[4] += (bbox[4] - center[1]) * perc;
	bbox[5] += (bbox[5] - center[2]) * perc;
return bbox;
}

NVMCClient.findMinimumViewWindow = function (bbox, projMatrix){
 	var bbox_vs = [];
 	
	// corner 0,0,0
 	var p = SglMat4.mul4(projMatrix,[bbox[0],bbox[1],bbox[2],1.0]) ;  
	p = SglVec4.divs(p,p[3]); 
	bbox_vs = [p[0],p[1],p[2],p[0],p[1],p[2]];

	// corner 1,0,0
	p = SglMat4.mul4(projMatrix,[bbox[3],bbox[1],bbox[2],1]);  
	p = SglVec4.divs(p,p[3]); 
 	bbox_vs = updateBBox(bbox_vs,[p[0],p[1],p[2]]);

	// corner 1,1,0
	p = SglMat4.mul4(projMatrix,[bbox[3],bbox[4],bbox[2],1]);  
	p = SglVec4.divs(p,p[3]); 
 	bbox_vs = updateBBox(bbox_vs,[p[0],p[1],p[2]]);


	// corner 0,1,0
	p = SglMat4.mul4(projMatrix,[bbox[0],bbox[4],bbox[2],1]);  
	p = SglVec4.divs(p,p[3]); 
 	bbox_vs = updateBBox(bbox_vs,[p[0],p[1],p[2]]);


	// corner 0,0,1
 	var p = SglMat4.mul4(projMatrix,[bbox[0],bbox[1],bbox[5],1.0]) ;  
	p = SglVec4.divs(p,p[3]); 
	bbox_vs = updateBBox(bbox_vs,[p[0],p[1],p[2]]);

	// corner 1,0,1
	p = SglMat4.mul4(projMatrix,[bbox[3],bbox[1],bbox[5],1]);  
	p = SglVec4.divs(p,p[3]); 
 	bbox_vs = updateBBox(bbox_vs,[p[0],p[1],p[2]]);

	// corner 1,1,1
	p = SglMat4.mul4(projMatrix,[bbox[3],bbox[4],bbox[5],1]);  
	p = SglVec4.divs(p,p[3]); 
 	bbox_vs = updateBBox(bbox_vs,[p[0],p[1],p[2]]);


	// corner 0,1,1
	p = SglMat4.mul4(projMatrix,[bbox[0],bbox[4],bbox[5],1]);  
	p = SglVec4.divs(p,p[3]); 
 	bbox_vs = updateBBox(bbox_vs,[p[0],p[1],p[2]]);

  	return bbox_vs;
};


NVMCClient.drawScene = function (gl) {
    if(NVMCClient.n_resources_to_wait_for>0)return;
    var width  = this.ui.width;
	var height = this.ui.height
	var ratio  = width / height;
	
	// compute the shadow matrix
	var bbox =  this.game.race.bbox





	
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
	 

	this.projectionMatrix = SglMat4.perspective(3.14/4,ratio,0.1,1000);
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
 	
if(false){
	gl.disable(gl.DEPTH_TEST);
	gl.activeTexture(gl.TEXTURE0);
  	gl.bindTexture(gl.TEXTURE_2D,this.shadowMapTextureTarget.texture);
	gl.useProgram(this.textureShader);
	gl.uniformMatrix4fv(this.textureShader.uProjectionMatrixLocation, false, SglMat4.identity());
	gl.uniformMatrix4fv(this.textureShader.uModelViewMatrixLocation, false,SglMat4.identity());
	gl.uniform1i(this.textureShader.uTextureLocation, 0);
	this.drawObject(gl,this.quad ,this.textureShader,[0.3, 0.7, 0.2,1.0], [0, 0, 0,1.0]);
	gl.enable(gl.DEPTH_TEST);
return;
 }
 
	this.drawEverything(gl);
		 
	
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
	enlargeBBox(this.game.race.bbox,0.01);
	/*************************************************************/
	this.initializeObjects(gl);
	this.createFullScreenQuad(gl);
	this.initializeCameras();

	this.uniformShader 			= new uniformShader(gl);
	this.perVertexColorShader 		= new perVertexColorShader(gl);
	this.lambertianSingleColorShader 	= new lambertianSingleColorShader(gl);
	this.phongShader 			= new phongShader(gl);
	this.textureShader 			= new textureShader(gl);
	this.skyBoxShader 			= new skyBoxShader(gl);
	this.showCubeMapShader			= new showCubeMapShader(gl);
	this.shadowMapCreateShader		= new shadowMapCreateShader(gl);
	this.textureShadowShader		= new textureShadowShader(gl);
	this.textureNormalMapShadowShader 	= new textureNormalMapShadowShader(gl);
	this.reflectionMapShadowShader 	= new reflectionMapShadowShader(gl);
	this.lambertianSingleColorShadowShader = new lambertianSingleColorShadowShader(gl);
	/*************************************************************/

    this.texture_street = this.createTexture(gl, 				NVMC.resource_path+'textures/street4.png');
    this.normal_map_street = this.createTexture(gl,             NVMC.resource_path+'textures/asphalt_normal_map.jpg');
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
	this.createTechniqueShadow(gl);
	this.createDepthOnlyTechnique(gl);

	this.rearMirrorTextureTarget = this.prepareRenderToTextureFrameBuffer(gl);
	this.shadowMapTextureTarget = this.prepareRenderToTextureFrameBuffer(gl,false,4096,4096);
	this.prepareRenderToCubeMapFrameBuffer(gl);
    this.sunLightDirection = [-2.4,-1,-0,0.0];
};


/***********************************************************************/
