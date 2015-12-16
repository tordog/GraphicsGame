///// CYLINDER DEFINITION
/////
///// hres defines the number of faces used to create a base cylinder (the lateral surface is composed by hres*2 triangles to be precise).
///// vres is the number of such base cylinders connected togethers to form the final cylinder.
///// Cylinder is defined to be centered at the origin of the coordinate axis, and lying on the XZ plane.
///// Cylinder height is assumed to be 2.0. Cylinder radius is assumed to be 1.0.
function Cylinder (hres,vres) {

	// if vres is not defined we set vres to obtain the same definition of the cylinder as in chapter3
	if (!vres)
		vres=1;

	this.name = "cylinder";

	// vertices definition
	////////////////////////////////////////////////////////////
	
	this.vertices = new Float32Array(3*(((vres+1)*hres)+2));
	
	var radius = 1.0;
	var angle;
	var step = 6.283185307179586476925286766559 / hres;
	var heightstep = 2.0 / vres;
	
	// circles (the cylinder is composed by vres+1 circles)
	var vertexoffset = 0;
	
	for (var j = 0; j <= vres; j++) {
		for (var i = 0; i < hres; i++) {
	
			angle = step * i;
		
			this.vertices[vertexoffset] = radius * Math.cos(angle);
			this.vertices[vertexoffset+1] = j*heightstep;
			this.vertices[vertexoffset+2] = radius * Math.sin(angle);
			vertexoffset += 3;
		}
	}

	centervertex_bottom_offset = vertexoffset/3;
	this.vertices[vertexoffset] = 0.0;
	this.vertices[vertexoffset+1] = 0.0;
	this.vertices[vertexoffset+2] = 0.0;
	vertexoffset += 3;

	centervertex_top_offset = vertexoffset/3;
	this.vertices[vertexoffset] = 0.0;
	this.vertices[vertexoffset+1] = 2.0;
	this.vertices[vertexoffset+2] = 0.0;
	
	
	// triangles definition
	////////////////////////////////////////////////////////////
	
	this.triangleIndices = new Uint16Array(3*(2*hres*vres+2*hres));
	
	// lateral surface
	var triangleoffset = 0;
	for (var j = 0; j < vres; j++)
	{
		for (var i = 0; i < hres; i++)
		{
			this.triangleIndices[triangleoffset] = i + j*hres;
			this.triangleIndices[triangleoffset+1] = (i+1) % hres + j*hres;
			this.triangleIndices[triangleoffset+2] = (i % hres) + hres + j*hres;
			triangleoffset += 3;
		
			this.triangleIndices[triangleoffset] = (i % hres) + hres + j*hres;
			this.triangleIndices[triangleoffset+1] = (i+1) % hres + j*hres;
			this.triangleIndices[triangleoffset+2] = ((i+1) % hres) + hres + j*hres;
			triangleoffset += 3;
		}
	}
	
	// bottom of the cylinder
/*	for (var i = 0; i < hres; i++)
	{
		this.triangleIndices[triangleoffset] = i;
		this.triangleIndices[triangleoffset+1] = (i+1) % hres;
		this.triangleIndices[triangleoffset+2] = centervertex_bottom_offset;
		triangleoffset += 3;
	}
	
	// top of the cylinder
	for (var i = 0; i < hres; i++)
	{
		this.triangleIndices[triangleoffset] = i + hres*vres;
		this.triangleIndices[triangleoffset+1] = ((i+1) % hres) + hres*vres;
		this.triangleIndices[triangleoffset+2] = centervertex_top_offset;
		triangleoffset += 3;
	}
	*/	
	this.numVertices = this.vertices.length/3;
	this.numTriangles = this.triangleIndices.length/3;
}
