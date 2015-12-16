// Global NVMC Client
// ID 9.3

/***********************************************************************/
var NVMCClient = NVMCClient || {};
/***********************************************************************/

NVMCClient.billboardCloudTree = null;
NVMCClient.billboardCloudTreeBody = null;

NVMCClient.billboardRenderer = null;
NVMCClient.billboardRendererBody = null;
NVMCClient.billboardTechnique = null;



NVMCClient.loadBillboardCloud = function (gl){
	var stack = this.stack;
	var me = this;

    sglRequestObj(NVMC.resource_path+"geometry/tree/tree-leaves-only.obj", function (modelDescriptor) {
        me.billboardCloudTree = new SglModel(gl, modelDescriptor);
        me.billboardCloudTree.order = [];
        for(var i in me.game.race.trees)
            me.billboardCloudTree.order[i] = i;
        me.billboardCloudTree.texture = me.createTexture(gl,NVMC.resource_path+'geometry/tree/leaves.png'	);
        me.billboardCloudTree.textureSgl = null;

    });

    sglRequestObj(NVMC.resource_path+"geometry/tree/tree-body-only.obj", function (modelDescriptor) {
        me.billboardCloudTreeBody = new SglModel(gl, modelDescriptor);
    });


	this.billboardRenderer = new SglModelRenderer(gl);	
	this.billboardTechnique = new SglTechnique( gl,
		{	vertexShader	:this.billboardShader.vertex_shader, 
			fragmentShader	:this.billboardShader.fragment_shader,
			vertexStreams 		: 
			{
				"aPosition"	    : [ 0.0,0.0,0.0,0.0],
				"aTexCoord" 	: [ 0.25,0.25,0.0,1.0]
			},
			globals : {
				"uProjectionMatrix" :   {   semantic:   "PROJECTION_MATRIX" ,value  : this.projectionMatrix },
				"uModelViewMatrix"  :   {   semantic:   "WORLD_VIEW_MATRIX" ,value  : this.stack.matrix     },
				"uTexture"          :   {   semantic:   "TEXTURE"           ,value  : 0                     }
			}
		});
	this.billboardRendererBody = new SglModelRenderer(gl);	
	this.billboardTechniqueBody = new SglTechnique( gl,{	
			vertexShader	:this.lambertianSingleColorShader.vertex_shader, 
			fragmentShader	:this.lambertianSingleColorShader.fragment_shader,
			vertexStreams 		: 
			{
				"aPosition"	    : [ 0.0,0.0,0.0,0.0],
				"aColor"		: [ 0.0,0.0,0.0,0.0],
				"Normal"		: [ 0.0,0.0,0.0,0.0]
			},
			globals : {
				"uProjectionMatrix" : { semantic : "PROJECTION_MATRIX", value : this.projectionMatrix },
				"uModelViewMatrix":{semantic:"WORLD_VIEW_MATRIX",value : this.stack.matrix },
				"uViewSpaceNormalMatrix":{semantic:"VIEWSPACE_NORMAL_MATRIX",value: SglMat4.to33(this.stack.matrix)},
				"uColor":{semantic:"COLOR",value : [0.2,0.0,0.0] },
				"uLightColor":{semantic:"LIGHT_COLOR",value : [0.8,0.8,0.8] },
				"uLightDirection":{semantic:"LIGHT_DIRECTION",value:[1,0,0]},
			}
		});
 
};
 
NVMCClient.drawTrees = function (gl,framebuffer){
	if(!this.billboardCloudTree) return;
	if(framebuffer)
		var fb = new SglFramebuffer(gl, {handle: framebuffer,autoViewport:false});

	var ma = this.stack.matrix;
	var pos  = this.cameras[this.currentCamera].position;	
	 
	var bbt = this.billboardCloudTree;
	var trees = this.game.race.trees;
 	bbt.order.sort(function(a,b) {
		return SglVec3.length(SglVec3.sub(trees[b].position,pos)) - SglVec3.length(SglVec3.sub(trees[a].position,pos))
	});
 
	this.billboardRendererBody.begin();
	if(framebuffer)
	    	this.billboardRendererBody.setFramebuffer(fb);

	this.billboardRendererBody.setTechnique(this.billboardTechniqueBody);

	this.billboardRendererBody.setGlobals({
	"PROJECTION_MATRIX": this.projectionMatrix,
	"WORLD_VIEW_MATRIX": this.stack.matrix,
	"VIEWSPACE_NORMAL_MATRIX":SglMat4.to33(this.stack.matrix),
	"COLOR":[100.0/255,70.0/255,0.0,1.0],
	"LIGHT_COLOR":[0.8,0.8,0.8],
	"LIGHT_DIRECTION":this.sunLightDirectionViewSpace
	});

	this.billboardRendererBody.setPrimitiveMode("FILL");	
	this.billboardRendererBody.setModel(this.billboardCloudTreeBody);

	for(var i in trees){ 
		var tpos = trees[bbt.order[i]].position;
		this.stack.push();
	 	this.stack.multiply(SglMat4.translation(tpos));
	 	this.stack.multiply(SglMat4.scaling([0.5,0.5,0.5]));
	this.billboardRendererBody.setGlobals({
	"WORLD_VIEW_MATRIX": this.stack.matrix,
	});		
	this.billboardRendererBody.renderModel();
	this.stack.pop();
	}

	this.billboardRendererBody.end();
 
	if( !this.billboardCloudTree.textureSgl)
	    this.billboardCloudTree.textureSgl = new SglTexture2D(gl,this.billboardCloudTree.texture );
	gl.depthMask(false);
	gl.enable(gl.BLEND);
	gl.blendFunc( gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
	this.billboardRenderer.begin();
	if(framebuffer)
	    	this.billboardRenderer.setFramebuffer(fb);
	this.billboardRenderer.setTechnique(this.billboardTechnique);


	this.billboardRenderer.setGlobals({
	"PROJECTION_MATRIX": this.projectionMatrix,
	"WORLD_VIEW_MATRIX": this.stack.matrix,
	"TEXTURE": 0,
	});

	this.billboardRenderer.setPrimitiveMode("FILL");
	this.billboardRenderer.setTexture(0,this.billboardCloudTree.textureSgl);	
	this.billboardRenderer.setModel(this.billboardCloudTree);

	for(var i in trees){ 
		var tpos = trees[bbt.order[i]].position;
		this.stack.push();
	 	this.stack.multiply(SglMat4.translation(tpos));
	 	this.stack.multiply(SglMat4.scaling([0.5,0.5,0.5]));
		this.billboardRenderer.setGlobals({
		"WORLD_VIEW_MATRIX": this.stack.matrix,
		});		
		this.billboardRenderer.renderModel();

		this.stack.pop();
	}
	this.billboardRenderer.end();

	gl.disable(gl.BLEND);
	gl.depthMask(true);
 
};
 
	
 

NVMCClient.drawEverything = function (gl,excludeCar) {
	var stack  = this.stack;
	this.sunLightDirectionViewSpace = SglMat4.mul4(this.stack.matrix,this.sunLightDirection);
	var pos  = this.game.state.players.me.dynamicState.position;	
	
	

	// Setup projection matrix
	gl.useProgram(this.uniformShader);
	gl.uniformMatrix4fv(this.uniformShader.uProjectionMatrixLocation, false, this.projectionMatrix);
	
	

	gl.useProgram(this.phongShader);
	gl.uniformMatrix4fv(this.phongShader.uProjectionMatrixLocation,false,this.projectionMatrix);
	gl.uniformMatrix4fv(this.phongShader.uModelViewMatrixLocation,false,stack.matrix  );
	gl.uniformMatrix3fv(this.phongShader.uViewSpaceNormalMatrixLocation,false, SglMat4.to33(this.stack.matrix) );	
	gl.uniform4fv(this.phongShader.uLightDirectionLocation,this.sunLightDirectionViewSpace);
	
	gl.uniform3fv(this.phongShader.uLightColorLocation,[0.9,0.9,0.9]);
	gl.uniform1f(this.phongShader.uShininessLocation,0.2);
	gl.uniform1f(this.phongShader.uKaLocation,0.5);
	gl.uniform1f(this.phongShader.uKdLocation,0.5);
	gl.uniform1f(this.phongShader.uKsLocation, 1.0);
 
	gl.useProgram(this.textureNormalMapShader);
	gl.uniformMatrix4fv(this.textureNormalMapShader.uProjectionMatrixLocation, false, this.projectionMatrix);
	gl.uniformMatrix4fv(this.textureNormalMapShader.uModelViewMatrixLocation, false, stack.matrix);
	gl.uniform1i(this.textureNormalMapShader.uTextureLocation,0);
	gl.uniform1i(this.textureNormalMapShader.uNormalMapLocation,1);
	gl.uniform4fv(this.textureNormalMapShader.uLightDirectionLocation,this.sunLightDirection);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D,this.texture_street);
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D,this.normal_map_street);
	this.drawObject(gl, this.track,this.textureNormalMapShader, [0.9, 0.8, 0.7,1.0]);

	gl.activeTexture(gl.TEXTURE0);
  	gl.bindTexture(gl.TEXTURE_2D,this.texture_ground);
	gl.useProgram(this.textureShader);
	gl.uniformMatrix4fv(this.textureShader.uProjectionMatrixLocation, false, this.projectionMatrix);
	gl.uniformMatrix4fv(this.textureShader.uModelViewMatrixLocation, false, stack.matrix);
	gl.uniform1i(this.textureShader.uTextureLocation, 0);
	this.drawObject(gl,this.ground,this.textureShader,[0.3, 0.7, 0.2,1.0], [0, 0, 0,1.0]);
 
	for (var i in this.buildings) {
		gl.bindTexture(gl.TEXTURE_2D, this.texture_facade[i%this.texture_facade.length]);
		this.drawObject(gl, this.buildings[i], this.textureShader, [0.2, 0.2, 0.2, 1.0], [0, 0, 0, 1.0]);
	}

	gl.bindTexture(gl.TEXTURE_2D, this.texture_roof);
	for (var i in this.buildings) {
		this.drawObject(gl, this.buildings[i].roof, this.textureShader, [0.2, 0.2, 0.2, 1.0], [0, 0, 0, 1.0]);
	}

	if( !excludeCar &&  this.currentCamera!=3 ){
 		stack.push();
			var M_9 = SglMat4.translation(pos);
			stack.multiply(M_9);

			var M_9bis = SglMat4.rotationAngleAxis(this.game.state.players.me.dynamicState.orientation, [0, 1, 0]);
			stack.multiply(M_9bis);

 			this.drawCar(gl);
		stack.pop();		
	}	
	this.drawTrees(gl);

}

NVMCClient.drawScene = function (gl) {
    if(NVMCClient.n_resources_to_wait_for>0)return;
    var width  = this.ui.width;
	var height = this.ui.height
	var ratio  = width / height;
	 
	this.drawOnReflectionMap(gl,SglVec3.add(this.game.state.players.me.dynamicState.position,[0.0,1.5,0.0]));
	gl.viewport(0, 0, width, height);

	// Clear the framebuffer
	var stack  = this.stack;
	gl.clearColor(0.4, 0.6, 0.8, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	 

	this.projectionMatrix = SglMat4.perspective(3.14/4,ratio,0.1,1000);
	this.cameras[2].projectionMatrix = this.projectionMatrix;

	stack.loadIdentity();
	var pos  = this.game.state.players.me.dynamicState.position;
	var orientation  = this.game.state.players.me.dynamicState.orientation;
	this.cameras[this.currentCamera].setView(this.stack,this.myFrame());	
	this.viewFrame = SglMat4.inverse(this.stack.matrix);
	this.drawSkyBox(gl);
	 
	gl.enable(gl.DEPTH_TEST);
	

 	if( this.currentCamera==3 ){
	 		gl.useProgram(this.perVertexColorShader);
			gl.enable(gl.STENCIL_TEST);
			gl.clearStencil(0);
			gl.stencilMask(~0);
			gl.stencilFunc(gl.ALWAYS,1,0xFF);
			gl.stencilOp(gl.REPLACE,gl.REPLACE,gl.REPLACE);
		
			gl.uniformMatrix4fv(this.perVertexColorShader.uModelViewMatrixLocation, false, SglMat4.identity());
			gl.uniformMatrix4fv(this.perVertexColorShader.uProjectionMatrixLocation, false, SglMat4.identity());
			this.drawObject(gl, this.cabin,this.perVertexColorShader, [0.4, 0.8, 0.9,1.0]);
		
			gl.stencilFunc(gl.GREATER,1,0xFF);
			gl.stencilOp(gl.KEEP,gl.KEEP,gl.KEEP);
			gl.stencilMask(0);
	}else
		gl.disable(gl.STENCIL_TEST);
	
 
	this.drawEverything(gl);
		 
	
	if( this.currentCamera==3 ){
		
		// draw the scene for the back mirror
		this.stack.loadIdentity();
		gl.useProgram(this.lambertianSingleColorShader);
		var invPositionMatrix 	= SglMat4.translation		(SglVec3.neg(SglVec3.add(this.game.state.players.me.dynamicState.position,[0,1.8,0])));
		var xMatrix 	= SglMat4.rotationAngleAxis	(-0.2, [1, 0, 0]);
		var invOrientationMatrix 	= SglMat4.rotationAngleAxis	(-this.game.state.players.me.dynamicState.orientation, [0, 1, 0]);
		var invV = SglMat4.mul(SglMat4.mul(xMatrix,invOrientationMatrix),invPositionMatrix);
		this.stack.multiply(invV);
		
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.rearMirrorTextureTarget.framebuffer);
		gl.disable(gl.STENCIL_TEST);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		this.drawEverything(gl);
		gl.bindFramebuffer(gl.FRAMEBUFFER,  null);
		
	 
		gl.useProgram(this.textureShader);
		gl.bindTexture(gl.TEXTURE_2D,this.rearMirrorTextureTarget.texture);
		gl.uniformMatrix4fv(this.textureShader.uModelViewMatrixLocation, false, SglMat4.identity());
		gl.uniformMatrix4fv(this.textureShader.uProjectionMatrixLocation, false, SglMat4.identity());
		this.drawObject( gl, this.rearMirror, this.textureShader,[1.0,1.0,1.0,1.0],[1.0,1.0,1.0,1.0]);
		
		gl.useProgram(this.perVertexColorShader);
		gl.enable(gl.BLEND);
		gl.blendFunc( gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
		gl.useProgram(this.perVertexColorShader);
		gl.uniformMatrix4fv(this.perVertexColorShader.uModelViewMatrixLocation, false, SglMat4.identity());
		gl.uniformMatrix4fv(this.perVertexColorShader.uProjectionLocation, false, SglMat4.identity());
		this.drawObject(gl, this.windshield, this.perVertexColorShader);
		gl.disable(gl.BLEND);
	}  
	
};

// NVMC Client Events
/***********************************************************************/
NVMCClient.onInitialize = function () {
	var gl = this.ui.gl;
	this.cameras[2].width  = this.ui.width;
	this.cameras[2].height = this.ui.height;


	/*************************************************************/
	NVMC.log("SpiderGL Version : " + SGL_VERSION_STRING + "\n");
	/*************************************************************/

	/*************************************************************/
	this.game.player.color = [ 1.0, 0.0, 0.0, 1.0 ];
	/*************************************************************/

	/*************************************************************/
	this.initMotionKeyHandlers();
	/*************************************************************/
	
	/*************************************************************/
	this.stack 			= new SglMatrixStack();
	this.projection_matrix 	=  SglMat4.identity();
	
	/*************************************************************/
	this.initializeObjects(gl);
	this.initializeCameras();

	this.uniformShader 			        = new uniformShader(gl);
	this.perVertexColorShader 		    = new perVertexColorShader(gl);
	this.lambertianSingleColorShader 	= new lambertianSingleColorShader(gl);
	this.phongShader 			        = new phongShader(gl);
	this.textureShader 			        = new textureShader(gl);
	this.textureNormalMapShader 		= new textureNormalMapShader(gl);
	this.skyBoxShader 			        = new skyBoxShader(gl);
	this.reflectionMapShader 		    = new reflectionMapShader(gl);
	this.showCubeMapShader	            = new showCubeMapShader(gl);
	this.billboardShader 			    = new billboardShader(gl);
	
	/*************************************************************/

    this.texture_street = this.createTexture(gl, 				NVMC.resource_path+'textures/street4.png');
    this.normal_map_street = this.createTexture(gl, NVMC.resource_path+'textures/asphalt_normal_map.jpg');
    this.texture_ground = this.createTexture(gl, 				NVMC.resource_path+'textures/grass_tile_003_col.png');
    NVMCClient.texture_facade.push(this.createTexture(gl,       NVMC.resource_path+'textures/facade1.jpg'));
    NVMCClient.texture_facade.push(this.createTexture(gl,       NVMC.resource_path+'textures/facade2.jpg'));
    NVMCClient.texture_facade.push(this.createTexture(gl,       NVMC.resource_path+'textures/facade3.jpg'));
    NVMCClient.texture_roof = this.createTexture(gl,			NVMC.resource_path+'textures/concreteplane2k.jpg');


    this.cubeMap = this.createCubeMap(gl,
        NVMC.resource_path+'textures/cubemap/posx.jpg',
        NVMC.resource_path+'textures/cubemap/negx.jpg',
        NVMC.resource_path+'textures/cubemap/posy.jpg',
        NVMC.resource_path+'textures/cubemap/negy.jpg',
        NVMC.resource_path+'textures/cubemap/posz.jpg',
        NVMC.resource_path+'textures/cubemap/negz.jpg'
    );

	this.createReflectionMap(gl);
 	this.loadCarModel(gl,NVMC.resource_path+"geometry/cars/eclipse/eclipse-white.obj");
	this.createTechniqueReflection(gl);
	this.loadBillboardCloud(gl);

	this.rearMirrorTextureTarget = this.prepareRenderToTextureFrameBuffer(gl);
	this.prepareRenderToCubeMapFrameBuffer(gl);
};

	

