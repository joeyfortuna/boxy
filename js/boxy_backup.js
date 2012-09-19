

var BOXY=function(tid) {
      	var S_BOX=1;
      	var S_CIRCLE=2;
      	var S_POLY=3;
      	var S_MULTI=4;
      	var S_CLONE=5;
      	
      	var touches=[];
      
      	var mouseX;
      	var mouseY;
		var mousePVec;
		var isMouseDown;
		var mouseJoint;
		var selectedBody;
		
		var updateInterval;
		var bodies={};
		var contactCallback=null;
		var updateCallback=null;
		var bDrawDebug=false;
		var canvasid=tid;
		
		var scale=30;
      	
      	 //http://js-tut.aardon.de/js-tut/tutorial/position.html
        function getElementPosition(element) {
            var elem=element, tagname="", x=0, y=0;

            while((typeof(elem) == "object") && (typeof(elem.tagName) != "undefined")) {
               y += elem.offsetTop;
               x += elem.offsetLeft;
               tagname = elem.tagName.toUpperCase();

               if(tagname == "BODY")
                  elem=0;

               if(typeof(elem) == "object") {
                  if(typeof(elem.offsetParent) == "object")
                     elem = elem.offsetParent;
               }
            }

            return {x: x, y: y};
         };		
      	
      	
      	
      	var canvasPosition = getElementPosition(document.getElementById("canvas"));
      
      	
      
	var b2Vec2 = Box2D.Common.Math.b2Vec2
	, b2AABB = Box2D.Collision.b2AABB
	,	b2BodyDef = Box2D.Dynamics.b2BodyDef
	,	b2Body = Box2D.Dynamics.b2Body
	,	b2FixtureDef = Box2D.Dynamics.b2FixtureDef
	,	b2Fixture = Box2D.Dynamics.b2Fixture
	,	b2World = Box2D.Dynamics.b2World
	,	b2MassData = Box2D.Collision.Shapes.b2MassData
	,	b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape
	,	b2CircleShape = Box2D.Collision.Shapes.b2CircleShape
	,	b2DebugDraw = Box2D.Dynamics.b2DebugDraw
   ,	b2MouseJointDef =  Box2D.Dynamics.Joints.b2MouseJointDef
            ;
            
       var b2Body=b2Body;

       var world = new b2World(
               new b2Vec2(0, 20)    //gravity
            ,  true                 //allow sleep
       );
       
       var contactListener = new Box2D.Dynamics.b2ContactListener;      
       
       	   
       contactListener.BeginContact=function(contact, manifold) {
			var fixA=contact.GetFixtureA();
			var fixB=contact.GetFixtureB();
            var bA=fixA.GetBody();
            var bB=fixB.GetBody();
            if (contactCallback) {
            	contactCallback(
            		{id:bA.GetUserData(),x:bA.GetPosition().x,x:bA.GetPosition().y},
            		{id:bB.GetUserData(),x:bB.GetPosition().x,x:bB.GetPosition().y}
            	);
            }
            
       };
       
       function setUpdateCallback(uc) {
       		updateCallback=uc;
       }
       	
       function setContactCallback(cc) {
       		contactCallback=cc;
       }
      
       
       world.SetContactListener(contactListener);
       
       
       function echo(str,bCls) {
       		
       		bCls=param(bCls,false);
       		var dv=document.getElementById("boxyDebug");
       		
       		if (bCls) dv.innerHTML='';
            dv.innerHTML=dv.innerHTML+str+"<br>";
       };
       
       
       
      function fixtureFactory(dim,shape) {
      	var fixDef = new b2FixtureDef;
        fixDef.density = 1.0;
        fixDef.friction = .4;
        fixDef.restitution = 0.5;     
        fixDef.shape = new b2PolygonShape;
		switch(shape) {
		case S_BOX:
			fixDef.shape.SetAsBox(dim.l,dim.h);
		break;
		case S_CIRCLE:
			fixDef.shape = new b2CircleShape(dim.r);
		break;
		case S_POLY:
			var polyvecs=[];
			for(var i=0;i<dim.length;i++) {
				var v=dim[i];
					var c=new b2Vec2(v.x,v.y);
					polyvecs[polyvecs.length]=c;
				}   		
				fixDef.shape.SetAsArray(polyvecs,polyvecs.length);
			break;
        }             
        
        return fixDef;
      };
      function param(p,d) {
      	if (typeof p=='undefined') return d;
      	else return p;
      }
      
      function getJointAttr(jid,val) {
      	var j=jointById(jid);
      	if (attr='anchors') {
      		var aa=j.GetAnchorA();      		
      		aa.x*=scale; aa.y*=scale;
      		var ab=j.GetAnchorB();
      		ab.x*=scale;ab.y*=scale;
      		var aga=j.GetGroundAnchorA();
      		aga.x*=scale;aga.y*=scale;
      		var agb=j.GetGroundAnchorB();
      		agb.x*=scale;agb.y*=scale;
      		
      		return {aa:aa,ab:ab,aga:aga,agb:agb}
      	}
      	return null;
      }
      
      function makePulleyJoint(args) {
      	var bA=bodyById(args.aid);
      	var bB=bodyById(args.bid);
      	var aA=param(args.anchorA,bA.GetLocalCenter());
      	var aB=param(args.anchorB,bB.GetLocalCenter());
      	var wcA=bA.GetWorldCenter();
      	var gA=param(args.groundAnchorA,{x:wcA.x,y:0});
      	var wcB=bB.GetWorldCenter();
      	var gB=param(args.groundAnchorB,{x:wcB.x,y:0});
      	var lA=param(args.lengthA,3);
      	var lB=param(args.lengthB,3);
      	var mlA=param(args.maxLengthA,6);
      	var mlB=param(args.maxLengthB,6);
      	var bM=param(args.enableMotor,false);
      	var mS=param(args.motorSpeed,0);
      	var mT=param(args.maxTorque,0);
      	var ud=param(args.jointid,'jntPul_'+args.aid+'_'+args.bid);
      	return pulleyJoint(ud,bA,bB,aA,aB,gA,gB,lA,lB,mlA,mlB,bM,mS,mT) 
      }
      
      function pulleyJoint(ud,bA,bB,aA,aB,gA,gB,lA,lB,mlA,mlB,bM,mS,mT) {
      
      	var pj =  new Box2D.Dynamics.Joints.b2PulleyJointDef();
        pj.bodyA=bA;
        pj.bodyB=bB;
        pj.localAnchorA=aA;
        pj.localAnchorB=aB;   
        pj.groundAnchorA=gA;
        pj.groundAnchorB=gB;
        pj.maxLengthA=mlA;
        pj.maxLengthB=mlA;
       	pj.lengthA=lA;
       	pj.lengthB=lB;      
       	pj.enableMotor = bM;
      	var joint= world.CreateJoint(pj);      
      	joint.SetUserData(ud);
      	return joint;
      }
      
      
      function makeRevoluteJoint(args) {
      		var bA=bodyById(args.aid);
      		var bB=bodyById(args.bid);
      		var lU=param(args.upperAngle,0);
      		var lL=param(args.lowerAngle,0);
      		var bL=param(args.enableLimit,false);
      		var sM=param(args.motorSpeed,0);
      		var bM=param(args.enableMotor,false);
      		var mT=param(args.maxTorque,15);
      		var db,da=null;
      		var fl=bA.GetFixtureList();
      		for (var f = fl;f; f = f.GetNext()) {	
      			da=f.GetAABB().GetExtents();
      		}
      		if (da==null) da=bA.GetLocalCenter();
      		else da.y=bA.GetLocalCenter().y;
      		
      		fl=bB.GetFixtureList();
      		for (var f = fl;f; f = f.GetNext()) {	
      			db=f.GetAABB().GetExtents();
      			db.x=-db.x;
      		}
      		if (db==null) db=bB.GetLocalCenter();
      		else db.y=bB.GetLocalCenter().y;
      		
      		var ca=param(args.centerA,false);
      		if (ca) 
      			args.anchorA={x:0,y:0};
      			
      		var cb=param(args.centerB,false);
      		if (cb) 
      			args.anchorB={x:0,y:0};
      				
      			
      		var pA=param(args.anchorA,da);
      		var pB=param(args.anchorB,db);         		
      		
      		var ud=param(args.jointid,'jntRev_'+args.aid+'_'+args.bid);
      		
      		return  revJoint(ud,bA,bB,pA,pB,mT,bM,sM,lU,lL,bL);
      }
      
      function revJoint(ud,bA,bB,pA,pB,mT,bM,sM,lU,lL,bL) {   
      		
      		lU=param(lU,0);
      		lL=param(lL,0);
      		bL=param(bL,false);
      		sM=param(sM,0);
      		bM=param(bM,false);
      		mT=param(mT,15);
      		
      		
      		var rj =  new Box2D.Dynamics.Joints.b2RevoluteJointDef();
      		rj.bodyA=bA;
      		rj.bodyB=bB;
      		rj.localAnchorA=new b2Vec2(pA.x,pA.y);
      		rj.localAnchorB=new b2Vec2(pB.x,pB.y);
      		
      		rj.collideConnected=false;
      		rj.referenceAngle = 0.0;
      		rj.maxMotorTorque = mT;
      		rj.motorSpeed = sM;
      		rj.enableMotor = bM;
      		rj.enableLimit=bL;
      		rj.upperAngle=lU;
      		rj.lowerAngle=lL;     
      			
      		var joint=world.CreateJoint(rj);     
      		joint.SetUserData(ud);
      		return joint;
      }
      
      function dump(obj) {
      	for (var k in obj) {
      		echo(k+': '+obj[k]);
      	}
      };
      
      function makeStaticBox(objid,w,h,x,y) {
      	var body=bodyFactory({l:w,h:h},
      							{x:x,y:y},
      							S_BOX,
      							b2Body.b2_staticBody,
      							objid);		
      	return body;	
      }
      function makeDynamicBox(objid,w,h,x,y) {
      	var body=bodyFactory({l:w,h:h},
      							{x:x,y:y},
      							S_BOX,
      							b2Body.b2_dynamicBody,
      							objid);		
      	return body;	
      }
      
      function makeStaticCircle(objid,r,x,y) {
      	var body=bodyFactory({r:r},
      							{x:x,y:y},
      							S_CIRCLE,
      							b2Body.b2_staticBody,
      							objid);
      	return body;
      
      }
      function makeDynamicCircle(objid,r,x,y) {
      	var body=bodyFactory({r:r},
      							{x:x,y:y},
      							S_CIRCLE,
      							b2Body.b2_dynamicBody,
      							objid);
      	return body;      
      }
      
      function bodyFactory(dim,pos,shape,type,id) {      	
        var bodyDef = new b2BodyDef;
       	bodyDef.type = type;
       	bodyDef.position.Set(pos.x, pos.y); 
       	var body=world.CreateBody(bodyDef);
       	if (shape==S_MULTI) {
       		for (var i=0;i<dim.length;i++) {
       			var elem=dim[i];
       			var tdim=elem.dim;
       			var tshape=elem.shape;
       			var fixDef=fixtureFactory(tdim,tshape);       	
       			body.CreateFixture(fixDef);          		
       		}
       	}
       	else {       		
       		var fixDef=fixtureFactory(dim,shape);       	
       		body.CreateFixture(fixDef);       		   	
       	}
       	body.SetUserData(id);
       	var bobj=new BodyObj(id);
       	
       	bodies[id]=bobj;
       	return body;
      };
      
      function BodyObj(bodyid) {
      	this.id=bodyid;
      	this.imgObj=null;
      	this.toucheable=true;
      	this.angle=0;
      	this.body=null;
      }
      
      
      function ImgObj(img,w,h) {
      	this.img=img;
      	this.w=w;
      	this.h=h;
      	return this;
      
      }
      
      function getBodyAttr(id,key) {
      		var bobj=bodies[id];
      		if (key=='pos') {
      			var b=bodyById(id);
      			if (b==null) return null;
      			return {x:b.GetPosition().x*scale,y:b.GetPosition().y*scale};
      		}
      		if (bobj==null) return null;
      		return bobj[key];
      }
      
      function setBodyAttr(id,key,val) {
      		var bobj=bodies[id];
      		if (bobj==null) return;
      		bobj[key]=val;
      		bodies[id]=bobj;
      }
      
      function setBodyImage(id,src,w,h) {
      		var bobj=bodies[id];
      		if (bobj==null) return;
      		
			var imgObj = new Image(w,h);
			imgObj.src = src;
			bobj.imgObj=new ImgObj(imgObj,w,h);
			bodies[id]=bobj;
			
      }
      
      
      function vecSort(arr) {
      	var l=arr.length;
      	for (var i=0;i<(arr.length/2);i++) {
      		var a=arr[i];
      		var b=arr[(l-1)-i];
      		arr[i]=b;
      		arr[(l-1)-i]=a;
      	}
      	return arr;
      }
      
      function clone(oldid,newid,tx,ty) {
      	return cloneBody(oldid,newid,{x:tx,y:ty});
      }
      
      function cloneBody(oldid,newid,pos,flipX,flipY) {
      	var bodyDef = new b2BodyDef;
      	flipX=param(flipX,false);
      	flipY=param(flipY,false);
      	var b1=bodyById(oldid);
      	var b1def=b1.GetDefinition();
      	//echo('cloning');
      	bodyDef.type=b1def.type;
      	bodyDef.position.Set(pos.x, pos.y); 
      	var fl1=b1.GetFixtureList();
      	var body=world.CreateBody(bodyDef);     
      	for (var f = fl1;f; f = f.GetNext()) {	
      		var fixDef = new b2FixtureDef;
      		fixDef.friction = .4;
        	fixDef.restitution = 0.5; 
        	fixDef.density=1.0;  
        	var s=f.GetShape();
        	if (s instanceof b2PolygonShape) {
        		//echo('verts:'+oldid)
        		var v=s.GetVertices();            			
        		var newv=[];
        		//echo(v.length)
        		for (var i in v) {
        			var vx=v[i];
        			var v2=new b2Vec2(
					(flipX)?(-vx.x):vx.x,
					(flipY)?(-vx.y):vx.y
					);
        			//echo(v2.x+','+v2.y);
        			newv[newv.length]=v2;        	        					
        		}
        		
        		if (flipX || flipY) newv=vecSort(newv);
           		fixDef.shape = new b2PolygonShape;
        		fixDef.shape.SetAsArray(newv,newv.length);     
        		//echo('set')   		
        	}
        	else fixDef.shape=f.GetShape();
        	
        	body.CreateFixture(fixDef);      
      	}
      	body.SetUserData(newid);       	
      	body.SetFixedRotation(false);
      	var bobj=new BodyObj(newid);
      	
       	bodies[newid]=bobj;
       	return body;
       	
      };
     
      function jointById(jointid) {
       	var jl=world.GetJointList();
      	for (var j=jl;j;j=j.GetNext()) {    
      		var jid=j.GetUserData();
      		if (jid==jointid) return j;
     	}
      	return null;      
      };
      
      function bodyById(bodyid) {
      
      	var bl=world.GetBodyList();
      	
        for (var b=bl;b;b=b.GetNext()) {        		
        	var ud=b.GetUserData();
        	if (ud!=null && ud==bodyid) return b;
        }
        //echo('couldnt find')
        return null;     
      };
      
      function removeBody(bodyid) {
      	var body=bodyById(bodyid);
      	if (body==null) return;
      	world.DestroyBody(body);
      
      
      }
      
      	function getBodyAtMouse() {
            mousePVec = new b2Vec2(mouseX, mouseY);
            var aabb = new b2AABB();
            aabb.lowerBound.Set(mouseX - 0.001, mouseY - 0.001);
            aabb.upperBound.Set(mouseX + 0.001, mouseY + 0.001);
            selectedBody = null;
            world.QueryAABB(getBodyCB, aabb);
           
           if (selectedBody) {
           		var bobj=bodies[selectedBody.GetUserData()];
            	if (bobj!=null) {
            		if (!bobj.toucheable) return null;
           		 }
           	}
            return selectedBody;
         };

         function getBodyCB(fixture) {
            if(fixture.GetBody().GetType() != b2Body.b2_staticBody) {
               if(fixture.GetShape().TestPoint(fixture.GetBody().GetTransform(), mousePVec)) {
                  selectedBody = fixture.GetBody();
                  return false;
               }
            }
            return true;
         };
      
      
      function update() {
      	
            if(isMouseDown && (!mouseJoint)) {            	
               var body = getBodyAtMouse();
               if(body) {
                  var md = new b2MouseJointDef();
                  md.bodyA = world.GetGroundBody();
                  md.bodyB = body;
                  md.target.Set(mouseX, mouseY);
                  md.collideConnected = true;
                  md.maxForce = 300.0 * body.GetMass();
                  mouseJoint = world.CreateJoint(md);
                  body.SetAwake(true);
               }
            }

            if(mouseJoint) {
               if(isMouseDown) {               	
                  mouseJoint.SetTarget(new b2Vec2(mouseX, mouseY));
               } else {
                  world.DestroyJoint(mouseJoint);
                  mouseJoint = null;
               }
            }
         	
            
            echo(touches.length,true);
            var canvaselem = document.getElementById("canvas");
			var context = canvaselem.getContext("2d");
			var canvaswidth = canvaselem.width-0;
			var canvasheight = canvaselem.height-0;           
			var bl=world.GetBodyList();
      	 	world.Step(1 / 60, 10, 10);
            if (bDrawDebug) world.DrawDebugData();
            else context.clearRect(0,0,canvaswidth,canvasheight);
            world.ClearForces();
       		for (var b=bl;b;b=b.GetNext()) {        		
        		var ud=b.GetUserData();
        		if (bodies[ud]==null) continue;
        		bodies[ud]['angle']=b.GetAngle();
        		var img=bodies[ud].imgObj;
        		if (img==null) continue;
        		
        		var position=b.GetPosition();
        		
           		context.save();					
           		context.translate(position.x*scale,position.y*scale); 
				context.rotate(b.GetAngle());						
				context.drawImage(img.img,-(img.w/2),-(img.h/2),img.w,img.h);
				context.restore();				
					
            }
            
            
            if (updateCallback!=null) updateCallback(context);
            
            
      };
     
        function setDebug() {
		debugDraw = new b2DebugDraw();
		debugDraw.SetSprite(document.getElementById("canvas").getContext("2d"));
		debugDraw.SetDrawScale(scale);
		debugDraw.SetFillAlpha(0.5);
		debugDraw.SetLineThickness(1.0);
		debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);		
		world.SetDebugDraw(debugDraw);
		bDrawDebug=true;
	};
       function setUpdate() {
       		updateInterval=window.setInterval(update, 1000 / 60);
       };
        function killUpdate() {
        	window.clearInterval(updateInterval);
        }
        function toggleGravity() {
		 	var g=world.GetGravity();
		 	if (g.y>0) g.y=0;
		 	else g.y=20;
		 	world.SetGravity(g);
		 };
		 
		 
       
         
         function nudge(objid,x,y) {
      		var b=bodyById(objid);      		
      	 	b.ApplyImpulse(new b2Vec2(x,y),b.GetWorldCenter());
       	 }; 
         
         
	 	function setMouseDown(bVal) {
	 		isMouseDown=bVal;
	 	}
	 
         function handleMouseMove(e) {         	
            e.preventDefault();
            if (e.targetTouches) {
				touches=e.targetTouches;				
				var t=touches[0];
				mouseX=(t.clientX-canvasPosition.x)/scale;
				mouseY=(t.clientY-canvasPosition.y)/scale;		
	   		}
	    	else {
				mouseX = (e.clientX - canvasPosition.x) / scale;
				mouseY = (e.clientY - canvasPosition.y) / scale;
	   		}
         };
         
         document.addEventListener("touchend", function(e) {
         	
         	touches=e.targetTouches;
            document.removeEventListener("touchmove", handleMouseMove, true);
            isMouseDown = false;
            mouseX = undefined;
            mouseY = undefined;
         	
         }, true);
         
         document.addEventListener("mousedown", function(e) {
            isMouseDown = true;
            handleMouseMove(e);
            document.addEventListener("mousemove", handleMouseMove, true);
         }, true);

         document.addEventListener("mouseup", function() {
            document.removeEventListener("touchmove", handleMouseMove, true);
            isMouseDown = false;
            mouseX = undefined;
            mouseY = undefined;
         }, true);        
      		
      	function interact(e) {
      		setMouseDown(true);    						        	
            handleMouseMove(e);            
           	document.addEventListener("touchmove", handleMouseMove, true);
      	}
      	
      	
      	
      	document.addEventListener("touchstart", function(e) {
      		
      		touches=e.targetTouches;
      		interact(e);
      	});
      	document.addEventListener("mousedown", function(e) {
      		interact(e);
      	});
      	
      	      	
      	function makeWorldBox() {
      		
      		var canvas=document.getElementById(canvasid);
      		var w=parseInt(canvas.getAttribute("width"));
      		var h=parseInt(canvas.getAttribute("height"));
      		
      		var bground=makeStaticBox('ground',w/scale,0.2,0,h/scale);
      		var bceil=cloneBody('ground','ceiling',{x:0,y:0});
      		var rwall=makeStaticBox('rwall',0.2,h/scale,w/scale,0.2);
      		var lwall=cloneBody('rwall','lwall',{x:0,y:.2});
      	
      	}
      	
      	
      	if (typeof canvasid!='undefined') makeWorldBox();
      	return {
			setUpdate: setUpdate,
			setDebug: setDebug,
			bodyFactory: bodyFactory,
			cloneBody: cloneBody,
			clone : clone,
			removeBody : removeBody,
			makeRevoluteJoint: makeRevoluteJoint,
			makePulleyJoint : makePulleyJoint,
			toggleGravity: toggleGravity,
			setContactCallback:setContactCallback,			
			b2Body: b2Body,
			echo:echo,
			S_BOX : S_BOX,
			S_CIRCLE : S_CIRCLE,
			S_POLY : S_POLY,
			S_MULTI : S_MULTI,
			S_CLONE : S_CLONE,
			isMouseDown: isMouseDown,
			handleMouseMove: handleMouseMove,
			setMouseDown: setMouseDown,
			setBodyImage: setBodyImage,
			killUpdate: killUpdate,
			makeStaticBox:makeStaticBox,
			setUpdateCallback:setUpdateCallback,
			makeDynamicBox:makeDynamicBox,
			makeStaticBall:makeStaticCircle ,
			makeDynamicBall:makeDynamicCircle ,
			setBodyAttr : setBodyAttr,
			getBodyAttr: getBodyAttr,
			getJointAttr : getJointAttr,
			nudge:nudge
		}
};
   