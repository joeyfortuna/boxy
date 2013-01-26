var arrPuff=["../chapter2/images/items/puff0.png",
										"../chapter2/images/items/puff1.png",
										"../chapter2/images/items/puff2.png",
										"../chapter2/images/items/puff3.png",
										"../chapter2/images/items/puff4.png",
										"../chapter2/images/items/puff5.png",
										"../chapter2/images/items/puff6.png",
										"../chapter2/images/items/puff7.png",
										"../chapter2/images/items/puff8.png",
										"../chapter2/images/items/puff9.png",
										"../chapter2/images/items/puff10.png",
										"../chapter2/images/items/puff11.png",
										"../chapter2/images/items/puff12.png",
										"../chapter2/images/items/puff13.png",
										"../chapter2/images/items/puff14.png",
										"../chapter2/images/items/puff15.png"
								];

var arrJumpingRobot=["../chapter2/images/characters/winner1.png",
								"../chapter2/images/characters/winner2.png",
								"../chapter2/images/characters/winner3.png",
								"../chapter2/images/characters/winner4.png",
								"../chapter2/images/characters/winner5.png",
								"../chapter2/images/characters/winner6.png",
								"../chapter2/images/characters/winner7.png",
								"../chapter2/images/characters/winner8.png",
								"../chapter2/images/characters/winner9.png",
								"../chapter2/images/characters/winner10.png",
								"../chapter2/images/characters/winner9.png",
								"../chapter2/images/characters/winner8.png",
								"../chapter2/images/characters/winner7.png",
								"../chapter2/images/characters/winner6.png",
								"../chapter2/images/characters/winner5.png",
								"../chapter2/images/characters/winner4.png",
								"../chapter2/images/characters/winner3.png",
								"../chapter2/images/characters/winner2.png"];


function getTargetTouches(e) {
	var tt=null;
	if (!e.targetTouches && boxy.getMouseDown()>-1) {
		tt={0:{identifier:'MOUSETOUCH'+boxy.getMouseDownId(), clientX:e.clientX, clientY:e.clientY}};
	}
	else {
		tt=e.targetTouches;
	}
	return tt;
}
function rads(deg) {
	return ((deg*Math.PI)/180);
}
function degs(rad) {
	return ((rad*180)/Math.PI);
}

function getFromApp(args) {


}

var sendToApp = function(_key, _val) {
    var iframe = document.createElement("IFRAME");
    iframe.setAttribute("src", _key + ":##sendToApp##" + _val);
    document.documentElement.appendChild(iframe);
    iframe.parentNode.removeChild(iframe);
    iframe = null;
};


function preloadImgs(arrayOfImages) {
    $(arrayOfImages).each(function () {
        $('<img />').attr('src',this).appendTo('body').css('display','none');
    });
    
}