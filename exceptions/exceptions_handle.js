function MultiplicatorUnitFailure(message) {
	this.msg = message;
	this.stack = (new Error()).stack; 
}

MultiplicatorUnitFailure.prototype = Object.create(Error.prototype);

function primitiveMultiply(a, b) {
  if (Math.random() < 0.5)
    return a * b;
  else
    throw new MultiplicatorUnitFailure();
}

function reliableMultiply(a, b) {
  // Your code here.
  var result = 0;
  try{
	result = primitiveMultiply(a, b);
  }catch(error){
	if(error instanceof MultiplicatorUnitFailure ){
		console.log("there is an error while multply ");	
	}else{
		throw error;	
	}
  } 		
}

console.log(reliableMultiply(8, 8));
// → 64
