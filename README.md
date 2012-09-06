boxy
====

Handy dandy wrapper library for box2d.

I created this library as a method of simplify the instantiation and creation of box2d world and objects in HTML5 - friendly browsers.

The idea is to abstract things to the point where you can interact with the 2d objects in HTML5 coordinate space and using HTML5 nominclature.

Example: http://frogstomper.com/boxy/index.html

General Concepts
================

	/* 
   	First, instantiate box2d with the div id of the physics-rendering canvas (TODO: should be CSS select syntax)
   	without any other directives, boxy will create a bounding box around the div to keep objects from falling
   	off the world or out of frame
	*/
	var boxy= BOXY("canvas"); 
   
	boxy.setDebug(); // optional -- if you're using images or otherwise want to render your own world, comment this out
	boxy.setUpdate(); // TODO: this should be automatic

	var ball=boxy.makeDynamicBall('ball', .7, 2, 1); // TODO: units are still in world coordinates
	var otherball=boxy.clone('ball1','ball2', 15, 1); // clone the first ball

	// another example of abstraction - bare minimum to specify are the ids of the 2 joined objects
	boxy.makeRevoluteJoint({aid:'ball1',bid:'ball2'});
    
	// (commented) example of how to attach your own image to box2d objects using boxy
        boxy.setBodyImage('ball1', 'images/dot.png', 50, 50);
        boxy.setBodyImage('ball2', 'images/dot.png', 50, 50);
  
  
  Enjoy!