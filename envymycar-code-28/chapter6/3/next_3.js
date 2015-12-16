// Global NVMC Client
// ID 6.2

/***********************************************************************/
var NVMCClient = NVMCClient || {};
/***********************************************************************/

function Light(geometry,color,direction,cutoff,falloff){
	if(!geometry) 	this.geometry 	= [0.0,-1.0,0.0,0.0]; 	else this.geometry 	= geometry;
	if(!color) 		this.color 	= [1.0,1.0,1.0,1.0]; 	else this.color 		= color;
	if(!direction) 	this.direction 	= [0.0,0.0,0.0]; 		else this.direction 		= direction;
	if(!falloff) 		this.falloff 	= 1; 				else this.falloff 		= falloff;
	if(!cutoff) 	this.cutoff 	= 360; 				else this.cutoff 		= cutoff;
}

function AreaLight(frame,sizes,color){
	if(!frame) 	this.frame 	= SglMat4.identity(); 	else this.frame 	= frame;
	if(!sizes) 		this.sizes 	= [1,1,1]; 			else this.sizes 	= sizes;
	if(!color) 		this.color 	= [0.5,0.5,0.5,1]; 		else this.color 	= color;
}

NVMCClient.spotLightsPosViewSpace = new Array();
NVMCClient.spotLightsDirViewSpace = new Array();
NVMCClient.spotLightsCutOff = new Array();
NVMCClient.spotLightsFallOff = new Array();

NVMCClient.areaLightsFrameViewSpace = new Array();
NVMCClient.areaLightsSize = new Array();
NVMCClient.areaLightsColor = new Array();

// 	temporary		
NVMCClient.tunnels = new Array();
NVMCClient.areaLights = new Array();
	
NVMCClient.areaLightQuad = null;
NVMCClient.createObjects = function () {
	this.cube     = new Cube(10);
	this.cylinder = new Cylinder(10);
	this.cone     = new Cone(10);

	this.track = new Track(this.game.race.track);
	this.tunnels[0] = new Tunnel(this.game.race.track);
	this.areaLights[0] = new AreaLight();
	this.areaLights[1] = new AreaLight();
	
	var quad = [ -200,-0.01,-200,
			 200,-0.01,-200,
			200,-0.01,200,
			-200,-0.01,200];
	this.ground = new Quadrilateral(quad);
	
	var areaQuad = [ -1, 0.0,-1,
			 1,0.0,-1,
			1,0.0,1,
			-1.0,0.0,1.0];
	this.areaLightQuad = new Quadrilateral(areaQuad);

	this.cabin = new Cabin();
	this.windshield = new Windshield();
	
	var gameBuildings = this.game.race.buildings;
	this.buildings = new Array(gameBuildings.length);
	for(var i=0; i<gameBuildings.length; ++i) {
		this.buildings[i] = new Building(gameBuildings[i]);
	}
};
NVMCClient.createBuffers = function (gl) {
	this.createObjectBuffers(gl, this.cube,false,false);

	ComputeNormals(this.cylinder);
	this.createObjectBuffers(gl, this.cylinder, true, true);

	ComputeNormals(this.cone);
	this.createObjectBuffers(gl, this.cone,true,true);

	ComputeNormals(this.track);
	this.createObjectBuffers(gl, this.track, true,true);
	
	ComputeNormals(this.tunnels[0]);
	this.createObjectBuffers(gl, this.tunnels[0],true, true);

	ComputeNormals(this.ground);
	this.createObjectBuffers(gl, this.ground,true, true);

	this.createObjectBuffers(gl, this.areaLightQuad,false, false);
	
	this.createObjectBuffers(gl, this.cabin,true,false);
	this.createObjectBuffers(gl, this.windshield,true,false);

	for(var i=0; i<this.buildings.length; ++i) {
		this.buildings[i] = ComputeNormals(this.buildings[i]);
		this.createObjectBuffers(gl, this.buildings[i],true,true);
	}
};

NVMCClient.drawAreaLight = function(gl,areaLight) {
	var stack = this.stack;

	stack.push();
	stack.multiply(areaLight.frame);
	stack.multiply(SglMat4.scaling([areaLight.sizes[0],1.0,areaLight.sizes[1]]));
	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation,false,stack.matrix);
	this.drawObject(gl, this.areaLightQuad, this.uniformShader,[0.9,0.9,0.9,1.0]);
	stack.pop();

};


NVMCClient.drawTree = function(gl) {
	var stack = this.stack;

	stack.push();
		var M_0_tra1 = SglMat4.translation([0, 0.8, 0]);
		stack.multiply(M_0_tra1);

		var M_0_sca = SglMat4.scaling([0.6, 1.65, 0.6]);
		stack.multiply(M_0_sca);
	 
		gl.uniformMatrix4fv(this.phongSingleColorMultiLightShader.uModelViewMatrixLocation, false, stack.matrix);
		var InvT = SglMat4.inverse(this.stack.matrix)
		InvT = SglMat4.transpose(InvT);	
		gl.uniformMatrix3fv(this.phongSingleColorMultiLightShader.uViewSpaceNormalMatrixLocation, false, SglMat4.to33(InvT) );
		this.drawObject(gl, this.cone, this.phongSingleColorMultiLightShader,[0.2,0.8,0.1,1.0],[0,0,0,1]);
	stack.pop();

	stack.push();
		var M_1_sca = SglMat4.scaling([0.25, 0.4, 0.25]);
		stack.multiply(M_1_sca);

		gl.uniformMatrix4fv(this.phongSingleColorMultiLightShader.uModelViewMatrixLocation, false, stack.matrix);
		gl.uniformMatrix3fv(this.phongSingleColorMultiLightShader.uViewSpaceNormalMatrixLocation, false, SglMat4.to33(this.stack.matrix) );
		this.drawObject(gl, this.cylinder,  this.phongSingleColorMultiLightShader,[0.6,0.23,0.12,1.0],[0,0,0,1]);
	stack.pop();
};

	
NVMCClient.drawCar = function (gl){
	gl.useProgram(this.phongMultiLightShader);
	
	var Ka = 0.4;
	var Kd = 0.8;
	var Ks = 0.0;
	var shininess = 10.0;
	
  	this.renderer.begin();
   	this.renderer.setTechnique(this.technique);
   
	 
    	this.renderer.setGlobals({
   					"PROJECTION_MATRIX":this.projectionMatrix,
					"WORLD_VIEW_MATRIX":this.stack.matrix,
					"VIEW_SPACE_NORMAL_MATRIX"     : SglMat4.to33(this.stack.matrix) ,
					"LIGHT0_LIGHT_COLOR"            :[ 0.9, 0.9, 0.9 ] ,
					"LIGHTS_POS_DIR_0"	: this.lightsPosDirViewSpace[0] ,
					"LIGHTS_POS_DIR_1"	: this.lightsPosDirViewSpace[1] ,
					"LIGHTS_POS_DIR_2"	: this.lightsPosDirViewSpace[2] ,
					"LIGHTS_POS_DIR_3"	: this.lightsPosDirViewSpace[3] ,
					"LIGHTS_POS_DIR_4"	: this.lightsPosDirViewSpace[4] ,
					"LIGHTS_COLOR_0" 		: this.lightsColor[0] ,
					"LIGHTS_COLOR_1" 		: this.lightsColor[1] ,
					"LIGHTS_COLOR_2" 		: this.lightsColor[2] ,
					"LIGHTS_COLOR_3" 		: this.lightsColor[3] ,
					"LIGHTS_COLOR_4" 		: this.lightsColor[4] ,
					"SPOT_LIGHTS_POS_0" 	:this.spotLightsPosViewSpace[0],
					"SPOT_LIGHTS_POS_1"	:this.spotLightsPosViewSpace[1],
					"SPOT_LIGHTS_DIR_0"	:this.spotLightsDirViewSpace[0],
					"SPOT_LIGHTS_DIR_1"	:this.spotLightsDirViewSpace[1],
					"SPOT_LIGHTS_DIR_0"	:this.spotLightsDirViewSpace[0],
					"SPOT_LIGHTS_DIR_1"	:this.spotLightsDirViewSpace[1],
					"SPOT_LIGHTS_COLOR_0"	:[0.2,0.2,0.2,1.0],
					"SPOT_LIGHTS_COLOR_1"	:[0.2,0.2,0.2,1.0],
					"SPOT_LIGHTS_CUTOFF_0"	:this.spotLightsCutOff[0],
					"SPOT_LIGHTS_CUTOFF_1"	:this.spotLightsCutOff[1],
					"SPOT_LIGHTS_FALLOFF_0"	:this.spotLightsFallOff[0],
					"SPOT_LIGHTS_FALLOFF_1"	:this.spotLightsFallOff[1],
					"AREA_LIGHTS_FRAME_0"	:this.areaLightsFrameViewSpace[0],
					"AREA_LIGHTS_SIZE_0"	:this.areaLights[0].sizes,
					"AREA_LIGHTS_COLOR_0"	:this.areaLights[0].color,
					"AMBIENT_COEFFICIENT" 		: Ka,
					"DIFFUSE_COEFFICIENT" 		: Kd,
					"SPECULAR_COEFFICIENT"        : Ks,
					"SHININESS_EXPONENT"		: shininess,
		});
   
   	this.renderer.setPrimitiveMode("FILL");
   	
  	this.renderer.setModel(this.model);
	this.renderer.renderModel();
	this.renderer.end();
};	

NVMCClient.loadModels = function (gl){
	var stack = this.stack;
	var me = this;
	sglRequestBinary("../../media/models/car2/car.ply", {
		onSuccess : function (req) {
			var plyData = req.buffer;
			var modelDescriptor = importPly(plyData);
			me.model = new SglModel(gl, modelDescriptor);
		}
	});
	
	var Ka = 0.2;
	var Kd = 0.6;
	var Ks = 0.8;
	var shininess = 32.0;
	
	this.renderer = new SglModelRenderer(gl);	
	this.technique = new SglTechnique( gl,
		{	vertexShader		:this.phongMultiLightShader.PerPixelLambertian_vs, 
			fragmentShader	:this.phongMultiLightShader.PerPixelLambertian_fs,
			vertexStreams 		: 
			{
				"a_position"		: [ 0.0,0.0,0.0,1.0],
				"a_normal" 		: [ 0.0, 0.0, 1.0, 0.0 ],
				"a_color" 	 	: [ 0.0, 0.0, 0.8, 0.0 ],
			},
			globals : {
				"uProjectionMatrix" : { semantic : "PROJECTION_MATRIX", value : this.projectionMatrix },
				"uModelViewMatrix":{semantic:"WORLD_VIEW_MATRIX",value : this.stack.matrix },
				"uViewSpaceNormalMatrix"     : { semantic : "VIEW_SPACE_NORMAL_MATRIX",     value :SglMat4.to33(this.stack.matrix) },
				"uLightsPosDir[0]"             : { semantic : "LIGHTS_POS_DIR_0",        value :this.lightsPosDirViewSpace[0]},
				"uLightsPosDir[1]"             : { semantic : "LIGHTS_POS_DIR_1",        value :this.lightsPosDirViewSpace[1]},
				"uLightsPosDir[2]"             : { semantic : "LIGHTS_POS_DIR_2",        value :this.lightsPosDirViewSpace[2]},
				"uLightsPosDir[3]"             : { semantic : "LIGHTS_POS_DIR_3",        value :this.lightsPosDirViewSpace[3]},
				"uLightsPosDir[4]"             : { semantic : "LIGHTS_POS_DIR_4",        value :this.lightsPosDirViewSpace[4]},
				"uLightsColor[0]"                : { semantic : "LIGHTS_COLOR_0",          value :this.lightsColor[0]},
				"uLightsColor[1]"                : { semantic : "LIGHTS_COLOR_1",          value :this.lightsColor[1]},
				"uLightsColor[2]"                : { semantic : "LIGHTS_COLOR_2",          value :this.lightsColor[2]},
				"uLightsColor[3]"                : { semantic : "LIGHTS_COLOR_3",          value :this.lightsColor[3]},
				"uLightsColor[4]"               : { semantic : "LIGHTS_COLOR_4",          value :this.lightsColor[4]},
				"uSpotLightsPos[0]"		:{sematic: "SPOT_LIGHTS_POS_0",			value:this.spotLightsPosViewSpace[0]},
				"uSpotLightsPos[1]"		:{sematic: "SPOT_LIGHTS_POS_1",			value:this.spotLightsPosViewSpace[1]},
				"uSpotLightsDir[0]"		:{sematic: "SPOT_LIGHTS_DIR_0",			value:this.spotLightsDirViewSpace[0]},
				"uSpotLightsDir[1]"		:{sematic: "SPOT_LIGHTS_DIR_1",			value:this.spotLightsDirViewSpace[1]},
				"uSpotLightsDir[0]"		:{sematic: "SPOT_LIGHTS_DIR_0",			value:this.spotLightsDirViewSpace[0]},
				"uSpotLightsDir[1]"		:{sematic: "SPOT_LIGHTS_DIR_1",			value:this.spotLightsDirViewSpace[1]},
				"uSpotLightsColor[0]"	:{semantic: "SPOT_LIGHTS_COLOR_0",		value:[0.2,0.2,0.2,1.0]},
				"uSpotLightsColor[1]"	:{semantic: "SPOT_LIGHTS_COLOR_1",		value:[0.2,0.2,0.2,1.0]},
				"uSpotLightsCutOff[0]"	:{semantic: "SPOT_LIGHTS_CUTOFF_0",		value:this.spotLightsCutOff[0]},
				"uSpotLightsCutOff[1]"	:{semantic: "SPOT_LIGHTS_CUTOFF_1",		value:this.spotLightsCutOff[1]},
				"uSpotLightsFallOff[0]"	:{semantic: "SPOT_LIGHTS_FALLOFF_0",		value:this.spotLightsFallOff[0]},
				"uSpotLightsFallOff[1]"	:{semantic: "SPOT_LIGHTS_FALLOFF_1",		value:this.spotLightsFallOff[1]},
				"uAreaLightsFrame[0]"	:{semantic: "AREA_LIGHTS_FRAME_0",		value:this.areaLightsFrameViewSpace[0]},
				"uAreaLightsSize[0]"	:{semantic: "AREA_LIGHTS_SIZE_0",		value:this.areaLights[0].sizes},
				"uAreaLightsColor[0]"	:{semantic: "AREA_LIGHTS_COLOR_0",		value:this.areaLights[0].color},
				"uKa"                        : { semantic : "AMBIENT_COEFFICIENT",          value : Ka },
				"uKd"                        : { semantic : "DIFFUSE_COEFFICIENT",          value : Kd },		
				"uKs"                        : { semantic : "SPECULAR_COEFFICIENT",         value : Ks },
				"uShininess"                 : { semantic : "SHININESS_EXPONENT",           value : shininess }
			}
		});

};

NVMCClient.drawScene = function (gl) {
	var width  = this.ui.width;
	var height = this.ui.height
	this.observerCamera.width = width;
	this.observerCamera.height = height;
	var ratio  = width / height;
	var stack  = this.stack;
	
	gl.viewport(0, 0, width, height);

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
				
			gl.useProgram(this.phongSingleColorMultiLightShader);
			gl.uniformMatrix4fv(this.phongSingleColorMultiLightShader.uModelViewMatrixLocation, false, SglMat4.identity());
			gl.uniformMatrix4fv(this.phongSingleColorMultiLightShader.uProjectionMatrixLocation, false, SglMat4.identity());
			this.drawObject(gl, this.cabin,  this.phongSingleColorMultiLightShader);
		
			gl.stencilFunc(gl.EQUAL,0,0xFF);
			gl.stencilOp(gl.KEEP,gl.KEEP,gl.KEEP);
			gl.stencilMask(0);
		
	}else
		gl.disable(gl.STENCIL_TEST);

	
	
	this.projectionMatrix = SglMat4.perspective(3.14/4,ratio,1,1000);
 	  
	this.setView();
		
	var pos  = this.game.state.players.me.dynamicState.position;
	
	this.lightsPosDirViewSpace[0]  = SglMat4.mul4(this.stack.matrix, this.sunLightDirection);
	this.lightsColor [0] =   [0.3,0.29,0.02,1.0];
 	for( var i = 0 ; i < this.streetLamps.length ; ++i)
 		{
			this.lightsPosDirViewSpace[i+1] = SglMat4.mul4(this.stack.matrix, this.streetLamps[i].light.geometry);
			this.lightsColor [i+1] =   this.streetLamps[i].light.color;
		}
	{
		var M_9 = SglMat4.translation(pos);
		var M_9bis = SglMat4.rotationAngleAxis(this.game.state.players.me.dynamicState.orientation, [0, 1, 0]);
		
		var leftHeadLightPos 	= 	[-0.6,	0.5, 1.9,1];
		var rightHeadLightPos 	= 	[0.6,	0.5,	1.9,1];
		var leftHeadLightDir  	= 	[0.0,	0.2, 1,0];
		var rightHeadLightDir  	= 	[0.0,	0.2, 1,0];
		leftHeadLightDir = SglVec4.normalize(leftHeadLightDir);
		rightHeadLightDir = SglVec4.normalize(rightHeadLightDir);

 
		leftHeadLightPos  =  SglMat4.mul4(this.stack.matrix, SglMat4.mul4(M_9,SglMat4.mul4(M_9bis,leftHeadLightPos)));
		rightHeadLightPos = SglMat4.mul4(this.stack.matrix, SglMat4.mul4(M_9,SglMat4.mul4(M_9bis,rightHeadLightPos)));
		leftHeadLightDir  =  SglMat4.mul4(this.stack.matrix, SglMat4.mul4(M_9,SglMat4.mul4(M_9bis,leftHeadLightDir)));
		rightHeadLightDir = SglMat4.mul4(this.stack.matrix, SglMat4.mul4(M_9,SglMat4.mul4(M_9bis,rightHeadLightDir)));
		
		this.spotLightsPosViewSpace[0] = [leftHeadLightPos[0],leftHeadLightPos[1],leftHeadLightPos[2]];
		this.spotLightsPosViewSpace[1] = [rightHeadLightPos[0],rightHeadLightPos[1],rightHeadLightPos[2]];

		this.spotLightsDirViewSpace[0] = [leftHeadLightDir[0],leftHeadLightDir[1],leftHeadLightDir[2]];
		this.spotLightsDirViewSpace[1] = [rightHeadLightDir[0],rightHeadLightDir[1],rightHeadLightDir[2]];
		
	}
		
	{	// setting area lights
		var M_9 = SglMat4.translation(pos);
		var M_9bis = SglMat4.rotationAngleAxis(this.game.state.players.me.dynamicState.orientation, [0, 1, 0]);
		var Up = SglMat4.translation([0.0,1.5,0.0]);
		 
		this.areaLights[0].frame =  SglMat4.mul(SglMat4.mul(M_9, M_9bis),Up);
		this.areaLights[0].sizes = [0.3,2,0.1];
		this.areaLights[0].color = [0.01,0.01,0.01,1.0];
		
		this.areaLights[1] = this.areaLights[0];
		this.areaLights[1].sizes = [0.3,2,0.1];
		this.areaLights[1].color = [0.01,0.01,0.01,1.0];
		
		this.areaLightsFrameViewSpace[0] = SglMat4.mul(this.stack.matrix,this.areaLights[0].frame);
		this.areaLightsFrameViewSpace[1] = SglMat4.mul(this.stack.matrix,this.areaLights[1].frame);
	}
	
	
	gl.useProgram(this.phongSingleColorMultiLightShader);
 	for( var i = 0 ; i < this.streetLamps.length+1; ++i){
 		gl.uniform4fv(	this.phongSingleColorMultiLightShader.uLightsPosDirLocation[i],
					this.lightsPosDirViewSpace[i]);
 		gl.uniform4fv(	this.phongSingleColorMultiLightShader.uLightsColorLocation[i],
					this.lightsColor[i]);
	}
	
	// spotlights
	gl.uniform3fv(this.phongSingleColorMultiLightShader.uSpotLightsPosLocation[0],this.spotLightsPosViewSpace[0]);
	gl.uniform3fv(this.phongSingleColorMultiLightShader.uSpotLightsPosLocation[1],this.spotLightsPosViewSpace[1]);
	gl.uniform3fv(this.phongSingleColorMultiLightShader.uSpotLightsDirLocation[0],this.spotLightsDirViewSpace[0]);
	gl.uniform3fv(this.phongSingleColorMultiLightShader.uSpotLightsDirLocation[1],this.spotLightsDirViewSpace[1]);
	gl.uniform4fv(this.phongSingleColorMultiLightShader.uSpotLightsColorLocation[0],[0.4,0.3,0.0,1.0]);
	gl.uniform4fv(this.phongSingleColorMultiLightShader.uSpotLightsColorLocation[1],[0.4,0.3,0.0,1.0]);

	gl.uniform1f(this.phongSingleColorMultiLightShader.uSpotLightsCutOffLocation[0],0.8);
	gl.uniform1f(this.phongSingleColorMultiLightShader.uSpotLightsCutOffLocation[1],0.8);
	gl.uniform1f(this.phongSingleColorMultiLightShader.uSpotLightsFallOffLocation[0], 8);
	gl.uniform1f(this.phongSingleColorMultiLightShader.uSpotLightsFallOffLocation[1], 8);
	

	
	// areaLights
	for(var i = 0; i < this.areaLights.length ; ++i){
		gl.uniformMatrix4fv(this.phongSingleColorMultiLightShader.uAreaLightsFrameLocation[i],false,this.areaLightsFrameViewSpace[i]);
		gl.uniform3fv(this.phongSingleColorMultiLightShader.uAreaLightsSizeLocation[i],	this.areaLights[i].sizes);
		gl.uniform4fv(this.phongSingleColorMultiLightShader.uAreaLightsColorLocation[i],	this.areaLights[i].color);
	}


	gl.uniform3fv(this.phongSingleColorMultiLightShader.uLightColorLocation, [0.9, 0.9, 0.9] );
	gl.uniformMatrix4fv(this.phongSingleColorMultiLightShader.uProjectionMatrixLocation, false, this.projectionMatrix);
	gl.uniformMatrix4fv(this.phongSingleColorMultiLightShader.uModelViewMatrixLocation, false, stack.matrix);
	gl.uniformMatrix3fv(this.phongSingleColorMultiLightShader.uViewSpaceNormalMatrixLocation, false, SglMat4.to33(this.stack.matrix) );

	// phong parameters
	gl.uniform1f(this.phongSingleColorMultiLightShader.uKaLocation,0.0001);
	gl.uniform1f(this.phongSingleColorMultiLightShader.uKdLocation,0.00001);
	gl.uniform1f(this.phongSingleColorMultiLightShader.uKsLocation,0.00001);
	gl.uniform1f(this.phongSingleColorMultiLightShader.uShininessLocation,32.0);
	
	
	this.drawObject(gl, this.tunnels[0], this.phongSingleColorMultiLightShader,[0.9, 0.8, 0.7,1.0]);
	this.drawObject(gl,this.ground,this.phongSingleColorMultiLightShader,[0.3, 0.7, 0.2,1.0]);
	
/* waiting for the street lamps
	var trees = this.game.race.trees;
	for (var t in trees) {
		stack.push();
			var M_8 = SglMat4.translation(trees[t].position);
			stack.multiply(M_8);
			this.drawTree(gl);
		stack.pop();
	}
*/
	gl.useProgram(this.uniformShader);
	gl.uniformMatrix4fv(this.uniformShader.uProjectionMatrixLocation, false, this.projectionMatrix);	
	var areaLights = this.areaLights;
	for (var al in areaLights) {
		this.drawAreaLight(gl,this.areaLights[al]);
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
		this.drawObject(gl, this.buildings[i],this.phongSingleColorMultiLightShader,[0.7,0.8,0.9,1.0],[1,1,1,1]);
	}

	if( this.currentCamera!=3 ){
	stack.push();
		var M_9 = SglMat4.translation(pos);
		stack.multiply(M_9);

		var M_9bis = SglMat4.rotationAngleAxis(this.game.state.players.me.dynamicState.orientation, [0, 1, 0]);
		stack.multiply(M_9bis);

		this.drawCar(gl);
	stack.pop();
	}
		
	gl.disable(gl.DEPTH_TEST);
	if( this.currentCamera==3 ){
			gl.enable(gl.BLEND);
			gl.blendFunc( gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
			gl.useProgram(this.phongSingleColorMultiLightShader);
			gl.uniformMatrix4fv(this.uModelViewMatrixLocation, false, SglMat4.identity());
			gl.uniformMatrix4fv(this.uProjectionMatrixLocation, false, SglMat4.identity());
			this.drawObject(gl, this.windshield, this.phongSingleColorMultiLightShader);
			gl.disable(gl.BLEND);
		
	}
	
 	gl.disable(gl.DEPTH_TEST);
	gl.useProgram(null);
};
/***********************************************************************/



// NVMC Client Events
/***********************************************************************/
NVMCClient.onInitialize = function () {

	this.TEMP_lamps(); //TMP
	
	var gl = this.ui.gl;


	/*************************************************************/
	NVMC.log("SpiderGL Version : " + SGL_VERSION_STRING + "\n");
	/*************************************************************/

	/*************************************************************/
	this.game.player.color = [ 1.0, 0.0, 0.0, 1.0 ];
	/*************************************************************/

	/*************************************************************/
	this.initKeyHandlers();
	/*************************************************************/
	this.stack = new SglMatrixStack();
	this.projection_matrix =  SglMat4.identity();
	
	/*************************************************************/
	this.initializeObjects(gl);
	
	this.uniformShader = new uniformShader(gl);
	this.phongMultiLightShader = new phongMultiLightShader(gl,5,2,1);
	this.lambertianSingleColorMultiLightShader = new phongSingleColorMultiLightShader(gl,this.streetLamps.length+1,2,1);
	this.phongSingleColorMultiLightShader = new phongSingleColorMultiLightShader(gl,this.streetLamps.length+1,2,1);
	/*************************************************************/
	
	this.loadModels(gl);
	
};
