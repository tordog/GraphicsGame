var model = null;
var renderer = null;
var shaderProgram  = null;
var uModelViewProjectionLocation = -1;
var uColorLocation = -1;
var uViewSpaceLightDirectionLocation = null;

var aPositionIndex = 0;
var aNormalIndex = 1;

var currentAngle = 0;
var incAngle = 0.5;
var tim = 0;
//var cube     = new Cube();
var gimbals   	= [new Ring(300,1.0,0.05), new Ring(300,0.94,0.05),new Ring(300,0.88,0.05)];
var inner		= [1-0.05/2,0.94-0.05/2,0.88-0.05/2];
var gColor      	=[ [0.308,0.5,0.74],[0.308,0.5,0.74],[0.308,0.5,0.74] ];

var joint = new Cylinder(100);
//var cone     = new Cone(10);


var stack    	= new SglMatrixStack();
var technique 	= null;


function initialize(gl) {
	
	for(var i = 0; i < 3 ; ++i)
		initBuffers(gl, gimbals[i]);
	initBuffers(gl, joint);
	initAxisBuffers();
	
	sglRequestBinary("../../media/models/aircraft.ply", {
		onSuccess : function (req) {
			var plyData = req.buffer;
			var modelDescriptor = importPly(plyData);
			model = new SglModel(gl, modelDescriptor);
			this.postDrawEvent();
		}
	});

	renderer = new SglModelRenderer(gl);	
	technique = new SglTechnique( gl,
		{	vertexShader		:vertexShaderSource, 
			fragmentShader	:fragmentShaderSource,
			vertexStreams 		: 
			{
				"a_position": [ 0.0,0.0,0.0,1.0],
				"a_normal" : [ 0.0, 0.0, 1.0, 0.0 ],
				"a_color" 	  : [ 0.0, 0.0, 0.8, 0.0 ],
			},
			globals : {
				"u_modelviewprojection" : { semantic : "WORLD_VIEW_PROJECTION_MATRIX", value : stack.matrix },
				"uViewSpaceLightDirection":{semantic: "LIGHT_DIRECTION",value:[-1,-1,1,0]},
				"u_lighting"   : { semantic : "LIGHTING_ENABLED",   value : [true,true,true,true ] }
			}
		});

}

function drawGimbal( i){
	gl.uniform1f(uconstantColorLocation,true);
	gl.uniform1f(uLightingLocation,true);
	gl.uniform3fv(uColorLocation, gColor[i]);
	gl.uniformMatrix4fv(uModelViewProjectionLocation, false,stack.matrix);
	send(gl,gimbals[i],"");
	
	var s = SglMat4.identity();
	
	if(i==2)
		SglMat4.scale$(s,[0.02,0.17,0.02]);
	else
		SglMat4.scale$(s,[0.02,0.03,0.02]);
	var rot = SglMat4.rotationAngleAxis(3.14*0.5,[0,0,1]);
	var rotOpposite = SglMat4.rotationAngleAxis(3.14,[0,0,1]);
	var tra = SglMat4.translation([inner[i],0,0]);
	
	var m = SglMat4.mul(tra,SglMat4.mul(rot,s));

	stack.push();
	stack.multiply(m);
	gl.uniformMatrix4fv(uModelViewProjectionLocation, false,stack.matrix);
	send(gl,joint,"");
	stack.pop();
	
	stack.push();
	m = SglMat4.mul(rotOpposite,m);
	stack.multiply(m);
	gl.uniformMatrix4fv(uModelViewProjectionLocation, false,stack.matrix);
	send(gl,joint,"");
	stack.pop();
	
	}

///// Draw the given primitives with solid wireframe
/////

function drawScene(gl) {
	
	tim = tim +1;

	if(incYaw) angle_yaw=angle_yaw+0.01;
	if(incPitch) angle_pitch=angle_pitch+0.01; 
	if(incRoll) angle_roll=angle_roll+0.01;
	
	// Make sure the canvas is sized correctly.
	var canvas = document.getElementById('canvas');
	var width = canvas.clientWidth;
	var height = canvas.clientHeight;

	gl.viewport(0, 0, width, height);

	// Clear the canvas
	gl.clearColor(1, 1, 1, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.enable(gl.DEPTH_TEST);
	gl.useProgram(shaderProgram);

	stack.loadIdentity();
	// Setup projection matrix
	var P = SglMat4.perspective(3.14/5,1,1,10);
	stack.multiply(P);
	// create inverse of V
	var invV = SglMat4.lookAt([0,0,5], [0,0,0], [0,1,0]);
	stack.multiply(invV);

	stack.multiply(tb.matrix);
	
	gl.uniformMatrix4fv(uModelViewProjectionLocation, false,stack.matrix);
	gl.uniform3f(uViewSpaceLightDirectionLocation,1,1,1);

	drawAxis();
	
	gl.uniform3fv(uColorLocation, gColor[0]);

	stack.push();
	stack.multiply(SglMat4.translation([0.0,1,0.0]));
	stack.multiply(SglMat4.scaling([0.025,1,0.025]));
	gl.uniformMatrix4fv(uModelViewProjectionLocation, false,stack.matrix);
	send(gl,joint,"");
	stack.pop();

	stack.push();
	stack.multiply(SglMat4.translation([0.0,-3.0,0.0]));
	stack.multiply(SglMat4.scaling([0.025,1,0.025]));
	gl.uniformMatrix4fv(uModelViewProjectionLocation, false,stack.matrix);
	send(gl,joint,"");
	stack.pop();


	//	var rot = SglMat4.rotationAngleAxis(0.01*tim,[0.0,1.0,1.0]);
		//var R = stack.matrix;
	//	var R = SpiderGL.Math.Mat4.mul(stack.matrix,rot) ;
		
	//	gl.uniformMatrix4fv(uModelViewProjectionLocation, false,R);
		
	 
	var rot0 = SglMat4.rotationAngleAxis(3.14/2,[1,0,0]);
	var rot1 = SglMat4.rotationAngleAxis(3.14/2,[0,1,0]);
	var rot2 = SglMat4.rotationAngleAxis(3.14/2,[0,0,1]);
	

	
 	stack.multiply(SglMat4.rotationAngleAxis(angle_yaw,[0,1,0]));

	stack.push();
	stack.multiply(rot0);
	gl.uniformMatrix4fv(uModelViewProjectionLocation, false,stack.matrix);
  	drawGimbal(0);
	stack.pop();

 	
 	stack.multiply(SglMat4.rotationAngleAxis(angle_pitch,[1,0,0]));

	stack.push();
 	stack.multiply(rot1);
 	gl.uniformMatrix4fv(uModelViewProjectionLocation, false,stack.matrix);
 	drawGimbal(1);
 	stack.pop();



 	stack.multiply(SglMat4.rotationAngleAxis(angle_roll,[0,0,1]));
	
 	stack.push();	
	stack.multiply(rot0);
	stack.multiply(rot2);
 	drawGimbal(2);
 	stack.pop();

	gl.useProgram(null);
	
	// render the aircraft
  	renderer.begin();
   	renderer.setTechnique(technique);
   
    	renderer.setGlobals({
   					"WORLD_VIEW_PROJECTION_MATRIX": stack.matrix,
					"LIGHTING_ENABLED":1.0,
					"LIGHT_DIRECTION":[-1,-1,-1]
   					});
   
   	renderer.setPrimitiveMode("FILL");
   	
  	renderer.setModel(model);
   
   	var parts = this.model.descriptor.logic.parts;
   	for (var partName in parts) {
   		var part = parts[partName];
   		renderer.setPart(partName);
   		for (var c in part.chunks) {
   			var chunkName = part.chunks[c];
   			renderer.setChunk(chunkName);
   			renderer.render();
   		}
   	}
   	renderer.end();
  

	gl.disable(gl.DEPTH_TEST);
}
