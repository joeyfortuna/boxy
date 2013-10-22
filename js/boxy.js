

var BOXY=function(tid,stepTime) {
	if (typeof stepTime=='undefined') stepTime=1/60;
	
	var eventDelegates={};
	
	
	var S_BOX=1;
	var S_CIRCLE=2;
	var S_POLY=3;
	var S_MULTI=4;
	var S_CLONE=5;
	var S_OBOX=6;

	G_ZINDEX=0;

	var touches={count:0};      	
	var mouseJoints={count:0};
      
	var mousePVec;
	var mouseDown=-1;
	var mouseJoint;
	var selectedBody;
	
	var bodiesToDelete=[];

	var updateInterval;
	var bodies={};
	var bodiez=[];
	var touchingBodies={};
	
	var contactCallback=null;
	var detachCallback=null;
	var preDrawCallback=null;
	var postDrawCallback=null;
	var bodyTouchCallback=null;
	var bDrawDebug=false;
	var canvasid=tid;
	var latestMouseTouchId=0;
	
	var orientation={a:0,b:0,g:0};
	
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
	, b2Math= Box2D.Common.Math.b2Math
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
       
       function setTouching(a,b,touching) {       		
       		var ta=param(touchingBodies[a],{});
       		var tb=param(touchingBodies[b],{});
       		var tab=param(ta[b],touching);
       		var tba=param(tb[a],touching);
       		ta[b]=touching;
       		tb[a]=touching;
       		touchingBodies[a]=ta;
       		touchingBodies[b]=tb;       	
       		//if (!touching) echo(a+' - '+b+' = detached',true);	 
       }
       
       function getTouching(a,b) {       		
       		var ta=param(touchingBodies[a],{});
       		var tb=param(touchingBodies[b],{});
       		var tab=param(ta[b],false);
       		var tba=param(tb[a],false);
       		return tab; 		 
       }
       
       stepListener=function() {
       		var lifespan=0;
       		while (bodiesToDelete.length>0 && lifespan<20) {
       			lifespan++;
       			var bodyid=bodiesToDelete.splice(0,1);
	       		var body=bodyById(bodyid);		
				if (body==null) break;		
				
				world.DestroyBody(body);     

				var i=0;
				for (i=0;i<bodiez.length;i++) {
					if (bodiez[i].id==bodyid) {						break;
					}
				}
				bodiez.splice(i,1);
				delete bodies[bodyid];				//delete body;       		
       		}
       };
       
       var contactListener = new Box2D.Dynamics.b2ContactListener;
       contactListener.BeginContact=function(contact, manifold) {
			var fixA=contact.GetFixtureA();
			var fixB=contact.GetFixtureB();
            var bA=fixA.GetBody();
            var bB=fixB.GetBody();
            setTouching(bA.GetUserData(),bB.GetUserData(),true);
            if (contactCallback) {
            	contactCallback(            		
            		{id:bA.GetUserData(), x:bA.GetPosition().x, y:bA.GetPosition().y},
         			{id:bB.GetUserData(), x:bB.GetPosition().x, y:bB.GetPosition().y}
            	);
            }            
       };
       
       contactListener.EndContact=function(contact, manifold) {
			var fixA=contact.GetFixtureA();
			var fixB=contact.GetFixtureB();
            var bA=fixA.GetBody();
            var bB=fixB.GetBody();
            setTouching(bA.GetUserData(),bB.GetUserData(),false);
            if (detachCallback) {
            	detachCallback(            		
            		{id:bA.GetUserData(), x:bA.GetPosition().x, y:bA.GetPosition().y},
         			{id:bB.GetUserData(), x:bB.GetPosition().x, y:bB.GetPosition().y}
            	);
            }            
       };
       
       function standardSetup(obj) {
       		postDrawCallback=obj.postDrawCallback;
       		preDrawCallback=obj.preDrawCallback;
       		contactCallback=obj.contactCallback;
       		detachCallback=obj.detachCallback;
       		bodyTouchCallback=param(obj.bodyTouchCallback,devnull);
       		setEventDelegates({touchStart:obj.touchStart, mouseDown:obj.touchStart,  touchMove:param(obj.touchMove,devnull),mouseMove:param(obj.touchMove,devnull),  touchEnd:obj.touchEnd, mouseUp:obj.touchEnd});
       }
       
       function devnull(args) {
       
       }
       
       function setPostDrawCallback(uc) {
       		postDrawCallback=uc;
       }
       
       function setPreDrawCallback(uc) {
       		preDrawCallback=uc;
       }
       	
	
       function setContactCallback(cc) {
       		contactCallback=cc;
       }
      
       
       world.SetContactListener(contactListener);
       world.SetStepListener(stepListener);
       
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
      
      function setJointAttr(jid,key,val) {
      	var j=jointById(jid);
      	updateJoint(j,key,val);
      }
      
      function updateJoint(j,key,val) {
      	if (j==null) return;
      	if (key=='enableLimit') {
      		j.EnableLimit=true;
      	}
      	else if (key=='dampingRatio') {
      		j.SetDampingRatio(val);
      	}
      	else if (key=='frequencyHz') {
      		j.SetFrequency(val);
      	}
      	else if (key=='enableMotor') {
      		j.EnableMotor(val);
      	}
      	else if (key=='motorSpeed') {
      		j.SetMotorSpeed(val);
      	}
      	else if (key=='maxMotorForce') {
      		j.SetMaxMotorForce(val);
      	}
      	else if (key=='torque') {
      		j.SetMaxMotorTorque(val);
      		//boxy.echo("joint! "+ jid,true);
      	}
      	else j[key]=val;
      	
      }
      
      function getJointAttr(jid,attr) {
      	var j=jointById(jid);
      	if (j==null) return null;
      	if (attr=='anchors') {
      		var aa=j.GetAnchorA();      		
      		aa.x*=scale; aa.y*=scale;
      		var ab=j.GetAnchorB();
      		ab.x*=scale;ab.y*=scale;
      		var aga=null;
      		var agb=null;
      		if (j.GetGroundAnchorA) {
      			aga=j.GetGroundAnchorA();
      			aga.x*=scale;aga.y*=scale;
      			agb=j.GetGroundAnchorB();
      			agb.x*=scale;agb.y*=scale;
      		}
      		return {aa:aa,ab:ab,aga:aga,agb:agb}
      	}
      	else if (attr=='motorEnabled') {      		
      		return j.IsMotorEnabled();
      	}
      	else if (attr=='motorSpeed') {
      		return j.GetMotorSpeed();
      	}
      	else if (attr=='jointSpeed') {
      		return j.GetJointSpeed();
      	}
      	else if (attr=='angle') {
      		return j.GetJointAngle();
      	}
      	else if (attr=='translation') {
      		return tr=j.GetJointTranslation();
      		
      	}
      	return null;
      }
      var lastVec={x:0,y:0}
      function makeSpring(bA,bB,localA,localB,k,friction,desiredDist,fixedPoint) {
      	var pA=bA.GetWorldPoint(localA);
      	var pB=bB.GetWorldPoint(localB);
      	
      	var diff=b2Math.SubtractVV(pB,pA);     
	
	var vA = b2Math.SubtractVV(bA.m_linearVelocity,b2Math.CrossVF(bA.GetWorldVector(localA), bA.m_angularVelocity));
        var vB = b2Math.SubtractVV(bB.m_linearVelocity,b2Math.CrossVF(bB.GetWorldVector(localB), bB.m_angularVelocity));
        var vDiff= b2Math.SubtractVV(vB,vA);
        var dx=diff.Normalize();
	var vrel = 0+ vDiff.y*diff.y;
	var forceMag = -k*(dx-desiredDist) - friction*vrel;
	
	diff=b2Math.MulFV(forceMag,diff); // diff *= forceMag
	diff.x=2*(pA.x-fixedPoint.x)	;
	diff.y=Math.round(diff.y*1000)/1000;
	
	if (Math.abs(diff.y-lastVec.y)<.001) {
		lastVec.y=diff.y;
		//bA.SetLinearDamping(1000.0);
		return;
	}
	
	bB.ApplyForce(diff, bA.GetWorldPoint(localA));
	bA.ApplyForce(b2Math.MulFV(-1.0,diff), bB.GetWorldPoint(localB));
	lastVec.y=diff.y;
	
	
	/**/
      }
      
      function makePrismaticJoint(args) {
      
      	var bA=bodyById(args.aid);
      	var bB=bodyById(args.bid);
      	var aA=param(args.anchorA,bA.GetLocalCenter());
      	var aB=param(args.anchorB,bB.GetLocalCenter());
      
      	var wa=param(args.worldAxis,new b2Vec2(1,0));
      	
      	var wc=param(args.worldCenterA,bA.GetWorldCenter());
      	
     
      	var pj =  new Box2D.Dynamics.Joints.b2PrismaticJointDef();
      	pj.referenceAngle=param(args.referenceAngle,0);
        pj.bodyA=bA;
        pj.bodyB=bB;
        pj.localAnchorA=aA;
        pj.localAnchorB=aB;   
        pj.localAxisA=wa;
        pj.enableLimit=param(args.enableLimit,true);
        pj.lowerTranslation=param(args.lowerTranslation,0);
        pj.upperTranslation=param(args.upperTranslation,0);
        pj.enableMotor=param(args.enableMotor,false);
        pj.motorSpeed=param(args.motorSpeed,0);
        pj.maxMotorForce=param(args.maxMotorForce,0);
        var ud=param(args.jointid,'jntPris_'+args.aid+'_'+args.bid);
        pj.worldCenterA=wc;	
        var joint= world.CreateJoint(pj);      
      	joint.SetUserData(ud);
      	return joint;
      	
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
      
      function makeDistanceJoint(args) {
      		var bA=bodyById(args.aid);
      		var bB=bodyById(args.bid);
      		var ud=param(args.jointid,'jntDis_'+args.aid+'_'+args.bid);
      		var lA=param(args.anchorA,bA.GetLocalCenter());
      		var lB=param(args.anchorB,bB.GetLocalCenter());
      		var dj =  new Box2D.Dynamics.Joints.b2DistanceJointDef();
      		dj.bodyA=bA;
      		dj.bodyB=bB;
      		dj.length=param(args.length,.5);
      		dj.localAnchorA=lA;
      		dj.localAnchorB=lB;
      		dj.collideConnected=false;
      		//dj.dampingRatio=1;
      		//dj.frequencyHz=0;
       		var joint=world.CreateJoint(dj);
      		joint.SetUserData(ud);
      		return joint;      		
      }
      function makeWeldJoint(args) {
      		var bA=bodyById(args.aid);
      		var bB=bodyById(args.bid);
      		var ud=param(args.jointid,'jntDis_'+args.aid+'_'+args.bid);
      		var lA=param(args.anchorA,bA.GetLocalCenter());
      		var lB=param(args.anchorB,bB.GetLocalCenter());
      		var mass=param(args.mass,0);
      		var dj =  new Box2D.Dynamics.Joints.b2WeldJointDef();
      		dj.bodyA=bA;
      		dj.bodyB=bB;
      		dj.mass=mass;
      		
      		dj.localAnchorA=lA;
      		dj.localAnchorB=lB;
      		dj.collideConnected=false;
      		//dj.dampingRatio=1;
      		//dj.frequencyHz=0;
       		var joint=world.CreateJoint(dj);
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
      
      
      function makeStaticBox(objid,w,h,x,y,angle,cx,cy) {
      	if (typeof angle!='undefined') {  
      		var cx=param(cx,0);
      		var cy=param(cx,0);      		
		var dim=[boxy.box(w,h,cx,cy,angle)];
		var body=boxy.makeStaticCompound(objid,dim,x, y);   		
      		return body;      	
      	}
      	else {
      		var body=bodyFactory({l:w,h:h}, {x:x,y:y}, S_BOX, b2Body.b2_staticBody, objid);		
      		return body;	
      	}
      }
      
      function makeDynamicBox(objid,l,h,x,y,angle) {
      	var body=bodyFactory({l:l,h:h}, {x:x,y:y}, S_BOX, b2Body.b2_dynamicBody, objid);		
      	return body;	
      }
      
      function makeStaticBall(objid,r,x,y) {
      	var body=bodyFactory({r:r}, {x:x,y:y}, S_CIRCLE, b2Body.b2_staticBody, objid);
      	return body;
      
      }
      
      function makeDynamicBall(objid,r,x,y) {
      	var body=bodyFactory({r:r}, {x:x,y:y}, S_CIRCLE, b2Body.b2_dynamicBody, objid);
      	return body;      
      }
      
      function makeDynamicPoly(objid,dim,x,y) {
      	var body=bodyFactory(dim,{x:x,y:y},S_POLY, b2Body.b2_dynamicBody, objid);
		return body;      
      }
       function makeStaticPoly(objid,dim,x,y) {
      	var body=bodyFactory(dim,{x:x,y:y},S_POLY, b2Body.b2_staticBody, objid);
		return body;      
      }
      function makeDynamicCompound(objid,dim,x,y) {      	
		var body=bodyFactory(dim, {x:x,y:y}, S_MULTI, b2Body.b2_dynamicBody, objid);
		return body;
      }
      function makeStaticCompound(objid,dim,x,y) {      	
		var body=bodyFactory(dim, {x:x,y:y}, S_MULTI, b2Body.b2_staticBody, objid);
		return body;
      }
      function circle(r) {
      	return {dim:{r:r},shape:S_CIRCLE};      
      }
      
      function box(w,h,x,y,angle) {
      	angle=param(angle,0.0);
      	x=param(x,0);
      	y=param(y,0);
      	return {dim:{l:w,h:h,center:{x:x,y:y},angle:angle},shape:S_OBOX};
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
      	this.touchable=true;
      	this.touched=false;
      	this.fixedRotation=false;
      	this.angle=0;
      	this.body=null;
      	this.position=null;
      	this.zIndex=++G_ZINDEX;
      	this.rotationTarget=null;
      	this.angleOffset=0;
      	bodiez[bodiez.length]=bodyid;
      	return this;
      }
      
      
      function ImgObj(img,w,h,x,y) {
      	this.img=img;
      	this.w=w;
      	this.h=h;
      	this.x=x;
      	this.y=y;
      	this.angle=0;
      	return this;
      
      }
      
      function setBodyRotationTarget(bodyid,targid,angleOffset) {
      		var bobj=bodies[bodyid];
      		bobj.rotationTarget=bodyById(targid);
      		bobj.angleOffset=param(angleOffset,0);
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
      		else if (key=='type') {
      			var b=bodyById(id);
      			if (val=='static') 
      				b.SetType(b2Body.b2_staticBody);
      			else if (val=='dynamic')
      				b.SetType(b2Body.b2_dynamicBody);      			
      		}
      		else if (key=='enableSleep') {
      			var b=bodyById(id);
      			b.SetSleepingAllowed(val);
      		}
      		else if (key=='friction') {
      			var b=bodyById(id);      
      			var fl=b.GetFixtureList(); 
		      	for (var f = fl;f; f = f.GetNext()) {			
		      		f.SetFriction(val);
		      	}
      		}
      		else if (key=='posAndAngle') {      			
      			var b=bodyById(id);
      			var angle=val.angle;
      			var pos=val.pos;
      			b.SetPositionAndAngle(pos,angle);
      		
      		}
      		else if (key=='linearDamping') {
				var b=bodyById(id);
				b.SetLinearDamping(val);		      			
      		}
      		else if (key=='angularDamping') {
				var b=bodyById(id);
				b.SetAngularDamping(val);		      			
      		}
      		else if (key=="fixedrot") {
      			var b=bodyById(id);
      			b.SetFixedRotation(val);
      			bobj.fixedRotation=val;      		
      		} 
      		else if (key=='angle') {
      			var b=bodyById(id);
      			b.SetAngle(val);
      		}
      		else if (key=='contactFilter'){
      			var b1=bodyById(id);
      			var b1def=b1.GetDefinition();      
		      	var fl1=b1.GetFixtureList(); 
		      	for (var f = fl1;f; f = f.GetNext()) {
		      		var filter=f.GetFilterData();
		      		filter.categoryBits=val[0];
		      		filter.maskBits=val[1];
		      		f.SetFilterData(filter);
		      	}
      		}
      		else if (key=='collide'){
      			var b1=bodyById(id);
      			var b1def=b1.GetDefinition();      
		      	var fl1=b1.GetFixtureList(); 
		      	for (var f = fl1;f; f = f.GetNext()) {
		      		var filter=f.GetFilterData();
		      		echo(filter)
		      		if (val==false) filter.maskBits=0;
		      		f.SetFilterData(filter);
		      	}
      		}
      		else if (key=='imgpos') {
      			bobj.imgObj.x=val.x;
      			bobj.imgObj.y=val.y;
      			bodies[id]=bobj;
      		}
      		else if (key=='imgangle') {
      			bobj.imgObj.angle=val;
       			bodies[id]=bobj;
      		}
      		else if (key=='gravityScale') {
      			var b=bodyById(id);
      			b.SetGravityScale(val);
      		}
      		else if (key=='linearVelocity') {
      			var b=bodyById(id);
      			b.SetLinearVelocity(new b2Vec2(val.x,val.y));
      		}
      		else if (key=='img') {
      			bobj.imgObj.img=new Image();
      			bobj.imgObj.src=val.src;
      			bobj.imgObj.x=val.x;
      			bobj.imgObj.y=val.y;
      			bobj.imgObj.w=val.w;
      			bobj.imgObj.h=val.h;
       			bodies[id]=bobj;
      		}
      		else {
      			bobj[key]=val;
      			bodies[id]=bobj;
      		}
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
      		if (jid==jointid) {      			
      			return j;
      		}
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
		bodiesToDelete.push(bodyid);		
	};
	
    function makeMouseJoint(j) {
		var md = new b2MouseJointDef();
		md.bodyA = world.GetGroundBody();
		md.bodyB = j.b;

		md.target.Set(j.x, j.y);
		md.collideConnected = true;
		md.maxForce = 500.0 * j.b.GetMass();
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
	      				var bobj=bodies[mmj.b.GetUserData()]; 	
	      				if (typeof bobj=='undefined') {
						world.DestroyJoint(mmj.mj);
						removeMouseJoint(j);	     
	      					continue;
	      				}
	      				bobj.touched=false;
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
						if (bobj.touchable) {
							mouseJoints[tid].mj = makeMouseJoint(mouseJoints[tid]);
							bodyTouchCallback(bobj);	
							bobj.touched=true;	
							
						}
						else {
							removeMouseJoint(tid);
							bodyTouchCallback(bobj);
						}   
					}
					else {
						removeMouseJoint(tid); 
					}		         		
				}
				else removeMouseJoint(tid);
		        }
		         
	        	
	        	if (mouseJoints[tid]!=null) {
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
         		if (mouseJoints[k].b!=null) continue;
	            if(fixture.GetBody().GetType() != b2Body.b2_staticBody) {               
	   				if(fixture.GetShape().TestPoint(fixture.GetBody().GetTransform(), mousePVec)) {
	                  mouseJoints[k].b = fixture.GetBody();	                  
	                  return false;
	               }
	            }
	        }
	        
            return true;
         };
      
    function sortByZ(aid,bid) {
    	var a=bodies[aid];
    	var b=bodies[bid];
    	if (!a || !b) return 0;
    	
    	if (a.zIndex<bzIndex) return 1;
    	else if (a.zIndex>b.zIndex) return -1;
    	else return 0;
    }
    
    function bodiesTouched() {
    	return (mouseJoints.count>0);
    }
    
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
		
		world.Step(stepTime, 6, 2);
		world.ClearForces();
		stepListener();
		if (bDrawDebug) {
			world.DrawDebugData();
		}
		else {		
			context.clearRect(0,0,canvaswidth,canvasheight);
			
		}
		if (preDrawCallback!=null) preDrawCallback(context);
		
		var bl=world.GetBodyList();
		for (var b=bl;b;b=b.GetNext()) {        		
			var ud=b.GetUserData();
			if (bodies[ud]==null) continue;
			bodies[ud]['angle']=b.GetAngle(); 		
			var position=b.GetPosition();   
			bodies[ud].body=b;
			bodies[ud].position=position;
			if (typeof bodies[ud]['gravity']!='undefined' && bodies[ud]['gravity']!=null) {
				var grav=world.GetGravity();
				var diff=bodies[ud]['gravity']-grav;
				b.ApplyForce( b.GetMass() * diff,  b.GetWorldCenter() );
			}
		}
		// two loops to preserve zIndex
		// bodiez is array of ids in z order
		for (var i in bodiez) {
			var id=bodiez[i];
			if (typeof id=='undefined' || typeof bodies[id]=='undefined') continue;
			var b=bodies[id].body;
			if (!b) continue;
			var position=bodies[id].position;
			var img=bodies[id].imgObj;
			var oldangle=bodies[id].angle;  
			if (bodies[id].rotationTarget) {
				var newangle=calculateTargetAngle(b);
				b.SetAngularVelocity(newangle-oldangle);
			}
			var angle=bodies[id].angle;     
			if (img==null) continue;   
			var imgangle=img.angle;    		
			context.save();					
			context.translate(position.x*scale,position.y*scale); 
			
			context.rotate(angle+imgangle);						
			context.drawImage(img.img,-(img.w/2)+img.x,-(img.h/2)+img.y,img.w,img.h);
			context.restore();				

		}
		if (postDrawCallback!=null) {
			postDrawCallback(context);
		}

            
      };
      function calculateTargetAngle(b1) {
      	var inc=.2;
      	var ud=b1.GetUserData();
		if (bodies[ud]==null || !bodies[ud].rotationTarget) return;
		var b2=bodies[ud].rotationTarget;
		if (!b2) return;
		var b1pos=b1.GetPosition();
		var b1angle=b1.GetAngle();    
		b1angle+=rads(bodies[ud].angleOffset);
		var b2pos=b2.GetPosition();
		var dx=b2pos.x-b1pos.x;
		var dy=b2pos.y-b1pos.y;
		var dh=dy/dx;
		var tana=dy/dx;
		var anga=Math.atan(tana);
		if (b2pos.x<b1pos.x && b2pos.y>b1pos.y && anga>0) anga-=rads(180);
		else if (b2pos.x<b1pos.x && b2pos.y>b1pos.y && anga<0) anga+=rads(180);
		else if (b2pos.x<b1pos.x && b2pos.y<b1pos.y && anga<0) anga-=rads(180);
		else if (b2pos.x<b1pos.x && b2pos.y<b1pos.y && anga>0) anga+=rads(180);
		else if (b2pos.x>b1pos.x && b2pos.y<b1pos.y && anga>0) anga-=rads(180);
		else if (b2pos.x>b1pos.x && b2pos.y<b1pos.y && anga<0) anga+=rads(360);

		var danga=degs(anga)%360;	
		var dranga=degs(b1angle);
		var tang=b1angle;
		if (dranga<-360) {
			dranga=-dranga%360;
			tang=rads(dranga);
		}
		else if (dranga<0) {
			dranga+=360;
			tang=rads(dranga);
		}
		else if (dranga>360) {
			dranga=dranga%360;
			tang=rads(dranga);
		}
		
		if ((tang>(anga+.2) && danga>dranga-180) || danga>dranga+180) b1angle-=inc;
		else if ((tang<(anga-.2) && danga<dranga+180) || danga<dranga-180) b1angle+=inc;
		
		b1angle-=rads(bodies[ud].angleOffset);
		
		bodies[ud].angle=b1angle;
		b1.SetAngle(bodies[ud].angle);
      	return b1angle;
      }
     
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
       		updateInterval=window.setInterval(update, 500 / 60);
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
		 
		function tilt(e) {
			
 			//var g=world.GetGravity(); 			
 			var ax=e.accelerationIncludingGravity.x;
 			var ay=e.accelerationIncludingGravity.y;
 			var az=e.accelerationIncludingGravity.z;
 			//g.x=ay;
 			//g.y=ax;
 			world.SetGravity({x:ay,y:ax});
		}
		
	function orient(e) {
		orientation.a=e.alpha;
		orientation.b=e.beta;
		orientation.g=e.gamma;
	}
		
		function enableTilt() {			
			var bl=world.GetBodyList();
			for (var b=bl;b;b=b.GetNext()) {        		
				b.SetSleepingAllowed(false);
			}
			
			window.ondevicemotion=function(e) {
				tilt(e)
			}
			window.ondeviceorientation=function(e) {
				orient(e)
			}
		};
		
		function disableTilt() {
			window.removeEventListener("devicemotion", tilt,true);
		};
       
         
         function nudge(objid,x,y) {
      		var b=bodyById(objid);      		
      	 	b.ApplyImpulse(new b2Vec2(x,y),b.GetWorldCenter());
       	 }; 
         
         
	function setMouseDown(bVal) {
		isMouseDown=bVal;
	}
	function getMouseDown() {
		return  mouseDown;
	}
	function getMouseDownId() {
		return latestMouseTouchId;
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
         
  
	document.addEventListener("touchstart", function(e) {     	
		e.preventDefault();	
		updateTouches(e.targetTouches,'a');
		if (eventDelegates.touchStart) eventDelegates.touchStart(e);
	}, true);
	document.addEventListener("touchend", function(e) {
		updateTouches(e.targetTouches,'d');
		if (eventDelegates.touchEnd) eventDelegates.touchEnd(e);
	}, true);
         
    	document.addEventListener("touchmove", function(e) {    
      		e.preventDefault();	  	
			updateTouches(e.targetTouches,'m');
		if (eventDelegates.touchMove) eventDelegates.touchMove(e);
	}, true);
      	
        document.addEventListener("mousedown", function(e) {
        	if (typeof e.targetTouches=='undefined' || !e.targetTouches) {
        		var mbutt=null;
        	 	if (e.button>0) mbutt=e.button;
        	 	else mbutt=e.which;
        	 	mouseDown=mbutt;
        		var targetTouches=[];
        		latestMouseTouchId++;
        		targetTouches[0]={identifier:'MOUSEBTN'+latestMouseTouchId,clientX:e.clientX,clientY:e.clientY};
        		updateTouches(targetTouches,'a');        		    
        	}
		if (eventDelegates.mouseDown) eventDelegates.mouseDown(e);
        }, true);

        document.addEventListener("mouseup", function(e) {
         	if (typeof e.targetTouches=='undefined' || !e.targetTouches) {
         		mouseDown=-1;
        		var targetTouches=[];		
			updateTouches(targetTouches,'d');
		}
		if (eventDelegates.mouseUp) eventDelegates.mouseUp(e);
        }, true);        
      		
      	
	document.addEventListener("mousemove", function(e) {
		if (!e.targetTouches && mouseDown==1) {
			e.preventDefault();
			var targetTouches=[];
			targetTouches[0]={identifier:'MOUSEBTN'+latestMouseTouchId, clientX:e.clientX,clientY:e.clientY};
        		updateTouches(targetTouches,'m');        		    			
        	}
		if (eventDelegates.mouseMove) eventDelegates.mouseMove(e);
	}, true);
      	
      	
      	function makeWorldBox() {
      		var canvas=document.getElementById(canvasid);
      		var w=parseInt(canvas.getAttribute("width"));
      		var h=parseInt(canvas.getAttribute("height"));
      		var bground=makeStaticBox('ground',w/scale,0.05,0.05,h/scale);
      		var bceil=cloneBody('ground','ceiling',{x:0,y:0});
      		var rwall=makeStaticBox('rwall',0.01,h/scale,w/scale,0.2);
      		var lwall=cloneBody('rwall','lwall',{x:0,y:.2});
      	}
      	
      	function setEventDelegates(obj) {
      		eventDelegates=obj;
      	
      	}
      	function getCanvasPosition() {
      		return canvasPosition;
      	}
      	
      	if (typeof canvasid!='undefined') makeWorldBox();
      	return {
      		updateTouches: updateTouches,
			setUpdate: setUpdate,
			setDebug: setDebug,
			bodyFactory: bodyFactory,
			cloneBody: cloneBody,
			clone : clone,
			removeBody : removeBody,
			bodyById : bodyById,
			makeWeldJoint: makeWeldJoint,
			makeRevoluteJoint: makeRevoluteJoint,
			makePulleyJoint : makePulleyJoint,
			makeDistanceJoint: makeDistanceJoint,
			makePrismaticJoint:makePrismaticJoint,
			toggleGravity: toggleGravity,
			setContactCallback:setContactCallback,	
			setBodyImage: setBodyImage,
			killUpdate: killUpdate,
			makeStaticBox:makeStaticBox,
			setPostDrawCallback:setPostDrawCallback,
			setPreDrawCallback:setPreDrawCallback,
			makeDynamicBox:makeDynamicBox,
			makeStaticBall:makeStaticBall,
			makeDynamicBall:makeDynamicBall ,
			makeDynamicPoly:makeDynamicPoly,
			makeStaticPoly:makeStaticPoly,
			makeDynamicCompound:makeDynamicCompound,
			makeStaticCompound:makeStaticCompound,
			makeSpring:makeSpring,
			circle:circle,
			box:box,
			poly:poly,
			setBodyAttr : setBodyAttr,
			getBodyAttr: getBodyAttr,
			getJointAttr : getJointAttr,
			setJointAttr :setJointAttr,
			setEventDelegates: setEventDelegates,
			getCanvasPosition:getCanvasPosition,
			nudge:nudge,
			setBodyRotationTarget:setBodyRotationTarget,
			standardSetup:standardSetup,
			getMouseDown:getMouseDown,
			getMouseDownId:getMouseDownId,
			bodiesTouched:bodiesTouched,
			enableTilt:enableTilt,
			disableTilt:disableTilt,
			getTouching:getTouching,
			jointById:jointById,
			tilt:tilt,
			echo:echo
		}
};
   