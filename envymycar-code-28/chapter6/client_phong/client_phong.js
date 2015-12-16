NVMCClient.prototype.drawCar = function(gl){
	stack.push();
   	
	renderer.begin();
	
	if (shadingMode == 0)
		renderer.setTechnique(technique1);
	else if (shadingMode == 1)
		renderer.setTechnique(technique2);
		
	var WorldToViewMatrix = SglMat4.mul(ProjectionMatrix, stack.matrix);
	var NormalMatrix = SglMat4.inverseTranspose33(stack.matrix);
   
    renderer.setGlobals({
   		"WORLD_VIEW_PROJECTION_MATRIX": WorldToViewMatrix,
		"MODELVIEW_MATRIX": stack.matrix,
		"NORMAL_MATRIX": NormalMatrix
		});
					
	renderer.setPrimitiveMode("FILL");
   	
  	renderer.setModel(model);
   
	var parts = model.descriptor.logic.parts;
   	for (var partName in parts) {
   		var part = parts[partName];
   		renderer.setPart(partName);
   		for (var c in part.chunks) {
   			var chunkName = part.chunks[c];
   			renderer.setChunk(chunkName);
   			renderer.render();
   		}
   	}
   	renderer.end();
	
	stack.pop();
}

NVMCClient.prototype.drawTree = function(gl){
	stack.push();
	var M_0_tra1 = SglMat4.translation([0,0.8,0]);
	stack.multiply(M_0_tra1);
	var M_0_sca = SglMat4.scaling([0.6,1.65,0.6]);
	stack.multiply(M_0_sca);
 
	var modelviewproj1 = SglMat4.mul(ProjectionMatrix, stack.matrix);
	gl.uniformMatrix4fv(uModelViewProjectionLocation, false, modelviewproj1);
	gl.uniform3f(uColorLocation,0.13,0.92,0.39);
	this.send(gl,cone);
	stack.pop();

	stack.push();
	var M_1_sca = SglMat4.scaling([0.25,0.4,0.25]);
	stack.multiply(M_1_sca);
	var modelviewproj2 = SglMat4.mul(ProjectionMatrix, stack.matrix);
	gl.uniformMatrix4fv(uModelViewProjectionLocation, false, modelviewproj2);
	gl.uniform3f(uColorLocation,0.70,0.56,0.35);
	this.send(gl,cylinder);
	stack.pop();

}


NVMCClient.prototype.setViewFromCamera_0 = function(gl){
	var ppp = this.game.state.players.me.dynamicState.position;
	var invV = SglMat4.lookAt([ppp[0]+20,20,ppp[2]+20], ppp, [0,1,0]);
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
	ProjectionMatrix = SglMat4.perspective(3.14/4,ratio,1,100);

	this.setViewFromCamera_0(gl);
	
	var tra= SglMat4.translation([20,0,0]);
	stack.multiply(tra);
	tra= SglMat4.translation([-20,0,0]);
	stack.multiply(tra);

	// draw car
	gl.uniform3f(uColorLocation,1,1,0);
	stack.push();
	var M_9 = SglMat4.translation(this.game.state.players.me.dynamicState.position);
	stack.multiply(M_9);
	var M_9bis = SglMat4.rotationAngleAxis(this.game.state.players.me.dynamicState.orientation,[0,1,0]);
	stack.multiply(M_9bis);

	// draw car
	this.drawCar(gl);
	stack.pop();
	
	// re-set the shader of the scene
	gl.useProgram(shaderProgram);

	// draw trees
	var trees = this.game.race.trees;
	for (var t in trees) {
		stack.push();
		var M_8 = SglMat4.translation(trees[t].position);
		stack.multiply(M_8);
		this.drawTree(gl);
		stack.pop();
	}

	// draw track
	var modelviewproj = SglMat4.mul(ProjectionMatrix, stack.matrix);
	gl.uniformMatrix4fv(uModelViewProjectionLocation, false, modelviewproj);
	gl.uniform3f(uColorLocation,0.9,0.8,0.7);
	this.send(gl, trackPrim);

	// draw buildings
	gl.uniform3f(uColorLocation,0.2,0.2,0.2);
	for (var i in this.buildings) {
		this.send(gl,this.buildings[i]);
	}

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
 		handleKey["1"] = function (on) { this.shadingMode = 0;};
		handleKey["2"] = function (on) { this.shadingMode = 1;};
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