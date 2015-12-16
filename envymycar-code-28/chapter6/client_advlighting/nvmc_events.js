
NVMCClient.prototype = {	
	currentCamera : 0,
	deltaCamera_1: [0,0,0],
	camera_1_position :  [0,0,0],
	camera_1_orientation :	 [ 1 , 0, 0 ,0,         0, 1, 0, 0,              0, 0, 1, 0,             0, 0, 0, 1],
	alpha : 0,
	beta : 0,
	orienting_view_1:false,
	start_x :0,
	start_y :0,
	
	onTerminate : function () {
	},

	onConnectionOpen : function () {
		nvmcLog("[Connection Open]");
	},

	onConnectionClosed : function () {
		nvmcLog("[Connection Closed]");
	},

	onConnectionError : function (errData) {
		nvmcLog("[Connection Error] : " + errData);
	},

	onLogIn : function () {
		nvmcLog("[Logged In]");
	},

	onLogOut : function () {
		nvmcLog("[Logged Out]");
	},

	onNewRace : function (race) {
		nvmcLog("[New Race]");
	},

	onPlayerJoin : function (playerID) {
		nvmcLog("[Player Join] : " + playerID);
		this.game.opponents[playerID].color = [ 0.0, 1.0, 0.0, 1.0 ];
	},

	onPlayerLeave : function (playerID) {
		nvmcLog("[Player Leave] : " + playerID);
	},

	onKeyDown : function (keyCode, event) {
 		if(keyCode == "0")
 			this.currentCamera = 0;
		if(keyCode == "1")
 			this.currentCamera = 1;

		if(this.currentCamera == 0 )
			this.handleKey[keyCode] && this.handleKey[keyCode](true);
		else{
			switch (keyCode){
					case "W": this.deltaCamera_1= [0,0,-1];  break; 
					case "A":  this.deltaCamera_1= [-1,0,0];  break; 
					case "D":  this.deltaCamera_1= [1,0,0];  break; 
					case "S":  this.deltaCamera_1= [0,0,1];  break; 
					case "Q":  this.deltaCamera_1= [0,1,0];  break; 
					case "E":  this.deltaCamera_1= [0,-1,0];  break; 
				}
			}
	},

	onKeyUp : function (keyCode, event) {
		this.handleKey[keyCode] && this.handleKey[keyCode](false);
		this.deltaCamera_1 = [0,0,0]; 
	},

	onKeyPress : function (keyCode, event) {
	},

	onMouseButtonDown : function (button, x, y, event) {
		if(this.currentCamera == 1){
			this.orienting_view_1 = true;
			this.start_x = x;
			this.start_y = y;
		}
	},

	onMouseButtonUp : function (button, x, y, event) {
			this.orienting_view_1 = false;
	},

	onMouseMove : function (x, y, event) {
		if(this.orienting_view_1){
			this.alpha = x-this.start_x;
			this.beta =  -(y-this.start_y);
			this.start_x = x;
			this.start_y = y;
			this.updateOrientationCamera_1();
		}
	},

	onMouseWheel : function (delta, x, y, event) {
	},

	onClick : function (button, x, y, event) {
	},

	onDoubleClick : function (button, x, y, event) {
	},

	onDragStart : function (button, x, y) {
	},

	onDragEnd : function (button, x, y) {
	},

	onDrag : function (button, x, y) {
	},

	onResize : function (width, height, event) {
	}, 

	onAnimate : function (dt) {
		this.ui.postDrawEvent();
	}
};
