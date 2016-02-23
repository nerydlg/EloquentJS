/**********************************************************
 * 	Vector's functions				***
 **********************************************************/
function Vector(x, y){
 this.x = x;
 this.y = y; 	
}

Vector.prototype.plus = function(other){
	return new Vector(this.x + other.x, this.y + other.y );
}

/**********************************************************
 * 	Grid's functions				***
 **********************************************************/

function Grid(width, height){
	this.space = new Array(width);
	// do this to declare a bidimensional array -- ask to dany if there is another way
	for(var i = 0; i < width; i++){
		this.space[i] = new Array(height);	
	}
	this.width = width;
	this.height = height;
}

Grid.prototype.isInside = function(vector){
	return (vector.x >= 0 && vector.y >= 0) &&
		(vector.x < this.width && vector.y < this.height);
};

Grid.prototype.get = function(vector){
	return this.space[vector.x][vector.y];
};

Grid.prototype.set = function(vector, value){
	this.space[vector.x][vector.y] = value;
};

Grid.prototype.forEach = function(f, context){
	for(var y = 0; y < this.height; y++){
		for(var x = 0; x < this.width; x++){
			var value = this.space[x][y];
			if(value != null){
				f.call(context, value, new Vector(x, y));			
			}		
		}	
	}
};

/**********************************************************
 * 	View's functions				***
 **********************************************************/
var directions = { 
	"n" : new Vector( 0 , -1),
	"ne": new Vector( 1 , -1),
	"e" : new Vector( 1 ,  0),
	"se": new Vector( 1 ,  1),
	"s" : new Vector( 0 ,  1),
	"sw": new Vector(-1 ,  1),
	"w" : new Vector(-1 ,  0),
	"nw": new Vector(-1 ,  1) 	
};

function View(world, vector){
	this.vector = vector;
	this.world   = world;
}

View.prototype.look = function(dir){
	var target = this.vector.plus(directions[dir]);
	if(this.world.grid.isInside(target))
		return charFromElement( this.world.grid.get( target ) );
	else
		return "#";
};

View.prototype.find = function(ch){
	var keys = Object.keys(directions);
	var result = this.findAll(ch);
	if(result.length == 0) return null;
	return randomElement(result);
};

View.prototype.findAll = function(ch){
	var ret = Object.keys(directions).map(function (key){
		var finded = this.look(key);
		if(finded === ch){
			return key;		
		}	
	}.bind(this));
	return ret;	
};

/**********************************************************
 * 	Critter's functions				***
 **********************************************************/
var directionNames = Object.keys(directions);

function randomElement(array){
	return array[Math.floor(Math.random() * array.length)];
}

function dirPlus(dir, n){
	var index = Object.keys(directions).indexOf(dir);
	return directionNames[(index + n + 8) % 8];
}

function BouncingCritter(){
	this.direction = randomElement(directionNames);
 	this.energy = 5;
}


BouncingCritter.prototype.act = function(view){
	if(view.look(this.direction) != " " ){
		this.direction = view.find(" ") || "s";	
	}
	return {type: "move", direction: this.direction};
};

/**********************************************************
 **	WallFollower's functions			***
 **********************************************************/

function WallFollower(){
	this.dir  = "s";
}

WallFollower.prototype.act = function(view){
	var start = this.dir;
	if (view.look(dirPlus(this.dir, -3)) != " ")
		start = this.dir = dirPlus(this.dir, -2);
	while(view.look(this.dir) != " "){
		this.dir = dirPlus(this.dir, 1);
		if(this.dir == start) break;	
	}
	return {type: "move", direction: this.dir};
};


/**********************************************************
 **	World's functions				***
 **********************************************************/


function elementFromChar(legend, ch){
	if(ch == " ") return null;
	var element = new legend[ch]();
	element.originChar = ch;
	return element;
}

function World(map, legend){
	var grid = new Grid(map[0].length, map.length);
	this.grid = grid;
	this.legend = legend;



	map.forEach(function(line, y){

		for(var x =  0; x < line.length; x++){
			grid.set(new Vector(x, y), elementFromChar(legend, line[x]));		
		}	
	});
}

function charFromElement(element){
	if(element == null){
		return " ";	
	}else{
		return element.originChar;	
	}
}

World.prototype.toString = function(){
	var output = "";
	for(var y = 0; y < this.grid.height; y++){
		output += " ";
		for(var x = 0; x < this.grid.width; x++){
			var element = this.grid.get(new Vector(x, y));
			output += charFromElement(element);		
		}
		output += "</br>";	
	}
	return output;
};

World.prototype.turn = function(){
	var acted = [];
	this.grid.forEach(function(critter, vector){
		if(critter.act && acted.indexOf(critter) == -1){
			acted.push(critter);
			this.letAct(critter, vector);
		}	
	}, this);
};

World.prototype.letAct = function(critter, vector){
	var action = critter.act(new View(this, vector));
	if(action && action.type == "move"){
		var dest = this.checkDestination(action, vector);
		if(dest && this.grid.get(dest) == null){
			this.grid.set(vector, null);
			this.grid.set(dest, critter);		
		}	
	}
}

World.prototype.checkDestination = function(action, vector){
	if(directions.hasOwnProperty(action.direction)){
		var dest = vector.plus(directions[action.direction]);
		if(this.grid.isInside(dest)){
			return dest;		
		}	
	}
}

/************************************************************
 **	Wall's Object 					*****
 ************************************************************/

function Wall(){
	// nothing to do 
}

/************************************************************
 **	LifeLikeWorld Object				*****
 ************************************************************/
function LifeLikeWorld(map, legend){
	World.call(this, map, legend);
}

LifeLikeWorld.prototype = Object.create(World.prototype);

LifeLikeWorld.prototype.letAct = function(critter, vector) {
	
	var action = critter.act(new View(this, vector));
	var handled = action && action.type in actionTypes && 
			actionTypes[action.type].call(this, critter, vector, action);
	if(!handled) {
		critter.energy -= 0.2;
		if(critter.energy <= 0){
			this.grid.set(vector, null);		
		}	
	}	
};

var actionTypes = Object.create(null);

actionTypes.grow = function(critter) {
	critter.energy += 0.5;
	return true;
};

actionTypes.move = function(critter, vector, action){
	var dest = this.checkDestination(action, vector);
	if( dest == null || 
	    critter.energy <= 1 ||
	    this.grid.get(dest) != null)
		return false;
	critter.energy -= 1;
	this.grid.set(vector, null);
	this.grid.set(dest, critter);
	return true;
};

actionTypes.eat = function(critter, vector, action){
	var dest = this.checkDestination(action,  vector);
	var atDest = dest != null && this.grid.get(dest);

	if(!atDest || atDest.energy == null)
		return false;
	critter.energy += atDest.energy;
	this.grid.set(dest, null);
	return true;
};

actionTypes.reproduce = function(critter, vector, action){
	var baby = elementFromChar(this.legend, critter.originChar);
	var dest = this.checkDestination(action, vector);

	if(dest == null || 
	   critter.energy <= 2 * baby.energy ||
	   this.grid.get(dest) != null)
		return false;
	
	critter.energy -= 2 * baby.energy;
	this.grid.set(dest, baby);
	return true;
}

/***************************************************
 ** Plants Object 				****
 ***************************************************/
function Plant(){
	this.energy = 3 + Math.random() * 4;
}

Plant.prototype.act = function(view){
	if(this.energy > 19){
		var space = view.find(" ");
		if(space)
			return {type: "reproduce", direction: space};
	}
	if(this.energy < 20)
		return {type: "grow"};
};


function PlantEater() {
  this.energy = 20;
}

PlantEater.prototype.act = function(view) {
  var space = view.find(" ");
  if (this.energy > 60 && space)
    return {type: "reproduce", direction: space};
  var plant = view.find("*");
  if (plant)
    return {type: "eat", direction: plant};
  if (space)
    return {type: "move", direction: space};
};
 




