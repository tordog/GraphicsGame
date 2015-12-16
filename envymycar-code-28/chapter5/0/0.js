// Global NVMC Client
// ID 5.0
/***********************************************************************/
var NVMCClient = NVMCClient || {};
/***********************************************************************/

NVMCClient.cabin = null;
NVMCClient.windshield = null;
NVMCClient.rearmirror = null;

function DriverCamera() {
	this.position = [];
	this.keyDown = function (keyCode) {}
	this.keyUp = function (keyCode) {}

	this.mouseMove = function (event) {};

	this.mouseButtonDown = function (event) {};

	this.mouseButtonUp = function () {}

	this.setView = function (stack, frame) {
		var driverFrame = SglMat4.dup(frame);
		var pos = SglMat4.col(driverFrame, 3);
		SglMat4.col$(driverFrame, 3, SglVec4.add(pos, [0, 1.5, 0, 0]));
		var invV = SglMat4.inverse(driverFrame);
		stack.multiply(invV);
	};
};

NVMCClient.cameras[3] = new DriverCamera();
NVMCClient.n_cameras = 4;

NVMCClient.createObjects = function () {
	this.cube = new Cube(10);
	this.cylinder = new Cylinder(10);
	this.cone = new Cone(10);

	this.track = new Track(this.game.race.track);

	var bbox = this.game.race.bbox;
	var quad = [bbox[0], bbox[1] - 0.01, bbox[2],
		bbox[3], bbox[1] - 0.01, bbox[2],
		bbox[3], bbox[1] - 0.01, bbox[5],
		bbox[0], bbox[1] - 0.01, bbox[5]
	];
	this.ground = new Quadrilateral(quad);
	this.cabin = new Cabin();
	this.windshield = new Windshield();
	this.rearmirror = new RearMirror();

	var gameBuildings = this.game.race.buildings;
	this.buildings = new Array(gameBuildings.length);
	for (var i = 0; i < gameBuildings.length; ++i) {
		this.buildings[i] = new Building(gameBuildings[i]);
	}
};

NVMCClient.createColoredObjectBuffers = function (gl, obj) {
	obj.vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, obj.vertices, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	obj.colorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, obj.colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, obj.vertex_color, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	obj.indexBufferTriangles = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferTriangles);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, obj.triangleIndices, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

};

NVMCClient.createBuffers = function (gl) {
	this.createObjectBuffers(gl, this.cube);
	this.createObjectBuffers(gl, this.cylinder);
	this.createObjectBuffers(gl, this.cone);
	this.createObjectBuffers(gl, this.track);
	this.createObjectBuffers(gl, this.ground);
	this.createColoredObjectBuffers(gl, this.cabin);
	this.createColoredObjectBuffers(gl, this.windshield);
	this.createColoredObjectBuffers(gl, this.rearmirror);

	for (var i = 0; i < this.buildings.length; ++i) {
		this.createObjectBuffers(gl, this.buildings[i]);
	}
};

NVMCClient.drawColoredObject = function (gl, obj, lineColor) {
	// Draw the primitive
	gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
	gl.enableVertexAttribArray(this.perVertexColorShader.aPositionIndex);
	gl.vertexAttribPointer(this.perVertexColorShader.aPositionIndex, 3, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, obj.colorBuffer);
	gl.enableVertexAttribArray(this.perVertexColorShader.aColorIndex);
	gl.vertexAttribPointer(this.perVertexColorShader.aColorIndex, 4, gl.FLOAT, false, 0, 0);

	gl.enable(gl.POLYGON_OFFSET_FILL);

	gl.polygonOffset(1.0, 1.0);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferTriangles);
	gl.drawElements(gl.TRIANGLES, obj.triangleIndices.length, gl.UNSIGNED_SHORT, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, null);
};

NVMCClient.drawScene = function (gl) {
	var width = this.ui.width;
	var height = this.ui.height
	var ratio = width / height;
	var stack = this.stack;

	gl.viewport(0, 0, width, height);

	// Clear the framebuffer
	gl.clearColor(0.4, 0.6, 0.8, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

	gl.enable(gl.DEPTH_TEST);

	this.projectionMatrix = SglMat4.perspective(3.14 / 4, ratio, 1, 1000);
	stack.loadIdentity();

	if (this.currentCamera == 3) {
		gl.enable(gl.STENCIL_TEST);//line 130, Listing pag 159{
		gl.clearStencil(0);
		gl.stencilMask(~0);
		gl.stencilFunc(gl.ALWAYS, 1, 0xFF);
		gl.stencilOp(gl.REPLACE, gl.REPLACE, gl.REPLACE);

		gl.useProgram(this.perVertexColorShader);
		gl.uniformMatrix4fv(this.perVertexColorShader.uModelViewMatrixLocation, false, SglMat4.identity());
		gl.uniformMatrix4fv(this.perVertexColorShader.uProjectionMatrixLocation, false, SglMat4.identity());//line 138}
		this.drawColoredObject(gl, this.cabin, [0.4, 0.8, 0.9, 1.0]);//line 139, Listing 5.4{

		gl.stencilFunc(gl.EQUAL, 0, 0xFF);
		gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
		gl.stencilMask(0);//line 143}
	} else
		gl.disable(gl.STENCIL_TEST);

	var pos = this.myPos();
	var orientation = this.myOri();

	this.cameras[2].projectionMatrix = this.projectionMatrix;

	this.cameras[this.currentCamera].setView(this.stack, this.myFrame());

	if (this.currentCamera != 3) {
		stack.push();
		var M_9 = SglMat4.translation(pos);
		stack.multiply(M_9);

		var M_9bis = SglMat4.rotationAngleAxis(this.game.state.players.me.dynamicState.orientation, [0, 1, 0]);
		stack.multiply(M_9bis);

		gl.useProgram(this.uniformShader);
		gl.uniformMatrix4fv(this.uniformShader.uProjectionMatrixLocation, false, this.projectionMatrix);
		this.drawCar(gl);
		stack.pop();
	}

	gl.useProgram(this.uniformShader);
	gl.uniformMatrix4fv(this.uniformShader.uProjectionMatrixLocation, false, this.projectionMatrix);
	var trees = this.game.race.trees;
	for (var t in trees) {
		stack.push();
		var M_8 = SglMat4.translation(trees[t].position);
		stack.multiply(M_8);
		this.drawTree(gl);
		stack.pop();
	}

	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.track, [0.9, 0.8, 0.7, 1.0], [0, 0, 0, 1.0]);
	this.drawObject(gl, this.ground, [0.3, 0.7, 0.2, 1.0], [0, 0, 0, 1.0]);

	for (var i in this.buildings) {
		this.drawObject(gl, this.buildings[i], [0.2, 0.2, 0.2, 1.0], [0, 0, 0, 1.0]);
	}

	if (this.currentCamera == 3) {
		gl.enable(gl.BLEND);//line 188, Listing 5.5
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		gl.useProgram(this.perVertexColorShader);
		gl.uniformMatrix4fv(this.perVertexColorShader.uModelViewMatrixLocation, false, SglMat4.identity());
		gl.uniformMatrix4fv(this.perVertexColorShader.uProjectionLocation, false, SglMat4.identity());
		this.drawColoredObject(gl, this.windshield, [0.4, 0.8, 0.9, 1.0]);
		gl.disable(gl.BLEND);// line 194}

		gl.useProgram(this.perVertexColorShader);
		gl.uniformMatrix4fv(this.perVertexColorShader.uModelViewMatrixLocation, false, SglMat4.identity());
		gl.uniformMatrix4fv(this.perVertexColorShader.uProjectionMatrixLocation, false, SglMat4.identity());
		this.drawColoredObject(gl, this.rearmirror, [0.4, 0.8, 0.9, 1.0]);
	}

	gl.useProgram(null);
};
/***********************************************************************/

NVMCClient.onInitialize = function () {
	var gl = this.ui.gl;
	this.cameras[2].width = this.ui.width;
	this.cameras[2].height = this.ui.height;
    this.currentCamera = 3;

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

	this.initializeObjects(gl);
	this.initializeCameras();
	this.uniformShader = new uniformShader(gl);
	this.perVertexColorShader = new perVertexColorShader(gl);
	/*************************************************************/
};
