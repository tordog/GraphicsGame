// Global NVMC Client
// ID 8.1 

/***********************************************************************/
var NVMCClient = NVMCClient || {};
/***********************************************************************/


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
	enlargeBBox(this.game.race.bbox,0.01);
	/*************************************************************/
	this.initializeObjects(gl);
	this.createFullScreenQuad(gl);
	this.initializeCameras();

	this.uniformShader 			= new uniformShader(gl);
	this.perVertexColorShader 		= new perVertexColorShader(gl);
	this.lambertianSingleColorShader 	= new lambertianSingleColorShader(gl);
	this.phongShader 			= new phongShader(gl);
	this.textureShader 			= new textureShader(gl);
	this.skyBoxShader 			= new skyBoxShader(gl);
	this.showCubeMapShader			= new showCubeMapShader(gl);
	this.shadowMapCreateShader		= new shadowMapCreateShader(gl);
	this.shadowMapShader			= new shadowMapShader(gl);
	this.T		= new textureShadowShader(gl);
	this.TPCF		= new texturePCFShadowShader(gl);

	this.textureShadowShader		= this.T;
	this.textureNormalMapShadowShader 	= new textureNormalMapShadowShader(gl);

	this.RM = new reflectionMapShadowShader(gl);
	this.RMPCF = new reflectionMapPCFShadowShader(gl);
	this.L = new lambertianSingleColorShadowShader(gl);
	this.LPCF = new lambertianSingleColorPCFShadowShader(gl);

	this.reflectionMapShadowShader 	= this.RM;
	this.lambertianSingleColorShadowShader = this.L;

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
	
	this.createTechniqueShadow(gl);

	this.sgl_techniqueN =  this.sgl_technique;

	this.reflectionMapShadowShader = this.RMPCF; 
	this.createTechniqueShadow(gl);
	this.sgl_techniquePCF =  this.sgl_technique;
	this.reflectionMapShadowShader = this.RM; 

	this.createDepthOnlyTechnique(gl);

	this.rearMirrorTextureTarget = this.prepareRenderToTextureFrameBuffer(gl);
	this.shadowMapTextureTarget = this.prepareRenderToTextureFrameBuffer(gl,false,4096,4096);
	this.prepareRenderToCubeMapFrameBuffer(gl);
	this.sunLightDirection = [-2.4,-1,-0,0.0];
};


NVMCClient.onKeyDown = function (keyCode, event) {

	if (this.currentCamera != 2)
		(this.carMotionKey[keyCode]) && (this.carMotionKey[keyCode])(true);
		
	this.cameras[this.currentCamera].keyDown(keyCode);
	
	if (keyCode == "X")
	{
			if(this.sgl_technique == this.sgl_techniqueN){
				this.sgl_technique = this.sgl_techniquePCF;	
				this.lambertianSingleColorShadowShader = this.LPCF;
				this.textureShadowShader = this.TPCF;
		}else
		{
				this.sgl_technique = this.sgl_techniqueN;	
				this.lambertianSingleColorShadowShader = this.L;
				this.textureShadowShader = this.T;		
}
	}
}

NVMCClient.onKeyUp = function (keyCode, event) {

	if (keyCode == "2") {
		this.nextCamera();
		return;
	}
	
	if (keyCode == "1") {
		this.prevCamera();
		return;
	}

	if (this.currentCamera != 2)
		(this.carMotionKey[keyCode]) && (this.carMotionKey[keyCode])(false);
		
	this.cameras[this.currentCamera].keyUp(keyCode);
};


