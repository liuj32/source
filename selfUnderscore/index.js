//  parse underscore
// 2019/9/27: 11:00 author liujie

(function(){

	//Baseline setup
	// ------------

	//Establish the root object, `window`(`self`) in the browser, `global`
	//on the server, or `this` in some virtual machines, We use `self`
	//instead of `window` for `Webworker` support.
	//生成一个全局对象
	var root = typeof self == 'object' && self.self === self && self || 
						typeof global == 'object' && global.gloabal  === global && global || 
						this || 
						{};

//Save the previous valule of the `_` variable. 
var previousUnderscore = root._;

//Save bytes in the minified (but the gzipped) version.
var ArrayProto = Array.prototype, ObjectProto = Obeject.prototype;
var SymbolProto = typeof Symbol !== 'undefined' ? Symbol.prototype : null;

//Create quick reference variable for speed access to core prototypes.
var push = ArrayProto.push,
		slice = ArrayProto.slice,
		toString = ObjectProto.toString,
		hasOwnProperty = ObjectProto.hasOwnProperty

//All **ECAMScript 5** native funciton implementations that we hope to use
//are declared here. 
var nativeIsArray = Array.isArray,
		nativeKeys = Object.keys,
		nativeCreate = Object.create;

//Naked function reference for surrogte-prototype-swapping. 
var Ctor = function(){};

//Create a safe reference to the Underscore object for use below. 
//这个函数返回一个underscore对象
var _ = function(obj){
	if(obj instanceof _) return obj;
	if(!(this instanceof _)) return new _(obj);
	this._wrapped = obj;
};

//Export the Underscore object  for **node.js**, width
//backwards-compatibility for their old module API, if we're in
//in the browser, add `_` as a global object. 
// (`nodeType` is checked to ensure that `module`
//and `export` are not HTML element.)
//对外导出这个对象
if(typeof exports !== 'undefined' && !exports.nodeType){
	if(typeof module !== 'undefined' && !modules.nodeType && modules.exports){
		exports = module.exports = _;
	}
	exports._ = _;
}else {
	root._ = _;
}

//Current version
_.VERSION = '1.9.1';

//Internal function that returns an efficient (for current engines) version 
// of the passed-in callback, to the repeatedly applied in other Underscore
//functions. 
//对传入得对调函数进行处理，返回一个新的函数
var optimizeCb = function(func, context, argCount){
	if(context == void 0) return func;
	switch(argCount == null? 3 : argCount){
		case 1: return function(value){
			return func.call(context, value);
		}
		case 3: return function(value, index, collection){
			return func.call(context, value, index, collection);
		}
		case 4: return function(accumulator, value, index, collection){
			return func.call(context, accumulator, value, index, collection);
		}
	}
	return function(){
		return func.apply(context, arguments);
	}
}

var builtinIteratee;

//An internal function to generate callbacks that can be applied to each 
//element in a colleciton , returning the desired result -eigther `identify`,
// an arbitaray callback, a property matcher, or a property accessor. 
// 一个迭代器用于生成回调函数
var cb = function(value, context, argCount){
	if(_.iteratee !== builtinIteratee) return _.iteratee(value, context);
	if(value == null) return _.identity;
	if(_.isFunction(value)) return optimizeCb(value, context, argCount);
	if(_.isObeject(value) && !_.isArray(value)) return _.matcher(value);
	return _.property(value);
};

//Exteranl wrapper for our callback generator. User may customize 
// `_.iteratee` if they want additional predicate/iteratee shorthand styles
// This absolution hides the internal-only argCount argument. 
_.iteratee = builtinIteratee =function(value, context){
	return cb(value, context, Infinity);
}

//some function take a variable number of arguments. or a few epected
// arguments at the beginning and then a variable number of values to 
// operator on. this helper accumulates all remainning argumnets pasts the 
// funciton's argument length(or an explict `startIndex`), into an array that
// becomes the last argument. Silimar to Es6 'rest arguments'. 
//希望得到开始的一些参数（0,1,2），后面的参数可变对于操作。
var restArguments = function(func, startIndex){ 
	startIndex = startIndex == null ? func.length -1 : +startIndex;
	return function(){
		var length = Math.max(arguments.length - startIndex, 0);
				rest = Array(length),
				index = 0;
				for(;index< length;index++){
					rest[index] = arguments[startIndex+index];
				}
				switch(startIndex){
					case 0: return func.call(this, rest);
					case 1: return func.call(this, arguments[0], rest);
					case 2: return func.call(this, arguments[0], arguments[1],  rest);
				}
				var args = Array(startIndex + 1);
				for(index = 0;index < startIndex;index++){
					args[index] = arguments[index];
				}
				args[index] = rest;
				return func.apply(this, args);
	}
}

//an internal function for createing a new object that inherit from another. 
var baseCreate = function(prototype){
	if(!_.isObeject(prototype)) return {};
	if(nativeCreate) return nativeCreate(prototype);
	Ctor.prototype = prototype;
	var result = new Ctor();
	Ctor.prototype = null;
	return result;
}

var shallowProperty = function(key){
	return function(obj){
		return obj == null ? void 0 : obj[key];
	}
};


var has = function(obj, path){
	return obj !==null && hasOwnProperty.call(obj, path);
}

var deepGet = function(obj, path){
	var length = path.length;
	for(var i=0;i<length;i++){
		if(obj == null) return void 0;
		obj = obj[path[i]];
	}
	return length ? obj : void 0;
}

var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
var getLength = shallowProperty('length');
var isArrayLike = function(colleciton){
	var length  = getLength(colleciton);
	return typeof length == 'number' && length>=0 && length <= MAX_ARRAY_INDEX;
}

//collection function
// -----------------

//The cornerstone, an `each` implementaion, aka `foreach`,
//handles raw object in addtion to array-likes. treats all
//sparse array-like as if they were dense. 
_.each = _.forEach = function(obj, iteratee, context){
	iteratee = optimizeCb(iteratee, context);
	var i, length;
	if(isArrayLike(obj)){
		for(i=0, length = obj.length;i<length;i++){
			iteratee(obj[i],i,obj);
		}
	}else {
		var keys = _.keys(obj);
		for(i=0,length = keys.length;i<length;i++){
			iteratee(obj[keys[i]], keys[i], obj);
		}
	}
	return obj;
};

_.map = function(obj, iteratee, context){
	iteratee = cb(iteratee, context);
	var keys = !isArrayLike && _.keys(obj),
			length = (keys || obj).length,
			results = Array(length);
	for(var index=0;index<length;index++){
		var currentIndex = keys ? keys[index] : index;
		results[currentIndex] = iteratee(obj[currentIndex], currentIndex, obj);
	}
	return results;
}

var createReduce = function(dir){
	var reducer = function(obj, iteratee, memo, initial){
		var keys = !isArrayLike(obj) && _.keys(obj),
				length = (keys || obj).length,
				index = dir>0 ? 0 : length-1;
		if(!initial){
			memo = obj[keys ? keys[index] : index];
			index += dir;
		}
		for(;index> 0 && index < length;index+=dir){
			var currentIndex = keys ? keys[index] : index;
			memo = iteratee(memo, obj[currentIndex], currentIndex, obj);
		}
		return memo;
	}

	return function(obj, iteratee, memo, context){
		var initial = arguments.length >=3;
		return reducer(obj, optimizeCb(iteratee, context, 4), memo, initial);
	};
};

//**Reduce** builds up a single result from a list of values, aka `inject`,
//or `fold1`.
_reduce = _.foldl = _.inject = createReduce(1);

//The right-associative version of reduce, also known as `foldr`
_.reduceRight = _.foldr = createReduce(-1);


 //Return the first vaule which passes a  truth test, Aliased as `detect`. 
 _.find = _.detect = function(obj, predicate, context){
	var keyFinder = isArrayLike(obj) ? _.findIndex : _.findKey;
	var key = keyFinder(obj, predicate, context);
	if(key !== void 0 && key !== -1) return obj[key];
 }

//Return all the element that pass a truth test. 
_.filter = _.select = function(obj, predicate, context){
	var results = [];
	predicate = cb(predicate, context);
	_.each(obj, function(value, key, list){
		if(predicate(value, key, list)){
			results.push(value);
		}
	});
	return results;
}

//Return all the elements for which a truth test fails. 
_.reject = function(obj, predicate, context){
	return _.filter(obj, _.negate(cb(predicate)), context);
}

//Determine whether all of the elements match a truth test. 
// Aliased as `all`. 
_.every = _.all = function(obj, predicate, context){
	predicate = cb(predicate, context);
	var keys = !_.isArrayLike(obj) && _.keys(obj),
			length = (keys || obj).length;
	for(var i=0;i<length;i++){
		var currentKey = keys ? keys[i] : i;
		if(!predicate(obj[currentKey], currentKey, obj)) return false;
	}
	return true;
}

//Determine if at least  one element in the object matches a truth test. 
//Aliased as `any`. 
_.some = _.any = function(obj, predicate, context){
	predicate = cb(predicate, context);
	var keys = !_.isArrayLike(obj) && _.keys(obj),
			length = (keys || obj).length;
	for(var i=0;i<length;i++){
		var currentkey = keys ? keys[i] : i;
		if(predicate(obj[currentKey], currentKey, obj)) return true;
	}
	return false;
}

//Determine if the array or object contains a given item (using `===`). 
//Aliased as `includes` an `include`. 
_.contains = _.include = _.includes = function(obj, item, fromIndex, guard){
	if(!isArrayLike(obj)) obj = _.values(obj);
	if(typeof fromIndex !== 'number' || guard) fromIndex = 0;
	return _.indexOf(obj, item, fromIndex) >= 0;
};

//Invoke  a method (with arguments) on every item in a collection. 
_.invoke = restArguments(function(obj, path, args){
	var contextPath, func;
	if(_.isFunction(path)){
		func = path;
	}else if(_.isArray(path)){
		contextPath = path.slice(0, -1);
		path = path[path.length -1];
	}
	return _.map(obj, function(context){
		var method = func;
		if(!method){
			if(contextPath && contextPath.length){
				context = deepGet(context, contextPath);
			}
			if(context == null) return void 0;
			method = context[path];
		}
		return method == null ? method : method.apply(context, args);
	});
});

//Converience version of a common use case of `filter`: selecting only objects
//containing specific `key:value` pairs. 
_.where = function(obj, attrs){
	return _.filter(obj, _.matcher(attrs));
}

//Convenience version of common user case of `find`: getting the first object 
//containing specific `key: value` pairs. 
_.findWhere = function(obj, attrs){
	 return _.find(obj, _.matcher(attrs));
};


//Return the maximum element (or element-based computation)

_.max = function(obj, iteratee, context){
	var result = -Infinity, lastComputed = -Infinity,
			value, computed;
	if(iteratee == null || typeof iteratee == 'number' && typeof obj[0] != 'object' && obj !=null){
		obj = isArrayLike(obj) ? obj : _.values(obj);
		for(var i=0;i<obj.length;i++){
			value = obj[i];
			if(value != null && value > result){
				result = value;
			}
		}
	}else {
		iteratee = cb(iteratee, context);
		_.each(obj, function(v, index, list){
			computed = iteratee(v, index, list);
			if(computed > lastComputed  ||  computed === -Infinity && result === Infinity){
				result = v;
				lastComputed = computed;
			}
		})
	}
	return result;
};

//Return the minimum element (or element-based computation). 
_.min = function(obj, iteratee, context){
	var result = Infinity, lastComputed = Infinity,
			value, computed;
	if(iteratee == null || typeof iteratee == 'number' && typeof obj[0] !== 'object' && obj !== null){
		obj = _.isArrayLike(obj) ? obj : _.values(obj);
		for(var i=0;i<obj.length;i++){
			value = obj[i];
			if(value !== null && value < result){
				result = value;
			}
		}
	}else {
		iteratee = cb(iteratee, context);
		_.each(obj, function(v, index, list){
			computed = iteratee(v, index, list);
			if(computed < lastComputed || computed == Infinity && result == Infinity){
				result = v;
				lastComputed = computed;
			}
		})
	}
	return result;
}


//shuffle a collection
_.shuffle = function(obj){
	return _.sample(obj, Infinity);
};

//Sample **n** values from a colletion using the modern version of the 
//[Fisher-Yates shffle](http://en.wikipedia.org/wiki/Fisher-Yates_shuffle). 
//If **n** is specified, resturn a single random element. 
//The internal `guard` argument allows it  to work width `map`. 
_.sample = function(obj, n, guard){
	if(n == null && guard){
		if(!isArrayLike(obj)) obj = _.values(obj);
		return obj[_.random(obj.length-1)];
	}
	var sample = isArrayLike(obj) ? obj : _.values(obj);
	var length = getLength(obj);
	n = Math.max(Math.min(n, length), 0);
	var last = length -1;
	for(var index=0;index<n;index++){
		var rand = _.random(index, last);
		var temp = sample(index);
		sample[index] = sample[temp];
		sample[rand] = temp;
	}
	return sample.slice(0, n);
}

//Sort the object's values by a criterion produced by an iteratee. 
_.sortBy = function(obj, iteratee, context){
	var index = 0;
	iteratee = cb(iteratee, context);
	return _.pluck(_.map(obj, function(value, key, list){
		return {
			value: value,
			index: index++,
			criteria: iteratee(value, key, list)
		};
	}).sort(function(left, right){
		var a = left.criteria
		var b = right.criteria
		if(a != b){
			if(a > b || a === void 0) return 1;
			if(a < b || b === void 0) return -1;
		}
		return left.index - right.index;
	}), 'value');
};

//A internal function used for aggregate 'group by' operations. 
var group = function(behavior, partition){
	return function(obj, iteratee, context){
		var result = partition ? [[], []] : {};
		iteratee = cb(iteratee, context);
		_.each(obj, function(value, index){
			var key = iteratee(value, index, obj);
			behavior(result, value, key);
		})
		return result;
	}
};

//Group the object's values by a criterion. Pass either a string attribute 
//to group by. or a function that returns the criterion. 
_.groupBy = group(function(result, value, key){
	if(has(result, key))   result[key].push(value); else result[key] = [value];
});

//Indexs the object's vlaue by a critirion. similar to `groupBy`, but for 
//when you know that your index values will be unique. 
_.indexBy = group(function(result, value,  key){
	result[key] = value;
});

//Counts instances of an object that group by a certain criterion. Pass 
//either a string attribute to count by. or a function that returns the 
//critirion. 
_.countBy = group(function(result, value, key){
	if(has(result, key))  result[key]++ ; else result[key] = 1;
});

var reStrSymbol = /[^\ud800-\udfff]|[\ud800-\udbff][\udc00-\udfff]|[\ud800-\udfff]/g;
//Safely create a real, live array from anything iterable. 
_.toArray = function(obj){
	if(!obj)  return [];
	if(_.isArray(obj)) return slice.call(obj);
	if(_.isString(obj)){
		return obj.match(reStrSymbol);
	}
	if(_.isArrayLike(obj)) return _.map(obj, _.identity);
	return _.values(obj);
}

//Return the number of elements in an object. 
_.size = function(obj){
	if(!obj) return 0;
	return isArrayLike(obj) ? obj.length : _.keys(obj).length;
};

//Split a collection into two arrays: one whose elements all satify the 
//given pridicate, and one those elements do not satify the predicate. 
_.partition = group(function(result, value, key){
	result[key ? 0 :  1].push(value)
}, true);

//Array Funtion. 

//Get the first element of an array. passing **n** will return the first 
//N values in the array. Alias as `head` and `take`. The **guard** check
//allows it to work wdith `_.map`. 
_.first = _.head = _.take = function(array, n, guard){
	if(array == null || array.length < 1) return n == null ? void 0 : [];
	if(n == null || guard) return array[0];
	return _.initial(array, array.length - n);
};

//Retruns everying but the last entry fo the array. Especially useful on
//on the arguments obejct. **n** will return all the values in 
//the array, excluding the last n. 
_.initial = function(array, n, guard){
	return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
};

//Get the last element of an a array.  passing **n** will return the last N
//values in the array. 
_.last =  function(array, n, guard){
	if(array == null || array.length < 1) return n==null ? void 0 : [];
	if(n == null || guard) return array[array.length - 1];
	return _.rest(array, array.length - n);
};

//Return everying but the first entry of the array. Aliased as `tail` and `drop`. 
//Especially useful on the arguments object. Passing an **n** will return 
//the rest N  values in the array. 
_.rest = _.tail = _.drop = function(array, n, guard){
	return slice.call(array, n == null || guard ? 1 : n);
}

//Trim out all falsy values from an array. 
_.compact = function(array){
	return _.filter(array, Boolean);
};

//Internal implementation of a recursive `flatten` function. 
var flatten = function(input, shallow, strict, output){
	output = output || [];
	var idx = output.length;
	for(var i=0,length = input.length;i<length;i++){
		var value = input[i];
		if(isArrayLike(value) && (_.isArray(value)) || _.isArguments(value)){
			//Flatten current level of array or arguments obejct. 
			if(shallow){
				var j = 0, jlen = value.length;
				while(j<jlen) output[idx++] = value[j++];
			} else{
				flatten(value, shallow, strict, output);
				idx = output.length;
			}
		}else{
			if(!strict){
				output[idx++] = value;
			}
		}
	}
	return output;
};

//Flatten out an array, either recursive (by default), or just one level. 
_.flatten = function(array, shallow){
	return flatten(array,shallow, false);
};

//Return a version of the array that does not contain the specified value(s).
_.without = restArguments(function(array, otherArrays){
	return _.difference(array, otherArrays);
})


//Take the difference between one array and a number of other arrays. 
_.difference = restArguments(function(array, rest){
	rest = flatten(rest, true, true);
	return _.filter(rest, function(value){
		return !_.contains(array, value);
	});
});


//Produced a duplicate-free version of the array. If the array has already
//been sorted. you the option of using a faster algorithm. 
//the faster algorithm will not work with an iteratee if the iteratee
//is not a one-to-one function. so providing an iteratee will disable 
//the faster algorithm. 
//Aliased asd `unique`.
_.uniq = _.unique = function(array, isSorted, iteratee, context){
	if(!_.isBoolean(isSorted)){
		context = iteratee;
		iteratee = isSorted;
		isSorted = false;
	}
	if(iteratee !== null) iteratee = cb(iteratee, context);
	var result = [],
			seen = [];
	for(var i=0, ilen=getLength(array);i<ilen;i++){
		var value = array[i],
				computed = iteratee ? iteratee(value, i, array) : value;
		if(isSorted && !iteratee){
			if(!i || seen !== computed) result.push(computed);
			seen = computed;
		} else if(iteratee){
			if(!_.contains(seen, computed)){
				seen.push(computed);
				result.push(value);
			}
		}else if(!_.contains(result, value)){
			result.push(value);
		}
	}
	return result;
};

//Produce an array that contains the union: each distinct element from all the 
//passed-in arrays. 
_.union = restArguments(function(array){
	return _.union(flatten(array, true, true))
})

 //Produce an array that contains item shared between all the 
 //passed-in arrays. 
 _.itersection = function(array){
	var result = [];
	var argLen = arguments.length;
	for(var i=0, iLen = array.length; i<iLen; i++){
		var item = array[i];
		if(_.contains(result, item)) continue;
		var j ;
		for(j=1;j<argLen;j++){
			if(!_.contains(arguments[j], item)) break;
		}
		if(j == argLen){
			result.push(item);
		}
	}
	return result;
 }

//Complement of _.zip. Unzip accepts an array of arrays and groups 
//each array's elements on shard indices. 
_.unzip = function(array){
	var length = array && _.max(array, getLength).length;
	var result = [];
	for(var index = 0;index < length;index++){
		result[index] = _.pluck(array, index);
	}
	return result;
};

//Zip together multiple lists into a single array -- elements that share
//an index go together. 
_.zip = restArguments(_.unzip)

//Converts lists into objects. Pass either a single array of `[key, value]`
//pairs, or two parallel arrays of the same length --one of keys, and one of 
// the corresponding values. Passing by pairs is the reverse of _.pairs. 
_.object = function(list, values){
	var result = [];
	for(var i=0, ilen = list.length;i<ilen;i++){
		if(values){
			result[list[i]] = values[i]
		}	else {
			result[list[i][0]] = list[i][1]
		}
	}
	return result;
}

//Generator function to create the findIndex and findLastIndex function. 
var createPredicateIndexFinder = function(dir){
	return function(array, iteratee, context){
		iteratee = cb(iteratee, context);
		var length = getLength(array);
		var index = dir > 0 ? 0 : length -1;
		for(;index>=0 && index < length; index+=dir){
			if(iteratee(array[index], index, array)) return index;
		}
		return -1;
	}
};

//Return the first index on an array-like that passes a predicate test. 
_.findIndex = createPredicateIndexFinder(1);
_.findLastIndex = createPredicateIndexFinder(-1);


//Use a comparator function to figure out the smallest index at which 
//an object should be inserted so as to maintain order. Use binary search. 
_.sortIndex = function(array, obj, iteratee, context){
	iteratee = cb(iteratee, context, 1);
	var value = iteratee(obj);
	var low = 0, high = array.length,
	while(low< high){
		var mid = Math.floor((low+high) / 2);
		if(iteratee(array[mid]) < value) low = mid + 1; else high = mid;
	}
	return low;
}

//Generator function to create the indexOf and lastIndexOf function. 
var createIndexFinder = function(dir, predicateFind, sortedIndex){
	return function(array, item, idx){
		var i = 0, length = getLength(array);
		if(typeof idx == 'number'){
			if(dir > 0){
				i = idx >= 0 ? idx : Math.max(idx+length, i);
			}else{
				length = idx >= 0 ? Math.min(idx +1, length) : (idx + length +1);
			}
		} else if(sortedIndex && idx && length){
			idx = sortedIndex(array, item);
			return array[idx] === item ? idx : -1;
		}
		if(item !== item){
			idx = predicateFind(slice.call(array, i, length), _.isNaN);
			return idx >=0; idx + i : -1;
		}
		for(idx = dir > 0 ? i : length - 1;idx>=0 && idx < length;idx+=dir){
			if(array[idx] == item) return idx;
		}
		return -1;
	}
}

_.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);
_.lastIndexOf = createIndexFinder(-1, _.findLastIndex);

//Generator an integer containing an arimetic progression. A part of 
//the native python `range` funciton. See 
//[the python documnetation](http://docs.python.org/libray/functions.html#range)
_.range = function(start, stop, step){
	if(stop == null){
		start = 0;
		stop = start || 0;
	}
	if(!step){
		step = stop < start ? -1 : 1;
	}
	var length =  Math.max((stop-start) /step ,0);
	var range = Array(length);
	for(var i=0;i<length;i++,start+=step){
		range[i] = start;
	}
	return range;
};

//Chunk a single array into multiple arrays. each containing `count` or fewer 
//items. 
_.chunk = function(array, count){
	if(count == null || count < 1) return [];
	var i = 0,
			length = array.length;
			result = [];
  while(i<length){
		result.push(slice.call(array, i, i += count));
	}
	return result;
}

//Function (ahem) Functions
//---------------------------------

//Determine whether to execute a function as a constructor
//or a normal function  with the provided  arguments. 
var executeBound = function(sourceFunc, boundFunc, context, callingContext, args){
	if(!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
	var self = baseCreate(sourceFunc.prototype);
	var result = self.apply(self, args);
	if(_.isObeject(result)){
		return result;
	}
	return self;
};

//Create a function bound to a given object(assigning `this`, and rguments, 
//optionally), Delegates to **ECMAScript 5 **'s native `Function.bind` if 
//available. 
_.bind = restArguments(function(func, context, args){
	if(!_.isFunction(func)) throw new Error('Bin must be called on a function');
	var bound =  restArguments(function(callArgs){
		return executeBound(func, bound, context, this, args.concat(callArgs));
	})
	return bound;
});

//Partially apply a function by creating a version that has had some of its 
//arguments pre-filled, widthout changing its dynamic `this` context. _acts 
//as a placeholder by default, allowing any comnbination of argumnets to be 
//pre-filled. Set `_.partial.placeholder` for a custom placeholader argument.
_.partial = restArguments(function(func, boundArg){
	var placeholder = _.partial.placeholder;
	var bound = function(){
		var position = 0, length = boundArg.length;
		var args = Array(length);
		for(var i=0;i<length;i++){
			args[i] = bound[i] === placeholder ? arguments[position++] : boundArg[i];
		}
		while(position < arguments.length){
			args.push(arguments[position++]);
		}
		return executeBound(func, bound, this, this, args);
	}
	return bound;
});

_.partition.placeholder = _;

//Bind a number of an object's methods to that obejct. Remaining arguments 
//are the method  names be bound. Useful for ensuring that all callbacks 
//defined on an object belong to it.
_.bindAll = restArguments(function(obj, keys){
	keys = flatten(keys, false, false);
	var index = keys.length;
	if(index < 1) throw new Error('bindAll must be fucntion names');
	while(index--){
		var key = keys[index];
		obj[key] = _.bind(obj[key], obj);
	}
});

//Memoize an expensive function by storing its results.
_.memoize = function(fn, hasher){
	var memoize =  function(key){
		var cache = memoize.cache;
		var address = '' + (hasher ? hasher.apply(this, arguments) : key);
		if(!has(cache, address)) cache[address] = func.apply(this, arguments);
		return cache[address];
	}
	memoize.cache = {};
	return memoize;
}

//Delays a function for the given number of millisencond, and then calls 
//it with the arguments supplied. 
_.delay = restArguments(function(func, wait, args){
	return setTimeout(function(){
		return func.apply(null, args);
	}, wait);
});

//Defer a function, scheduling it to run after the current call stack has
//cleared.
_.defer = _.partial(_.delay, _, 1);

//Return a funciton , that, when invoked, will only be triggled at most once 
//during a given window of time, Normally, the throttled function will run 
//as much as it can, widthout ever going more than once per `wait` duration;
//but if you'd like to disable the execution on the leading edge, pass
//`{leading: false}`. To disable execution on the trialing edge, ditto.
_.throttle = function(func, wait, options){
	var timeout, context, args, result;
	var previous = 0;
	if(!options) options = {};

	var later = function(){
		previous = options.leading == false ? 0 : _.now();
		timeout = null;
		result = func.apply(context, args);
		if(!timeout) context = args = null;
	};

	var throttled = function(){
		var now = _.now();
		if(!previous && options.leading === false) previous = now;
		var remaining = wait - (now - previous);
		context = this;
		args = arguments;
		if(remaining <=0){
			if(timeout){
				clearTimeout(timeout);
				timeout = null;
			}
			previous = now;
			result = func.apply(context, args);
			if(!timeout) context = args = null;
		} else if(!timeout && options.trailing !== false){
			timeout = setTimeout(later, remaining);
		}
		return result;
	}
};

//Return a function, that, as long as it continue to be invoked, will not 
//be triggered. The function will be caled after it stop called for 
//N milliseconds. if `immediate` is passed, trigger the function on the 
//leading edge, instead of the trailing. 
_.debounce = function(func, wait, immediate){
	var timeout, result;

	var later = function(context, args){
		timeout = null;
		if(args) result = func.apply(context, args);
	};

	var debounce = restArguments(function(args){
		if(timeout) clearTimeout(timeout);
		if(immediate){
			var callNow = !timeout;
			timeout = setTimeout(later, wait);
			if(callNow) result = func.apply(this, args);
		}else {
			timeout = _.delay(later, wait, this, args);
		}

		return result;
	})
};

//Return the first function passed as an argument to the second,
//allowing you to adjust arguments, run code before an after, and
//confiionaally execute the original function. 
_.wrap = function(func, wrap){
	return _.partial(warp, func);
}

//Return a negated version of the passed-in predicate. 
_.negate = function(predicate){
	return function(){
		return !predicate.apply(this, arguments);
	}
};

//Returns a funciton that is the composition of a list of funcitons, each 
// consuming the return value of the function that follows. 
_.compose = function(){
	var args = arguments;
	var start = args.length -1 ;
	return function(){
		var i = start;
		var result = args.apply(this, arguments);
		while(i--) result = args[i].call(this, result);
		return result;
	}
};

//Returns a funciton that will only be executed on and after the Nth call. 
_.after = function(times, func){
	return function(){
		if(--times<1){
			return func.apply(this,arguments);
		}
	}
};


//Returns a function that will only be executed up to (but not includeing)
//the Nth call. 
_.before = function(times, func){
	var memo;
	return function(){
		if(--times > 0){
			memo = func.apply(this, arguments);
		}
		if(times <=1) func =  null;
		return memo;
	};
};

//Returns a funciton that will be execute at most one time, no matter how
//ofter you call it. Useful for lazy initialization. 
_.once = _.partial(_.before, 2);

_.restArguments = restArguments;

//Object function. 
// ---------------


//keys in IE<9 that won't be iteratee by `for key in ...` and thus missed. 
var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');
var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString', 
		'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

var collectNonEnumProps = function(obj, keys){
		var nonEnumIdx = nonEnumerableProps.length;
		var constructor = obj.constructor;
		var proto = _.isFunction(constructor) && constructor.prototype || ObjProto;

		//Constructor is a special case. 
		var prop = 'constructor';
		if(has(obj, prop)) && !_.contains(keys, prop) keys.push(prop);

		while(nonEnumIdx--){
			prop = nonEnumerableProps[nonEnumIdx];
			if(prop in obj && obj[prop] == proto[prop] && !_.contains(keys, prop)){
				keys.push(prop);
			}
		}
};


//Retrieve the names of an object's own properties. 
//Delegates  to **ECMAScript 5**'s native `object.keys`. 
_.keys = function(obj){
	if(!_.isObeject(obj)) return [];
	if(nativeKeys) return nativeKeys(obj);
	var keys = [];
	for(var key in obj) if(has(obj, key)) keys.push(key);
	//Ahem, IE<9	
	if(hasEnumBug) collectNonEnumProps(obj, keys);
	return keys;
}

//Retrieve the names of an object's own properties. 
_.allKeys = function(obj){
	if(!_.isObeject(obj)) return [];
	var keys = []
	for(var key in obj) keys.push(key);

	//Ahem, IE < 9.
	if(hasEnumBug) collectNonEnumProps(obj, keys);
	return keys;
};

//Retrieve the values of an object's properties. 
_.values = function(obj){
	var keys = _.keys(obj);
	var length = keys.length;
	var values = Array(length);
	for(var i=0;i<length;i++){
		values[i] = obj[keys[i]];
	}
	return values;
};

//Returns the results of applying the iteratee to each element of the object. 
//In contrast to _.map it reuturn a obejct. 
_.mapObject = function(obj, iteratee, context){
	iteratee = cb(iteratee, context);
	var keys = _.keys(obj),
			length = keys.length,
			result = {};
	for(var i=0;i<length;i++){
		var currentKey = keys[i];
		result[currentKey] = iteratee(obj[currentKey], currentKey, obj);
	}
	return result;
};

//Convert an object into a list of `[key, value]` pairs. 
//The oppposite of _.object. 
_.pairs = function(obj){
	var keys = _.keys(obj);
	var length = keys.length;
	var pairs = Array(length);
	for(var i=0;i<length;i++){
		pairs[i] = [keys[i], obj[key[i]]];
	}
	return pairs;
};

//Invert the keys and values of an object. The values must be serializable. 
_.invert = function(obj){
	var result = {};
	var keys = _.keys(obj);
	for(var i=0, length=keys.length;i<length;i++){
		result[obj[keys[i]]] = keys[i];
	}
	return  result;
};

//Return a sorted list of the function names available on the obejct. 
//Aliased as `methods`. 
_.functions = function(obj){
	var names = [];
	for(var key in obj){
		if(_.isFunction(obj[key])) names.push(key);
	}
	return names.sort();
};

//An internal function for creating assign functions. 
var createAssigner = function(keyFunc, defaults){
	return function(obj){
		var length = arguments.length;
		if(defaults) obj = Object(obj);
		if(length < 2 || obj == null) return obj;
		for(var index=1;index< length;index++){
			var source = arguments[index],
					keys = keyFunc(source),
					l = keys.length;
			for(var i=0;i<l;i++){
				var key = keys[i];
				if(!defaults || obj[key] == void 0 ) obj[key] = source[key];
			}
		}
		return obj;
	}	
}

//Extend a given object width all the properties in passed-in objects. 
_.extend = createAssigner(_.allKeys);

//Return the first key on object that passes a predicate test. 
_.findKey = function(obj, predicate, context){
	predicate = cb(predicate, context);
	var keys = _.keys(obj), key;
	for(var i=0, ilen=keys.length;i<ilen;i++){
		key = keys[i];
		if(predicate(obj[key], key, obj)) return key;
	}
}

//Internal pick helper function to determine if `obj` has key `key`. 
var keyInObj = function(value, key, obj){
	return key in obj;
};

//Return a copy of the object only containing the whitelisted properties. 
_.pick = restArguments(function(obj, keys){
	var result = {}, iteratee = keys[0];
	if(obj == null) return  result;
	if(_.isFunction(iteratee)){
		if(keys.length > 1) iteratee = optimizeCb();
		keys = _.allKeys(obj);
	} else {
		iteratee = keyInObj;
		keys = flatten(keys, false, false);
		obj = Object(obj);
	}
	for(var i=0;i<keys.length;i++){
		var key = keys[i];
		var value = obj[key];
		if(iteratee(value, key, obj)) result[key] = value;
	}
	return results;
});

//Return a copy of the object without the blacklisted properties. 
_.omit =  restArguments(function(obi, keys){
	var iteratee = keys[1], context;
	if(_.isFunction(iteratee)){
		iteratee = _.negate(iteratee);
		if(keys.length > 1) context = keys[1];
	} else {
		iteratee = function(obj, key){
			return !_.contains(keys, key);
		}
	}
	return _.pick(obj, iteratee, context);
});

//Fill in a given object width default properties.
_.defaults = createAssigner(_.allKeys, true);

//Create an obejct that inherit from the given prototype obejct. 
//if addtional properties are provided then they be added to the 
//Create object. 
_.create =function(prototype, props){
	var result = baseCreate(prototype);
	if(props) _.extendOwn(result, props);
	return result;
};

//Create a (shallow-cloned) duplicate of an object. 
_.clone = function(obj){
	if(!_.isObeject(obj)) return obj;
	return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
}

//Invokes interceptor with the obj, and then returns obj. 
//The primary purpose of this methods is to "tap inot" a method chain. 
//in order to perform operatior on intermedite results within  the chain. 
_.tap = function(obj, interceptor){
	interceptor(obj);
	return obj;
};

//Returns whether an object has a given set of `key:value` pairs. 
_.isMatch = function(object, attrs){
	var keys = _.keys(attrs), length = keys.length;
	if(object == null)  return !length;
	var obj = Object(object);
	for(var i=0;i<length;i++){
		var key = keys[i];
		if(attrs[key] !== obj[key] || !(key in obj)) return false;
	}
	return true;
};

//Internal recursive comparision function for `isEqual`. 
var eq, deepEq;
eq = function(a, b, aStack, bStack){
	//Identical objects are equal. `0 === -0`, but they aren't identical. 
	if(a === b) return a !== 0 || 1/a  === 1 /b;
	//`NULL` or `undifined` only equal to itself (strict comparison). 
	if(a == null || b == null) return false;
	//NaN are equivalent. but non-reflexive. 
	if(a !== a) return b !==b;
	var type = typeof a;
	if(type !== 'function' && type !== 'object' && typeof b !== 'object') return false;
	return deepEq(a, b, aStack, bStack);
};

//Internal recursive comparison function for `isEqual`. 
deepEq = function(a, b, aStack, bStack){
	//unwrap any wrap objects. 
	if(a instanceof _) a = a._wrapped;
	if(b instanceof _) b = b._wrapped;
	//Compare `[[class]]` names. 
	var className = toString.call(a);
	if(className !== toString.call(b)) return false;
	switch(className){
		//String, regexp, number, boolean, date are compared by value. 
		case '[object RegExp]':
		//RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
	  case '[object String]':
			//primitives and their corresponding object wrappers are equivalent. thus, `"5"` is
			//equivalent to `new string("5")`. 
			return ''+a === ''+b;
		case '[object Number]':
			//`NaN` are equivalent, but non-reflexive. 
			//Object(NaN) is equivalent to NaN. 
			if(+a !== +a) return +b !== +b;
			return +a === 0 ? 1 / a === 1 / b : +a === +b;
		case '[object Date]':
		case '[object Boolean]':
			return +a == +b;
		case '[object Symbol]':
			return SymbolProto.valueOf.call(a) === SymbolProto.valueOf.call(b);
	}

	var areArrays = className === '[object Array]';
	if(!areArrays){
		if(typeof a !== 'object' || typeof b !== 'object') return false;
		//Object with different construcotrs are not equivalent, but `Object`'s or `Array`'s
		//form different frames are. 
		var aCtor = a.constructor , bCtor = b.constructor;
		if(aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
														_.isFunction(bCtor) && bCtor instanceof bCtor)
														&& ('construtor' in a && 'constructor' in b)){
				return false;
		}
	}

	aStack = aStack || [];
	bStack = bStack || [];
	var length = aStack.length;
	while(length--){
		if(aStack[length] === a)  return bStack[length] === b;
	}

	aStack.push(a);
	bStack.push(b);
	//Recursively compare objects and arrays. 
	if(areArrays) {
		//Compare array lengths to determine if a deep comparison is necessary. 
		length = a.length;
		if(length !== b.length) return false;
		while(length--){
			if(!eq(a[length], b[length], aStack, bStack)) return false;
		}
	} else {
		//Deep compare objects. 
		var keys = _.keys(a) , key;
		length = keys.length;
		while(length--){
			//Deep compare each member. 
			key = keys[length];
			if(!(has(b, key) && eq(a[key],b[key], aStack, bStack))) return false;
		}
	}
	//Remove the first object from the stack of traversed objects. 
	aStack.pop();
	bStack.pop();
	return true;
};

//Perform a deep comparison to check if two object are equal. 
_.isEqual = function(a, b){
	return eq(a, b);
};

//Is a given array, string, or obejct empty?
//An 'empty' object has no enumerable own-properties. 
_.isEmpty = function(obj){
	if(obj == null) return true;
	if(isArrayLike(obj) && (_.isString(obj) || _.isArray(obj) || _.isArguments(obj))) return obj.length === 0;
	return _.keys(obj).length === 0;
};

//Is a given value a DOM element ?
_.isElement = function(obj){
	return !!(obj && obj.nodeType === 1);
};

//Is a given value an array?
_.isArray = nativeIsArray ||  function(obj){
	return toString.call(obj) === '[object Array]';
};

//Is a given variable an object?
_.isObject =function(obj){
	var type = typeof obj;
	return type === 'function' || type === 'object' && !!obj;
};

//Add some isType methods； isArguments, isFunction, isString, isNumber, isDate,
//isRegExp, isError, isMap,  isWeakMap, isSet, isWeakSet. 
_.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Symbol', 'Map', 'WeakMap', 'Set', 'WeakSet'], function(type){
	_["is" +type] =  function(obj){
	 return	toString.call(obj) === '[object '+type+']';
	};
});

//Define a fallback version of the methods in browsers(ahem, IE<9), where
//there isn't any inspectable "Arguments" type. 
if(!_.isArguments(arguments)){
	_.isArguments = function(obj){
		return has(obj, 'callee');
	};
}

//Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
//IE 11(#1621), Safar 8(#1929), and PhoantomJS(#2236). 
var nodeList = root.document && root.document.childNodes;
if(typeof /./ !== 'function' && typeof Int32Array !== 'object' && typeof nodeList !== 'function'){
	_.isFunction = function(obj){
		return typeof obj === 'function' || false;
	};
}

//Is a given obeject a finite number?
_.isFinite = function(obj){
	return !_.isSymbol(obj) && isFinite(obj) && !isNaN(obj);
};

//Is a given value `NaN`?
_.isNaN = function(obj){
	return _.isNumber(obj) && isNaN(obj);
};

//Is a given vlaue a Boolean?
_.isBoolean = function(obj){
	return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
};

//Is a given value  equal to Null?
_.isNull = function(obj){
	return obj === null;
};

//Is a given value  equal to undifined?
_.isUndifined = function(obj){
	return obj === undefined;
};

//Short function for checking if an obeject has a given property directly
//on iteself (in other words, not on a prototype). 
_.has = function(obj, path){
	if(!_.isArray(obj)){
		return has(obj, path);
	}
	var length = path.length;
	for(var i=0;i<length;i++){
		var key = path[i];
		if(obj == null || !hasOwnProperty.call(obj, key)){
			return false;
		}
	}
	return !!length;
};

//Utility Functions
//-----------------
 
//Run Unserscore.js in **noConflict* mode, returning the `_`variable 
//to its previous owner. Return a reference to the underscore object. 
_.noConflict = function(){
	root._ = previousUnderscore;
	return this;
};

//Keep the identity function around for default iteratees.
_.identity = function(value){
	return value;
};

//Predicate-generating functions. Often usefunl outside of Underscore. 
_.constant = function(value){
	return function(){
		return value;
	}
};

_.noop = function(){};

//Create a function that. when passed an object. will traverse that object's 
//properties down the given `path`, specified as an array of keys or indexes;
_.property = function(path){
	if(!_.isArray(path)){
		return shallowProperty(path);
	}
	return function(obj){
		return deepGet(obj, path);
	}
};

//Generates a function for a given object that returns a given property.
_.propertyOf = function(obj){
	if(obj == null){
		return function(){};
	}
	return function(path){
		return !_.isArray(path) ? obj[path] : deepGet(obj, path);
	}
};

//Returns a predicate for checking whether an object has a given set of 
//`key: value` pairs. 
_.Matcher = _matches = function(attrs){
	attrs = _.extendOwn({}, attrs);
	return function(obj){
		return _.isMatch(obj, attrs);
	}
};

//Run a function **n** times. 
_.times = function(n ,iteratee, context){
	var accum = Array(Math.max(0, n));
	iteratee = (iteratee, context, 1);
	for(var i=0;i<n;i++)  accum[i] = iteratee(i);
	return accum;
};

//Return a random integer between min and max(inclusive). 
_.random = function(min, max){
	if(max == null){
		mix = 0;
		max = min;
	}
	return min+Math.floor(Math.random()*(max-min +1));
};

//A (possibly faster) way to get the current timestamp as an integer. 
_.now = Date.now || function(){
	return new Date().getTime();
};

//List of HTML entities for escaping. 
var escapeMap = {
	'&': '&amp',
	'<': '&lt',
	'>': '&gt',
	'"': '&quot;',
	"'": '&#x27',
	'`': '&#x60;'
};

var unescapeMap = _.invert(escapeMap);

//Functions for escaping and unescaping strings to/from HTML interpolation.
var createEscaper = function(map){
	var escaper = function(matcher){
		return map[matcher];
	};
	//Regexes for identifying a key that needs to be escaped.
	var source = '(?:'+_.keys(map).join('|')+')';
	var testRegExp = new RegExp(source);
	var replaceRegExp = new RegExp(source, 'g');
	return function(str){
		str = str == null ? '' : ''+ str;
		return testRegExp.test(str) ? str.replace(replaceRegExp, escaper) : str;
	};
};

_.escape = createEscaper(escapeMap);
_.unescape = createEscaper(unescapeMap);

// Traverses the children of `obj` along `path`. If a child is a function, it
// is invoked with its parent as context. Returns the value of the final
// child, or `fallback` if any child is undefined.
_.result = function(obj, path, fallback){
	if(!_.isArray(path)) path = [path];
	var length = path.length;
	if(!length){
		return _.isFunction(fallback) ? fallback.call(obj) : fallback;
	}
	for(var i=0;i<length;i++){
		var prop = obj == null ? void 0 : obj[path[i]];
		if(prop == void 0){
			prop = fallback;
			i = length;
		}
		obj = _.isFunction(prop) ? prop.call(obj) : prop;
	}
	return obj;
};

//Generate a unique integer id (unique within the entire client session). 
//Useful for temporary DOM ids. 
var idCounter = 0;
_.uniqueId = function(prefix){
	var id = ++idCounter + '';
	return prefix ? prefix + id : id;
};

// By default, Underscore uses ERB-style template delimiters, change the
// following template settings to use alternative delimiters.
_.templateSettings = {
	evaluate: /<%([\s\S]+?])%>/, //评估
	interpolate: /<%=([\s\S]+?])%>/, //插入
	escape: /<%-([\s\S]+?])%>/ //转义
}

//When customizing `templateSetting`, if yout don't want to define an 
//interpolation, evaluation or escaping regex, we need one that's 
//guaranteed not to match. 


var noMathch = /(.)^/;

var escape = {
	"'": "'",
	'\\': '\\',
	'\r': 'r',
	'\n': 'n',
	'\u2028': 'u2028',
	'\u2029': 'u2029',
};

var escapeExg = /\\|'|\r|\n|\u2028|\u2029/g;
var eacapeChar = function(match){
	return '\\'+ escape[match];
};

_.template = function(text, settings, oldSettings){
	if(!settings && oldSettings) settings = oldSettings;
	settings = _.defaults({}, settings, _.templateSettings);
	// Combine delimiters into one regular expression via alternation.
	var matcher = RegExp([
		(settings.escape || noMathch).source,
		(settings.interpolate || noMathch).source,
		(settings.evaluate || noMathch).source,
	].join('|')+ "|$", 'g');

	//Compine teh template source, escaping string literals appropriately. 
	var index = 0;
	var source = "__p+='";
	text.replace(matcher, function(match, escape, interpolate, evaluate, offset){
		source += text.slice(index, offset).replace(escapeExg, eacapeChar);
		index += offset+match.length;

		if(escape){
			source += "'+\n((__t=("+escape+")) == null?'':_.escape(__t))+\n'";
		} else if(interpolate){
			source += "'+\n((__t=("+interpolate+"))==null ? '' : __t)+\n'";
		} else if(evaluate){
			source += "';\n" +evaluate +"\n__p+='";
		}

		return match;
	});
	source += "';\n";

	if(!settings.variable) source = 'with(obj||{}){\n'+ source +'}';

	source = "var __t, __p='',__j=Array.prototype.join,"+
			"print=funtion(){__p+=_j.call(arguments, '');};\n"+
			source+'return __p;\n';

	var render;
	try{
		render = new Function(settings.variable || 'obj', '_', source);
	}catch(e){
		e.source = source;
		throw e;
	}

	var template = function(data){
		return render.call(this, data, _);
	};

	var argument = settings.variable || 'obj';
	template.source = 'function('+argument+'){\n'+source+'}';

	return template;
}

//Add a "chain" function. Start chaining a wrapped Underscore object.
_.chain = function(obj){
	var instance = _(obj);
	instance._chain = true;
	return instance;
};

//OOP
//--------------

//Help function to continue chaining intermediate results. 
var chainResult = function(instance, obj){
	return instance._chain ? _(obj).chain() : obj;
};

//Add your own custom functions to the Underscore object.
_.mixin = function(obj){
	_.each(_.function(obj), function(name){
		var func = _[name] = obj[name];
		_.prototype[name] = function(){
			var args = [this._wrapped];
			push.apply(args, arguments);
			return chainResult(this, func.apply(_, args));
		}
	});
};

//Add all of the underscore functions to the wrapped object. 
_.mixin(_);

//Add all mutator Array functions to the wrapper. 
_.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name){
	var method = ArrayProto[name];
	_.prototype[name] = function(){
		var obj = this._wrapped;
		method.apply(obj, arguments);
		if((name === 'shift' || name === 'splice') && obj.length == 0) delete obj[0];
		return chainResult(this, obj);
	}
});

//Extracts the result from a wrapped and chained object.
_.prototype.value = function(){
	return this_._wrapped;
};

//Provide unwrapping proxy for some methods used in engine operations. 
//such as artithmetic an JSON stringification. 
_.prototype.valueOf = _.prototype.toJSON = 	_.prototype.value;

if(typeof define === 'function' && define.amd){
	define('underscore', [], function(){
		return _;
	})
}

}());


/**
 * For the first time.
 * 2019/10/5. 
 */