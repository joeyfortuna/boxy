// from: http://stackoverflow.com/questions/4576724/dotted-stroke-in-canvas
var CP = window.CanvasRenderingContext2D && CanvasRenderingContext2D.prototype;
if (CP && CP.lineTo) {
	CP.dashedLine = function(x,y,x2,y2,dashArray) {
	if (!dashArray) dashArray=[10,5];
	if (dashLength==0) dashLength = 0.001; // Hack for Safari
	var dashCount = dashArray.length;
	this.moveTo(x, y);
	
	var dx = (x2-x), dy = (y2-y);
	var slope = dy/dx;
	var distRemaining = Math.sqrt( dx*dx + dy*dy );
	var dashIndex=0, draw=true;
	while (distRemaining>=0.1) {
		var dashLength = dashArray[dashIndex++%dashCount];
		if (dashLength > distRemaining) dashLength = distRemaining;
		var xStep = Math.sqrt( dashLength*dashLength / (1 + slope*slope) );
		if (dx<0) xStep = -xStep;
		x += xStep;
		y += slope*xStep;
		this[draw ? 'lineTo' : 'moveTo'](x,y);
		distRemaining -= dashLength;
		draw = !draw;
		}
	}
	
	CP.straightLine = function(x,y,x2,y2) {
		this.moveTo(x, y);
		this.lineTo(x2,y2);
	}
	
}
