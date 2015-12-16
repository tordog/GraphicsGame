// Global NVMC Client
// ID 2.0
/***********************************************************************/
var NVMCClient = NVMCClient || {};
/***********************************************************************/

NVMCClient.ground = {};
// NVMC Client Internals
/***********************************************************************/
NVMCClient.drawObject = function (gl, obj, fillColor, lineColor) {
  gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
  gl.enableVertexAttribArray(this.uniformShader.aPositionIndex);
  gl.vertexAttribPointer(this.uniformShader.aPositionIndex, 3, gl.FLOAT, false, 0, 0);

  gl.enable(gl.POLYGON_OFFSET_FILL);

  gl.polygonOffset(1.0, 1.0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferTriangles);
  gl.uniform4fv(this.uniformShader.uColorLocation, fillColor);
  gl.drawElements(gl.TRIANGLES, obj.triangleIndices.length, gl.UNSIGNED_SHORT, 0);

  gl.disable(gl.POLYGON_OFFSET_FILL);
// line 24, Listing 2.13
  gl.uniform4fv(this.uniformShader.uColorLocation, lineColor);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferEdges);
  gl.drawElements(gl.LINES, obj.numTriangles * 3 * 2, gl.UNSIGNED_SHORT, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  gl.disableVertexAttribArray(this.uniformShader.aPositionIndex);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
};//line 33

NVMCClient.createObjectBuffers = function (gl, obj) {//lin 35, Listing 2.11
  obj.vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, obj.vertices, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  obj.indexBufferTriangles = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferTriangles);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, obj.triangleIndices, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  // create edges
  var edges = new Uint16Array(obj.numTriangles * 3 * 2);
  for (var i = 0; i < obj.numTriangles; ++i) {
    edges[i * 6 + 0] = obj.triangleIndices[i * 3 + 0];
    edges[i * 6 + 1] = obj.triangleIndices[i * 3 + 1];
    edges[i * 6 + 2] = obj.triangleIndices[i * 3 + 0];
    edges[i * 6 + 3] = obj.triangleIndices[i * 3 + 2];
    edges[i * 6 + 4] = obj.triangleIndices[i * 3 + 1];
    edges[i * 6 + 5] = obj.triangleIndices[i * 3 + 2];
  }

  obj.indexBufferEdges = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferEdges);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, edges, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
};//line 61

NVMCClient.initializeObjects = function (gl) {
  this.triangle = new Triangle();
  this.createObjectBuffers(gl, this.triangle);
};

NVMCClient.drawCar = function (gl) {
  this.drawObject(gl, this.triangle, [1, 1, 1, 1], [1, 1, 1, 1]);
};

NVMCClient.drawScene = function (gl) {
  var width = this.ui.width;
  var height = this.ui.height
  var ratio = width / height;
  var stack = this.stack;

  gl.viewport(0, 0, width, height);

  // Clear the framebuffer
  gl.clearColor(0.34, 0.5, 0.74, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.useProgram(this.uniformShader);

  gl.uniformMatrix4fv(this.uniformShader.uProjectionMatrixLocation, false, SglMat4.perspective(3.14 / 4, ratio, 1, 100));

  // var invV = SglMat4.lookAt([-30,20,30], [0,0,0], [0,1,0]);

  if (!this.first) {
    this.first = true;
    this.initpos = this.game.state.players.me.dynamicState.position;
  }
  var pos = this.game.state.players.me.dynamicState.position;//line 94, Listing 2.15
  var invV = SglMat4.lookAt([this.initpos[0], 10, this.initpos[2]], this.initpos, [0, 0, -1]);

  stack.loadIdentity();
  stack.multiply(invV);

  var T = SglMat4.translation(pos);
  stack.multiply(T);

  var D = SglMat4.rotationAngleAxis(this.game.state.players.me.dynamicState.orientation, [0, 1, 0]);
  stack.multiply(D);

  gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);

  this.drawCar(gl);

  gl.useProgram(null);
  gl.disable(gl.DEPTH_TEST);
};
/***********************************************************************/



// NVMC Client Events
/***********************************************************************/
NVMCClient.onInitialize = function () {// line 119, Listing 2.9
  NVMC.log("SpiderGL Version : " + SGL_VERSION_STRING + "\n");

  var game = this.game;

  var handleKey = {};
  handleKey["W"] = function (on) {
    game.playerAccelerate = on;
  };
  handleKey["S"] = function (on) {
    game.playerBrake = on;
  };
  handleKey["A"] = function (on) {
    game.playerSteerLeft = on;
  };
  handleKey["D"] = function (on) {
    game.playerSteerRight = on;
  };
  this.handleKey = handleKey;

  this.stack = new SglMatrixStack();
  this.initializeObjects(this.ui.gl);
  this.uniformShader = new uniformShader(this.ui.gl);
};//line 142

NVMCClient.onTerminate = function () {};

NVMCClient.onConnectionOpen = function () {
  NVMC.log("[Connection Open]");
};

NVMCClient.onConnectionClosed = function () {
  NVMC.log("[Connection Closed]");
};

NVMCClient.onConnectionError = function (errData) {
  NVMC.log("[Connection Error] : " + errData);
};

NVMCClient.onLogIn = function () {
  NVMC.log("[Logged In]");
};

NVMCClient.onLogOut = function () {
  NVMC.log("[Logged Out]");
};

NVMCClient.onNewRace = function (race) {
  NVMC.log("[New Race]");
};

NVMCClient.onPlayerJoin = function (playerID) {
  NVMC.log("[Player Join] : " + playerID);
  this.game.opponents[playerID].color = [0.0, 1.0, 0.0, 1.0];
};

NVMCClient.onPlayerLeave = function (playerID) {
  NVMC.log("[Player Leave] : " + playerID);
};

NVMCClient.onKeyDown = function (keyCode, event) {
  this.handleKey[keyCode] && this.handleKey[keyCode](true);
};

NVMCClient.onKeyUp = function (keyCode, event) {
  this.handleKey[keyCode] && this.handleKey[keyCode](false);
};

NVMCClient.onKeyPress = function (keyCode, event) {};

NVMCClient.onMouseButtonDown = function (button, x, y, event) {};

NVMCClient.onMouseButtonUp = function (button, x, y, event) {};

NVMCClient.onMouseMove = function (x, y, event) {};

NVMCClient.onMouseWheel = function (delta, x, y, event) {};

NVMCClient.onClick = function (button, x, y, event) {};

NVMCClient.onDoubleClick = function (button, x, y, event) {};

NVMCClient.onDragStart = function (button, x, y) {};

NVMCClient.onDragEnd = function (button, x, y) {};

NVMCClient.onDrag = function (button, x, y) {};

NVMCClient.onResize = function (width, height, event) {};

NVMCClient.onAnimate = function (dt) {
  this.ui.postDrawEvent();
};

NVMCClient.onDraw = function () {
  var gl = this.ui.gl;
  this.drawScene(gl);
};
