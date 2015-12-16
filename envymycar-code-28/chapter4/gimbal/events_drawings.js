
var incYaw = false;
var incPitch = false;
var incRoll = false;

var angle_yaw = 0;
var angle_pitch = 0;
var angle_roll = 0;

onKeyDown = function (keyCode, event) {
	switch(keyCode.keyCode){
		case  65: incYaw = true; break;
		case 83: incPitch = true ; break;
		case 68: incRoll   = true ; break;
	 }
	 };
	 
onKeyUp = function (keyCode, event) {
	switch(keyCode.keyCode){
		case  65: incYaw = false; ; break;
		case 83: incPitch = false ; break;
		case 68: incRoll   = false; ; break;
	 }
 };
 


