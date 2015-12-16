
NVMCClient.prototype.drawWheel= function (gl){
	stack.push();
	var M_3_sca = SglMat4.scaling([0.05,0.3,0.3]);
	stack.multiply(M_3_sca);
	var M_3_rot = SglMat4.rotationAngleAxis(sglDegToRad(90), [0,0,1]);
	stack.multiply(M_3_rot);
	var M_3_tra = SglMat4.translation([0,-1,0]);
	stack.multiply(M_3_tra);
	gl.uniformMatrix4fv(uModelViewProjectionLocation, false, stack.matrix);
	this.send(gl,cylinder);
	stack.pop();
}

NVMCClient.prototype.drawCar= function (gl){
	stack.push();// matrix stack =  { P*invV*M_9,P*invV} 

	// M_7 translate the wheel to ita place on the car 
	var M_7  = SglMat4.translation([1,0.3,1.4]);
	stack.multiply(M_7);


	// M_3 transform a cylinder in a wheel
	var M_3_sca = SglMat4.scaling([0.05,0.3,0.3]);
	stack.multiply(M_3_sca);
	var M_3_rot = SglMat4.rotationAngleAxis(sglDegToRad(90), [0,0,1]);
	stack.multiply(M_3_rot);
	var M_3_tra = SglMat4.translation([0,-1,0]);
	stack.multiply(M_3_tra);
	gl.uniformMatrix4fv(uModelViewProjectionLocation, false, stack.matrix);
	this.send(gl,cylinder);
	stack.pop();// CurrM = P*invV*M_9;  stack =  {   P*invV} 

	stack.push();// CurrM = P*invV*M_9;  stack =  { P*invV*M_9,P*invV} 
	// M_5 translate the wheel to ita place on the car 
	var M_5  = SglMat4.translation([-1,0.3,1.4]);
	stack.multiply(M_5);
	this.drawWheel(gl);
	stack.pop();// matrix stack =  {   P*invV} 

	stack.push();// matrix stack =  { P*invV*M_9,P*invV} 
	// M_4 translate the wheel to ita place on the car 
	var M_4  = SglMat4.translation([-1,0.3,-1.6]);
	stack.multiply(M_4);
	this.drawWheel(gl);
	stack.pop();// matrix stack =  {   P*invV} 

	stack.push();// matrix stack =  { P*invV*M_9,P*invV} 
	// M_6 translate the wheel to ita place on the car 
	var M_6  = SglMat4.translation([1,0.3,-1.6]);
	stack.multiply(M_6);
	this.drawWheel(gl);
	stack.pop();// matrix stack =  {   P*invV} 

	stack.push();// matrix stack =   { P*invV*M_9,P*invV}
	// Compute and apply M_2
	var M_2_tra_0 = SglMat4.translation([0,0.3,0]);
	stack.multiply(M_2_tra_0);
	var M_2_sca = SglMat4.scaling([1,0.5,2]);
	stack.multiply(M_2_sca);
	var M_2_tra_1 = SglMat4.translation([0,1,0]);
	stack.multiply(M_2_tra_1);
	// CurrM = CurrM*M_2_tra_0*M_2_sca*M_2_tra_1

	gl.uniformMatrix4fv(uModelViewProjectionLocation, false, stack.matrix);
	this.send(gl,cube);
	stack.pop();// matrix stack =  {   P*invV} 

	stack.pop();
}

NVMCClient.prototype.drawTree=  function(gl){
	stack.push();
	var M_0_tra1 = SglMat4.translation([0,0.8,0]);
	stack.multiply(M_0_tra1);
	var M_0_sca = SglMat4.scaling([0.6,1.65,0.6]);
	stack.multiply(M_0_sca);
 
	gl.uniformMatrix4fv(uModelViewProjectionLocation, false, stack.matrix);
	gl.uniform3f(uColorLocation,0.13,0.92,0.39);
	this.send(gl,cone);
	stack.pop();

	stack.push();
	var M_1_sca = SglMat4.scaling([0.25,0.4,0.25]);
	stack.multiply(M_1_sca);
	gl.uniformMatrix4fv(uModelViewProjectionLocation, false, stack.matrix);
	gl.uniform3f(uColorLocation,0.70,0.56,0.35);
	this.send(gl,cylinder);
	stack.pop();

}


NVMCClient.prototype.setViewFromCamera_0 =  function (gl) {
	var ppp = this.game.state.players.me.dynamicState.position;
	var invV = SglMat4.lookAt([ppp[0]+20,20,ppp[2]+20], ppp, [0,1,0]);
	stack.multiply(invV);
}


NVMCClient.prototype.updateOrientationCamera_1 =  function () {
	var Rot_alpha = SglMat4.rotationAngleAxis(sglDegToRad(this.alpha/10), [0,1,0]);
	var Rot_beta   = SglMat4.rotationAngleAxis(sglDegToRad(this.beta/10), [1,0,0]);
	this.camera_1_orientation =  SglMat4.mul( SglMat4.mul( Rot_alpha,this.camera_1_orientation),Rot_beta);
	
}

NVMCClient.prototype.setViewFromCamera_1 =  function (gl) {
	var ppp = this.game.state.players.me.dynamicState.position;
	
	dir_world = SglMat4.mul3(this.camera_1_orientation,this.deltaCamera_1);
	this.camera_1_position =  SglVec3.add(this.camera_1_position,dir_world);
	
	var invV = SglMat4.lookAt( SglVec3.add(this.camera_1_position ,SglMat4.col(this.camera_1_orientation,2))   ,     this.camera_1_position,      SglMat4.col(this.camera_1_orientation,1));
//	var invV = SglMat4.lookAt( ppp ,     this.camera_1_position,       [ 0,1,0]);
	stack.multiply(invV);
}

	
///// Draw the given primitives with solid wireframe
/////
NVMCClient.prototype.drawScene =  function (gl) {
	// Make sure the canvas is sized correctly.
	var canvas = document.getElementById('nvmc-canvas');
	var width = canvas.clientWidth;
	var height = canvas.clientHeight;
	var ratio = width / height;
	
	gl.viewport(0, 0, width, height);

	// Clear the canvas
	gl.clearColor(0.4, 0.4, 0.8, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.enable(gl.DEPTH_TEST);
	gl.useProgram(shaderProgram);
	
	stack.loadIdentity();
	// Setup projection matrix
//	var P = SglMat4.ortho([-21*ratio,-21,0.1], [21*ratio,21,201.0]);
	var P = SglMat4.perspective(3.14/4,ratio,1,100);
	stack.multiply(P);

	if(this.currentCamera == 0) 
		this.setViewFromCamera_0(gl); 
			else
		this.setViewFromCamera_1(gl);
	
	var tra= SglMat4.translation([20,0,0]);
	stack.multiply(tra);
	tra= SglMat4.translation([-20,0,0]);
	stack.multiply(tra);

	gl.uniform3f(uColorLocation,1,1,0);
	stack.push();
	var M_9 = SglMat4.translation(this.game.state.players.me.dynamicState.position);
	stack.multiply(M_9);
	var M_9bis = SglMat4.rotationAngleAxis(this.game.state.players.me.dynamicState.orientation,[0,1,0]);
	stack.multiply(M_9bis);

	//gl.uniform3f(uColorLocation,0.8,0.2,0.2);
	//this.drawCar(gl);
	//stack.pop();

	var trees = this.game.race.trees;
	for (var t in trees) {
		stack.push();
		var M_8 = SglMat4.translation(trees[t].position);
		stack.multiply(M_8);
		this.drawTree(gl);
		stack.pop();
	}

	
	gl.uniformMatrix4fv(uModelViewProjectionLocation, false, stack.matrix);
	//this.send(gl,track);
	gl.uniform3f(uColorLocation,0.9,0.8,0.7);
	this.send(gl,trackPrim);


	gl.uniform3f(uColorLocation,0.2,0.2,0.2);
	for (var i in this.buildings){
		this.send(gl,this.buildings[i]);
	}

	// create inverse of V
//	var invV = SglMat4.lookAt([-30,20,30], [0,0,0], [0,1,0]);

	gl.useProgram(null);
	gl.disable(gl.DEPTH_TEST);

}

NVMCClient.prototype.onInitialize = function () {
		var gl = this.ui.gl;

		/*************************************************************/
		nvmcLog("SpiderGL Version : " + SGL_VERSION_STRING + "\n");
		/*************************************************************/


		/*************************************************************/
		this.game.player.color = [ 1.0, 0.0, 0.0, 1.0 ];
		/*************************************************************/

		/*************************************************************/
		var game = this.game;

	
		
	
		var handleKey = { };
		handleKey["W"] = function (on) { game.playerAccelerate = on; };
		handleKey["S"] = function (on) { game.playerBrake      = on; };
		handleKey["A"] = function (on) { game.playerSteerLeft  = on; };
		handleKey["D"] = function (on) { game.playerSteerRight = on; };
 		handleKey["Q"] = function (on) { this.currentCamera = 0;};
		handleKey["E"] = function (on) { this.currentCamera = 1; };
		this.handleKey = handleKey;
		/*************************************************************/

		shaderProgram  = null;
		uModelViewProjectionLocation = -1;
		uColorLocation = -1;
		aPositionIndex = 0;

		incAngle = 0.3;

		cube     = new Cube(10);
		cylinder = new Cylinder(10);
		cone     = new Cone(10);
		stack    = new SglMatrixStack();
		
		this.init(gl);		
		this.initialize(gl);

}