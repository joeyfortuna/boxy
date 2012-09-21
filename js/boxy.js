

var BOXY=function(tid) {
		
      	var S_BOX=1;
      	var S_CIRCLE=2;
      	var S_POLY=3;
      	var S_MULTI=4;
      	var S_CLONE=5;
      	var S_OBOX=6;
      	
      	var touches={count:0};      	
      	var mouseJoints={count:0};
      
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
            		{id:bA.GetUserData(),x:bA.GetPosition().x,y:bA.GetPosition().y},
            		{id:bB.GetUserData(),x:bB.GetPosition().x,y:bB.GetPosition().y}
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
		case S_OBOX:
			fixDef.shape.SetAsOrientedBox(dim.l,dim.h,dim.center,dim.angle);
			break;
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
      
      function makeDynamicBox(objid,l,h,x,y) {
      	var body=bodyFactory({l:l,h:h},
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
      function makeDynamicCompound(objid,dim,x,y) {      	
      		var body=bodyFactory(dim,
      							{x:x,y:y},
      							S_MULTI,
      							b2Body.b2_dynamicBody,
      							objid);
      		return body;
      }
      function circle(dim) {
      	return {dim:dim,shape:S_CIRCLE};
      }
      function box(dim) {
      	return {dim:dim,shape:S_OBOX};
      }
      function poly(dim) {
      	return {dim:dim,shape:S_POLY};
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
      
      
      function ImgObj(img,w,h,x,y) {
      	this.img=img;
      	this.w=w;
      	this.h=h;
      	this.x=x;
      	this.y=y;
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
      
      function setBodyImage(id,src,w,h,x,y) {
      		x=param(x,0);
      		y=param(y,0);
      		
      		var bobj=bodies[id];
      		if (bobj==null) return;
      		
			var imgObj = new Image(w,h);
			imgObj.src = src;
			bobj.imgObj=new ImgObj(imgObj,w,h,x,y);
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
        		
        		var v=s.GetVertices();            			
        		var newv=[];
        		
        		for (var i in v) {
        			var vx=v[i];
        			var v2=new b2Vec2(
					(flipX)?(-vx.x):vx.x,
					(flipY)?(-vx.y):vx.y
					);
        			
        			newv[newv.length]=v2;        	        					
        		}
        		
        		if (flipX || flipY) newv=vecSort(newv);
           		fixDef.shape = new b2PolygonShape;
        		fixDef.shape.SetAsArray(newv,newv.length);     
        		
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
        
        return null;     
      };
      
      function removeBody(bodyid) {
      	var body=bodyById(bodyid);
      	if (body==null) return;
      	world.DestroyBody(body);     
      }
      	function makeMouseJoint(j) {
      		var md = new b2MouseJointDef();
            md.bodyA = world.GetGroundBody();
            md.bodyB = j.b;
            
            md.target.Set(j.x, j.y);
            md.collideConnected = true;
            md.maxForce = 300.0 * j.b.GetMass();
            var mouseJoint = world.CreateJoint(md);
            j.mj=mouseJoint;
            j.b.SetAwake(true);      
            return mouseJoint;	
      	}
      	function removeMouseJoint(id) {
      		delete mouseJoints[id];
      		mouseJoints.count--;      	
      	}
      	
      	function updateMouseJoints(v) {
      		if (v=='d') {
	      		for (var j in mouseJoints) {
	      			var mmj=mouseJoints[j];
	      			if (touches[j]==null && mmj.mj) {
	      				world.DestroyJoint(mmj.mj);
	                  	removeMouseJoint(j);
	      			}
	      		}      		
      		}
      		for (var tid in touches) {
      			var t=touches[tid];
      			if (v=='a' && mouseJoints[tid]==null && t.identifier) {
	      			var mx=(t.clientX-canvasPosition.x)/scale;
					var my=(t.clientY-canvasPosition.y)/scale;	
	            	var mpvec = new b2Vec2(mx, my);
	            	var ab = new b2AABB();
	            	ab.lowerBound.Set(mx - 0.001, my - 0.001);
	            	ab.upperBound.Set(mx + 0.001, my + 0.001);
	        	mouseJoints[tid]={touch:t,b:null,mj:null,x:mx,y:my,mpvec:mpvec};
	        		mouseJoints.count++;
	           		world.QueryAABB(getBodyCB, ab);	     
	           		
	           		if (mouseJoints[tid].b!=null) {
	           			var bobj=bodies[mouseJoints[tid].b.GetUserData()]; 
		   			if (bobj!=null) {
		            			if (bobj.toucheable) {         				
							mouseJoints[tid]={touch:t,b:mouseJoints[tid].b,mj:null,x:mx,y:my};   
							mouseJoints[tid].mj=makeMouseJoint(mouseJoints[tid]);		            			
	         				}
	         			}
	         			else {
	         				removeMouseJoint(tid);
	         			}    			
	         		}
	         		else {
	         				removeMouseJoint(tid); 
	         		}
	           	}
	           	else if (t.identifier && mouseJoints[tid]!=null) {
	           		var mx=(t.clientX-canvasPosition.x)/scale;
				var my=(t.clientY-canvasPosition.y)/scale;	
	           		mouseJoints[tid].x=mx;
	           		mouseJoints[tid].y=my;
	           	}
	        }         	
         };

         function getBodyCB(fixture) {
         	for (var k in mouseJoints) {
         		var mj=mouseJoints[k];
         		if (!mj.mpvec) continue;
         		var mousePVec=mj.mpvec;     		
         		
	            if(fixture.GetBody().GetType() != b2Body.b2_staticBody) {               
	               if(fixture.GetShape().TestPoint(fixture.GetBody().GetTransform(), mousePVec)) {
	                  mouseJoints[k].b = fixture.GetBody();
	                  
	                  return false;
	               }
	            }
	        }
            return true;
         };
      
      
      function update() {      	      		
            if (mouseJoints.count>0) {
              	for (var i in mouseJoints) {
              		var mmj=mouseJoints[i];                  		
              		if (mmj.mj) {
                  		mmj.mj.SetTarget(new b2Vec2(mmj.x, mmj.y));
                  	}
                }
            }            
            
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
				context.drawImage(img.img,-(img.w/2)+img.x,-(img.h/2)+img.y,img.w,img.h);
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
	 
         
         
         
         function updateTouches(tt,v) {
         	v=param(v,'m');
         	var g={count:1};
         	for (var i in tt) {
         		var t=tt[i];         		
         		if (!t.identifier) continue;
         		g["id"+t.identifier]=1;
         		if (touches["id"+t.identifier]==null) {
         			touches["id"+t.identifier]=t;
         			touches.count++;   
         			
         		}
         		else {
         			touches["id"+t.identifier]=t;          			   		
         		}
         	}
         	for (var id in touches) {
         		if ((typeof g[id]=='undefined' || g[id]==null) && touches[id].identifier) {
         			
         			delete touches[id];
         			if (touches.count) touches.count--;
         		}
         		
         	}         		
         	updateMouseJoints(v);
         }
         
        function handleMouseMove(e) {         	
        	e.preventDefault(); 
        	if (e.targetTouches) {
			updateTouches(e.targetTouches);
		}
	    	else {
        		var targetTouches=[];
			targetTouches[0]={identifier:'MOUSEBTN',clientX:e.clientX,clientY:e.clientY};
			updateTouches(targetTouches);
		}
         }; 
         
	document.addEventListener("touchstart", function(e) {     		
		updateTouches(e.targetTouches,'a');			       
		interact(e);
	});
	document.addEventListener("touchend", function(e) {
		updateTouches(e.targetTouches,'d');
		document.removeEventListener("touchmove", handleMouseMove, true);
	}, true);
         
        document.addEventListener("mousedown", function(e) {
        	if (!e.targetTouches) {
        		var targetTouches=[];
        		targetTouches[0]={identifier:'MOUSEBTN',clientX:e.clientX,clientY:e.clientY};
        		updateTouches(targetTouches,'a');
        		interact(e);
        	}
        }, true);

        document.addEventListener("mouseup", function(e) {
         	if (!e.targetTouches) {
        		var targetTouches=[{}];
         		document.removeEventListener("mousemove", handleMouseMove, true);
         		
			updateTouches(targetTouches,'d');
		}
        }, true);        
      		
      	function interact(e) {					        	
		handleMouseMove(e);            
		document.addEventListener("touchmove", handleMouseMove, true);
		document.addEventListener("mousemove", handleMouseMove, true);
      	}
      	
      	
      	      	
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
			makeDynamicCompound:makeDynamicCompound,
			circle:circle,
			box:box,
			poly:poly,
			setBodyAttr : setBodyAttr,
			getBodyAttr: getBodyAttr,
			getJointAttr : getJointAttr,
			nudge:nudge
		}
};
   