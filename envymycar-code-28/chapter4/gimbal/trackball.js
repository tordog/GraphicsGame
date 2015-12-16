function Trackball(width, height) {
	this.width  = width;
	this.height = height;
	this.currX  = 0;
	this.currY  = 0;
	this.moving = false;
	this.matrix = SglMat4.identity();
	this.toMul  = SglMat4.identity();
}

Trackball.prototype = {
	onMouseDown : function (event) {
		tb.currX = event.clientX;
		tb.currY =  this.height - event.clientY;
		tb.moving = true;
	},

	onMouseUp : function (event) {
		tb.moving = false;
	},

	onMouseMove : function (event) {
		if (!this.moving) return;

		var newX = event.clientX;
		var newY = this.height - event.clientY;
		var dx   = newX - this.currX;

		var rad   = this.width;
		var v1    = SglVec3.normalize([this.currX, this.currY, rad]);
		var v2    = SglVec3.normalize([newX, newY, rad]);
		var axis  = SglVec3.cross(v1,v2);
		var angle = SglVec3.length(axis)*20;

		if (angle > 0.00001) {
			this.matrix = SglMat4.mul(SglMat4.rotationAngleAxis(angle, axis), this.matrix);
		}

		this.currX = newX;
		this.currY = newY;
	}
};
