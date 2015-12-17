///// SPHERE SUBD DEFINITION
/////

var vertexoffset = 0;
var triangleoffset = 0;
var count = 0;

function SphereSubdSize () {

	this.name = "sphere_subd_size";
	//var subDivs = document.getElementById("numSubDivs").value;
	var subDivs=2;
	// vertices definition
	////////////////////////////////////////////////////////////

	var numOnSide=2;
	var j = 1;
	for(var i = 0; i<subDivs; i++){
		numOnSide += j;
		j=j*2;
	}
	//num per side..
	var numPerTriangle = 3 + (Math.pow(3, subDivs));
	if(subDivs%3 == 0){
		numPerTriangle+=3;
	} 

	//var nVertices = numPerTriangle + (3 * (numPerTriangle - numOnSide)) + (3* (numPerTriangle - (2*numOnSide)));
	var nVertices = numOnSide*numOnSide*8;// * (subDivs+1);
	//console.log("nVertices: " +nVertices);

	//var nVertices = 6 + (6*subDivs*2);
	this.vertices = new Float32Array(nVertices*3);
	
	
	//var vertexoffset = 0;
	
	
	
	// triangles definition
	////////////////////////////////////////////////////////////
	
	var nTriangles = 8*(Math.pow(4, subDivs));
	//console.log("nTriangles: " + nTriangles);
	//console.log(nVertices);
	this.triangleIndices = new Uint16Array(nTriangles*3);
	
	// lateral surface
	//var triangleoffset = 0;
	
	//define initial 6 vertices
	//0
	this.vertices[0] = 0;
	this.vertices[1] = 0;
	this.vertices[2] = 0;

	//1
	this.vertices[3] = 0;
	this.vertices[4] = 2;
	this.vertices[5] = 0;

	//2
	this.vertices[6] = 1;
	this.vertices[7] = 1;
	this.vertices[8] = 0;

	//3
	this.vertices[9] = 0;
	this.vertices[10] = 1;
	this.vertices[11] = 1;

	//4
	this.vertices[12] = -1;
	this.vertices[13] = 1;
	this.vertices[14] = 0;

	//5
	this.vertices[15] = 0;
	this.vertices[16] = 1;
	this.vertices[17] = -1;

	vertexoffset+=18;

	//console.log(vertexoffset);
	//bottom half
	createTriangles(0, subDivs, 0, 2, 3, this.vertices, this.triangleIndices);
	//console.log(vertexoffset);

	//0, 3 vertices already added
	createTriangles(0, subDivs, 0, 3, 4, this.vertices, this.triangleIndices);
	//console.log(vertexoffset);

	//0, 4 vertices already added
	createTriangles(0, subDivs, 0, 4, 5, this.vertices, this.triangleIndices);

	//0, 5 and 5, 2 vertices already added
	createTriangles(0, subDivs, 0, 5, 2, this.vertices, this.triangleIndices);
	//top half
	//2, 3 already added
	createTriangles(0, subDivs, 1, 2, 3, this.vertices, this.triangleIndices);

	//1, 3 and 3, 4 already added
	createTriangles(0, subDivs, 1, 3, 4, this.vertices, this.triangleIndices);

	//1, 4 and 4, 5 already added
	createTriangles(0, subDivs, 1, 4, 5, this.vertices, this.triangleIndices);

	//all main sides have been added
	createTriangles(0, subDivs, 1, 5, 2, this.vertices, this.triangleIndices);


	//console.log(vertexoffset + " should be " + nVertices*3);
	this.numVertices = this.vertices.length/3;
	this.numTriangles = this.triangleIndices.length/3;
}

function addTriangle(p1, p2, p3, triangleIndices){
	//console.log("Adding triangle: " + p1 + ", " + p2 + ", " + p3);
	triangleIndices[triangleoffset] = p1;
	triangleIndices[triangleoffset+1] = p2;
	triangleIndices[triangleoffset+2] = p3;
	triangleoffset+=3;
}

function createTriangles(level, subDivs, p1, p2, p3, vertices, triangleIndices) {
	if(level == subDivs){
		addTriangle(p1, p2, p3, triangleIndices);
		return;
	}
	else{
		//create vertices
		//m1 = midpoint of p1, p2.
		//m2 = midpoint of p2, p3.
		//m3 = midpoint of p3, p1.
		//meanwhile, p1*3 = vertex
		var index1 = p1 * 3;
		var index2 = p2 * 3;
		var index3 = p3 * 3;
		var m1x = (vertices[index1] + vertices[index2]) / 2;
		var m1y = (vertices[index1+1] + vertices[index2+1]) / 2;
		var m1z = (vertices[index1+2] + vertices[index2+2]) / 2;

		//make unit vector
		//origin = (0, 1, 0)
		var vm1x = m1x;
		var vm1y = m1y-1;
		var vm1z = m1z;

		var m1mag = Math.sqrt((vm1x*vm1x) + (vm1y*vm1y) + (vm1z*vm1z));

		m1x = vm1x/m1mag;
		m1y = vm1y/m1mag;
		m1z = vm1z/m1mag;
		m1y+=1; 

		var temp = Math.sqrt((m1x*m1x) + (m1y*m1y) + (m1z*m1z));
		//console.log(m1x +", "+ m1y + ", " + m1z + "   magnitude = " + temp);

		var m2x = (vertices[index2] + vertices[index3]) / 2;
		var m2y = (vertices[index2+1] + vertices[index3+1]) / 2;
		var m2z = (vertices[index2+2] + vertices[index3+2]) / 2;

		var vm2x = m2x;
		var vm2y = m2y-1;
		var vm2z = m2z;

		var m2mag = Math.sqrt((vm2x*vm2x) + (vm2y*vm2y) + (vm2z*vm2z));
		m2x = vm2x/m2mag;
		m2y = vm2y/m2mag;
		m2z = vm2z/m2mag;
		m2y+=1;

		var m3x = (vertices[index3] + vertices[index1]) / 2;
		var m3y = (vertices[index3+1] + vertices[index1+1]) / 2;
		var m3z = (vertices[index3+2] + vertices[index1+2]) / 2;
		var vm3x = m3x;
		var vm3y = m3y-1;
		var vm3z = m3z;
		var m3mag = Math.sqrt((vm3x*vm3x) + (vm3y*vm3y) + (vm3z*vm3z));
		m3x = vm3x/m3mag;
		m3y = vm3y/m3mag;
		m3z = vm3z/m3mag;
		m3y+=1;
		// console.log(m3x + " = " + 0);
		// console.log(m3y + " = " + .5);
		// console.log(m3z + " = " + .5);

		//(m1x, m1y, m1z) exists already, then find vertex that it corresponds to.
		var m1=vertexoffset/3;
		for(var i = 0; i < vertexoffset; i+=3){
			if((vertices[i] == m1x) && (vertices[i+1] == m1y) && (vertices[i+2] == m1z)){
				m1 = i/3;
			}
		}
		if(m1 == vertexoffset/3){
			vertices[vertexoffset] = m1x;
			vertices[vertexoffset+1] = m1y;
			vertices[vertexoffset+2] = m1z;
			vertexoffset+=3;
		}

		var m2=vertexoffset/3;
		for(var i = 0; i < vertexoffset; i+=3){
			if((vertices[i] == m2x) && (vertices[i+1] == m2y) && (vertices[i+2] == m2z)){
				m2 = i/3;
			}
		}
		if(m2 == vertexoffset/3){
			vertices[vertexoffset] = m2x;
			vertices[vertexoffset+1] = m2y;
			vertices[vertexoffset+2] = m2z;
			vertexoffset+=3;
		}

		var m3=vertexoffset/3;
		for(var i = 0; i < vertexoffset; i+=3){
			if((vertices[i] == m3x) && (vertices[i+1] == m3y) && (vertices[i+2] == m3z)){
				m3 = i/3;
			}
		}
		if(m3 == vertexoffset/3){
			vertices[vertexoffset] = m3x;
			vertices[vertexoffset+1] = m3y;
			vertices[vertexoffset+2] = m3z;
			vertexoffset+=3;
		}

		createTriangles(level+1, subDivs, p1, m1, m3, vertices, triangleIndices);
		createTriangles(level+1, subDivs, p2, m1, m2, vertices, triangleIndices);
		createTriangles(level+1, subDivs, p3, m2, m3, vertices, triangleIndices);
		createTriangles(level+1, subDivs, m1, m2, m3, vertices, triangleIndices);
	}

}





