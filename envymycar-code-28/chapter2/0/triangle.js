function Triangle() {//line 1, listing 2.10
	this.name = "Triangle";
	this.vertices = new Float32Array([0,0,0,0.5,0,-1,-0.5,0,-1]);
	this.triangleIndices = new Uint16Array([0,1,2]);
	this.numVertices  = 3;
	this.numTriangles = 1;
};//line 7
