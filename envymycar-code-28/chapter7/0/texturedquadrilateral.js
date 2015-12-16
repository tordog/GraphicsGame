function TexturedQuadrilateral(quad,tex_coords) {
	//this.name = "Ground";

	var nv = 4;
	this.vertices = new Float32Array(nv  * 3);
	for(var i = 0; i < nv*3;++i)
		this.vertices[i] = quad[i];

	this.textureCoord = new Float32Array(nv  * 2);
	for(var i = 0; i < nv*2;++i)
		this.textureCoord[i] = tex_coords[i];
	
	this.triangleIndices = new Uint16Array(2*3);

 
	this.triangleIndices[0] = 0;
	this.triangleIndices[1] = 1;
	this.triangleIndices[2] = 2;

	this.triangleIndices[3] = 0;
	this.triangleIndices[4] = 2;
	this.triangleIndices[5] = 3;
	

	this.numVertices  = 4;
	this.numTriangles = 2;
};
