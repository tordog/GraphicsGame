///// STREET DEFINITION
/////
///// A circle which follows a circular path.
///// Resolution is the number of faces used to create the street.
///// The size of the street is conventionally assumed to be 2000 meters of diameter.
///// The width of the street (in meters) is given.
function Circle(resolution, radius, width) {

	this.name = "circular street";

	// vertices definition
	////////////////////////////////////////////////////////////
	var nv = 2*(2+2)*resolution;
	this.vertices = new Float32Array(3*nv);
	this.normals = new Float32Array(3*nv);
	
	var angle;
	var step = 6.283185307179586476925286766559 / resolution;
	
	// side 1
	// inner circle
	var vertexoffset = 0;
	var normaloffset = 0;
	for (var i = 0; i < resolution; i++) {
	
		angle = step * i;
		
		this.vertices[vertexoffset] = (radius-width/2.0) * Math.cos(angle);
		this.vertices[vertexoffset+1] = width/2;
		this.vertices[vertexoffset+2] = (radius-width/2.0) * Math.sin(angle);

		this.normals[normaloffset] = - this.vertices[vertexoffset] ;
		this.normals[normaloffset+1] = 0 ;
		this.normals[normaloffset+2] =  - this.vertices[vertexoffset+2] ;

		vertexoffset += 3;
		normaloffset += 3;
		}
	
	// outer circle
	for (var i = 0; i < resolution; i++) {
	
		angle = step * i;
		
		this.vertices[vertexoffset] = (radius+width/2.0) * Math.cos(angle);
		this.vertices[vertexoffset+1] = width/2;
		this.vertices[vertexoffset+2] = (radius+width/2.0) * Math.sin(angle);
		
		this.normals[normaloffset] =  this.vertices[vertexoffset] ;
		this.normals[normaloffset+1] =  0;
		this.normals[normaloffset+2] =   this.vertices[vertexoffset+2] ;

		vertexoffset += 3;
		normaloffset += 3;
	}
	
	// side 2
	// inner circle
	for (var i = 0; i < resolution; i++) {
	
		angle = step * i;
		
		this.vertices[vertexoffset] = (radius-width/2.0) * Math.cos(angle);
		this.vertices[vertexoffset+1] = -width/2;
		this.vertices[vertexoffset+2] = (radius-width/2.0) * Math.sin(angle);

		this.normals[normaloffset] = 		- this.vertices[vertexoffset] ;
		this.normals[normaloffset+1] = 	0 ;
		this.normals[normaloffset+2] =  	- this.vertices[vertexoffset+2] ;

		vertexoffset += 3;
		normaloffset += 3;

	}
	
	// outer circle
	for (var i = 0; i < resolution; i++) {
	
		angle = step * i;
		
		this.vertices[vertexoffset] = (radius+width/2.0) * Math.cos(angle);
		this.vertices[vertexoffset+1] = -width/2;
		this.vertices[vertexoffset+2] = (radius+width/2.0) * Math.sin(angle);
		
		this.normals[normaloffset] =   	this.vertices[vertexoffset] ;
		this.normals[normaloffset+1] =   	0;
		this.normals[normaloffset+2] =    	this.vertices[vertexoffset+2] ;

		vertexoffset += 3;
		normaloffset += 3;
	}
	
	// sides
	// inner circle

	var sidesV_offset = vertexoffset/3;
	var sidesN_offset = normaloffset/3;
	
	for (var i = 0; i < resolution; i++) {
	
		angle = step * i;
		
		this.vertices[vertexoffset] = (radius-width/2.0) * Math.cos(angle);
		this.vertices[vertexoffset+1] = width/2;
		this.vertices[vertexoffset+2] = (radius-width/2.0) * Math.sin(angle);

		this.normals[normaloffset] = 0;
		this.normals[normaloffset+1] = 1 ;
		this.normals[normaloffset+2] = 0;

		vertexoffset += 3;
		normaloffset += 3;
	}
	
	// outer circle
	for (var i = 0; i < resolution; i++) {
	
		angle = step * i;
		
		this.vertices[vertexoffset] = (radius+width/2.0) * Math.cos(angle);
		this.vertices[vertexoffset+1] = width/2;
		this.vertices[vertexoffset+2] = (radius+width/2.0) * Math.sin(angle);
		
		this.normals[normaloffset] =  0;
		this.normals[normaloffset+1] =  1;
		this.normals[normaloffset+2] =   0 ;

		vertexoffset += 3;
		normaloffset += 3;
	}
	
	// side 2
	// inner circle
	for (var i = 0; i < resolution; i++) {
	
		angle = step * i;
		
		this.vertices[vertexoffset] = (radius-width/2.0) * Math.cos(angle);
		this.vertices[vertexoffset+1] = -width/2;
		this.vertices[vertexoffset+2] = (radius-width/2.0) * Math.sin(angle);

		this.normals[normaloffset] = 		0;
		this.normals[normaloffset+1] = 	-1 ;
		this.normals[normaloffset+2] =  	0 ;

		vertexoffset += 3;
		normaloffset += 3;

	}
	
	// outer circle
	for (var i = 0; i < resolution; i++) {
	
		angle = step * i;
		
		this.vertices[vertexoffset] = (radius+width/2.0) * Math.cos(angle);
		this.vertices[vertexoffset+1] = -width/2;
		this.vertices[vertexoffset+2] = (radius+width/2.0) * Math.sin(angle);
		
		this.normals[normaloffset] =   	0;
		this.normals[normaloffset+1] =   	-1;
		this.normals[normaloffset+2] =    	0 ;

		vertexoffset += 3;
		normaloffset += 3;
	}

	
	
	// triangles definition
	////////////////////////////////////////////////////////////
	
	var nf = (2+2+2+2)*resolution;
	this.triangleIndices = new Uint16Array(3*nf);
	
	var triangleoffset = 0;
	for (var i = 0; i < resolution; i++)
	{
		this.triangleIndices[triangleoffset] = sidesV_offset+ i;
		this.triangleIndices[triangleoffset+1] = sidesV_offset+i + resolution;
		this.triangleIndices[triangleoffset+2] = sidesV_offset+(i+1) % resolution;
		triangleoffset += 3;
		
		this.triangleIndices[triangleoffset] = sidesV_offset+(i+1) % resolution;
		this.triangleIndices[triangleoffset+1] =sidesV_offset+ i + resolution;
		this.triangleIndices[triangleoffset+2] =sidesV_offset+ ((i+1) % resolution) + resolution;
		triangleoffset += 3;
		
		this.triangleIndices[triangleoffset] =  sidesV_offset+i+2*resolution;
		this.triangleIndices[triangleoffset+1] = sidesV_offset+ i + resolution+2*resolution;
		this.triangleIndices[triangleoffset+2] =  sidesV_offset+(i+1) % resolution+2*resolution;
		triangleoffset += 3;
		
		this.triangleIndices[triangleoffset] = sidesV_offset+(i+1) % resolution+2*resolution;
		this.triangleIndices[triangleoffset+1] = sidesV_offset+ i + resolution+2*resolution;
		this.triangleIndices[triangleoffset+2] =  sidesV_offset+((i+1) % resolution) + resolution+2*resolution;
		triangleoffset += 3;
		
		
		this.triangleIndices[triangleoffset] = i;
		this.triangleIndices[triangleoffset+1] = (i +1)% resolution;
		this.triangleIndices[triangleoffset+2] = i+2*resolution;
		triangleoffset += 3;

		this.triangleIndices[triangleoffset] = i+2*resolution;
		this.triangleIndices[triangleoffset+1] = (i +1)% resolution;
		this.triangleIndices[triangleoffset+2] =(i+1)% resolution+2*resolution;
		triangleoffset += 3;

		this.triangleIndices[triangleoffset] = i+resolution;
		this.triangleIndices[triangleoffset+1] = (i +1)% resolution+resolution;
		this.triangleIndices[triangleoffset+2] = i+2*resolution+resolution;
		triangleoffset += 3;

		this.triangleIndices[triangleoffset] = i+resolution+2*resolution;
		this.triangleIndices[triangleoffset+1] = (i +1)% resolution+resolution;
		this.triangleIndices[triangleoffset+2] =(i+1)% resolution+resolution+2*resolution;
		triangleoffset += 3;
		
		

	}
	
	this.numVertices = this.vertices.length/3;
	this.numTriangles = this.triangleIndices.length/3;
}