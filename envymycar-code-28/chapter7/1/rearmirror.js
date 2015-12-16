function RearMirror() {
	this.name = "RearMirror";

	this.vertices = new Float32Array(
	[-0.45,0.38,0,  0.453,0.388,0,   0.369,0.722,0,  -0.356,0.722,0, //mirror 8
	]  );
	var nv = this.vertices.length/3
	
	this.triangleIndices = new Uint16Array(
	[ 0,1,2,	0,2,3]
	);
	
	this.vertex_color = new Float32Array([
	1,0,0,1,	1,0,0,1,	1,0,0,1,	1,0,0,1,
	]
	);

	this.textureCoord = new Float32Array([
            0.0,0.0, 1.0,0.0, 	0.92,0.4, 0.08,0.4
	]
	);


	this.numVertices  = nv;
	this.numTriangles =nv-2;
};

