// Global NVMC Client
// ID 10.1

/***********************************************************************/
var NVMCClient = NVMCClient || {};
/***********************************************************************/

NVMCClient.firstPassTextureTarget = null;
NVMCClient.toon_shader_enabled = false;

NVMCClient.createFullScreenQuad = function (gl) {
	var quad = [	-1.0,-1,0,
			1.0,-1,0,
			1.0,1,0,
			-1.0,1,0];
	var text_coords = 	[ 0.0,0.0, 1.0,0.0, 1.0,1.0, 0.0,1.0];
	this.quad = new TexturedQuadrilateral(quad,text_coords);
	this.createObjectBuffers(gl, this.quad,false,false,true);
};

NVMCClient.createObjectBuffers = function (gl, obj,  createColorBuffer, createNormalBuffer,createTexCoordBuffer ) {
	obj.vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, obj.vertices, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	
	if(createColorBuffer){
		obj.colorBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, obj.colorBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, obj.vertex_color, gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
	}
	
	if(createNormalBuffer){
		obj.normalBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, obj.normalBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, obj.vertex_normal, gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
	}

	if(createTexCoordBuffer){
		obj.textureCoordBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, obj.textureCoordBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, obj.textureCoord, gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
	}

	obj.indexBufferTriangles = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferTriangles);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, obj.triangleIndices, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

	// create edges
	var edges = new Uint16Array(obj.numTriangles * 3 * 2);
	for (var i=0; i<obj.numTriangles; ++i) {
		edges[i*6 + 0] = obj.triangleIndices[i*3 + 0];
		edges[i*6 + 1] = obj.triangleIndices[i*3 + 1];
		edges[i*6 + 2] = obj.triangleIndices[i*3 + 0];
		edges[i*6 + 3] = obj.triangleIndices[i*3 + 2];
		edges[i*6 + 4] = obj.triangleIndices[i*3 + 1];
		edges[i*6 + 5] = obj.triangleIndices[i*3 + 2];
	}

	obj.indexBufferEdges = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferEdges);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, edges, gl.STATIC_DRAW);	
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	
};



NVMCClient.drawObject = function (gl, obj, shader,fillColor) {
	// Draw the primitive
	gl.useProgram(shader);
	gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
	gl.enableVertexAttribArray(shader.aPositionIndex);
	gl.vertexAttribPointer(shader.aPositionIndex, 3, gl.FLOAT, false, 0, 0);

 
	if(shader.aColorIndex && obj.colorBuffer ){
		gl.bindBuffer(gl.ARRAY_BUFFER, obj.colorBuffer);
		gl.enableVertexAttribArray(shader.aColorIndex);
		gl.vertexAttribPointer(shader.aColorIndex, 4, gl.FLOAT, false, 0, 0);
	}
 
	if(shader.aNormalIndex &&  obj.normalBuffer){
		gl.bindBuffer(gl.ARRAY_BUFFER, obj.normalBuffer);
		gl.enableVertexAttribArray(shader.aNormalIndex);
		gl.vertexAttribPointer(shader.aNormalIndex, 3, gl.FLOAT, false, 0, 0);
	}
	
	if(shader.aTextureCoordIndex && obj.textureCoordBuffer){
		gl.bindBuffer(gl.ARRAY_BUFFER, obj.textureCoordBuffer);
		gl.enableVertexAttribArray(shader.aTextureCoordIndex);
		gl.vertexAttribPointer(shader.aTextureCoordIndex, 2, gl.FLOAT, false, 0, 0);
	}
	
	if(fillColor && shader.uColorLocation)
	 	gl.uniform4fv(shader.uColorLocation, fillColor);

	gl.enable(gl.POLYGON_OFFSET_FILL);

	gl.polygonOffset(1.0, 1.0);
		
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferTriangles);
	gl.drawElements(gl.TRIANGLES, obj.triangleIndices.length, gl.UNSIGNED_SHORT, 0);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

};
NVMCClient.drawCar = function (gl,framebuffer) {
	if(framebuffer)
		var fb = new SglFramebuffer(gl, {handle:  framebuffer,autoViewport:false});

	this.sgl_renderer.begin();
		if(framebuffer)
	    	this.sgl_renderer.setFramebuffer(fb); 
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

NVMCClient.createTexture  = function (gl, data, nomipmap) {
	var texture = gl.createTexture();
	texture.image = new Image();

	var that =  texture;
	texture.image.onload = function () {
		gl.bindTexture(gl.TEXTURE_2D, that);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, that.image);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		if(nomipmap)
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);        
		else
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);        


		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
		if(!nomipmap)
			gl.generateMipmap(gl.TEXTURE_2D);
		gl.bindTexture(gl.TEXTURE_2D, null);
	};

	texture.image.src = data;
	return texture;
}

TextureTarget = function() 
{
	this.framebuffer=null;
	this.texture=null;
};

NVMCClient.prepareRenderToTextureFrameBuffer= function (gl,generateMipmap,w,h) {
	var textureTarget = new  TextureTarget();
	textureTarget.framebuffer = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, textureTarget.framebuffer);

	
	if(w) textureTarget.framebuffer.width = w; else textureTarget.framebuffer.width = 512;
	if(h) textureTarget.framebuffer.height = h; else textureTarget.framebuffer.height = 512;;	

	textureTarget.texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, textureTarget.texture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, textureTarget.framebuffer.width, textureTarget.framebuffer.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
	if(generateMipmap)
		gl.generateMipmap(gl.TEXTURE_2D);
	
	 var renderbuffer = gl.createRenderbuffer();
	gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
	gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, textureTarget.framebuffer.width, textureTarget.framebuffer.height);

	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textureTarget.texture, 0);
	gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
	
	gl.bindTexture(gl.TEXTURE_2D, null);
	gl.bindRenderbuffer(gl.RENDERBUFFER, null);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

	return textureTarget;
}


NVMCClient.drawEverything = function (gl,framebuffer) {
	var stack  = this.stack;

	// Clear the framebuffer
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.enable(gl.DEPTH_TEST);
	
	stack.loadIdentity();
	
	if( this.currentCamera==3 ){
			gl.enable(gl.STENCIL_TEST);
			gl.clearStencil(0);
			gl.stencilMask(~0);
			gl.stencilFunc(gl.ALWAYS,1,0xFF);
			gl.stencilOp(gl.REPLACE,gl.REPLACE,gl.REPLACE);
				
			gl.useProgram(this.perVertexColorShader);
			gl.uniformMatrix4fv(this.perVertexColorShader.uModelViewMatrixLocation, false, SglMat4.identity());
			gl.uniformMatrix4fv(this.perVertexColorShader.uProjectionMatrixLocation, false, SglMat4.identity());
			this.drawObject(gl, this.cabin,  this.perVertexColorShader);
		
			gl.stencilFunc(gl.EQUAL,0,0xFF);
			gl.stencilOp(gl.KEEP,gl.KEEP,gl.KEEP);
			gl.stencilMask(0);
	}else
		gl.disable(gl.STENCIL_TEST);

	
	
 	  
	var orientation = this.myOri();
	var pos = this.myPos();
	this.cameras[this.currentCamera].setView(this.stack,this.myFrame());
	
	this.lightsGeometryViewSpace[0]  = SglMat4.mul4(this.stack.matrix, this.sunLightDirection);
	this.lightsColor [0] =   [0.3,0.3,0.3,1.0];
 	for( var i = 0 ; i < this.streetLamps.length ; ++i)
 		{
			this.lightsGeometryViewSpace[i+1] = SglMat4.mul4(this.stack.matrix, this.streetLamps[i].light.geometry);
			this.lightsColor [i+1] =   this.streetLamps[i].light.color;
		}
	{
		this.spotLights[0].posViewSpace = SglMat4.mul4(this.stack.matrix, SglMat4.mul4(this.myFrame(), this.spotLights[0].pos));
		this.spotLights[1].posViewSpace = SglMat4.mul4(this.stack.matrix, SglMat4.mul4(this.myFrame(), this.spotLights[1].pos));
		this.spotLights[0].dirViewSpace = SglMat4.mul4(this.stack.matrix, SglMat4.mul4(this.myFrame(), this.spotLights[0].dir));
		this.spotLights[1].dirViewSpace = SglMat4.mul4(this.stack.matrix, SglMat4.mul4(this.myFrame(), this.spotLights[1].dir));		
	}
		
	{	// setting area lights
		for(var al in this.game.race.arealigths)
			this.areaLightsFrameViewSpace[al] = SglMat4.mul(this.stack.matrix,this.game.race.arealigths[al].frame);
	}
	
	
	gl.useProgram(this.phongSingleColorMultiLightShader);
 	for( var i = 0 ; i < this.streetLamps.length+1; ++i){
 		gl.uniform4fv(	this.phongSingleColorMultiLightShader.uLightsGeometryLocation[i],
					this.lightsGeometryViewSpace[i]);
 		gl.uniform4fv(	this.phongSingleColorMultiLightShader.uLightsColorLocation[i],
					this.lightsColor[i]);
	}
	
	// spotlights	
	var sh = this.phongSingleColorMultiLightShader;
	gl.uniform3fv(sh.uSpotLightsPosLocation[0], SglVec4.to3(this.spotLights[0].posViewSpace));
	gl.uniform3fv(sh.uSpotLightsPosLocation[1], SglVec4.to3(this.spotLights[1].posViewSpace));
	gl.uniform3fv(sh.uSpotLightsDirLocation[0], SglVec4.to3(this.spotLights[0].dirViewSpace));
	gl.uniform3fv(sh.uSpotLightsDirLocation[1], SglVec4.to3(this.spotLights[1].dirViewSpace));
	gl.uniform4fv(sh.uSpotLightsColorLocation[0], [0.4, 0.3, 0.0, 1.0]);
	gl.uniform4fv(sh.uSpotLightsColorLocation[1], [0.4, 0.3, 0.0, 1.0]);

	gl.uniform1f(sh.uSpotLightsCutOffLocation[0], this.spotLights[0].cutOff);
	gl.uniform1f(sh.uSpotLightsCutOffLocation[1], this.spotLights[1].cutOff);
	gl.uniform1f(sh.uSpotLightsFallOffLocation[0], this.spotLights[0].fallOff);
	gl.uniform1f(sh.uSpotLightsFallOffLocation[1], this.spotLights[1].fallOff);
	

	
	// areaLights
	for(var i = 0; i < this.areaLightsFrameViewSpace.length ; ++i){
		gl.uniformMatrix4fv(this.phongSingleColorMultiLightShader.uAreaLightsFrameLocation[i],false,this.areaLightsFrameViewSpace[i]);
		gl.uniform2fv(this.phongSingleColorMultiLightShader.uAreaLightsSizeLocation[i],	this.areaLightsSize[i]);
		gl.uniform3fv(this.phongSingleColorMultiLightShader.uAreaLightsColorLocation[i],	this.areaLightsColor[i]);
	}


	gl.uniform3fv(this.phongSingleColorMultiLightShader.uLightColorLocation, [0.9, 0.9, 0.9] );
	gl.uniformMatrix4fv(this.phongSingleColorMultiLightShader.uProjectionMatrixLocation, false, this.projectionMatrix);
	gl.uniformMatrix4fv(this.phongSingleColorMultiLightShader.uModelViewMatrixLocation, false, stack.matrix);
	gl.uniformMatrix3fv(this.phongSingleColorMultiLightShader.uViewSpaceNormalMatrixLocation, false, SglMat4.to33(this.stack.matrix) );

	gl.uniform1f(this.phongSingleColorMultiLightShader.uKaLocation,0.5);
	gl.uniform1f(this.phongSingleColorMultiLightShader.uKdLocation,1);
	gl.uniform1f(this.phongSingleColorMultiLightShader.uKsLocation,0.1);
	gl.uniform1f(this.phongSingleColorMultiLightShader.uShininessLocation,1.0);


	this.drawObject(gl, this.track, this.phongSingleColorMultiLightShader,[1.0, 1.0, 1.0,1.0]);
	for(var i = 0; i < this.tunnels.length;++i)
		this.drawObject(gl, this.tunnels[i], this.phongSingleColorMultiLightShader,[0.9, 0.8, 0.7,1.0]);
	this.drawObject(gl,this.ground,this.phongSingleColorMultiLightShader,[0.3, 0.7, 0.2,1.0]);
	

	var trees = this.game.race.trees;
	for (var t in trees) {
		stack.push();
			var M_8 = SglMat4.translation(trees[t].position);
			stack.multiply(M_8);
			this.drawTree(gl);
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
	
	gl.useProgram(this.phongSingleColorMultiLightShader);
 	gl.uniformMatrix4fv(this.phongSingleColorMultiLightShader.uModelViewMatrixLocation,false,stack.matrix  );
	for (var i in this.buildings){
		this.drawObject(gl, this.buildings[i],this.phongSingleColorMultiLightShader,[0.7,0.8,0.9,1.0]);
	}

	if( this.currentCamera!=3 ){
	stack.push();
		var M_9 = SglMat4.translation(pos);
		stack.multiply(M_9);

		var M_9bis = SglMat4.rotationAngleAxis(this.game.state.players.me.dynamicState.orientation, [0, 1, 0]);
		stack.multiply(M_9bis);

 		this.drawCar(gl,framebuffer);
	stack.pop();
	}

	gl.disable(gl.DEPTH_TEST);
	if( this.currentCamera==3 ){
			gl.enable(gl.BLEND);
			gl.blendFunc( gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
			gl.useProgram(this.perVertexColorShader);
			gl.uniformMatrix4fv(this.uModelViewMatrixLocation, false, SglMat4.identity());
			gl.uniformMatrix4fv(this.uProjectionMatrixLocation, false, SglMat4.identity());
			this.drawObject(gl, this.windshield, this.perVertexColorShader);
			gl.disable(gl.BLEND);
		
	}
	
 	gl.disable(gl.DEPTH_TEST);
	gl.useProgram(null);
};



NVMCClient.drawScene = function (gl) {
    if(NVMCClient.n_resources_to_wait_for>0)return;
    var width  = this.ui.width;
	var height = this.ui.height
	var ratio  = width / height;
	var stack  = this.stack;
	this.projectionMatrix = SglMat4.perspective(3.14/4,ratio,1,1000);

	gl.viewport(0, 0, width, height);

	if(this.toon_shader_enabled){
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.firstPassTextureTarget.framebuffer);
		gl.viewport(0, 0, this.firstPassTextureTarget.framebuffer.width, this.firstPassTextureTarget.framebuffer.height);
		this.drawEverything(gl,this.firstPassTextureTarget.framebuffer);
	}
	else{
		gl.viewport(0, 0,  width,  height);
		this.drawEverything(gl);
	}

	if(!this.toon_shader_enabled)
		return;
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

	gl.viewport(0, 0, width, height);

	gl.disable(gl.DEPTH_TEST);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D,this.firstPassTextureTarget.texture);
	gl.useProgram(this.toonShader);
	gl.uniform2fv(this.toonShader.uPxsLocation,[1.0/this.firstPassTextureTarget.framebuffer.width,2.0/this.firstPassTextureTarget.framebuffer.height]);
	gl.uniform1i(this.toonShader.uTextureLocation, 0);
	this.drawObject(gl,this.quad ,this.toonShader);
	gl.enable(gl.DEPTH_TEST);
}


// NVMC Client Events
/***********************************************************************/
NVMCClient.onInitialize = function () {
	
	var gl = this.ui.gl;


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
	this.lambertianSingleColorShader 	= new lambertianSingleColorShader(gl);
  this.billboardShader 			= new billboardShader(gl);
	this.phongMultiLightShader = new phongMultiLightShader(gl,this.streetLamps.length+1,2,1);
	this.phongSingleColorMultiLightShader = new phongSingleColorMultiLightShader(gl,this.streetLamps.length+1,2,1);
	this.toonShader = new toonShader(gl);
	/*************************************************************/
	
	this.loadBillboardCloud(gl);
	this.loadCarModel(gl);
	this.createCarTechnique(gl,this.phongMultiLightShader);
	this.firstPassTextureTarget = this.prepareRenderToTextureFrameBuffer(gl,false,1024,1024);
	this.createFullScreenQuad(gl);
};

NVMCClient.onKeyUp = function (keyCode, event) {
	if( keyCode == "2"){ this.nextCamera(); return;}
	if( keyCode == "1"){ this.prevCamera(); return;}		
	if( keyCode == "3"){ this.toon_shader_enabled = !this.toon_shader_enabled;return;}		
	
	if(this.carMotionKey[keyCode])
		this.carMotionKey[keyCode](false);
	
	this.cameras[this.currentCamera].keyUp(keyCode) ;
};
