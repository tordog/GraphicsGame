
NVMCClient.prototype.onDraw =  function () {
		var gl = this.ui.gl;

		gl.clearColor(0.4, 0.6, 0.8, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT);
		this.drawScene(gl);
	}
