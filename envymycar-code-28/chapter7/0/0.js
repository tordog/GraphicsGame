// Global NVMC Client
// ID 7.0
/***********************************************************************/
var NVMCClient = NVMCClient || {};
/***********************************************************************/
NVMCClient.n_resources_to_wait_for = 0;
NVMCClient.texture_ground = null;
NVMCClient.texture_street = null;
NVMCClient.texture_facade = [];
NVMCClient.texture_roof = null;

NVMCClient.createTexture = function (gl, data) {//line 12, Listing{
	var texture = gl.createTexture();
	texture.image = new Image();
    texture.image.crossOrigin = "anonymous"; // this line is needed only in local-noserv mode (not in the book)
    NVMCClient.n_resources_to_wait_for++;
	var that = texture;
	texture.image.onload = function () {
		gl.bindTexture(gl.TEXTURE_2D, that);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, that.image);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.bindTexture(gl.TEXTURE_2D, null);
        NVMCClient.n_resources_to_wait_for--;
	};
	texture.image.src = data;
	return texture;
}//line 31}

NVMCClient.createObjectBuffers = function (gl, obj, createColorBuffer, createNormalBuffer, createTexCoordBuffer) {
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

	if (createNormalBuffer) {
		obj.normalBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, obj.normalBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, obj.vertex_normal, gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
	}

	if (createTexCoordBuffer) {
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

NVMCClient.drawObject = function (gl, obj, shader, fillColor, drawWire) {
	// Draw the primitive
	gl.useProgram(shader);
	gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
	gl.enableVertexAttribArray(shader.aPositionIndex);
	gl.vertexAttribPointer(shader.aPositionIndex, 3, gl.FLOAT, false, 0, 0);

	if (shader.aColorIndex && obj.colorBuffer) {
		gl.bindBuffer(gl.ARRAY_BUFFER, obj.colorBuffer);
		gl.enableVertexAttribArray(shader.aColorIndex);
		gl.vertexAttribPointer(shader.aColorIndex, 4, gl.FLOAT, false, 0, 0);
	}

	if (shader.aNormalIndex && obj.normalBuffer) {
		gl.bindBuffer(gl.ARRAY_BUFFER, obj.normalBuffer);
		gl.enableVertexAttribArray(shader.aNormalIndex);
		gl.vertexAttribPointer(shader.aNormalIndex, 3, gl.FLOAT, false, 0, 0);
	}

	if (shader.aTextureCoordIndex && obj.textureCoordBuffer) {
		gl.bindBuffer(gl.ARRAY_BUFFER, obj.textureCoordBuffer);
		gl.enableVertexAttribArray(shader.aTextureCoordIndex);
		gl.vertexAttribPointer(shader.aTextureCoordIndex, 2, gl.FLOAT, false, 0, 0);
	}

	if (fillColor && shader.uColorLocation)
		gl.uniform4fv(shader.uColorLocation, fillColor);

	gl.enable(gl.POLYGON_OFFSET_FILL);

	gl.polygonOffset(1.0, 1.0);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferTriangles);
	gl.drawElements(gl.TRIANGLES, obj.triangleIndices.length, gl.UNSIGNED_SHORT, 0);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	if (drawWire) {
		gl.disable(gl.POLYGON_OFFSET_FILL);

		gl.useProgram(this.uniformShader);
		gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixMatrixLocation, false, this.stack.matrix);

		gl.uniform4fv(this.uniformShader.uColorLocation, [0, 0, 1, 1]);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferEdges);
		gl.drawElements(gl.LINES, obj.numTriangles * 3 * 2, gl.UNSIGNED_SHORT, 0);
		gl.useProgram(shader);
	}

};

NVMCClient.createObjects = function () {
	this.cube = new Cube(10);
	this.cylinder = new Cylinder(10);
	this.cone = new Cone(10);

	this.track = new TexturedTrack(this.game.race.track, 0.2);

	var bbox = this.game.race.bbox;
	var quad = [bbox[0], bbox[1] - 0.01, bbox[2],
		bbox[3], bbox[1] - 0.01, bbox[2],
		bbox[3], bbox[1] - 0.01, bbox[5],
		bbox[0], bbox[1] - 0.01, bbox[5]
	];

	var text_coords = [-200, -200, 200, -200, 200, 200, -200, 200];
	this.ground = new TexturedQuadrilateral(quad, text_coords);
	this.cabin = new Cabin();
	this.windshield = new Windshield();

	var gameBuildings = this.game.race.buildings;
	this.buildings = new Array(gameBuildings.length);
	for (var i = 0; i < gameBuildings.length; ++i) {
		this.buildings[i] = new TexturedFacades(gameBuildings[i], 1);
		this.buildings[i].roof = new TexturedRoof(gameBuildings[i], 5);
	}
};

NVMCClient.createBuffers = function (gl) {
	this.createObjectBuffers(gl, this.cube, false, false, false);

	ComputeNormals(this.cylinder);
	this.createObjectBuffers(gl, this.cylinder, false, true, false);
 

	ComputeNormals(this.cone);
	this.createObjectBuffers(gl, this.cone, false, true, false);
 

	this.createObjectBuffers(gl, this.track, false, false, true);
	this.createObjectBuffers(gl, this.ground, false, false, true);

	this.createObjectBuffers(gl, this.cabin, true, false, false);
	this.createObjectBuffers(gl, this.windshield, true, false, false);

	for (var i = 0; i < this.buildings.length; ++i) {
		this.createObjectBuffers(gl, this.buildings[i], false, false, true);
		this.createObjectBuffers(gl, this.buildings[i].roof, false, false, true);
	}
};

NVMCClient.initializeObjects = function (gl) {
	this.createObjects();
	this.createBuffers(gl);
};

NVMCClient.drawCar = function (gl) {
	this.sgl_renderer.begin();
	this.sgl_renderer.setTechnique(this.sgl_technique);

	this.sgl_renderer.setGlobals({
		"PROJECTION_MATRIX": this.projectionMatrix,
		"WORLD_VIEW_MATRIX": this.stack.matrix,
		"VIEW_SPACE_NORMAL_MATRIX": SglMat4.to33(this.stack.matrix),
		"LIGHTS_GEOMETRY": this.sunLightDirectionViewSpace,
		"LIGHT_COLOR": [0.9, 0.9, 0.9],
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
			"aDiffuse": [0.0, 0.0, 0.8, 0.0]
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
			"uLightDirection": {
				semantic: "LIGHTS_GEOMETRY",
				value: this.lightsGeometryViewSpace
			},
			"uLightColor": {
				semantic: "LIGHT_COLOR",
				value: this.lightColor
			},
		}
	});
};
NVMCClient.drawScene = function (gl) {
    if(NVMCClient.n_resources_to_wait_for>0) return;
	var width = this.ui.width;
	var height = this.ui.height
	var ratio = width / height;
	var stack = this.stack;

	gl.viewport(0, 0, width, height);
	// Clear the framebuffer
	gl.clearColor(0.4, 0.6, 0.8, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.enable(gl.DEPTH_TEST);

	stack.loadIdentity();

	if (this.currentCamera == 3) {
		gl.useProgram(this.perVertexColorShader);
		gl.enable(gl.STENCIL_TEST);
		gl.clearStencil(0);
		gl.stencilMask(~0);
		gl.stencilFunc(gl.ALWAYS, 1, 0xFF);
		gl.stencilOp(gl.REPLACE, gl.REPLACE, gl.REPLACE);

		gl.uniformMatrix4fv(this.perVertexColorShader.uModelViewMatrixLocation, false, SglMat4.identity());
		gl.uniformMatrix4fv(this.perVertexColorShader.uProjectionMatrixLocation, false, SglMat4.identity());
		this.drawObject(gl, this.cabin, this.perVertexColorShader, [0.4, 0.8, 0.9, 1.0], [0.4, 0.8, 0.9, 1.0]);

		gl.stencilFunc(gl.GREATER, 1, 0xFF);
		gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
		gl.stencilMask(0);

	} else
		gl.disable(gl.STENCIL_TEST);

	// Setup projection matrix
	gl.useProgram(this.uniformShader);

	this.projectionMatrix = SglMat4.perspective(3.14 / 4, ratio, 1, 1000);
	this.cameras[2].projectionMatrix = this.projectionMatrix;
	gl.uniformMatrix4fv(this.uniformShader.uProjectionMatrixLocation, false, this.projectionMatrix);

	var pos = this.game.state.players.me.dynamicState.position;
	var orientation = this.game.state.players.me.dynamicState.orientation;
	this.cameras[this.currentCamera].setView(this.stack, this.myFrame());

	this.sunLightDirectionViewSpace = SglMat4.mul4(this.stack.matrix, this.sunLightDirection);

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
	
	gl.activeTexture(gl.TEXTURE0);//line 318,Listing 7.4
	gl.bindTexture(gl.TEXTURE_2D, this.texture_ground);
	gl.uniform1i(this.textureShader.uTextureLocation, 0);//line 320}
	
	this.drawObject(gl, this.ground, this.textureShader, [0.3, 0.7, 0.2, 1.0], [0, 0, 0, 1.0]);
	gl.bindTexture(gl.TEXTURE_2D, this.texture_street);
	this.drawObject(gl, this.track, this.textureShader, [0.9, 0.8, 0.7, 1.0], [0, 0, 0, 1.0]);

	
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

	gl.disable(gl.DEPTH_TEST);
	if (this.currentCamera == 3) {
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

	this.stack = new SglMatrixStack();
	this.projection_matrix = SglMat4.identity();

	this.initializeObjects(gl);
	this.initializeCameras();
	this.uniformShader = new uniformShader(gl);
	this.perVertexColorShader = new perVertexColorShader(gl);
	this.lambertianSingleColorShader = new lambertianSingleColorShader(gl);
	this.lambertianShader = new lambertianShader(gl);
	this.phongShader = new phongShader(gl);
	this.textureShader = new textureShader(gl);


	this.texture_street = this.createTexture(gl, 				NVMC.resource_path+'textures/street4.png');//line 398, Listing 7.2{
	this.texture_ground = this.createTexture(gl, 				NVMC.resource_path+'textures/grass_tile_003_col.png');//line 300}
	NVMCClient.texture_facade.push(this.createTexture(gl,       NVMC.resource_path+'textures/facade1.jpg'));
	NVMCClient.texture_facade.push(this.createTexture(gl,       NVMC.resource_path+'textures/facade2.jpg'));
	NVMCClient.texture_facade.push(this.createTexture(gl,       NVMC.resource_path+'textures/facade3.jpg'));
	NVMCClient.texture_roof = this.createTexture(gl,			NVMC.resource_path+'textures/concreteplane2k.jpg');


	this.loadCarModel(gl,NVMC.resource_path+"geometry/cars/eclipse/eclipse-white.obj");
	this.createCarTechnique(gl, this.lambertianShader);
};

/***********************************************************************/
