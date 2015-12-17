// Global NVMC Client
// ID 4.0
/***********************************************************************/
var NVMCClient = NVMCClient || {};
var frontWheelRotate = 0;
var KEYROTATE = -1;
var KEYTRANSLATE = [0, 0, 0];
var ROTATEBY = 0;
var TRANSLATEBY = 0;
var ROTATEPOS = true;
var UNIT = 1;
var SWITCHED = false;
var CANNONTRANSLATE = 0;
/***********************************************************************/

NVMCClient.myPos = function () {
	return this.game.state.players.me.dynamicState.position;
}
NVMCClient.myOri = function () {
	return this.game.state.players.me.dynamicState.orientation;
}

NVMCClient.myFrame = function () {
	return this.game.state.players.me.dynamicState.frame;
}

// NVMC Client Internals
/***********************************************************************/
NVMCClient.createObjectBuffers = function (gl, obj) {
	obj.vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, obj.vertices, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

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

NVMCClient.drawObject = function (gl, obj, fillColor, lineColor) {
	gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
	gl.enableVertexAttribArray(this.uniformShader.aPositionIndex);
	gl.vertexAttribPointer(this.uniformShader.aPositionIndex, 3, gl.FLOAT, false, 0, 0);

	gl.enable(gl.POLYGON_OFFSET_FILL);
	gl.polygonOffset(1.0, 1.0);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferTriangles);
	gl.uniform4fv(this.uniformShader.uColorLocation, fillColor);
	gl.drawElements(gl.TRIANGLES, obj.triangleIndices.length, gl.UNSIGNED_SHORT, 0);

	gl.disable(gl.POLYGON_OFFSET_FILL);

	gl.uniform4fv(this.uniformShader.uColorLocation, lineColor);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferEdges);
	gl.drawElements(gl.LINES, obj.numTriangles * 3 * 2, gl.UNSIGNED_SHORT, 0);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

	gl.disableVertexAttribArray(this.uniformShader.aPositionIndex);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
};

NVMCClient.createObjects = function () {
	this.cube = new Cube(10);
	this.cylinder = new Cylinder(10);
	this.cone = new Cone(10);
	this.sphere = new SphereSubd(10);


	this.track = new Track(this.game.race.track);
	var bbox = this.game.race.bbox;
	var quad = [bbox[0], bbox[1] - 0.01, bbox[2],
		bbox[3], bbox[1] - 0.01, bbox[2],
		bbox[3], bbox[1] - 0.01, bbox[5],
		bbox[0], bbox[1] - 0.01, bbox[5]
	];

	this.ground = new Quadrilateral(quad);

	var gameBuildings = this.game.race.buildings;
	this.buildings = new Array(gameBuildings.length);
	for (var i = 0; i < gameBuildings.length; ++i) {
		this.buildings[i] = new Building(gameBuildings[i]);
	}
};

NVMCClient.createBuffers = function (gl) {
	this.createObjectBuffers(gl, this.cube);
	this.createObjectBuffers(gl, this.cylinder);
	this.createObjectBuffers(gl, this.cone);
	this.createObjectBuffers(gl, this.track);
	this.createObjectBuffers(gl, this.ground);
	this.createObjectBuffers(gl, this.sphere);

	for (var i = 0; i < this.buildings.length; ++i) {
		this.createObjectBuffers(gl, this.buildings[i]);
	}
};

NVMCClient.initializeObjects = function (gl) {
	this.createObjects();
	this.createBuffers(gl);
};

NVMCClient.drawLeg = function(gl) {
	var stack = this.stack;
	stack.push();

	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.sphere, [0.0, 0.7, 0.2, 1.0], [0, 0, 0, 1.0]);
	// var M_3_sca = SglMat4.scaling([1, 10, 1]);
	// stack.multiply(M_3_sca);
	stack.pop();
}

NVMCClient.drawBody = function (gl) {

	//when we hit a key, we want to rotate by 5 degrees until we've reached 90. let's not do translation for now.

	var stack = this.stack;
	stack.push();
	if(KEYROTATE != -1){
		if(KEYROTATE != 0){
			if(KEYROTATE == 1){
				KEYROTATE=0;
			}
			if (ROTATEPOS){
				KEYROTATE -= 5;
				ROTATEBY += 5;
			}
			else {
				KEYROTATE += 5;
				ROTATEBY -= 5;
			}
			if(SWITCHED && Math.abs(KEYROTATE) == 90){
				KEYROTATE = -1;
				ROTATEBY = 0;
				SWITCHED=false;
				TRANSLATEBY=0;
			}
			TRANSLATEBY += (6.0/90) * UNIT;
		}
		else{
			if(ROTATEPOS){
				ROTATEPOS = false;
			}
			else {
				ROTATEPOS = true;
			}
			KEYROTATE = 1;
			//TRANSLATEBY += (6.0/90);
			// ROTATEBY = 0;
			UNIT = -1;
			SWITCHED = true;
		}
	}


	var M_OverallTranslate = SglMat4.translation([0, TRANSLATEBY, 0]);
	stack.multiply(M_OverallTranslate);
	var M_OverallRotate = SglMat4.rotationAngleAxis(sglDegToRad(ROTATEBY), [0, 0, 1]);
	stack.multiply(M_OverallRotate);
	var M_up = SglMat4.translation([0, .15, 0]);
	stack.multiply(M_up);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.sphere, [0.0, 0.7, 0.2, 1.0], [0, 0, 0, 1.0]);

	stack.push();
	var M_3_rot2 = SglMat4.rotationAngleAxis(sglDegToRad(30), [0, 0, 1]);
	stack.multiply(M_3_rot2);
	var M_3_sca = SglMat4.scaling([.25, .5, .25]);
	stack.multiply(M_3_sca);
	var M_5 = SglMat4.translation([3.5, -1.5, 0]);
	stack.multiply(M_5);

	
	this.drawLeg(gl);
	stack.pop();


	stack.push();
	var M_3_rot2 = SglMat4.rotationAngleAxis(sglDegToRad(-30), [0, 0, 1]);
	stack.multiply(M_3_rot2);
	var M_3_sca = SglMat4.scaling([.25, .5, .25]);
	stack.multiply(M_3_sca);
	var M_5 = SglMat4.translation([-3.5, -1.5, 0]);
	stack.multiply(M_5);

	this.drawLeg(gl);
	stack.pop();

	stack.push();


	var M_3_rot2 = SglMat4.rotationAngleAxis(sglDegToRad(45), [0, 0, 1]);
	stack.multiply(M_3_rot2);
	var M_3_sca = SglMat4.scaling([.2, .3, .2]);
	stack.multiply(M_3_sca);
	var M_5 = SglMat4.translation([3, 4.5, 0]);
	stack.multiply(M_5);

	this.drawLeg(gl);
	stack.pop();
	// this.drawArm(gl)

	stack.push();
	var M_3_rot2 = SglMat4.rotationAngleAxis(sglDegToRad(-45), [0, 0, 1]);
	stack.multiply(M_3_rot2);
	var M_3_sca = SglMat4.scaling([.2, .3, .2]);
	stack.multiply(M_3_sca);
	var M_5 = SglMat4.translation([-3, 4.5, 0]);
	stack.multiply(M_5);

	this.drawLeg(gl);
	stack.pop();

	// this.drawArm(gl)

	stack.pop();

}

NVMCClient.drawCharacter = function (gl) {
	var stack = this.stack;
	stack.push();
	this.drawBody(gl);
	stack.pop();
}


NVMCClient.drawGroup = function (gl) {
	var stack = this.stack;
	stack.push();
	this.drawCharacter(gl);
	stack.pop();
};

NVMCClient.drawTree = function (gl) {
	var stack = this.stack;

	stack.push();
	var M_0_tra1 = SglMat4.translation([0, 0.8, 0]);
	stack.multiply(M_0_tra1);

	var M_0_sca = SglMat4.scaling([26, 1.65, 0.6]);
	stack.multiply(M_0_sca);

	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.cone, [0.13, 0.62, 0.39, 1.0], [0, 0, 0, 1.0]);
	stack.pop();

	stack.push();
	var M_1_sca = SglMat4.scaling([0.25, 0.4, 0.25]);
	stack.multiply(M_1_sca);

	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.cylinder, [0.70, 0.56, 0.35, 1.0], [0, 0, 0, 1.0]);
	stack.pop();
};

NVMCClient.drawCannon = function (gl) {
	var stack = this.stack;
	var array = [[10, 1, -20], [-10, 1, -20]]
	for(var i=0; i<2; i++){
		stack.push();
		var M_OverallTranslate = SglMat4.translation(array[i]);
		stack.multiply(M_OverallTranslate);
		
		gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
		this.drawObject(gl, this.cube, [0.0, 0.2, 0.2, 1.0], [0, 0, 0, 1.0]);

		stack.pop();
	}
	
};


NVMCClient.generateBall = function (gl, translateX, translateZ) {
	var stack = this.stack;
	var array = [[10, 0, -20], [-10, 0, -20]]

	stack.push();
	var M_OverallTranslate = SglMat4.translation(array[1]);
	stack.multiply(M_OverallTranslate);
	M_translate = SglMat4.translation([translateX, 0, translateZ]);
	stack.multiply(M_translate);
	// tra = SglMat4.translation([0, 0, z]);
	// stack.multiply(tra);
	
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.sphere, [0.0, 0.2, 0.2, 1.0], [0, 0, 0, 1.0]);

	stack.pop();
	
	
};

NVMCClient.drawScene = function (gl) {
	var pos = this.myPos();

	var width = this.ui.width;
	var height = this.ui.height

	gl.viewport(0, 0, width, height);

	// Clear the framebuffer
	gl.clearColor(0.4, 0.6, 0.8, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.enable(gl.DEPTH_TEST);
	gl.useProgram(this.uniformShader);


	// Setup projection matrix
	var ratio = width / height; //line 229, Listing 4.1{
	var bbox = this.game.race.bbox;
	var winW = (bbox[3] - bbox[0]);
	var winH = (bbox[5] - bbox[2]);
	winW = winW * ratio * (winH / winW);
	var P = SglMat4.ortho([-winW / 2, -winH / 2, 0.0], [winW / 2, winH / 2, 21.0]);
	gl.uniformMatrix4fv(this.uniformShader.uProjectionMatrixLocation, false, P);

	var stack = this.stack;
	stack.loadIdentity(); //line 238}
	// create the inverse of V //line 239, Listing 4.2{
	var invV = SglMat4.lookAt([0, 20, 0], [0, 0, 0], [1, 0, 0]);
	stack.multiply(invV);
	
	stack.push();//line 242
	
	var M_9 = this.myFrame();
	stack.multiply(M_9);
	this.drawGroup(gl);
	stack.pop();


	// var trees = this.game.race.trees;
	// for (var t in trees) {
	 //	stack.push();
	 	//var torie = SglMat4.scaling([20, 20, 20]);
	 	//var M_8 = SglMat4.translation(trees[t].position);
	 	//stack.multiply(torie);
	 //	this.drawTree(gl);
	 //	stack.pop();
	// }

	//gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	// this.drawObject(gl, this.track, [0.9, 0.8, 0.7, 1.0], [0, 0, 0, 1.0]);
	//this.drawObject(gl, this.ground, [0.3, 0.7, 0.2, 1.0], [0, 0, 0, 1.0]);

	// for (var i in this.buildings) {
	// 	this.drawObject(gl, this.buildings[i], [0.8, 0.8, 0.8, 1.0], [0.2, 0.2, 0.2, 1.0]);
	// }
	gl.useProgram(null);
	gl.disable(gl.DEPTH_TEST);
};



/***********************************************************************/

NVMCClient.initMotionKeyHandlers = function () {
	var game = this.game;


	var carMotionKey = {};
	carMotionKey["W"] = function (on) {
		game.playerAccelerate = on;
		//frontWheelRotate = 0;
	};
	carMotionKey["S"] = function (on) {
		game.playerBrake = on;
		//frontWheelRotate = 0;
	};
	carMotionKey["A"] = function (on) {
		game.playerSteerLeft = on;
		//frontWheelRotate = 30;
	};
	carMotionKey["D"] = function (on) {
		game.playerSteerRight = on;
		//frontWheelRotate = -30;
	};
	carMotionKey["N"] = function (on) {
		if (KEYROTATE == -1){
			KEYROTATE = 90;
			ROTATEPOS = true;
			KEYTRANSLATE = [0, 2, 0];
			UNIT = 1;
		}
	};
	carMotionKey["M"] = function (on) {
		if (KEYROTATE == -1){
			KEYROTATE = -90;
			ROTATEPOS = false;
			KEYTRANSLATE = [0, 2, 0];
			UNIT = 1;
		}
	};
	this.carMotionKey = carMotionKey;
};

// NVMC Client Events
/***********************************************************************/
NVMCClient.onInitialize = function () {// line 290, Listing 4.2{
	var gl = this.ui.gl;
	NVMC.log("SpiderGL Version : " + SGL_VERSION_STRING + "\n");
	this.game.player.color = [1.0, 0.0, 0.0, 1.0];
	//NVMC.GamePlayers.addOpponent();
	this.initMotionKeyHandlers();
	this.stack = new SglMatrixStack();
	this.initializeObjects(gl); //LINE 297}
	this.uniformShader = new uniformShader(gl);
};

NVMCClient.onTerminate = function () {};

NVMCClient.onConnectionOpen = function () {
	NVMC.log("[Connection Open]");
};

NVMCClient.onConnectionClosed = function () {
	NVMC.log("[Connection Closed]");
};

NVMCClient.onConnectionError = function (errData) {
	NVMC.log("[Connection Error] : " + errData);
};

NVMCClient.onLogIn = function () {
	NVMC.log("[Logged In]");
};

NVMCClient.onLogOut = function () {
	NVMC.log("[Logged Out]");
};

NVMCClient.onNewRace = function (race) {
	NVMC.log("[New Race]");
};

NVMCClient.onPlayerJoin = function (playerID) {
	NVMC.log("[Player Join] : " + playerID);
	this.game.opponents[playerID].color = [0.0, 1.0, 0.0, 1.0];
};

NVMCClient.onPlayerLeave = function (playerID) {
	NVMC.log("[Player Leave] : " + playerID);
};

NVMCClient.onKeyDown = function (keyCode, event) {
	this.carMotionKey[keyCode] && this.carMotionKey[keyCode](true);
	this.dodgeBody(keyCode);
};

NVMCClient.onKeyUp = function (keyCode, event) {
	this.carMotionKey[keyCode] && this.carMotionKey[keyCode](false);
	frontWheelRotate = (-frontWheelRotate);
};

NVMCClient.onKeyPress = function (keyCode, event) {};

NVMCClient.onMouseButtonDown = function (button, x, y, event) {};

NVMCClient.onMouseButtonUp = function (button, x, y, event) {};

NVMCClient.onMouseMove = function (x, y, event) {};

NVMCClient.onMouseWheel = function (delta, x, y, event) {};

NVMCClient.onClick = function (button, x, y, event) {};

NVMCClient.onDoubleClick = function (button, x, y, event) {};

NVMCClient.onDragStart = function (button, x, y) {};

NVMCClient.onDragEnd = function (button, x, y) {};

NVMCClient.onDrag = function (button, x, y) {};

NVMCClient.onResize = function (width, height, event) {};

NVMCClient.onAnimate = function (dt) {
	this.ui.postDrawEvent();
};

NVMCClient.onDraw = function () {
	var gl = this.ui.gl;
	this.drawScene(gl);
};
/***********************************************************************/
