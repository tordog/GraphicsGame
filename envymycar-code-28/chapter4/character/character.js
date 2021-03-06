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
var BUTTONPRESS = false;
var JUMPPARAMS = [false, 0, 0, 45, 1.0]; //boolean, translateBy, counter, angle of rotation
var DODGEPARAMS = [0, 1, 1, 0]; //count, shadowscalex, shadowscalez
var ROTANGLE = 3;
var UNITR = 1;
var GAMEOVER = true;
var BODY_COLOR = [0.0, 0.7, 0.2, 1.0];
var HEAD_TRANS = 0;
var GAMESTART = false;
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
	this.sphere_size = new SphereSubdSize(10);


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
	this.createObjectBuffers(gl, this.sphere_size);

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
	this.drawObject(gl, this.sphere, BODY_COLOR, [0, 0, 0, 1.0]);
	// var M_3_sca = SglMat4.scaling([1, 10, 1]);
	// stack.multiply(M_3_sca);
	stack.pop();
}

NVMCClient.jump = function() {
	//translate up by 2
	JUMPPARAMS[3] = 45;
	if(JUMPPARAMS[2] == 30){
		JUMPPARAMS[0] = false;
		JUMPPARAMS[1]=0;
		JUMPPARAMS[2] = 0;
		BUTTONPRESS = false;
		JUMPPARAMS[3] = 0;
		JUMPPARAMS[4] = 1.0;
	}
	else if(JUMPPARAMS[2]<=15){
		JUMPPARAMS[1] += .1;
	}
	else{
		JUMPPARAMS[1] -= .1;
	}
	JUMPPARAMS[2]++;

}

NVMCClient.getGameover = function () {
	return GAMEOVER;
}

NVMCClient.dodge = function () {

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
				BUTTONPRESS=false;
				JUMPPARAMS[0] = false;
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

}

NVMCClient.drawHead = function (gl) {
	var stack = this.stack;
	stack.push();

	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.sphere, BODY_COLOR, [0, 0, 0, 1.0]);
	// var M_3_sca = SglMat4.scaling([1, 1, 1]);
	// stack.multiply(M_3_sca);

	//stack.push();

	//var M_3_sca = SglMat4.scaling([.3, .3, .3]);
	//stack.multiply(M_3_sca);
	//var M_tr = SglMat4.translation([1.5, 6, 12]);
	//stack.multiply(M_tr);
	
	//this.drawEye(gl);
	//stack.pop();

	//stack.push();
	//var M_3_sca = SglMat4.scaling([.3, .3, .3]);
	//stack.multiply(M_3_sca);
	//var M_tr = SglMat4.translation([-1.5, 6, 12]);
	//stack.multiply(M_tr);
	//this.drawEye(gl);
	//stack.pop();

	stack.pop();
}

NVMCClient.drawEye = function (gl) {
	var stack = this.stack;
	stack.push();

	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.sphere, [1.0, 1.0, 1.0, 1.0], [0, 0, 0, 1.0]);
	// var M_3_sca = SglMat4.scaling([1, 1, 1]);
	// stack.multiply(M_3_sca);

	stack.pop();
};

NVMCClient.drawStomach = function (gl) {
	var stack = this.stack;
	stack.push();
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.sphere, [0.8, 1.0, .4, 1.0], [0, 0, 0, 1.0]);
	stack.pop();
};

NVMCClient.drawTail = function (gl) {
	var stack = this.stack;
	stack.push();
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.cylinder, BODY_COLOR, [0, 0, 0, 1.0]);
	stack.push();

	
	var M_3_sca = SglMat4.scaling([1, 1.5, 1]);
	stack.multiply(M_3_sca);
	var M_5 = SglMat4.translation([0, 1.6, 0]);
	stack.multiply(M_5);

	//TODO: rotate if angle is something.
	var M_zrot = SglMat4.rotationAngleAxis(sglDegToRad(ROTANGLE), [0, 0, 1]);
	stack.multiply(M_zrot);


	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.cone, BODY_COLOR, [0, 0, 0, 1.0]);
	stack.pop();
	stack.pop();
};

NVMCClient.drawBody = function (gl) {

	//when we hit a key, we want to rotate by 5 degrees until we've reached 90. let's not do translation for now.

	//TORDOG

	var stack = this.stack;


	//bodyshadow
	stack.push();
	var M_3_sca = SglMat4.scaling([.8, .01, .8]);
	stack.multiply(M_3_sca);
	var M_kp = SglMat4.translation([0, 2, 0]);
	stack.multiply(M_kp);

	if(BUTTONPRESS=="I"){
		if(JUMPPARAMS[2] <= 15){
			JUMPPARAMS[4]-=.015;
		}
		else{
			JUMPPARAMS[4]+=.015;
		}
		var Mscale = SglMat4.scaling([JUMPPARAMS[4], JUMPPARAMS[4], JUMPPARAMS[4]]);
		stack.multiply(Mscale);
	}

	if(BUTTONPRESS == "N" || BUTTONPRESS == "M"){
		DODGEPARAMS[0]+=1;
		if(DODGEPARAMS[0]==36){
			DODGEPARAMS[0]=0;
			DODGEPARAMS[1]=1;
			DODGEPARAMS[2]=1;
			DODGEPARAMS[3]=0;
		}
		else if(DODGEPARAMS[0] <= 18){
			DODGEPARAMS[1] -= .03;
			DODGEPARAMS[2] -= .02;
			if(BUTTONPRESS == "N"){
				DODGEPARAMS[3] -= .05;
			}
			else{
				DODGEPARAMS[3] += .05;
			}
		}
		else{
			DODGEPARAMS[1] += .03;
			DODGEPARAMS[2] += .02;
			if(BUTTONPRESS == "N"){
				DODGEPARAMS[3] += .05;
			}
			else{
				DODGEPARAMS[3] -= .05;
			}
		}
		var Mtrans = SglMat4.translation([DODGEPARAMS[3], 0, 0]);
		stack.multiply(Mtrans);
		var Mscale = SglMat4.scaling([DODGEPARAMS[1], 1, DODGEPARAMS[2]]);
		stack.multiply(Mscale);
		
	}
	else{
		DODGEPARAMS[0]=0;
		DODGEPARAMS[1]=1;
		DODGEPARAMS[2]=1;
		DODGEPARAMS[3]=0;
	}
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.sphere, [.0, .0, .0, 1.0], [0, 0, 0, 1.0]);
	stack.pop();
	stack.push();

	if(BUTTONPRESS == "I"){
		this.jump();
		var M_OverallTranslate = SglMat4.translation([0, JUMPPARAMS[1], 0]);
		stack.multiply(M_OverallTranslate);
	}

	else if(BUTTONPRESS == "N" || BUTTONPRESS == "M"){
		this.dodge();
		var M_OverallTranslate = SglMat4.translation([0, TRANSLATEBY, 0]);
		stack.multiply(M_OverallTranslate);
		var M_OverallRotate = SglMat4.rotationAngleAxis(sglDegToRad(ROTATEBY), [0, 0, 1]);
		stack.multiply(M_OverallRotate);
	}

	var M_up = SglMat4.translation([0, .15, 0]);
	stack.multiply(M_up);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.sphere, BODY_COLOR, [0, 0, 0, 1.0]);

	//stack.push();
	//var M_5 = SglMat4.translation([0, .45, .5]);
	//stack.multiply(M_5);
	//var M_3_sca = SglMat4.scaling([.6, .7, .6]);
	//stack.multiply(M_3_sca);
	//this.drawStomach(gl);
	//stack.pop();

	if(GAMEOVER == false) {
		if(ROTANGLE < -3){
		UNITR = .3;
		}
		else if(ROTANGLE > 8){
			UNITR = -.3;
		}

		ROTANGLE += UNITR;
	}

	stack.push();
	var M_5 = SglMat4.translation([0, .6, 1]);
	stack.multiply(M_5);
	var M_3_sca = SglMat4.scaling([.12, .12, .12]);
	stack.multiply(M_3_sca);
	var M_yrot = SglMat4.rotationAngleAxis(sglDegToRad(80), [1, 0, 0]);
	stack.multiply(M_yrot);
	var M_zrot = SglMat4.rotationAngleAxis(sglDegToRad(ROTANGLE), [0, 0, 1]);
	stack.multiply(M_zrot);
	this.drawTail(gl);
	stack.pop();
	

	stack.push();

	var r_further = 0;
	var tx_further=0;
	var ty_further=0;
	var s_further = 0;
	if(BUTTONPRESS == "M" || BUTTONPRESS == "N"){
		// var OptTrans = SglMat4.translation([.5, 1, 0]);
		// stack.multiply(OptTrans);
		tx_further=-1;
		ty_further=1;
	}
	else if (BUTTONPRESS == "I"){
		r_further = 40
		tx_further = 1.5;
		s_further = .5;
		// var M_3_rot2 = SglMat4.rotationAngleAxis(sglDegToRad(45), [0, 0, 1]);
		// stack.multiply(M_3_rot2);
	}


	var M_3_rot2 = SglMat4.rotationAngleAxis(sglDegToRad(30+r_further), [0, 0, 1]);
	stack.multiply(M_3_rot2);
	var M_3_sca = SglMat4.scaling([.25, .5 + s_further, .25]);
	stack.multiply(M_3_sca);
	var M_5 = SglMat4.translation([3.5 + tx_further, -1.5 + ty_further, 0]);
	stack.multiply(M_5);

	// if(BUTTONPRESS == "M" || BUTTONPRESS == "N"){
	// 	var OptTrans = SglMat4.translation([.5, 1, 0]);
	// 	stack.multiply(OptTrans);
	// }
	// else if (BUTTONPRESS == "I"){
	// 	var M_5 = SglMat4.translation([1, 1, 0]);
	// 	stack.multiply(M_5);
	// 	var M_3_rot2 = SglMat4.rotationAngleAxis(sglDegToRad(120), [1, 1, 0]);
	// 	stack.multiply(M_3_rot2);
	// }
	

	
	this.drawLeg(gl);
	stack.pop();

	r_further=0;
	tx_further=0;
	ty_further=0;
	s_further=0;
	stack.push();
	if(BUTTONPRESS == "M" || BUTTONPRESS == "N"){
		tx_further = 1;
		ty_further = 1;
	}
	else if (BUTTONPRESS == "I"){
		r_further = -40
		tx_further = -1.5;
		s_further = .5;
		// var M_3_rot2 = SglMat4.rotationAngleAxis(sglDegToRad(45), [0, 0, 1]);
		// stack.multiply(M_3_rot2);
	}
	var M_3_rot2 = SglMat4.rotationAngleAxis(sglDegToRad(-30 + r_further), [0, 0, 1]);
	stack.multiply(M_3_rot2);
	var M_3_sca = SglMat4.scaling([.25, .5+ s_further, .25]);
	stack.multiply(M_3_sca);
	var M_5 = SglMat4.translation([-3.5+ tx_further, -1.5+ty_further, 0]);
	stack.multiply(M_5);

	
	

	this.drawLeg(gl);
	stack.pop();

	stack.push();


	if (BUTTONPRESS == "I"){
		s_further = .05;
		// var M_3_rot2 = SglMat4.rotationAngleAxis(sglDegToRad(45), [0, 0, 1]);
		// stack.multiply(M_3_rot2);
	}

	var M_3_rot2 = SglMat4.rotationAngleAxis(sglDegToRad(45), [0, 0, 1]);
	stack.multiply(M_3_rot2);
	var M_3_sca = SglMat4.scaling([.2, .3+s_further, .2]);
	stack.multiply(M_3_sca);
	var M_5 = SglMat4.translation([3, 4.5, 0]);
	stack.multiply(M_5);

	if(this.getGameover() == true && GAMESTART == true && BUTTONPRESS == false){
		if(HEAD_TRANS < 1){
			HEAD_TRANS+=.01
		}
	}
	else {
		HEAD_TRANS=0;
	}

	var M_5 = SglMat4.translation([0, -1*HEAD_TRANS/3, 0]);
	stack.multiply(M_5);

	this.drawLeg(gl);
	stack.pop();
	// this.drawArm(gl)

	stack.push();
	var M_3_rot2 = SglMat4.rotationAngleAxis(sglDegToRad(-45), [0, 0, 1]);
	stack.multiply(M_3_rot2);
	var M_3_sca = SglMat4.scaling([.2, .3+s_further, .2]);
	stack.multiply(M_3_sca);
	var M_5 = SglMat4.translation([-3, 4.5, 0]);
	stack.multiply(M_5);
	var M_5 = SglMat4.translation([0, -1*HEAD_TRANS/3, 0]);
	stack.multiply(M_5);

	this.drawLeg(gl);
	stack.pop();

	stack.push();
	//var M_3_rot2 = SglMat4.rotationAngleAxis(sglDegToRad(-45), [0, 0, 1]);
	//stack.multiply(M_3_rot2);
	var M_3_sca = SglMat4.scaling([.35, .4, .35]);
	stack.multiply(M_3_sca);
	var M_5 = SglMat4.translation([0, 4.8, 0]);
	stack.multiply(M_5);

	if(BUTTONPRESS == "M" || BUTTONPRESS == "N"){
		var M_5 = SglMat4.translation([0, -1, 0]);
		stack.multiply(M_5);
	}

	// if(this.getGameover() == true && GAMESTART == true && BUTTONPRESS == false){
	// 	if(HEAD_TRANS < 1){
	// 		HEAD_TRANS+=.01
	// 	}
	// }
	// else {
	// 	HEAD_TRANS=0;
	// }

	var M_lol = SglMat4.translation([0, -1*HEAD_TRANS, -1*HEAD_TRANS]);
	stack.multiply(M_lol);

	this.drawHead(gl);
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

NVMCClient.drawObstacle = function (gl) {
	var stack = this.stack;
	stack.push();

	var M_0_sca = SglMat4.scaling([.5, .5, .5]);
	stack.multiply(M_0_sca);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.cube, [0.8, 0.6, 0.2, 1.0], [0, 0, 0, 1.0]);
	stack.pop();

	stack.push();
	var M_kp = SglMat4.translation([0, -1, 0]);
	stack.multiply(M_kp);
	var M_3_sca = SglMat4.scaling([.45, .01, .45]);
	stack.multiply(M_3_sca);
	// var M_kp = SglMat4.translation([0, -1, 0]);
	// stack.multiply(M_kp);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.cube, [.0, .0, .0, 1.0], [0, 0, 0, 1.0]);
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

NVMCClient.drawCannon = function (gl, cannon) {
	var stack = this.stack;

	stack.push();
	var M_OverallTranslate = SglMat4.translation(cannon.translate);
	stack.multiply(M_OverallTranslate);
	var M_0_sca = SglMat4.scaling([1.5, 1.5, 1.5]);
	stack.multiply(M_0_sca);
	var M_0_tra1 = SglMat4.translation([0, -.70, 0]);
	stack.multiply(M_0_tra1);
	
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.sphere, cannon.color, [0, 0, 0, 1.0]);

	// var M_kp = SglMat4.translation([0, -1, 0]);
	// stack.multiply(M_kp);
	var M_3_sca = SglMat4.scaling([.7, .01, .7]);
	stack.multiply(M_3_sca);
	// var M_kp = SglMat4.translation([0, -1, 0]);
	// stack.multiply(M_kp);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.sphere, [.0, .0, .0, 1.0], [0, 0, 0, 1.0]);

	stack.pop();
	
	
};


NVMCClient.generateBall = function (gl, translateX, translateZ, c, cannonNum) {
	var stack = this.stack;
	var array = [[-10, 0, -20], [10, 0, -20]]

	stack.push();
	var M_OverallTranslate = SglMat4.translation(array[cannonNum]);
	stack.multiply(M_OverallTranslate);
	M_translate = SglMat4.translation([translateX, .1, translateZ]);
	stack.multiply(M_translate);
	var M_3_sca = SglMat4.scaling([.5, .5, .5]);
	stack.multiply(M_3_sca);
	// tra = SglMat4.translation([0, 0, z]);
	// stack.multiply(tra);
	
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.sphere, c, [0, 0, 0, 1.0]);

	stack.push();
	var M_kp = SglMat4.translation([0, -.2, 0]);
	stack.multiply(M_kp);
	var M_3_sca = SglMat4.scaling([.8, .01, .8]);
	stack.multiply(M_3_sca);
	// var M_kp = SglMat4.translation([0, -1, 0]);
	// stack.multiply(M_kp);
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	this.drawObject(gl, this.sphere, [.0, .0, .0, 1.0], [0, 0, 0, 1.0]);
	stack.pop();

	stack.pop();
	
	
};

NVMCClient.prepareCannon = function (gl, cannon) {
	if(cannon.count > 18){
		cannon.count=0;
		cannon.color = [.2, .2, .2, 1.0];
	}
	else if (cannon.count < 8){
		cannon.color = [cannon.count/10, .2, .2, 1.0];
		cannon.count++;
	}
	else if (cannon.count < 12){
		cannon.count++;
	}
	else {
		cannon.color = [.5, .2, .2, 1.0];
		cannon.count++;
	}
	//cannon.color = [1.0, 0, 0, 1.0]
};

NVMCClient.getButtonPress = function () {
	return BUTTONPRESS;
};

NVMCClient.setBodyColor = function (color) {
	BODY_COLOR = color;
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

	//for (var i in this.buildings) {
	// 	this.drawObject(gl, this.buildings[i], [0.8, 0.8, 0.8, 1.0], [0.2, 0.2, 0.2, 1.0]);
	//}
	gl.useProgram(null);
	gl.disable(gl.DEPTH_TEST);
};



/***********************************************************************/

NVMCClient.initMotionKeyHandlers = function () {
	var game = this.game;


	var carMotionKey = {};
	carMotionKey["W"] = function (on) {
		//game.playerAccelerate = on;
		//frontWheelRotate = 0;
	};
	carMotionKey["S"] = function (on) {
		//game.playerBrake = on;
		//frontWheelRotate = 0;
		GAMEOVER=false;
		GAMESTART=true;
		BODY_COLOR = [0.0, 0.7, 0.2, 1.0];
	};
	carMotionKey["A"] = function (on) {
		//game.playerSteerLeft = on;
		//frontWheelRotate = 30;
	};
	carMotionKey["D"] = function (on) {
		//game.playerSteerRight = on;
		//frontWheelRotate = -30;
	};
	carMotionKey["J"] = function (on) {
		if (KEYROTATE == -1){
			KEYROTATE = 90;
			ROTATEPOS = true;
			KEYTRANSLATE = [0, 2, 0];
			UNIT = 1;
			BUTTONPRESS = "N";
			//JUMPPARAMS[0] = true;
		}
	};
	carMotionKey["L"] = function (on) {
		if (KEYROTATE == -1){
			KEYROTATE = -90;
			ROTATEPOS = false;
			KEYTRANSLATE = [0, 2, 0];
			UNIT = 1;
			BUTTONPRESS = "M";
			//JUMPPARAMS[0] = true;
		}
	};
	carMotionKey["I"] = function (on) {
		//TORDOG
		if (BUTTONPRESS == false){
			BUTTONPRESS = "I";
		}
		// // KEYTRANSLATE = [0, 3, 0];
		// // TRANSLATEBY = -1;
	}
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
