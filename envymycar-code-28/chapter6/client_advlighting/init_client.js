NVMCClient.prototype.axisVertexBuffer = null;


/****************************************************
Create the object 'primitive'  from the NVMCClient.track
****************************************************/
NVMCClient.prototype.trackPrimitive = function( track ) {

	this.name = "track";

	var nv = track.pointsCount;
	this.vertices = new Float32Array(nv*2*3);
	
	var vertexOffset = 0;
	for (var i = 0; i <nv; i++) {
			var v = track.leftSideAt(i);
			this.vertices[vertexOffset] = v[0];
			this.vertices[vertexOffset+1] = v[1];
			this.vertices[vertexOffset+2] = v[2];
			vertexOffset = vertexOffset +3;
		}
		
	for (var i = 0; i <nv; i++) {
			var v = track.rightSideAt(i);
			this.vertices[vertexOffset] = v[0];
			this.vertices[vertexOffset+1] = v[1];
			this.vertices[vertexOffset+2] = v[2];
			vertexOffset = vertexOffset +3;
		}
		
	this.triangleIndices = new Uint16Array(3*2*nv);
	
	var triangleoffset = 0;
	for (var i = 0; i < nv * 2 ; i++){
		this.triangleIndices[triangleoffset]  = nv+(i+nv)%nv;
		this.triangleIndices[triangleoffset+1]  = nv+(i+nv+1)%nv;
		this.triangleIndices[triangleoffset+2]  = i;
		triangleoffset = triangleoffset +3 ;

		this.triangleIndices[triangleoffset]  = i%nv;
		this.triangleIndices[triangleoffset+1]  = nv+(i+nv+1)%nv;
		this.triangleIndices[triangleoffset+2]  = (i+1)%nv;
		triangleoffset = triangleoffset +3 ;
	}
	
	this.numVertices = nv;
	this.numTriangles = this.triangleIndices.length/3;
}


/****************************************************
Create the object 'primitive'  from the bulding
****************************************************/
NVMCClient.prototype.Building = function(b) {

	this.name = "building";

	var nv = b.pointsCount;
	this.vertices = new Float32Array(nv*2*3);
	
	var vertexOffset = 0;
	for (var i = 0; i <nv; i++) {
			var v =  b.positionAt(i);
			this.vertices[vertexOffset] = v[0];
			this.vertices[vertexOffset+1] = v[1];
			this.vertices[vertexOffset+2] = v[2];
			vertexOffset = vertexOffset +3;
		}

	for (var i = 0; i <nv; i++) {
			var v =  b.positionAt(i);
			this.vertices[vertexOffset] = 		v[0];
			this.vertices[vertexOffset+1] = 	b.heightAt(i);
			this.vertices[vertexOffset+2] =	v[2];
			vertexOffset = vertexOffset +3;
		}
		
		
	this.triangleIndices = new Uint16Array(3*(2*nv+nv-2));
	
	var triangleoffset = 0;
	for (var i = 0; i < nv ; i++){
		this.triangleIndices[triangleoffset]  = nv+(i+nv)%nv;
		this.triangleIndices[triangleoffset+1]  = nv+(i+nv+1)%nv;
		this.triangleIndices[triangleoffset+2]  = i;
		triangleoffset = triangleoffset +3 ;

		this.triangleIndices[triangleoffset]  = i%nv;
		this.triangleIndices[triangleoffset+1]  = nv+(i+nv+1)%nv;
		this.triangleIndices[triangleoffset+2]  = (i+1)%nv;
		triangleoffset = triangleoffset +3 ;
	}
	
	/* triangles for the roof */
	for (var i = 0; i < nv-2 ; i++){
		this.triangleIndices[triangleoffset]  = nv;
		this.triangleIndices[triangleoffset+1]  = nv+ (i+1) %nv;
		this.triangleIndices[triangleoffset+2]  = nv + (i+2) %nv;;
		triangleoffset = triangleoffset +3 ;
	}
	
	
	this.numVertices = nv;
	this.numTriangles = this.triangleIndices.length/3;
}

//// Initialize the buffers
////
NVMCClient.prototype.initBuffers = function (gl, primitive) {
	
	primitive.vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, primitive.vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, primitive.vertices, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	
	primitive.indexBufferTriangles = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, primitive.indexBufferTriangles);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, primitive.triangleIndices, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	
	// create edges
	var edges = new Uint16Array(primitive.numTriangles*3*2);
	
	for (var i = 0; i < primitive.numTriangles; i++) {
		edges[i*6+0] = primitive.triangleIndices[i*3+0];
		edges[i*6+1] = primitive.triangleIndices[i*3+1];
		edges[i*6+2] = primitive.triangleIndices[i*3+0];
		edges[i*6+3] = primitive.triangleIndices[i*3+2];
		edges[i*6+4] = primitive.triangleIndices[i*3+1];
		edges[i*6+5] = primitive.triangleIndices[i*3+2];
	}
	
	primitive.indexBufferEdges = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, primitive.indexBufferEdges);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, edges, gl.STATIC_DRAW);	
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
}

NVMCClient.prototype.initAxisBuffers= function (gl){
	
	axisVertices = new Float32Array([
		0.0, 0.0,  0.0, 
		5.0, 0.0,  0.0,
		0.0, 0.0,  0.0,
		0.0, 5.0,  0.0,
		0.0, 0.0, 0.0,
		0.0, 0.0, 5.0
	]);
	
	axisVertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, axisVertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, axisVertices, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	
	
}

 NVMCClient.prototype.initialize= function (gl) {	
	this.initBuffers(gl, cube);
	this.initBuffers(gl, cylinder);
	this.initBuffers(gl, cone);
	this.initBuffers(gl, trackPrim);
	for(var i in this.buildings)
		this.initBuffers(gl, this.buildings[i]);
	 
	this.initAxisBuffers(gl);
}

 NVMCClient.prototype.drawAxis= function (){
	
	gl.bindBuffer(gl.ARRAY_BUFFER, axisVertexBuffer);
	gl.enableVertexAttribArray(aPositionIndex);
	gl.vertexAttribPointer(aPositionIndex, 3, gl.FLOAT, false, 0, 0);
	gl.uniform3f(uColorLocation, 1.0, 0.0, 0.0);
	gl.drawArrays(gl.LINES,0,2);
	gl.uniform3f(uColorLocation, 0.0, 1.0, 0.0);
	gl.drawArrays(gl.LINES,2,2);
	gl.uniform3f(uColorLocation, 0.0, 0.0, 1.0);
	gl.drawArrays(gl.LINES,4,2);
	
}
  NVMCClient.prototype.send= function (gl,primitive){
	// Draw the primitive
	gl.bindBuffer(gl.ARRAY_BUFFER, primitive.vertexBuffer);
	gl.enableVertexAttribArray(aPositionIndex);
	gl.vertexAttribPointer(aPositionIndex, 3, gl.FLOAT, false, 0, 0);
	
	gl.enable(gl.POLYGON_OFFSET_FILL);
	
	gl.polygonOffset(1.0, 1.0);
		
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, primitive.indexBufferTriangles);
        gl.drawElements(gl.TRIANGLES, primitive.triangleIndices.length, gl.UNSIGNED_SHORT, 0);
	
	gl.disable(gl.POLYGON_OFFSET_FILL);
	
	var currcol = gl.getUniform(shaderProgram,uColorLocation);
	gl.uniform3f(uColorLocation, 0.0, 0.0, 0.0);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, primitive.indexBufferEdges);	
	gl.drawElements(gl.LINES, primitive.numTriangles*3*2, gl.UNSIGNED_SHORT, 0);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	
	gl.disableVertexAttribArray(aPositionIndex);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	
	gl.uniform3f(uColorLocation, currcol[0],currcol[1],currcol[2]);
	

}


///// Initialize the shaders
/////
  NVMCClient.prototype.initShaders = function (gl) {

  var vertexShaderSource = "\
  	uniform   mat4 u_modelviewprojection;\n\
	attribute vec3 a_position;\n\
	void main(void)\n\
	{\n\
		gl_Position = u_modelviewprojection * vec4(a_position, 1.0);\n\
	}\n\
	";
  
  var fragmentShaderSource = "\
	precision highp float;\n\
	uniform vec3 u_color;\n\
	void main(void)\n\
	{\n\
		gl_FragColor = vec4(u_color, 1.0);\n\
	}\n\
	";
  
  // create the vertex shader
  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertexShaderSource);
  gl.compileShader(vertexShader);
  
  // create the fragment shader
  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragmentShaderSource);
  gl.compileShader(fragmentShader);
  
  // Create the shader program
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.bindAttribLocation(shaderProgram, aPositionIndex, "a_position");
  gl.linkProgram(shaderProgram);
  
  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Unable to initialize the shader program.");
	var str = "";
	str += "VS:\n" + gl.getShaderInfoLog(vertexShader) + "\n\n";
	str += "FS:\n" + gl.getShaderInfoLog(fragmentShader) + "\n\n";
	str += "PROG:\n" + gl.getProgramInfoLog(shaderProgram);
	alert(str);
  }

  uColorLocation = gl.getUniformLocation(shaderProgram, "u_color");
  uModelViewProjectionLocation = gl.getUniformLocation(shaderProgram, "u_modelviewprojection");
}

 NVMCClient.prototype.init = function (gl) {
	this.initShaders(gl);
	trackPrim = new this.trackPrimitive(this.game.race.track);
	 var buildings =  this.game.race.buildings;
	this.buildings = new Array(buildings.length );
	for(var i in buildings)
	 this.buildings[i] = new this.Building(buildings[i]);
}

