// Global NVMC Client
// ID 6.0
/***********************************************************************/
var NVMCClient = NVMCClient || {};
/***********************************************************************/
NVMCClient.sgl_car_model = null;
NVMCClient.sgl_renderer = null;

NVMCClient.sunLightDirection = SglVec4.normalize([1, -0.5, 0, 0,0.0]);

NVMCClient.createObjectBuffers = function (gl, obj, createColorBuffer, createNormalBuffer) {

	obj.vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, obj.vertices, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	if (createColorBuffer) {
		obj.colorBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, obj.colorBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, obj.vertex_color, gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
	}

	if (createNormalBuffer) {//line 25, Listing 6.1
		obj.normalBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, obj.normalBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, obj.vertex_normal, gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
	}//line 30}

	obj.indexBufferTriangles = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferTriangles);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, obj.triangleIndices, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

	// create edges
	var edges = new Uint16Array(obj.numTriangles * 3 * 2);
	for (var i = 0; i < obj.numTriangles; ++i) {
		edges[i * 6 + 0] = obj.triangleIndices[i * 3 + 0];
		edges[i * 6 + 1] = obj.triangleIndices[i * 3 + 1];
		edges[i * 6 + 2] = obj.triangleIndices[i * 3 + 0];
		edges[i * 6 + 3] = obj.triangleIndices[i * 3 + 2];
		edges[i * 6 + 4] = obj.triangleIndices[i * 3 + 1];
		edges[i * 6 + 5] = obj.triangleIndices[i * 3 + 2];
	}

	obj.indexBufferEdges = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferEdges);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, edges, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

};

NVMCClient.createBuffers = function (gl) {
	this.createObjectBuffers(gl, this.cube, false, false);

	ComputeNormals(this.cylinder);
	this.createObjectBuffers(gl, this.cylinder, false, true);

	ComputeNormals(this.cone);
	this.createObjectBuffers(gl, this.cone, false, true);

	ComputeNormals(this.track);
	this.createObjectBuffers(gl, this.track, false, true);

	ComputeNormals(this.ground);
	this.createObjectBuffers(gl, this.ground, false, true);

	this.createObjectBuffers(gl, this.cabin, true, false);
	this.createObjectBuffers(gl, this.windshield, true, false);

	for (var i = 0; i < this.buildings.length; ++i) {
		this.buildings[i] = ComputeNormals(this.buildings[i]);
		this.createObjectBuffers(gl, this.buildings[i], false, true);
	}
};

NVMCClient.drawObject = function (gl, obj, shader, fillColor, drawWire) {
	// Draw the primitive
	gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
	gl.enableVertexAttribArray(shader.aPositionIndex);
	gl.vertexAttribPointer(shader.aPositionIndex, 3, gl.FLOAT, false, 0, 0);

	if (shader.aColorIndex && obj.colorBuffer) {
		gl.bindBuffer(gl.ARRAY_BUFFER, obj.colorBuffer);
		gl.enableVertexAttribArray(shader.aColorIndex);
		gl.vertexAttribPointer(shader.aColorIndex, 4, gl.FLOAT, false, 0, 0);
	}

	if (shader.aNormalIndex && obj.normalBuffer && shader.uViewSpaceNormalMatrixLocation) {// Line 91, Listing 6.2{
		gl.bindBuffer(gl.ARRAY_BUFFER, obj.normalBuffer);
		gl.enableVertexAttribArray(shader.aNormalIndex);
		gl.vertexAttribPointer(shader.aNormalIndex, 3, gl.FLOAT, false, 0, 0);
		gl.uniformMatrix3fv(shader.uViewSpaceNormalMatrixLocation, false, SglMat4.to33(this.stack.matrix));
	}// line 96

	if (fillColor && shader.uColorLocation)
		gl.uniform4fv(shader.uColorLocation, fillColor);

	gl.enable(gl.POLYGON_OFFSET_FILL);

	gl.polygonOffset(1.0, 1.0);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferTriangles);
	gl.drawElements(gl.TRIANGLES, obj.triangleIndices.length, gl.UNSIGNED_SHORT, 0);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

};

NVMCClient.drawTree = function (gl, shaderToUse, stackToUse) {
	var stack = stackToUse;
	if (!stack)
		stack = this.stack;

	stack.push();
	var M_0_tra1 = SglMat4.translation([0, 0.8, 0]);
	stack.multiply(M_0_tra1);

	var M_0_sca = SglMat4.scaling([0.6, 1.65, 0.6]);
	stack.multiply(M_0_sca);

	gl.uniformMatrix4fv(shaderToUse.uModelViewMatrixLocation, false, stack.matrix);
	var InvT = SglMat4.inverse(this.stack.matrix)
	InvT = SglMat4.transpose(InvT);
	gl.uniformMatrix3fv(shaderToUse.uViewSpaceNormalMatrixLocation, false, SglMat4.to33(InvT));
	this.drawObject(gl, this.cone, shaderToUse, [0.2, 0.52, 0.1, 1.0]);
	stack.pop();

	stack.push();
	var M_1_sca = SglMat4.scaling([0.25, 0.4, 0.25]);
	stack.multiply(M_1_sca);

	gl.uniformMatrix4fv(shaderToUse.uModelViewMatrixLocation, false, stack.matrix);
	var InvT = SglMat4.inverse(this.stack.matrix)
	InvT = SglMat4.transpose(InvT);
	gl.uniformMatrix3fv(shaderToUse.uViewSpaceNormalMatrixLocation, false, SglMat4.to33(InvT));
	this.drawObject(gl, this.cylinder, shaderToUse, [0.5, 0.13, 0.12, 1.0]);
	stack.pop();
};

NVMCClient.drawCar = function (gl) {//line 142,
	this.sgl_renderer.begin();
	this.sgl_renderer.setTechnique(this.sgl_technique);
	this.sgl_renderer.setGlobals({
		"PROJECTION_MATRIX": this.projectionMatrix,
		"WORLD_VIEW_MATRIX": this.stack.matrix,
		"VIEW_SPACE_NORMAL_MATRIX": SglMat4.to33(this.stack.matrix),
		"LIGHTS_GEOMETRY": this.sunLightDirectionViewSpace,
		"LIGHTS_COLOR": [0.9,0.9,0.9]
	});
	this.sgl_renderer.setPrimitiveMode("FILL");
	this.sgl_renderer.setModel(this.sgl_car_model);
	this.sgl_renderer.renderModel();
	this.sgl_renderer.end();
};

NVMCClient.loadCarModel = function (gl, data) {//line 158, Listing 6.5{
	if (!data)
		data = NVMC.resource_path+"geometry/cars/eclipse/eclipse.obj";
	var that = this;
	this.sgl_car_model = null;
	sglRequestObj(data, function (modelDescriptor) {
		that.sgl_car_model = new SglModel(that.ui.gl, modelDescriptor);
		that.ui.postDrawEvent();
	});
};//line 167}

NVMCClient.createCarTechnique = function (gl) {//line 169, Listing 6.6
	this.sgl_technique = new SglTechnique(gl, {
		vertexShader: this.lambertianShader.vertex_shader,
		fragmentShader: this.lambertianShader.fragment_shader,
		vertexStreams: {
			"aPosition": [0.0, 0.0, 0.0, 1.0],
			"aNormal":	 [1.0, 0.0, 0.0, 0.0],
			"aDiffuse":	 [0.4, 0.8, 0.8, 1.0],
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
			"uLightDirection"				: {
				semantic: "LIGHTS_GEOMETRY",
				value		:	this.sunLightDirectionViewSpace	
			},
			"uLightColor"					: {
				semantic: "LIGHTS_COLOR",
				value		:	this.lightsColor			
			}}});};//line 198}

NVMCClient.drawScene = function (gl) {
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

	this.sunLightDirectionViewSpace = SglVec4.normalize(SglMat4.mul(this.stack.matrix, this.sunLightDirection));
	gl.useProgram(this.lambertianSingleColorShader);
	gl.uniform4fv(this.lambertianSingleColorShader.uLightDirectionLocation, this.sunLightDirectionViewSpace);
	gl.uniform3fv(this.lambertianSingleColorShader.uLightColorLocation, [0.9, 0.9, 0.9]);
	gl.uniformMatrix4fv(this.lambertianSingleColorShader.uProjectionMatrixLocation, false, this.projectionMatrix);
	gl.uniformMatrix4fv(this.lambertianSingleColorShader.uModelViewMatrixLocation, false, stack.matrix);

	this.drawObject(gl, this.track, this.lambertianSingleColorShader, [0.9, 0.8, 0.7, 1.0]);
	this.drawObject(gl, this.ground, this.lambertianSingleColorShader, [0.3, 0.7, 0.2, 1.0]);

	var trees = this.game.race.trees;
	for (var t in trees) {
		stack.push();
		var M_8 = SglMat4.translation(trees[t].position);
		stack.multiply(M_8);
		this.drawTree(gl, this.lambertianSingleColorShader);
		stack.pop();
	}

	gl.uniformMatrix4fv(this.lambertianSingleColorShader.uModelViewMatrixLocation, false, stack.matrix);
	for (var i in this.buildings) {
		this.drawObject(gl, this.buildings[i], this.lambertianSingleColorShader, [0.7, 0.8, 0.9, 1.0], [1, 1, 1, 1]);
	}

	if (this.currentCamera != 3) {
		stack.push();
		var M_9 = SglMat4.translation(pos);
		stack.multiply(M_9);

		var M_9bis = SglMat4.rotationAngleAxis(orientation, [0, 1, 0]);
		stack.multiply(M_9bis);

		this.drawCar(gl);
		stack.pop();
	} else {
		gl.disable(gl.DEPTH_TEST);
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

	var sb = gl.getParameter(gl.STENCIL_BITS)

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
	this.initializeObjects(gl);
	this.initializeCameras();
	this.uniformShader = new uniformShader(gl);

	this.perVertexColorShader = new perVertexColorShader(gl);
	this.lambertianShader = new lambertianShader(gl);
	this.lambertianSingleColorShader = new lambertianSingleColorShader(gl);
	/*************************************************************/

	this.sgl_renderer = new SglModelRenderer(gl);
	this.loadCarModel(gl);
	this.createCarTechnique(gl);
};
