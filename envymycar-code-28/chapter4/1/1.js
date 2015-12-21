// Global NVMC Client
// ID 4.1
/***********************************************************************/
var NVMCClient = NVMCClient || {};
var TIMER = 0;
//var BALLTRANSLATE=0;
//var BALLGOING = false;
var BALLSARRAY1 = [];
var BALLSARRAY2 = [];
var GAMEOVER = true;
var POINTS = 0;
var CANNON1 = {
	color: [.2, .2, .2, 1.0],
	scale: 0,
	position: [0,0,0],
	count: 0,
	translate: [0,0,0]
};
var CANNON2 = {
	color: [.2, .2, .2, 1.0],
	scale: 0,
	position: [0,0,0],
	count: 0,
	translate: [0,0,0]
};

//randomly generate positions
var tmp1 = Math.floor(Math.random() * 10) - 5;
var tmp2 = Math.floor(Math.random() * 10) - 20;
var tmp3 = Math.floor(Math.random() * 10) - 5;
var tmp4 = Math.floor(Math.random() * 10) - 20;
var tmp5 = Math.floor(Math.random() * 10) - 5;
var tmp6 = Math.floor(Math.random() * 10) - 20;

var OBSTACLES = {
	obstacles: [
    	{
      		position : [ tmp1, 1, tmp2],
      		height   : [.1, .2]
    	},
		{
      		position : [ tmp3, 1, tmp2],
      		height   : [.1, .1]
    	},
    	{
      		position : [ tmp3, 1, tmp4],
      		height   : [.2, -.1]
    	},
    	{
      		position : [ tmp5, 1, tmp4],
      		height   : [-.2, .1]
    	},
    	{
      		position : [ tmp5, 1, tmp6],
      		height   : [.2, .1]
    	}
  	]
};
var MAXSPEED = 40;
var INTEGRAL = 100;
// var BUTTONPRESS = false;
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
		var T = SglMat4.translation([0.0, 5.5, 8.5]);
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
	//if (this.n_cameras - 1 > this.currentCamera)
	//	this.currentCamera++;
};
NVMCClient.prevCamera = function () {
	//if (0 < this.currentCamera)
	//	this.currentCamera--;
};

NVMCClient.incrementCannon = function(gl, array, cannonPos, x1, z1, cannonNum){
	var stack=this.stack;
	z=cannonPos[2];
	x=cannonPos[0];

	var pos = this.myPos();

	//for each cannonball
	for(var i = 0; i<array.length; i++){
		if(array[i].translateZ >= 25){
			POINTS+=10;
			//remove BALLSARRAY[0] since that's what it should be.
			array.shift();
			i--;
		}
		else{
			
			m = (z-z1)/(x-x1);
			array[i].translateZ += .2;
			newZ = z + array[i].translateZ;
			newX = x1 + ((newZ - z1)/m);
			//BALLSARRAY[i].translateX = x1 + ((BALLSARRAY[i].translateZ - z1)/m);
			array[i].translateX = newX - x;

			//detect collisions


		      //detect collision with character
			var distance = Math.sqrt(Math.pow((x1 - newX), 2) + Math.pow((z1-newZ), 2));
			
			if(distance <= 1) {
				if((array[i].colorStr == "red") && (this.getButtonPress() != "N")){
					// BALLSARRAY1 = [];
					// BALLSARRAY2 = [];
					// GAMEOVER=true;
					// this.setBodyColor([.2, .2, .2, 1.0]);
					// NVMC.log("Game Over! Points: " + POINTS);
					// INTEGRAL = 100;
					// POINTS = 0;
				}
				else if((array[i].colorStr == "blue") && (this.getButtonPress() != "M")){
					// BALLSARRAY1 = [];
					// BALLSARRAY2 = [];
					// GAMEOVER=true;
					// this.setBodyColor([.2, .2, .2, 1.0]);
					// NVMC.log("Game Over! Points: " + POINTS);
					// INTEGRAL = 100;
				 //      POINTS = 0;
				}
			      else if ((array[i].colorStr == "yellow") && (this.getButtonPress() != "I")){
					// BALLSARRAY1 = [];
					// BALLSARRAY2 = [];
					// GAMEOVER=true;
					// this.setBodyColor([.2, .2, .2, 1.0]);
					// NVMC.log("Game Over! Points: " + POINTS);
				 //      POINTS = 0;
				 //    INTEGRAL = 100;
				}
				else{
					stack.push();
					var M_9 = this.myFrame();
					stack.multiply(M_9);
					this.generateBall(gl, array[i].translateX, array[i].translateZ, array[i].color, cannonNum);
					stack.pop();
				}
			}
			else{


				//detect collision with obstacles
				var obs = OBSTACLES.obstacles;
				for (var j in obs) {

					var temp1 = pos[0] + obs[j].position[0];
					var temp2 = pos[2] + obs[j].position[2];
				
					var dist = Math.sqrt(Math.pow((temp1 - newX), 2) + Math.pow((temp2-newZ), 2));
				
					if(dist <= .5) {
						//console.log("HIT!");
						array[i].color = [.8, .6, .2, 1.0];
						array[i].colorStr = "yellow";
						obs[j].height[0] *= -1;
						obs[j].height[1] *= -1;
					}
				}
				stack.push();
				var M_9 = this.myFrame();
				stack.multiply(M_9);
				this.generateBall(gl, array[i].translateX, array[i].translateZ, array[i].color, cannonNum);
				stack.pop();
			}
		}
	}
}

NVMCClient.createBallObj = function (gl, array, cannonNum) {
	var stack = this.stack;
	stack.push();
	var M_9 = this.myFrame();
	stack.multiply(M_9);
	var red=Math.floor((Math.random() * 2));
	var green=Math.floor((Math.random() * 2));
	var blue=Math.floor((Math.random() * 2));
	var cString = "";
	if(red == 1){
		green=0;
		blue=0;
		cString = "red";
	}
	else{
		blue=1;
		green=1;
		cString = "blue";
	}
	var ballObj = {
		translateX: 0,
		translateZ: 0,
		color: [red, green, blue, 1.0],
		colorStr: cString
	};
	array.push(ballObj)
	this.generateBall(gl, 0, 0, ballObj.color, cannonNum); //cannonNum
	stack.pop();
}

NVMCClient.drawScene = function (gl) {

	GAMEOVER = this.getGameover();

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

	//stack.push();
	//stack.multiply(M_9);
	//this.drawRandomBalls(gl);
	//stack.pop();
	TIMER += 1;

	//for each current cannon, translate, and make sure there are no collisions.
	CANNON1.position = [pos[0]-10, pos[1], pos[2]-20];
	CANNON1.translate = [-10, 1, -20];
	CANNON2.position = [pos[0]+10, pos[1], pos[2]-20];
	CANNON2.translate = [10, 1, -20];
	this.incrementCannon(gl, BALLSARRAY1, CANNON1.position, pos[0], pos[2], 0);
	this.incrementCannon(gl, BALLSARRAY2, CANNON2.position, pos[0], pos[2], 1);

	if(GAMEOVER == false){	

		//generate a ball every 50-100 seconds
		//var randIntegral = (Math.floor(Math.random()) * 100 + 70);
		var randVar = Math.floor((Math.random() * 2));
		var tempArray;
		var tempCannon;
		if(randVar==0){
			tempArray=BALLSARRAY1;
			tempCannon=CANNON1;
		}
		else{
			tempArray=BALLSARRAY2;
			tempCannon=CANNON2;
		}
		if((TIMER % INTEGRAL) == 0){
			TIMER=0;
			this.createBallObj(gl, tempArray, randVar);
			if(INTEGRAL >= MAXSPEED){
				if(INTEGRAL >= (MAXSPEED-10)){
					INTEGRAL -= 1;
				}
				else{
					INTEGRAL -= .1;
				}
			}
		}
		else if((TIMER % INTEGRAL)==15){
			CANNON1.count=1;
			CANNON2.count=1;
		}
		if(CANNON1.count != 0){
			this.prepareCannon(gl, CANNON1);
		}
		if(CANNON2.count != 0){
			this.prepareCannon(gl, CANNON2);
		}

		// if(((TIMER+50) % 100) == 0){
		// 	this.createBallObj(gl, BALLSARRAY2, 1);
		// }
		// else if(((TIMER+50) % 100)==10){
		// 	CANNON2.count=1;
		// }
		// if(CANNON2.count != 0){
		// 	this.prepareCannon(gl, CANNON2);
		// }
	}

	stack.push();
	var M_9 = this.myFrame();
	stack.multiply(M_9);
	this.drawCannon(gl, CANNON1);
	this.drawCannon(gl, CANNON2);
	stack.pop();

	if(GAMEOVER == false){

		var obstacles = OBSTACLES.obstacles;
		for (var o in obstacles){
			stack.push();
			var M_9 = this.myFrame();
		    stack.multiply(M_9);
			var M_o = SglMat4.translation(obstacles[o].position);
			stack.multiply(M_o);
			var M_0_sca = SglMat4.scaling([.5, .5, .5]);
			stack.multiply(M_0_sca);

			if((obstacles[o].position[0] > 10) || (obstacles[o].position[0] < -10)) {
				obstacles[o].height[0] *= -1;
			}
			if((obstacles[o].position[2] < -25) || (obstacles[o].position[2] > -6)){
				obstacles[o].height[1] *= -1;
			}
			obstacles[o].position[0] += obstacles[o].height[0];
			obstacles[o].position[2] += obstacles[o].height[1];
			this.drawObstacle(gl);
			stack.pop();

			//detect collision of obstacles with cannon
			var temp1 = obstacles[o].position[0];
			var temp2 = obstacles[o].position[2];
			var d1 = Math.sqrt(Math.pow(temp1 - CANNON1.translate[0], 2) + Math.pow(temp2 - CANNON1.translate[2], 2));
			var d2 = Math.sqrt(Math.pow(temp1 - CANNON2.translate[0], 2) + Math.pow(temp2 - CANNON2.translate[2], 2));
			if(d1 < 2 || d2 < 2){
				console.log("TRRDDD");
				obstacles[o].height[0] *= -1;
				obstacles[o].height[1] *= -1;
			}

		}
	}

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
