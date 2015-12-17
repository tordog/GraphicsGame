// Global NVMC Client
// ID 4.1
/***********************************************************************/
var NVMCClient = NVMCClient || {};
var TIMER = 0;
//var BALLTRANSLATE=0;
//var BALLGOING = false;
var BALLSARRAY = [];
/***********************************************************************/

function PhotographerCamera() {//line 7, Listing 4.6
	this.position = [0, 0, 0];
	this.orientation = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
	this.t_V = [0, 0, 0];
	this.orienting_view = false;
	this.lockToCar = false;
	this.start_x = 0;
	this.start_y = 0;

	var me = this;
	this.handleKey = {};
	this.handleKey["Q"] = function () {me.t_V = [0, 0.1, 0];};
	this.handleKey["E"] = function () {me.t_V = [0, -0.1, 0];};
	this.handleKey["L"] = function () {me.lockToCar= true;};
	this.handleKey["U"] = function () {me.lockToCar= false;};

	this.keyDown = function (keyCode) {
		if (this.handleKey[keyCode])
			this.handleKey[keyCode](true);
	}

	this.keyUp = function (keyCode) {
		this.delta = [0, 0, 0];
	}

	this.mouseMove = function (x,y) {
		if (!this.orienting_view) return;

		var alpha	= (x - this.start_x)/10.0;
		var beta	= -(y - this.start_y)/10.0;
		this.start_x = x;
		this.start_y = y;

		var R_alpha = SglMat4.rotationAngleAxis(sglDegToRad( alpha  ), [0, 1, 0]);
		var R_beta = SglMat4.rotationAngleAxis(sglDegToRad (beta  ), [1, 0, 0]);
		this.orientation = SglMat4.mul(SglMat4.mul(R_alpha, this.orientation), R_beta);
	};

	this.mouseButtonDown = function (x,y) {
		if (!this.lock_to_car) {
			this.orienting_view = true;
			this.start_x = x;
			this.start_y = y;
		}
	};

	this.mouseButtonUp = function () {
		this.orienting_view = false;
	}

	this.updatePosition = function ( t_V ){
		this.position = SglVec3.add(this.position, SglMat4.mul3(this.orientation,  t_V));
		if (this.position[1] > 1.8) this.position[1] = 1.8;
		if (this.position[1] < 0.5) this.position[1] = 0.5;
	}

	this.setView = function (stack, carFrame) {
		this.updatePosition (this.t_V )
		var car_position = SglMat4.col(carFrame,3);
		if (this.lockToCar)
			var invV = SglMat4.lookAt(this.position, car_position, [0, 1, 0]);
		else
			var invV = SglMat4.lookAt(this.position, SglVec3.sub(this.position, SglMat4.col(this.orientation, 2)), SglMat4.col(this.orientation, 1));
		stack.multiply(invV);
	};
};//line 42}

function ChaseCamera() {//line 74, Listnig 4.5{
	this.position 				= [0.0,0.0,0.0];
	this.keyDown 					= function (keyCode) {}
	this.keyUp						= function (keyCode) {}
	this.mouseMove				= function (event) {};
	this.mouseButtonDown	= function (event) {};
	this.mouseButtonUp 		= function () {}
	this.setView 					= function ( stack, F_0) {
		var Rx = SglMat4.rotationAngleAxis(sglDegToRad(-15), [1.0, 0.0, 0.0]);
		var T = SglMat4.translation([0.0, 2.5, 4.5]);
		var Vc_0 = SglMat4.mul(T, Rx);
		var V_0 = SglMat4.mul(F_0, Vc_0);
		this.position = SglMat4.col(V_0,3);
		var invV = SglMat4.inverse(V_0);
		stack.multiply(invV);
	};
};//line 90}

NVMCClient.cameras = [];
NVMCClient.cameras[0] = new ChaseCamera();
NVMCClient.cameras[1] = new PhotographerCamera();
NVMCClient.n_cameras = 2;
NVMCClient.currentCamera = 0;

NVMCClient.nextCamera = function () {
	if (this.n_cameras - 1 > this.currentCamera)
		this.currentCamera++;
};
NVMCClient.prevCamera = function () {
	if (0 < this.currentCamera)
		this.currentCamera--;
};

NVMCClient.drawScene = function (gl) {
	var width = this.ui.width;
	var height = this.ui.height
	var ratio = width / height;

	gl.viewport(0, 0, width, height);

	// Clear the framebuffer
	gl.clearColor(0.4, 0.6, 0.8, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.enable(gl.DEPTH_TEST);
	gl.useProgram(this.uniformShader);

	var stack = this.stack;
	stack.loadIdentity();

	// Setup projection matrix
	gl.uniformMatrix4fv(this.uniformShader.uProjectionMatrixLocation, false, SglMat4.perspective(3.14 / 4, ratio, 1, 200));

	var pos = this.myPos();
	//console.log(pos);
	this.cameras[this.currentCamera].setView(this.stack, this.myFrame());

	var tra = SglMat4.translation([20, 0, 0]);
	stack.multiply(tra);

	tra = SglMat4.translation([-20, 0, 0]);
	stack.multiply(tra);

	stack.push();
	var M_9 = this.myFrame();
	stack.multiply(M_9);
	//this.drawCar(gl);
	this.drawCharacter(gl);
	stack.pop();
	TIMER += 1;

	//for all objects in array...
	// if (BALLGOING == true){
	// 	// BALLTRANSLATE += 1;
	// 	// if BALLTRANSLATE >= 20){
	// 	// 	BALLTRANSLATE = 0;
	// 	// 	BALLGOING = false;
	// 	// }
	// 	// this.generateBall(gl, BALLTRANSLATE);
	// }

	//line stuff
	cannonPos = [pos[0]-10, pos[1], pos[2]-20];
	//line from pos to cannonPos? to generate an x, y.

	
	//increment z by 1 each time.
	// z+=1;
	// x = x1 + ((z-z1) / m);

	z1=pos[2];
	z=cannonPos[2];
	x1=pos[0];
	x=cannonPos[0];


	for(var i = 0; i<BALLSARRAY.length; i++){
		if(BALLSARRAY[i].translateBall >= 20){
			//remove BALLSARRAY[0] since that's what it should be.
			BALLSARRAY.shift();
			i--;
		}
		else{
			
			m = (z-z1)/(x-x1);
			BALLSARRAY[i].translateZ += 1;
			newZ = z + BALLSARRAY[i].translateZ;
			newX = x1 + ((newZ - z1)/m);
			//BALLSARRAY[i].translateX = x1 + ((BALLSARRAY[i].translateZ - z1)/m);
			BALLSARRAY[i].translateX = newX - x;
			//console.log(BALLSARRAY[i].translateX)
			//BALLSARRAY[i].translateX = 0;
			stack.push();
			var M_9 = this.myFrame();
			stack.multiply(M_9);
			this.generateBall(gl, BALLSARRAY[i].translateX, BALLSARRAY[i].translateZ);
			stack.pop();
		}
	}

	if((TIMER % 100) == 0){
		TIMER = 0;
		stack.push();
		var M_9 = this.myFrame();
		stack.multiply(M_9);
		var ballObj = {
			ballGoing: true,
			translateX: 0,
			translateZ: 0,
			color: [1.0, 0.0, 0.0]
		};
		BALLSARRAY.push(ballObj)
		this.generateBall(gl, 0, 0);
		stack.pop();
	
	}

	stack.push();
	var M_9 = this.myFrame();
	stack.multiply(M_9);
	this.drawCannon(gl);
	stack.pop();

	// var trees = this.game.race.trees;
	// for (var t in trees) {
	// 	stack.push();
	// 	var M_8 = SglMat4.translation(trees[t].position);
	// 	stack.multiply(M_8);
	// 	this.drawTree(gl);
	// 	stack.pop();
	// }

	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	//this.drawObject(gl, this.track, [0.9, 0.8, 0.7, 1.0], [0, 0, 0, 1.0]);
	this.drawObject(gl, this.ground, [0.1, 0.2, 0.4, 1.0], [0, 0, 0, 1.0]);

	// for (var i in this.buildings) {
	// 	this.drawObject(gl, this.buildings[i], [0.8, 0.8, 0.8, 1.0], [0, 0, 0, 1.0]);
	// }

	gl.useProgram(null);
	gl.disable(gl.DEPTH_TEST);
};
/***********************************************************************/
NVMCClient.initializeCameras = function () {
	this.cameras[1].position = this.game.race.photoPosition;
};

// NVMC Client Events
/***********************************************************************/
NVMCClient.onInitialize = function () {
	var gl = this.ui.gl;

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

	this.initializeObjects(gl);
	this.initializeCameras();
	this.uniformShader = new uniformShader(gl);
	/*************************************************************/
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

	if (this.carMotionKey[keyCode])
		this.carMotionKey[keyCode](false);

	this.cameras[this.currentCamera].keyUp(keyCode);
};
NVMCClient.onKeyDown = function (keyCode, event) {

	if (this.carMotionKey[keyCode])
		this.carMotionKey[keyCode](true);

	this.cameras[this.currentCamera].keyDown(keyCode);
};

NVMCClient.onMouseButtonDown = function (button, x, y, event) {
	this.cameras[this.currentCamera].mouseButtonDown(x,y);
};

NVMCClient.onMouseButtonUp = function (button, x, y, event) {
	this.cameras[this.currentCamera].mouseButtonUp();
};

NVMCClient.onMouseMove = function (x, y, event) {
	this.cameras[this.currentCamera].mouseMove(x,y);
};
