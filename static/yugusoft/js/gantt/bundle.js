(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*
Copyright (c) 2010,2011,2012,2013,2014 Morgan Roderick http://roderick.dk
License: MIT - http://mrgnrdrck.mit-license.org

https://github.com/mroderick/PubSubJS
*/
(function (root, factory){
	'use strict';

    if (typeof define === 'function' && define.amd){
        // AMD. Register as an anonymous module.
        define(['exports'], factory);

    } else if (typeof exports === 'object'){
        // CommonJS
        factory(exports);

    }

    // Browser globals
    var PubSub = {};
    root.PubSub = PubSub;
    factory(PubSub);

}(( typeof window === 'object' && window ) || this, function (PubSub){
	'use strict';

	var messages = {},
		lastUid = -1;

	function hasKeys(obj){
		var key;

		for (key in obj){
			if ( obj.hasOwnProperty(key) ){
				return true;
			}
		}
		return false;
	}

	/**
	 *	Returns a function that throws the passed exception, for use as argument for setTimeout
	 *	@param { Object } ex An Error object
	 */
	function throwException( ex ){
		return function reThrowException(){
			throw ex;
		};
	}

	function callSubscriberWithDelayedExceptions( subscriber, message, data ){
		try {
			subscriber( message, data );
		} catch( ex ){
			setTimeout( throwException( ex ), 0);
		}
	}

	function callSubscriberWithImmediateExceptions( subscriber, message, data ){
		subscriber( message, data );
	}

	function deliverMessage( originalMessage, matchedMessage, data, immediateExceptions ){
		var subscribers = messages[matchedMessage],
			callSubscriber = immediateExceptions ? callSubscriberWithImmediateExceptions : callSubscriberWithDelayedExceptions,
			s;

		if ( !messages.hasOwnProperty( matchedMessage ) ) {
			return;
		}

		for (s in subscribers){
			if ( subscribers.hasOwnProperty(s)){
				callSubscriber( subscribers[s], originalMessage, data );
			}
		}
	}

	function createDeliveryFunction( message, data, immediateExceptions ){
		return function deliverNamespaced(){
			var topic = String( message ),
				position = topic.lastIndexOf( '.' );

			// deliver the message as it is now
			deliverMessage(message, message, data, immediateExceptions);

			// trim the hierarchy and deliver message to each level
			while( position !== -1 ){
				topic = topic.substr( 0, position );
				position = topic.lastIndexOf('.');
				deliverMessage( message, topic, data, immediateExceptions );
			}
		};
	}

	function messageHasSubscribers( message ){
		var topic = String( message ),
			found = Boolean(messages.hasOwnProperty( topic ) && hasKeys(messages[topic])),
			position = topic.lastIndexOf( '.' );

		while ( !found && position !== -1 ){
			topic = topic.substr( 0, position );
			position = topic.lastIndexOf( '.' );
			found = Boolean(messages.hasOwnProperty( topic ) && hasKeys(messages[topic]));
		}

		return found;
	}

	function publish( message, data, sync, immediateExceptions ){
		var deliver = createDeliveryFunction( message, data, immediateExceptions ),
			hasSubscribers = messageHasSubscribers( message );

		if ( !hasSubscribers ){
			return false;
		}

		if ( sync === true ){
			deliver();
		} else {
			setTimeout( deliver, 0 );
		}
		return true;
	}

	/**
	 *	PubSub.publish( message[, data] ) -> Boolean
	 *	- message (String): The message to publish
	 *	- data: The data to pass to subscribers
	 *	Publishes the the message, passing the data to it's subscribers
	**/
	PubSub.publish = function( message, data ){
		return publish( message, data, false, PubSub.immediateExceptions );
	};

	/**
	 *	PubSub.publishSync( message[, data] ) -> Boolean
	 *	- message (String): The message to publish
	 *	- data: The data to pass to subscribers
	 *	Publishes the the message synchronously, passing the data to it's subscribers
	**/
	PubSub.publishSync = function( message, data ){
		return publish( message, data, true, PubSub.immediateExceptions );
	};

	/**
	 *	PubSub.subscribe( message, func ) -> String
	 *	- message (String): The message to subscribe to
	 *	- func (Function): The function to call when a new message is published
	 *	Subscribes the passed function to the passed message. Every returned token is unique and should be stored if
	 *	you need to unsubscribe
	**/
	PubSub.subscribe = function( message, func ){
		if ( typeof func !== 'function'){
			return false;
		}

		// message is not registered yet
		if ( !messages.hasOwnProperty( message ) ){
			messages[message] = {};
		}

		// forcing token as String, to allow for future expansions without breaking usage
		// and allow for easy use as key names for the 'messages' object
		var token = 'uid_' + String(++lastUid);
		messages[message][token] = func;

		// return token for unsubscribing
		return token;
	};

	/* Public: Clears all subscriptions
	 */
	PubSub.clearAllSubscriptions = function clearAllSubscriptions(){
		messages = {};
	};

	/*Public: Clear subscriptions by the topic
	*/
	PubSub.clearSubscriptions = function clearSubscriptions(topic){
		var m;
		for (m in messages){
			if (messages.hasOwnProperty(m) && m.indexOf(topic) === 0){
				delete messages[m];
			}
		}
	};

	/* Public: removes subscriptions.
	 * When passed a token, removes a specific subscription.
	 * When passed a function, removes all subscriptions for that function
	 * When passed a topic, removes all subscriptions for that topic (hierarchy)
	 *
	 * value - A token, function or topic to unsubscribe.
	 *
	 * Examples
	 *
	 *		// Example 1 - unsubscribing with a token
	 *		var token = PubSub.subscribe('mytopic', myFunc);
	 *		PubSub.unsubscribe(token);
	 *
	 *		// Example 2 - unsubscribing with a function
	 *		PubSub.unsubscribe(myFunc);
	 *
	 *		// Example 3 - unsubscribing a topic
	 *		PubSub.unsubscribe('mytopic');
	 */
	PubSub.unsubscribe = function(value){
		var isTopic    = typeof value === 'string' && messages.hasOwnProperty(value),
			isToken    = !isTopic && typeof value === 'string',
			isFunction = typeof value === 'function',
			result = false,
			m, message, t;

		if (isTopic){
			PubSub.clearSubscriptions(value);
			return;
		}

		for ( m in messages ){
			if ( messages.hasOwnProperty( m ) ){
				message = messages[m];

				if ( isToken && message[value] ){
					delete message[value];
					result = value;
					// tokens are unique, so we can just stop here
					break;
				}

				if (isFunction) {
					for ( t in message ){
						if (message.hasOwnProperty(t) && message[t] === value){
							delete message[t];
							result = true;
						}
					}
				}
			}
		}

		return result;
	};
}));

},{}],2:[function(require,module,exports){
//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind,
    nativeCreate       = Object.create;

  // Naked function reference for surrogate-prototype-swapping.
  var Ctor = function(){};

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.8.3';

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  var optimizeCb = function(func, context, argCount) {
    if (context === void 0) return func;
    switch (argCount == null ? 3 : argCount) {
      case 1: return function(value) {
        return func.call(context, value);
      };
      case 2: return function(value, other) {
        return func.call(context, value, other);
      };
      case 3: return function(value, index, collection) {
        return func.call(context, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
    }
    return function() {
      return func.apply(context, arguments);
    };
  };

  // A mostly-internal function to generate callbacks that can be applied
  // to each element in a collection, returning the desired result — either
  // identity, an arbitrary callback, a property matcher, or a property accessor.
  var cb = function(value, context, argCount) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return optimizeCb(value, context, argCount);
    if (_.isObject(value)) return _.matcher(value);
    return _.property(value);
  };
  _.iteratee = function(value, context) {
    return cb(value, context, Infinity);
  };

  // An internal function for creating assigner functions.
  var createAssigner = function(keysFunc, undefinedOnly) {
    return function(obj) {
      var length = arguments.length;
      if (length < 2 || obj == null) return obj;
      for (var index = 1; index < length; index++) {
        var source = arguments[index],
            keys = keysFunc(source),
            l = keys.length;
        for (var i = 0; i < l; i++) {
          var key = keys[i];
          if (!undefinedOnly || obj[key] === void 0) obj[key] = source[key];
        }
      }
      return obj;
    };
  };

  // An internal function for creating a new object that inherits from another.
  var baseCreate = function(prototype) {
    if (!_.isObject(prototype)) return {};
    if (nativeCreate) return nativeCreate(prototype);
    Ctor.prototype = prototype;
    var result = new Ctor;
    Ctor.prototype = null;
    return result;
  };

  var property = function(key) {
    return function(obj) {
      return obj == null ? void 0 : obj[key];
    };
  };

  // Helper for collection methods to determine whether a collection
  // should be iterated as an array or as an object
  // Related: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
  // Avoids a very nasty iOS 8 JIT bug on ARM-64. #2094
  var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
  var getLength = property('length');
  var isArrayLike = function(collection) {
    var length = getLength(collection);
    return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
  };

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.
  _.each = _.forEach = function(obj, iteratee, context) {
    iteratee = optimizeCb(iteratee, context);
    var i, length;
    if (isArrayLike(obj)) {
      for (i = 0, length = obj.length; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      var keys = _.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };

  // Return the results of applying the iteratee to each element.
  _.map = _.collect = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length,
        results = Array(length);
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  // Create a reducing function iterating left or right.
  function createReduce(dir) {
    // Optimized iterator function as using arguments.length
    // in the main function will deoptimize the, see #1991.
    function iterator(obj, iteratee, memo, keys, index, length) {
      for (; index >= 0 && index < length; index += dir) {
        var currentKey = keys ? keys[index] : index;
        memo = iteratee(memo, obj[currentKey], currentKey, obj);
      }
      return memo;
    }

    return function(obj, iteratee, memo, context) {
      iteratee = optimizeCb(iteratee, context, 4);
      var keys = !isArrayLike(obj) && _.keys(obj),
          length = (keys || obj).length,
          index = dir > 0 ? 0 : length - 1;
      // Determine the initial value if none is provided.
      if (arguments.length < 3) {
        memo = obj[keys ? keys[index] : index];
        index += dir;
      }
      return iterator(obj, iteratee, memo, keys, index, length);
    };
  }

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`.
  _.reduce = _.foldl = _.inject = createReduce(1);

  // The right-associative version of reduce, also known as `foldr`.
  _.reduceRight = _.foldr = createReduce(-1);

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var key;
    if (isArrayLike(obj)) {
      key = _.findIndex(obj, predicate, context);
    } else {
      key = _.findKey(obj, predicate, context);
    }
    if (key !== void 0 && key !== -1) return obj[key];
  };

  // Return all the elements that pass a truth test.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    predicate = cb(predicate, context);
    _.each(obj, function(value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(cb(predicate)), context);
  };

  // Determine whether all of the elements match a truth test.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };

  // Determine if at least one element in the object matches a truth test.
  // Aliased as `any`.
  _.some = _.any = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };

  // Determine if the array or object contains a given item (using `===`).
  // Aliased as `includes` and `include`.
  _.contains = _.includes = _.include = function(obj, item, fromIndex, guard) {
    if (!isArrayLike(obj)) obj = _.values(obj);
    if (typeof fromIndex != 'number' || guard) fromIndex = 0;
    return _.indexOf(obj, item, fromIndex) >= 0;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      var func = isFunc ? method : value[method];
      return func == null ? func : func.apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matcher(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matcher(attrs));
  };

  // Return the maximum element (or element-based computation).
  _.max = function(obj, iteratee, context) {
    var result = -Infinity, lastComputed = -Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value > result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iteratee, context) {
    var result = Infinity, lastComputed = Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value < result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed < lastComputed || computed === Infinity && result === Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Shuffle a collection, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var set = isArrayLike(obj) ? obj : _.values(obj);
    var length = set.length;
    var shuffled = Array(length);
    for (var index = 0, rand; index < length; index++) {
      rand = _.random(0, index);
      if (rand !== index) shuffled[index] = shuffled[rand];
      shuffled[rand] = set[index];
    }
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (!isArrayLike(obj)) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // Sort the object's values by a criterion produced by an iteratee.
  _.sortBy = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iteratee(value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iteratee, context) {
      var result = {};
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index) {
        var key = iteratee(value, index, obj);
        behavior(result, value, key);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key].push(value); else result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, value, key) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key]++; else result[key] = 1;
  });

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (isArrayLike(obj)) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return isArrayLike(obj) ? obj.length : _.keys(obj).length;
  };

  // Split a collection into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var pass = [], fail = [];
    _.each(obj, function(value, key, obj) {
      (predicate(value, key, obj) ? pass : fail).push(value);
    });
    return [pass, fail];
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[0];
    return _.initial(array, array.length - n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[array.length - 1];
    return _.rest(array, Math.max(0, array.length - n));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, strict, startIndex) {
    var output = [], idx = 0;
    for (var i = startIndex || 0, length = getLength(input); i < length; i++) {
      var value = input[i];
      if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
        //flatten current level of array or arguments object
        if (!shallow) value = flatten(value, shallow, strict);
        var j = 0, len = value.length;
        output.length += len;
        while (j < len) {
          output[idx++] = value[j++];
        }
      } else if (!strict) {
        output[idx++] = value;
      }
    }
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, false);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iteratee, context) {
    if (!_.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }
    if (iteratee != null) iteratee = cb(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = getLength(array); i < length; i++) {
      var value = array[i],
          computed = iteratee ? iteratee(value, i, array) : value;
      if (isSorted) {
        if (!i || seen !== computed) result.push(value);
        seen = computed;
      } else if (iteratee) {
        if (!_.contains(seen, computed)) {
          seen.push(computed);
          result.push(value);
        }
      } else if (!_.contains(result, value)) {
        result.push(value);
      }
    }
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(flatten(arguments, true, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var result = [];
    var argsLength = arguments.length;
    for (var i = 0, length = getLength(array); i < length; i++) {
      var item = array[i];
      if (_.contains(result, item)) continue;
      for (var j = 1; j < argsLength; j++) {
        if (!_.contains(arguments[j], item)) break;
      }
      if (j === argsLength) result.push(item);
    }
    return result;
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = flatten(arguments, true, true, 1);
    return _.filter(array, function(value){
      return !_.contains(rest, value);
    });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    return _.unzip(arguments);
  };

  // Complement of _.zip. Unzip accepts an array of arrays and groups
  // each array's elements on shared indices
  _.unzip = function(array) {
    var length = array && _.max(array, getLength).length || 0;
    var result = Array(length);

    for (var index = 0; index < length; index++) {
      result[index] = _.pluck(array, index);
    }
    return result;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    var result = {};
    for (var i = 0, length = getLength(list); i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // Generator function to create the findIndex and findLastIndex functions
  function createPredicateIndexFinder(dir) {
    return function(array, predicate, context) {
      predicate = cb(predicate, context);
      var length = getLength(array);
      var index = dir > 0 ? 0 : length - 1;
      for (; index >= 0 && index < length; index += dir) {
        if (predicate(array[index], index, array)) return index;
      }
      return -1;
    };
  }

  // Returns the first index on an array-like that passes a predicate test
  _.findIndex = createPredicateIndexFinder(1);
  _.findLastIndex = createPredicateIndexFinder(-1);

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = cb(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0, high = getLength(array);
    while (low < high) {
      var mid = Math.floor((low + high) / 2);
      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
    }
    return low;
  };

  // Generator function to create the indexOf and lastIndexOf functions
  function createIndexFinder(dir, predicateFind, sortedIndex) {
    return function(array, item, idx) {
      var i = 0, length = getLength(array);
      if (typeof idx == 'number') {
        if (dir > 0) {
            i = idx >= 0 ? idx : Math.max(idx + length, i);
        } else {
            length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
        }
      } else if (sortedIndex && idx && length) {
        idx = sortedIndex(array, item);
        return array[idx] === item ? idx : -1;
      }
      if (item !== item) {
        idx = predicateFind(slice.call(array, i, length), _.isNaN);
        return idx >= 0 ? idx + i : -1;
      }
      for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
        if (array[idx] === item) return idx;
      }
      return -1;
    };
  }

  // Return the position of the first occurrence of an item in an array,
  // or -1 if the item is not included in the array.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);
  _.lastIndexOf = createIndexFinder(-1, _.findLastIndex);

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (stop == null) {
      stop = start || 0;
      start = 0;
    }
    step = step || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);

    for (var idx = 0; idx < length; idx++, start += step) {
      range[idx] = start;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Determines whether to execute a function as a constructor
  // or a normal function with the provided arguments
  var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
    if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
    var self = baseCreate(sourceFunc.prototype);
    var result = sourceFunc.apply(self, args);
    if (_.isObject(result)) return result;
    return self;
  };

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
    var args = slice.call(arguments, 2);
    var bound = function() {
      return executeBound(func, bound, context, this, args.concat(slice.call(arguments)));
    };
    return bound;
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    var bound = function() {
      var position = 0, length = boundArgs.length;
      var args = Array(length);
      for (var i = 0; i < length; i++) {
        args[i] = boundArgs[i] === _ ? arguments[position++] : boundArgs[i];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return executeBound(func, bound, this, this, args);
    };
    return bound;
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var i, length = arguments.length, key;
    if (length <= 1) throw new Error('bindAll must be passed function names');
    for (i = 1; i < length; i++) {
      key = arguments[i];
      obj[key] = _.bind(obj[key], obj);
    }
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memoize = function(key) {
      var cache = memoize.cache;
      var address = '' + (hasher ? hasher.apply(this, arguments) : key);
      if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
      return cache[address];
    };
    memoize.cache = {};
    return memoize;
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){
      return func.apply(null, args);
    }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = _.partial(_.delay, _, 1);

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) options = {};
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;

      if (last < wait && last >= 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          if (!timeout) context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) timeout = setTimeout(later, wait);
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a negated version of the passed-in predicate.
  _.negate = function(predicate) {
    return function() {
      return !predicate.apply(this, arguments);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var args = arguments;
    var start = args.length - 1;
    return function() {
      var i = start;
      var result = args[start].apply(this, arguments);
      while (i--) result = args[i].call(this, result);
      return result;
    };
  };

  // Returns a function that will only be executed on and after the Nth call.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Returns a function that will only be executed up to (but not including) the Nth call.
  _.before = function(times, func) {
    var memo;
    return function() {
      if (--times > 0) {
        memo = func.apply(this, arguments);
      }
      if (times <= 1) func = null;
      return memo;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = _.partial(_.before, 2);

  // Object Functions
  // ----------------

  // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
  var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');
  var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
                      'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

  function collectNonEnumProps(obj, keys) {
    var nonEnumIdx = nonEnumerableProps.length;
    var constructor = obj.constructor;
    var proto = (_.isFunction(constructor) && constructor.prototype) || ObjProto;

    // Constructor is a special case.
    var prop = 'constructor';
    if (_.has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);

    while (nonEnumIdx--) {
      prop = nonEnumerableProps[nonEnumIdx];
      if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
        keys.push(prop);
      }
    }
  }

  // Retrieve the names of an object's own properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve all the property names of an object.
  _.allKeys = function(obj) {
    if (!_.isObject(obj)) return [];
    var keys = [];
    for (var key in obj) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Returns the results of applying the iteratee to each element of the object
  // In contrast to _.map it returns an object
  _.mapObject = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys =  _.keys(obj),
          length = keys.length,
          results = {},
          currentKey;
      for (var index = 0; index < length; index++) {
        currentKey = keys[index];
        results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
      }
      return results;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = createAssigner(_.allKeys);

  // Assigns a given object with all the own properties in the passed-in object(s)
  // (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
  _.extendOwn = _.assign = createAssigner(_.keys);

  // Returns the first key on an object that passes a predicate test
  _.findKey = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = _.keys(obj), key;
    for (var i = 0, length = keys.length; i < length; i++) {
      key = keys[i];
      if (predicate(obj[key], key, obj)) return key;
    }
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(object, oiteratee, context) {
    var result = {}, obj = object, iteratee, keys;
    if (obj == null) return result;
    if (_.isFunction(oiteratee)) {
      keys = _.allKeys(obj);
      iteratee = optimizeCb(oiteratee, context);
    } else {
      keys = flatten(arguments, false, false, 1);
      iteratee = function(value, key, obj) { return key in obj; };
      obj = Object(obj);
    }
    for (var i = 0, length = keys.length; i < length; i++) {
      var key = keys[i];
      var value = obj[key];
      if (iteratee(value, key, obj)) result[key] = value;
    }
    return result;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj, iteratee, context) {
    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee);
    } else {
      var keys = _.map(flatten(arguments, false, false, 1), String);
      iteratee = function(value, key) {
        return !_.contains(keys, key);
      };
    }
    return _.pick(obj, iteratee, context);
  };

  // Fill in a given object with default properties.
  _.defaults = createAssigner(_.allKeys, true);

  // Creates an object that inherits from the given prototype object.
  // If additional properties are provided then they will be added to the
  // created object.
  _.create = function(prototype, props) {
    var result = baseCreate(prototype);
    if (props) _.extendOwn(result, props);
    return result;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Returns whether an object has a given set of `key:value` pairs.
  _.isMatch = function(object, attrs) {
    var keys = _.keys(attrs), length = keys.length;
    if (object == null) return !length;
    var obj = Object(object);
    for (var i = 0; i < length; i++) {
      var key = keys[i];
      if (attrs[key] !== obj[key] || !(key in obj)) return false;
    }
    return true;
  };


  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className !== toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
      case '[object RegExp]':
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return '' + a === '' + b;
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive.
        // Object(NaN) is equivalent to NaN
        if (+a !== +a) return +b !== +b;
        // An `egal` comparison is performed for other numeric values.
        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a === +b;
    }

    var areArrays = className === '[object Array]';
    if (!areArrays) {
      if (typeof a != 'object' || typeof b != 'object') return false;

      // Objects with different constructors are not equivalent, but `Object`s or `Array`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
                               _.isFunction(bCtor) && bCtor instanceof bCtor)
                          && ('constructor' in a && 'constructor' in b)) {
        return false;
      }
    }
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

    // Initializing stack of traversed objects.
    // It's done here since we only need them for objects and arrays comparison.
    aStack = aStack || [];
    bStack = bStack || [];
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) return bStack[length] === b;
    }

    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);

    // Recursively compare objects and arrays.
    if (areArrays) {
      // Compare array lengths to determine if a deep comparison is necessary.
      length = a.length;
      if (length !== b.length) return false;
      // Deep compare the contents, ignoring non-numeric properties.
      while (length--) {
        if (!eq(a[length], b[length], aStack, bStack)) return false;
      }
    } else {
      // Deep compare objects.
      var keys = _.keys(a), key;
      length = keys.length;
      // Ensure that both objects contain the same number of properties before comparing deep equality.
      if (_.keys(b).length !== length) return false;
      while (length--) {
        // Deep compare each member
        key = keys[length];
        if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return true;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
    return _.keys(obj).length === 0;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError.
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE < 9), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return _.has(obj, 'callee');
    };
  }

  // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
  // IE 11 (#1621), and in Safari 8 (#1929).
  if (typeof /./ != 'function' && typeof Int8Array != 'object') {
    _.isFunction = function(obj) {
      return typeof obj == 'function' || false;
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj !== +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return obj != null && hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iteratees.
  _.identity = function(value) {
    return value;
  };

  // Predicate-generating functions. Often useful outside of Underscore.
  _.constant = function(value) {
    return function() {
      return value;
    };
  };

  _.noop = function(){};

  _.property = property;

  // Generates a function for a given object that returns a given property.
  _.propertyOf = function(obj) {
    return obj == null ? function(){} : function(key) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of
  // `key:value` pairs.
  _.matcher = _.matches = function(attrs) {
    attrs = _.extendOwn({}, attrs);
    return function(obj) {
      return _.isMatch(obj, attrs);
    };
  };

  // Run a function **n** times.
  _.times = function(n, iteratee, context) {
    var accum = Array(Math.max(0, n));
    iteratee = optimizeCb(iteratee, context, 1);
    for (var i = 0; i < n; i++) accum[i] = iteratee(i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() {
    return new Date().getTime();
  };

   // List of HTML entities for escaping.
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  };
  var unescapeMap = _.invert(escapeMap);

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  var createEscaper = function(map) {
    var escaper = function(match) {
      return map[match];
    };
    // Regexes for identifying a key that needs to be escaped
    var source = '(?:' + _.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function(string) {
      string = string == null ? '' : '' + string;
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    };
  };
  _.escape = createEscaper(escapeMap);
  _.unescape = createEscaper(unescapeMap);

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property, fallback) {
    var value = object == null ? void 0 : object[property];
    if (value === void 0) {
      value = fallback;
    }
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

  var escapeChar = function(match) {
    return '\\' + escapes[match];
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  // NB: `oldSettings` only exists for backwards compatibility.
  _.template = function(text, settings, oldSettings) {
    if (!settings && oldSettings) settings = oldSettings;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escaper, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offest.
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    try {
      var render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function. Start chaining a wrapped Underscore object.
  _.chain = function(obj) {
    var instance = _(obj);
    instance._chain = true;
    return instance;
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(instance, obj) {
    return instance._chain ? _(obj).chain() : obj;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    _.each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result(this, func.apply(_, args));
      };
    });
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
      return result(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result(this, method.apply(this._wrapped, arguments));
    };
  });

  // Extracts the result from a wrapped and chained object.
  _.prototype.value = function() {
    return this._wrapped;
  };

  // Provide unwrapping proxy for some methods used in engine operations
  // such as arithmetic and JSON stringification.
  _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

  _.prototype.toString = function() {
    return '' + this._wrapped;
  };

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}.call(this));

},{}],3:[function(require,module,exports){
"use strict";
var configurable = require('./util/configurable');
var xAxisFactory = require('./xAxis');
var filterLine = require('./filterLine');
var filterData = require('./filterData');
var taskFactory = require('./taskFactory');
var linkFactory = require('./linkFactory');
var taskFunctions = require('./taskFunctions');
var calculate = require('./calculate');

var _ = require('underscore');

var formater = d3.time.format("%Y-%m-%d %H");

module.exports = function (d3) {

    //一些默认的配置
    var defaultConfig = {
        name: 'project manager',
        taskMaps: {}, //任务地图
        data: {
            links: [], //画线
            tasks: [], //任务
        }, //原始数据区
        start: d3.time.day(new Date()),
        end: d3.time.day.offset(d3.time.day(new Date()), 7),
        scale: 1, //当前的绽放级别是多少
        translateX: 0, //当前在x轴上的偏移量是多
        minScale: 0.03,
        maxScale: 2,
        showBaseline: false, //是否显示基线
        showTaskName: false, //是否显示任务名
        margin: {
            top: 4,
            left: 0,
            bottom: 45,
            right: 0
        },
        classFix: function (task) {
            var pri = task ? " priority-" + task.priority : "";
            var dueOut = task && task.endDate && task.endDate.getTime() < new Date().getTime() ? " due-out " : "";
            return 'item ' + pri + dueOut;
        },
        textFix: function (task) {
            return task.name
        },
        afterInit: function () {

        },
        tickFormat: [
            [".%L", function (d) {
                return d.getMilliseconds();
            }],
            [":%S", function (d) {
                return d.getSeconds();
            }],
            ["%I:%M", function (d) {
                return d.getMinutes();
            }],
            ["%I %p", function (d) {
                return d.getHours();
            }],
            ["%a %d", function (d) {
                return d.getDay() && d.getDate() != 1;
            }],
            ["%b %d", function (d) {
                return d.getDate() != 1;
            }],
            ["%B", function (d) {
                return d.getMonth();
            }],
            ["%Y", function () {
                return true;
            }]
        ],
        width: 1000
    };

    var app = function app(config) {
        var me = this;
        config = config || {};
        me.config = config = $.extend(defaultConfig, config);
        me.logger = require('./logger')(d3);
        var xScale = me.xScale = d3.time.scale();
        var yScale = me.yScale = d3.scale.ordinal();

        /**
         * 计算是一年的第几周,用在轴上
         * a year b month c day
         */
        this.getYearWeek = function (a, b, c) {
            /*
             date1是当前日期
             date2是当年第一天
             d是当前日期是今年第多少天
             用d + 当前年的第一天的周差距的和在除以7就是本年第几周
             */
            var date1 = new Date(a, parseInt(b) - 1, c),
                date2 = new Date(a, 0, 1),
                d = Math.round((date1.valueOf() - date2.valueOf()) / 86400000);
            return Math.ceil(
                (d + ((date2.getDay() + 1) - 1)) / 7
            );
        };

        this.getTransformX = function (str) {
            var result = 0;
            if (str) {
                var start = str.indexOf('(');
                var end = str.indexOf(',');
                var _str = str.substring(start + 1, end);
                result = parseFloat(_str);
            }
            return result;
        }

        this.getTransformY = function (str) {
            var result = 0;
            if (str) {
                var start = str.indexOf(',');
                var end = str.indexOf(')');
                var _str = str.substring(start + 1, end);
                result = parseFloat(_str);
            }
            return result;
        }

        /**
         * 选中一个任务效果
         */
        this.selectTask = function (taskId) {
            // console.log('selectTask:' + taskId);
            if (taskId) {
                // console.log(taskId);
                me.config.selectTaskId = taskId;
                d3.select('#select-bg').remove();
                var line = '#app-wrapper';
                var selectBg = d3.select(line).insert('rect')
                    .attr('class', "select-bg")
                    .attr('id', 'select-bg')
                    .attr('height', 30)
                    .attr('opacity', '0.4')
                    // .attr('fill', "#FDF6D2")
                    .attr('transform', function () {
                        var y = me.yScale(taskId) - 1;
                        return 'translate(0,' + y + ')';
                    })
                // .attr('width', function() {
                //   return 3000;
                // });
                //交换层级
                $(line).prepend($('#select-bg'));
            }
        }

        /**
         * 清除选中一个任务效果
         */
        this.clearSelectedTask = function () {
            me.config.selectTaskId = null;
            d3.select('#select-bg').remove();
        }

        /**
         * 再次初始化数据
         */
        this.setData = function (_data) {
            me.config.data = _data;
            me.map = {};
            var visit = function (childrens) {
                if (!childrens) return;
                for (var i = 0; i < childrens.length; i++) {
                    var task = childrens[i];
                    console.log('uuid=' + task.uuid)
                    task = taskFunctions(d3, me, task);
                    me.config.taskMaps[task.uuid] = task;
                    var children = task.children;
                    visit(children);
                }
            }
            visit(me.config.data);
        }

        /**
         * 完全刷新,包括轴数据
         */
        this.refresh = function () {
            me.init(true);
        }

        /**
         * 刷新所有任务
         */
        this.refshAllTask = function () {
            me.redraw(true);
        }

        /**
         * 刷新可视部分任务
         */
        this.refshScreenTask = function () {
            me.redraw(false);
        }

        /**
         * 画基线
         */
        this.showBaseline = function () {
            me.config.showBaseline = true;
            me.redraw(true);
        }


        /**
         * 清除基线
         */
        this.hideBaseline = function () {
            me.config.showBaseline = false;
            me.redraw(true);
        }

        /**
         * 获得当前的配置信息
         */
        this.getConfig = function () {
            return me.config;
        }

        /**
         * 绘制缩放事件dom
         */
        this.drawZoomEl = function () {
            me.zoomRect = me.appWrapper
                .append('rect')
                .classed('zoom', true)
                .attr('width', me.graphWidth)
                .attr('height', me.graphHeight)
                .call(me.zoom)
                .on('dblclick.zoom', null);
        }

        /**
         * 移动到某一天
         */
        this.moveTo = function (date) {
            if (!date) {
                console.log("error date");
                return;
            }
            var offset = -5; //设置一个偏移量，不至于刚好在边上显示
            date = d3.time.day.offset(date, offset)
            var xScale = me.xScale;
            var domain = xScale.domain();
            var start = domain[0];
            var xOffset = xScale(start) - xScale(date);
            var curr = me.zoom.translate()[0];
            me.zoom.translate([curr + xOffset, 0]);
            me.redraw();
        }

        /**
         * 缩放事件开始处理函数
         */
        this.zoomstart = function () {
            config.scale = null;
            config.translate = null;
            $('body').css({
                'cursor': 'move'
            });
            if (d3.event.sourceEvent && d3.event.sourceEvent.toString() === '[object WheelEvent]') {
                config.scale = me.zoom.scale(); //比率
                config.translate = me.zoom.translate(); //偏移量
            }
        }

        /**
         * 缩放事件处理函数
         */
        this.updateZoom = function () {
            //如果是左右拖动操作
            if (d3.event.sourceEvent && d3.event.sourceEvent.toString() === '[object MouseEvent]') {
                // d3.selectAll('.menu').remove()
                // console.log('拖动');
                // me.config.translate = [d3.event.translate[0], 0];
                me.zoom.translate([d3.event.translate[0], 0]);
                if (me.timer) {
                    clearTimeout(me.timer);
                }
                me.redraw(false);
                me.timer = setTimeout(function () {
                    me.redraw(true);
                }, 300);
            }
            //如果是缩放操作
            if (d3.event.sourceEvent && d3.event.sourceEvent.toString() === '[object WheelEvent]') {
                if (d3.event.sourceEvent.altKey) {
                    //只有按下alt+鼠标的时候才有滚动
                    me.zoom.scale(d3.event.scale);
                    me.zoom.translate([d3.event.translate[0], 0]);
                    if (me.timer) {
                        clearTimeout(me.timer);
                    }
                    me.redraw(false);
                    me.timer = setTimeout(function () {
                        me.redraw(true);
                    }, 300);
                } else {
                    //当没有按下alt时，要保持住初始信息
                    me.zoom.scale(config.scale);
                    me.zoom.translate(config.translate);
                }
            }
        }

        /**
         * 缩放事件结束处理函数
         */
        this.zoomEnd = function () {
            $('body').css({
                'cursor': 'default'
            });
            if (typeof config.zoomHandler === 'function') {
                config.zoomHandler({
                    scale: me.zoom.scale(),
                    translateX: me.zoom.translate()[0]
                });
            }
        }

        /*
         * 画出y轴
         */
        this.drawYAxisTick = function () {
            me.appWrapper.select('.y-axis').remove();
            //y容器
            var yAxisEl = me.appWrapper.append('g')
                .classed('y-axis axis', true)
                .attr('transform', 'translate(0, -1)')
                .attr('opacity', '0.4');
            //y数据
            var yTick = yAxisEl.append('g').selectAll('g').data(me.yDomain);
            //y-line
            yTick.enter()
                .append('g')
                .attr('transform', function (d) {
                    return 'translate(0, ' + (yScale(d) + 30) + ')';
                })
                .append('line')
                .classed('y-tick', true)
                // .attr("stroke-dasharray", "10, 10")
                .attr('x1', config.margin.left)
                .attr('x2', config.margin.left + me.graphWidth);
            yTick.exit().remove();
        }

        this.drawLinks = function (links) {
            // console.log(links[links.length - 1]);
            linkFactory(d3, me, me.pathsWrapper, links);
        }

        this.calculateLineEffect = function (result) {
            result = calculate(d3, me, result);
            return result;
        }

        this.cleearPointer = function () {
            d3.selectAll(".templink").remove();
            d3.selectAll(".pointer").remove();
            d3.selectAll('.ghostbox').remove();
        }

        this.drawPointer = function (task) {
            return false;
            d3.selectAll('.pointer').remove();
            var cbx = me.svg.append('g').classed('pointer', true);

            var yOffset = 0;
            var xOffset = 0;
            var btnWidth = 10;
            var btnHeight = 30;

            cbx.append('circle')
                .attr('r', 4)
                .attr('class', 'dot')
                .attr('fill', "red")
                .attr("taskId", task.uuid)
                .attr("type", "start")
                .attr('cx', function (d) {
                    var x = xScale(task.startDate) - btnWidth - xOffset - 3; //btn本身的宽度和偏移量
                    return x;
                }).attr('_cx', function (d) {
                var x = xScale(task.startDate); //btn本身的宽度和偏移量
                return x;
            })
                .attr('cy', function (d) {
                    var y = yScale(task.uuid) + yOffset + 15;
                    return y;
                })
                .call(drag);

            cbx.append('circle')
                .attr('r', 4)
                .attr('class', 'dot')
                .attr('fill', 'red')
                .attr("taskId", task.uuid)
                .attr("type", "end")
                .attr('cx', function (d) {
                    var x = xScale(task.endDate) + xOffset + 12;
                    return x;
                })
                .attr('_cx', function (d) {
                    var x = xScale(task.endDate);
                    return x;
                })
                .attr('cy', function (d) {
                    var y = yScale(task.uuid) + yOffset + 15;
                    return y;
                })
                .call(drag);
        }

        var drag = d3.behavior.drag()
            .on('dragstart', function (d, i) {
                var dom = d3.select(this);
                dom.attr('cx0', dom.attr('_cx'));
                dom.attr('cy0', dom.attr('cy'));
                me.drawGhost();
            })
            .on('drag', function (d, i) {
                var cx = +d3.select(this).attr('cx');
                var cy = +d3.select(this).attr('cy');
                cx += d3.event.dx;
                cy += d3.event.dy;
                d3.select(this).attr('cx', cx).attr('cy', cy);
                me.draggingNode = this;
                me.updateTempConnector();
            })
            .on('dragend', function (d, i) {
                me.draggingNode = null;
                me.selectedNode = null;
                if (me.config.linkData && me.config.linkData.length > 0) {
                    var d = me.config.linkData[0];
                    var fromId = d.source.taskId;
                    var ft = d.source.type;
                    var toId = d.target.taskId;
                    var tt = d.target.type;
                    // ss 1 sf 2 fs 3 ff 4
                    var type = 1;
                    if (ft == "start") {
                        if (tt == "start") {
                            type = 1;
                        } else {
                            type = 2;
                        }
                    } else {
                        if (tt == "start") {
                            type = 3;
                        } else {
                            type = 4;
                        }
                    }
                    ;
                    var m = {
                        "pid": 1,
                        "from_id": parseInt(fromId),
                        "to_id": parseInt(toId),
                        "type": type
                    }
                    me.config.data.links.push(m);
                }
                me.cleearPointer();
                me.redraw(true);
            })

        this.updateTempConnector = function () {
            var data = [];
            if (me.draggingNode && me.selectedNode) {
                var draggingNode = d3.select(me.draggingNode);
                var selectedNode = d3.select(me.selectedNode);
                data = [{
                    source: {
                        taskId: draggingNode.attr("taskId"),
                        type: draggingNode.attr("type"),
                        x: parseInt(draggingNode.attr("cx0")),
                        y: parseInt(draggingNode.attr("cy0"))
                    },
                    target: {
                        taskId: selectedNode.attr("taskId"),
                        type: selectedNode.attr("type"),
                        x: parseInt(selectedNode.attr("cx")),
                        y: parseInt(selectedNode.attr("cy"))
                    }
                }];
            }
            me.config.linkData = data;
            var link = me.svg.selectAll(".templink").data(data);
            link.enter().append("path")
                .attr("class", "templink")
                .attr("fill", "none")
                .attr("stroke", "red")
                .attr("stroke-width", "1px")
                .attr("d", function (o) {
                    return 'M' + o.source.x + "," + o.source.y + " " + o.target.x + "," + o.target.y;
                })
                .attr('pointer-events', 'none');
            link.exit().remove();
        };

        this.drawGhost = function () {
            var m = me.config.m;
            d3.selectAll('.ghostbox').remove();
            var cbx = me.svg.append('g').classed('ghostbox', true);
            var circle = cbx.selectAll(".ghostCircle").data(m);
            var c1 = circle.enter().append("circle")
                .attr('class', 'ghostCircle')
                .attr("r", 30)
                .attr("id", function (d) {
                    return 'c1-' + d;
                })
                .attr("taskId", function (d) {
                    return d;
                })
                .attr("type", "start")
                .attr("opacity", 0.1) // change this to zero to hide the target area
                .attr("cx", function (d) {
                    var task = me.config.taskMaps[d];
                    var x = xScale(task.startDate);
                    return x;
                })
                .attr("cy", function (d) {
                    var y = yScale(d) + 7;
                    return y;
                })
                .style("fill", "red")
                .attr('pointer-events', 'mouseover')
                .on("mouseover", function (node) {
                    me.selectedNode = d3.select("#c1-" + node)[0][0];
                    me.updateTempConnector();
                })
                .on("mouseout", function (node) {
                    me.selectedNode = null;
                    me.updateTempConnector();
                });

            var c2 = circle.enter().append("circle")
                .attr('class', 'ghostCircle')
                .attr("r", 30)
                .attr("id", function (d) {
                    return 'c2-' + d;
                })
                .attr("taskId", function (d) {
                    return d;
                })
                .attr("type", "end")
                .attr("opacity", 0.1) // change this to zero to hide the target area
                .attr("cx", function (d) {
                    var task = me.config.taskMaps[d];
                    var x = xScale(task.endDate);
                    return x;
                })
                .attr("cy", function (d) {
                    var y = yScale(d) + 7;
                    return y;
                })
                .style("fill", "red")
                .attr('pointer-events', 'mouseover')
                .on("mouseover", function (node) {
                    me.selectedNode = d3.select("#c2-" + node)[0][0];
                    me.updateTempConnector();
                })
                .on("mouseout", function (node) {
                    me.selectedNode = null;
                    me.updateTempConnector();
                });

            circle.exit().remove();
        }

        /**
         * 完整重绘
         */
        this.redraw = function (fullRedraw) {
            if (fullRedraw) {
                // this.redrawFix();
            }
            // console.log('redraw');
            var logger = me.logger.build('xxx');
            //处理path
            me.appWrapper.select('.paths-wrapper').remove();
            me.pathsWrapper = me.appWrapper
                .append('g')
                .attr('id', 'paths-wrapper')
                .classed('paths-wrapper', true);

            me.appWrapper.select('.tasks-wrapper').remove();
            me.tasksWrapper = me.appWrapper
                .append('g')
                .attr('id', 'tasks-wrapper')
                .classed('tasks-wrapper', true);

            var yDomain = me.yDomain = [];
            var yRange = me.yRange = [];
            var xScale = me.xScale;
            var yScale = me.yScale;
            me.config.taskIds = me.calculateLineEffect();
            // console.log("计算结果："+JSON.stringify(me.config.taskIds));

            me.config.taskIds.forEach(function (taskId, index) {
                yDomain.push(taskId);
                yRange.push(index * 30);
            });
            yScale.domain(yDomain).range(yRange);

            //画x轴
            var xAxisTopEl = d3.select('#gantt-header');
            var xAxisTop = xAxisFactory(d3, me, xAxisTopEl, 'top');

            if (fullRedraw) {
                me.drawYAxisTick();
            }
            //过滤用
            var scrollTopOffset = $('#gantt-scroller').offset().top;
            var yMin = 0 - scrollTopOffset;
            var yMax = 0 - scrollTopOffset + $('#gantt-wrapper').height() + 80;
            var offset = $('#gantt-wrapper').height() / 2;
            logger.info('3');
            me.drawLinks(me.config.data.links);
            logger.info('4');
            var m = filterLine(me.config.taskIds, me.xScale, me.yScale, yMin, yMax, fullRedraw);
            me.config.m = m;
            m.forEach(function (taskId) {
                taskFactory(d3, me, me.xScale, me.yScale, null, taskId);
            });
            logger.info('5');
            logger.out();

            //     taskbox.append("circle")
            //   .attr('class', 'ghostCircle')
            //   .attr("r", 30)
            //   .attr("opacity", 0.2) // change this to zero to hide the target area
            //   .style("fill", "red")
            //   .attr('transform', 'translate(0, 7)')
            //   .attr('pointer-events', 'mouseover')
            //   .on("mouseover", function(node) {
            //     app.selectedNode = node;
            //     app.updateTempConnector();
            //   })
            //   .on("mouseout", function(node) {
            //     app.selectedNode = null;
            //     app.updateTempConnector();
            //   });


            // taskbox.append("circle")
            //   .attr('class', 'ghostCircle')
            //   .attr("r", 30)
            //   .attr("opacity", 0.2) // change this to zero to hide the target area
            //   .style("fill", "red")
            //   .attr('transform', function() {
            //     var x = (xScale(task.endDate) - xScale(task.startDate));
            //     return 'translate(' + x + ', 7)';
            //   })
            //   .attr('pointer-events', 'mouseover')
            //   .on("mouseover", function(node, x) {
            //     console.log(x);
            //     app.selectedNode = node;
            //     app.updateTempConnector();
            //   })
            //   .on("mouseout", function(node) {
            //     app.selectedNode = null;
            //     app.updateTempConnector();
            //   });


        }

        this.prepare = function () {
            var yDomain = me.yDomain = [];
            var yRange = me.yRange = [];

            //要绘制的任务列表
            var _tasks = [];
            //要移动到的最小位置
            var minDate = null;

            var visit = function (parent) {
                if (!parent) return;
                for (var i = 0; i < parent.length; i++) {
                    var item = parent[i];
                    item = taskFunctions(d3, me, item);
                    // window.task = item;
                    _tasks.push(item.uuid);
                    minDate = minDate || item.startDate;
                    minDate.getTime();
                    minDate = minDate.getTime() < item.startDate.getTime() ? minDate : item.startDate;
                    var children = item.children;
                    visit(children);
                }
            }
            visit(me.config.data.tasks);
            // console.log(xScale, xScale.domain()[0], xScale.domain()[0].getYear())
            if (xScale && xScale.domain()[0].getFullYear() > 1970) {
                minDate = xScale.domain()[0];
                // console.log('有最小日期：' + minDate)
            } else {
                // console.log('最小日期：' + minDate)
            }

            // me.config.tasks = _tasks;

            var selections = d3.select('#' + me.config.dom).datum(_tasks);
            selections.each(function (data) {
                me.graphWidth = config.width;
                var graphHeight = 0;
                var wrapperHeight = $('#gantt-wrapper').height();
                graphHeight = data.length * 30;
                me.graphHeight = graphHeight < wrapperHeight ? wrapperHeight : graphHeight;

                me.zoom = d3.behavior.zoom().center(null)
                    .scaleExtent([config.minScale, config.maxScale])
                    .on('zoomstart', me.zoomstart)
                    .on("zoom", me.updateZoom)
                    .on("zoomend", me.zoomEnd)
                //每一天占30px
                me.config.stepWidth = 30;
                //计算可以画多少天
                me.config.step = me.graphWidth / config.stepWidth;
                //计算可以画到哪一天
                me.config.end = d3.time.day.offset(minDate, config.step);
                // me.config.zoom = me.zoom;
                var days = d3.time.days(minDate, config.end);
                xScale.range([0, me.graphWidth])
                    .domain([minDate, config.end])
                    // .nice(d3.time.day);
                me.zoom.x(xScale);
                me.zoom.size([me.graphWidth, me.graphHeight]);

                // return;
                d3.select(this).select('svg').remove();
                me.svg = d3.select(this)
                    .append('svg')
                    .attr('id', 'app')
                    .attr('class', 'app')
                    .attr('xmlns', 'http://www.w3.org/2000/svg')
                    .attr('preserveAspectRatio', 'xMinYMin');

                me.svg.attr('width', me.graphWidth)
                    .attr('height', me.graphHeight);

                d3.select('#app-wrapper-bg')
                    .attr('width', me.graphWidth)
                    .attr('height', me.graphHeight)

                me.appWrapper = me.svg.append('g')
                    .attr('id', 'app-wrapper')
                    .classed('app-wrapper', true);

                me.drawZoomEl();
                me.zoom.scale(config.scale || 1);
                if (config.translateX) {
                    zoom.translate([config.translateX, 0])
                }
            });
        }

        this.redrawFix = function () {
            var yDomain = me.yDomain = [];
            var yRange = me.yRange = [];

            //要绘制的任务列表
            var _tasks = [];
            //要移动到的最小位置
            var minDate = null;

            var visit = function (parent) {
                if (!parent) return;
                for (var i = 0; i < parent.length; i++) {
                    var item = parent[i];
                    item = taskFunctions(d3, me, item);
                    // window.task = item;
                    _tasks.push(item.uuid);
                    minDate = minDate || item.startDate;
                    minDate.getTime();
                    minDate = minDate.getTime() < item.startDate.getTime() ? minDate : item.startDate;
                    var children = item.children;
                    visit(children);
                }
            }
            visit(me.config.data.tasks);
            // me.config.tasks = _tasks;

            var selections = d3.select('#' + me.config.dom).datum(_tasks);
            selections.each(function (data) {
                me.graphWidth = config.width;
                var graphHeight = 0;
                var wrapperHeight = $('#gantt-wrapper').height();
                graphHeight = data.length * 30;
                me.graphHeight = graphHeight < wrapperHeight ? wrapperHeight : graphHeight;

                me.svg.attr('width', me.graphWidth)
                    .attr('height', me.graphHeight);

                d3.select('#app-wrapper-bg')
                    .attr('width', me.graphWidth)
                    .attr('height', me.graphHeight)
            });
        }

        this.init = function (outer) {
            this.prepare();
            //这里处理iscroll
            this.redraw(true);
            if (!outer) {
                if (typeof me.config.afterInit == 'function') {
                    me.config.afterInit();
                }
            }
        }
        configurable(this.init, config);
        return this;
    };
    return app;
};
},{"./calculate":4,"./filterData":5,"./filterLine":6,"./linkFactory":7,"./logger":8,"./taskFactory":11,"./taskFunctions":12,"./util/configurable":13,"./xAxis":14,"underscore":2}],4:[function(require,module,exports){
"use strict";
var _ = require('underscore');
var formater = d3.time.format("%Y-%m-%d %H");

module.exports = function (d3, app) {

    var findFrom = function (taskId) {
        var result = _.filter(app.config.data.links, function (link) {
            return link.to_id === taskId;
        });
        return result;
    }

    var calculateParentTime = function (result, parent, tasks) {
        if (!tasks || tasks.length == 0) return;
        var min, max;
        var total = 0;
        var used = 0;
        //这一段计算父任务时间
        for (var i = 0; i < tasks.length; i++) {
            var item = tasks[i];
            item = app.config.taskMaps[item.uuid] || item;
            if (item.startDate.getTime() == item.endDate.getTime()) {
                // item.marker = true;
            }
            item.parentId = parent ? parent.uuid : null;
            result.push(item.uuid);
            if (item.expanded == false) {
                //如果没有展开刚不往下计算
            } else {
                var children = item.children;
                calculateParentTime(result, item, children);
            }
            total += (item.endDate.getTime() - item.startDate.getTime());
            used += (item.endDate.getTime() - item.startDate.getTime()) * item.percent;
            if (min == null) {
                min = item.startDate.getTime();
                max = item.endDate.getTime();
            } else {
                min = Math.min(min, item.startDate.getTime());
                max = Math.max(max, item.endDate.getTime());
            }
        }
        if (parent) {
            parent.percent = used / total;
            parent.startDate = new Date(min);
            parent.endDate = new Date(max);
            app.config.taskMaps[parent.uuid] = parent;
        }
        return result;
    }

    var calculateLineTime = function () {
        var linkTree = {}; //记录所有的父子关系
        var temp = {}; //记录所有的子
        //添加连线的受控影响
        app.config.data.links.forEach(function (link, index) {
            var sid = link.from_id;
            var tid = link.to_id;
            var fromTask = app.config.taskMaps[sid];
            var toTask = app.config.taskMaps[tid];
            if (fromTask && toTask) {
                toTask.from = toTask.from || [];
                toTask.from.push(sid);
                fromTask.to = fromTask.to || [];
                fromTask.to.push(tid);
                var s = linkTree[sid] || {
                        id: sid,
                        children: []
                    };
                var t = linkTree[tid] || {
                        id: tid,
                        children: []
                    };
                s.children.push(t);
                linkTree[sid] = s;
                linkTree[tid] = t;
                temp[tid] = 1;
            }
            //ss 1 sf 2 fs 3 ff 4
        });

        //这一步的目的是为了找出root
        var result = [];
        for (var key in linkTree) {
            if (!temp[key]) {
                result.push(linkTree[key]);
            }
        }

        while (result.length > 0) {
            var item = result.shift();
            result = _.union(result, item.children);
            var from = findFrom(item.id);
            // if (item.id == 5) {
            //   console.log(JSON.stringify(from));
            // }
            var task = app.config.taskMaps[item.id];
            var startDate = 0;
            var endDate = 0;
            var ooo = [];
            _.each(from, function (link) {
                //ss 1 sf 2 fs 3 ff 4
                //link {"id":95,"pid":1,"from_id":79,"to_id":82,"type":3}
                var sid = link.from_id;
                var tid = link.to_id;
                var type = link.type;
                var fromTask = app.config.taskMaps[sid];
                var toTask = app.config.taskMaps[tid];
                if (fromTask) {
                    if (type == 1) {
                        startDate = Math.max(startDate, fromTask.startDate.getTime());
                    } else if (type == 3) {
                        startDate = Math.max(task.startDate.getTime(), fromTask.endDate.getTime());
                    } else if (type == 4) {
                        endDate = Math.min(endDate, fromTask.endDate.getTime());
                    }
                }
            });
            if (startDate > 0) {
                var offset = (task.startDate.getTime() - startDate) / 1000;
                task.move(offset);
                app.config.taskMaps[task.uuid] = task;
            }
        }
    }

    var init = function () {
        var result = [];
        calculateParentTime(result, null, app.config.data.tasks);
        calculateLineTime();
        calculateParentTime(result, null, app.config.data.tasks);
        // console.log(formater(app.config.taskMaps[5].startDate));
        result = _.union(result);
        return result;
    }

    //画任务
    return init();
};
},{"underscore":2}],5:[function(require,module,exports){
"use strict";
/* global module */

module.exports = function filterDate(data, xScale, yScale, yMin, yMax,
  fullRedraw) {
  data = data || [];
  var filteredData = [];
  var boundary = xScale.range();
  var min = boundary[0];
  var max = boundary[1];
  var st = new Date().getTime();
  data.forEach(function(datum) {
    var start = xScale(datum.startDate);
    var end = xScale(datum.endDate);
    var y = yScale(datum.uuid);
    if (end < min || start > max) {
      return;
    }
    if (!fullRedraw && (y < yMin || y > yMax)) {
      return;
    }
    filteredData.push(datum);
  });
  var et = new Date().getTime();
  // //////console.log('count==='  + "cost" + (et - st));
  return filteredData;
};

},{}],6:[function(require,module,exports){
"use strict";
/* global module */

module.exports = function filterLine(data, xScale, yScale, yMin, yMax, fullRedraw) {
  data = data || [];
  var result = [];
  // var offset = $('#gantt-scroller').offset().top;
  // var yMin = 0 - offset;
  // var yMax = 0 - offset + $('#gantt-wrapper').height();
  var count = 0;

  var st = new Date().getTime();
  // return data;

  var t = 0;
  var findMin = function(data, yMin) {
    var s = 0,
      e = data.length - 1;
    while (s < e-1) {
      t++;
      var middle = s + ((e - s) >> 1);
      var y = yScale(data[middle]);
      // ////console.log([s, e, middle, y, yMin].join(','));
      if (y > yMin) {
        e = middle;
      } else {
        s = middle;
      }
      if (t > data.length) {
        break;
      }
    }
    return s;
  }
  if(!fullRedraw){
    var start = findMin(data, yMin);
    var end = findMin(data, yMax);
    // ////console.log([start, end].join('-----'));
    start = Math.max(start-10, 0);
    end = Math.min(end+10, data.length);//LIU end = Math.min(end+10, data.length-1);
    result = data.slice(start, end);
  }else{
    return data;
  }



  var et = new Date().getTime();
  //////console.log('count===' + count + "cost" + (et - st));

  return result;
};

},{}],7:[function(require,module,exports){
"use strict";
var formater = d3.time.format("%Y-%m-%d %H");
var taskFunctions = require('./taskFunctions');
module.exports = function(d3, app, el, links) {

  var init = function(links) {
    d3.selectAll('.link').remove();
    d3.selectAll('.link-arrow').remove();
    var xScale = app.xScale;
    var yScale = app.yScale;

    links.forEach(function(link, index) {
      var fromTask = app.config.taskMaps[link.from_id];
      var toTask = app.config.taskMaps[link.to_id];
      if (!fromTask || !toTask) {
        return;
      }
      var type = link.type;
      fromTask = taskFunctions(d3, app, fromTask);
      toTask = taskFunctions(d3, app, toTask);
      // console.log(toTask);
      // ss 1 sf 2 fs 3 ff 4
      switch (type) {
        case 1: //ss
          {
            var s = link.source = {
              x: xScale(fromTask.startDate),
              y: yScale(fromTask.uuid),
              uuid: fromTask.uuid
            };
            var t = link.target = {
              x: xScale(toTask.startDate),
              y: yScale(toTask.uuid),
              uuid: toTask.uuid
            };
            app.pathsWrapper
            .append('path')
            .attr('title', 'start to start')
            .attr('class', function() {
              return 'path link' + ' source-' + s.uuid + ' target-' + t.uuid;
            })
            .attr('stroke-linejoin', 'round')
            .attr('sourceId', function() {
              return s.uuid;
            })
            .attr('targetId', function() {
              return t.uuid;
            })
            .attr("d", function() {
              var arr = [];
              if (s.y < t.y) {
                var start = 'M' + s.x + ',' + (s.y + 13); //首点,+13刚好是任务的正中
                arr.push(start);
                if (s.x <= t.x) {
                  //先往回走5像素
                  var temp = (s.x - 5) + ',' + (s.y + 13);
                  arr.push(temp);
                  //从这个位置再往下走到终止点的y轴
                  temp = (s.x - 5) + ',' + (t.y - 5);
                  arr.push(temp);
                } else {
                  //先往回走5像素
                  var temp = (t.x) + ',' + (s.y + 13);
                  arr.push(temp);
                  // //从这个位置再往下走到终止点的y轴
                  // temp = (s.x - 5) + ',' + (t.y - 5);
                  // arr.push(temp);
                }
                //保持y不弯，走到终止点的x轴
                temp = (t.x) + ',' + (t.y - 5);
                arr.push(temp);
                var end = (t.x) + ',' + (t.y + 7); //尾点
                arr.push(end);
              } else {
                var start = 'M' + s.x + ',' + (s.y + 13); //首点,+13刚好是任务的正中
                arr.push(start);
                if (s.x >= t.x) {
                  //先往回走5像素
                  var temp = (t.x) + ',' + (s.y + 13);
                  arr.push(temp);
                } else {
                  //先往回走5像素
                  var temp = (s.x - 5) + ',' + (s.y + 13);
                  arr.push(temp);
                  //从这个位置再往上走到终止点的y轴
                  temp = (s.x - 5) + ',' + (t.y + 32);
                  arr.push(temp);
                }
                //保持y不弯，走到终止点的x轴
                temp = (t.x) + ',' + (t.y + 32);
                arr.push(temp);
                var end = (t.x) + ',' + (t.y + 25); //尾点
                arr.push(end);
              }
              return arr.join(' ');
            });

            app.pathsWrapper
            .append("path")
            .attr("class", "link-arrow")
            .attr("d", function() {
              var result = "M0,0 L3.5,-7 -3.5,-7 0,0";
              if (s.y < t.y) {

              } else {
                result = "M0,0 L3.5,7 -3.5,7 0,0";
              }
              return result;
            })
            .attr("transform", function(d) {
              var result = "translate(" + (t.x) + ", " + (t.y + 7) + ")";
              if (s.y < t.y) {

              } else {
                result = "translate(" + (t.x) + ", " + (t.y + 22) + ")";
              }
              return result;
            });
            break;
          }
        case 2: //sf
          {
            // var offset = fromTask.startDate.getTime() - toTask.startDate.getTime();
            // toTask.move(offset / 1000);
            var s = link.source = {
              x: xScale(fromTask.startDate),
              y: yScale(fromTask.uuid),
              uuid: fromTask.uuid
            };
            var t = link.target = {
              x: toTask.marker ? xScale(toTask.endDate) + 22 : xScale(toTask.endDate),
              y: yScale(toTask.uuid),
              uuid: toTask.uuid
            };

            app.pathsWrapper
            .append('path')
            .attr('title', 'start to finish')
            .attr('class', function() {
              return 'path link' + ' source-' + s.uuid + ' target-' + t.uuid;
            })
            .attr('stroke-linejoin', 'round')
            .attr('sourceId', function() {
              return s.uuid;
            })
            .attr('targetId', function() {
              return t.uuid;
            })
            .attr("d", function() {
              var arr = [];
              if (s.y < t.y) {
                var start = 'M' + s.x + ',' + (s.y + 13); //首点,+13刚好是任务的正中
                arr.push(start);
                if (s.x <= t.x) {
                  //先往回走5像素
                  var temp = (s.x - 5) + ',' + (s.y + 13);
                  arr.push(temp);
                  //从这个位置再往下走到终止点的y轴
                  temp = (s.x - 5) + ',' + (t.y - 5);
                  arr.push(temp);
                } else {
                  //先往回走5像素
                  var temp = (t.x) + ',' + (s.y + 13);
                  arr.push(temp);
                  // //从这个位置再往下走到终止点的y轴
                  // temp = (s.x - 5) + ',' + (t.y - 5);
                  // arr.push(temp);
                }
                //保持y不弯，走到终止点的x轴
                temp = (t.x) + ',' + (t.y - 5);
                arr.push(temp);
                var end = (t.x) + ',' + (t.y + 7); //尾点
                arr.push(end);
              } else {
                var start = 'M' + s.x + ',' + (s.y + 13); //首点,+13刚好是任务的正中
                arr.push(start);
                if (s.x >= t.x) {
                  //先往回走5像素
                  var temp = (t.x) + ',' + (s.y + 13);
                  arr.push(temp);
                } else {
                  //先往回走5像素
                  var temp = (s.x - 5) + ',' + (s.y + 13);
                  arr.push(temp);
                  //从这个位置再往上走到终止点的y轴
                  temp = (s.x - 5) + ',' + (t.y + 32);
                  arr.push(temp);
                }
                //保持y不弯，走到终止点的x轴
                temp = (t.x) + ',' + (t.y + 32);
                arr.push(temp);
                var end = (t.x) + ',' + (t.y + 25); //尾点
                arr.push(end);
              }
              return arr.join(' ');
            });

            app.pathsWrapper
            .append("path")
            .attr("class", "link-arrow")
            .attr("d", function() {
              var result = "M0,0 L3.5,-7 -3.5,-7 0,0";
              if (s.y < t.y) {

              } else {
                result = "M0,0 L3.5,7 -3.5,7 0,0";
              }
              return result;
            })
            .attr("transform", function(d) {
              var result = "translate(" + (t.x) + ", " + (t.y + 7) + ")";
              if (s.y < t.y) {

              } else {
                result = "translate(" + (t.x) + ", " + (t.y + 22) + ")";
              }
              return result;
            });
            break;
          }
        case 3: //fs
          {
            var s = link.source = {
              x: fromTask.marker ? xScale(fromTask.endDate) + 22 : xScale(fromTask.endDate),
              y: yScale(fromTask.uuid),
              uuid: fromTask.uuid
            };
            var t = link.target = {
              x: xScale(toTask.startDate),
              y: yScale(toTask.uuid),
              uuid: toTask.uuid
            };

            app.pathsWrapper
            .append('path')
            .attr('title', 'finish to start')
            .attr('class', function() {
              return 'path link' + ' source-' + s.uuid + ' target-' + t.uuid;
            })
            .attr('stroke-linejoin', 'round')
            .attr('sourceId', function() {
              return s.uuid;
            })
            .attr('targetId', function() {
              return t.uuid;
            })
            .attr("d", function() {
              var arr = [];
              if (s.y < t.y) {
                var start = 'M' + s.x + ',' + (s.y + 13); //首点,+13刚好是任务的正中
                arr.push(start);
                if (s.x <= t.x) {
                  //先往回走5像素
                  var temp = (t.x) + ',' + (s.y + 13);
                  arr.push(temp);
                } else {
                  //先往回走5像素
                  var temp = (s.x + 5) + ',' + (s.y + 13);
                  arr.push(temp);
                  // //从这个位置再往下走到终止点的y轴
                  temp = (s.x + 5) + ',' + (t.y - 5);
                  arr.push(temp);
                }
                //保持y不弯，走到终止点的x轴
                temp = (t.x) + ',' + (t.y - 5);
                arr.push(temp);
                var end = (t.x) + ',' + (t.y + 7); //尾点
                arr.push(end);
              } else {
                var start = 'M' + s.x + ',' + (s.y + 13); //首点,+13刚好是任务的正中
                arr.push(start);
                if (s.x >= t.x) {
                  //先往回走5像素
                  var temp = (t.x) + ',' + (s.y + 13);
                  arr.push(temp);
                } else {
                  //先往回走5像素
                  var temp = (s.x - 5) + ',' + (s.y + 13);
                  arr.push(temp);
                  //从这个位置再往上走到终止点的y轴
                  temp = (s.x - 5) + ',' + (t.y + 32);
                  arr.push(temp);
                }
                //保持y不弯，走到终止点的x轴
                temp = (t.x) + ',' + (t.y + 32);
                arr.push(temp);
                var end = (t.x) + ',' + (t.y + 25); //尾点
                arr.push(end);
              }
              return arr.join(' ');
            });

            app.pathsWrapper
            .append("path")
            .attr("class", "link-arrow")
            .attr("d", function() {
              var result = "M0,0 L3.5,-7 -3.5,-7 0,0";
              if (s.y < t.y) {

              } else {
                result = "M0,0 L3.5,7 -3.5,7 0,0";
              }
              return result;
            })
            .attr("transform", function(d) {
              var result = "translate(" + (t.x) + ", " + (t.y + 7) + ")";
              if (s.y < t.y) {

              } else {
                result = "translate(" + (t.x) + ", " + (t.y + 22) + ")";
              }
              return result;
            });
            break;
          }
        case 4: //ff
          {
            var s = link.source = {
              x: fromTask.marker ? xScale(fromTask.endDate) + 22 : xScale(fromTask.endDate),
              // x: xScale(fromTask.endDate),
              y: yScale(fromTask.uuid),
              uuid: fromTask.uuid
            };
            var t = link.target = {
              x: toTask.marker ? xScale(toTask.endDate) + 22 : xScale(toTask.endDate),
              // x: xScale(toTask.endDate),
              y: yScale(toTask.uuid),
              uuid: toTask.uuid
            };

            app.pathsWrapper
            .append('path')
            .attr('title', 'finish to finish')
            .attr('class', function() {
              return 'path link' + ' source-' + s.uuid + ' target-' + t.uuid;
            })
            .attr('stroke-linejoin', 'round')
            .attr('sourceId', function() {
              return s.uuid;
            })
            .attr('targetId', function() {
              return t.uuid;
            })
            .attr("d", function() {
              var arr = [];
              if (s.y < t.y) {
                var start = 'M' + s.x + ',' + (s.y + 13); //首点,+13刚好是任务的正中
                arr.push(start);
                if (s.x <= t.x) {
                  //先往回走5像素
                  var temp = (t.x) + ',' + (s.y + 13);
                  arr.push(temp);
                  //从这个位置再往下走到终止点的y轴
                  // temp = (s.x + 5) + ',' + (t.y - 5);
                  // arr.push(temp);
                } else {
                  //先往回走5像素
                  var temp = (s.x + 5) + ',' + (s.y + 13);
                  arr.push(temp);
                  // //从这个位置再往下走到终止点的y轴
                  temp = (s.x + 5) + ',' + (t.y - 5);
                  arr.push(temp);
                }
                //保持y不弯，走到终止点的x轴
                temp = (t.x) + ',' + (t.y - 5);
                arr.push(temp);
                var end = (t.x) + ',' + (t.y + 7); //尾点
                arr.push(end);
              } else {
                var start = 'M' + s.x + ',' + (s.y + 13); //首点,+13刚好是任务的正中
                arr.push(start);
                if (s.x >= t.x) {
                  //先往回走5像素
                  var temp = (s.x + 5) + ',' + (s.y + 13);
                  arr.push(temp);
                  temp = (s.x + 5) + ',' + (s.y + 3);
                  arr.push(temp);
                } else {
                  //先往回走5像素
                  var temp = (t.x) + ',' + (s.y + 13);
                  arr.push(temp);
                  //从这个位置再往上走到终止点的y轴
                  // temp = (t.x - 5) + ',' + (t.y + 32);
                  // arr.push(temp);
                }
                //保持y不弯，走到终止点的x轴
                temp = (t.x) + ',' + (s.y + 3);
                arr.push(temp);
                var end = (t.x) + ',' + (t.y + 25); //尾点
                arr.push(end);
              }
              return arr.join(' ');
            });

            app.pathsWrapper
            .append("path")
            .attr("class", "link-arrow")
            .attr("d", function() {
              var result = "M0,0 L3.5,-7 -3.5,-7 0,0";
              if (s.y < t.y) {

              } else {
                result = "M0,0 L3.5,7 -3.5,7 0,0";
              }
              return result;
            })
            .attr("transform", function(d) {
              var result = "translate(" + (t.x) + ", " + (t.y + 7) + ")";
              if (s.y < t.y) {

              } else {
                result = "translate(" + (t.x) + ", " + (t.y + 22) + ")";
              }
              return result;
            });
            break;
          }
          me.config.taskMaps[fromTask.uuid] = fromTask;
          me.config.taskMaps[toTask.uuid] = toTask;
      }
    });
  }

  //画任务
  return init(links);
};
},{"./taskFunctions":12}],8:[function(require,module,exports){
"use strict";

module.exports = function(d3) {
  var log = {

  };
  log.build = function(id) {
    log = {
      id: id,
      st: new Date().getTime(),
      arr: [],
    };
    return this;
  }
  log.info = function(str) {
    var t = new Date().getTime();
    var cost = t-log.st;
    log.arr.push(str + '=' + cost + 'ms ');
  }
  log.out = function(){
    ////console.log(log.id+'===='+log.arr.join(', '));
  }
  return log;
}
},{}],9:[function(require,module,exports){
"use strict";
var app = require('./app');

if (typeof define === "function" && define.amd) {
  define('d3.chart.app', ["d3"], function(d3) {
    d3.chart = d3.chart || {};
    d3.chart.app = app(d3);
  });
} else if (window) {
  window.d3.chart = window.d3.chart || {};
  window.d3.chart.app = app(window.d3);
} else {
  module.exports = app;
}

},{"./app":3}],10:[function(require,module,exports){
"use strict";
// var PubSub = require('pubsub-js');
var formater = d3.time.format("%Y-%m-%d %H");
module.exports = function (d3, app, graph, task) {
    var menu = {};
    var config = app.config;
    var xScale = app.xScale;
    var yScale = app.yScale;
    var menuBody, menuBg, leftBtn, rightBtn, percentBtn;
    var yOffset = 0;
    var xOffset = 0;
    var btnWidth = 10;
    var btnHeight = 30;
    var btnColor = false ? 'red' : 'transparent';
    var cycleBtnColor = "red";
    var steps = 0;
    var draggingNode, selectedNode;

    var percentListener = d3.behavior.zoom().center(null);
    var startTimeListener = d3.behavior.zoom().center(null);
    var endTimeListener = d3.behavior.zoom().center(null);

    var getTaskBox = function (task) {
        var line = '.task-line-' + task.uuid;
        return d3.select(line).select('.item');
    }

    var taskbox = getTaskBox(task);

    var init = function () {
        // task = app.config.taskMaps[task];
        var line = '.task-line-' + task.uuid;
        var tasksWrapper = d3.select(line);
        d3.select('.menuBody').remove();
        if (config.readonly) {
            return false;
        }
        menuBody = tasksWrapper.append('g')
            .attr('class', 'menuBody')
            .attr('id', 'menuBody').attr('transform', function () {
                return 'translate(' + xScale(task.startDate) + ', ' + 0 + ')';
            });
    }

    // //处理进度，右侧，目录
    // var refresh = function() {
    //   // return false;
    //   changeEndTime
    //   d3.select('#menuBody').attr('transform', function() {
    //     return 'translate(' + xScale(task.startDate) + ', 0)'
    //   })

    //   var x = xScale(task.endDate) - xScale(task.startDate) + xOffset;
    //   rightBtn.attr('transform', function() {
    //     var y = 0 + yOffset;
    //     return "translate(" + x + ", " + y + ")";
    //   });
    //   percentBtn.attr('transform', function() {
    //     var x1 = 0;
    //     var x2 = xScale(task.endDate) - xScale(task.startDate);
    //     x1 = x1 + (x2 - x1) * task.percent;
    //     var y = 0;
    //     return "translate(" + x1 + ", " + y + ")";
    //   });
    //   d3.selectAll('.color').attr('transform', 'translate(' + (x + 20) + ', ' + task._yOffset + ')');
    // }

    var mvPar = {}; //针对移动时的全局变量
    startTimeListener
        .on('zoomstart', function () {
            if (config.readonly) { //父任务不允许拖动Liu
                return;
            }
            if (d3.event.sourceEvent && d3.event.sourceEvent.toString() === '[object WheelEvent]') {
                return;
            }
            mvPar.changed = false;
            mvPar.startDate = task.startDate.getTime(); //记录任务的开始时间，看看任务是否真的被拖动了
            //==================================================================================
            task._startDate = task.startDate;
            task._endDate = task.endDate;
            task._mouseStartX = d3.event.sourceEvent.clientX; //表示鼠标落点距离
            task._xWidth = xScale(task.endDate) - xScale(task.startDate);
            // task._xMin = xScale(d3.time.day.offset(task.startDate, 1)) + xOffset; //可到达的最小位置
            task._xStart = 0 - xOffset - btnWidth; //xScale(task.startDate) - xOffset - btnWidth;
            task._days = d3.time.days(task._startDate, task._endDate).length;
            var now = new Date();
            task._dayWidth = xScale(d3.time.day.offset(now, 1)) - xScale(now);
            //获取y距离
            var transform = percentBtn.attr('transform');
            task._yOffset = app.getTransformY(transform) + yOffset;
            // tooltip('body', task);

            taskbox.text = taskbox.append('text')
                .text(function () {
                    return formater(task.startDate) + "/" + formater(task.endDate);
                })
                .attr("text-anchor", "start")
                .attr('transform', function () {
                    var x = 3; //(xScale(task.endDate) - xScale(task.startDate)) + 10;
                    return 'translate(' + x + ', -6)'
                });
        })
        .on("zoom", function () {
            if (config.readonly) { //父任务不允许拖动Liu
                return;
            }
            if (d3.event.sourceEvent && d3.event.sourceEvent.toString() === '[object WheelEvent]') {
                return;
            }
            if (d3.event.sourceEvent && d3.event.sourceEvent.toString() === '[object MouseEvent]') {
                var mouseX = d3.event.sourceEvent.clientX; //鼠标当前位置
                var offset = mouseX - task._mouseStartX; //移动了多少
                steps = Math.round(offset / task._dayWidth);
                steps = Math.min((task._days - 1), steps);
                var xCurr = task._xStart + steps * task._dayWidth;
                task.startDate = d3.time.day.offset(task._startDate, steps);
                app.changeStartTime(task);
                // refresh();
                // tooltip('body', task);
                taskbox.text
                    .text(function () {
                        return formater(task.startDate) + "/" + formater(task.endDate);
                    })
                    .attr("text-anchor", "start")
                    .attr('transform', function () {
                        var x = 3; //(xScale(task.endDate) - xScale(task.startDate)) + 10;
                        return 'translate(' + x + ', -6)'
                    });
                //判断是否真的移动了，还是仅仅点击了
                if (mvPar.startDate != task.startDate.getTime()) {
                    // console.log(mvPar.startDate+"\t"+task.startDate.getTime());
                    mvPar.changed = true;
                    app.config.taskMaps[task.uuid] = task;
                }
            }
        })
        .on("zoomend", function () {
            if (config.readonly) { //父任务不允许拖动Liu
                return;
            }
            if (d3.event.sourceEvent && d3.event.sourceEvent.toString() === '[object WheelEvent]') {
                return;
            }
            // clearMask();
            drawMenu();
            app.drawTask(task);
            app.redraw(true);
            // PubSub.publish('tooltip.remove', {});
            if (typeof config.changeStartTimeHandler === 'function' && mvPar.changed) {
                config.changeStartTimeHandler(task);
            }
        });

    //百分比
    percentListener
        .on('zoomstart', function () {
            if (config.readonly) { //父任务不允许拖动Liu
                return;
            }
            if (d3.event.sourceEvent && d3.event.sourceEvent.toString() === '[object WheelEvent]') {
                return;
            }
            mvPar.changed = false;
            mvPar.percent = task.percent; //记录任务的开始时间，看看任务是否真的被拖动了
            //==================================================================================
            task._percent = task.percent || 0;
            task._mouseStartX = d3.event.sourceEvent.clientX; //表示鼠标落点距离
            task._xWidth = xScale(task.endDate) - xScale(task.startDate);
            task._xMin = 0; //xScale(task.startDate); //可到达的最小位置
            task._xMax = task._xMin + task._xWidth; //xScale(task.endDate); //可到达的最大位置
            task._xStart = task._xMin + task._xWidth * task._percent;
            //获取y距离
            var transform = percentBtn.attr('transform');
            task._yOffset = app.getTransformY(transform);
            // tooltip('body', task);

            taskbox.text = taskbox.append('text')
                .text(function () {
                    return task.percent * 100 + '%';
                })
                .attr("text-anchor", "start")
                .attr('transform', function () {
                    // var x = (xScale(task.endDate) - xScale(task.startDate));
                    return 'translate(' + task._xStart + ', -6)'
                });
        })
        .on("zoom", function () {
            if (config.readonly) { //父任务不允许拖动Liu
                return;
            }
            if (d3.event.sourceEvent && d3.event.sourceEvent.toString() ===
                '[object MouseEvent]') {
                var mouseX = d3.event.sourceEvent.clientX; //鼠标当前位置
                var offset = mouseX - task._mouseStartX; //移动了多少
                var xCurr = task._xStart + offset; //当前位置
                xCurr = Math.min(xCurr, task._xMax); //范围限制，最大不过
                xCurr = Math.max(xCurr, task._xMin);
                var _percent = (xCurr - task._xMin) / task._xWidth; //当前百分比，并整数化
                task.percent = Math.round(_percent * 10) / 10
                xCurr = task._xMin + task._xWidth * task.percent;
                window.task = task;
                percentBtn.attr('transform', "translate(" + xCurr + ", " + task._yOffset + ") rotate(0)");
                // PubSub.publish('task.change_percent', {
                //   name: 'my new car'
                // });
                app.changePercent(task);
                // tooltip('body', task);

                taskbox.text.text(function () {
                    return task.percent * 100 + '%';
                })
                    .attr("text-anchor", "start")
                    .attr('transform', function () {
                        // var x = (xScale(task.endDate) - xScale(task.startDate));
                        return 'translate(' + xCurr + ', -6)'
                    });
                //判断是否真的移动了，还是仅仅点击了
                if (mvPar.percent != task.percent) {
                    // console.log(mvPar.startDate+"\t"+task.startDate.getTime());
                    mvPar.changed = true;
                    app.config.taskMaps[task.uuid] = task;
                }
            }
        })
        .on("zoomend", function () {
            if (config.readonly) { //父任务不允许拖动Liu
                return;
            }
            // PubSub.publish('tooltip.remove', {});
            app.redraw(true);
            if (typeof config.changePercentHandler === 'function' && mvPar.changed) {
                config.changePercentHandler(task);
            }
        });

    //结束时间调整开始
    endTimeListener.on('zoomstart', function () {
        if (config.readonly) { //父任务不允许拖动Liu
            return;
        }
        if (d3.event.sourceEvent && d3.event.sourceEvent.toString() === '[object WheelEvent]') {
            return;
        }
        mvPar.changed = false;
        mvPar.endDate = task.endDate.getTime(); //记录任务的开始时间，看看任务是否真的被拖动了
        //==================================================================================
        task._startDate = task.startDate;
        task._endDate = task.endDate;
        task._mouseStartX = d3.event.sourceEvent.clientX; //表示鼠标落点距离
        task._xWidth = xScale(task.endDate) - xScale(task.startDate);
        task._xMin = xScale(d3.time.day.offset(task.startDate, 1)) - xScale(task.startDate) + xOffset; //可到达的最小位置
        task._xStart = xScale(task.endDate) - xScale(task.startDate) + xOffset; //xScale(task.endDate) + xOffset;
        task._days = d3.time.days(task._startDate, task._endDate).length;
        var now = new Date();
        task._dayWidth = xScale(d3.time.day.offset(now, 1)) - xScale(now);
        //获取y距离
        var transform = percentBtn.attr('transform');
        task._yOffset = app.getTransformY(transform) + yOffset;
        // tooltip('body', task);

        taskbox.text = taskbox.append('text')
            .text(function () {
                return formater(task.startDate) + "/" + formater(task.endDate);
            })
            .attr("text-anchor", "end")
            .attr('transform', function () {
                var x = (xScale(task.endDate) - xScale(task.startDate));
                return 'translate(' + x + ', -6)'
            });
    }).on("zoom",
        function () {
            if (config.readonly) { //父任务不允许拖动Liu
                return;
            }
            if (d3.event.sourceEvent && d3.event.sourceEvent.toString() === '[object MouseEvent]') {
                var mouseX = d3.event.sourceEvent.clientX; //鼠标当前位置
                var offset = mouseX - task._mouseStartX; //移动了多少
                steps = Math.round(offset / task._dayWidth);
                steps = Math.max((0 - task._days + 1), steps);
                var xCurr = task._xStart + steps * task._dayWidth;
                // xCurr = Math.max(xCurr, task._xMin);
                rightBtn.attr('transform', 'translate(' + xCurr + ', ' + task._yOffset + ')');
                d3.selectAll('.color').attr('transform', 'translate(' + (xCurr + 20) + ', ' + task._yOffset + ')');
                task.endDate = d3.time.day.offset(task._endDate, steps);
                // var w = xScale(task.endDate) - xScale(task.startDate);

                // changePercentPos();
                app.changeEndTime(task);
                // //console.log(config);
                app.drawLinks(config.data.links);
                // tooltip('body', task);
                taskbox.text
                    .text(function () {
                        return formater(task.startDate) + "/" + formater(task.endDate);
                    })
                    .attr("text-anchor", "end")
                    .attr('transform', function () {
                        var x = (xScale(task.endDate) - xScale(task.startDate));
                        return 'translate(' + x + ', -6)'
                    });
                //判断是否真的移动了，还是仅仅点击了
                if (mvPar.endDate != task.endDate.getTime()) {
                    mvPar.changed = true;
                    app.config.taskMaps[task.uuid] = task;
                }
            }
            return false;
        })
        .on("zoomend", function () {
            if (config.readonly) { //父任务不允许拖动Liu
                return;
            }
            // drawMenu();
            // app.drawTask(task);
            // app.afterProcess(task);
            app.redraw(true);
            if (typeof config.changeEndTimeHandler === 'function' && mvPar.changed) {
                config.changeEndTimeHandler(task);
            }
        });

    var buildLeft = function () {
        leftBtn = menuBody
            .append('rect')
            .attr('width', 10)
            .attr('height', btnHeight)
            .attr('class', 'btn leftBtn')
            .attr('fill', btnColor)
            .attr('transform', function () {
                var x = 0 - btnWidth - xOffset; //btn本身的宽度和偏移量
                var y = 0 + yOffset;
                return "translate(" + x + ", " + y + ")";
            })
            .call(startTimeListener);
        return leftBtn;
    }

    var pathInfo = {};
    var line;


    // var buildLeftCycle = function() {
    //   leftBtn = menuBody
    //     .append('circle')
    //     .attr('r', 4)
    //     .attr('class', 'dot')
    //     .attr('fill', cycleBtnColor)
    //     .attr('transform', function() {
    //       var x = 0 - btnWidth - xOffset - 3; //btn本身的宽度和偏移量
    //       var y = 0 + yOffset + 15;
    //       return "translate(" + x + ", " + y + ")";
    //     })
    //     .call(drag);
    //   return leftBtn;
    // }

    // var buildRightCycle = function() {
    //   leftBtn = menuBody
    //     .append('circle')
    //     .attr('r', 4)
    //     .attr('class', 'dot')
    //     .attr('fill', cycleBtnColor)
    //     .attr('transform', function() {
    //       var x = xScale(task.endDate) - xScale(task.startDate) + xOffset + 12;
    //       var y = 0 + yOffset + 15;
    //       return "translate(" + x + ", " + y + ")";
    //     })
    //     .call(drag);
    //   return leftBtn;
    // }


    var buildRight = function () {
        rightBtn = menuBody
            .append('rect')
            .attr('width', 10)
            .attr('height', btnHeight)
            .attr('class', 'btn right rightBtn')
            .attr('fill', btnColor)
            .attr('transform', function () {
                var x = xScale(task.endDate) - xScale(task.startDate) + xOffset;
                var y = 0 + yOffset;
                return "translate(" + x + ", " + y + ")";
            })
            .call(endTimeListener);
        return rightBtn;
    }

    var clickColor = function () {
        event.stopPropagation();
        var priority = d3.select(this).attr('priority');
        task.priority = priority;
        config.changePriority(task);
        hideColorMenu();
    }

    var hideColorMenu = function () {
        event.stopPropagation();
        setTimeout(function () {
            d3.selectAll('.color').classed('open', false)
            d3.selectAll('.color-item').attr('class', 'color-item close')
        }, 100);
        setTimeout(function () {
            d3.selectAll('.color-item').remove();
        }, 300); //600来源于css
    }

    var showColorMenu = function () {
        // var color = d3.scale.category10();
        d3.selectAll('.color-item').remove();
        var arr = [];
        var box = d3.select('.color')
            .append('g')
            .classed('color-box', true);
        for (var i = 0; i < 4; i++) {
            // var c = color(i);
            // arr.push(c);
            var item = box.append('rect')
                .classed('color-item', true)
                .attr('priority', i)
                // .attr('fill', c)
                .attr('rx', 6)
                .attr('ry', 6)
                .attr('width', 12)
                .attr('height', 12)
                // .attr('transform', function() {
                //   var x = xOffset;// + 20 * (i+2);
                //   return "translate(" + x + ", " + 0 + ")";
                // })
                // .style("display", "none")
                .on('click', clickColor);
            // ////console.log('background:lighten("'+c+'", 10%);');
        }
        setTimeout(function () {
            d3.selectAll('.color').classed('open', true)
            d3.selectAll('.color-item').attr('class', 'color-item open')
        }, 100)
        // return false;
    }

    var buildColorBtn = function () {
        var color = menuBody
            .append('g')
            .attr('transform', function () {
                var x = xScale(task.endDate) - xScale(task.startDate) + xOffset + 20;
                var y = 0 + yOffset;
                return "translate(" + x + ", " + y + ")";
            })
            .attr('class', 'btn right color')
        color.append('rect')
            .attr('fill', '#6DF3D2')
            .attr('stroke', '#33B192')
            .attr('alt', '优先级')
            .attr('rx', 6)
            .attr('ry', 6)
            .attr('width', 12)
            .attr('height', 12);
        color.on('click', function () {
            event.stopPropagation();
            var box = d3.selectAll('.color');
            if (box.attr('class').indexOf('open') != -1) {
                hideColorMenu();
            } else {
                showColorMenu();
            }
        });
        return color;
    }

    var buildPercent = function () {
        percentBtn = menuBody
            .append('polyline')
            .attr('stroke', btnColor)
            .attr('class', "btn percentBtn")
            .attr('transform', 'translate(0, 24)')
            .attr('points', '0,' + (yOffset - 5) + ' 0,' + (yOffset + btnHeight + 5))
            .attr('style', 'fill:' + btnColor + ';stroke-width:3')
            .attr('transform', function () {
                var x1 = 0;
                var x2 = xScale(task.endDate) - xScale(task.startDate);
                x1 = x1 + Math.max((x2 - x1) * (task.percent || 0), 0);
                var y = 0;
                return "translate(" + x1 + ", " + y + ")";
            })
            .call(percentListener);
        // var percentLine = percentBtn
        //   .append('polyline')
        //   .attr('stroke', "#a0a0a0")
        //   .attr('class', "percentBtn")
        //   .attr('transform', 'translate(0, 24)')
        //   // .attr('points', '0,0 6,7 6,13, -6,13 -6,7 0,0')
        //   .attr('style', 'fill:white;stroke-width:1');
        return percentBtn;
    }

    var changePercentPos = function () {
        percentBtn.attr('transform', function () {
            var x1 = xScale(task.startDate);
            var x2 = xScale(task.endDate);
            var p1 = (x2 - x1) * task.percent; //x1 + (x2 - x1) * task.percent;
            // ////console.log([x1, p1, x2].join(','));
            var y = 0; //yScale(task.uuid);
            return "translate(" + p1 + ", " + y + ")";
        });
    }

    var drawMenu = function drawMenu() {
        if (task.marker || config.readonly || config.disable(task)) {
            return;
        }
        init();
        buildLeft();
        buildRight();
        // buildLeftCycle();
        // buildRightCycle();
        // buildColorBtn();
        buildPercent();
        app.drawPointer(task);
        return menu;
    };

    return drawMenu();
};
},{}],11:[function(require,module,exports){
"use strict";
var PubSub = require('pubsub-js');
var menuFactory = require('./menuFactory');
var formater = d3.time.format("%Y-%m-%d %H");
module.exports = function (d3, app, xScale, yScale, graph, taskId) {
    var config = app.config;
    var tasksWarpper = d3.select('#tasks-wrapper');
    var taskbox, pre, background, mask, timeInfo;
    // var moveListener = d3.behavior.zoom().center(null);
    var taskHeight = 14;
    var taskOffTop = 7;
    var packageHeight = 9; //LIU 原来高度是4  产品让调高了
    var packageOffTop = 7;
    var stoneHeight = 4;
    var stoneOffTop = 7;
    var task = app.config.taskMaps[taskId];

    var init = function (task) {
        // //console.log(task);
        var line = '.task-line-' + task.uuid;
        d3.selectAll(line).remove();
        //判断task是否已经过期了
        if (task.endDate) {
            var end = task.endDate.getTime();
            var now = new Date().getTime();
            if (end < now) {
                task.dueOut = true;
            }
        }
        if (task.marker) {
            showMarker(task);
        } else {
            drawTask(task);
        }
        // console.log('有一个选中的任务：' + task.uuid+'\t'+config.selectTaskId);
        if (task.uuid == config.selectTaskId) {
            app.selectTask(task.uuid);
            menuFactory(d3, app, d3.select('.tasks-wrapper'), task);
        }
        if (app.config.showBaseline) {
            showOldTask(task);
        }
    }


    var getTaskBox = function (task) {
        var line = '.task-line-' + task.uuid;
        return d3.select(line).select('.item');
    }

    //画移动时的mask效果，一个矩形+两条边
    var drawMoveMask = function () {
        // //////console.log('xxx');
        var box = d3.select('#app-wrapper');
        box.select('#move-mask').remove();
        var w = xScale(task.endDate) - xScale(task.startDate);
        var x = xScale(task.startDate);
        var yScroll = 0;//0 - $('#gantt-scroller').offset().top + 42;
        var height = $('#gantt-wrapper').height();

        mask = box.append('g')
            .attr('id', 'move-mask')
            .attr('class', 'lline')
            .attr('transform', 'translate(' + x + ', ' + yScroll + ')');

        $('#app-wrapper').prepend($('.lline'));
        mask.append('rect')
            .style('fill', "#0cc")
            .attr('opacity', '0.1')
            .attr('height', height)
            .attr('width', w)

        mask.append('line')
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('x2', 0)
            .attr('y2', height);

        mask.append('line')
            .attr('x1', w)
            .attr('y1', 0)
            .attr('x2', w)
            .attr('y2', height);
        return mask;
    }

    var clearMoveMask = function () {
        var box = d3.select('#app-wrapper');
        box.select('.lline').remove();
        mask = null;
    }

    // var getTransformX = function(str) {
    //   var result = 0;
    //   if (str) {
    //     var start = str.indexOf('(');
    //     var end = str.indexOf(',');
    //     var _str = str.substring(start + 1, end)
    //     result = parseFloat(_str);
    //   }
    //   return result;
    // }

    // var getTransformY = function(str) {
    //   var result = 0;
    //   if (str) {
    //     var start = str.indexOf(',');
    //     var end = str.indexOf(')');
    //     var _str = str.substring(start + 1, end);
    //     result = parseFloat(_str);
    //   }
    //   return result;
    // }


    var clearTimeInfo = function (container, model) {
        d3.selectAll('.time-info').remove();
    }


    var showTimeInfo = function (container, model) {
        if (model === 'start') {
            timeInfo = container.append('text')
                .text(function () {
                    return formater(task.startDate) + "/" + formater(task.endDate);
                })
                .attr("text-anchor", "start")

                .attr('transform', function () {
                    return 'translate(3, -6)'
                })
                .classed('time-info', true);
            return timeInfo;
        } else if (model === 'end') {

        } else {

        }
    }


    var mvPar = {}; //针对移动时的全局变量
    var startMove = function () {
        app.selectTask(task.uuid);
        if (typeof app.config.selectHandler === 'function') {
            app.config.selectHandler(task);
        }
        //console.log('event:startMove');
        if (config.readonly || config.disable(task)) { //父任务不允许拖动Liu
            return;
        }
        if (d3.event.sourceEvent && d3.event.sourceEvent.toString() === '[object MouseEvent]') {
            app.selectTask(task.uuid);
            redrawMenu();
            mask = null;
            task._startDate = task.startDate;
            task._endDate = task.endDate;
            var trans = taskbox.attr('transform');
            var now = new Date();
            task._dayWidth = xScale(d3.time.day.offset(now, 1)) - xScale(now);
            task._startX = app.getTransformX(trans);
            task._mouseStartX = d3.event.sourceEvent.clientX; //鼠标当前位置
            mvPar.moved = false;
            mvPar.startDate = task.startDate.getTime(); //记录任务的开始时间，看看任务是否真的被拖动了
            // $('#gantt-container').css("cursor", "move");
            // drawMoveMask();
            clearMoveMask();
            clearTimeInfo();
        }
    }

    var move = function () {
        //console.log('event:move');
        if (config.readonly || config.disable(task)) { //父任务不允许拖动Liu
            return;
        }

        if (d3.event.sourceEvent && d3.event.sourceEvent.toString() === '[object MouseEvent]') {
            if (d3.event.sourceEvent && d3.event.sourceEvent.toString() === '[object MouseEvent]') {
                var mouseX = d3.event.sourceEvent.clientX; //鼠标当前位置
                var offset = mouseX - task._mouseStartX; //移动了多少
                var steps = task._steps = Math.round(offset / task._dayWidth);
                var x = task._startX + steps * task._dayWidth;

                //任务移动
                taskbox.attr('transform', function () {
                    return 'translate(' + x + ', ' + taskOffTop + ')';
                }).attr('class', function () {
                    if (app.config.classFix) {
                        return app.config.classFix(task)
                    } else {
                        return "item"
                    }
                })

                //处理移动层
                if (!mask) {
                    mask = drawMoveMask();
                }
                var trans = mask.attr('transform');
                var y = app.getTransformY(trans);
                mask.attr('transform', function () {
                    return 'translate(' + x + ', ' + y + ')';
                });
                //处理移动层结束

                task.startDate = d3.time.day.offset(task._startDate, steps || 0);
                task.endDate = d3.time.day.offset(task._endDate, steps || 0);

                app.config.taskMaps[task.uuid] = task;

                //菜单一起运动
                d3.select('#menuBody').attr('transform', function () {
                    return 'translate(' + x + ', 0)';
                });

                //处理提示信息
                if (!timeInfo) {
                    timeInfo = showTimeInfo(taskbox, 'start');
                }

                timeInfo
                    .text(function () {
                        return formater(task.startDate) + "/" + formater(task.endDate);
                    })
                    .attr("text-anchor", "start")
                    .attr('transform', function () {
                        var x = 3; //(xScale(task.endDate) - xScale(task.startDate)) + 10;
                        return 'translate(' + x + ', -6)'
                    });
                app.drawLinks(config.data.links);
            }
            //判断是否真的移动了，还是仅仅点击了
            if (mvPar.startDate != task.startDate) {
                mvPar.moved = true;
            }
        }
        return false;
    }

    var endMove = function () {
        $('#gantt-container').css("cursor", "default");
        if (!mvPar.moved) {
            return;
        }
        console.log('event:endMove');
        //console.log('真的移动了');
        if (config.readonly) { //父任务不允许拖动Liu
            return;
        }
        app.config.taskMaps[task.uuid] = task;
        if (d3.event.sourceEvent && d3.event.sourceEvent.toString() === '[object MouseEvent]') {
            clearMoveMask();
            app.redraw(true);
            // app.afterProcess(task);
            // redrawMenu();
            if (typeof config.moveHandler === 'function') {
                config.moveHandler(task);
            } //拖动任务触发监听Liu
        }
    }

    var drag = d3.behavior.drag()
        .on("dragstart", startMove)
        .on("drag", move)
        .on("dragend", endMove)


    // 处理任务左右移动的问题
    var maskBox;
    // moveListener
    // //开始移动
    //   .on('zoomstart', function() {

    //   })
    //   //移动中
    //   .on("zoom", function() {

    //   })
    //   //停止移动
    //   .on("zoomend", function() {

    //   });

    var changePercent = function (task) {
        var taskbox = getTaskBox(task);
        taskbox.select('.pre').attr('width', function () {
            var width = (xScale(task.endDate) - xScale(task.startDate)) - 1;
            return width * task.percent || 0;
        });
    };

    var changeStartTime = function (task) {
        var taskbox = getTaskBox(task);
        task.dasharray = false;
        taskbox.attr("stroke-dasharray", function (d) {
            return '0'
        })
        taskbox.attr('transform', function () {
            return 'translate(' + xScale(task.startDate) + ', ' + taskOffTop + ')'
        })
        taskbox.select('.pre').attr('width', function () {
            return (xScale(task.endDate) - xScale(
                    task.startDate)) * task.percent || 0;
        });
        taskbox.select('.background').attr('width', function () {
            return (xScale(task.endDate) - xScale(task.startDate));
        });
    };

    var changeEndTime = function (task) {
        var taskbox = getTaskBox(task);
        task.dasharray = false;
        taskbox.attr("stroke-dasharray", function (d) {
            return '0'
        })
        taskbox.select('.pre').attr('width', function () {
            return (xScale(task.endDate) - xScale(
                    task.startDate)) * task.percent || 0;
        });
        taskbox.select('.background').attr('width', function () {
            return (xScale(task.endDate) - xScale(task.startDate));
        });
    };

    // var curx, cury;
    var clickHandler = function () {
        var event = d3.event;
        var el = document.elementFromPoint(d3.event.clientX, d3.event.clientY);
        redrawMenu();
    }

    var changePriority = function (task) {
        var taskbox = getTaskBox(task);
        taskbox.attr('class', 'item priority-' + task.priority);
    }

    var redrawMenu = function () {
        if (config.readonly) {
            return;
        }
        app.changePriority = changePriority;
        app.changeStartTime = changeStartTime;
        app.changePercent = changePercent;
        app.changeEndTime = changeEndTime;
        //选中
        menuFactory(d3, app, d3.select('.tasks-wrapper'), task);
    }

    var showMarker = function (task) {
        task.endDate = task.startDate;
        var lineSvg = tasksWarpper
            .append('g')
            .classed('line', true)
            .attr('class', function () {
                return 'task-line-' + task.uuid;
            })
            .attr('transform', function () {
                return 'translate(0,' + (yScale(task.uuid)) + ')';
            })
            .style('fill', config.eventLineColor);
        lineSvg.selectAll('.item').remove();
        //容器
        taskbox = lineSvg
            .append('g')
            // .on('click', clickHandler)
            .style('fill', config.eventColor)
            .attr('class', "item")
            .attr('transform', function () {
                var trans = 'translate(' + (xScale(task.startDate) - 0) + ', ' + stoneOffTop + ')';
                // var trans = 'translate(' + (xScale(task.endDate) - 0) + ', ' + stoneOffTop + ')'; //应产品要求,里程碑显示在结束时间处Liu
                return trans;
            })
            .attr('height', 20);

        if (!config.readonly) {
            taskbox.on('click', clickHandler).call(drag);
        }

        var fillColor = "#0cc";
        // if (task.endDate < new Date()) {
        //   fillColor = '#ff777d';
        // }

        background = taskbox.append('g')
            .attr('transform', function () {
                return 'translate(10, -5)'
            })
            .append('rect')
            // .style('fill', "transparent")
            .style('fill', task.dueOut ? "#ff777d" : "transparent")
            .attr('class', "task marker")
            .style('fill', "#0f0") //6df3d2
            .attr('rx', 0)
            .attr('ry', 0)
            .attr('stroke', "#a0a0a0")
            .attr('stroke-width', 1)
            // .attr('transform', function() {
            //   return 'translate(100, 13)'
            // })
            .attr('height', 15)
            .attr('width', 15);

        if (task.uuid == config.selectTaskId) {
            app.selectTask(task.uuid);
            menuFactory(d3, app, d3.select('.tasks-wrapper'), task);
        }
        /*LIU 里程碑也显示任务名称*/
        if (config.showTaskName) {
            taskbox.append('text')
                .text(function () {
                    if (app.config.textFix) {
                        return app.config.textFix(task)
                    } else {
                        return task.name;
                    }
                })
                .attr("text-anchor", "end")
                .attr('transform', function () {
                    var x = -30; //(xScale(task.endDate) - xScale(task.startDate)) + 10;
                    return 'translate(' + x + ', 10)'
                })
        }

    };


    // //画基线
    var showOldTask = function (task) {
        // return true;
        var me = this;
        var cls = '.task-line-' + task.uuid;
        var lineSvg = tasksWarpper.select(cls);
        if (task.baselineStartDate && task.baselineEndDate) {
            var oldTaskBox = lineSvg
                .append('g')
                .style('fill', config.eventColor)
                .attr('class', "old-task priority-" + task.priority)
                .attr('transform', function () {
                    return 'translate(' + (xScale(task.baselineStartDate)) + ', 0)'
                })
                .attr('height', 20);
            var old = oldTaskBox.append('rect')
                .style('fill', "#000")
                .attr('class', "background")
                .attr('height', 4)
                .attr('stroke', "#000")
                .attr('stroke-width', 1)
                .attr('width', function () {
                    return (xScale(task.baselineEndDate) - xScale(task.baselineStartDate))
                });
        }
    }

    /**
     * 画任务相关的功能
     */
    var drawTask = function (task) {
        var ispkg = task.children && task.children.length > 0;

        //轨道
        var lineSvg = tasksWarpper
            .append('g')
            .classed('line', true)
            .attr('class', function () {
                return 'task-line-' + task.uuid;
            })
            .attr('transform', function () {
                return 'translate(0,' + (yScale(task.uuid)) + ')';
            })
            .style('fill', config.eventLineColor);
        //清轨
        lineSvg.selectAll('.item').remove();
        //任务容器
        taskbox = lineSvg
            .append('g')
            .style('fill', config.eventColor)
            .attr('class', function () {
                if (app.config.classFix) {
                    return app.config.classFix(task)
                } else {
                    return "item"
                }
            })
            .attr("stroke-dasharray", function (d) {
                if (task.dasharray) {
                    return '5, 5'
                }
            })
            .classed("package", ispkg)
            .attr('transform', function () {
                var offTop = ispkg ? packageOffTop : taskOffTop;
                var trans = 'translate(' + xScale(task.startDate) + ', ' + offTop + ')';
                return trans;
            })
            .attr('height', 20);


        var fillColor = "#0cc";
        if (task.endDate < new Date()) {
            fillColor = '#ff777d';
        }

        var height = ispkg ? packageHeight : taskHeight;
        var stroke = ispkg ? 'red' : "#666666";
        background = taskbox.append('rect')
        // .style('fill', task.dueOut ? "#ff777d" : "transparent")
            .attr('class', "task background")
            .attr('height', height)
            // .attr('stroke', task.dueOut ? "#ff0000" : stroke)
            .attr('stroke-width', 1)
            .attr('width', function () {
                return Math.max((xScale(task.endDate) - xScale(task.startDate)), 5)
            });

        pre = taskbox.append('rect')
            .style('fill', "#6df3d2")
            .attr('stroke', stroke)
            .attr('class', "task pre")
            .attr('height', height - 1)
            .attr('transform', 'translate(1, 1)')
            .attr('stroke-width', 0)
            .attr('width', function () {
                var w = xScale(task.endDate) - xScale(task.startDate) - 1;

                if (w < 0) {
                    w = 5;
                }
                return w * task.percent || 0;
            });

        // taskbox.append("circle")
        //   .attr('class', 'ghostCircle')
        //   .attr("r", 30)
        //   .attr("opacity", 0.2) // change this to zero to hide the target area
        //   .style("fill", "red")
        //   .attr('transform', 'translate(0, 7)')
        //   .attr('pointer-events', 'mouseover')
        //   .on("mouseover", function(node) {
        //     app.selectedNode = node;
        //     app.updateTempConnector();
        //   })
        //   .on("mouseout", function(node) {
        //     app.selectedNode = null;
        //     app.updateTempConnector();
        //   });


        // taskbox.append("circle")
        //   .attr('class', 'ghostCircle')
        //   .attr("r", 30)
        //   .attr("opacity", 0.2) // change this to zero to hide the target area
        //   .style("fill", "red")
        //   .attr('transform', function() {
        //     var x = (xScale(task.endDate) - xScale(task.startDate));
        //     return 'translate(' + x + ', 7)';
        //   })
        //   .attr('pointer-events', 'mouseover')
        //   .on("mouseover", function(node, x) {
        //     console.log(x);
        //     app.selectedNode = node;
        //     app.updateTempConnector();
        //   })
        //   .on("mouseout", function(node) {
        //     app.selectedNode = null;
        //     app.updateTempConnector();
        //   });

        //决定画父任务还是子任务
        if (ispkg) {
            var w = xScale(task.endDate) - xScale(task.startDate) + 1;
            var pw = w * task.percent || 0;
            var bgColor = task.dueOut ? "#ff777d" : "transparent";
            taskbox.append('polyline')
                .attr('stroke', 'red')
                .attr('class', "decoration")
                .attr('transform', "translate(0, " + packageHeight + ")")
                .attr('points', '0,0 ' + (w - 1) + ',0 ' + (w - 1) + ',8 ' + (w -
                    5) + ',0 5,0 0,8 0,0')
                .attr('style', 'fill:red;stroke-width:0');

        } else {
            taskbox.on('mouseover', function () {
                // ////console.log(d3.event.target);
                window.o = d3.event.target;
                if (d3.event && d3.event.buttons != 0) {
                    return false;
                }
                var isTbx = o.tagName == 'rect';
                if (isTbx) {
                    app.changePriority = changePriority;
                    app.changeStartTime = changeStartTime;
                    app.changePercent = changePercent;
                    app.changeEndTime = changeEndTime;
                    app.drawTask = init;
                    menuFactory(d3, app, d3.select('.tasks-wrapper'), task);
                }
            });
        }
        //增加事件锁定
        if (!config.readonly && !ispkg) {
            taskbox.on('click', clickHandler).call(drag);
        }
        // }


        //如果遇上是选中的任务，画上图背景
        if (task.uuid == config.selectTaskId) {
            // console.log('有一个选中的任务：' + task.uuid);
            app.selectTask(task.uuid);
            menuFactory(d3, app, d3.select('.tasks-wrapper'), task);
        }

        //决定是不是要显示任务名称
        if (config.showTaskName) {
            taskbox.append('text')
                .text(function () {
                    if (app.config.textFix) {
                        return app.config.textFix(task)
                    } else {
                        return task.name;
                    }
                })
                .attr("text-anchor", "end")
                .attr('transform', function () {
                    var x = -30;
                    return 'translate(' + x + ', 10)'
                })
        }
    };

    //画任务
    return init(task);
};
},{"./menuFactory":10,"pubsub-js":1}],12:[function(require,module,exports){
"use strict";
var _ = require('underscore');
module.exports = function(d3, app, task) {

  var formater = d3.time.format("%Y-%m-%d %H");

  var em = {
    uuid: '',
    name: '',
    children: [],
    parent: null,
    parentId: '',
    status: '',
    startDate: null,
    endDate: null,
    baselineStartDate: null,
    baselineEndDate: null,
    marker: false,
    from: [], //我受哪些任务的影响
    to: [], //我能影响哪些任务
    getName: function() {
      return this.name;
    },
    move: function(second) {
      // console.log('move');
      var start = formater(this.startDate);
      if (this.startDate.getTime()) {
        // me.draw();
      }
      if (app.count && app.count > 1000) {
        // return false;
      }
      // app.count = app.count || 0;
      // app.count++;
      // console.log(app.count + "===" + this.uuid);
      var me = this;
      var len = this.endDate.getTime() - this.startDate.getTime();
      var startDate = d3.time.second.offset(this.startDate, -second);
      var endDate = d3.time.second.offset(this.endDate, -second);
      this._startTime = this._startTime || 0;
      // this._startTime = Math.max(this._startTime, startDate.getTime());
      this._startTime = startDate.getTime();
      this.startDate = new Date(this._startTime);
      this.endDate = new Date(this._startTime + len);

      // this.from = _.uniq(this.from);
      // this.to = _.uniq(this.to);
      // // console.log(this.name + "second:" + (second / 60 / 60) + "\t 初始" + start + "\t 之后" + formater(this.startDate));
      // _.each(this.to, function(t) {
      //   // console.log(app.config);
      //   var toTask = app.config.taskMaps[t];
      //   var offset = (toTask.startDate.getTime() - me.endDate.getTime()) / 1000;
      //   // console.log("second:" + (offset / 60 / 60) + "\t 初" + toTask.uuid + "|" + formater(toTask.startDate) + "\t 之" + me.uuid + "|" + formater(me.endDate));

      //   toTask.move(offset);
      // });
      // _.each(this.from, function(f) {

      // })
    },
    calTime: function() {
      this.from = _.uniq(this.from);
      _.each(this.from, function(f) {

      })
    },
    isParent: function() {
      return this.children && this.children.length > 0;
    },
    isMarker: function() {
      return this.marker;
    },
    getPath: function() {
      var path = [];
      path.push(this.uuid);
      var o = this.parent;
      if (o) {
        path.push(o.uuid);
        while (o.parent) {
          path.push(o.parent.uuid);
          o = o.parent;
        }
      }
      return path.join("/");
    }
  }

  var init = function(task) {
    task = em = _.extend(em, task);
    app.config.taskMaps[task.uuid] = task;
    return task;
  }

  //画任务
  return init(task);
};
},{"underscore":2}],13:[function(require,module,exports){
module.exports = function configurable(targetFunction, config, listeners) {
  listeners = listeners || {};
  for (var item in config) {
    (function(item) {
      targetFunction[item] = function(value) {
        if (!arguments.length) return config[item];
        config[item] = value;
        if (listeners.hasOwnProperty(item)) {
          listeners[item](value);
        }
        return targetFunction;
      };
    })(item); // for doesn't create a closure, forcing it
  }
};

},{}],14:[function(require,module,exports){
module.exports = function(d3, app, domEl, where) {
  var xAxis = {};
  var xAxisEls = {};
  var formater = d3.time.format("%Y-%m-%d %H:%M:%S")
  var st = new Date().getTime();
  var config = app.config;
  var xScale = app.xScale;
  var zoom = app.zoom;
  // 初始化背影
  var mycanvas = document.getElementById("app-wrapper-bg");
  var mycontext = mycanvas.getContext('2d');
  mycontext.clearRect(0, 0, mycanvas.width, mycanvas.height);

  var tickFormatData = [];
  config.tickFormat.forEach(function(item) {
    var tick = item.slice(0);
    tickFormatData.push(tick);
  });

  var tickFormat = config.locale ? config.locale.timeFormat.multi(tickFormatData) : d3.time.format.multi(tickFormatData);

  xAxis[where] = d3.svg.axis()
    .scale(xScale)
    .orient(where)
    .ticks(config.step)
    .tickFormat(tickFormat);

  // var zoom = config.zoom;
  domEl.selectAll('.xAxis').remove();
  var mainBox = domEl.append('g').classed('xAxis', true);
  domEl.selectAll('.xSubAxis').remove();
  var subBox = domEl.append('g').classed('xSubAxis', true);
  
  var domain = xScale.domain();
  var zoomScale = zoom.scale();

  /**
   * 工具函数：画一条线
   */
  var drawLine = function(dotXY, ops) {
    mycontext.beginPath();
    for (var att in ops) mycontext[att] = ops[att];
    dotXY = dotXY.constructor == Object ? [dotXY || {
      x: 0,
      y: 0
    }] : dotXY;
    mycontext.moveTo(dotXY[0].x, dotXY[0].y);
    for (var i = 1, len = dotXY.length; i < len; i++) mycontext.lineTo(dotXY[i].x, dotXY[i].y);
    mycontext.stroke();
  };

  //------------------------------------------------------------------------

  var drawYearEl = function() {
    var start = d3.time.year.offset(domain[0], -5);
    var end = d3.time.year.offset(domain[1], 5);
    var months = d3.time.years(start, end);

    var xAxis = null,
      monthWidth = 0;
    xAxis = mainBox.selectAll('g').data(months);
    var o = xAxis.enter()
      .append('g')
      .attr('transform', function(d) {
        return 'translate(' + (xScale(d)) + ',0)';
      })

    o.append('rect')
      .attr('width', function(d) {
        var next = d3.time.year.offset(d, 1);
        next = d3.time.year(next);
        monthWidth = xScale(next) - xScale(d);
        return monthWidth - 1;
      })
      .attr('fill', '#f9f9f9')
      .attr('height', 20)

    o.append('text')
      .attr("dx", 10)
      .attr("dy", 13)
      .attr('transform', function() {
        return 'translate(' + (monthWidth / 2 - 40) + ', 0)';
      })
      .text(function(d) {
        window.d = d;
        return d.getFullYear() + '年';
      });

    xAxis.exit().remove();
  }

  var drawMonthEl = function() {
    var start = d3.time.day.offset(domain[0], -30);
    var end = d3.time.day.offset(domain[1], 30);
    var months = d3.time.months(start, end);

    var xAxis = null,
      monthWidth = 0;
    xAxis = mainBox.selectAll('g').data(months);

    var o = xAxis.enter()
      .append('g')
      .attr('transform', function(d) {
        return 'translate(' + (xScale(d)) + ',0)';
      })

    o.append('rect')
      .attr('width', function(d) {
        var next = d3.time.day.offset(d, 31);
        next = d3.time.month(next);
        monthWidth = xScale(next) - xScale(d);
        return monthWidth;
      })
      .attr('fill', '#f9f9f9')
      .attr('stroke', '#D2D1D1')
      .attr('stroke-width', '1')
      .attr('shape-rendering', 'crispEdges')
      .attr('height', 20)

    o.append('text')
      .attr("dx", 10)
      .attr("dy", 13)
      .attr('transform', function() {
        return 'translate(' + (monthWidth / 2 - 40) + ', 0)';
      })
      .text(function(d) {
        window.d = d;
        return d.getFullYear() + '年' + (d.getMonth() + 1) + '月';
      });

    xAxis.exit().remove();
  }



  ///////


  var drawDayModel = function() {
    drawMonthEl();

    var start = d3.time.day.offset(domain[0], -7);
    var end = d3.time.day.offset(domain[1], +7);
    var days = d3.time.days(start, end);
    var xSubAxis = subBox.selectAll('g').data(days);

    var o = xSubAxis.enter()
      .append('g')
      .attr('class', function(d) {
        var day = d.getDay();
        var result = '';
        if (day == 0 || day == 6) {
          result = 'd h'
        } else {
          result = 'd'
        }
        return result;
      })
      .attr('transform', function(d) {
        var dx = d3.time.day.offset(d, 0);
        return 'translate(' + (xScale(dx)) + ',0)';
      });

    o.append('rect')
      .attr('width', function(d) {
        var dx = d3.time.day.offset(d, 1);
        return xScale(dx) - xScale(d);
      })
      .attr('stroke', '#D2D1D1')
      .attr('stroke-width', '1')
      .attr('shape-rendering', 'crispEdges')
      .attr('height', 20)

    o.append('text')
      .attr("dx", 10)
      .attr("dy", 13)
      .text(function(d) {
        return d.getDate();
      });

    xSubAxis.exit().remove();
    // 大背影周末绘制
    for (var i = 0; i < days.length; i++) {
      var day = days[i];
      var x1 = xScale(day);
      var next = d3.time.day.offset(day, 1);
      var x2 = xScale(next) - xScale(day) - 0;
      x1 = Math.round(x1) + 0.5;
      var day = day.getDay();
      var result = '';
      if (day == 0 || day == 6) {
        mycontext.fillStyle = '#f4f9ff'; //Liu换颜色
        mycontext.fillRect(x1, 0, x2, 1000);
      }
    }
  }

  var drawWeekModel = function() {
    drawMonthEl();
    var start = d3.time.day.offset(domain[0], -14);
    var end = d3.time.day.offset(domain[1], +14);
    var weeks = d3.time.weeks(start, end);
    for (var i = 0; i < weeks.length; i++) {
      weeks[i] = d3.time.day.offset(weeks[i], 1);
    }

    var xSubAxis = null,
      weekWidth = 0;
    xSubAxis = subBox.selectAll('g').data(weeks);

    var o = xSubAxis.enter()
      .append('g')
      .attr('class', function(d) {
        var day = d.getDay();
        if (day == 0 || day == 6) {
          return 'd h'
        } else {
          return 'd'
        }
      })
      .attr('transform', function(d) {
        var dx = d3.time.day.offset(d, 0);
        return 'translate(' + (xScale(dx)) + ',0)';
      });

    o.append('rect')
      .attr('width', function(d) {
        var dx = d3.time.day.offset(d, +7);
        weekWidth = xScale(dx) - xScale(d);
        return weekWidth;
      })
      .attr('stroke', '#c5c5c5')
      .attr('stroke-width', '1')
      .attr('shape-rendering', 'crispEdges')
      .attr('height', 20)

    o.append('text')
      .attr("dx", 10)
      .attr("dy", 13)
      .attr('transform', function() {
        return 'translate(' + (weekWidth / 2 - 20) + ', 0)';
      })
      .text(function(d) {
        var week = app.getYearWeek(d.getFullYear(), d.getMonth() + 1, d.getDate());
        return week + '周';
      });

    xSubAxis.exit().remove();
    //------

    var mycanvas = document.getElementById("app-wrapper-bg");
    var mycontext = mycanvas.getContext('2d');
    mycontext.clearRect(0, 0, mycanvas.width, mycanvas.height);



    for (var i = 0; i < weeks.length; i++) {
      var day = weeks[i];
      var x1 = xScale(day);
      var next = d3.time.day.offset(day, 7);
      var x2 = xScale(next) - xScale(day) - 1;
      x1 = Math.round(x1) + 0.5;

      var day = day.getDay();
      var result = '';
      drawLine([{
        x: x1,
        y: 0
      }, {
        x: x1,
        y: 1000
      }], {
        lineWidth: 1,
        strokeStyle: 'rgb(230,228,229)'
      }); //+0.5偏移
    }
  }

  var drawMounthModel = function() {
    drawYearEl();

    var start = d3.time.month.offset(domain[0], -1);
    var end = d3.time.month.offset(domain[1], +1);
    var months = d3.time.months(start, end);

    var xSubAxis = null,
      monthWidth = 0;
    xSubAxis = subBox.selectAll('g').data(months);

    var o = xSubAxis.enter()
      .append('g')
      .attr('class', function(d) {
        return 'd'
      })
      .attr('transform', function(d) {
        var dx = d3.time.day.offset(d, 0);
        return 'translate(' + (xScale(dx)) + ',0)';
      });

    o.append('rect')
      .attr('width', function(d) {
        var dx = d3.time.month.offset(d, +1);
        monthWidth = xScale(dx) - xScale(d);
        return monthWidth;
      })
      .attr('stroke', '#c5c5c5')
      .attr('stroke-width', '1')
      .attr('shape-rendering', 'crispEdges')
      .attr('height', 20)

    o.append('text')
      .attr("dx", 10)
      .attr("dy", 13)
      .attr('transform', function() {
        return 'translate(' + (monthWidth / 2 - 20) + ', 0)';
      })
      .text(function(d) {
        return (d.getMonth() + 1) + '月';
      });

    xSubAxis.exit().remove();

    for (var i = 0; i < months.length; i++) {
      var day = months[i];
      var x1 = xScale(day);
      var next = d3.time.month.offset(d, +1);
      var x2 = xScale(next) - xScale(day) - 1;
      x1 = Math.round(x1) + 0.5;

      var day = day.getDay();
      var result = '';
      drawLine([{
        x: x1,
        y: 0
      }, {
        x: x1,
        y: 1000
      }], {
        lineWidth: 1,
        strokeStyle: 'rgb(230,228,229)'
      }); //+0.5偏移
    }
  }

  if (zoomScale > 0.7) {
    drawDayModel();
  } else if (zoomScale > 0.15) {
    drawWeekModel();
  } else {
    drawMounthModel();
  }

  if (where == 'top') {
    subBox.attr('transform', 'translate(0, 21)');
    mainBox.attr('transform', 'translate(0, 1)');
  } else {
    subBox.attr('transform', 'translate(0, 2)');
    mainBox.attr('transform', 'translate(0, 22)');
  }

  var drawToday = function() {
      day = d3.time.day(new Date());
      var x1 = xScale(day);
      x1 = Math.round(x1) + 0.5;
      drawLine([{
        x: x1,
        y: 0
      }, {
        x: x1,
        y: 1000
      }], {
        lineWidth: 1,
        strokeStyle: 'rgb(230,0,0)'
      }); //+0.5偏移
    }
  //画出当天的分割线
  drawToday();

  //------------------------------------------------------------------------
  if (typeof config.axisFormat === 'function') {
    config.axisFormat(xAxis);
  }

  var drawXAxis = function drawXAxis() {
    xAxisEls[where].call(xAxis[where]);
  };

  return {
    drawXAxis: drawXAxis
  };
};
},{}]},{},[9])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwibm9kZV9tb2R1bGVzL3B1YnN1Yi1qcy9zcmMvcHVic3ViLmpzIiwibm9kZV9tb2R1bGVzL3VuZGVyc2NvcmUvdW5kZXJzY29yZS5qcyIsInB1YmxpYy9qYXZhc2NyaXB0cy9hcHAuanMiLCJwdWJsaWMvamF2YXNjcmlwdHMvY2FsY3VsYXRlLmpzIiwicHVibGljL2phdmFzY3JpcHRzL2ZpbHRlckRhdGEuanMiLCJwdWJsaWMvamF2YXNjcmlwdHMvZmlsdGVyTGluZS5qcyIsInB1YmxpYy9qYXZhc2NyaXB0cy9saW5rRmFjdG9yeS5qcyIsInB1YmxpYy9qYXZhc2NyaXB0cy9sb2dnZXIuanMiLCJwdWJsaWMvamF2YXNjcmlwdHMvbWFpbi5qcyIsInB1YmxpYy9qYXZhc2NyaXB0cy9tZW51RmFjdG9yeS5qcyIsInB1YmxpYy9qYXZhc2NyaXB0cy90YXNrRmFjdG9yeS5qcyIsInB1YmxpYy9qYXZhc2NyaXB0cy90YXNrRnVuY3Rpb25zLmpzIiwicHVibGljL2phdmFzY3JpcHRzL3V0aWwvY29uZmlndXJhYmxlLmpzIiwicHVibGljL2phdmFzY3JpcHRzL3hBeGlzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1Z0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3R6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6YUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzZ0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3puQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKlxuQ29weXJpZ2h0IChjKSAyMDEwLDIwMTEsMjAxMiwyMDEzLDIwMTQgTW9yZ2FuIFJvZGVyaWNrIGh0dHA6Ly9yb2Rlcmljay5ka1xuTGljZW5zZTogTUlUIC0gaHR0cDovL21yZ25yZHJjay5taXQtbGljZW5zZS5vcmdcblxuaHR0cHM6Ly9naXRodWIuY29tL21yb2Rlcmljay9QdWJTdWJKU1xuKi9cbihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSl7XG5cdCd1c2Ugc3RyaWN0JztcblxuICAgIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpe1xuICAgICAgICAvLyBBTUQuIFJlZ2lzdGVyIGFzIGFuIGFub255bW91cyBtb2R1bGUuXG4gICAgICAgIGRlZmluZShbJ2V4cG9ydHMnXSwgZmFjdG9yeSk7XG5cbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jyl7XG4gICAgICAgIC8vIENvbW1vbkpTXG4gICAgICAgIGZhY3RvcnkoZXhwb3J0cyk7XG5cbiAgICB9XG5cbiAgICAvLyBCcm93c2VyIGdsb2JhbHNcbiAgICB2YXIgUHViU3ViID0ge307XG4gICAgcm9vdC5QdWJTdWIgPSBQdWJTdWI7XG4gICAgZmFjdG9yeShQdWJTdWIpO1xuXG59KCggdHlwZW9mIHdpbmRvdyA9PT0gJ29iamVjdCcgJiYgd2luZG93ICkgfHwgdGhpcywgZnVuY3Rpb24gKFB1YlN1Yil7XG5cdCd1c2Ugc3RyaWN0JztcblxuXHR2YXIgbWVzc2FnZXMgPSB7fSxcblx0XHRsYXN0VWlkID0gLTE7XG5cblx0ZnVuY3Rpb24gaGFzS2V5cyhvYmope1xuXHRcdHZhciBrZXk7XG5cblx0XHRmb3IgKGtleSBpbiBvYmope1xuXHRcdFx0aWYgKCBvYmouaGFzT3duUHJvcGVydHkoa2V5KSApe1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0LyoqXG5cdCAqXHRSZXR1cm5zIGEgZnVuY3Rpb24gdGhhdCB0aHJvd3MgdGhlIHBhc3NlZCBleGNlcHRpb24sIGZvciB1c2UgYXMgYXJndW1lbnQgZm9yIHNldFRpbWVvdXRcblx0ICpcdEBwYXJhbSB7IE9iamVjdCB9IGV4IEFuIEVycm9yIG9iamVjdFxuXHQgKi9cblx0ZnVuY3Rpb24gdGhyb3dFeGNlcHRpb24oIGV4ICl7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIHJlVGhyb3dFeGNlcHRpb24oKXtcblx0XHRcdHRocm93IGV4O1xuXHRcdH07XG5cdH1cblxuXHRmdW5jdGlvbiBjYWxsU3Vic2NyaWJlcldpdGhEZWxheWVkRXhjZXB0aW9ucyggc3Vic2NyaWJlciwgbWVzc2FnZSwgZGF0YSApe1xuXHRcdHRyeSB7XG5cdFx0XHRzdWJzY3JpYmVyKCBtZXNzYWdlLCBkYXRhICk7XG5cdFx0fSBjYXRjaCggZXggKXtcblx0XHRcdHNldFRpbWVvdXQoIHRocm93RXhjZXB0aW9uKCBleCApLCAwKTtcblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBjYWxsU3Vic2NyaWJlcldpdGhJbW1lZGlhdGVFeGNlcHRpb25zKCBzdWJzY3JpYmVyLCBtZXNzYWdlLCBkYXRhICl7XG5cdFx0c3Vic2NyaWJlciggbWVzc2FnZSwgZGF0YSApO1xuXHR9XG5cblx0ZnVuY3Rpb24gZGVsaXZlck1lc3NhZ2UoIG9yaWdpbmFsTWVzc2FnZSwgbWF0Y2hlZE1lc3NhZ2UsIGRhdGEsIGltbWVkaWF0ZUV4Y2VwdGlvbnMgKXtcblx0XHR2YXIgc3Vic2NyaWJlcnMgPSBtZXNzYWdlc1ttYXRjaGVkTWVzc2FnZV0sXG5cdFx0XHRjYWxsU3Vic2NyaWJlciA9IGltbWVkaWF0ZUV4Y2VwdGlvbnMgPyBjYWxsU3Vic2NyaWJlcldpdGhJbW1lZGlhdGVFeGNlcHRpb25zIDogY2FsbFN1YnNjcmliZXJXaXRoRGVsYXllZEV4Y2VwdGlvbnMsXG5cdFx0XHRzO1xuXG5cdFx0aWYgKCAhbWVzc2FnZXMuaGFzT3duUHJvcGVydHkoIG1hdGNoZWRNZXNzYWdlICkgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Zm9yIChzIGluIHN1YnNjcmliZXJzKXtcblx0XHRcdGlmICggc3Vic2NyaWJlcnMuaGFzT3duUHJvcGVydHkocykpe1xuXHRcdFx0XHRjYWxsU3Vic2NyaWJlciggc3Vic2NyaWJlcnNbc10sIG9yaWdpbmFsTWVzc2FnZSwgZGF0YSApO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIGNyZWF0ZURlbGl2ZXJ5RnVuY3Rpb24oIG1lc3NhZ2UsIGRhdGEsIGltbWVkaWF0ZUV4Y2VwdGlvbnMgKXtcblx0XHRyZXR1cm4gZnVuY3Rpb24gZGVsaXZlck5hbWVzcGFjZWQoKXtcblx0XHRcdHZhciB0b3BpYyA9IFN0cmluZyggbWVzc2FnZSApLFxuXHRcdFx0XHRwb3NpdGlvbiA9IHRvcGljLmxhc3RJbmRleE9mKCAnLicgKTtcblxuXHRcdFx0Ly8gZGVsaXZlciB0aGUgbWVzc2FnZSBhcyBpdCBpcyBub3dcblx0XHRcdGRlbGl2ZXJNZXNzYWdlKG1lc3NhZ2UsIG1lc3NhZ2UsIGRhdGEsIGltbWVkaWF0ZUV4Y2VwdGlvbnMpO1xuXG5cdFx0XHQvLyB0cmltIHRoZSBoaWVyYXJjaHkgYW5kIGRlbGl2ZXIgbWVzc2FnZSB0byBlYWNoIGxldmVsXG5cdFx0XHR3aGlsZSggcG9zaXRpb24gIT09IC0xICl7XG5cdFx0XHRcdHRvcGljID0gdG9waWMuc3Vic3RyKCAwLCBwb3NpdGlvbiApO1xuXHRcdFx0XHRwb3NpdGlvbiA9IHRvcGljLmxhc3RJbmRleE9mKCcuJyk7XG5cdFx0XHRcdGRlbGl2ZXJNZXNzYWdlKCBtZXNzYWdlLCB0b3BpYywgZGF0YSwgaW1tZWRpYXRlRXhjZXB0aW9ucyApO1xuXHRcdFx0fVxuXHRcdH07XG5cdH1cblxuXHRmdW5jdGlvbiBtZXNzYWdlSGFzU3Vic2NyaWJlcnMoIG1lc3NhZ2UgKXtcblx0XHR2YXIgdG9waWMgPSBTdHJpbmcoIG1lc3NhZ2UgKSxcblx0XHRcdGZvdW5kID0gQm9vbGVhbihtZXNzYWdlcy5oYXNPd25Qcm9wZXJ0eSggdG9waWMgKSAmJiBoYXNLZXlzKG1lc3NhZ2VzW3RvcGljXSkpLFxuXHRcdFx0cG9zaXRpb24gPSB0b3BpYy5sYXN0SW5kZXhPZiggJy4nICk7XG5cblx0XHR3aGlsZSAoICFmb3VuZCAmJiBwb3NpdGlvbiAhPT0gLTEgKXtcblx0XHRcdHRvcGljID0gdG9waWMuc3Vic3RyKCAwLCBwb3NpdGlvbiApO1xuXHRcdFx0cG9zaXRpb24gPSB0b3BpYy5sYXN0SW5kZXhPZiggJy4nICk7XG5cdFx0XHRmb3VuZCA9IEJvb2xlYW4obWVzc2FnZXMuaGFzT3duUHJvcGVydHkoIHRvcGljICkgJiYgaGFzS2V5cyhtZXNzYWdlc1t0b3BpY10pKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gZm91bmQ7XG5cdH1cblxuXHRmdW5jdGlvbiBwdWJsaXNoKCBtZXNzYWdlLCBkYXRhLCBzeW5jLCBpbW1lZGlhdGVFeGNlcHRpb25zICl7XG5cdFx0dmFyIGRlbGl2ZXIgPSBjcmVhdGVEZWxpdmVyeUZ1bmN0aW9uKCBtZXNzYWdlLCBkYXRhLCBpbW1lZGlhdGVFeGNlcHRpb25zICksXG5cdFx0XHRoYXNTdWJzY3JpYmVycyA9IG1lc3NhZ2VIYXNTdWJzY3JpYmVycyggbWVzc2FnZSApO1xuXG5cdFx0aWYgKCAhaGFzU3Vic2NyaWJlcnMgKXtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRpZiAoIHN5bmMgPT09IHRydWUgKXtcblx0XHRcdGRlbGl2ZXIoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0c2V0VGltZW91dCggZGVsaXZlciwgMCApO1xuXHRcdH1cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxuXG5cdC8qKlxuXHQgKlx0UHViU3ViLnB1Ymxpc2goIG1lc3NhZ2VbLCBkYXRhXSApIC0+IEJvb2xlYW5cblx0ICpcdC0gbWVzc2FnZSAoU3RyaW5nKTogVGhlIG1lc3NhZ2UgdG8gcHVibGlzaFxuXHQgKlx0LSBkYXRhOiBUaGUgZGF0YSB0byBwYXNzIHRvIHN1YnNjcmliZXJzXG5cdCAqXHRQdWJsaXNoZXMgdGhlIHRoZSBtZXNzYWdlLCBwYXNzaW5nIHRoZSBkYXRhIHRvIGl0J3Mgc3Vic2NyaWJlcnNcblx0KiovXG5cdFB1YlN1Yi5wdWJsaXNoID0gZnVuY3Rpb24oIG1lc3NhZ2UsIGRhdGEgKXtcblx0XHRyZXR1cm4gcHVibGlzaCggbWVzc2FnZSwgZGF0YSwgZmFsc2UsIFB1YlN1Yi5pbW1lZGlhdGVFeGNlcHRpb25zICk7XG5cdH07XG5cblx0LyoqXG5cdCAqXHRQdWJTdWIucHVibGlzaFN5bmMoIG1lc3NhZ2VbLCBkYXRhXSApIC0+IEJvb2xlYW5cblx0ICpcdC0gbWVzc2FnZSAoU3RyaW5nKTogVGhlIG1lc3NhZ2UgdG8gcHVibGlzaFxuXHQgKlx0LSBkYXRhOiBUaGUgZGF0YSB0byBwYXNzIHRvIHN1YnNjcmliZXJzXG5cdCAqXHRQdWJsaXNoZXMgdGhlIHRoZSBtZXNzYWdlIHN5bmNocm9ub3VzbHksIHBhc3NpbmcgdGhlIGRhdGEgdG8gaXQncyBzdWJzY3JpYmVyc1xuXHQqKi9cblx0UHViU3ViLnB1Ymxpc2hTeW5jID0gZnVuY3Rpb24oIG1lc3NhZ2UsIGRhdGEgKXtcblx0XHRyZXR1cm4gcHVibGlzaCggbWVzc2FnZSwgZGF0YSwgdHJ1ZSwgUHViU3ViLmltbWVkaWF0ZUV4Y2VwdGlvbnMgKTtcblx0fTtcblxuXHQvKipcblx0ICpcdFB1YlN1Yi5zdWJzY3JpYmUoIG1lc3NhZ2UsIGZ1bmMgKSAtPiBTdHJpbmdcblx0ICpcdC0gbWVzc2FnZSAoU3RyaW5nKTogVGhlIG1lc3NhZ2UgdG8gc3Vic2NyaWJlIHRvXG5cdCAqXHQtIGZ1bmMgKEZ1bmN0aW9uKTogVGhlIGZ1bmN0aW9uIHRvIGNhbGwgd2hlbiBhIG5ldyBtZXNzYWdlIGlzIHB1Ymxpc2hlZFxuXHQgKlx0U3Vic2NyaWJlcyB0aGUgcGFzc2VkIGZ1bmN0aW9uIHRvIHRoZSBwYXNzZWQgbWVzc2FnZS4gRXZlcnkgcmV0dXJuZWQgdG9rZW4gaXMgdW5pcXVlIGFuZCBzaG91bGQgYmUgc3RvcmVkIGlmXG5cdCAqXHR5b3UgbmVlZCB0byB1bnN1YnNjcmliZVxuXHQqKi9cblx0UHViU3ViLnN1YnNjcmliZSA9IGZ1bmN0aW9uKCBtZXNzYWdlLCBmdW5jICl7XG5cdFx0aWYgKCB0eXBlb2YgZnVuYyAhPT0gJ2Z1bmN0aW9uJyl7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Ly8gbWVzc2FnZSBpcyBub3QgcmVnaXN0ZXJlZCB5ZXRcblx0XHRpZiAoICFtZXNzYWdlcy5oYXNPd25Qcm9wZXJ0eSggbWVzc2FnZSApICl7XG5cdFx0XHRtZXNzYWdlc1ttZXNzYWdlXSA9IHt9O1xuXHRcdH1cblxuXHRcdC8vIGZvcmNpbmcgdG9rZW4gYXMgU3RyaW5nLCB0byBhbGxvdyBmb3IgZnV0dXJlIGV4cGFuc2lvbnMgd2l0aG91dCBicmVha2luZyB1c2FnZVxuXHRcdC8vIGFuZCBhbGxvdyBmb3IgZWFzeSB1c2UgYXMga2V5IG5hbWVzIGZvciB0aGUgJ21lc3NhZ2VzJyBvYmplY3Rcblx0XHR2YXIgdG9rZW4gPSAndWlkXycgKyBTdHJpbmcoKytsYXN0VWlkKTtcblx0XHRtZXNzYWdlc1ttZXNzYWdlXVt0b2tlbl0gPSBmdW5jO1xuXG5cdFx0Ly8gcmV0dXJuIHRva2VuIGZvciB1bnN1YnNjcmliaW5nXG5cdFx0cmV0dXJuIHRva2VuO1xuXHR9O1xuXG5cdC8qIFB1YmxpYzogQ2xlYXJzIGFsbCBzdWJzY3JpcHRpb25zXG5cdCAqL1xuXHRQdWJTdWIuY2xlYXJBbGxTdWJzY3JpcHRpb25zID0gZnVuY3Rpb24gY2xlYXJBbGxTdWJzY3JpcHRpb25zKCl7XG5cdFx0bWVzc2FnZXMgPSB7fTtcblx0fTtcblxuXHQvKlB1YmxpYzogQ2xlYXIgc3Vic2NyaXB0aW9ucyBieSB0aGUgdG9waWNcblx0Ki9cblx0UHViU3ViLmNsZWFyU3Vic2NyaXB0aW9ucyA9IGZ1bmN0aW9uIGNsZWFyU3Vic2NyaXB0aW9ucyh0b3BpYyl7XG5cdFx0dmFyIG07XG5cdFx0Zm9yIChtIGluIG1lc3NhZ2VzKXtcblx0XHRcdGlmIChtZXNzYWdlcy5oYXNPd25Qcm9wZXJ0eShtKSAmJiBtLmluZGV4T2YodG9waWMpID09PSAwKXtcblx0XHRcdFx0ZGVsZXRlIG1lc3NhZ2VzW21dO1xuXHRcdFx0fVxuXHRcdH1cblx0fTtcblxuXHQvKiBQdWJsaWM6IHJlbW92ZXMgc3Vic2NyaXB0aW9ucy5cblx0ICogV2hlbiBwYXNzZWQgYSB0b2tlbiwgcmVtb3ZlcyBhIHNwZWNpZmljIHN1YnNjcmlwdGlvbi5cblx0ICogV2hlbiBwYXNzZWQgYSBmdW5jdGlvbiwgcmVtb3ZlcyBhbGwgc3Vic2NyaXB0aW9ucyBmb3IgdGhhdCBmdW5jdGlvblxuXHQgKiBXaGVuIHBhc3NlZCBhIHRvcGljLCByZW1vdmVzIGFsbCBzdWJzY3JpcHRpb25zIGZvciB0aGF0IHRvcGljIChoaWVyYXJjaHkpXG5cdCAqXG5cdCAqIHZhbHVlIC0gQSB0b2tlbiwgZnVuY3Rpb24gb3IgdG9waWMgdG8gdW5zdWJzY3JpYmUuXG5cdCAqXG5cdCAqIEV4YW1wbGVzXG5cdCAqXG5cdCAqXHRcdC8vIEV4YW1wbGUgMSAtIHVuc3Vic2NyaWJpbmcgd2l0aCBhIHRva2VuXG5cdCAqXHRcdHZhciB0b2tlbiA9IFB1YlN1Yi5zdWJzY3JpYmUoJ215dG9waWMnLCBteUZ1bmMpO1xuXHQgKlx0XHRQdWJTdWIudW5zdWJzY3JpYmUodG9rZW4pO1xuXHQgKlxuXHQgKlx0XHQvLyBFeGFtcGxlIDIgLSB1bnN1YnNjcmliaW5nIHdpdGggYSBmdW5jdGlvblxuXHQgKlx0XHRQdWJTdWIudW5zdWJzY3JpYmUobXlGdW5jKTtcblx0ICpcblx0ICpcdFx0Ly8gRXhhbXBsZSAzIC0gdW5zdWJzY3JpYmluZyBhIHRvcGljXG5cdCAqXHRcdFB1YlN1Yi51bnN1YnNjcmliZSgnbXl0b3BpYycpO1xuXHQgKi9cblx0UHViU3ViLnVuc3Vic2NyaWJlID0gZnVuY3Rpb24odmFsdWUpe1xuXHRcdHZhciBpc1RvcGljICAgID0gdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyAmJiBtZXNzYWdlcy5oYXNPd25Qcm9wZXJ0eSh2YWx1ZSksXG5cdFx0XHRpc1Rva2VuICAgID0gIWlzVG9waWMgJiYgdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyxcblx0XHRcdGlzRnVuY3Rpb24gPSB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicsXG5cdFx0XHRyZXN1bHQgPSBmYWxzZSxcblx0XHRcdG0sIG1lc3NhZ2UsIHQ7XG5cblx0XHRpZiAoaXNUb3BpYyl7XG5cdFx0XHRQdWJTdWIuY2xlYXJTdWJzY3JpcHRpb25zKHZhbHVlKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRmb3IgKCBtIGluIG1lc3NhZ2VzICl7XG5cdFx0XHRpZiAoIG1lc3NhZ2VzLmhhc093blByb3BlcnR5KCBtICkgKXtcblx0XHRcdFx0bWVzc2FnZSA9IG1lc3NhZ2VzW21dO1xuXG5cdFx0XHRcdGlmICggaXNUb2tlbiAmJiBtZXNzYWdlW3ZhbHVlXSApe1xuXHRcdFx0XHRcdGRlbGV0ZSBtZXNzYWdlW3ZhbHVlXTtcblx0XHRcdFx0XHRyZXN1bHQgPSB2YWx1ZTtcblx0XHRcdFx0XHQvLyB0b2tlbnMgYXJlIHVuaXF1ZSwgc28gd2UgY2FuIGp1c3Qgc3RvcCBoZXJlXG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoaXNGdW5jdGlvbikge1xuXHRcdFx0XHRcdGZvciAoIHQgaW4gbWVzc2FnZSApe1xuXHRcdFx0XHRcdFx0aWYgKG1lc3NhZ2UuaGFzT3duUHJvcGVydHkodCkgJiYgbWVzc2FnZVt0XSA9PT0gdmFsdWUpe1xuXHRcdFx0XHRcdFx0XHRkZWxldGUgbWVzc2FnZVt0XTtcblx0XHRcdFx0XHRcdFx0cmVzdWx0ID0gdHJ1ZTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gcmVzdWx0O1xuXHR9O1xufSkpO1xuIiwiLy8gICAgIFVuZGVyc2NvcmUuanMgMS44LjNcbi8vICAgICBodHRwOi8vdW5kZXJzY29yZWpzLm9yZ1xuLy8gICAgIChjKSAyMDA5LTIwMTUgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbi8vICAgICBVbmRlcnNjb3JlIG1heSBiZSBmcmVlbHkgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxuXG4oZnVuY3Rpb24oKSB7XG5cbiAgLy8gQmFzZWxpbmUgc2V0dXBcbiAgLy8gLS0tLS0tLS0tLS0tLS1cblxuICAvLyBFc3RhYmxpc2ggdGhlIHJvb3Qgb2JqZWN0LCBgd2luZG93YCBpbiB0aGUgYnJvd3Nlciwgb3IgYGV4cG9ydHNgIG9uIHRoZSBzZXJ2ZXIuXG4gIHZhciByb290ID0gdGhpcztcblxuICAvLyBTYXZlIHRoZSBwcmV2aW91cyB2YWx1ZSBvZiB0aGUgYF9gIHZhcmlhYmxlLlxuICB2YXIgcHJldmlvdXNVbmRlcnNjb3JlID0gcm9vdC5fO1xuXG4gIC8vIFNhdmUgYnl0ZXMgaW4gdGhlIG1pbmlmaWVkIChidXQgbm90IGd6aXBwZWQpIHZlcnNpb246XG4gIHZhciBBcnJheVByb3RvID0gQXJyYXkucHJvdG90eXBlLCBPYmpQcm90byA9IE9iamVjdC5wcm90b3R5cGUsIEZ1bmNQcm90byA9IEZ1bmN0aW9uLnByb3RvdHlwZTtcblxuICAvLyBDcmVhdGUgcXVpY2sgcmVmZXJlbmNlIHZhcmlhYmxlcyBmb3Igc3BlZWQgYWNjZXNzIHRvIGNvcmUgcHJvdG90eXBlcy5cbiAgdmFyXG4gICAgcHVzaCAgICAgICAgICAgICA9IEFycmF5UHJvdG8ucHVzaCxcbiAgICBzbGljZSAgICAgICAgICAgID0gQXJyYXlQcm90by5zbGljZSxcbiAgICB0b1N0cmluZyAgICAgICAgID0gT2JqUHJvdG8udG9TdHJpbmcsXG4gICAgaGFzT3duUHJvcGVydHkgICA9IE9ialByb3RvLmhhc093blByb3BlcnR5O1xuXG4gIC8vIEFsbCAqKkVDTUFTY3JpcHQgNSoqIG5hdGl2ZSBmdW5jdGlvbiBpbXBsZW1lbnRhdGlvbnMgdGhhdCB3ZSBob3BlIHRvIHVzZVxuICAvLyBhcmUgZGVjbGFyZWQgaGVyZS5cbiAgdmFyXG4gICAgbmF0aXZlSXNBcnJheSAgICAgID0gQXJyYXkuaXNBcnJheSxcbiAgICBuYXRpdmVLZXlzICAgICAgICAgPSBPYmplY3Qua2V5cyxcbiAgICBuYXRpdmVCaW5kICAgICAgICAgPSBGdW5jUHJvdG8uYmluZCxcbiAgICBuYXRpdmVDcmVhdGUgICAgICAgPSBPYmplY3QuY3JlYXRlO1xuXG4gIC8vIE5ha2VkIGZ1bmN0aW9uIHJlZmVyZW5jZSBmb3Igc3Vycm9nYXRlLXByb3RvdHlwZS1zd2FwcGluZy5cbiAgdmFyIEN0b3IgPSBmdW5jdGlvbigpe307XG5cbiAgLy8gQ3JlYXRlIGEgc2FmZSByZWZlcmVuY2UgdG8gdGhlIFVuZGVyc2NvcmUgb2JqZWN0IGZvciB1c2UgYmVsb3cuXG4gIHZhciBfID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKG9iaiBpbnN0YW5jZW9mIF8pIHJldHVybiBvYmo7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIF8pKSByZXR1cm4gbmV3IF8ob2JqKTtcbiAgICB0aGlzLl93cmFwcGVkID0gb2JqO1xuICB9O1xuXG4gIC8vIEV4cG9ydCB0aGUgVW5kZXJzY29yZSBvYmplY3QgZm9yICoqTm9kZS5qcyoqLCB3aXRoXG4gIC8vIGJhY2t3YXJkcy1jb21wYXRpYmlsaXR5IGZvciB0aGUgb2xkIGByZXF1aXJlKClgIEFQSS4gSWYgd2UncmUgaW5cbiAgLy8gdGhlIGJyb3dzZXIsIGFkZCBgX2AgYXMgYSBnbG9iYWwgb2JqZWN0LlxuICBpZiAodHlwZW9mIGV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgICBleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBfO1xuICAgIH1cbiAgICBleHBvcnRzLl8gPSBfO1xuICB9IGVsc2Uge1xuICAgIHJvb3QuXyA9IF87XG4gIH1cblxuICAvLyBDdXJyZW50IHZlcnNpb24uXG4gIF8uVkVSU0lPTiA9ICcxLjguMyc7XG5cbiAgLy8gSW50ZXJuYWwgZnVuY3Rpb24gdGhhdCByZXR1cm5zIGFuIGVmZmljaWVudCAoZm9yIGN1cnJlbnQgZW5naW5lcykgdmVyc2lvblxuICAvLyBvZiB0aGUgcGFzc2VkLWluIGNhbGxiYWNrLCB0byBiZSByZXBlYXRlZGx5IGFwcGxpZWQgaW4gb3RoZXIgVW5kZXJzY29yZVxuICAvLyBmdW5jdGlvbnMuXG4gIHZhciBvcHRpbWl6ZUNiID0gZnVuY3Rpb24oZnVuYywgY29udGV4dCwgYXJnQ291bnQpIHtcbiAgICBpZiAoY29udGV4dCA9PT0gdm9pZCAwKSByZXR1cm4gZnVuYztcbiAgICBzd2l0Y2ggKGFyZ0NvdW50ID09IG51bGwgPyAzIDogYXJnQ291bnQpIHtcbiAgICAgIGNhc2UgMTogcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBmdW5jLmNhbGwoY29udGV4dCwgdmFsdWUpO1xuICAgICAgfTtcbiAgICAgIGNhc2UgMjogcmV0dXJuIGZ1bmN0aW9uKHZhbHVlLCBvdGhlcikge1xuICAgICAgICByZXR1cm4gZnVuYy5jYWxsKGNvbnRleHQsIHZhbHVlLCBvdGhlcik7XG4gICAgICB9O1xuICAgICAgY2FzZSAzOiByZXR1cm4gZnVuY3Rpb24odmFsdWUsIGluZGV4LCBjb2xsZWN0aW9uKSB7XG4gICAgICAgIHJldHVybiBmdW5jLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBjb2xsZWN0aW9uKTtcbiAgICAgIH07XG4gICAgICBjYXNlIDQ6IHJldHVybiBmdW5jdGlvbihhY2N1bXVsYXRvciwgdmFsdWUsIGluZGV4LCBjb2xsZWN0aW9uKSB7XG4gICAgICAgIHJldHVybiBmdW5jLmNhbGwoY29udGV4dCwgYWNjdW11bGF0b3IsIHZhbHVlLCBpbmRleCwgY29sbGVjdGlvbik7XG4gICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZnVuYy5hcHBseShjb250ZXh0LCBhcmd1bWVudHMpO1xuICAgIH07XG4gIH07XG5cbiAgLy8gQSBtb3N0bHktaW50ZXJuYWwgZnVuY3Rpb24gdG8gZ2VuZXJhdGUgY2FsbGJhY2tzIHRoYXQgY2FuIGJlIGFwcGxpZWRcbiAgLy8gdG8gZWFjaCBlbGVtZW50IGluIGEgY29sbGVjdGlvbiwgcmV0dXJuaW5nIHRoZSBkZXNpcmVkIHJlc3VsdCDigJQgZWl0aGVyXG4gIC8vIGlkZW50aXR5LCBhbiBhcmJpdHJhcnkgY2FsbGJhY2ssIGEgcHJvcGVydHkgbWF0Y2hlciwgb3IgYSBwcm9wZXJ0eSBhY2Nlc3Nvci5cbiAgdmFyIGNiID0gZnVuY3Rpb24odmFsdWUsIGNvbnRleHQsIGFyZ0NvdW50KSB7XG4gICAgaWYgKHZhbHVlID09IG51bGwpIHJldHVybiBfLmlkZW50aXR5O1xuICAgIGlmIChfLmlzRnVuY3Rpb24odmFsdWUpKSByZXR1cm4gb3B0aW1pemVDYih2YWx1ZSwgY29udGV4dCwgYXJnQ291bnQpO1xuICAgIGlmIChfLmlzT2JqZWN0KHZhbHVlKSkgcmV0dXJuIF8ubWF0Y2hlcih2YWx1ZSk7XG4gICAgcmV0dXJuIF8ucHJvcGVydHkodmFsdWUpO1xuICB9O1xuICBfLml0ZXJhdGVlID0gZnVuY3Rpb24odmFsdWUsIGNvbnRleHQpIHtcbiAgICByZXR1cm4gY2IodmFsdWUsIGNvbnRleHQsIEluZmluaXR5KTtcbiAgfTtcblxuICAvLyBBbiBpbnRlcm5hbCBmdW5jdGlvbiBmb3IgY3JlYXRpbmcgYXNzaWduZXIgZnVuY3Rpb25zLlxuICB2YXIgY3JlYXRlQXNzaWduZXIgPSBmdW5jdGlvbihrZXlzRnVuYywgdW5kZWZpbmVkT25seSkge1xuICAgIHJldHVybiBmdW5jdGlvbihvYmopIHtcbiAgICAgIHZhciBsZW5ndGggPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgICAgaWYgKGxlbmd0aCA8IDIgfHwgb2JqID09IG51bGwpIHJldHVybiBvYmo7XG4gICAgICBmb3IgKHZhciBpbmRleCA9IDE7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgIHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaW5kZXhdLFxuICAgICAgICAgICAga2V5cyA9IGtleXNGdW5jKHNvdXJjZSksXG4gICAgICAgICAgICBsID0ga2V5cy5sZW5ndGg7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgdmFyIGtleSA9IGtleXNbaV07XG4gICAgICAgICAgaWYgKCF1bmRlZmluZWRPbmx5IHx8IG9ialtrZXldID09PSB2b2lkIDApIG9ialtrZXldID0gc291cmNlW2tleV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBvYmo7XG4gICAgfTtcbiAgfTtcblxuICAvLyBBbiBpbnRlcm5hbCBmdW5jdGlvbiBmb3IgY3JlYXRpbmcgYSBuZXcgb2JqZWN0IHRoYXQgaW5oZXJpdHMgZnJvbSBhbm90aGVyLlxuICB2YXIgYmFzZUNyZWF0ZSA9IGZ1bmN0aW9uKHByb3RvdHlwZSkge1xuICAgIGlmICghXy5pc09iamVjdChwcm90b3R5cGUpKSByZXR1cm4ge307XG4gICAgaWYgKG5hdGl2ZUNyZWF0ZSkgcmV0dXJuIG5hdGl2ZUNyZWF0ZShwcm90b3R5cGUpO1xuICAgIEN0b3IucHJvdG90eXBlID0gcHJvdG90eXBlO1xuICAgIHZhciByZXN1bHQgPSBuZXcgQ3RvcjtcbiAgICBDdG9yLnByb3RvdHlwZSA9IG51bGw7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICB2YXIgcHJvcGVydHkgPSBmdW5jdGlvbihrZXkpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gb2JqID09IG51bGwgPyB2b2lkIDAgOiBvYmpba2V5XTtcbiAgICB9O1xuICB9O1xuXG4gIC8vIEhlbHBlciBmb3IgY29sbGVjdGlvbiBtZXRob2RzIHRvIGRldGVybWluZSB3aGV0aGVyIGEgY29sbGVjdGlvblxuICAvLyBzaG91bGQgYmUgaXRlcmF0ZWQgYXMgYW4gYXJyYXkgb3IgYXMgYW4gb2JqZWN0XG4gIC8vIFJlbGF0ZWQ6IGh0dHA6Ly9wZW9wbGUubW96aWxsYS5vcmcvfmpvcmVuZG9yZmYvZXM2LWRyYWZ0Lmh0bWwjc2VjLXRvbGVuZ3RoXG4gIC8vIEF2b2lkcyBhIHZlcnkgbmFzdHkgaU9TIDggSklUIGJ1ZyBvbiBBUk0tNjQuICMyMDk0XG4gIHZhciBNQVhfQVJSQVlfSU5ERVggPSBNYXRoLnBvdygyLCA1MykgLSAxO1xuICB2YXIgZ2V0TGVuZ3RoID0gcHJvcGVydHkoJ2xlbmd0aCcpO1xuICB2YXIgaXNBcnJheUxpa2UgPSBmdW5jdGlvbihjb2xsZWN0aW9uKSB7XG4gICAgdmFyIGxlbmd0aCA9IGdldExlbmd0aChjb2xsZWN0aW9uKTtcbiAgICByZXR1cm4gdHlwZW9mIGxlbmd0aCA9PSAnbnVtYmVyJyAmJiBsZW5ndGggPj0gMCAmJiBsZW5ndGggPD0gTUFYX0FSUkFZX0lOREVYO1xuICB9O1xuXG4gIC8vIENvbGxlY3Rpb24gRnVuY3Rpb25zXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gVGhlIGNvcm5lcnN0b25lLCBhbiBgZWFjaGAgaW1wbGVtZW50YXRpb24sIGFrYSBgZm9yRWFjaGAuXG4gIC8vIEhhbmRsZXMgcmF3IG9iamVjdHMgaW4gYWRkaXRpb24gdG8gYXJyYXktbGlrZXMuIFRyZWF0cyBhbGxcbiAgLy8gc3BhcnNlIGFycmF5LWxpa2VzIGFzIGlmIHRoZXkgd2VyZSBkZW5zZS5cbiAgXy5lYWNoID0gXy5mb3JFYWNoID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRlZSwgY29udGV4dCkge1xuICAgIGl0ZXJhdGVlID0gb3B0aW1pemVDYihpdGVyYXRlZSwgY29udGV4dCk7XG4gICAgdmFyIGksIGxlbmd0aDtcbiAgICBpZiAoaXNBcnJheUxpa2Uob2JqKSkge1xuICAgICAgZm9yIChpID0gMCwgbGVuZ3RoID0gb2JqLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGl0ZXJhdGVlKG9ialtpXSwgaSwgb2JqKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGtleXMgPSBfLmtleXMob2JqKTtcbiAgICAgIGZvciAoaSA9IDAsIGxlbmd0aCA9IGtleXMubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaXRlcmF0ZWUob2JqW2tleXNbaV1dLCBrZXlzW2ldLCBvYmopO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb2JqO1xuICB9O1xuXG4gIC8vIFJldHVybiB0aGUgcmVzdWx0cyBvZiBhcHBseWluZyB0aGUgaXRlcmF0ZWUgdG8gZWFjaCBlbGVtZW50LlxuICBfLm1hcCA9IF8uY29sbGVjdCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0ZWUsIGNvbnRleHQpIHtcbiAgICBpdGVyYXRlZSA9IGNiKGl0ZXJhdGVlLCBjb250ZXh0KTtcbiAgICB2YXIga2V5cyA9ICFpc0FycmF5TGlrZShvYmopICYmIF8ua2V5cyhvYmopLFxuICAgICAgICBsZW5ndGggPSAoa2V5cyB8fCBvYmopLmxlbmd0aCxcbiAgICAgICAgcmVzdWx0cyA9IEFycmF5KGxlbmd0aCk7XG4gICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IGxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgdmFyIGN1cnJlbnRLZXkgPSBrZXlzID8ga2V5c1tpbmRleF0gOiBpbmRleDtcbiAgICAgIHJlc3VsdHNbaW5kZXhdID0gaXRlcmF0ZWUob2JqW2N1cnJlbnRLZXldLCBjdXJyZW50S2V5LCBvYmopO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfTtcblxuICAvLyBDcmVhdGUgYSByZWR1Y2luZyBmdW5jdGlvbiBpdGVyYXRpbmcgbGVmdCBvciByaWdodC5cbiAgZnVuY3Rpb24gY3JlYXRlUmVkdWNlKGRpcikge1xuICAgIC8vIE9wdGltaXplZCBpdGVyYXRvciBmdW5jdGlvbiBhcyB1c2luZyBhcmd1bWVudHMubGVuZ3RoXG4gICAgLy8gaW4gdGhlIG1haW4gZnVuY3Rpb24gd2lsbCBkZW9wdGltaXplIHRoZSwgc2VlICMxOTkxLlxuICAgIGZ1bmN0aW9uIGl0ZXJhdG9yKG9iaiwgaXRlcmF0ZWUsIG1lbW8sIGtleXMsIGluZGV4LCBsZW5ndGgpIHtcbiAgICAgIGZvciAoOyBpbmRleCA+PSAwICYmIGluZGV4IDwgbGVuZ3RoOyBpbmRleCArPSBkaXIpIHtcbiAgICAgICAgdmFyIGN1cnJlbnRLZXkgPSBrZXlzID8ga2V5c1tpbmRleF0gOiBpbmRleDtcbiAgICAgICAgbWVtbyA9IGl0ZXJhdGVlKG1lbW8sIG9ialtjdXJyZW50S2V5XSwgY3VycmVudEtleSwgb2JqKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBtZW1vO1xuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbihvYmosIGl0ZXJhdGVlLCBtZW1vLCBjb250ZXh0KSB7XG4gICAgICBpdGVyYXRlZSA9IG9wdGltaXplQ2IoaXRlcmF0ZWUsIGNvbnRleHQsIDQpO1xuICAgICAgdmFyIGtleXMgPSAhaXNBcnJheUxpa2Uob2JqKSAmJiBfLmtleXMob2JqKSxcbiAgICAgICAgICBsZW5ndGggPSAoa2V5cyB8fCBvYmopLmxlbmd0aCxcbiAgICAgICAgICBpbmRleCA9IGRpciA+IDAgPyAwIDogbGVuZ3RoIC0gMTtcbiAgICAgIC8vIERldGVybWluZSB0aGUgaW5pdGlhbCB2YWx1ZSBpZiBub25lIGlzIHByb3ZpZGVkLlxuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCAzKSB7XG4gICAgICAgIG1lbW8gPSBvYmpba2V5cyA/IGtleXNbaW5kZXhdIDogaW5kZXhdO1xuICAgICAgICBpbmRleCArPSBkaXI7XG4gICAgICB9XG4gICAgICByZXR1cm4gaXRlcmF0b3Iob2JqLCBpdGVyYXRlZSwgbWVtbywga2V5cywgaW5kZXgsIGxlbmd0aCk7XG4gICAgfTtcbiAgfVxuXG4gIC8vICoqUmVkdWNlKiogYnVpbGRzIHVwIGEgc2luZ2xlIHJlc3VsdCBmcm9tIGEgbGlzdCBvZiB2YWx1ZXMsIGFrYSBgaW5qZWN0YCxcbiAgLy8gb3IgYGZvbGRsYC5cbiAgXy5yZWR1Y2UgPSBfLmZvbGRsID0gXy5pbmplY3QgPSBjcmVhdGVSZWR1Y2UoMSk7XG5cbiAgLy8gVGhlIHJpZ2h0LWFzc29jaWF0aXZlIHZlcnNpb24gb2YgcmVkdWNlLCBhbHNvIGtub3duIGFzIGBmb2xkcmAuXG4gIF8ucmVkdWNlUmlnaHQgPSBfLmZvbGRyID0gY3JlYXRlUmVkdWNlKC0xKTtcblxuICAvLyBSZXR1cm4gdGhlIGZpcnN0IHZhbHVlIHdoaWNoIHBhc3NlcyBhIHRydXRoIHRlc3QuIEFsaWFzZWQgYXMgYGRldGVjdGAuXG4gIF8uZmluZCA9IF8uZGV0ZWN0ID0gZnVuY3Rpb24ob2JqLCBwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICB2YXIga2V5O1xuICAgIGlmIChpc0FycmF5TGlrZShvYmopKSB7XG4gICAgICBrZXkgPSBfLmZpbmRJbmRleChvYmosIHByZWRpY2F0ZSwgY29udGV4dCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGtleSA9IF8uZmluZEtleShvYmosIHByZWRpY2F0ZSwgY29udGV4dCk7XG4gICAgfVxuICAgIGlmIChrZXkgIT09IHZvaWQgMCAmJiBrZXkgIT09IC0xKSByZXR1cm4gb2JqW2tleV07XG4gIH07XG5cbiAgLy8gUmV0dXJuIGFsbCB0aGUgZWxlbWVudHMgdGhhdCBwYXNzIGEgdHJ1dGggdGVzdC5cbiAgLy8gQWxpYXNlZCBhcyBgc2VsZWN0YC5cbiAgXy5maWx0ZXIgPSBfLnNlbGVjdCA9IGZ1bmN0aW9uKG9iaiwgcHJlZGljYXRlLCBjb250ZXh0KSB7XG4gICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICBwcmVkaWNhdGUgPSBjYihwcmVkaWNhdGUsIGNvbnRleHQpO1xuICAgIF8uZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgaWYgKHByZWRpY2F0ZSh2YWx1ZSwgaW5kZXgsIGxpc3QpKSByZXN1bHRzLnB1c2godmFsdWUpO1xuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHRzO1xuICB9O1xuXG4gIC8vIFJldHVybiBhbGwgdGhlIGVsZW1lbnRzIGZvciB3aGljaCBhIHRydXRoIHRlc3QgZmFpbHMuXG4gIF8ucmVqZWN0ID0gZnVuY3Rpb24ob2JqLCBwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICByZXR1cm4gXy5maWx0ZXIob2JqLCBfLm5lZ2F0ZShjYihwcmVkaWNhdGUpKSwgY29udGV4dCk7XG4gIH07XG5cbiAgLy8gRGV0ZXJtaW5lIHdoZXRoZXIgYWxsIG9mIHRoZSBlbGVtZW50cyBtYXRjaCBhIHRydXRoIHRlc3QuXG4gIC8vIEFsaWFzZWQgYXMgYGFsbGAuXG4gIF8uZXZlcnkgPSBfLmFsbCA9IGZ1bmN0aW9uKG9iaiwgcHJlZGljYXRlLCBjb250ZXh0KSB7XG4gICAgcHJlZGljYXRlID0gY2IocHJlZGljYXRlLCBjb250ZXh0KTtcbiAgICB2YXIga2V5cyA9ICFpc0FycmF5TGlrZShvYmopICYmIF8ua2V5cyhvYmopLFxuICAgICAgICBsZW5ndGggPSAoa2V5cyB8fCBvYmopLmxlbmd0aDtcbiAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICB2YXIgY3VycmVudEtleSA9IGtleXMgPyBrZXlzW2luZGV4XSA6IGluZGV4O1xuICAgICAgaWYgKCFwcmVkaWNhdGUob2JqW2N1cnJlbnRLZXldLCBjdXJyZW50S2V5LCBvYmopKSByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9O1xuXG4gIC8vIERldGVybWluZSBpZiBhdCBsZWFzdCBvbmUgZWxlbWVudCBpbiB0aGUgb2JqZWN0IG1hdGNoZXMgYSB0cnV0aCB0ZXN0LlxuICAvLyBBbGlhc2VkIGFzIGBhbnlgLlxuICBfLnNvbWUgPSBfLmFueSA9IGZ1bmN0aW9uKG9iaiwgcHJlZGljYXRlLCBjb250ZXh0KSB7XG4gICAgcHJlZGljYXRlID0gY2IocHJlZGljYXRlLCBjb250ZXh0KTtcbiAgICB2YXIga2V5cyA9ICFpc0FycmF5TGlrZShvYmopICYmIF8ua2V5cyhvYmopLFxuICAgICAgICBsZW5ndGggPSAoa2V5cyB8fCBvYmopLmxlbmd0aDtcbiAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICB2YXIgY3VycmVudEtleSA9IGtleXMgPyBrZXlzW2luZGV4XSA6IGluZGV4O1xuICAgICAgaWYgKHByZWRpY2F0ZShvYmpbY3VycmVudEtleV0sIGN1cnJlbnRLZXksIG9iaikpIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH07XG5cbiAgLy8gRGV0ZXJtaW5lIGlmIHRoZSBhcnJheSBvciBvYmplY3QgY29udGFpbnMgYSBnaXZlbiBpdGVtICh1c2luZyBgPT09YCkuXG4gIC8vIEFsaWFzZWQgYXMgYGluY2x1ZGVzYCBhbmQgYGluY2x1ZGVgLlxuICBfLmNvbnRhaW5zID0gXy5pbmNsdWRlcyA9IF8uaW5jbHVkZSA9IGZ1bmN0aW9uKG9iaiwgaXRlbSwgZnJvbUluZGV4LCBndWFyZCkge1xuICAgIGlmICghaXNBcnJheUxpa2Uob2JqKSkgb2JqID0gXy52YWx1ZXMob2JqKTtcbiAgICBpZiAodHlwZW9mIGZyb21JbmRleCAhPSAnbnVtYmVyJyB8fCBndWFyZCkgZnJvbUluZGV4ID0gMDtcbiAgICByZXR1cm4gXy5pbmRleE9mKG9iaiwgaXRlbSwgZnJvbUluZGV4KSA+PSAwO1xuICB9O1xuXG4gIC8vIEludm9rZSBhIG1ldGhvZCAod2l0aCBhcmd1bWVudHMpIG9uIGV2ZXJ5IGl0ZW0gaW4gYSBjb2xsZWN0aW9uLlxuICBfLmludm9rZSA9IGZ1bmN0aW9uKG9iaiwgbWV0aG9kKSB7XG4gICAgdmFyIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMik7XG4gICAgdmFyIGlzRnVuYyA9IF8uaXNGdW5jdGlvbihtZXRob2QpO1xuICAgIHJldHVybiBfLm1hcChvYmosIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICB2YXIgZnVuYyA9IGlzRnVuYyA/IG1ldGhvZCA6IHZhbHVlW21ldGhvZF07XG4gICAgICByZXR1cm4gZnVuYyA9PSBudWxsID8gZnVuYyA6IGZ1bmMuYXBwbHkodmFsdWUsIGFyZ3MpO1xuICAgIH0pO1xuICB9O1xuXG4gIC8vIENvbnZlbmllbmNlIHZlcnNpb24gb2YgYSBjb21tb24gdXNlIGNhc2Ugb2YgYG1hcGA6IGZldGNoaW5nIGEgcHJvcGVydHkuXG4gIF8ucGx1Y2sgPSBmdW5jdGlvbihvYmosIGtleSkge1xuICAgIHJldHVybiBfLm1hcChvYmosIF8ucHJvcGVydHkoa2V5KSk7XG4gIH07XG5cbiAgLy8gQ29udmVuaWVuY2UgdmVyc2lvbiBvZiBhIGNvbW1vbiB1c2UgY2FzZSBvZiBgZmlsdGVyYDogc2VsZWN0aW5nIG9ubHkgb2JqZWN0c1xuICAvLyBjb250YWluaW5nIHNwZWNpZmljIGBrZXk6dmFsdWVgIHBhaXJzLlxuICBfLndoZXJlID0gZnVuY3Rpb24ob2JqLCBhdHRycykge1xuICAgIHJldHVybiBfLmZpbHRlcihvYmosIF8ubWF0Y2hlcihhdHRycykpO1xuICB9O1xuXG4gIC8vIENvbnZlbmllbmNlIHZlcnNpb24gb2YgYSBjb21tb24gdXNlIGNhc2Ugb2YgYGZpbmRgOiBnZXR0aW5nIHRoZSBmaXJzdCBvYmplY3RcbiAgLy8gY29udGFpbmluZyBzcGVjaWZpYyBga2V5OnZhbHVlYCBwYWlycy5cbiAgXy5maW5kV2hlcmUgPSBmdW5jdGlvbihvYmosIGF0dHJzKSB7XG4gICAgcmV0dXJuIF8uZmluZChvYmosIF8ubWF0Y2hlcihhdHRycykpO1xuICB9O1xuXG4gIC8vIFJldHVybiB0aGUgbWF4aW11bSBlbGVtZW50IChvciBlbGVtZW50LWJhc2VkIGNvbXB1dGF0aW9uKS5cbiAgXy5tYXggPSBmdW5jdGlvbihvYmosIGl0ZXJhdGVlLCBjb250ZXh0KSB7XG4gICAgdmFyIHJlc3VsdCA9IC1JbmZpbml0eSwgbGFzdENvbXB1dGVkID0gLUluZmluaXR5LFxuICAgICAgICB2YWx1ZSwgY29tcHV0ZWQ7XG4gICAgaWYgKGl0ZXJhdGVlID09IG51bGwgJiYgb2JqICE9IG51bGwpIHtcbiAgICAgIG9iaiA9IGlzQXJyYXlMaWtlKG9iaikgPyBvYmogOiBfLnZhbHVlcyhvYmopO1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IG9iai5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICB2YWx1ZSA9IG9ialtpXTtcbiAgICAgICAgaWYgKHZhbHVlID4gcmVzdWx0KSB7XG4gICAgICAgICAgcmVzdWx0ID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaXRlcmF0ZWUgPSBjYihpdGVyYXRlZSwgY29udGV4dCk7XG4gICAgICBfLmVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgICAgY29tcHV0ZWQgPSBpdGVyYXRlZSh2YWx1ZSwgaW5kZXgsIGxpc3QpO1xuICAgICAgICBpZiAoY29tcHV0ZWQgPiBsYXN0Q29tcHV0ZWQgfHwgY29tcHV0ZWQgPT09IC1JbmZpbml0eSAmJiByZXN1bHQgPT09IC1JbmZpbml0eSkge1xuICAgICAgICAgIHJlc3VsdCA9IHZhbHVlO1xuICAgICAgICAgIGxhc3RDb21wdXRlZCA9IGNvbXB1dGVkO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAvLyBSZXR1cm4gdGhlIG1pbmltdW0gZWxlbWVudCAob3IgZWxlbWVudC1iYXNlZCBjb21wdXRhdGlvbikuXG4gIF8ubWluID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRlZSwgY29udGV4dCkge1xuICAgIHZhciByZXN1bHQgPSBJbmZpbml0eSwgbGFzdENvbXB1dGVkID0gSW5maW5pdHksXG4gICAgICAgIHZhbHVlLCBjb21wdXRlZDtcbiAgICBpZiAoaXRlcmF0ZWUgPT0gbnVsbCAmJiBvYmogIT0gbnVsbCkge1xuICAgICAgb2JqID0gaXNBcnJheUxpa2Uob2JqKSA/IG9iaiA6IF8udmFsdWVzKG9iaik7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0gb2JqLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhbHVlID0gb2JqW2ldO1xuICAgICAgICBpZiAodmFsdWUgPCByZXN1bHQpIHtcbiAgICAgICAgICByZXN1bHQgPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpdGVyYXRlZSA9IGNiKGl0ZXJhdGVlLCBjb250ZXh0KTtcbiAgICAgIF8uZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgICBjb21wdXRlZCA9IGl0ZXJhdGVlKHZhbHVlLCBpbmRleCwgbGlzdCk7XG4gICAgICAgIGlmIChjb21wdXRlZCA8IGxhc3RDb21wdXRlZCB8fCBjb21wdXRlZCA9PT0gSW5maW5pdHkgJiYgcmVzdWx0ID09PSBJbmZpbml0eSkge1xuICAgICAgICAgIHJlc3VsdCA9IHZhbHVlO1xuICAgICAgICAgIGxhc3RDb21wdXRlZCA9IGNvbXB1dGVkO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAvLyBTaHVmZmxlIGEgY29sbGVjdGlvbiwgdXNpbmcgdGhlIG1vZGVybiB2ZXJzaW9uIG9mIHRoZVxuICAvLyBbRmlzaGVyLVlhdGVzIHNodWZmbGVdKGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvRmlzaGVy4oCTWWF0ZXNfc2h1ZmZsZSkuXG4gIF8uc2h1ZmZsZSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBzZXQgPSBpc0FycmF5TGlrZShvYmopID8gb2JqIDogXy52YWx1ZXMob2JqKTtcbiAgICB2YXIgbGVuZ3RoID0gc2V0Lmxlbmd0aDtcbiAgICB2YXIgc2h1ZmZsZWQgPSBBcnJheShsZW5ndGgpO1xuICAgIGZvciAodmFyIGluZGV4ID0gMCwgcmFuZDsgaW5kZXggPCBsZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIHJhbmQgPSBfLnJhbmRvbSgwLCBpbmRleCk7XG4gICAgICBpZiAocmFuZCAhPT0gaW5kZXgpIHNodWZmbGVkW2luZGV4XSA9IHNodWZmbGVkW3JhbmRdO1xuICAgICAgc2h1ZmZsZWRbcmFuZF0gPSBzZXRbaW5kZXhdO1xuICAgIH1cbiAgICByZXR1cm4gc2h1ZmZsZWQ7XG4gIH07XG5cbiAgLy8gU2FtcGxlICoqbioqIHJhbmRvbSB2YWx1ZXMgZnJvbSBhIGNvbGxlY3Rpb24uXG4gIC8vIElmICoqbioqIGlzIG5vdCBzcGVjaWZpZWQsIHJldHVybnMgYSBzaW5nbGUgcmFuZG9tIGVsZW1lbnQuXG4gIC8vIFRoZSBpbnRlcm5hbCBgZ3VhcmRgIGFyZ3VtZW50IGFsbG93cyBpdCB0byB3b3JrIHdpdGggYG1hcGAuXG4gIF8uc2FtcGxlID0gZnVuY3Rpb24ob2JqLCBuLCBndWFyZCkge1xuICAgIGlmIChuID09IG51bGwgfHwgZ3VhcmQpIHtcbiAgICAgIGlmICghaXNBcnJheUxpa2Uob2JqKSkgb2JqID0gXy52YWx1ZXMob2JqKTtcbiAgICAgIHJldHVybiBvYmpbXy5yYW5kb20ob2JqLmxlbmd0aCAtIDEpXTtcbiAgICB9XG4gICAgcmV0dXJuIF8uc2h1ZmZsZShvYmopLnNsaWNlKDAsIE1hdGgubWF4KDAsIG4pKTtcbiAgfTtcblxuICAvLyBTb3J0IHRoZSBvYmplY3QncyB2YWx1ZXMgYnkgYSBjcml0ZXJpb24gcHJvZHVjZWQgYnkgYW4gaXRlcmF0ZWUuXG4gIF8uc29ydEJ5ID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRlZSwgY29udGV4dCkge1xuICAgIGl0ZXJhdGVlID0gY2IoaXRlcmF0ZWUsIGNvbnRleHQpO1xuICAgIHJldHVybiBfLnBsdWNrKF8ubWFwKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICAgIGluZGV4OiBpbmRleCxcbiAgICAgICAgY3JpdGVyaWE6IGl0ZXJhdGVlKHZhbHVlLCBpbmRleCwgbGlzdClcbiAgICAgIH07XG4gICAgfSkuc29ydChmdW5jdGlvbihsZWZ0LCByaWdodCkge1xuICAgICAgdmFyIGEgPSBsZWZ0LmNyaXRlcmlhO1xuICAgICAgdmFyIGIgPSByaWdodC5jcml0ZXJpYTtcbiAgICAgIGlmIChhICE9PSBiKSB7XG4gICAgICAgIGlmIChhID4gYiB8fCBhID09PSB2b2lkIDApIHJldHVybiAxO1xuICAgICAgICBpZiAoYSA8IGIgfHwgYiA9PT0gdm9pZCAwKSByZXR1cm4gLTE7XG4gICAgICB9XG4gICAgICByZXR1cm4gbGVmdC5pbmRleCAtIHJpZ2h0LmluZGV4O1xuICAgIH0pLCAndmFsdWUnKTtcbiAgfTtcblxuICAvLyBBbiBpbnRlcm5hbCBmdW5jdGlvbiB1c2VkIGZvciBhZ2dyZWdhdGUgXCJncm91cCBieVwiIG9wZXJhdGlvbnMuXG4gIHZhciBncm91cCA9IGZ1bmN0aW9uKGJlaGF2aW9yKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKG9iaiwgaXRlcmF0ZWUsIGNvbnRleHQpIHtcbiAgICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICAgIGl0ZXJhdGVlID0gY2IoaXRlcmF0ZWUsIGNvbnRleHQpO1xuICAgICAgXy5lYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4KSB7XG4gICAgICAgIHZhciBrZXkgPSBpdGVyYXRlZSh2YWx1ZSwgaW5kZXgsIG9iaik7XG4gICAgICAgIGJlaGF2aW9yKHJlc3VsdCwgdmFsdWUsIGtleSk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgfTtcblxuICAvLyBHcm91cHMgdGhlIG9iamVjdCdzIHZhbHVlcyBieSBhIGNyaXRlcmlvbi4gUGFzcyBlaXRoZXIgYSBzdHJpbmcgYXR0cmlidXRlXG4gIC8vIHRvIGdyb3VwIGJ5LCBvciBhIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyB0aGUgY3JpdGVyaW9uLlxuICBfLmdyb3VwQnkgPSBncm91cChmdW5jdGlvbihyZXN1bHQsIHZhbHVlLCBrZXkpIHtcbiAgICBpZiAoXy5oYXMocmVzdWx0LCBrZXkpKSByZXN1bHRba2V5XS5wdXNoKHZhbHVlKTsgZWxzZSByZXN1bHRba2V5XSA9IFt2YWx1ZV07XG4gIH0pO1xuXG4gIC8vIEluZGV4ZXMgdGhlIG9iamVjdCdzIHZhbHVlcyBieSBhIGNyaXRlcmlvbiwgc2ltaWxhciB0byBgZ3JvdXBCeWAsIGJ1dCBmb3JcbiAgLy8gd2hlbiB5b3Uga25vdyB0aGF0IHlvdXIgaW5kZXggdmFsdWVzIHdpbGwgYmUgdW5pcXVlLlxuICBfLmluZGV4QnkgPSBncm91cChmdW5jdGlvbihyZXN1bHQsIHZhbHVlLCBrZXkpIHtcbiAgICByZXN1bHRba2V5XSA9IHZhbHVlO1xuICB9KTtcblxuICAvLyBDb3VudHMgaW5zdGFuY2VzIG9mIGFuIG9iamVjdCB0aGF0IGdyb3VwIGJ5IGEgY2VydGFpbiBjcml0ZXJpb24uIFBhc3NcbiAgLy8gZWl0aGVyIGEgc3RyaW5nIGF0dHJpYnV0ZSB0byBjb3VudCBieSwgb3IgYSBmdW5jdGlvbiB0aGF0IHJldHVybnMgdGhlXG4gIC8vIGNyaXRlcmlvbi5cbiAgXy5jb3VudEJ5ID0gZ3JvdXAoZnVuY3Rpb24ocmVzdWx0LCB2YWx1ZSwga2V5KSB7XG4gICAgaWYgKF8uaGFzKHJlc3VsdCwga2V5KSkgcmVzdWx0W2tleV0rKzsgZWxzZSByZXN1bHRba2V5XSA9IDE7XG4gIH0pO1xuXG4gIC8vIFNhZmVseSBjcmVhdGUgYSByZWFsLCBsaXZlIGFycmF5IGZyb20gYW55dGhpbmcgaXRlcmFibGUuXG4gIF8udG9BcnJheSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmICghb2JqKSByZXR1cm4gW107XG4gICAgaWYgKF8uaXNBcnJheShvYmopKSByZXR1cm4gc2xpY2UuY2FsbChvYmopO1xuICAgIGlmIChpc0FycmF5TGlrZShvYmopKSByZXR1cm4gXy5tYXAob2JqLCBfLmlkZW50aXR5KTtcbiAgICByZXR1cm4gXy52YWx1ZXMob2JqKTtcbiAgfTtcblxuICAvLyBSZXR1cm4gdGhlIG51bWJlciBvZiBlbGVtZW50cyBpbiBhbiBvYmplY3QuXG4gIF8uc2l6ZSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIDA7XG4gICAgcmV0dXJuIGlzQXJyYXlMaWtlKG9iaikgPyBvYmoubGVuZ3RoIDogXy5rZXlzKG9iaikubGVuZ3RoO1xuICB9O1xuXG4gIC8vIFNwbGl0IGEgY29sbGVjdGlvbiBpbnRvIHR3byBhcnJheXM6IG9uZSB3aG9zZSBlbGVtZW50cyBhbGwgc2F0aXNmeSB0aGUgZ2l2ZW5cbiAgLy8gcHJlZGljYXRlLCBhbmQgb25lIHdob3NlIGVsZW1lbnRzIGFsbCBkbyBub3Qgc2F0aXNmeSB0aGUgcHJlZGljYXRlLlxuICBfLnBhcnRpdGlvbiA9IGZ1bmN0aW9uKG9iaiwgcHJlZGljYXRlLCBjb250ZXh0KSB7XG4gICAgcHJlZGljYXRlID0gY2IocHJlZGljYXRlLCBjb250ZXh0KTtcbiAgICB2YXIgcGFzcyA9IFtdLCBmYWlsID0gW107XG4gICAgXy5lYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGtleSwgb2JqKSB7XG4gICAgICAocHJlZGljYXRlKHZhbHVlLCBrZXksIG9iaikgPyBwYXNzIDogZmFpbCkucHVzaCh2YWx1ZSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIFtwYXNzLCBmYWlsXTtcbiAgfTtcblxuICAvLyBBcnJheSBGdW5jdGlvbnNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gR2V0IHRoZSBmaXJzdCBlbGVtZW50IG9mIGFuIGFycmF5LiBQYXNzaW5nICoqbioqIHdpbGwgcmV0dXJuIHRoZSBmaXJzdCBOXG4gIC8vIHZhbHVlcyBpbiB0aGUgYXJyYXkuIEFsaWFzZWQgYXMgYGhlYWRgIGFuZCBgdGFrZWAuIFRoZSAqKmd1YXJkKiogY2hlY2tcbiAgLy8gYWxsb3dzIGl0IHRvIHdvcmsgd2l0aCBgXy5tYXBgLlxuICBfLmZpcnN0ID0gXy5oZWFkID0gXy50YWtlID0gZnVuY3Rpb24oYXJyYXksIG4sIGd1YXJkKSB7XG4gICAgaWYgKGFycmF5ID09IG51bGwpIHJldHVybiB2b2lkIDA7XG4gICAgaWYgKG4gPT0gbnVsbCB8fCBndWFyZCkgcmV0dXJuIGFycmF5WzBdO1xuICAgIHJldHVybiBfLmluaXRpYWwoYXJyYXksIGFycmF5Lmxlbmd0aCAtIG4pO1xuICB9O1xuXG4gIC8vIFJldHVybnMgZXZlcnl0aGluZyBidXQgdGhlIGxhc3QgZW50cnkgb2YgdGhlIGFycmF5LiBFc3BlY2lhbGx5IHVzZWZ1bCBvblxuICAvLyB0aGUgYXJndW1lbnRzIG9iamVjdC4gUGFzc2luZyAqKm4qKiB3aWxsIHJldHVybiBhbGwgdGhlIHZhbHVlcyBpblxuICAvLyB0aGUgYXJyYXksIGV4Y2x1ZGluZyB0aGUgbGFzdCBOLlxuICBfLmluaXRpYWwgPSBmdW5jdGlvbihhcnJheSwgbiwgZ3VhcmQpIHtcbiAgICByZXR1cm4gc2xpY2UuY2FsbChhcnJheSwgMCwgTWF0aC5tYXgoMCwgYXJyYXkubGVuZ3RoIC0gKG4gPT0gbnVsbCB8fCBndWFyZCA/IDEgOiBuKSkpO1xuICB9O1xuXG4gIC8vIEdldCB0aGUgbGFzdCBlbGVtZW50IG9mIGFuIGFycmF5LiBQYXNzaW5nICoqbioqIHdpbGwgcmV0dXJuIHRoZSBsYXN0IE5cbiAgLy8gdmFsdWVzIGluIHRoZSBhcnJheS5cbiAgXy5sYXN0ID0gZnVuY3Rpb24oYXJyYXksIG4sIGd1YXJkKSB7XG4gICAgaWYgKGFycmF5ID09IG51bGwpIHJldHVybiB2b2lkIDA7XG4gICAgaWYgKG4gPT0gbnVsbCB8fCBndWFyZCkgcmV0dXJuIGFycmF5W2FycmF5Lmxlbmd0aCAtIDFdO1xuICAgIHJldHVybiBfLnJlc3QoYXJyYXksIE1hdGgubWF4KDAsIGFycmF5Lmxlbmd0aCAtIG4pKTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIGV2ZXJ5dGhpbmcgYnV0IHRoZSBmaXJzdCBlbnRyeSBvZiB0aGUgYXJyYXkuIEFsaWFzZWQgYXMgYHRhaWxgIGFuZCBgZHJvcGAuXG4gIC8vIEVzcGVjaWFsbHkgdXNlZnVsIG9uIHRoZSBhcmd1bWVudHMgb2JqZWN0LiBQYXNzaW5nIGFuICoqbioqIHdpbGwgcmV0dXJuXG4gIC8vIHRoZSByZXN0IE4gdmFsdWVzIGluIHRoZSBhcnJheS5cbiAgXy5yZXN0ID0gXy50YWlsID0gXy5kcm9wID0gZnVuY3Rpb24oYXJyYXksIG4sIGd1YXJkKSB7XG4gICAgcmV0dXJuIHNsaWNlLmNhbGwoYXJyYXksIG4gPT0gbnVsbCB8fCBndWFyZCA/IDEgOiBuKTtcbiAgfTtcblxuICAvLyBUcmltIG91dCBhbGwgZmFsc3kgdmFsdWVzIGZyb20gYW4gYXJyYXkuXG4gIF8uY29tcGFjdCA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgcmV0dXJuIF8uZmlsdGVyKGFycmF5LCBfLmlkZW50aXR5KTtcbiAgfTtcblxuICAvLyBJbnRlcm5hbCBpbXBsZW1lbnRhdGlvbiBvZiBhIHJlY3Vyc2l2ZSBgZmxhdHRlbmAgZnVuY3Rpb24uXG4gIHZhciBmbGF0dGVuID0gZnVuY3Rpb24oaW5wdXQsIHNoYWxsb3csIHN0cmljdCwgc3RhcnRJbmRleCkge1xuICAgIHZhciBvdXRwdXQgPSBbXSwgaWR4ID0gMDtcbiAgICBmb3IgKHZhciBpID0gc3RhcnRJbmRleCB8fCAwLCBsZW5ndGggPSBnZXRMZW5ndGgoaW5wdXQpOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciB2YWx1ZSA9IGlucHV0W2ldO1xuICAgICAgaWYgKGlzQXJyYXlMaWtlKHZhbHVlKSAmJiAoXy5pc0FycmF5KHZhbHVlKSB8fCBfLmlzQXJndW1lbnRzKHZhbHVlKSkpIHtcbiAgICAgICAgLy9mbGF0dGVuIGN1cnJlbnQgbGV2ZWwgb2YgYXJyYXkgb3IgYXJndW1lbnRzIG9iamVjdFxuICAgICAgICBpZiAoIXNoYWxsb3cpIHZhbHVlID0gZmxhdHRlbih2YWx1ZSwgc2hhbGxvdywgc3RyaWN0KTtcbiAgICAgICAgdmFyIGogPSAwLCBsZW4gPSB2YWx1ZS5sZW5ndGg7XG4gICAgICAgIG91dHB1dC5sZW5ndGggKz0gbGVuO1xuICAgICAgICB3aGlsZSAoaiA8IGxlbikge1xuICAgICAgICAgIG91dHB1dFtpZHgrK10gPSB2YWx1ZVtqKytdO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKCFzdHJpY3QpIHtcbiAgICAgICAgb3V0cHV0W2lkeCsrXSA9IHZhbHVlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb3V0cHV0O1xuICB9O1xuXG4gIC8vIEZsYXR0ZW4gb3V0IGFuIGFycmF5LCBlaXRoZXIgcmVjdXJzaXZlbHkgKGJ5IGRlZmF1bHQpLCBvciBqdXN0IG9uZSBsZXZlbC5cbiAgXy5mbGF0dGVuID0gZnVuY3Rpb24oYXJyYXksIHNoYWxsb3cpIHtcbiAgICByZXR1cm4gZmxhdHRlbihhcnJheSwgc2hhbGxvdywgZmFsc2UpO1xuICB9O1xuXG4gIC8vIFJldHVybiBhIHZlcnNpb24gb2YgdGhlIGFycmF5IHRoYXQgZG9lcyBub3QgY29udGFpbiB0aGUgc3BlY2lmaWVkIHZhbHVlKHMpLlxuICBfLndpdGhvdXQgPSBmdW5jdGlvbihhcnJheSkge1xuICAgIHJldHVybiBfLmRpZmZlcmVuY2UoYXJyYXksIHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSk7XG4gIH07XG5cbiAgLy8gUHJvZHVjZSBhIGR1cGxpY2F0ZS1mcmVlIHZlcnNpb24gb2YgdGhlIGFycmF5LiBJZiB0aGUgYXJyYXkgaGFzIGFscmVhZHlcbiAgLy8gYmVlbiBzb3J0ZWQsIHlvdSBoYXZlIHRoZSBvcHRpb24gb2YgdXNpbmcgYSBmYXN0ZXIgYWxnb3JpdGhtLlxuICAvLyBBbGlhc2VkIGFzIGB1bmlxdWVgLlxuICBfLnVuaXEgPSBfLnVuaXF1ZSA9IGZ1bmN0aW9uKGFycmF5LCBpc1NvcnRlZCwgaXRlcmF0ZWUsIGNvbnRleHQpIHtcbiAgICBpZiAoIV8uaXNCb29sZWFuKGlzU29ydGVkKSkge1xuICAgICAgY29udGV4dCA9IGl0ZXJhdGVlO1xuICAgICAgaXRlcmF0ZWUgPSBpc1NvcnRlZDtcbiAgICAgIGlzU29ydGVkID0gZmFsc2U7XG4gICAgfVxuICAgIGlmIChpdGVyYXRlZSAhPSBudWxsKSBpdGVyYXRlZSA9IGNiKGl0ZXJhdGVlLCBjb250ZXh0KTtcbiAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgdmFyIHNlZW4gPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0gZ2V0TGVuZ3RoKGFycmF5KTsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgdmFsdWUgPSBhcnJheVtpXSxcbiAgICAgICAgICBjb21wdXRlZCA9IGl0ZXJhdGVlID8gaXRlcmF0ZWUodmFsdWUsIGksIGFycmF5KSA6IHZhbHVlO1xuICAgICAgaWYgKGlzU29ydGVkKSB7XG4gICAgICAgIGlmICghaSB8fCBzZWVuICE9PSBjb21wdXRlZCkgcmVzdWx0LnB1c2godmFsdWUpO1xuICAgICAgICBzZWVuID0gY29tcHV0ZWQ7XG4gICAgICB9IGVsc2UgaWYgKGl0ZXJhdGVlKSB7XG4gICAgICAgIGlmICghXy5jb250YWlucyhzZWVuLCBjb21wdXRlZCkpIHtcbiAgICAgICAgICBzZWVuLnB1c2goY29tcHV0ZWQpO1xuICAgICAgICAgIHJlc3VsdC5wdXNoKHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICghXy5jb250YWlucyhyZXN1bHQsIHZhbHVlKSkge1xuICAgICAgICByZXN1bHQucHVzaCh2YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgLy8gUHJvZHVjZSBhbiBhcnJheSB0aGF0IGNvbnRhaW5zIHRoZSB1bmlvbjogZWFjaCBkaXN0aW5jdCBlbGVtZW50IGZyb20gYWxsIG9mXG4gIC8vIHRoZSBwYXNzZWQtaW4gYXJyYXlzLlxuICBfLnVuaW9uID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIF8udW5pcShmbGF0dGVuKGFyZ3VtZW50cywgdHJ1ZSwgdHJ1ZSkpO1xuICB9O1xuXG4gIC8vIFByb2R1Y2UgYW4gYXJyYXkgdGhhdCBjb250YWlucyBldmVyeSBpdGVtIHNoYXJlZCBiZXR3ZWVuIGFsbCB0aGVcbiAgLy8gcGFzc2VkLWluIGFycmF5cy5cbiAgXy5pbnRlcnNlY3Rpb24gPSBmdW5jdGlvbihhcnJheSkge1xuICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICB2YXIgYXJnc0xlbmd0aCA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IGdldExlbmd0aChhcnJheSk7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGl0ZW0gPSBhcnJheVtpXTtcbiAgICAgIGlmIChfLmNvbnRhaW5zKHJlc3VsdCwgaXRlbSkpIGNvbnRpbnVlO1xuICAgICAgZm9yICh2YXIgaiA9IDE7IGogPCBhcmdzTGVuZ3RoOyBqKyspIHtcbiAgICAgICAgaWYgKCFfLmNvbnRhaW5zKGFyZ3VtZW50c1tqXSwgaXRlbSkpIGJyZWFrO1xuICAgICAgfVxuICAgICAgaWYgKGogPT09IGFyZ3NMZW5ndGgpIHJlc3VsdC5wdXNoKGl0ZW0pO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIC8vIFRha2UgdGhlIGRpZmZlcmVuY2UgYmV0d2VlbiBvbmUgYXJyYXkgYW5kIGEgbnVtYmVyIG9mIG90aGVyIGFycmF5cy5cbiAgLy8gT25seSB0aGUgZWxlbWVudHMgcHJlc2VudCBpbiBqdXN0IHRoZSBmaXJzdCBhcnJheSB3aWxsIHJlbWFpbi5cbiAgXy5kaWZmZXJlbmNlID0gZnVuY3Rpb24oYXJyYXkpIHtcbiAgICB2YXIgcmVzdCA9IGZsYXR0ZW4oYXJndW1lbnRzLCB0cnVlLCB0cnVlLCAxKTtcbiAgICByZXR1cm4gXy5maWx0ZXIoYXJyYXksIGZ1bmN0aW9uKHZhbHVlKXtcbiAgICAgIHJldHVybiAhXy5jb250YWlucyhyZXN0LCB2YWx1ZSk7XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gWmlwIHRvZ2V0aGVyIG11bHRpcGxlIGxpc3RzIGludG8gYSBzaW5nbGUgYXJyYXkgLS0gZWxlbWVudHMgdGhhdCBzaGFyZVxuICAvLyBhbiBpbmRleCBnbyB0b2dldGhlci5cbiAgXy56aXAgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gXy51bnppcChhcmd1bWVudHMpO1xuICB9O1xuXG4gIC8vIENvbXBsZW1lbnQgb2YgXy56aXAuIFVuemlwIGFjY2VwdHMgYW4gYXJyYXkgb2YgYXJyYXlzIGFuZCBncm91cHNcbiAgLy8gZWFjaCBhcnJheSdzIGVsZW1lbnRzIG9uIHNoYXJlZCBpbmRpY2VzXG4gIF8udW56aXAgPSBmdW5jdGlvbihhcnJheSkge1xuICAgIHZhciBsZW5ndGggPSBhcnJheSAmJiBfLm1heChhcnJheSwgZ2V0TGVuZ3RoKS5sZW5ndGggfHwgMDtcbiAgICB2YXIgcmVzdWx0ID0gQXJyYXkobGVuZ3RoKTtcblxuICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCBsZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIHJlc3VsdFtpbmRleF0gPSBfLnBsdWNrKGFycmF5LCBpbmRleCk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgLy8gQ29udmVydHMgbGlzdHMgaW50byBvYmplY3RzLiBQYXNzIGVpdGhlciBhIHNpbmdsZSBhcnJheSBvZiBgW2tleSwgdmFsdWVdYFxuICAvLyBwYWlycywgb3IgdHdvIHBhcmFsbGVsIGFycmF5cyBvZiB0aGUgc2FtZSBsZW5ndGggLS0gb25lIG9mIGtleXMsIGFuZCBvbmUgb2ZcbiAgLy8gdGhlIGNvcnJlc3BvbmRpbmcgdmFsdWVzLlxuICBfLm9iamVjdCA9IGZ1bmN0aW9uKGxpc3QsIHZhbHVlcykge1xuICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0gZ2V0TGVuZ3RoKGxpc3QpOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh2YWx1ZXMpIHtcbiAgICAgICAgcmVzdWx0W2xpc3RbaV1dID0gdmFsdWVzW2ldO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzdWx0W2xpc3RbaV1bMF1dID0gbGlzdFtpXVsxXTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAvLyBHZW5lcmF0b3IgZnVuY3Rpb24gdG8gY3JlYXRlIHRoZSBmaW5kSW5kZXggYW5kIGZpbmRMYXN0SW5kZXggZnVuY3Rpb25zXG4gIGZ1bmN0aW9uIGNyZWF0ZVByZWRpY2F0ZUluZGV4RmluZGVyKGRpcikge1xuICAgIHJldHVybiBmdW5jdGlvbihhcnJheSwgcHJlZGljYXRlLCBjb250ZXh0KSB7XG4gICAgICBwcmVkaWNhdGUgPSBjYihwcmVkaWNhdGUsIGNvbnRleHQpO1xuICAgICAgdmFyIGxlbmd0aCA9IGdldExlbmd0aChhcnJheSk7XG4gICAgICB2YXIgaW5kZXggPSBkaXIgPiAwID8gMCA6IGxlbmd0aCAtIDE7XG4gICAgICBmb3IgKDsgaW5kZXggPj0gMCAmJiBpbmRleCA8IGxlbmd0aDsgaW5kZXggKz0gZGlyKSB7XG4gICAgICAgIGlmIChwcmVkaWNhdGUoYXJyYXlbaW5kZXhdLCBpbmRleCwgYXJyYXkpKSByZXR1cm4gaW5kZXg7XG4gICAgICB9XG4gICAgICByZXR1cm4gLTE7XG4gICAgfTtcbiAgfVxuXG4gIC8vIFJldHVybnMgdGhlIGZpcnN0IGluZGV4IG9uIGFuIGFycmF5LWxpa2UgdGhhdCBwYXNzZXMgYSBwcmVkaWNhdGUgdGVzdFxuICBfLmZpbmRJbmRleCA9IGNyZWF0ZVByZWRpY2F0ZUluZGV4RmluZGVyKDEpO1xuICBfLmZpbmRMYXN0SW5kZXggPSBjcmVhdGVQcmVkaWNhdGVJbmRleEZpbmRlcigtMSk7XG5cbiAgLy8gVXNlIGEgY29tcGFyYXRvciBmdW5jdGlvbiB0byBmaWd1cmUgb3V0IHRoZSBzbWFsbGVzdCBpbmRleCBhdCB3aGljaFxuICAvLyBhbiBvYmplY3Qgc2hvdWxkIGJlIGluc2VydGVkIHNvIGFzIHRvIG1haW50YWluIG9yZGVyLiBVc2VzIGJpbmFyeSBzZWFyY2guXG4gIF8uc29ydGVkSW5kZXggPSBmdW5jdGlvbihhcnJheSwgb2JqLCBpdGVyYXRlZSwgY29udGV4dCkge1xuICAgIGl0ZXJhdGVlID0gY2IoaXRlcmF0ZWUsIGNvbnRleHQsIDEpO1xuICAgIHZhciB2YWx1ZSA9IGl0ZXJhdGVlKG9iaik7XG4gICAgdmFyIGxvdyA9IDAsIGhpZ2ggPSBnZXRMZW5ndGgoYXJyYXkpO1xuICAgIHdoaWxlIChsb3cgPCBoaWdoKSB7XG4gICAgICB2YXIgbWlkID0gTWF0aC5mbG9vcigobG93ICsgaGlnaCkgLyAyKTtcbiAgICAgIGlmIChpdGVyYXRlZShhcnJheVttaWRdKSA8IHZhbHVlKSBsb3cgPSBtaWQgKyAxOyBlbHNlIGhpZ2ggPSBtaWQ7XG4gICAgfVxuICAgIHJldHVybiBsb3c7XG4gIH07XG5cbiAgLy8gR2VuZXJhdG9yIGZ1bmN0aW9uIHRvIGNyZWF0ZSB0aGUgaW5kZXhPZiBhbmQgbGFzdEluZGV4T2YgZnVuY3Rpb25zXG4gIGZ1bmN0aW9uIGNyZWF0ZUluZGV4RmluZGVyKGRpciwgcHJlZGljYXRlRmluZCwgc29ydGVkSW5kZXgpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oYXJyYXksIGl0ZW0sIGlkeCkge1xuICAgICAgdmFyIGkgPSAwLCBsZW5ndGggPSBnZXRMZW5ndGgoYXJyYXkpO1xuICAgICAgaWYgKHR5cGVvZiBpZHggPT0gJ251bWJlcicpIHtcbiAgICAgICAgaWYgKGRpciA+IDApIHtcbiAgICAgICAgICAgIGkgPSBpZHggPj0gMCA/IGlkeCA6IE1hdGgubWF4KGlkeCArIGxlbmd0aCwgaSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsZW5ndGggPSBpZHggPj0gMCA/IE1hdGgubWluKGlkeCArIDEsIGxlbmd0aCkgOiBpZHggKyBsZW5ndGggKyAxO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHNvcnRlZEluZGV4ICYmIGlkeCAmJiBsZW5ndGgpIHtcbiAgICAgICAgaWR4ID0gc29ydGVkSW5kZXgoYXJyYXksIGl0ZW0pO1xuICAgICAgICByZXR1cm4gYXJyYXlbaWR4XSA9PT0gaXRlbSA/IGlkeCA6IC0xO1xuICAgICAgfVxuICAgICAgaWYgKGl0ZW0gIT09IGl0ZW0pIHtcbiAgICAgICAgaWR4ID0gcHJlZGljYXRlRmluZChzbGljZS5jYWxsKGFycmF5LCBpLCBsZW5ndGgpLCBfLmlzTmFOKTtcbiAgICAgICAgcmV0dXJuIGlkeCA+PSAwID8gaWR4ICsgaSA6IC0xO1xuICAgICAgfVxuICAgICAgZm9yIChpZHggPSBkaXIgPiAwID8gaSA6IGxlbmd0aCAtIDE7IGlkeCA+PSAwICYmIGlkeCA8IGxlbmd0aDsgaWR4ICs9IGRpcikge1xuICAgICAgICBpZiAoYXJyYXlbaWR4XSA9PT0gaXRlbSkgcmV0dXJuIGlkeDtcbiAgICAgIH1cbiAgICAgIHJldHVybiAtMTtcbiAgICB9O1xuICB9XG5cbiAgLy8gUmV0dXJuIHRoZSBwb3NpdGlvbiBvZiB0aGUgZmlyc3Qgb2NjdXJyZW5jZSBvZiBhbiBpdGVtIGluIGFuIGFycmF5LFxuICAvLyBvciAtMSBpZiB0aGUgaXRlbSBpcyBub3QgaW5jbHVkZWQgaW4gdGhlIGFycmF5LlxuICAvLyBJZiB0aGUgYXJyYXkgaXMgbGFyZ2UgYW5kIGFscmVhZHkgaW4gc29ydCBvcmRlciwgcGFzcyBgdHJ1ZWBcbiAgLy8gZm9yICoqaXNTb3J0ZWQqKiB0byB1c2UgYmluYXJ5IHNlYXJjaC5cbiAgXy5pbmRleE9mID0gY3JlYXRlSW5kZXhGaW5kZXIoMSwgXy5maW5kSW5kZXgsIF8uc29ydGVkSW5kZXgpO1xuICBfLmxhc3RJbmRleE9mID0gY3JlYXRlSW5kZXhGaW5kZXIoLTEsIF8uZmluZExhc3RJbmRleCk7XG5cbiAgLy8gR2VuZXJhdGUgYW4gaW50ZWdlciBBcnJheSBjb250YWluaW5nIGFuIGFyaXRobWV0aWMgcHJvZ3Jlc3Npb24uIEEgcG9ydCBvZlxuICAvLyB0aGUgbmF0aXZlIFB5dGhvbiBgcmFuZ2UoKWAgZnVuY3Rpb24uIFNlZVxuICAvLyBbdGhlIFB5dGhvbiBkb2N1bWVudGF0aW9uXShodHRwOi8vZG9jcy5weXRob24ub3JnL2xpYnJhcnkvZnVuY3Rpb25zLmh0bWwjcmFuZ2UpLlxuICBfLnJhbmdlID0gZnVuY3Rpb24oc3RhcnQsIHN0b3AsIHN0ZXApIHtcbiAgICBpZiAoc3RvcCA9PSBudWxsKSB7XG4gICAgICBzdG9wID0gc3RhcnQgfHwgMDtcbiAgICAgIHN0YXJ0ID0gMDtcbiAgICB9XG4gICAgc3RlcCA9IHN0ZXAgfHwgMTtcblxuICAgIHZhciBsZW5ndGggPSBNYXRoLm1heChNYXRoLmNlaWwoKHN0b3AgLSBzdGFydCkgLyBzdGVwKSwgMCk7XG4gICAgdmFyIHJhbmdlID0gQXJyYXkobGVuZ3RoKTtcblxuICAgIGZvciAodmFyIGlkeCA9IDA7IGlkeCA8IGxlbmd0aDsgaWR4KyssIHN0YXJ0ICs9IHN0ZXApIHtcbiAgICAgIHJhbmdlW2lkeF0gPSBzdGFydDtcbiAgICB9XG5cbiAgICByZXR1cm4gcmFuZ2U7XG4gIH07XG5cbiAgLy8gRnVuY3Rpb24gKGFoZW0pIEZ1bmN0aW9uc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBEZXRlcm1pbmVzIHdoZXRoZXIgdG8gZXhlY3V0ZSBhIGZ1bmN0aW9uIGFzIGEgY29uc3RydWN0b3JcbiAgLy8gb3IgYSBub3JtYWwgZnVuY3Rpb24gd2l0aCB0aGUgcHJvdmlkZWQgYXJndW1lbnRzXG4gIHZhciBleGVjdXRlQm91bmQgPSBmdW5jdGlvbihzb3VyY2VGdW5jLCBib3VuZEZ1bmMsIGNvbnRleHQsIGNhbGxpbmdDb250ZXh0LCBhcmdzKSB7XG4gICAgaWYgKCEoY2FsbGluZ0NvbnRleHQgaW5zdGFuY2VvZiBib3VuZEZ1bmMpKSByZXR1cm4gc291cmNlRnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICB2YXIgc2VsZiA9IGJhc2VDcmVhdGUoc291cmNlRnVuYy5wcm90b3R5cGUpO1xuICAgIHZhciByZXN1bHQgPSBzb3VyY2VGdW5jLmFwcGx5KHNlbGYsIGFyZ3MpO1xuICAgIGlmIChfLmlzT2JqZWN0KHJlc3VsdCkpIHJldHVybiByZXN1bHQ7XG4gICAgcmV0dXJuIHNlbGY7XG4gIH07XG5cbiAgLy8gQ3JlYXRlIGEgZnVuY3Rpb24gYm91bmQgdG8gYSBnaXZlbiBvYmplY3QgKGFzc2lnbmluZyBgdGhpc2AsIGFuZCBhcmd1bWVudHMsXG4gIC8vIG9wdGlvbmFsbHkpLiBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgRnVuY3Rpb24uYmluZGAgaWZcbiAgLy8gYXZhaWxhYmxlLlxuICBfLmJpbmQgPSBmdW5jdGlvbihmdW5jLCBjb250ZXh0KSB7XG4gICAgaWYgKG5hdGl2ZUJpbmQgJiYgZnVuYy5iaW5kID09PSBuYXRpdmVCaW5kKSByZXR1cm4gbmF0aXZlQmluZC5hcHBseShmdW5jLCBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xuICAgIGlmICghXy5pc0Z1bmN0aW9uKGZ1bmMpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdCaW5kIG11c3QgYmUgY2FsbGVkIG9uIGEgZnVuY3Rpb24nKTtcbiAgICB2YXIgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKTtcbiAgICB2YXIgYm91bmQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBleGVjdXRlQm91bmQoZnVuYywgYm91bmQsIGNvbnRleHQsIHRoaXMsIGFyZ3MuY29uY2F0KHNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xuICAgIH07XG4gICAgcmV0dXJuIGJvdW5kO1xuICB9O1xuXG4gIC8vIFBhcnRpYWxseSBhcHBseSBhIGZ1bmN0aW9uIGJ5IGNyZWF0aW5nIGEgdmVyc2lvbiB0aGF0IGhhcyBoYWQgc29tZSBvZiBpdHNcbiAgLy8gYXJndW1lbnRzIHByZS1maWxsZWQsIHdpdGhvdXQgY2hhbmdpbmcgaXRzIGR5bmFtaWMgYHRoaXNgIGNvbnRleHQuIF8gYWN0c1xuICAvLyBhcyBhIHBsYWNlaG9sZGVyLCBhbGxvd2luZyBhbnkgY29tYmluYXRpb24gb2YgYXJndW1lbnRzIHRvIGJlIHByZS1maWxsZWQuXG4gIF8ucGFydGlhbCA9IGZ1bmN0aW9uKGZ1bmMpIHtcbiAgICB2YXIgYm91bmRBcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgIHZhciBib3VuZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHBvc2l0aW9uID0gMCwgbGVuZ3RoID0gYm91bmRBcmdzLmxlbmd0aDtcbiAgICAgIHZhciBhcmdzID0gQXJyYXkobGVuZ3RoKTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgYXJnc1tpXSA9IGJvdW5kQXJnc1tpXSA9PT0gXyA/IGFyZ3VtZW50c1twb3NpdGlvbisrXSA6IGJvdW5kQXJnc1tpXTtcbiAgICAgIH1cbiAgICAgIHdoaWxlIChwb3NpdGlvbiA8IGFyZ3VtZW50cy5sZW5ndGgpIGFyZ3MucHVzaChhcmd1bWVudHNbcG9zaXRpb24rK10pO1xuICAgICAgcmV0dXJuIGV4ZWN1dGVCb3VuZChmdW5jLCBib3VuZCwgdGhpcywgdGhpcywgYXJncyk7XG4gICAgfTtcbiAgICByZXR1cm4gYm91bmQ7XG4gIH07XG5cbiAgLy8gQmluZCBhIG51bWJlciBvZiBhbiBvYmplY3QncyBtZXRob2RzIHRvIHRoYXQgb2JqZWN0LiBSZW1haW5pbmcgYXJndW1lbnRzXG4gIC8vIGFyZSB0aGUgbWV0aG9kIG5hbWVzIHRvIGJlIGJvdW5kLiBVc2VmdWwgZm9yIGVuc3VyaW5nIHRoYXQgYWxsIGNhbGxiYWNrc1xuICAvLyBkZWZpbmVkIG9uIGFuIG9iamVjdCBiZWxvbmcgdG8gaXQuXG4gIF8uYmluZEFsbCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBpLCBsZW5ndGggPSBhcmd1bWVudHMubGVuZ3RoLCBrZXk7XG4gICAgaWYgKGxlbmd0aCA8PSAxKSB0aHJvdyBuZXcgRXJyb3IoJ2JpbmRBbGwgbXVzdCBiZSBwYXNzZWQgZnVuY3Rpb24gbmFtZXMnKTtcbiAgICBmb3IgKGkgPSAxOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGtleSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgIG9ialtrZXldID0gXy5iaW5kKG9ialtrZXldLCBvYmopO1xuICAgIH1cbiAgICByZXR1cm4gb2JqO1xuICB9O1xuXG4gIC8vIE1lbW9pemUgYW4gZXhwZW5zaXZlIGZ1bmN0aW9uIGJ5IHN0b3JpbmcgaXRzIHJlc3VsdHMuXG4gIF8ubWVtb2l6ZSA9IGZ1bmN0aW9uKGZ1bmMsIGhhc2hlcikge1xuICAgIHZhciBtZW1vaXplID0gZnVuY3Rpb24oa2V5KSB7XG4gICAgICB2YXIgY2FjaGUgPSBtZW1vaXplLmNhY2hlO1xuICAgICAgdmFyIGFkZHJlc3MgPSAnJyArIChoYXNoZXIgPyBoYXNoZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKSA6IGtleSk7XG4gICAgICBpZiAoIV8uaGFzKGNhY2hlLCBhZGRyZXNzKSkgY2FjaGVbYWRkcmVzc10gPSBmdW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICByZXR1cm4gY2FjaGVbYWRkcmVzc107XG4gICAgfTtcbiAgICBtZW1vaXplLmNhY2hlID0ge307XG4gICAgcmV0dXJuIG1lbW9pemU7XG4gIH07XG5cbiAgLy8gRGVsYXlzIGEgZnVuY3Rpb24gZm9yIHRoZSBnaXZlbiBudW1iZXIgb2YgbWlsbGlzZWNvbmRzLCBhbmQgdGhlbiBjYWxsc1xuICAvLyBpdCB3aXRoIHRoZSBhcmd1bWVudHMgc3VwcGxpZWQuXG4gIF8uZGVsYXkgPSBmdW5jdGlvbihmdW5jLCB3YWl0KSB7XG4gICAgdmFyIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMik7XG4gICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgIHJldHVybiBmdW5jLmFwcGx5KG51bGwsIGFyZ3MpO1xuICAgIH0sIHdhaXQpO1xuICB9O1xuXG4gIC8vIERlZmVycyBhIGZ1bmN0aW9uLCBzY2hlZHVsaW5nIGl0IHRvIHJ1biBhZnRlciB0aGUgY3VycmVudCBjYWxsIHN0YWNrIGhhc1xuICAvLyBjbGVhcmVkLlxuICBfLmRlZmVyID0gXy5wYXJ0aWFsKF8uZGVsYXksIF8sIDEpO1xuXG4gIC8vIFJldHVybnMgYSBmdW5jdGlvbiwgdGhhdCwgd2hlbiBpbnZva2VkLCB3aWxsIG9ubHkgYmUgdHJpZ2dlcmVkIGF0IG1vc3Qgb25jZVxuICAvLyBkdXJpbmcgYSBnaXZlbiB3aW5kb3cgb2YgdGltZS4gTm9ybWFsbHksIHRoZSB0aHJvdHRsZWQgZnVuY3Rpb24gd2lsbCBydW5cbiAgLy8gYXMgbXVjaCBhcyBpdCBjYW4sIHdpdGhvdXQgZXZlciBnb2luZyBtb3JlIHRoYW4gb25jZSBwZXIgYHdhaXRgIGR1cmF0aW9uO1xuICAvLyBidXQgaWYgeW91J2QgbGlrZSB0byBkaXNhYmxlIHRoZSBleGVjdXRpb24gb24gdGhlIGxlYWRpbmcgZWRnZSwgcGFzc1xuICAvLyBge2xlYWRpbmc6IGZhbHNlfWAuIFRvIGRpc2FibGUgZXhlY3V0aW9uIG9uIHRoZSB0cmFpbGluZyBlZGdlLCBkaXR0by5cbiAgXy50aHJvdHRsZSA9IGZ1bmN0aW9uKGZ1bmMsIHdhaXQsIG9wdGlvbnMpIHtcbiAgICB2YXIgY29udGV4dCwgYXJncywgcmVzdWx0O1xuICAgIHZhciB0aW1lb3V0ID0gbnVsbDtcbiAgICB2YXIgcHJldmlvdXMgPSAwO1xuICAgIGlmICghb3B0aW9ucykgb3B0aW9ucyA9IHt9O1xuICAgIHZhciBsYXRlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgcHJldmlvdXMgPSBvcHRpb25zLmxlYWRpbmcgPT09IGZhbHNlID8gMCA6IF8ubm93KCk7XG4gICAgICB0aW1lb3V0ID0gbnVsbDtcbiAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICBpZiAoIXRpbWVvdXQpIGNvbnRleHQgPSBhcmdzID0gbnVsbDtcbiAgICB9O1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBub3cgPSBfLm5vdygpO1xuICAgICAgaWYgKCFwcmV2aW91cyAmJiBvcHRpb25zLmxlYWRpbmcgPT09IGZhbHNlKSBwcmV2aW91cyA9IG5vdztcbiAgICAgIHZhciByZW1haW5pbmcgPSB3YWl0IC0gKG5vdyAtIHByZXZpb3VzKTtcbiAgICAgIGNvbnRleHQgPSB0aGlzO1xuICAgICAgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgIGlmIChyZW1haW5pbmcgPD0gMCB8fCByZW1haW5pbmcgPiB3YWl0KSB7XG4gICAgICAgIGlmICh0aW1lb3V0KSB7XG4gICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgICAgIHRpbWVvdXQgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHByZXZpb3VzID0gbm93O1xuICAgICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICBpZiAoIXRpbWVvdXQpIGNvbnRleHQgPSBhcmdzID0gbnVsbDtcbiAgICAgIH0gZWxzZSBpZiAoIXRpbWVvdXQgJiYgb3B0aW9ucy50cmFpbGluZyAhPT0gZmFsc2UpIHtcbiAgICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHJlbWFpbmluZyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIGZ1bmN0aW9uLCB0aGF0LCBhcyBsb25nIGFzIGl0IGNvbnRpbnVlcyB0byBiZSBpbnZva2VkLCB3aWxsIG5vdFxuICAvLyBiZSB0cmlnZ2VyZWQuIFRoZSBmdW5jdGlvbiB3aWxsIGJlIGNhbGxlZCBhZnRlciBpdCBzdG9wcyBiZWluZyBjYWxsZWQgZm9yXG4gIC8vIE4gbWlsbGlzZWNvbmRzLiBJZiBgaW1tZWRpYXRlYCBpcyBwYXNzZWQsIHRyaWdnZXIgdGhlIGZ1bmN0aW9uIG9uIHRoZVxuICAvLyBsZWFkaW5nIGVkZ2UsIGluc3RlYWQgb2YgdGhlIHRyYWlsaW5nLlxuICBfLmRlYm91bmNlID0gZnVuY3Rpb24oZnVuYywgd2FpdCwgaW1tZWRpYXRlKSB7XG4gICAgdmFyIHRpbWVvdXQsIGFyZ3MsIGNvbnRleHQsIHRpbWVzdGFtcCwgcmVzdWx0O1xuXG4gICAgdmFyIGxhdGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgbGFzdCA9IF8ubm93KCkgLSB0aW1lc3RhbXA7XG5cbiAgICAgIGlmIChsYXN0IDwgd2FpdCAmJiBsYXN0ID49IDApIHtcbiAgICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHdhaXQgLSBsYXN0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRpbWVvdXQgPSBudWxsO1xuICAgICAgICBpZiAoIWltbWVkaWF0ZSkge1xuICAgICAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICAgICAgaWYgKCF0aW1lb3V0KSBjb250ZXh0ID0gYXJncyA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgY29udGV4dCA9IHRoaXM7XG4gICAgICBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgdGltZXN0YW1wID0gXy5ub3coKTtcbiAgICAgIHZhciBjYWxsTm93ID0gaW1tZWRpYXRlICYmICF0aW1lb3V0O1xuICAgICAgaWYgKCF0aW1lb3V0KSB0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgd2FpdCk7XG4gICAgICBpZiAoY2FsbE5vdykge1xuICAgICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICBjb250ZXh0ID0gYXJncyA9IG51bGw7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIHRoZSBmaXJzdCBmdW5jdGlvbiBwYXNzZWQgYXMgYW4gYXJndW1lbnQgdG8gdGhlIHNlY29uZCxcbiAgLy8gYWxsb3dpbmcgeW91IHRvIGFkanVzdCBhcmd1bWVudHMsIHJ1biBjb2RlIGJlZm9yZSBhbmQgYWZ0ZXIsIGFuZFxuICAvLyBjb25kaXRpb25hbGx5IGV4ZWN1dGUgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uLlxuICBfLndyYXAgPSBmdW5jdGlvbihmdW5jLCB3cmFwcGVyKSB7XG4gICAgcmV0dXJuIF8ucGFydGlhbCh3cmFwcGVyLCBmdW5jKTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIGEgbmVnYXRlZCB2ZXJzaW9uIG9mIHRoZSBwYXNzZWQtaW4gcHJlZGljYXRlLlxuICBfLm5lZ2F0ZSA9IGZ1bmN0aW9uKHByZWRpY2F0ZSkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiAhcHJlZGljYXRlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIGEgZnVuY3Rpb24gdGhhdCBpcyB0aGUgY29tcG9zaXRpb24gb2YgYSBsaXN0IG9mIGZ1bmN0aW9ucywgZWFjaFxuICAvLyBjb25zdW1pbmcgdGhlIHJldHVybiB2YWx1ZSBvZiB0aGUgZnVuY3Rpb24gdGhhdCBmb2xsb3dzLlxuICBfLmNvbXBvc2UgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgICB2YXIgc3RhcnQgPSBhcmdzLmxlbmd0aCAtIDE7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGkgPSBzdGFydDtcbiAgICAgIHZhciByZXN1bHQgPSBhcmdzW3N0YXJ0XS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgd2hpbGUgKGktLSkgcmVzdWx0ID0gYXJnc1tpXS5jYWxsKHRoaXMsIHJlc3VsdCk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgd2lsbCBvbmx5IGJlIGV4ZWN1dGVkIG9uIGFuZCBhZnRlciB0aGUgTnRoIGNhbGwuXG4gIF8uYWZ0ZXIgPSBmdW5jdGlvbih0aW1lcywgZnVuYykge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICgtLXRpbWVzIDwgMSkge1xuICAgICAgICByZXR1cm4gZnVuYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgfVxuICAgIH07XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgd2lsbCBvbmx5IGJlIGV4ZWN1dGVkIHVwIHRvIChidXQgbm90IGluY2x1ZGluZykgdGhlIE50aCBjYWxsLlxuICBfLmJlZm9yZSA9IGZ1bmN0aW9uKHRpbWVzLCBmdW5jKSB7XG4gICAgdmFyIG1lbW87XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKC0tdGltZXMgPiAwKSB7XG4gICAgICAgIG1lbW8gPSBmdW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICB9XG4gICAgICBpZiAodGltZXMgPD0gMSkgZnVuYyA9IG51bGw7XG4gICAgICByZXR1cm4gbWVtbztcbiAgICB9O1xuICB9O1xuXG4gIC8vIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0IHdpbGwgYmUgZXhlY3V0ZWQgYXQgbW9zdCBvbmUgdGltZSwgbm8gbWF0dGVyIGhvd1xuICAvLyBvZnRlbiB5b3UgY2FsbCBpdC4gVXNlZnVsIGZvciBsYXp5IGluaXRpYWxpemF0aW9uLlxuICBfLm9uY2UgPSBfLnBhcnRpYWwoXy5iZWZvcmUsIDIpO1xuXG4gIC8vIE9iamVjdCBGdW5jdGlvbnNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIEtleXMgaW4gSUUgPCA5IHRoYXQgd29uJ3QgYmUgaXRlcmF0ZWQgYnkgYGZvciBrZXkgaW4gLi4uYCBhbmQgdGh1cyBtaXNzZWQuXG4gIHZhciBoYXNFbnVtQnVnID0gIXt0b1N0cmluZzogbnVsbH0ucHJvcGVydHlJc0VudW1lcmFibGUoJ3RvU3RyaW5nJyk7XG4gIHZhciBub25FbnVtZXJhYmxlUHJvcHMgPSBbJ3ZhbHVlT2YnLCAnaXNQcm90b3R5cGVPZicsICd0b1N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgJ3Byb3BlcnR5SXNFbnVtZXJhYmxlJywgJ2hhc093blByb3BlcnR5JywgJ3RvTG9jYWxlU3RyaW5nJ107XG5cbiAgZnVuY3Rpb24gY29sbGVjdE5vbkVudW1Qcm9wcyhvYmosIGtleXMpIHtcbiAgICB2YXIgbm9uRW51bUlkeCA9IG5vbkVudW1lcmFibGVQcm9wcy5sZW5ndGg7XG4gICAgdmFyIGNvbnN0cnVjdG9yID0gb2JqLmNvbnN0cnVjdG9yO1xuICAgIHZhciBwcm90byA9IChfLmlzRnVuY3Rpb24oY29uc3RydWN0b3IpICYmIGNvbnN0cnVjdG9yLnByb3RvdHlwZSkgfHwgT2JqUHJvdG87XG5cbiAgICAvLyBDb25zdHJ1Y3RvciBpcyBhIHNwZWNpYWwgY2FzZS5cbiAgICB2YXIgcHJvcCA9ICdjb25zdHJ1Y3Rvcic7XG4gICAgaWYgKF8uaGFzKG9iaiwgcHJvcCkgJiYgIV8uY29udGFpbnMoa2V5cywgcHJvcCkpIGtleXMucHVzaChwcm9wKTtcblxuICAgIHdoaWxlIChub25FbnVtSWR4LS0pIHtcbiAgICAgIHByb3AgPSBub25FbnVtZXJhYmxlUHJvcHNbbm9uRW51bUlkeF07XG4gICAgICBpZiAocHJvcCBpbiBvYmogJiYgb2JqW3Byb3BdICE9PSBwcm90b1twcm9wXSAmJiAhXy5jb250YWlucyhrZXlzLCBwcm9wKSkge1xuICAgICAgICBrZXlzLnB1c2gocHJvcCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gUmV0cmlldmUgdGhlIG5hbWVzIG9mIGFuIG9iamVjdCdzIG93biBwcm9wZXJ0aWVzLlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgT2JqZWN0LmtleXNgXG4gIF8ua2V5cyA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmICghXy5pc09iamVjdChvYmopKSByZXR1cm4gW107XG4gICAgaWYgKG5hdGl2ZUtleXMpIHJldHVybiBuYXRpdmVLZXlzKG9iaik7XG4gICAgdmFyIGtleXMgPSBbXTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSBpZiAoXy5oYXMob2JqLCBrZXkpKSBrZXlzLnB1c2goa2V5KTtcbiAgICAvLyBBaGVtLCBJRSA8IDkuXG4gICAgaWYgKGhhc0VudW1CdWcpIGNvbGxlY3ROb25FbnVtUHJvcHMob2JqLCBrZXlzKTtcbiAgICByZXR1cm4ga2V5cztcbiAgfTtcblxuICAvLyBSZXRyaWV2ZSBhbGwgdGhlIHByb3BlcnR5IG5hbWVzIG9mIGFuIG9iamVjdC5cbiAgXy5hbGxLZXlzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKCFfLmlzT2JqZWN0KG9iaikpIHJldHVybiBbXTtcbiAgICB2YXIga2V5cyA9IFtdO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIGtleXMucHVzaChrZXkpO1xuICAgIC8vIEFoZW0sIElFIDwgOS5cbiAgICBpZiAoaGFzRW51bUJ1ZykgY29sbGVjdE5vbkVudW1Qcm9wcyhvYmosIGtleXMpO1xuICAgIHJldHVybiBrZXlzO1xuICB9O1xuXG4gIC8vIFJldHJpZXZlIHRoZSB2YWx1ZXMgb2YgYW4gb2JqZWN0J3MgcHJvcGVydGllcy5cbiAgXy52YWx1ZXMgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIga2V5cyA9IF8ua2V5cyhvYmopO1xuICAgIHZhciBsZW5ndGggPSBrZXlzLmxlbmd0aDtcbiAgICB2YXIgdmFsdWVzID0gQXJyYXkobGVuZ3RoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICB2YWx1ZXNbaV0gPSBvYmpba2V5c1tpXV07XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZXM7XG4gIH07XG5cbiAgLy8gUmV0dXJucyB0aGUgcmVzdWx0cyBvZiBhcHBseWluZyB0aGUgaXRlcmF0ZWUgdG8gZWFjaCBlbGVtZW50IG9mIHRoZSBvYmplY3RcbiAgLy8gSW4gY29udHJhc3QgdG8gXy5tYXAgaXQgcmV0dXJucyBhbiBvYmplY3RcbiAgXy5tYXBPYmplY3QgPSBmdW5jdGlvbihvYmosIGl0ZXJhdGVlLCBjb250ZXh0KSB7XG4gICAgaXRlcmF0ZWUgPSBjYihpdGVyYXRlZSwgY29udGV4dCk7XG4gICAgdmFyIGtleXMgPSAgXy5rZXlzKG9iaiksXG4gICAgICAgICAgbGVuZ3RoID0ga2V5cy5sZW5ndGgsXG4gICAgICAgICAgcmVzdWx0cyA9IHt9LFxuICAgICAgICAgIGN1cnJlbnRLZXk7XG4gICAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgIGN1cnJlbnRLZXkgPSBrZXlzW2luZGV4XTtcbiAgICAgICAgcmVzdWx0c1tjdXJyZW50S2V5XSA9IGl0ZXJhdGVlKG9ialtjdXJyZW50S2V5XSwgY3VycmVudEtleSwgb2JqKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHRzO1xuICB9O1xuXG4gIC8vIENvbnZlcnQgYW4gb2JqZWN0IGludG8gYSBsaXN0IG9mIGBba2V5LCB2YWx1ZV1gIHBhaXJzLlxuICBfLnBhaXJzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGtleXMgPSBfLmtleXMob2JqKTtcbiAgICB2YXIgbGVuZ3RoID0ga2V5cy5sZW5ndGg7XG4gICAgdmFyIHBhaXJzID0gQXJyYXkobGVuZ3RoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBwYWlyc1tpXSA9IFtrZXlzW2ldLCBvYmpba2V5c1tpXV1dO1xuICAgIH1cbiAgICByZXR1cm4gcGFpcnM7XG4gIH07XG5cbiAgLy8gSW52ZXJ0IHRoZSBrZXlzIGFuZCB2YWx1ZXMgb2YgYW4gb2JqZWN0LiBUaGUgdmFsdWVzIG11c3QgYmUgc2VyaWFsaXphYmxlLlxuICBfLmludmVydCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICB2YXIga2V5cyA9IF8ua2V5cyhvYmopO1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBrZXlzLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICByZXN1bHRbb2JqW2tleXNbaV1dXSA9IGtleXNbaV07XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgLy8gUmV0dXJuIGEgc29ydGVkIGxpc3Qgb2YgdGhlIGZ1bmN0aW9uIG5hbWVzIGF2YWlsYWJsZSBvbiB0aGUgb2JqZWN0LlxuICAvLyBBbGlhc2VkIGFzIGBtZXRob2RzYFxuICBfLmZ1bmN0aW9ucyA9IF8ubWV0aG9kcyA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBuYW1lcyA9IFtdO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgIGlmIChfLmlzRnVuY3Rpb24ob2JqW2tleV0pKSBuYW1lcy5wdXNoKGtleSk7XG4gICAgfVxuICAgIHJldHVybiBuYW1lcy5zb3J0KCk7XG4gIH07XG5cbiAgLy8gRXh0ZW5kIGEgZ2l2ZW4gb2JqZWN0IHdpdGggYWxsIHRoZSBwcm9wZXJ0aWVzIGluIHBhc3NlZC1pbiBvYmplY3QocykuXG4gIF8uZXh0ZW5kID0gY3JlYXRlQXNzaWduZXIoXy5hbGxLZXlzKTtcblxuICAvLyBBc3NpZ25zIGEgZ2l2ZW4gb2JqZWN0IHdpdGggYWxsIHRoZSBvd24gcHJvcGVydGllcyBpbiB0aGUgcGFzc2VkLWluIG9iamVjdChzKVxuICAvLyAoaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvT2JqZWN0L2Fzc2lnbilcbiAgXy5leHRlbmRPd24gPSBfLmFzc2lnbiA9IGNyZWF0ZUFzc2lnbmVyKF8ua2V5cyk7XG5cbiAgLy8gUmV0dXJucyB0aGUgZmlyc3Qga2V5IG9uIGFuIG9iamVjdCB0aGF0IHBhc3NlcyBhIHByZWRpY2F0ZSB0ZXN0XG4gIF8uZmluZEtleSA9IGZ1bmN0aW9uKG9iaiwgcHJlZGljYXRlLCBjb250ZXh0KSB7XG4gICAgcHJlZGljYXRlID0gY2IocHJlZGljYXRlLCBjb250ZXh0KTtcbiAgICB2YXIga2V5cyA9IF8ua2V5cyhvYmopLCBrZXk7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IGtleXMubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGtleSA9IGtleXNbaV07XG4gICAgICBpZiAocHJlZGljYXRlKG9ialtrZXldLCBrZXksIG9iaikpIHJldHVybiBrZXk7XG4gICAgfVxuICB9O1xuXG4gIC8vIFJldHVybiBhIGNvcHkgb2YgdGhlIG9iamVjdCBvbmx5IGNvbnRhaW5pbmcgdGhlIHdoaXRlbGlzdGVkIHByb3BlcnRpZXMuXG4gIF8ucGljayA9IGZ1bmN0aW9uKG9iamVjdCwgb2l0ZXJhdGVlLCBjb250ZXh0KSB7XG4gICAgdmFyIHJlc3VsdCA9IHt9LCBvYmogPSBvYmplY3QsIGl0ZXJhdGVlLCBrZXlzO1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIHJlc3VsdDtcbiAgICBpZiAoXy5pc0Z1bmN0aW9uKG9pdGVyYXRlZSkpIHtcbiAgICAgIGtleXMgPSBfLmFsbEtleXMob2JqKTtcbiAgICAgIGl0ZXJhdGVlID0gb3B0aW1pemVDYihvaXRlcmF0ZWUsIGNvbnRleHQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBrZXlzID0gZmxhdHRlbihhcmd1bWVudHMsIGZhbHNlLCBmYWxzZSwgMSk7XG4gICAgICBpdGVyYXRlZSA9IGZ1bmN0aW9uKHZhbHVlLCBrZXksIG9iaikgeyByZXR1cm4ga2V5IGluIG9iajsgfTtcbiAgICAgIG9iaiA9IE9iamVjdChvYmopO1xuICAgIH1cbiAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0ga2V5cy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGtleSA9IGtleXNbaV07XG4gICAgICB2YXIgdmFsdWUgPSBvYmpba2V5XTtcbiAgICAgIGlmIChpdGVyYXRlZSh2YWx1ZSwga2V5LCBvYmopKSByZXN1bHRba2V5XSA9IHZhbHVlO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gICAvLyBSZXR1cm4gYSBjb3B5IG9mIHRoZSBvYmplY3Qgd2l0aG91dCB0aGUgYmxhY2tsaXN0ZWQgcHJvcGVydGllcy5cbiAgXy5vbWl0ID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRlZSwgY29udGV4dCkge1xuICAgIGlmIChfLmlzRnVuY3Rpb24oaXRlcmF0ZWUpKSB7XG4gICAgICBpdGVyYXRlZSA9IF8ubmVnYXRlKGl0ZXJhdGVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGtleXMgPSBfLm1hcChmbGF0dGVuKGFyZ3VtZW50cywgZmFsc2UsIGZhbHNlLCAxKSwgU3RyaW5nKTtcbiAgICAgIGl0ZXJhdGVlID0gZnVuY3Rpb24odmFsdWUsIGtleSkge1xuICAgICAgICByZXR1cm4gIV8uY29udGFpbnMoa2V5cywga2V5KTtcbiAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiBfLnBpY2sob2JqLCBpdGVyYXRlZSwgY29udGV4dCk7XG4gIH07XG5cbiAgLy8gRmlsbCBpbiBhIGdpdmVuIG9iamVjdCB3aXRoIGRlZmF1bHQgcHJvcGVydGllcy5cbiAgXy5kZWZhdWx0cyA9IGNyZWF0ZUFzc2lnbmVyKF8uYWxsS2V5cywgdHJ1ZSk7XG5cbiAgLy8gQ3JlYXRlcyBhbiBvYmplY3QgdGhhdCBpbmhlcml0cyBmcm9tIHRoZSBnaXZlbiBwcm90b3R5cGUgb2JqZWN0LlxuICAvLyBJZiBhZGRpdGlvbmFsIHByb3BlcnRpZXMgYXJlIHByb3ZpZGVkIHRoZW4gdGhleSB3aWxsIGJlIGFkZGVkIHRvIHRoZVxuICAvLyBjcmVhdGVkIG9iamVjdC5cbiAgXy5jcmVhdGUgPSBmdW5jdGlvbihwcm90b3R5cGUsIHByb3BzKSB7XG4gICAgdmFyIHJlc3VsdCA9IGJhc2VDcmVhdGUocHJvdG90eXBlKTtcbiAgICBpZiAocHJvcHMpIF8uZXh0ZW5kT3duKHJlc3VsdCwgcHJvcHMpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgLy8gQ3JlYXRlIGEgKHNoYWxsb3ctY2xvbmVkKSBkdXBsaWNhdGUgb2YgYW4gb2JqZWN0LlxuICBfLmNsb25lID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKCFfLmlzT2JqZWN0KG9iaikpIHJldHVybiBvYmo7XG4gICAgcmV0dXJuIF8uaXNBcnJheShvYmopID8gb2JqLnNsaWNlKCkgOiBfLmV4dGVuZCh7fSwgb2JqKTtcbiAgfTtcblxuICAvLyBJbnZva2VzIGludGVyY2VwdG9yIHdpdGggdGhlIG9iaiwgYW5kIHRoZW4gcmV0dXJucyBvYmouXG4gIC8vIFRoZSBwcmltYXJ5IHB1cnBvc2Ugb2YgdGhpcyBtZXRob2QgaXMgdG8gXCJ0YXAgaW50b1wiIGEgbWV0aG9kIGNoYWluLCBpblxuICAvLyBvcmRlciB0byBwZXJmb3JtIG9wZXJhdGlvbnMgb24gaW50ZXJtZWRpYXRlIHJlc3VsdHMgd2l0aGluIHRoZSBjaGFpbi5cbiAgXy50YXAgPSBmdW5jdGlvbihvYmosIGludGVyY2VwdG9yKSB7XG4gICAgaW50ZXJjZXB0b3Iob2JqKTtcbiAgICByZXR1cm4gb2JqO1xuICB9O1xuXG4gIC8vIFJldHVybnMgd2hldGhlciBhbiBvYmplY3QgaGFzIGEgZ2l2ZW4gc2V0IG9mIGBrZXk6dmFsdWVgIHBhaXJzLlxuICBfLmlzTWF0Y2ggPSBmdW5jdGlvbihvYmplY3QsIGF0dHJzKSB7XG4gICAgdmFyIGtleXMgPSBfLmtleXMoYXR0cnMpLCBsZW5ndGggPSBrZXlzLmxlbmd0aDtcbiAgICBpZiAob2JqZWN0ID09IG51bGwpIHJldHVybiAhbGVuZ3RoO1xuICAgIHZhciBvYmogPSBPYmplY3Qob2JqZWN0KTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIga2V5ID0ga2V5c1tpXTtcbiAgICAgIGlmIChhdHRyc1trZXldICE9PSBvYmpba2V5XSB8fCAhKGtleSBpbiBvYmopKSByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9O1xuXG5cbiAgLy8gSW50ZXJuYWwgcmVjdXJzaXZlIGNvbXBhcmlzb24gZnVuY3Rpb24gZm9yIGBpc0VxdWFsYC5cbiAgdmFyIGVxID0gZnVuY3Rpb24oYSwgYiwgYVN0YWNrLCBiU3RhY2spIHtcbiAgICAvLyBJZGVudGljYWwgb2JqZWN0cyBhcmUgZXF1YWwuIGAwID09PSAtMGAsIGJ1dCB0aGV5IGFyZW4ndCBpZGVudGljYWwuXG4gICAgLy8gU2VlIHRoZSBbSGFybW9ueSBgZWdhbGAgcHJvcG9zYWxdKGh0dHA6Ly93aWtpLmVjbWFzY3JpcHQub3JnL2Rva3UucGhwP2lkPWhhcm1vbnk6ZWdhbCkuXG4gICAgaWYgKGEgPT09IGIpIHJldHVybiBhICE9PSAwIHx8IDEgLyBhID09PSAxIC8gYjtcbiAgICAvLyBBIHN0cmljdCBjb21wYXJpc29uIGlzIG5lY2Vzc2FyeSBiZWNhdXNlIGBudWxsID09IHVuZGVmaW5lZGAuXG4gICAgaWYgKGEgPT0gbnVsbCB8fCBiID09IG51bGwpIHJldHVybiBhID09PSBiO1xuICAgIC8vIFVud3JhcCBhbnkgd3JhcHBlZCBvYmplY3RzLlxuICAgIGlmIChhIGluc3RhbmNlb2YgXykgYSA9IGEuX3dyYXBwZWQ7XG4gICAgaWYgKGIgaW5zdGFuY2VvZiBfKSBiID0gYi5fd3JhcHBlZDtcbiAgICAvLyBDb21wYXJlIGBbW0NsYXNzXV1gIG5hbWVzLlxuICAgIHZhciBjbGFzc05hbWUgPSB0b1N0cmluZy5jYWxsKGEpO1xuICAgIGlmIChjbGFzc05hbWUgIT09IHRvU3RyaW5nLmNhbGwoYikpIHJldHVybiBmYWxzZTtcbiAgICBzd2l0Y2ggKGNsYXNzTmFtZSkge1xuICAgICAgLy8gU3RyaW5ncywgbnVtYmVycywgcmVndWxhciBleHByZXNzaW9ucywgZGF0ZXMsIGFuZCBib29sZWFucyBhcmUgY29tcGFyZWQgYnkgdmFsdWUuXG4gICAgICBjYXNlICdbb2JqZWN0IFJlZ0V4cF0nOlxuICAgICAgLy8gUmVnRXhwcyBhcmUgY29lcmNlZCB0byBzdHJpbmdzIGZvciBjb21wYXJpc29uIChOb3RlOiAnJyArIC9hL2kgPT09ICcvYS9pJylcbiAgICAgIGNhc2UgJ1tvYmplY3QgU3RyaW5nXSc6XG4gICAgICAgIC8vIFByaW1pdGl2ZXMgYW5kIHRoZWlyIGNvcnJlc3BvbmRpbmcgb2JqZWN0IHdyYXBwZXJzIGFyZSBlcXVpdmFsZW50OyB0aHVzLCBgXCI1XCJgIGlzXG4gICAgICAgIC8vIGVxdWl2YWxlbnQgdG8gYG5ldyBTdHJpbmcoXCI1XCIpYC5cbiAgICAgICAgcmV0dXJuICcnICsgYSA9PT0gJycgKyBiO1xuICAgICAgY2FzZSAnW29iamVjdCBOdW1iZXJdJzpcbiAgICAgICAgLy8gYE5hTmBzIGFyZSBlcXVpdmFsZW50LCBidXQgbm9uLXJlZmxleGl2ZS5cbiAgICAgICAgLy8gT2JqZWN0KE5hTikgaXMgZXF1aXZhbGVudCB0byBOYU5cbiAgICAgICAgaWYgKCthICE9PSArYSkgcmV0dXJuICtiICE9PSArYjtcbiAgICAgICAgLy8gQW4gYGVnYWxgIGNvbXBhcmlzb24gaXMgcGVyZm9ybWVkIGZvciBvdGhlciBudW1lcmljIHZhbHVlcy5cbiAgICAgICAgcmV0dXJuICthID09PSAwID8gMSAvICthID09PSAxIC8gYiA6ICthID09PSArYjtcbiAgICAgIGNhc2UgJ1tvYmplY3QgRGF0ZV0nOlxuICAgICAgY2FzZSAnW29iamVjdCBCb29sZWFuXSc6XG4gICAgICAgIC8vIENvZXJjZSBkYXRlcyBhbmQgYm9vbGVhbnMgdG8gbnVtZXJpYyBwcmltaXRpdmUgdmFsdWVzLiBEYXRlcyBhcmUgY29tcGFyZWQgYnkgdGhlaXJcbiAgICAgICAgLy8gbWlsbGlzZWNvbmQgcmVwcmVzZW50YXRpb25zLiBOb3RlIHRoYXQgaW52YWxpZCBkYXRlcyB3aXRoIG1pbGxpc2Vjb25kIHJlcHJlc2VudGF0aW9uc1xuICAgICAgICAvLyBvZiBgTmFOYCBhcmUgbm90IGVxdWl2YWxlbnQuXG4gICAgICAgIHJldHVybiArYSA9PT0gK2I7XG4gICAgfVxuXG4gICAgdmFyIGFyZUFycmF5cyA9IGNsYXNzTmFtZSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbiAgICBpZiAoIWFyZUFycmF5cykge1xuICAgICAgaWYgKHR5cGVvZiBhICE9ICdvYmplY3QnIHx8IHR5cGVvZiBiICE9ICdvYmplY3QnKSByZXR1cm4gZmFsc2U7XG5cbiAgICAgIC8vIE9iamVjdHMgd2l0aCBkaWZmZXJlbnQgY29uc3RydWN0b3JzIGFyZSBub3QgZXF1aXZhbGVudCwgYnV0IGBPYmplY3RgcyBvciBgQXJyYXlgc1xuICAgICAgLy8gZnJvbSBkaWZmZXJlbnQgZnJhbWVzIGFyZS5cbiAgICAgIHZhciBhQ3RvciA9IGEuY29uc3RydWN0b3IsIGJDdG9yID0gYi5jb25zdHJ1Y3RvcjtcbiAgICAgIGlmIChhQ3RvciAhPT0gYkN0b3IgJiYgIShfLmlzRnVuY3Rpb24oYUN0b3IpICYmIGFDdG9yIGluc3RhbmNlb2YgYUN0b3IgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfLmlzRnVuY3Rpb24oYkN0b3IpICYmIGJDdG9yIGluc3RhbmNlb2YgYkN0b3IpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICYmICgnY29uc3RydWN0b3InIGluIGEgJiYgJ2NvbnN0cnVjdG9yJyBpbiBiKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIEFzc3VtZSBlcXVhbGl0eSBmb3IgY3ljbGljIHN0cnVjdHVyZXMuIFRoZSBhbGdvcml0aG0gZm9yIGRldGVjdGluZyBjeWNsaWNcbiAgICAvLyBzdHJ1Y3R1cmVzIGlzIGFkYXB0ZWQgZnJvbSBFUyA1LjEgc2VjdGlvbiAxNS4xMi4zLCBhYnN0cmFjdCBvcGVyYXRpb24gYEpPYC5cblxuICAgIC8vIEluaXRpYWxpemluZyBzdGFjayBvZiB0cmF2ZXJzZWQgb2JqZWN0cy5cbiAgICAvLyBJdCdzIGRvbmUgaGVyZSBzaW5jZSB3ZSBvbmx5IG5lZWQgdGhlbSBmb3Igb2JqZWN0cyBhbmQgYXJyYXlzIGNvbXBhcmlzb24uXG4gICAgYVN0YWNrID0gYVN0YWNrIHx8IFtdO1xuICAgIGJTdGFjayA9IGJTdGFjayB8fCBbXTtcbiAgICB2YXIgbGVuZ3RoID0gYVN0YWNrLmxlbmd0aDtcbiAgICB3aGlsZSAobGVuZ3RoLS0pIHtcbiAgICAgIC8vIExpbmVhciBzZWFyY2guIFBlcmZvcm1hbmNlIGlzIGludmVyc2VseSBwcm9wb3J0aW9uYWwgdG8gdGhlIG51bWJlciBvZlxuICAgICAgLy8gdW5pcXVlIG5lc3RlZCBzdHJ1Y3R1cmVzLlxuICAgICAgaWYgKGFTdGFja1tsZW5ndGhdID09PSBhKSByZXR1cm4gYlN0YWNrW2xlbmd0aF0gPT09IGI7XG4gICAgfVxuXG4gICAgLy8gQWRkIHRoZSBmaXJzdCBvYmplY3QgdG8gdGhlIHN0YWNrIG9mIHRyYXZlcnNlZCBvYmplY3RzLlxuICAgIGFTdGFjay5wdXNoKGEpO1xuICAgIGJTdGFjay5wdXNoKGIpO1xuXG4gICAgLy8gUmVjdXJzaXZlbHkgY29tcGFyZSBvYmplY3RzIGFuZCBhcnJheXMuXG4gICAgaWYgKGFyZUFycmF5cykge1xuICAgICAgLy8gQ29tcGFyZSBhcnJheSBsZW5ndGhzIHRvIGRldGVybWluZSBpZiBhIGRlZXAgY29tcGFyaXNvbiBpcyBuZWNlc3NhcnkuXG4gICAgICBsZW5ndGggPSBhLmxlbmd0aDtcbiAgICAgIGlmIChsZW5ndGggIT09IGIubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG4gICAgICAvLyBEZWVwIGNvbXBhcmUgdGhlIGNvbnRlbnRzLCBpZ25vcmluZyBub24tbnVtZXJpYyBwcm9wZXJ0aWVzLlxuICAgICAgd2hpbGUgKGxlbmd0aC0tKSB7XG4gICAgICAgIGlmICghZXEoYVtsZW5ndGhdLCBiW2xlbmd0aF0sIGFTdGFjaywgYlN0YWNrKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBEZWVwIGNvbXBhcmUgb2JqZWN0cy5cbiAgICAgIHZhciBrZXlzID0gXy5rZXlzKGEpLCBrZXk7XG4gICAgICBsZW5ndGggPSBrZXlzLmxlbmd0aDtcbiAgICAgIC8vIEVuc3VyZSB0aGF0IGJvdGggb2JqZWN0cyBjb250YWluIHRoZSBzYW1lIG51bWJlciBvZiBwcm9wZXJ0aWVzIGJlZm9yZSBjb21wYXJpbmcgZGVlcCBlcXVhbGl0eS5cbiAgICAgIGlmIChfLmtleXMoYikubGVuZ3RoICE9PSBsZW5ndGgpIHJldHVybiBmYWxzZTtcbiAgICAgIHdoaWxlIChsZW5ndGgtLSkge1xuICAgICAgICAvLyBEZWVwIGNvbXBhcmUgZWFjaCBtZW1iZXJcbiAgICAgICAga2V5ID0ga2V5c1tsZW5ndGhdO1xuICAgICAgICBpZiAoIShfLmhhcyhiLCBrZXkpICYmIGVxKGFba2V5XSwgYltrZXldLCBhU3RhY2ssIGJTdGFjaykpKSByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIFJlbW92ZSB0aGUgZmlyc3Qgb2JqZWN0IGZyb20gdGhlIHN0YWNrIG9mIHRyYXZlcnNlZCBvYmplY3RzLlxuICAgIGFTdGFjay5wb3AoKTtcbiAgICBiU3RhY2sucG9wKCk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG5cbiAgLy8gUGVyZm9ybSBhIGRlZXAgY29tcGFyaXNvbiB0byBjaGVjayBpZiB0d28gb2JqZWN0cyBhcmUgZXF1YWwuXG4gIF8uaXNFcXVhbCA9IGZ1bmN0aW9uKGEsIGIpIHtcbiAgICByZXR1cm4gZXEoYSwgYik7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiBhcnJheSwgc3RyaW5nLCBvciBvYmplY3QgZW1wdHk/XG4gIC8vIEFuIFwiZW1wdHlcIiBvYmplY3QgaGFzIG5vIGVudW1lcmFibGUgb3duLXByb3BlcnRpZXMuXG4gIF8uaXNFbXB0eSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIHRydWU7XG4gICAgaWYgKGlzQXJyYXlMaWtlKG9iaikgJiYgKF8uaXNBcnJheShvYmopIHx8IF8uaXNTdHJpbmcob2JqKSB8fCBfLmlzQXJndW1lbnRzKG9iaikpKSByZXR1cm4gb2JqLmxlbmd0aCA9PT0gMDtcbiAgICByZXR1cm4gXy5rZXlzKG9iaikubGVuZ3RoID09PSAwO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFsdWUgYSBET00gZWxlbWVudD9cbiAgXy5pc0VsZW1lbnQgPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gISEob2JqICYmIG9iai5ub2RlVHlwZSA9PT0gMSk7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YWx1ZSBhbiBhcnJheT9cbiAgLy8gRGVsZWdhdGVzIHRvIEVDTUE1J3MgbmF0aXZlIEFycmF5LmlzQXJyYXlcbiAgXy5pc0FycmF5ID0gbmF0aXZlSXNBcnJheSB8fCBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gdG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBBcnJheV0nO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFyaWFibGUgYW4gb2JqZWN0P1xuICBfLmlzT2JqZWN0ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIHR5cGUgPSB0eXBlb2Ygb2JqO1xuICAgIHJldHVybiB0eXBlID09PSAnZnVuY3Rpb24nIHx8IHR5cGUgPT09ICdvYmplY3QnICYmICEhb2JqO1xuICB9O1xuXG4gIC8vIEFkZCBzb21lIGlzVHlwZSBtZXRob2RzOiBpc0FyZ3VtZW50cywgaXNGdW5jdGlvbiwgaXNTdHJpbmcsIGlzTnVtYmVyLCBpc0RhdGUsIGlzUmVnRXhwLCBpc0Vycm9yLlxuICBfLmVhY2goWydBcmd1bWVudHMnLCAnRnVuY3Rpb24nLCAnU3RyaW5nJywgJ051bWJlcicsICdEYXRlJywgJ1JlZ0V4cCcsICdFcnJvciddLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgX1snaXMnICsgbmFtZV0gPSBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiB0b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0ICcgKyBuYW1lICsgJ10nO1xuICAgIH07XG4gIH0pO1xuXG4gIC8vIERlZmluZSBhIGZhbGxiYWNrIHZlcnNpb24gb2YgdGhlIG1ldGhvZCBpbiBicm93c2VycyAoYWhlbSwgSUUgPCA5KSwgd2hlcmVcbiAgLy8gdGhlcmUgaXNuJ3QgYW55IGluc3BlY3RhYmxlIFwiQXJndW1lbnRzXCIgdHlwZS5cbiAgaWYgKCFfLmlzQXJndW1lbnRzKGFyZ3VtZW50cykpIHtcbiAgICBfLmlzQXJndW1lbnRzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gXy5oYXMob2JqLCAnY2FsbGVlJyk7XG4gICAgfTtcbiAgfVxuXG4gIC8vIE9wdGltaXplIGBpc0Z1bmN0aW9uYCBpZiBhcHByb3ByaWF0ZS4gV29yayBhcm91bmQgc29tZSB0eXBlb2YgYnVncyBpbiBvbGQgdjgsXG4gIC8vIElFIDExICgjMTYyMSksIGFuZCBpbiBTYWZhcmkgOCAoIzE5MjkpLlxuICBpZiAodHlwZW9mIC8uLyAhPSAnZnVuY3Rpb24nICYmIHR5cGVvZiBJbnQ4QXJyYXkgIT0gJ29iamVjdCcpIHtcbiAgICBfLmlzRnVuY3Rpb24gPSBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiB0eXBlb2Ygb2JqID09ICdmdW5jdGlvbicgfHwgZmFsc2U7XG4gICAgfTtcbiAgfVxuXG4gIC8vIElzIGEgZ2l2ZW4gb2JqZWN0IGEgZmluaXRlIG51bWJlcj9cbiAgXy5pc0Zpbml0ZSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBpc0Zpbml0ZShvYmopICYmICFpc05hTihwYXJzZUZsb2F0KG9iaikpO1xuICB9O1xuXG4gIC8vIElzIHRoZSBnaXZlbiB2YWx1ZSBgTmFOYD8gKE5hTiBpcyB0aGUgb25seSBudW1iZXIgd2hpY2ggZG9lcyBub3QgZXF1YWwgaXRzZWxmKS5cbiAgXy5pc05hTiA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBfLmlzTnVtYmVyKG9iaikgJiYgb2JqICE9PSArb2JqO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFsdWUgYSBib29sZWFuP1xuICBfLmlzQm9vbGVhbiA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBvYmogPT09IHRydWUgfHwgb2JqID09PSBmYWxzZSB8fCB0b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IEJvb2xlYW5dJztcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIHZhbHVlIGVxdWFsIHRvIG51bGw/XG4gIF8uaXNOdWxsID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIG9iaiA9PT0gbnVsbDtcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIHZhcmlhYmxlIHVuZGVmaW5lZD9cbiAgXy5pc1VuZGVmaW5lZCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBvYmogPT09IHZvaWQgMDtcbiAgfTtcblxuICAvLyBTaG9ydGN1dCBmdW5jdGlvbiBmb3IgY2hlY2tpbmcgaWYgYW4gb2JqZWN0IGhhcyBhIGdpdmVuIHByb3BlcnR5IGRpcmVjdGx5XG4gIC8vIG9uIGl0c2VsZiAoaW4gb3RoZXIgd29yZHMsIG5vdCBvbiBhIHByb3RvdHlwZSkuXG4gIF8uaGFzID0gZnVuY3Rpb24ob2JqLCBrZXkpIHtcbiAgICByZXR1cm4gb2JqICE9IG51bGwgJiYgaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSk7XG4gIH07XG5cbiAgLy8gVXRpbGl0eSBGdW5jdGlvbnNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBSdW4gVW5kZXJzY29yZS5qcyBpbiAqbm9Db25mbGljdCogbW9kZSwgcmV0dXJuaW5nIHRoZSBgX2AgdmFyaWFibGUgdG8gaXRzXG4gIC8vIHByZXZpb3VzIG93bmVyLiBSZXR1cm5zIGEgcmVmZXJlbmNlIHRvIHRoZSBVbmRlcnNjb3JlIG9iamVjdC5cbiAgXy5ub0NvbmZsaWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgcm9vdC5fID0gcHJldmlvdXNVbmRlcnNjb3JlO1xuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIC8vIEtlZXAgdGhlIGlkZW50aXR5IGZ1bmN0aW9uIGFyb3VuZCBmb3IgZGVmYXVsdCBpdGVyYXRlZXMuXG4gIF8uaWRlbnRpdHkgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfTtcblxuICAvLyBQcmVkaWNhdGUtZ2VuZXJhdGluZyBmdW5jdGlvbnMuIE9mdGVuIHVzZWZ1bCBvdXRzaWRlIG9mIFVuZGVyc2NvcmUuXG4gIF8uY29uc3RhbnQgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9O1xuICB9O1xuXG4gIF8ubm9vcCA9IGZ1bmN0aW9uKCl7fTtcblxuICBfLnByb3BlcnR5ID0gcHJvcGVydHk7XG5cbiAgLy8gR2VuZXJhdGVzIGEgZnVuY3Rpb24gZm9yIGEgZ2l2ZW4gb2JqZWN0IHRoYXQgcmV0dXJucyBhIGdpdmVuIHByb3BlcnR5LlxuICBfLnByb3BlcnR5T2YgPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gb2JqID09IG51bGwgPyBmdW5jdGlvbigpe30gOiBmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiBvYmpba2V5XTtcbiAgICB9O1xuICB9O1xuXG4gIC8vIFJldHVybnMgYSBwcmVkaWNhdGUgZm9yIGNoZWNraW5nIHdoZXRoZXIgYW4gb2JqZWN0IGhhcyBhIGdpdmVuIHNldCBvZlxuICAvLyBga2V5OnZhbHVlYCBwYWlycy5cbiAgXy5tYXRjaGVyID0gXy5tYXRjaGVzID0gZnVuY3Rpb24oYXR0cnMpIHtcbiAgICBhdHRycyA9IF8uZXh0ZW5kT3duKHt9LCBhdHRycyk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuIF8uaXNNYXRjaChvYmosIGF0dHJzKTtcbiAgICB9O1xuICB9O1xuXG4gIC8vIFJ1biBhIGZ1bmN0aW9uICoqbioqIHRpbWVzLlxuICBfLnRpbWVzID0gZnVuY3Rpb24obiwgaXRlcmF0ZWUsIGNvbnRleHQpIHtcbiAgICB2YXIgYWNjdW0gPSBBcnJheShNYXRoLm1heCgwLCBuKSk7XG4gICAgaXRlcmF0ZWUgPSBvcHRpbWl6ZUNiKGl0ZXJhdGVlLCBjb250ZXh0LCAxKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG47IGkrKykgYWNjdW1baV0gPSBpdGVyYXRlZShpKTtcbiAgICByZXR1cm4gYWNjdW07XG4gIH07XG5cbiAgLy8gUmV0dXJuIGEgcmFuZG9tIGludGVnZXIgYmV0d2VlbiBtaW4gYW5kIG1heCAoaW5jbHVzaXZlKS5cbiAgXy5yYW5kb20gPSBmdW5jdGlvbihtaW4sIG1heCkge1xuICAgIGlmIChtYXggPT0gbnVsbCkge1xuICAgICAgbWF4ID0gbWluO1xuICAgICAgbWluID0gMDtcbiAgICB9XG4gICAgcmV0dXJuIG1pbiArIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4gKyAxKSk7XG4gIH07XG5cbiAgLy8gQSAocG9zc2libHkgZmFzdGVyKSB3YXkgdG8gZ2V0IHRoZSBjdXJyZW50IHRpbWVzdGFtcCBhcyBhbiBpbnRlZ2VyLlxuICBfLm5vdyA9IERhdGUubm93IHx8IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgfTtcblxuICAgLy8gTGlzdCBvZiBIVE1MIGVudGl0aWVzIGZvciBlc2NhcGluZy5cbiAgdmFyIGVzY2FwZU1hcCA9IHtcbiAgICAnJic6ICcmYW1wOycsXG4gICAgJzwnOiAnJmx0OycsXG4gICAgJz4nOiAnJmd0OycsXG4gICAgJ1wiJzogJyZxdW90OycsXG4gICAgXCInXCI6ICcmI3gyNzsnLFxuICAgICdgJzogJyYjeDYwOydcbiAgfTtcbiAgdmFyIHVuZXNjYXBlTWFwID0gXy5pbnZlcnQoZXNjYXBlTWFwKTtcblxuICAvLyBGdW5jdGlvbnMgZm9yIGVzY2FwaW5nIGFuZCB1bmVzY2FwaW5nIHN0cmluZ3MgdG8vZnJvbSBIVE1MIGludGVycG9sYXRpb24uXG4gIHZhciBjcmVhdGVFc2NhcGVyID0gZnVuY3Rpb24obWFwKSB7XG4gICAgdmFyIGVzY2FwZXIgPSBmdW5jdGlvbihtYXRjaCkge1xuICAgICAgcmV0dXJuIG1hcFttYXRjaF07XG4gICAgfTtcbiAgICAvLyBSZWdleGVzIGZvciBpZGVudGlmeWluZyBhIGtleSB0aGF0IG5lZWRzIHRvIGJlIGVzY2FwZWRcbiAgICB2YXIgc291cmNlID0gJyg/OicgKyBfLmtleXMobWFwKS5qb2luKCd8JykgKyAnKSc7XG4gICAgdmFyIHRlc3RSZWdleHAgPSBSZWdFeHAoc291cmNlKTtcbiAgICB2YXIgcmVwbGFjZVJlZ2V4cCA9IFJlZ0V4cChzb3VyY2UsICdnJyk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHN0cmluZykge1xuICAgICAgc3RyaW5nID0gc3RyaW5nID09IG51bGwgPyAnJyA6ICcnICsgc3RyaW5nO1xuICAgICAgcmV0dXJuIHRlc3RSZWdleHAudGVzdChzdHJpbmcpID8gc3RyaW5nLnJlcGxhY2UocmVwbGFjZVJlZ2V4cCwgZXNjYXBlcikgOiBzdHJpbmc7XG4gICAgfTtcbiAgfTtcbiAgXy5lc2NhcGUgPSBjcmVhdGVFc2NhcGVyKGVzY2FwZU1hcCk7XG4gIF8udW5lc2NhcGUgPSBjcmVhdGVFc2NhcGVyKHVuZXNjYXBlTWFwKTtcblxuICAvLyBJZiB0aGUgdmFsdWUgb2YgdGhlIG5hbWVkIGBwcm9wZXJ0eWAgaXMgYSBmdW5jdGlvbiB0aGVuIGludm9rZSBpdCB3aXRoIHRoZVxuICAvLyBgb2JqZWN0YCBhcyBjb250ZXh0OyBvdGhlcndpc2UsIHJldHVybiBpdC5cbiAgXy5yZXN1bHQgPSBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5LCBmYWxsYmFjaykge1xuICAgIHZhciB2YWx1ZSA9IG9iamVjdCA9PSBudWxsID8gdm9pZCAwIDogb2JqZWN0W3Byb3BlcnR5XTtcbiAgICBpZiAodmFsdWUgPT09IHZvaWQgMCkge1xuICAgICAgdmFsdWUgPSBmYWxsYmFjaztcbiAgICB9XG4gICAgcmV0dXJuIF8uaXNGdW5jdGlvbih2YWx1ZSkgPyB2YWx1ZS5jYWxsKG9iamVjdCkgOiB2YWx1ZTtcbiAgfTtcblxuICAvLyBHZW5lcmF0ZSBhIHVuaXF1ZSBpbnRlZ2VyIGlkICh1bmlxdWUgd2l0aGluIHRoZSBlbnRpcmUgY2xpZW50IHNlc3Npb24pLlxuICAvLyBVc2VmdWwgZm9yIHRlbXBvcmFyeSBET00gaWRzLlxuICB2YXIgaWRDb3VudGVyID0gMDtcbiAgXy51bmlxdWVJZCA9IGZ1bmN0aW9uKHByZWZpeCkge1xuICAgIHZhciBpZCA9ICsraWRDb3VudGVyICsgJyc7XG4gICAgcmV0dXJuIHByZWZpeCA/IHByZWZpeCArIGlkIDogaWQ7XG4gIH07XG5cbiAgLy8gQnkgZGVmYXVsdCwgVW5kZXJzY29yZSB1c2VzIEVSQi1zdHlsZSB0ZW1wbGF0ZSBkZWxpbWl0ZXJzLCBjaGFuZ2UgdGhlXG4gIC8vIGZvbGxvd2luZyB0ZW1wbGF0ZSBzZXR0aW5ncyB0byB1c2UgYWx0ZXJuYXRpdmUgZGVsaW1pdGVycy5cbiAgXy50ZW1wbGF0ZVNldHRpbmdzID0ge1xuICAgIGV2YWx1YXRlICAgIDogLzwlKFtcXHNcXFNdKz8pJT4vZyxcbiAgICBpbnRlcnBvbGF0ZSA6IC88JT0oW1xcc1xcU10rPyklPi9nLFxuICAgIGVzY2FwZSAgICAgIDogLzwlLShbXFxzXFxTXSs/KSU+L2dcbiAgfTtcblxuICAvLyBXaGVuIGN1c3RvbWl6aW5nIGB0ZW1wbGF0ZVNldHRpbmdzYCwgaWYgeW91IGRvbid0IHdhbnQgdG8gZGVmaW5lIGFuXG4gIC8vIGludGVycG9sYXRpb24sIGV2YWx1YXRpb24gb3IgZXNjYXBpbmcgcmVnZXgsIHdlIG5lZWQgb25lIHRoYXQgaXNcbiAgLy8gZ3VhcmFudGVlZCBub3QgdG8gbWF0Y2guXG4gIHZhciBub01hdGNoID0gLyguKV4vO1xuXG4gIC8vIENlcnRhaW4gY2hhcmFjdGVycyBuZWVkIHRvIGJlIGVzY2FwZWQgc28gdGhhdCB0aGV5IGNhbiBiZSBwdXQgaW50byBhXG4gIC8vIHN0cmluZyBsaXRlcmFsLlxuICB2YXIgZXNjYXBlcyA9IHtcbiAgICBcIidcIjogICAgICBcIidcIixcbiAgICAnXFxcXCc6ICAgICAnXFxcXCcsXG4gICAgJ1xccic6ICAgICAncicsXG4gICAgJ1xcbic6ICAgICAnbicsXG4gICAgJ1xcdTIwMjgnOiAndTIwMjgnLFxuICAgICdcXHUyMDI5JzogJ3UyMDI5J1xuICB9O1xuXG4gIHZhciBlc2NhcGVyID0gL1xcXFx8J3xcXHJ8XFxufFxcdTIwMjh8XFx1MjAyOS9nO1xuXG4gIHZhciBlc2NhcGVDaGFyID0gZnVuY3Rpb24obWF0Y2gpIHtcbiAgICByZXR1cm4gJ1xcXFwnICsgZXNjYXBlc1ttYXRjaF07XG4gIH07XG5cbiAgLy8gSmF2YVNjcmlwdCBtaWNyby10ZW1wbGF0aW5nLCBzaW1pbGFyIHRvIEpvaG4gUmVzaWcncyBpbXBsZW1lbnRhdGlvbi5cbiAgLy8gVW5kZXJzY29yZSB0ZW1wbGF0aW5nIGhhbmRsZXMgYXJiaXRyYXJ5IGRlbGltaXRlcnMsIHByZXNlcnZlcyB3aGl0ZXNwYWNlLFxuICAvLyBhbmQgY29ycmVjdGx5IGVzY2FwZXMgcXVvdGVzIHdpdGhpbiBpbnRlcnBvbGF0ZWQgY29kZS5cbiAgLy8gTkI6IGBvbGRTZXR0aW5nc2Agb25seSBleGlzdHMgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5LlxuICBfLnRlbXBsYXRlID0gZnVuY3Rpb24odGV4dCwgc2V0dGluZ3MsIG9sZFNldHRpbmdzKSB7XG4gICAgaWYgKCFzZXR0aW5ncyAmJiBvbGRTZXR0aW5ncykgc2V0dGluZ3MgPSBvbGRTZXR0aW5ncztcbiAgICBzZXR0aW5ncyA9IF8uZGVmYXVsdHMoe30sIHNldHRpbmdzLCBfLnRlbXBsYXRlU2V0dGluZ3MpO1xuXG4gICAgLy8gQ29tYmluZSBkZWxpbWl0ZXJzIGludG8gb25lIHJlZ3VsYXIgZXhwcmVzc2lvbiB2aWEgYWx0ZXJuYXRpb24uXG4gICAgdmFyIG1hdGNoZXIgPSBSZWdFeHAoW1xuICAgICAgKHNldHRpbmdzLmVzY2FwZSB8fCBub01hdGNoKS5zb3VyY2UsXG4gICAgICAoc2V0dGluZ3MuaW50ZXJwb2xhdGUgfHwgbm9NYXRjaCkuc291cmNlLFxuICAgICAgKHNldHRpbmdzLmV2YWx1YXRlIHx8IG5vTWF0Y2gpLnNvdXJjZVxuICAgIF0uam9pbignfCcpICsgJ3wkJywgJ2cnKTtcblxuICAgIC8vIENvbXBpbGUgdGhlIHRlbXBsYXRlIHNvdXJjZSwgZXNjYXBpbmcgc3RyaW5nIGxpdGVyYWxzIGFwcHJvcHJpYXRlbHkuXG4gICAgdmFyIGluZGV4ID0gMDtcbiAgICB2YXIgc291cmNlID0gXCJfX3ArPSdcIjtcbiAgICB0ZXh0LnJlcGxhY2UobWF0Y2hlciwgZnVuY3Rpb24obWF0Y2gsIGVzY2FwZSwgaW50ZXJwb2xhdGUsIGV2YWx1YXRlLCBvZmZzZXQpIHtcbiAgICAgIHNvdXJjZSArPSB0ZXh0LnNsaWNlKGluZGV4LCBvZmZzZXQpLnJlcGxhY2UoZXNjYXBlciwgZXNjYXBlQ2hhcik7XG4gICAgICBpbmRleCA9IG9mZnNldCArIG1hdGNoLmxlbmd0aDtcblxuICAgICAgaWYgKGVzY2FwZSkge1xuICAgICAgICBzb3VyY2UgKz0gXCInK1xcbigoX190PShcIiArIGVzY2FwZSArIFwiKSk9PW51bGw/Jyc6Xy5lc2NhcGUoX190KSkrXFxuJ1wiO1xuICAgICAgfSBlbHNlIGlmIChpbnRlcnBvbGF0ZSkge1xuICAgICAgICBzb3VyY2UgKz0gXCInK1xcbigoX190PShcIiArIGludGVycG9sYXRlICsgXCIpKT09bnVsbD8nJzpfX3QpK1xcbidcIjtcbiAgICAgIH0gZWxzZSBpZiAoZXZhbHVhdGUpIHtcbiAgICAgICAgc291cmNlICs9IFwiJztcXG5cIiArIGV2YWx1YXRlICsgXCJcXG5fX3ArPSdcIjtcbiAgICAgIH1cblxuICAgICAgLy8gQWRvYmUgVk1zIG5lZWQgdGhlIG1hdGNoIHJldHVybmVkIHRvIHByb2R1Y2UgdGhlIGNvcnJlY3Qgb2ZmZXN0LlxuICAgICAgcmV0dXJuIG1hdGNoO1xuICAgIH0pO1xuICAgIHNvdXJjZSArPSBcIic7XFxuXCI7XG5cbiAgICAvLyBJZiBhIHZhcmlhYmxlIGlzIG5vdCBzcGVjaWZpZWQsIHBsYWNlIGRhdGEgdmFsdWVzIGluIGxvY2FsIHNjb3BlLlxuICAgIGlmICghc2V0dGluZ3MudmFyaWFibGUpIHNvdXJjZSA9ICd3aXRoKG9ianx8e30pe1xcbicgKyBzb3VyY2UgKyAnfVxcbic7XG5cbiAgICBzb3VyY2UgPSBcInZhciBfX3QsX19wPScnLF9faj1BcnJheS5wcm90b3R5cGUuam9pbixcIiArXG4gICAgICBcInByaW50PWZ1bmN0aW9uKCl7X19wKz1fX2ouY2FsbChhcmd1bWVudHMsJycpO307XFxuXCIgK1xuICAgICAgc291cmNlICsgJ3JldHVybiBfX3A7XFxuJztcblxuICAgIHRyeSB7XG4gICAgICB2YXIgcmVuZGVyID0gbmV3IEZ1bmN0aW9uKHNldHRpbmdzLnZhcmlhYmxlIHx8ICdvYmonLCAnXycsIHNvdXJjZSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgZS5zb3VyY2UgPSBzb3VyY2U7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cblxuICAgIHZhciB0ZW1wbGF0ZSA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHJldHVybiByZW5kZXIuY2FsbCh0aGlzLCBkYXRhLCBfKTtcbiAgICB9O1xuXG4gICAgLy8gUHJvdmlkZSB0aGUgY29tcGlsZWQgc291cmNlIGFzIGEgY29udmVuaWVuY2UgZm9yIHByZWNvbXBpbGF0aW9uLlxuICAgIHZhciBhcmd1bWVudCA9IHNldHRpbmdzLnZhcmlhYmxlIHx8ICdvYmonO1xuICAgIHRlbXBsYXRlLnNvdXJjZSA9ICdmdW5jdGlvbignICsgYXJndW1lbnQgKyAnKXtcXG4nICsgc291cmNlICsgJ30nO1xuXG4gICAgcmV0dXJuIHRlbXBsYXRlO1xuICB9O1xuXG4gIC8vIEFkZCBhIFwiY2hhaW5cIiBmdW5jdGlvbi4gU3RhcnQgY2hhaW5pbmcgYSB3cmFwcGVkIFVuZGVyc2NvcmUgb2JqZWN0LlxuICBfLmNoYWluID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGluc3RhbmNlID0gXyhvYmopO1xuICAgIGluc3RhbmNlLl9jaGFpbiA9IHRydWU7XG4gICAgcmV0dXJuIGluc3RhbmNlO1xuICB9O1xuXG4gIC8vIE9PUFxuICAvLyAtLS0tLS0tLS0tLS0tLS1cbiAgLy8gSWYgVW5kZXJzY29yZSBpcyBjYWxsZWQgYXMgYSBmdW5jdGlvbiwgaXQgcmV0dXJucyBhIHdyYXBwZWQgb2JqZWN0IHRoYXRcbiAgLy8gY2FuIGJlIHVzZWQgT08tc3R5bGUuIFRoaXMgd3JhcHBlciBob2xkcyBhbHRlcmVkIHZlcnNpb25zIG9mIGFsbCB0aGVcbiAgLy8gdW5kZXJzY29yZSBmdW5jdGlvbnMuIFdyYXBwZWQgb2JqZWN0cyBtYXkgYmUgY2hhaW5lZC5cblxuICAvLyBIZWxwZXIgZnVuY3Rpb24gdG8gY29udGludWUgY2hhaW5pbmcgaW50ZXJtZWRpYXRlIHJlc3VsdHMuXG4gIHZhciByZXN1bHQgPSBmdW5jdGlvbihpbnN0YW5jZSwgb2JqKSB7XG4gICAgcmV0dXJuIGluc3RhbmNlLl9jaGFpbiA/IF8ob2JqKS5jaGFpbigpIDogb2JqO1xuICB9O1xuXG4gIC8vIEFkZCB5b3VyIG93biBjdXN0b20gZnVuY3Rpb25zIHRvIHRoZSBVbmRlcnNjb3JlIG9iamVjdC5cbiAgXy5taXhpbiA9IGZ1bmN0aW9uKG9iaikge1xuICAgIF8uZWFjaChfLmZ1bmN0aW9ucyhvYmopLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgICB2YXIgZnVuYyA9IF9bbmFtZV0gPSBvYmpbbmFtZV07XG4gICAgICBfLnByb3RvdHlwZVtuYW1lXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYXJncyA9IFt0aGlzLl93cmFwcGVkXTtcbiAgICAgICAgcHVzaC5hcHBseShhcmdzLCBhcmd1bWVudHMpO1xuICAgICAgICByZXR1cm4gcmVzdWx0KHRoaXMsIGZ1bmMuYXBwbHkoXywgYXJncykpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfTtcblxuICAvLyBBZGQgYWxsIG9mIHRoZSBVbmRlcnNjb3JlIGZ1bmN0aW9ucyB0byB0aGUgd3JhcHBlciBvYmplY3QuXG4gIF8ubWl4aW4oXyk7XG5cbiAgLy8gQWRkIGFsbCBtdXRhdG9yIEFycmF5IGZ1bmN0aW9ucyB0byB0aGUgd3JhcHBlci5cbiAgXy5lYWNoKFsncG9wJywgJ3B1c2gnLCAncmV2ZXJzZScsICdzaGlmdCcsICdzb3J0JywgJ3NwbGljZScsICd1bnNoaWZ0J10sIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICB2YXIgbWV0aG9kID0gQXJyYXlQcm90b1tuYW1lXTtcbiAgICBfLnByb3RvdHlwZVtuYW1lXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIG9iaiA9IHRoaXMuX3dyYXBwZWQ7XG4gICAgICBtZXRob2QuYXBwbHkob2JqLCBhcmd1bWVudHMpO1xuICAgICAgaWYgKChuYW1lID09PSAnc2hpZnQnIHx8IG5hbWUgPT09ICdzcGxpY2UnKSAmJiBvYmoubGVuZ3RoID09PSAwKSBkZWxldGUgb2JqWzBdO1xuICAgICAgcmV0dXJuIHJlc3VsdCh0aGlzLCBvYmopO1xuICAgIH07XG4gIH0pO1xuXG4gIC8vIEFkZCBhbGwgYWNjZXNzb3IgQXJyYXkgZnVuY3Rpb25zIHRvIHRoZSB3cmFwcGVyLlxuICBfLmVhY2goWydjb25jYXQnLCAnam9pbicsICdzbGljZSddLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgdmFyIG1ldGhvZCA9IEFycmF5UHJvdG9bbmFtZV07XG4gICAgXy5wcm90b3R5cGVbbmFtZV0gPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiByZXN1bHQodGhpcywgbWV0aG9kLmFwcGx5KHRoaXMuX3dyYXBwZWQsIGFyZ3VtZW50cykpO1xuICAgIH07XG4gIH0pO1xuXG4gIC8vIEV4dHJhY3RzIHRoZSByZXN1bHQgZnJvbSBhIHdyYXBwZWQgYW5kIGNoYWluZWQgb2JqZWN0LlxuICBfLnByb3RvdHlwZS52YWx1ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl93cmFwcGVkO1xuICB9O1xuXG4gIC8vIFByb3ZpZGUgdW53cmFwcGluZyBwcm94eSBmb3Igc29tZSBtZXRob2RzIHVzZWQgaW4gZW5naW5lIG9wZXJhdGlvbnNcbiAgLy8gc3VjaCBhcyBhcml0aG1ldGljIGFuZCBKU09OIHN0cmluZ2lmaWNhdGlvbi5cbiAgXy5wcm90b3R5cGUudmFsdWVPZiA9IF8ucHJvdG90eXBlLnRvSlNPTiA9IF8ucHJvdG90eXBlLnZhbHVlO1xuXG4gIF8ucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuICcnICsgdGhpcy5fd3JhcHBlZDtcbiAgfTtcblxuICAvLyBBTUQgcmVnaXN0cmF0aW9uIGhhcHBlbnMgYXQgdGhlIGVuZCBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIEFNRCBsb2FkZXJzXG4gIC8vIHRoYXQgbWF5IG5vdCBlbmZvcmNlIG5leHQtdHVybiBzZW1hbnRpY3Mgb24gbW9kdWxlcy4gRXZlbiB0aG91Z2ggZ2VuZXJhbFxuICAvLyBwcmFjdGljZSBmb3IgQU1EIHJlZ2lzdHJhdGlvbiBpcyB0byBiZSBhbm9ueW1vdXMsIHVuZGVyc2NvcmUgcmVnaXN0ZXJzXG4gIC8vIGFzIGEgbmFtZWQgbW9kdWxlIGJlY2F1c2UsIGxpa2UgalF1ZXJ5LCBpdCBpcyBhIGJhc2UgbGlicmFyeSB0aGF0IGlzXG4gIC8vIHBvcHVsYXIgZW5vdWdoIHRvIGJlIGJ1bmRsZWQgaW4gYSB0aGlyZCBwYXJ0eSBsaWIsIGJ1dCBub3QgYmUgcGFydCBvZlxuICAvLyBhbiBBTUQgbG9hZCByZXF1ZXN0LiBUaG9zZSBjYXNlcyBjb3VsZCBnZW5lcmF0ZSBhbiBlcnJvciB3aGVuIGFuXG4gIC8vIGFub255bW91cyBkZWZpbmUoKSBpcyBjYWxsZWQgb3V0c2lkZSBvZiBhIGxvYWRlciByZXF1ZXN0LlxuICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgZGVmaW5lKCd1bmRlcnNjb3JlJywgW10sIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIF87XG4gICAgfSk7XG4gIH1cbn0uY2FsbCh0aGlzKSk7XG4iLCJcInVzZSBzdHJpY3RcIjtcbnZhciBjb25maWd1cmFibGUgPSByZXF1aXJlKCcuL3V0aWwvY29uZmlndXJhYmxlJyk7XG52YXIgeEF4aXNGYWN0b3J5ID0gcmVxdWlyZSgnLi94QXhpcycpO1xudmFyIGZpbHRlckxpbmUgPSByZXF1aXJlKCcuL2ZpbHRlckxpbmUnKTtcbnZhciBmaWx0ZXJEYXRhID0gcmVxdWlyZSgnLi9maWx0ZXJEYXRhJyk7XG52YXIgdGFza0ZhY3RvcnkgPSByZXF1aXJlKCcuL3Rhc2tGYWN0b3J5Jyk7XG52YXIgbGlua0ZhY3RvcnkgPSByZXF1aXJlKCcuL2xpbmtGYWN0b3J5Jyk7XG52YXIgdGFza0Z1bmN0aW9ucyA9IHJlcXVpcmUoJy4vdGFza0Z1bmN0aW9ucycpO1xudmFyIGNhbGN1bGF0ZSA9IHJlcXVpcmUoJy4vY2FsY3VsYXRlJyk7XG5cbnZhciBfID0gcmVxdWlyZSgndW5kZXJzY29yZScpO1xuXG52YXIgZm9ybWF0ZXIgPSBkMy50aW1lLmZvcm1hdChcIiVZLSVtLSVkICVIXCIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChkMykge1xuXG4gICAgLy/kuIDkupvpu5jorqTnmoTphY3nva5cbiAgICB2YXIgZGVmYXVsdENvbmZpZyA9IHtcbiAgICAgICAgbmFtZTogJ3Byb2plY3QgbWFuYWdlcicsXG4gICAgICAgIHRhc2tNYXBzOiB7fSwgLy/ku7vliqHlnLDlm75cbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgbGlua3M6IFtdLCAvL+eUu+e6v1xuICAgICAgICAgICAgdGFza3M6IFtdLCAvL+S7u+WKoVxuICAgICAgICB9LCAvL+WOn+Wni+aVsOaNruWMulxuICAgICAgICBzdGFydDogZDMudGltZS5kYXkobmV3IERhdGUoKSksXG4gICAgICAgIGVuZDogZDMudGltZS5kYXkub2Zmc2V0KGQzLnRpbWUuZGF5KG5ldyBEYXRlKCkpLCA3KSxcbiAgICAgICAgc2NhbGU6IDEsIC8v5b2T5YmN55qE57u95pS+57qn5Yir5piv5aSa5bCRXG4gICAgICAgIHRyYW5zbGF0ZVg6IDAsIC8v5b2T5YmN5ZyoeOi9tOS4iueahOWBj+enu+mHj+aYr+WkmlxuICAgICAgICBtaW5TY2FsZTogMC4wMyxcbiAgICAgICAgbWF4U2NhbGU6IDIsXG4gICAgICAgIHNob3dCYXNlbGluZTogZmFsc2UsIC8v5piv5ZCm5pi+56S65Z+657q/XG4gICAgICAgIHNob3dUYXNrTmFtZTogZmFsc2UsIC8v5piv5ZCm5pi+56S65Lu75Yqh5ZCNXG4gICAgICAgIG1hcmdpbjoge1xuICAgICAgICAgICAgdG9wOiA0LFxuICAgICAgICAgICAgbGVmdDogMCxcbiAgICAgICAgICAgIGJvdHRvbTogNDUsXG4gICAgICAgICAgICByaWdodDogMFxuICAgICAgICB9LFxuICAgICAgICBjbGFzc0ZpeDogZnVuY3Rpb24gKHRhc2spIHtcbiAgICAgICAgICAgIHZhciBwcmkgPSB0YXNrID8gXCIgcHJpb3JpdHktXCIgKyB0YXNrLnByaW9yaXR5IDogXCJcIjtcbiAgICAgICAgICAgIHZhciBkdWVPdXQgPSB0YXNrICYmIHRhc2suZW5kRGF0ZSAmJiB0YXNrLmVuZERhdGUuZ2V0VGltZSgpIDwgbmV3IERhdGUoKS5nZXRUaW1lKCkgPyBcIiBkdWUtb3V0IFwiIDogXCJcIjtcbiAgICAgICAgICAgIHJldHVybiAnaXRlbSAnICsgcHJpICsgZHVlT3V0O1xuICAgICAgICB9LFxuICAgICAgICB0ZXh0Rml4OiBmdW5jdGlvbiAodGFzaykge1xuICAgICAgICAgICAgcmV0dXJuIHRhc2submFtZVxuICAgICAgICB9LFxuICAgICAgICBhZnRlckluaXQ6IGZ1bmN0aW9uICgpIHtcblxuICAgICAgICB9LFxuICAgICAgICB0aWNrRm9ybWF0OiBbXG4gICAgICAgICAgICBbXCIuJUxcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZC5nZXRNaWxsaXNlY29uZHMoKTtcbiAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgW1wiOiVTXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGQuZ2V0U2Vjb25kcygpO1xuICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICBbXCIlSTolTVwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkLmdldE1pbnV0ZXMoKTtcbiAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgW1wiJUkgJXBcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZC5nZXRIb3VycygpO1xuICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICBbXCIlYSAlZFwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkLmdldERheSgpICYmIGQuZ2V0RGF0ZSgpICE9IDE7XG4gICAgICAgICAgICB9XSxcbiAgICAgICAgICAgIFtcIiViICVkXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGQuZ2V0RGF0ZSgpICE9IDE7XG4gICAgICAgICAgICB9XSxcbiAgICAgICAgICAgIFtcIiVCXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGQuZ2V0TW9udGgoKTtcbiAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgW1wiJVlcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfV1cbiAgICAgICAgXSxcbiAgICAgICAgd2lkdGg6IDEwMDBcbiAgICB9O1xuXG4gICAgdmFyIGFwcCA9IGZ1bmN0aW9uIGFwcChjb25maWcpIHtcbiAgICAgICAgdmFyIG1lID0gdGhpcztcbiAgICAgICAgY29uZmlnID0gY29uZmlnIHx8IHt9O1xuICAgICAgICBtZS5jb25maWcgPSBjb25maWcgPSAkLmV4dGVuZChkZWZhdWx0Q29uZmlnLCBjb25maWcpO1xuICAgICAgICBtZS5sb2dnZXIgPSByZXF1aXJlKCcuL2xvZ2dlcicpKGQzKTtcbiAgICAgICAgdmFyIHhTY2FsZSA9IG1lLnhTY2FsZSA9IGQzLnRpbWUuc2NhbGUoKTtcbiAgICAgICAgdmFyIHlTY2FsZSA9IG1lLnlTY2FsZSA9IGQzLnNjYWxlLm9yZGluYWwoKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICog6K6h566X5piv5LiA5bm055qE56ys5Yeg5ZGoLOeUqOWcqOi9tOS4ilxuICAgICAgICAgKiBhIHllYXIgYiBtb250aCBjIGRheVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5nZXRZZWFyV2VlayA9IGZ1bmN0aW9uIChhLCBiLCBjKSB7XG4gICAgICAgICAgICAvKlxuICAgICAgICAgICAgIGRhdGUx5piv5b2T5YmN5pel5pyfXG4gICAgICAgICAgICAgZGF0ZTLmmK/lvZPlubTnrKzkuIDlpKlcbiAgICAgICAgICAgICBk5piv5b2T5YmN5pel5pyf5piv5LuK5bm056ys5aSa5bCR5aSpXG4gICAgICAgICAgICAg55SoZCArIOW9k+WJjeW5tOeahOesrOS4gOWkqeeahOWRqOW3rui3neeahOWSjOWcqOmZpOS7pTflsLHmmK/mnKzlubTnrKzlh6DlkahcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdmFyIGRhdGUxID0gbmV3IERhdGUoYSwgcGFyc2VJbnQoYikgLSAxLCBjKSxcbiAgICAgICAgICAgICAgICBkYXRlMiA9IG5ldyBEYXRlKGEsIDAsIDEpLFxuICAgICAgICAgICAgICAgIGQgPSBNYXRoLnJvdW5kKChkYXRlMS52YWx1ZU9mKCkgLSBkYXRlMi52YWx1ZU9mKCkpIC8gODY0MDAwMDApO1xuICAgICAgICAgICAgcmV0dXJuIE1hdGguY2VpbChcbiAgICAgICAgICAgICAgICAoZCArICgoZGF0ZTIuZ2V0RGF5KCkgKyAxKSAtIDEpKSAvIDdcbiAgICAgICAgICAgICk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5nZXRUcmFuc2Zvcm1YID0gZnVuY3Rpb24gKHN0cikge1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IDA7XG4gICAgICAgICAgICBpZiAoc3RyKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN0YXJ0ID0gc3RyLmluZGV4T2YoJygnKTtcbiAgICAgICAgICAgICAgICB2YXIgZW5kID0gc3RyLmluZGV4T2YoJywnKTtcbiAgICAgICAgICAgICAgICB2YXIgX3N0ciA9IHN0ci5zdWJzdHJpbmcoc3RhcnQgKyAxLCBlbmQpO1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHBhcnNlRmxvYXQoX3N0cik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5nZXRUcmFuc2Zvcm1ZID0gZnVuY3Rpb24gKHN0cikge1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IDA7XG4gICAgICAgICAgICBpZiAoc3RyKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN0YXJ0ID0gc3RyLmluZGV4T2YoJywnKTtcbiAgICAgICAgICAgICAgICB2YXIgZW5kID0gc3RyLmluZGV4T2YoJyknKTtcbiAgICAgICAgICAgICAgICB2YXIgX3N0ciA9IHN0ci5zdWJzdHJpbmcoc3RhcnQgKyAxLCBlbmQpO1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHBhcnNlRmxvYXQoX3N0cik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOmAieS4reS4gOS4quS7u+WKoeaViOaenFxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5zZWxlY3RUYXNrID0gZnVuY3Rpb24gKHRhc2tJZCkge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ3NlbGVjdFRhc2s6JyArIHRhc2tJZCk7XG4gICAgICAgICAgICBpZiAodGFza0lkKSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2codGFza0lkKTtcbiAgICAgICAgICAgICAgICBtZS5jb25maWcuc2VsZWN0VGFza0lkID0gdGFza0lkO1xuICAgICAgICAgICAgICAgIGQzLnNlbGVjdCgnI3NlbGVjdC1iZycpLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgIHZhciBsaW5lID0gJyNhcHAtd3JhcHBlcic7XG4gICAgICAgICAgICAgICAgdmFyIHNlbGVjdEJnID0gZDMuc2VsZWN0KGxpbmUpLmluc2VydCgncmVjdCcpXG4gICAgICAgICAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsIFwic2VsZWN0LWJnXCIpXG4gICAgICAgICAgICAgICAgICAgIC5hdHRyKCdpZCcsICdzZWxlY3QtYmcnKVxuICAgICAgICAgICAgICAgICAgICAuYXR0cignaGVpZ2h0JywgMzApXG4gICAgICAgICAgICAgICAgICAgIC5hdHRyKCdvcGFjaXR5JywgJzAuNCcpXG4gICAgICAgICAgICAgICAgICAgIC8vIC5hdHRyKCdmaWxsJywgXCIjRkRGNkQyXCIpXG4gICAgICAgICAgICAgICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgeSA9IG1lLnlTY2FsZSh0YXNrSWQpIC0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAndHJhbnNsYXRlKDAsJyArIHkgKyAnKSc7XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLy8gLmF0dHIoJ3dpZHRoJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgLy8gICByZXR1cm4gMzAwMDtcbiAgICAgICAgICAgICAgICAvLyB9KTtcbiAgICAgICAgICAgICAgICAvL+S6pOaNouWxgue6p1xuICAgICAgICAgICAgICAgICQobGluZSkucHJlcGVuZCgkKCcjc2VsZWN0LWJnJykpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOa4hemZpOmAieS4reS4gOS4quS7u+WKoeaViOaenFxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jbGVhclNlbGVjdGVkVGFzayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIG1lLmNvbmZpZy5zZWxlY3RUYXNrSWQgPSBudWxsO1xuICAgICAgICAgICAgZDMuc2VsZWN0KCcjc2VsZWN0LWJnJykucmVtb3ZlKCk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICog5YaN5qyh5Yid5aeL5YyW5pWw5o2uXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnNldERhdGEgPSBmdW5jdGlvbiAoX2RhdGEpIHtcbiAgICAgICAgICAgIG1lLmNvbmZpZy5kYXRhID0gX2RhdGE7XG4gICAgICAgICAgICBtZS5tYXAgPSB7fTtcbiAgICAgICAgICAgIHZhciB2aXNpdCA9IGZ1bmN0aW9uIChjaGlsZHJlbnMpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWNoaWxkcmVucykgcmV0dXJuO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW5zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB0YXNrID0gY2hpbGRyZW5zW2ldO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygndXVpZD0nICsgdGFzay51dWlkKVxuICAgICAgICAgICAgICAgICAgICB0YXNrID0gdGFza0Z1bmN0aW9ucyhkMywgbWUsIHRhc2spO1xuICAgICAgICAgICAgICAgICAgICBtZS5jb25maWcudGFza01hcHNbdGFzay51dWlkXSA9IHRhc2s7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjaGlsZHJlbiA9IHRhc2suY2hpbGRyZW47XG4gICAgICAgICAgICAgICAgICAgIHZpc2l0KGNoaWxkcmVuKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2aXNpdChtZS5jb25maWcuZGF0YSk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICog5a6M5YWo5Yi35pawLOWMheaLrOi9tOaVsOaNrlxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5yZWZyZXNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbWUuaW5pdCh0cnVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDliLfmlrDmiYDmnInku7vliqFcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMucmVmc2hBbGxUYXNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbWUucmVkcmF3KHRydWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOWIt+aWsOWPr+inhumDqOWIhuS7u+WKoVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5yZWZzaFNjcmVlblRhc2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBtZS5yZWRyYXcoZmFsc2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOeUu+Wfuue6v1xuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5zaG93QmFzZWxpbmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBtZS5jb25maWcuc2hvd0Jhc2VsaW5lID0gdHJ1ZTtcbiAgICAgICAgICAgIG1lLnJlZHJhdyh0cnVlKTtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOa4hemZpOWfuue6v1xuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5oaWRlQmFzZWxpbmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBtZS5jb25maWcuc2hvd0Jhc2VsaW5lID0gZmFsc2U7XG4gICAgICAgICAgICBtZS5yZWRyYXcodHJ1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICog6I635b6X5b2T5YmN55qE6YWN572u5L+h5oGvXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmdldENvbmZpZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBtZS5jb25maWc7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICog57uY5Yi257yp5pS+5LqL5Lu2ZG9tXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmRyYXdab29tRWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBtZS56b29tUmVjdCA9IG1lLmFwcFdyYXBwZXJcbiAgICAgICAgICAgICAgICAuYXBwZW5kKCdyZWN0JylcbiAgICAgICAgICAgICAgICAuY2xhc3NlZCgnem9vbScsIHRydWUpXG4gICAgICAgICAgICAgICAgLmF0dHIoJ3dpZHRoJywgbWUuZ3JhcGhXaWR0aClcbiAgICAgICAgICAgICAgICAuYXR0cignaGVpZ2h0JywgbWUuZ3JhcGhIZWlnaHQpXG4gICAgICAgICAgICAgICAgLmNhbGwobWUuem9vbSlcbiAgICAgICAgICAgICAgICAub24oJ2RibGNsaWNrLnpvb20nLCBudWxsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDnp7vliqjliLDmn5DkuIDlpKlcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMubW92ZVRvID0gZnVuY3Rpb24gKGRhdGUpIHtcbiAgICAgICAgICAgIGlmICghZGF0ZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZXJyb3IgZGF0ZVwiKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgb2Zmc2V0ID0gLTU7IC8v6K6+572u5LiA5Liq5YGP56e76YeP77yM5LiN6Iez5LqO5Yia5aW95Zyo6L655LiK5pi+56S6XG4gICAgICAgICAgICBkYXRlID0gZDMudGltZS5kYXkub2Zmc2V0KGRhdGUsIG9mZnNldClcbiAgICAgICAgICAgIHZhciB4U2NhbGUgPSBtZS54U2NhbGU7XG4gICAgICAgICAgICB2YXIgZG9tYWluID0geFNjYWxlLmRvbWFpbigpO1xuICAgICAgICAgICAgdmFyIHN0YXJ0ID0gZG9tYWluWzBdO1xuICAgICAgICAgICAgdmFyIHhPZmZzZXQgPSB4U2NhbGUoc3RhcnQpIC0geFNjYWxlKGRhdGUpO1xuICAgICAgICAgICAgdmFyIGN1cnIgPSBtZS56b29tLnRyYW5zbGF0ZSgpWzBdO1xuICAgICAgICAgICAgbWUuem9vbS50cmFuc2xhdGUoW2N1cnIgKyB4T2Zmc2V0LCAwXSk7XG4gICAgICAgICAgICBtZS5yZWRyYXcoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDnvKnmlL7kuovku7blvIDlp4vlpITnkIblh73mlbBcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuem9vbXN0YXJ0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY29uZmlnLnNjYWxlID0gbnVsbDtcbiAgICAgICAgICAgIGNvbmZpZy50cmFuc2xhdGUgPSBudWxsO1xuICAgICAgICAgICAgJCgnYm9keScpLmNzcyh7XG4gICAgICAgICAgICAgICAgJ2N1cnNvcic6ICdtb3ZlJ1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoZDMuZXZlbnQuc291cmNlRXZlbnQgJiYgZDMuZXZlbnQuc291cmNlRXZlbnQudG9TdHJpbmcoKSA9PT0gJ1tvYmplY3QgV2hlZWxFdmVudF0nKSB7XG4gICAgICAgICAgICAgICAgY29uZmlnLnNjYWxlID0gbWUuem9vbS5zY2FsZSgpOyAvL+avlOeOh1xuICAgICAgICAgICAgICAgIGNvbmZpZy50cmFuc2xhdGUgPSBtZS56b29tLnRyYW5zbGF0ZSgpOyAvL+WBj+enu+mHj1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOe8qeaUvuS6i+S7tuWkhOeQhuWHveaVsFxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy51cGRhdGVab29tID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy/lpoLmnpzmmK/lt6blj7Pmi5bliqjmk43kvZxcbiAgICAgICAgICAgIGlmIChkMy5ldmVudC5zb3VyY2VFdmVudCAmJiBkMy5ldmVudC5zb3VyY2VFdmVudC50b1N0cmluZygpID09PSAnW29iamVjdCBNb3VzZUV2ZW50XScpIHtcbiAgICAgICAgICAgICAgICAvLyBkMy5zZWxlY3RBbGwoJy5tZW51JykucmVtb3ZlKClcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZygn5ouW5YqoJyk7XG4gICAgICAgICAgICAgICAgLy8gbWUuY29uZmlnLnRyYW5zbGF0ZSA9IFtkMy5ldmVudC50cmFuc2xhdGVbMF0sIDBdO1xuICAgICAgICAgICAgICAgIG1lLnpvb20udHJhbnNsYXRlKFtkMy5ldmVudC50cmFuc2xhdGVbMF0sIDBdKTtcbiAgICAgICAgICAgICAgICBpZiAobWUudGltZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KG1lLnRpbWVyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbWUucmVkcmF3KGZhbHNlKTtcbiAgICAgICAgICAgICAgICBtZS50aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBtZS5yZWRyYXcodHJ1ZSk7XG4gICAgICAgICAgICAgICAgfSwgMzAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8v5aaC5p6c5piv57yp5pS+5pON5L2cXG4gICAgICAgICAgICBpZiAoZDMuZXZlbnQuc291cmNlRXZlbnQgJiYgZDMuZXZlbnQuc291cmNlRXZlbnQudG9TdHJpbmcoKSA9PT0gJ1tvYmplY3QgV2hlZWxFdmVudF0nKSB7XG4gICAgICAgICAgICAgICAgaWYgKGQzLmV2ZW50LnNvdXJjZUV2ZW50LmFsdEtleSkge1xuICAgICAgICAgICAgICAgICAgICAvL+WPquacieaMieS4i2FsdCvpvKDmoIfnmoTml7blgJnmiY3mnInmu5rliqhcbiAgICAgICAgICAgICAgICAgICAgbWUuem9vbS5zY2FsZShkMy5ldmVudC5zY2FsZSk7XG4gICAgICAgICAgICAgICAgICAgIG1lLnpvb20udHJhbnNsYXRlKFtkMy5ldmVudC50cmFuc2xhdGVbMF0sIDBdKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1lLnRpbWVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQobWUudGltZXIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIG1lLnJlZHJhdyhmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgIG1lLnRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZS5yZWRyYXcodHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH0sIDMwMCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy/lvZPmsqHmnInmjInkuIthbHTml7bvvIzopoHkv53mjIHkvY/liJ3lp4vkv6Hmga9cbiAgICAgICAgICAgICAgICAgICAgbWUuem9vbS5zY2FsZShjb25maWcuc2NhbGUpO1xuICAgICAgICAgICAgICAgICAgICBtZS56b29tLnRyYW5zbGF0ZShjb25maWcudHJhbnNsYXRlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICog57yp5pS+5LqL5Lu257uT5p2f5aSE55CG5Ye95pWwXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnpvb21FbmQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkKCdib2R5JykuY3NzKHtcbiAgICAgICAgICAgICAgICAnY3Vyc29yJzogJ2RlZmF1bHQnXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgY29uZmlnLnpvb21IYW5kbGVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgY29uZmlnLnpvb21IYW5kbGVyKHtcbiAgICAgICAgICAgICAgICAgICAgc2NhbGU6IG1lLnpvb20uc2NhbGUoKSxcbiAgICAgICAgICAgICAgICAgICAgdHJhbnNsYXRlWDogbWUuem9vbS50cmFuc2xhdGUoKVswXVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLypcbiAgICAgICAgICog55S75Ye6eei9tFxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5kcmF3WUF4aXNUaWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbWUuYXBwV3JhcHBlci5zZWxlY3QoJy55LWF4aXMnKS5yZW1vdmUoKTtcbiAgICAgICAgICAgIC8veeWuueWZqFxuICAgICAgICAgICAgdmFyIHlBeGlzRWwgPSBtZS5hcHBXcmFwcGVyLmFwcGVuZCgnZycpXG4gICAgICAgICAgICAgICAgLmNsYXNzZWQoJ3ktYXhpcyBheGlzJywgdHJ1ZSlcbiAgICAgICAgICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZSgwLCAtMSknKVxuICAgICAgICAgICAgICAgIC5hdHRyKCdvcGFjaXR5JywgJzAuNCcpO1xuICAgICAgICAgICAgLy955pWw5o2uXG4gICAgICAgICAgICB2YXIgeVRpY2sgPSB5QXhpc0VsLmFwcGVuZCgnZycpLnNlbGVjdEFsbCgnZycpLmRhdGEobWUueURvbWFpbik7XG4gICAgICAgICAgICAvL3ktbGluZVxuICAgICAgICAgICAgeVRpY2suZW50ZXIoKVxuICAgICAgICAgICAgICAgIC5hcHBlbmQoJ2cnKVxuICAgICAgICAgICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ3RyYW5zbGF0ZSgwLCAnICsgKHlTY2FsZShkKSArIDMwKSArICcpJztcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5hcHBlbmQoJ2xpbmUnKVxuICAgICAgICAgICAgICAgIC5jbGFzc2VkKCd5LXRpY2snLCB0cnVlKVxuICAgICAgICAgICAgICAgIC8vIC5hdHRyKFwic3Ryb2tlLWRhc2hhcnJheVwiLCBcIjEwLCAxMFwiKVxuICAgICAgICAgICAgICAgIC5hdHRyKCd4MScsIGNvbmZpZy5tYXJnaW4ubGVmdClcbiAgICAgICAgICAgICAgICAuYXR0cigneDInLCBjb25maWcubWFyZ2luLmxlZnQgKyBtZS5ncmFwaFdpZHRoKTtcbiAgICAgICAgICAgIHlUaWNrLmV4aXQoKS5yZW1vdmUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZHJhd0xpbmtzID0gZnVuY3Rpb24gKGxpbmtzKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhsaW5rc1tsaW5rcy5sZW5ndGggLSAxXSk7XG4gICAgICAgICAgICBsaW5rRmFjdG9yeShkMywgbWUsIG1lLnBhdGhzV3JhcHBlciwgbGlua3MpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jYWxjdWxhdGVMaW5lRWZmZWN0ID0gZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgcmVzdWx0ID0gY2FsY3VsYXRlKGQzLCBtZSwgcmVzdWx0KTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNsZWVhclBvaW50ZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBkMy5zZWxlY3RBbGwoXCIudGVtcGxpbmtcIikucmVtb3ZlKCk7XG4gICAgICAgICAgICBkMy5zZWxlY3RBbGwoXCIucG9pbnRlclwiKS5yZW1vdmUoKTtcbiAgICAgICAgICAgIGQzLnNlbGVjdEFsbCgnLmdob3N0Ym94JykucmVtb3ZlKCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmRyYXdQb2ludGVyID0gZnVuY3Rpb24gKHRhc2spIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIGQzLnNlbGVjdEFsbCgnLnBvaW50ZXInKS5yZW1vdmUoKTtcbiAgICAgICAgICAgIHZhciBjYnggPSBtZS5zdmcuYXBwZW5kKCdnJykuY2xhc3NlZCgncG9pbnRlcicsIHRydWUpO1xuXG4gICAgICAgICAgICB2YXIgeU9mZnNldCA9IDA7XG4gICAgICAgICAgICB2YXIgeE9mZnNldCA9IDA7XG4gICAgICAgICAgICB2YXIgYnRuV2lkdGggPSAxMDtcbiAgICAgICAgICAgIHZhciBidG5IZWlnaHQgPSAzMDtcblxuICAgICAgICAgICAgY2J4LmFwcGVuZCgnY2lyY2xlJylcbiAgICAgICAgICAgICAgICAuYXR0cigncicsIDQpXG4gICAgICAgICAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2RvdCcpXG4gICAgICAgICAgICAgICAgLmF0dHIoJ2ZpbGwnLCBcInJlZFwiKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwidGFza0lkXCIsIHRhc2sudXVpZClcbiAgICAgICAgICAgICAgICAuYXR0cihcInR5cGVcIiwgXCJzdGFydFwiKVxuICAgICAgICAgICAgICAgIC5hdHRyKCdjeCcsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB4ID0geFNjYWxlKHRhc2suc3RhcnREYXRlKSAtIGJ0bldpZHRoIC0geE9mZnNldCAtIDM7IC8vYnRu5pys6Lqr55qE5a695bqm5ZKM5YGP56e76YePXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB4O1xuICAgICAgICAgICAgICAgIH0pLmF0dHIoJ19jeCcsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgdmFyIHggPSB4U2NhbGUodGFzay5zdGFydERhdGUpOyAvL2J0buacrOi6q+eahOWuveW6puWSjOWBj+enu+mHj1xuICAgICAgICAgICAgICAgIHJldHVybiB4O1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuYXR0cignY3knLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgeSA9IHlTY2FsZSh0YXNrLnV1aWQpICsgeU9mZnNldCArIDE1O1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4geTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5jYWxsKGRyYWcpO1xuXG4gICAgICAgICAgICBjYnguYXBwZW5kKCdjaXJjbGUnKVxuICAgICAgICAgICAgICAgIC5hdHRyKCdyJywgNClcbiAgICAgICAgICAgICAgICAuYXR0cignY2xhc3MnLCAnZG90JylcbiAgICAgICAgICAgICAgICAuYXR0cignZmlsbCcsICdyZWQnKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwidGFza0lkXCIsIHRhc2sudXVpZClcbiAgICAgICAgICAgICAgICAuYXR0cihcInR5cGVcIiwgXCJlbmRcIilcbiAgICAgICAgICAgICAgICAuYXR0cignY3gnLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgeCA9IHhTY2FsZSh0YXNrLmVuZERhdGUpICsgeE9mZnNldCArIDEyO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4geDtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5hdHRyKCdfY3gnLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgeCA9IHhTY2FsZSh0YXNrLmVuZERhdGUpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4geDtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5hdHRyKCdjeScsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB5ID0geVNjYWxlKHRhc2sudXVpZCkgKyB5T2Zmc2V0ICsgMTU7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB5O1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmNhbGwoZHJhZyk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZHJhZyA9IGQzLmJlaGF2aW9yLmRyYWcoKVxuICAgICAgICAgICAgLm9uKCdkcmFnc3RhcnQnLCBmdW5jdGlvbiAoZCwgaSkge1xuICAgICAgICAgICAgICAgIHZhciBkb20gPSBkMy5zZWxlY3QodGhpcyk7XG4gICAgICAgICAgICAgICAgZG9tLmF0dHIoJ2N4MCcsIGRvbS5hdHRyKCdfY3gnKSk7XG4gICAgICAgICAgICAgICAgZG9tLmF0dHIoJ2N5MCcsIGRvbS5hdHRyKCdjeScpKTtcbiAgICAgICAgICAgICAgICBtZS5kcmF3R2hvc3QoKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAub24oJ2RyYWcnLCBmdW5jdGlvbiAoZCwgaSkge1xuICAgICAgICAgICAgICAgIHZhciBjeCA9ICtkMy5zZWxlY3QodGhpcykuYXR0cignY3gnKTtcbiAgICAgICAgICAgICAgICB2YXIgY3kgPSArZDMuc2VsZWN0KHRoaXMpLmF0dHIoJ2N5Jyk7XG4gICAgICAgICAgICAgICAgY3ggKz0gZDMuZXZlbnQuZHg7XG4gICAgICAgICAgICAgICAgY3kgKz0gZDMuZXZlbnQuZHk7XG4gICAgICAgICAgICAgICAgZDMuc2VsZWN0KHRoaXMpLmF0dHIoJ2N4JywgY3gpLmF0dHIoJ2N5JywgY3kpO1xuICAgICAgICAgICAgICAgIG1lLmRyYWdnaW5nTm9kZSA9IHRoaXM7XG4gICAgICAgICAgICAgICAgbWUudXBkYXRlVGVtcENvbm5lY3RvcigpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5vbignZHJhZ2VuZCcsIGZ1bmN0aW9uIChkLCBpKSB7XG4gICAgICAgICAgICAgICAgbWUuZHJhZ2dpbmdOb2RlID0gbnVsbDtcbiAgICAgICAgICAgICAgICBtZS5zZWxlY3RlZE5vZGUgPSBudWxsO1xuICAgICAgICAgICAgICAgIGlmIChtZS5jb25maWcubGlua0RhdGEgJiYgbWUuY29uZmlnLmxpbmtEYXRhLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGQgPSBtZS5jb25maWcubGlua0RhdGFbMF07XG4gICAgICAgICAgICAgICAgICAgIHZhciBmcm9tSWQgPSBkLnNvdXJjZS50YXNrSWQ7XG4gICAgICAgICAgICAgICAgICAgIHZhciBmdCA9IGQuc291cmNlLnR5cGU7XG4gICAgICAgICAgICAgICAgICAgIHZhciB0b0lkID0gZC50YXJnZXQudGFza0lkO1xuICAgICAgICAgICAgICAgICAgICB2YXIgdHQgPSBkLnRhcmdldC50eXBlO1xuICAgICAgICAgICAgICAgICAgICAvLyBzcyAxIHNmIDIgZnMgMyBmZiA0XG4gICAgICAgICAgICAgICAgICAgIHZhciB0eXBlID0gMTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZ0ID09IFwic3RhcnRcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR0ID09IFwic3RhcnRcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlID0gMjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0dCA9PSBcInN0YXJ0XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlID0gMztcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9IDQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgO1xuICAgICAgICAgICAgICAgICAgICB2YXIgbSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwicGlkXCI6IDEsXG4gICAgICAgICAgICAgICAgICAgICAgICBcImZyb21faWRcIjogcGFyc2VJbnQoZnJvbUlkKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidG9faWRcIjogcGFyc2VJbnQodG9JZCksXG4gICAgICAgICAgICAgICAgICAgICAgICBcInR5cGVcIjogdHlwZVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIG1lLmNvbmZpZy5kYXRhLmxpbmtzLnB1c2gobSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG1lLmNsZWVhclBvaW50ZXIoKTtcbiAgICAgICAgICAgICAgICBtZS5yZWRyYXcodHJ1ZSk7XG4gICAgICAgICAgICB9KVxuXG4gICAgICAgIHRoaXMudXBkYXRlVGVtcENvbm5lY3RvciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBkYXRhID0gW107XG4gICAgICAgICAgICBpZiAobWUuZHJhZ2dpbmdOb2RlICYmIG1lLnNlbGVjdGVkTm9kZSkge1xuICAgICAgICAgICAgICAgIHZhciBkcmFnZ2luZ05vZGUgPSBkMy5zZWxlY3QobWUuZHJhZ2dpbmdOb2RlKTtcbiAgICAgICAgICAgICAgICB2YXIgc2VsZWN0ZWROb2RlID0gZDMuc2VsZWN0KG1lLnNlbGVjdGVkTm9kZSk7XG4gICAgICAgICAgICAgICAgZGF0YSA9IFt7XG4gICAgICAgICAgICAgICAgICAgIHNvdXJjZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGFza0lkOiBkcmFnZ2luZ05vZGUuYXR0cihcInRhc2tJZFwiKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IGRyYWdnaW5nTm9kZS5hdHRyKFwidHlwZVwiKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHg6IHBhcnNlSW50KGRyYWdnaW5nTm9kZS5hdHRyKFwiY3gwXCIpKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHk6IHBhcnNlSW50KGRyYWdnaW5nTm9kZS5hdHRyKFwiY3kwXCIpKVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB0YXJnZXQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhc2tJZDogc2VsZWN0ZWROb2RlLmF0dHIoXCJ0YXNrSWRcIiksXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBzZWxlY3RlZE5vZGUuYXR0cihcInR5cGVcIiksXG4gICAgICAgICAgICAgICAgICAgICAgICB4OiBwYXJzZUludChzZWxlY3RlZE5vZGUuYXR0cihcImN4XCIpKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHk6IHBhcnNlSW50KHNlbGVjdGVkTm9kZS5hdHRyKFwiY3lcIikpXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG1lLmNvbmZpZy5saW5rRGF0YSA9IGRhdGE7XG4gICAgICAgICAgICB2YXIgbGluayA9IG1lLnN2Zy5zZWxlY3RBbGwoXCIudGVtcGxpbmtcIikuZGF0YShkYXRhKTtcbiAgICAgICAgICAgIGxpbmsuZW50ZXIoKS5hcHBlbmQoXCJwYXRoXCIpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRlbXBsaW5rXCIpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJmaWxsXCIsIFwibm9uZVwiKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwic3Ryb2tlXCIsIFwicmVkXCIpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJzdHJva2Utd2lkdGhcIiwgXCIxcHhcIilcbiAgICAgICAgICAgICAgICAuYXR0cihcImRcIiwgZnVuY3Rpb24gKG8pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdNJyArIG8uc291cmNlLnggKyBcIixcIiArIG8uc291cmNlLnkgKyBcIiBcIiArIG8udGFyZ2V0LnggKyBcIixcIiArIG8udGFyZ2V0Lnk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuYXR0cigncG9pbnRlci1ldmVudHMnLCAnbm9uZScpO1xuICAgICAgICAgICAgbGluay5leGl0KCkucmVtb3ZlKCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5kcmF3R2hvc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgbSA9IG1lLmNvbmZpZy5tO1xuICAgICAgICAgICAgZDMuc2VsZWN0QWxsKCcuZ2hvc3Rib3gnKS5yZW1vdmUoKTtcbiAgICAgICAgICAgIHZhciBjYnggPSBtZS5zdmcuYXBwZW5kKCdnJykuY2xhc3NlZCgnZ2hvc3Rib3gnLCB0cnVlKTtcbiAgICAgICAgICAgIHZhciBjaXJjbGUgPSBjYnguc2VsZWN0QWxsKFwiLmdob3N0Q2lyY2xlXCIpLmRhdGEobSk7XG4gICAgICAgICAgICB2YXIgYzEgPSBjaXJjbGUuZW50ZXIoKS5hcHBlbmQoXCJjaXJjbGVcIilcbiAgICAgICAgICAgICAgICAuYXR0cignY2xhc3MnLCAnZ2hvc3RDaXJjbGUnKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwiclwiLCAzMClcbiAgICAgICAgICAgICAgICAuYXR0cihcImlkXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnYzEtJyArIGQ7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuYXR0cihcInRhc2tJZFwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZDtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5hdHRyKFwidHlwZVwiLCBcInN0YXJ0XCIpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJvcGFjaXR5XCIsIDAuMSkgLy8gY2hhbmdlIHRoaXMgdG8gemVybyB0byBoaWRlIHRoZSB0YXJnZXQgYXJlYVxuICAgICAgICAgICAgICAgIC5hdHRyKFwiY3hcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRhc2sgPSBtZS5jb25maWcudGFza01hcHNbZF07XG4gICAgICAgICAgICAgICAgICAgIHZhciB4ID0geFNjYWxlKHRhc2suc3RhcnREYXRlKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHg7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuYXR0cihcImN5XCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB5ID0geVNjYWxlKGQpICsgNztcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuc3R5bGUoXCJmaWxsXCIsIFwicmVkXCIpXG4gICAgICAgICAgICAgICAgLmF0dHIoJ3BvaW50ZXItZXZlbnRzJywgJ21vdXNlb3ZlcicpXG4gICAgICAgICAgICAgICAgLm9uKFwibW91c2VvdmVyXCIsIGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIG1lLnNlbGVjdGVkTm9kZSA9IGQzLnNlbGVjdChcIiNjMS1cIiArIG5vZGUpWzBdWzBdO1xuICAgICAgICAgICAgICAgICAgICBtZS51cGRhdGVUZW1wQ29ubmVjdG9yKCk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAub24oXCJtb3VzZW91dFwiLCBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgICAgICAgICAgICBtZS5zZWxlY3RlZE5vZGUgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICBtZS51cGRhdGVUZW1wQ29ubmVjdG9yKCk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHZhciBjMiA9IGNpcmNsZS5lbnRlcigpLmFwcGVuZChcImNpcmNsZVwiKVxuICAgICAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsICdnaG9zdENpcmNsZScpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJyXCIsIDMwKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwiaWRcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdjMi0nICsgZDtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5hdHRyKFwidGFza0lkXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJ0eXBlXCIsIFwiZW5kXCIpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJvcGFjaXR5XCIsIDAuMSkgLy8gY2hhbmdlIHRoaXMgdG8gemVybyB0byBoaWRlIHRoZSB0YXJnZXQgYXJlYVxuICAgICAgICAgICAgICAgIC5hdHRyKFwiY3hcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRhc2sgPSBtZS5jb25maWcudGFza01hcHNbZF07XG4gICAgICAgICAgICAgICAgICAgIHZhciB4ID0geFNjYWxlKHRhc2suZW5kRGF0ZSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB4O1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJjeVwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgeSA9IHlTY2FsZShkKSArIDc7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB5O1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLnN0eWxlKFwiZmlsbFwiLCBcInJlZFwiKVxuICAgICAgICAgICAgICAgIC5hdHRyKCdwb2ludGVyLWV2ZW50cycsICdtb3VzZW92ZXInKVxuICAgICAgICAgICAgICAgIC5vbihcIm1vdXNlb3ZlclwiLCBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgICAgICAgICAgICBtZS5zZWxlY3RlZE5vZGUgPSBkMy5zZWxlY3QoXCIjYzItXCIgKyBub2RlKVswXVswXTtcbiAgICAgICAgICAgICAgICAgICAgbWUudXBkYXRlVGVtcENvbm5lY3RvcigpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLm9uKFwibW91c2VvdXRcIiwgZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgbWUuc2VsZWN0ZWROb2RlID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgbWUudXBkYXRlVGVtcENvbm5lY3RvcigpO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBjaXJjbGUuZXhpdCgpLnJlbW92ZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOWujOaVtOmHjee7mFxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5yZWRyYXcgPSBmdW5jdGlvbiAoZnVsbFJlZHJhdykge1xuICAgICAgICAgICAgaWYgKGZ1bGxSZWRyYXcpIHtcbiAgICAgICAgICAgICAgICAvLyB0aGlzLnJlZHJhd0ZpeCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ3JlZHJhdycpO1xuICAgICAgICAgICAgdmFyIGxvZ2dlciA9IG1lLmxvZ2dlci5idWlsZCgneHh4Jyk7XG4gICAgICAgICAgICAvL+WkhOeQhnBhdGhcbiAgICAgICAgICAgIG1lLmFwcFdyYXBwZXIuc2VsZWN0KCcucGF0aHMtd3JhcHBlcicpLnJlbW92ZSgpO1xuICAgICAgICAgICAgbWUucGF0aHNXcmFwcGVyID0gbWUuYXBwV3JhcHBlclxuICAgICAgICAgICAgICAgIC5hcHBlbmQoJ2cnKVxuICAgICAgICAgICAgICAgIC5hdHRyKCdpZCcsICdwYXRocy13cmFwcGVyJylcbiAgICAgICAgICAgICAgICAuY2xhc3NlZCgncGF0aHMtd3JhcHBlcicsIHRydWUpO1xuXG4gICAgICAgICAgICBtZS5hcHBXcmFwcGVyLnNlbGVjdCgnLnRhc2tzLXdyYXBwZXInKS5yZW1vdmUoKTtcbiAgICAgICAgICAgIG1lLnRhc2tzV3JhcHBlciA9IG1lLmFwcFdyYXBwZXJcbiAgICAgICAgICAgICAgICAuYXBwZW5kKCdnJylcbiAgICAgICAgICAgICAgICAuYXR0cignaWQnLCAndGFza3Mtd3JhcHBlcicpXG4gICAgICAgICAgICAgICAgLmNsYXNzZWQoJ3Rhc2tzLXdyYXBwZXInLCB0cnVlKTtcblxuICAgICAgICAgICAgdmFyIHlEb21haW4gPSBtZS55RG9tYWluID0gW107XG4gICAgICAgICAgICB2YXIgeVJhbmdlID0gbWUueVJhbmdlID0gW107XG4gICAgICAgICAgICB2YXIgeFNjYWxlID0gbWUueFNjYWxlO1xuICAgICAgICAgICAgdmFyIHlTY2FsZSA9IG1lLnlTY2FsZTtcbiAgICAgICAgICAgIG1lLmNvbmZpZy50YXNrSWRzID0gbWUuY2FsY3VsYXRlTGluZUVmZmVjdCgpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCLorqHnrpfnu5PmnpzvvJpcIitKU09OLnN0cmluZ2lmeShtZS5jb25maWcudGFza0lkcykpO1xuXG4gICAgICAgICAgICBtZS5jb25maWcudGFza0lkcy5mb3JFYWNoKGZ1bmN0aW9uICh0YXNrSWQsIGluZGV4KSB7XG4gICAgICAgICAgICAgICAgeURvbWFpbi5wdXNoKHRhc2tJZCk7XG4gICAgICAgICAgICAgICAgeVJhbmdlLnB1c2goaW5kZXggKiAzMCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHlTY2FsZS5kb21haW4oeURvbWFpbikucmFuZ2UoeVJhbmdlKTtcblxuICAgICAgICAgICAgLy/nlLt46L20XG4gICAgICAgICAgICB2YXIgeEF4aXNUb3BFbCA9IGQzLnNlbGVjdCgnI2dhbnR0LWhlYWRlcicpO1xuICAgICAgICAgICAgdmFyIHhBeGlzVG9wID0geEF4aXNGYWN0b3J5KGQzLCBtZSwgeEF4aXNUb3BFbCwgJ3RvcCcpO1xuXG4gICAgICAgICAgICBpZiAoZnVsbFJlZHJhdykge1xuICAgICAgICAgICAgICAgIG1lLmRyYXdZQXhpc1RpY2soKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8v6L+H5ruk55SoXG4gICAgICAgICAgICB2YXIgc2Nyb2xsVG9wT2Zmc2V0ID0gJCgnI2dhbnR0LXNjcm9sbGVyJykub2Zmc2V0KCkudG9wO1xuICAgICAgICAgICAgdmFyIHlNaW4gPSAwIC0gc2Nyb2xsVG9wT2Zmc2V0O1xuICAgICAgICAgICAgdmFyIHlNYXggPSAwIC0gc2Nyb2xsVG9wT2Zmc2V0ICsgJCgnI2dhbnR0LXdyYXBwZXInKS5oZWlnaHQoKSArIDgwO1xuICAgICAgICAgICAgdmFyIG9mZnNldCA9ICQoJyNnYW50dC13cmFwcGVyJykuaGVpZ2h0KCkgLyAyO1xuICAgICAgICAgICAgbG9nZ2VyLmluZm8oJzMnKTtcbiAgICAgICAgICAgIG1lLmRyYXdMaW5rcyhtZS5jb25maWcuZGF0YS5saW5rcyk7XG4gICAgICAgICAgICBsb2dnZXIuaW5mbygnNCcpO1xuICAgICAgICAgICAgdmFyIG0gPSBmaWx0ZXJMaW5lKG1lLmNvbmZpZy50YXNrSWRzLCBtZS54U2NhbGUsIG1lLnlTY2FsZSwgeU1pbiwgeU1heCwgZnVsbFJlZHJhdyk7XG4gICAgICAgICAgICBtZS5jb25maWcubSA9IG07XG4gICAgICAgICAgICBtLmZvckVhY2goZnVuY3Rpb24gKHRhc2tJZCkge1xuICAgICAgICAgICAgICAgIHRhc2tGYWN0b3J5KGQzLCBtZSwgbWUueFNjYWxlLCBtZS55U2NhbGUsIG51bGwsIHRhc2tJZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGxvZ2dlci5pbmZvKCc1Jyk7XG4gICAgICAgICAgICBsb2dnZXIub3V0KCk7XG5cbiAgICAgICAgICAgIC8vICAgICB0YXNrYm94LmFwcGVuZChcImNpcmNsZVwiKVxuICAgICAgICAgICAgLy8gICAuYXR0cignY2xhc3MnLCAnZ2hvc3RDaXJjbGUnKVxuICAgICAgICAgICAgLy8gICAuYXR0cihcInJcIiwgMzApXG4gICAgICAgICAgICAvLyAgIC5hdHRyKFwib3BhY2l0eVwiLCAwLjIpIC8vIGNoYW5nZSB0aGlzIHRvIHplcm8gdG8gaGlkZSB0aGUgdGFyZ2V0IGFyZWFcbiAgICAgICAgICAgIC8vICAgLnN0eWxlKFwiZmlsbFwiLCBcInJlZFwiKVxuICAgICAgICAgICAgLy8gICAuYXR0cigndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZSgwLCA3KScpXG4gICAgICAgICAgICAvLyAgIC5hdHRyKCdwb2ludGVyLWV2ZW50cycsICdtb3VzZW92ZXInKVxuICAgICAgICAgICAgLy8gICAub24oXCJtb3VzZW92ZXJcIiwgZnVuY3Rpb24obm9kZSkge1xuICAgICAgICAgICAgLy8gICAgIGFwcC5zZWxlY3RlZE5vZGUgPSBub2RlO1xuICAgICAgICAgICAgLy8gICAgIGFwcC51cGRhdGVUZW1wQ29ubmVjdG9yKCk7XG4gICAgICAgICAgICAvLyAgIH0pXG4gICAgICAgICAgICAvLyAgIC5vbihcIm1vdXNlb3V0XCIsIGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgICAgIC8vICAgICBhcHAuc2VsZWN0ZWROb2RlID0gbnVsbDtcbiAgICAgICAgICAgIC8vICAgICBhcHAudXBkYXRlVGVtcENvbm5lY3RvcigpO1xuICAgICAgICAgICAgLy8gICB9KTtcblxuXG4gICAgICAgICAgICAvLyB0YXNrYm94LmFwcGVuZChcImNpcmNsZVwiKVxuICAgICAgICAgICAgLy8gICAuYXR0cignY2xhc3MnLCAnZ2hvc3RDaXJjbGUnKVxuICAgICAgICAgICAgLy8gICAuYXR0cihcInJcIiwgMzApXG4gICAgICAgICAgICAvLyAgIC5hdHRyKFwib3BhY2l0eVwiLCAwLjIpIC8vIGNoYW5nZSB0aGlzIHRvIHplcm8gdG8gaGlkZSB0aGUgdGFyZ2V0IGFyZWFcbiAgICAgICAgICAgIC8vICAgLnN0eWxlKFwiZmlsbFwiLCBcInJlZFwiKVxuICAgICAgICAgICAgLy8gICAuYXR0cigndHJhbnNmb3JtJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyAgICAgdmFyIHggPSAoeFNjYWxlKHRhc2suZW5kRGF0ZSkgLSB4U2NhbGUodGFzay5zdGFydERhdGUpKTtcbiAgICAgICAgICAgIC8vICAgICByZXR1cm4gJ3RyYW5zbGF0ZSgnICsgeCArICcsIDcpJztcbiAgICAgICAgICAgIC8vICAgfSlcbiAgICAgICAgICAgIC8vICAgLmF0dHIoJ3BvaW50ZXItZXZlbnRzJywgJ21vdXNlb3ZlcicpXG4gICAgICAgICAgICAvLyAgIC5vbihcIm1vdXNlb3ZlclwiLCBmdW5jdGlvbihub2RlLCB4KSB7XG4gICAgICAgICAgICAvLyAgICAgY29uc29sZS5sb2coeCk7XG4gICAgICAgICAgICAvLyAgICAgYXBwLnNlbGVjdGVkTm9kZSA9IG5vZGU7XG4gICAgICAgICAgICAvLyAgICAgYXBwLnVwZGF0ZVRlbXBDb25uZWN0b3IoKTtcbiAgICAgICAgICAgIC8vICAgfSlcbiAgICAgICAgICAgIC8vICAgLm9uKFwibW91c2VvdXRcIiwgZnVuY3Rpb24obm9kZSkge1xuICAgICAgICAgICAgLy8gICAgIGFwcC5zZWxlY3RlZE5vZGUgPSBudWxsO1xuICAgICAgICAgICAgLy8gICAgIGFwcC51cGRhdGVUZW1wQ29ubmVjdG9yKCk7XG4gICAgICAgICAgICAvLyAgIH0pO1xuXG5cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucHJlcGFyZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciB5RG9tYWluID0gbWUueURvbWFpbiA9IFtdO1xuICAgICAgICAgICAgdmFyIHlSYW5nZSA9IG1lLnlSYW5nZSA9IFtdO1xuXG4gICAgICAgICAgICAvL+imgee7mOWItueahOS7u+WKoeWIl+ihqFxuICAgICAgICAgICAgdmFyIF90YXNrcyA9IFtdO1xuICAgICAgICAgICAgLy/opoHnp7vliqjliLDnmoTmnIDlsI/kvY3nva5cbiAgICAgICAgICAgIHZhciBtaW5EYXRlID0gbnVsbDtcblxuICAgICAgICAgICAgdmFyIHZpc2l0ID0gZnVuY3Rpb24gKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIGlmICghcGFyZW50KSByZXR1cm47XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXJlbnQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGl0ZW0gPSBwYXJlbnRbaV07XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0gPSB0YXNrRnVuY3Rpb25zKGQzLCBtZSwgaXRlbSk7XG4gICAgICAgICAgICAgICAgICAgIC8vIHdpbmRvdy50YXNrID0gaXRlbTtcbiAgICAgICAgICAgICAgICAgICAgX3Rhc2tzLnB1c2goaXRlbS51dWlkKTtcbiAgICAgICAgICAgICAgICAgICAgbWluRGF0ZSA9IG1pbkRhdGUgfHwgaXRlbS5zdGFydERhdGU7XG4gICAgICAgICAgICAgICAgICAgIG1pbkRhdGUuZ2V0VGltZSgpO1xuICAgICAgICAgICAgICAgICAgICBtaW5EYXRlID0gbWluRGF0ZS5nZXRUaW1lKCkgPCBpdGVtLnN0YXJ0RGF0ZS5nZXRUaW1lKCkgPyBtaW5EYXRlIDogaXRlbS5zdGFydERhdGU7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjaGlsZHJlbiA9IGl0ZW0uY2hpbGRyZW47XG4gICAgICAgICAgICAgICAgICAgIHZpc2l0KGNoaWxkcmVuKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2aXNpdChtZS5jb25maWcuZGF0YS50YXNrcyk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyh4U2NhbGUsIHhTY2FsZS5kb21haW4oKVswXSwgeFNjYWxlLmRvbWFpbigpWzBdLmdldFllYXIoKSlcbiAgICAgICAgICAgIGlmICh4U2NhbGUgJiYgeFNjYWxlLmRvbWFpbigpWzBdLmdldEZ1bGxZZWFyKCkgPiAxOTcwKSB7XG4gICAgICAgICAgICAgICAgbWluRGF0ZSA9IHhTY2FsZS5kb21haW4oKVswXTtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZygn5pyJ5pyA5bCP5pel5pyf77yaJyArIG1pbkRhdGUpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCfmnIDlsI/ml6XmnJ/vvJonICsgbWluRGF0ZSlcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gbWUuY29uZmlnLnRhc2tzID0gX3Rhc2tzO1xuXG4gICAgICAgICAgICB2YXIgc2VsZWN0aW9ucyA9IGQzLnNlbGVjdCgnIycgKyBtZS5jb25maWcuZG9tKS5kYXR1bShfdGFza3MpO1xuICAgICAgICAgICAgc2VsZWN0aW9ucy5lYWNoKGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICAgICAgbWUuZ3JhcGhXaWR0aCA9IGNvbmZpZy53aWR0aDtcbiAgICAgICAgICAgICAgICB2YXIgZ3JhcGhIZWlnaHQgPSAwO1xuICAgICAgICAgICAgICAgIHZhciB3cmFwcGVySGVpZ2h0ID0gJCgnI2dhbnR0LXdyYXBwZXInKS5oZWlnaHQoKTtcbiAgICAgICAgICAgICAgICBncmFwaEhlaWdodCA9IGRhdGEubGVuZ3RoICogMzA7XG4gICAgICAgICAgICAgICAgbWUuZ3JhcGhIZWlnaHQgPSBncmFwaEhlaWdodCA8IHdyYXBwZXJIZWlnaHQgPyB3cmFwcGVySGVpZ2h0IDogZ3JhcGhIZWlnaHQ7XG5cbiAgICAgICAgICAgICAgICBtZS56b29tID0gZDMuYmVoYXZpb3Iuem9vbSgpLmNlbnRlcihudWxsKVxuICAgICAgICAgICAgICAgICAgICAuc2NhbGVFeHRlbnQoW2NvbmZpZy5taW5TY2FsZSwgY29uZmlnLm1heFNjYWxlXSlcbiAgICAgICAgICAgICAgICAgICAgLm9uKCd6b29tc3RhcnQnLCBtZS56b29tc3RhcnQpXG4gICAgICAgICAgICAgICAgICAgIC5vbihcInpvb21cIiwgbWUudXBkYXRlWm9vbSlcbiAgICAgICAgICAgICAgICAgICAgLm9uKFwiem9vbWVuZFwiLCBtZS56b29tRW5kKVxuICAgICAgICAgICAgICAgIC8v5q+P5LiA5aSp5Y2gMzBweFxuICAgICAgICAgICAgICAgIG1lLmNvbmZpZy5zdGVwV2lkdGggPSAzMDtcbiAgICAgICAgICAgICAgICAvL+iuoeeul+WPr+S7peeUu+WkmuWwkeWkqVxuICAgICAgICAgICAgICAgIG1lLmNvbmZpZy5zdGVwID0gbWUuZ3JhcGhXaWR0aCAvIGNvbmZpZy5zdGVwV2lkdGg7XG4gICAgICAgICAgICAgICAgLy/orqHnrpflj6/ku6XnlLvliLDlk6rkuIDlpKlcbiAgICAgICAgICAgICAgICBtZS5jb25maWcuZW5kID0gZDMudGltZS5kYXkub2Zmc2V0KG1pbkRhdGUsIGNvbmZpZy5zdGVwKTtcbiAgICAgICAgICAgICAgICAvLyBtZS5jb25maWcuem9vbSA9IG1lLnpvb207XG4gICAgICAgICAgICAgICAgdmFyIGRheXMgPSBkMy50aW1lLmRheXMobWluRGF0ZSwgY29uZmlnLmVuZCk7XG4gICAgICAgICAgICAgICAgeFNjYWxlLnJhbmdlKFswLCBtZS5ncmFwaFdpZHRoXSlcbiAgICAgICAgICAgICAgICAgICAgLmRvbWFpbihbbWluRGF0ZSwgY29uZmlnLmVuZF0pXG4gICAgICAgICAgICAgICAgICAgIC8vIC5uaWNlKGQzLnRpbWUuZGF5KTtcbiAgICAgICAgICAgICAgICBtZS56b29tLngoeFNjYWxlKTtcbiAgICAgICAgICAgICAgICBtZS56b29tLnNpemUoW21lLmdyYXBoV2lkdGgsIG1lLmdyYXBoSGVpZ2h0XSk7XG5cbiAgICAgICAgICAgICAgICAvLyByZXR1cm47XG4gICAgICAgICAgICAgICAgZDMuc2VsZWN0KHRoaXMpLnNlbGVjdCgnc3ZnJykucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgbWUuc3ZnID0gZDMuc2VsZWN0KHRoaXMpXG4gICAgICAgICAgICAgICAgICAgIC5hcHBlbmQoJ3N2ZycpXG4gICAgICAgICAgICAgICAgICAgIC5hdHRyKCdpZCcsICdhcHAnKVxuICAgICAgICAgICAgICAgICAgICAuYXR0cignY2xhc3MnLCAnYXBwJylcbiAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ3htbG5zJywgJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJylcbiAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ3ByZXNlcnZlQXNwZWN0UmF0aW8nLCAneE1pbllNaW4nKTtcblxuICAgICAgICAgICAgICAgIG1lLnN2Zy5hdHRyKCd3aWR0aCcsIG1lLmdyYXBoV2lkdGgpXG4gICAgICAgICAgICAgICAgICAgIC5hdHRyKCdoZWlnaHQnLCBtZS5ncmFwaEhlaWdodCk7XG5cbiAgICAgICAgICAgICAgICBkMy5zZWxlY3QoJyNhcHAtd3JhcHBlci1iZycpXG4gICAgICAgICAgICAgICAgICAgIC5hdHRyKCd3aWR0aCcsIG1lLmdyYXBoV2lkdGgpXG4gICAgICAgICAgICAgICAgICAgIC5hdHRyKCdoZWlnaHQnLCBtZS5ncmFwaEhlaWdodClcblxuICAgICAgICAgICAgICAgIG1lLmFwcFdyYXBwZXIgPSBtZS5zdmcuYXBwZW5kKCdnJylcbiAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ2lkJywgJ2FwcC13cmFwcGVyJylcbiAgICAgICAgICAgICAgICAgICAgLmNsYXNzZWQoJ2FwcC13cmFwcGVyJywgdHJ1ZSk7XG5cbiAgICAgICAgICAgICAgICBtZS5kcmF3Wm9vbUVsKCk7XG4gICAgICAgICAgICAgICAgbWUuem9vbS5zY2FsZShjb25maWcuc2NhbGUgfHwgMSk7XG4gICAgICAgICAgICAgICAgaWYgKGNvbmZpZy50cmFuc2xhdGVYKSB7XG4gICAgICAgICAgICAgICAgICAgIHpvb20udHJhbnNsYXRlKFtjb25maWcudHJhbnNsYXRlWCwgMF0pXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnJlZHJhd0ZpeCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciB5RG9tYWluID0gbWUueURvbWFpbiA9IFtdO1xuICAgICAgICAgICAgdmFyIHlSYW5nZSA9IG1lLnlSYW5nZSA9IFtdO1xuXG4gICAgICAgICAgICAvL+imgee7mOWItueahOS7u+WKoeWIl+ihqFxuICAgICAgICAgICAgdmFyIF90YXNrcyA9IFtdO1xuICAgICAgICAgICAgLy/opoHnp7vliqjliLDnmoTmnIDlsI/kvY3nva5cbiAgICAgICAgICAgIHZhciBtaW5EYXRlID0gbnVsbDtcblxuICAgICAgICAgICAgdmFyIHZpc2l0ID0gZnVuY3Rpb24gKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIGlmICghcGFyZW50KSByZXR1cm47XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXJlbnQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGl0ZW0gPSBwYXJlbnRbaV07XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0gPSB0YXNrRnVuY3Rpb25zKGQzLCBtZSwgaXRlbSk7XG4gICAgICAgICAgICAgICAgICAgIC8vIHdpbmRvdy50YXNrID0gaXRlbTtcbiAgICAgICAgICAgICAgICAgICAgX3Rhc2tzLnB1c2goaXRlbS51dWlkKTtcbiAgICAgICAgICAgICAgICAgICAgbWluRGF0ZSA9IG1pbkRhdGUgfHwgaXRlbS5zdGFydERhdGU7XG4gICAgICAgICAgICAgICAgICAgIG1pbkRhdGUuZ2V0VGltZSgpO1xuICAgICAgICAgICAgICAgICAgICBtaW5EYXRlID0gbWluRGF0ZS5nZXRUaW1lKCkgPCBpdGVtLnN0YXJ0RGF0ZS5nZXRUaW1lKCkgPyBtaW5EYXRlIDogaXRlbS5zdGFydERhdGU7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjaGlsZHJlbiA9IGl0ZW0uY2hpbGRyZW47XG4gICAgICAgICAgICAgICAgICAgIHZpc2l0KGNoaWxkcmVuKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2aXNpdChtZS5jb25maWcuZGF0YS50YXNrcyk7XG4gICAgICAgICAgICAvLyBtZS5jb25maWcudGFza3MgPSBfdGFza3M7XG5cbiAgICAgICAgICAgIHZhciBzZWxlY3Rpb25zID0gZDMuc2VsZWN0KCcjJyArIG1lLmNvbmZpZy5kb20pLmRhdHVtKF90YXNrcyk7XG4gICAgICAgICAgICBzZWxlY3Rpb25zLmVhY2goZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICAgICAgICBtZS5ncmFwaFdpZHRoID0gY29uZmlnLndpZHRoO1xuICAgICAgICAgICAgICAgIHZhciBncmFwaEhlaWdodCA9IDA7XG4gICAgICAgICAgICAgICAgdmFyIHdyYXBwZXJIZWlnaHQgPSAkKCcjZ2FudHQtd3JhcHBlcicpLmhlaWdodCgpO1xuICAgICAgICAgICAgICAgIGdyYXBoSGVpZ2h0ID0gZGF0YS5sZW5ndGggKiAzMDtcbiAgICAgICAgICAgICAgICBtZS5ncmFwaEhlaWdodCA9IGdyYXBoSGVpZ2h0IDwgd3JhcHBlckhlaWdodCA/IHdyYXBwZXJIZWlnaHQgOiBncmFwaEhlaWdodDtcblxuICAgICAgICAgICAgICAgIG1lLnN2Zy5hdHRyKCd3aWR0aCcsIG1lLmdyYXBoV2lkdGgpXG4gICAgICAgICAgICAgICAgICAgIC5hdHRyKCdoZWlnaHQnLCBtZS5ncmFwaEhlaWdodCk7XG5cbiAgICAgICAgICAgICAgICBkMy5zZWxlY3QoJyNhcHAtd3JhcHBlci1iZycpXG4gICAgICAgICAgICAgICAgICAgIC5hdHRyKCd3aWR0aCcsIG1lLmdyYXBoV2lkdGgpXG4gICAgICAgICAgICAgICAgICAgIC5hdHRyKCdoZWlnaHQnLCBtZS5ncmFwaEhlaWdodClcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5pbml0ID0gZnVuY3Rpb24gKG91dGVyKSB7XG4gICAgICAgICAgICB0aGlzLnByZXBhcmUoKTtcbiAgICAgICAgICAgIC8v6L+Z6YeM5aSE55CGaXNjcm9sbFxuICAgICAgICAgICAgdGhpcy5yZWRyYXcodHJ1ZSk7XG4gICAgICAgICAgICBpZiAoIW91dGVyKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBtZS5jb25maWcuYWZ0ZXJJbml0ID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgbWUuY29uZmlnLmFmdGVySW5pdCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25maWd1cmFibGUodGhpcy5pbml0LCBjb25maWcpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIHJldHVybiBhcHA7XG59OyIsIlwidXNlIHN0cmljdFwiO1xudmFyIF8gPSByZXF1aXJlKCd1bmRlcnNjb3JlJyk7XG52YXIgZm9ybWF0ZXIgPSBkMy50aW1lLmZvcm1hdChcIiVZLSVtLSVkICVIXCIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChkMywgYXBwKSB7XG5cbiAgICB2YXIgZmluZEZyb20gPSBmdW5jdGlvbiAodGFza0lkKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSBfLmZpbHRlcihhcHAuY29uZmlnLmRhdGEubGlua3MsIGZ1bmN0aW9uIChsaW5rKSB7XG4gICAgICAgICAgICByZXR1cm4gbGluay50b19pZCA9PT0gdGFza0lkO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICB2YXIgY2FsY3VsYXRlUGFyZW50VGltZSA9IGZ1bmN0aW9uIChyZXN1bHQsIHBhcmVudCwgdGFza3MpIHtcbiAgICAgICAgaWYgKCF0YXNrcyB8fCB0YXNrcy5sZW5ndGggPT0gMCkgcmV0dXJuO1xuICAgICAgICB2YXIgbWluLCBtYXg7XG4gICAgICAgIHZhciB0b3RhbCA9IDA7XG4gICAgICAgIHZhciB1c2VkID0gMDtcbiAgICAgICAgLy/ov5nkuIDmrrXorqHnrpfniLbku7vliqHml7bpl7RcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0YXNrcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGl0ZW0gPSB0YXNrc1tpXTtcbiAgICAgICAgICAgIGl0ZW0gPSBhcHAuY29uZmlnLnRhc2tNYXBzW2l0ZW0udXVpZF0gfHwgaXRlbTtcbiAgICAgICAgICAgIGlmIChpdGVtLnN0YXJ0RGF0ZS5nZXRUaW1lKCkgPT0gaXRlbS5lbmREYXRlLmdldFRpbWUoKSkge1xuICAgICAgICAgICAgICAgIC8vIGl0ZW0ubWFya2VyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGl0ZW0ucGFyZW50SWQgPSBwYXJlbnQgPyBwYXJlbnQudXVpZCA6IG51bGw7XG4gICAgICAgICAgICByZXN1bHQucHVzaChpdGVtLnV1aWQpO1xuICAgICAgICAgICAgaWYgKGl0ZW0uZXhwYW5kZWQgPT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAvL+WmguaenOayoeacieWxleW8gOWImuS4jeW+gOS4i+iuoeeul1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgY2hpbGRyZW4gPSBpdGVtLmNoaWxkcmVuO1xuICAgICAgICAgICAgICAgIGNhbGN1bGF0ZVBhcmVudFRpbWUocmVzdWx0LCBpdGVtLCBjaGlsZHJlbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0b3RhbCArPSAoaXRlbS5lbmREYXRlLmdldFRpbWUoKSAtIGl0ZW0uc3RhcnREYXRlLmdldFRpbWUoKSk7XG4gICAgICAgICAgICB1c2VkICs9IChpdGVtLmVuZERhdGUuZ2V0VGltZSgpIC0gaXRlbS5zdGFydERhdGUuZ2V0VGltZSgpKSAqIGl0ZW0ucGVyY2VudDtcbiAgICAgICAgICAgIGlmIChtaW4gPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIG1pbiA9IGl0ZW0uc3RhcnREYXRlLmdldFRpbWUoKTtcbiAgICAgICAgICAgICAgICBtYXggPSBpdGVtLmVuZERhdGUuZ2V0VGltZSgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBtaW4gPSBNYXRoLm1pbihtaW4sIGl0ZW0uc3RhcnREYXRlLmdldFRpbWUoKSk7XG4gICAgICAgICAgICAgICAgbWF4ID0gTWF0aC5tYXgobWF4LCBpdGVtLmVuZERhdGUuZ2V0VGltZSgpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAocGFyZW50KSB7XG4gICAgICAgICAgICBwYXJlbnQucGVyY2VudCA9IHVzZWQgLyB0b3RhbDtcbiAgICAgICAgICAgIHBhcmVudC5zdGFydERhdGUgPSBuZXcgRGF0ZShtaW4pO1xuICAgICAgICAgICAgcGFyZW50LmVuZERhdGUgPSBuZXcgRGF0ZShtYXgpO1xuICAgICAgICAgICAgYXBwLmNvbmZpZy50YXNrTWFwc1twYXJlbnQudXVpZF0gPSBwYXJlbnQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICB2YXIgY2FsY3VsYXRlTGluZVRpbWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBsaW5rVHJlZSA9IHt9OyAvL+iusOW9leaJgOacieeahOeItuWtkOWFs+ezu1xuICAgICAgICB2YXIgdGVtcCA9IHt9OyAvL+iusOW9leaJgOacieeahOWtkFxuICAgICAgICAvL+a3u+WKoOi/nue6v+eahOWPl+aOp+W9seWTjVxuICAgICAgICBhcHAuY29uZmlnLmRhdGEubGlua3MuZm9yRWFjaChmdW5jdGlvbiAobGluaywgaW5kZXgpIHtcbiAgICAgICAgICAgIHZhciBzaWQgPSBsaW5rLmZyb21faWQ7XG4gICAgICAgICAgICB2YXIgdGlkID0gbGluay50b19pZDtcbiAgICAgICAgICAgIHZhciBmcm9tVGFzayA9IGFwcC5jb25maWcudGFza01hcHNbc2lkXTtcbiAgICAgICAgICAgIHZhciB0b1Rhc2sgPSBhcHAuY29uZmlnLnRhc2tNYXBzW3RpZF07XG4gICAgICAgICAgICBpZiAoZnJvbVRhc2sgJiYgdG9UYXNrKSB7XG4gICAgICAgICAgICAgICAgdG9UYXNrLmZyb20gPSB0b1Rhc2suZnJvbSB8fCBbXTtcbiAgICAgICAgICAgICAgICB0b1Rhc2suZnJvbS5wdXNoKHNpZCk7XG4gICAgICAgICAgICAgICAgZnJvbVRhc2sudG8gPSBmcm9tVGFzay50byB8fCBbXTtcbiAgICAgICAgICAgICAgICBmcm9tVGFzay50by5wdXNoKHRpZCk7XG4gICAgICAgICAgICAgICAgdmFyIHMgPSBsaW5rVHJlZVtzaWRdIHx8IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBzaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZHJlbjogW11cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB2YXIgdCA9IGxpbmtUcmVlW3RpZF0gfHwge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHRpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkcmVuOiBbXVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHMuY2hpbGRyZW4ucHVzaCh0KTtcbiAgICAgICAgICAgICAgICBsaW5rVHJlZVtzaWRdID0gcztcbiAgICAgICAgICAgICAgICBsaW5rVHJlZVt0aWRdID0gdDtcbiAgICAgICAgICAgICAgICB0ZW1wW3RpZF0gPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy9zcyAxIHNmIDIgZnMgMyBmZiA0XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8v6L+Z5LiA5q2l55qE55uu55qE5piv5Li65LqG5om+5Ye6cm9vdFxuICAgICAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgICAgIGZvciAodmFyIGtleSBpbiBsaW5rVHJlZSkge1xuICAgICAgICAgICAgaWYgKCF0ZW1wW2tleV0pIHtcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChsaW5rVHJlZVtrZXldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHdoaWxlIChyZXN1bHQubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdmFyIGl0ZW0gPSByZXN1bHQuc2hpZnQoKTtcbiAgICAgICAgICAgIHJlc3VsdCA9IF8udW5pb24ocmVzdWx0LCBpdGVtLmNoaWxkcmVuKTtcbiAgICAgICAgICAgIHZhciBmcm9tID0gZmluZEZyb20oaXRlbS5pZCk7XG4gICAgICAgICAgICAvLyBpZiAoaXRlbS5pZCA9PSA1KSB7XG4gICAgICAgICAgICAvLyAgIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KGZyb20pKTtcbiAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgIHZhciB0YXNrID0gYXBwLmNvbmZpZy50YXNrTWFwc1tpdGVtLmlkXTtcbiAgICAgICAgICAgIHZhciBzdGFydERhdGUgPSAwO1xuICAgICAgICAgICAgdmFyIGVuZERhdGUgPSAwO1xuICAgICAgICAgICAgdmFyIG9vbyA9IFtdO1xuICAgICAgICAgICAgXy5lYWNoKGZyb20sIGZ1bmN0aW9uIChsaW5rKSB7XG4gICAgICAgICAgICAgICAgLy9zcyAxIHNmIDIgZnMgMyBmZiA0XG4gICAgICAgICAgICAgICAgLy9saW5rIHtcImlkXCI6OTUsXCJwaWRcIjoxLFwiZnJvbV9pZFwiOjc5LFwidG9faWRcIjo4MixcInR5cGVcIjozfVxuICAgICAgICAgICAgICAgIHZhciBzaWQgPSBsaW5rLmZyb21faWQ7XG4gICAgICAgICAgICAgICAgdmFyIHRpZCA9IGxpbmsudG9faWQ7XG4gICAgICAgICAgICAgICAgdmFyIHR5cGUgPSBsaW5rLnR5cGU7XG4gICAgICAgICAgICAgICAgdmFyIGZyb21UYXNrID0gYXBwLmNvbmZpZy50YXNrTWFwc1tzaWRdO1xuICAgICAgICAgICAgICAgIHZhciB0b1Rhc2sgPSBhcHAuY29uZmlnLnRhc2tNYXBzW3RpZF07XG4gICAgICAgICAgICAgICAgaWYgKGZyb21UYXNrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlID09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0RGF0ZSA9IE1hdGgubWF4KHN0YXJ0RGF0ZSwgZnJvbVRhc2suc3RhcnREYXRlLmdldFRpbWUoKSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZSA9PSAzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydERhdGUgPSBNYXRoLm1heCh0YXNrLnN0YXJ0RGF0ZS5nZXRUaW1lKCksIGZyb21UYXNrLmVuZERhdGUuZ2V0VGltZSgpKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlID09IDQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZERhdGUgPSBNYXRoLm1pbihlbmREYXRlLCBmcm9tVGFzay5lbmREYXRlLmdldFRpbWUoKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChzdGFydERhdGUgPiAwKSB7XG4gICAgICAgICAgICAgICAgdmFyIG9mZnNldCA9ICh0YXNrLnN0YXJ0RGF0ZS5nZXRUaW1lKCkgLSBzdGFydERhdGUpIC8gMTAwMDtcbiAgICAgICAgICAgICAgICB0YXNrLm1vdmUob2Zmc2V0KTtcbiAgICAgICAgICAgICAgICBhcHAuY29uZmlnLnRhc2tNYXBzW3Rhc2sudXVpZF0gPSB0YXNrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmFyIGluaXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICAgICAgY2FsY3VsYXRlUGFyZW50VGltZShyZXN1bHQsIG51bGwsIGFwcC5jb25maWcuZGF0YS50YXNrcyk7XG4gICAgICAgIGNhbGN1bGF0ZUxpbmVUaW1lKCk7XG4gICAgICAgIGNhbGN1bGF0ZVBhcmVudFRpbWUocmVzdWx0LCBudWxsLCBhcHAuY29uZmlnLmRhdGEudGFza3MpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhmb3JtYXRlcihhcHAuY29uZmlnLnRhc2tNYXBzWzVdLnN0YXJ0RGF0ZSkpO1xuICAgICAgICByZXN1bHQgPSBfLnVuaW9uKHJlc3VsdCk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgLy/nlLvku7vliqFcbiAgICByZXR1cm4gaW5pdCgpO1xufTsiLCJcInVzZSBzdHJpY3RcIjtcbi8qIGdsb2JhbCBtb2R1bGUgKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBmaWx0ZXJEYXRlKGRhdGEsIHhTY2FsZSwgeVNjYWxlLCB5TWluLCB5TWF4LFxuICBmdWxsUmVkcmF3KSB7XG4gIGRhdGEgPSBkYXRhIHx8IFtdO1xuICB2YXIgZmlsdGVyZWREYXRhID0gW107XG4gIHZhciBib3VuZGFyeSA9IHhTY2FsZS5yYW5nZSgpO1xuICB2YXIgbWluID0gYm91bmRhcnlbMF07XG4gIHZhciBtYXggPSBib3VuZGFyeVsxXTtcbiAgdmFyIHN0ID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gIGRhdGEuZm9yRWFjaChmdW5jdGlvbihkYXR1bSkge1xuICAgIHZhciBzdGFydCA9IHhTY2FsZShkYXR1bS5zdGFydERhdGUpO1xuICAgIHZhciBlbmQgPSB4U2NhbGUoZGF0dW0uZW5kRGF0ZSk7XG4gICAgdmFyIHkgPSB5U2NhbGUoZGF0dW0udXVpZCk7XG4gICAgaWYgKGVuZCA8IG1pbiB8fCBzdGFydCA+IG1heCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoIWZ1bGxSZWRyYXcgJiYgKHkgPCB5TWluIHx8IHkgPiB5TWF4KSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBmaWx0ZXJlZERhdGEucHVzaChkYXR1bSk7XG4gIH0pO1xuICB2YXIgZXQgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgLy8gLy8vLy8vY29uc29sZS5sb2coJ2NvdW50PT09JyAgKyBcImNvc3RcIiArIChldCAtIHN0KSk7XG4gIHJldHVybiBmaWx0ZXJlZERhdGE7XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG4vKiBnbG9iYWwgbW9kdWxlICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZmlsdGVyTGluZShkYXRhLCB4U2NhbGUsIHlTY2FsZSwgeU1pbiwgeU1heCwgZnVsbFJlZHJhdykge1xuICBkYXRhID0gZGF0YSB8fCBbXTtcbiAgdmFyIHJlc3VsdCA9IFtdO1xuICAvLyB2YXIgb2Zmc2V0ID0gJCgnI2dhbnR0LXNjcm9sbGVyJykub2Zmc2V0KCkudG9wO1xuICAvLyB2YXIgeU1pbiA9IDAgLSBvZmZzZXQ7XG4gIC8vIHZhciB5TWF4ID0gMCAtIG9mZnNldCArICQoJyNnYW50dC13cmFwcGVyJykuaGVpZ2h0KCk7XG4gIHZhciBjb3VudCA9IDA7XG5cbiAgdmFyIHN0ID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gIC8vIHJldHVybiBkYXRhO1xuXG4gIHZhciB0ID0gMDtcbiAgdmFyIGZpbmRNaW4gPSBmdW5jdGlvbihkYXRhLCB5TWluKSB7XG4gICAgdmFyIHMgPSAwLFxuICAgICAgZSA9IGRhdGEubGVuZ3RoIC0gMTtcbiAgICB3aGlsZSAocyA8IGUtMSkge1xuICAgICAgdCsrO1xuICAgICAgdmFyIG1pZGRsZSA9IHMgKyAoKGUgLSBzKSA+PiAxKTtcbiAgICAgIHZhciB5ID0geVNjYWxlKGRhdGFbbWlkZGxlXSk7XG4gICAgICAvLyAvLy8vY29uc29sZS5sb2coW3MsIGUsIG1pZGRsZSwgeSwgeU1pbl0uam9pbignLCcpKTtcbiAgICAgIGlmICh5ID4geU1pbikge1xuICAgICAgICBlID0gbWlkZGxlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcyA9IG1pZGRsZTtcbiAgICAgIH1cbiAgICAgIGlmICh0ID4gZGF0YS5sZW5ndGgpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzO1xuICB9XG4gIGlmKCFmdWxsUmVkcmF3KXtcbiAgICB2YXIgc3RhcnQgPSBmaW5kTWluKGRhdGEsIHlNaW4pO1xuICAgIHZhciBlbmQgPSBmaW5kTWluKGRhdGEsIHlNYXgpO1xuICAgIC8vIC8vLy9jb25zb2xlLmxvZyhbc3RhcnQsIGVuZF0uam9pbignLS0tLS0nKSk7XG4gICAgc3RhcnQgPSBNYXRoLm1heChzdGFydC0xMCwgMCk7XG4gICAgZW5kID0gTWF0aC5taW4oZW5kKzEwLCBkYXRhLmxlbmd0aCk7Ly9MSVUgZW5kID0gTWF0aC5taW4oZW5kKzEwLCBkYXRhLmxlbmd0aC0xKTtcbiAgICByZXN1bHQgPSBkYXRhLnNsaWNlKHN0YXJ0LCBlbmQpO1xuICB9ZWxzZXtcbiAgICByZXR1cm4gZGF0YTtcbiAgfVxuXG5cblxuICB2YXIgZXQgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgLy8vLy8vY29uc29sZS5sb2coJ2NvdW50PT09JyArIGNvdW50ICsgXCJjb3N0XCIgKyAoZXQgLSBzdCkpO1xuXG4gIHJldHVybiByZXN1bHQ7XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgZm9ybWF0ZXIgPSBkMy50aW1lLmZvcm1hdChcIiVZLSVtLSVkICVIXCIpO1xudmFyIHRhc2tGdW5jdGlvbnMgPSByZXF1aXJlKCcuL3Rhc2tGdW5jdGlvbnMnKTtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZDMsIGFwcCwgZWwsIGxpbmtzKSB7XG5cbiAgdmFyIGluaXQgPSBmdW5jdGlvbihsaW5rcykge1xuICAgIGQzLnNlbGVjdEFsbCgnLmxpbmsnKS5yZW1vdmUoKTtcbiAgICBkMy5zZWxlY3RBbGwoJy5saW5rLWFycm93JykucmVtb3ZlKCk7XG4gICAgdmFyIHhTY2FsZSA9IGFwcC54U2NhbGU7XG4gICAgdmFyIHlTY2FsZSA9IGFwcC55U2NhbGU7XG5cbiAgICBsaW5rcy5mb3JFYWNoKGZ1bmN0aW9uKGxpbmssIGluZGV4KSB7XG4gICAgICB2YXIgZnJvbVRhc2sgPSBhcHAuY29uZmlnLnRhc2tNYXBzW2xpbmsuZnJvbV9pZF07XG4gICAgICB2YXIgdG9UYXNrID0gYXBwLmNvbmZpZy50YXNrTWFwc1tsaW5rLnRvX2lkXTtcbiAgICAgIGlmICghZnJvbVRhc2sgfHwgIXRvVGFzaykge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB2YXIgdHlwZSA9IGxpbmsudHlwZTtcbiAgICAgIGZyb21UYXNrID0gdGFza0Z1bmN0aW9ucyhkMywgYXBwLCBmcm9tVGFzayk7XG4gICAgICB0b1Rhc2sgPSB0YXNrRnVuY3Rpb25zKGQzLCBhcHAsIHRvVGFzayk7XG4gICAgICAvLyBjb25zb2xlLmxvZyh0b1Rhc2spO1xuICAgICAgLy8gc3MgMSBzZiAyIGZzIDMgZmYgNFxuICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgIGNhc2UgMTogLy9zc1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHZhciBzID0gbGluay5zb3VyY2UgPSB7XG4gICAgICAgICAgICAgIHg6IHhTY2FsZShmcm9tVGFzay5zdGFydERhdGUpLFxuICAgICAgICAgICAgICB5OiB5U2NhbGUoZnJvbVRhc2sudXVpZCksXG4gICAgICAgICAgICAgIHV1aWQ6IGZyb21UYXNrLnV1aWRcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB2YXIgdCA9IGxpbmsudGFyZ2V0ID0ge1xuICAgICAgICAgICAgICB4OiB4U2NhbGUodG9UYXNrLnN0YXJ0RGF0ZSksXG4gICAgICAgICAgICAgIHk6IHlTY2FsZSh0b1Rhc2sudXVpZCksXG4gICAgICAgICAgICAgIHV1aWQ6IHRvVGFzay51dWlkXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgYXBwLnBhdGhzV3JhcHBlclxuICAgICAgICAgICAgLmFwcGVuZCgncGF0aCcpXG4gICAgICAgICAgICAuYXR0cigndGl0bGUnLCAnc3RhcnQgdG8gc3RhcnQnKVxuICAgICAgICAgICAgLmF0dHIoJ2NsYXNzJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHJldHVybiAncGF0aCBsaW5rJyArICcgc291cmNlLScgKyBzLnV1aWQgKyAnIHRhcmdldC0nICsgdC51dWlkO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5hdHRyKCdzdHJva2UtbGluZWpvaW4nLCAncm91bmQnKVxuICAgICAgICAgICAgLmF0dHIoJ3NvdXJjZUlkJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHJldHVybiBzLnV1aWQ7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmF0dHIoJ3RhcmdldElkJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHJldHVybiB0LnV1aWQ7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmF0dHIoXCJkXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICB2YXIgYXJyID0gW107XG4gICAgICAgICAgICAgIGlmIChzLnkgPCB0LnkpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3RhcnQgPSAnTScgKyBzLnggKyAnLCcgKyAocy55ICsgMTMpOyAvL+mmlueCuSwrMTPliJrlpb3mmK/ku7vliqHnmoTmraPkuK1cbiAgICAgICAgICAgICAgICBhcnIucHVzaChzdGFydCk7XG4gICAgICAgICAgICAgICAgaWYgKHMueCA8PSB0LngpIHtcbiAgICAgICAgICAgICAgICAgIC8v5YWI5b6A5Zue6LWwNeWDj+e0oFxuICAgICAgICAgICAgICAgICAgdmFyIHRlbXAgPSAocy54IC0gNSkgKyAnLCcgKyAocy55ICsgMTMpO1xuICAgICAgICAgICAgICAgICAgYXJyLnB1c2godGVtcCk7XG4gICAgICAgICAgICAgICAgICAvL+S7jui/meS4quS9jee9ruWGjeW+gOS4i+i1sOWIsOe7iOatoueCueeahHnovbRcbiAgICAgICAgICAgICAgICAgIHRlbXAgPSAocy54IC0gNSkgKyAnLCcgKyAodC55IC0gNSk7XG4gICAgICAgICAgICAgICAgICBhcnIucHVzaCh0ZW1wKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgLy/lhYjlvoDlm57otbA15YOP57SgXG4gICAgICAgICAgICAgICAgICB2YXIgdGVtcCA9ICh0LngpICsgJywnICsgKHMueSArIDEzKTtcbiAgICAgICAgICAgICAgICAgIGFyci5wdXNoKHRlbXApO1xuICAgICAgICAgICAgICAgICAgLy8gLy/ku47ov5nkuKrkvY3nva7lho3lvoDkuIvotbDliLDnu4jmraLngrnnmoR56L20XG4gICAgICAgICAgICAgICAgICAvLyB0ZW1wID0gKHMueCAtIDUpICsgJywnICsgKHQueSAtIDUpO1xuICAgICAgICAgICAgICAgICAgLy8gYXJyLnB1c2godGVtcCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8v5L+d5oyBeeS4jeW8r++8jOi1sOWIsOe7iOatoueCueeahHjovbRcbiAgICAgICAgICAgICAgICB0ZW1wID0gKHQueCkgKyAnLCcgKyAodC55IC0gNSk7XG4gICAgICAgICAgICAgICAgYXJyLnB1c2godGVtcCk7XG4gICAgICAgICAgICAgICAgdmFyIGVuZCA9ICh0LngpICsgJywnICsgKHQueSArIDcpOyAvL+WwvueCuVxuICAgICAgICAgICAgICAgIGFyci5wdXNoKGVuZCk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIHN0YXJ0ID0gJ00nICsgcy54ICsgJywnICsgKHMueSArIDEzKTsgLy/pppbngrksKzEz5Yia5aW95piv5Lu75Yqh55qE5q2j5LitXG4gICAgICAgICAgICAgICAgYXJyLnB1c2goc3RhcnQpO1xuICAgICAgICAgICAgICAgIGlmIChzLnggPj0gdC54KSB7XG4gICAgICAgICAgICAgICAgICAvL+WFiOW+gOWbnui1sDXlg4/ntKBcbiAgICAgICAgICAgICAgICAgIHZhciB0ZW1wID0gKHQueCkgKyAnLCcgKyAocy55ICsgMTMpO1xuICAgICAgICAgICAgICAgICAgYXJyLnB1c2godGVtcCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIC8v5YWI5b6A5Zue6LWwNeWDj+e0oFxuICAgICAgICAgICAgICAgICAgdmFyIHRlbXAgPSAocy54IC0gNSkgKyAnLCcgKyAocy55ICsgMTMpO1xuICAgICAgICAgICAgICAgICAgYXJyLnB1c2godGVtcCk7XG4gICAgICAgICAgICAgICAgICAvL+S7jui/meS4quS9jee9ruWGjeW+gOS4iui1sOWIsOe7iOatoueCueeahHnovbRcbiAgICAgICAgICAgICAgICAgIHRlbXAgPSAocy54IC0gNSkgKyAnLCcgKyAodC55ICsgMzIpO1xuICAgICAgICAgICAgICAgICAgYXJyLnB1c2godGVtcCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8v5L+d5oyBeeS4jeW8r++8jOi1sOWIsOe7iOatoueCueeahHjovbRcbiAgICAgICAgICAgICAgICB0ZW1wID0gKHQueCkgKyAnLCcgKyAodC55ICsgMzIpO1xuICAgICAgICAgICAgICAgIGFyci5wdXNoKHRlbXApO1xuICAgICAgICAgICAgICAgIHZhciBlbmQgPSAodC54KSArICcsJyArICh0LnkgKyAyNSk7IC8v5bC+54K5XG4gICAgICAgICAgICAgICAgYXJyLnB1c2goZW5kKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gYXJyLmpvaW4oJyAnKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBhcHAucGF0aHNXcmFwcGVyXG4gICAgICAgICAgICAuYXBwZW5kKFwicGF0aFwiKVxuICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImxpbmstYXJyb3dcIilcbiAgICAgICAgICAgIC5hdHRyKFwiZFwiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IFwiTTAsMCBMMy41LC03IC0zLjUsLTcgMCwwXCI7XG4gICAgICAgICAgICAgIGlmIChzLnkgPCB0LnkpIHtcblxuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IFwiTTAsMCBMMy41LDcgLTMuNSw3IDAsMFwiO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gXCJ0cmFuc2xhdGUoXCIgKyAodC54KSArIFwiLCBcIiArICh0LnkgKyA3KSArIFwiKVwiO1xuICAgICAgICAgICAgICBpZiAocy55IDwgdC55KSB7XG5cbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBcInRyYW5zbGF0ZShcIiArICh0LngpICsgXCIsIFwiICsgKHQueSArIDIyKSArIFwiKVwiO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgY2FzZSAyOiAvL3NmXG4gICAgICAgICAge1xuICAgICAgICAgICAgLy8gdmFyIG9mZnNldCA9IGZyb21UYXNrLnN0YXJ0RGF0ZS5nZXRUaW1lKCkgLSB0b1Rhc2suc3RhcnREYXRlLmdldFRpbWUoKTtcbiAgICAgICAgICAgIC8vIHRvVGFzay5tb3ZlKG9mZnNldCAvIDEwMDApO1xuICAgICAgICAgICAgdmFyIHMgPSBsaW5rLnNvdXJjZSA9IHtcbiAgICAgICAgICAgICAgeDogeFNjYWxlKGZyb21UYXNrLnN0YXJ0RGF0ZSksXG4gICAgICAgICAgICAgIHk6IHlTY2FsZShmcm9tVGFzay51dWlkKSxcbiAgICAgICAgICAgICAgdXVpZDogZnJvbVRhc2sudXVpZFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHZhciB0ID0gbGluay50YXJnZXQgPSB7XG4gICAgICAgICAgICAgIHg6IHRvVGFzay5tYXJrZXIgPyB4U2NhbGUodG9UYXNrLmVuZERhdGUpICsgMjIgOiB4U2NhbGUodG9UYXNrLmVuZERhdGUpLFxuICAgICAgICAgICAgICB5OiB5U2NhbGUodG9UYXNrLnV1aWQpLFxuICAgICAgICAgICAgICB1dWlkOiB0b1Rhc2sudXVpZFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgYXBwLnBhdGhzV3JhcHBlclxuICAgICAgICAgICAgLmFwcGVuZCgncGF0aCcpXG4gICAgICAgICAgICAuYXR0cigndGl0bGUnLCAnc3RhcnQgdG8gZmluaXNoJylcbiAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICByZXR1cm4gJ3BhdGggbGluaycgKyAnIHNvdXJjZS0nICsgcy51dWlkICsgJyB0YXJnZXQtJyArIHQudXVpZDtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuYXR0cignc3Ryb2tlLWxpbmVqb2luJywgJ3JvdW5kJylcbiAgICAgICAgICAgIC5hdHRyKCdzb3VyY2VJZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICByZXR1cm4gcy51dWlkO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5hdHRyKCd0YXJnZXRJZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICByZXR1cm4gdC51dWlkO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5hdHRyKFwiZFwiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgdmFyIGFyciA9IFtdO1xuICAgICAgICAgICAgICBpZiAocy55IDwgdC55KSB7XG4gICAgICAgICAgICAgICAgdmFyIHN0YXJ0ID0gJ00nICsgcy54ICsgJywnICsgKHMueSArIDEzKTsgLy/pppbngrksKzEz5Yia5aW95piv5Lu75Yqh55qE5q2j5LitXG4gICAgICAgICAgICAgICAgYXJyLnB1c2goc3RhcnQpO1xuICAgICAgICAgICAgICAgIGlmIChzLnggPD0gdC54KSB7XG4gICAgICAgICAgICAgICAgICAvL+WFiOW+gOWbnui1sDXlg4/ntKBcbiAgICAgICAgICAgICAgICAgIHZhciB0ZW1wID0gKHMueCAtIDUpICsgJywnICsgKHMueSArIDEzKTtcbiAgICAgICAgICAgICAgICAgIGFyci5wdXNoKHRlbXApO1xuICAgICAgICAgICAgICAgICAgLy/ku47ov5nkuKrkvY3nva7lho3lvoDkuIvotbDliLDnu4jmraLngrnnmoR56L20XG4gICAgICAgICAgICAgICAgICB0ZW1wID0gKHMueCAtIDUpICsgJywnICsgKHQueSAtIDUpO1xuICAgICAgICAgICAgICAgICAgYXJyLnB1c2godGVtcCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIC8v5YWI5b6A5Zue6LWwNeWDj+e0oFxuICAgICAgICAgICAgICAgICAgdmFyIHRlbXAgPSAodC54KSArICcsJyArIChzLnkgKyAxMyk7XG4gICAgICAgICAgICAgICAgICBhcnIucHVzaCh0ZW1wKTtcbiAgICAgICAgICAgICAgICAgIC8vIC8v5LuO6L+Z5Liq5L2N572u5YaN5b6A5LiL6LWw5Yiw57uI5q2i54K555qEeei9tFxuICAgICAgICAgICAgICAgICAgLy8gdGVtcCA9IChzLnggLSA1KSArICcsJyArICh0LnkgLSA1KTtcbiAgICAgICAgICAgICAgICAgIC8vIGFyci5wdXNoKHRlbXApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvL+S/neaMgXnkuI3lvK/vvIzotbDliLDnu4jmraLngrnnmoR46L20XG4gICAgICAgICAgICAgICAgdGVtcCA9ICh0LngpICsgJywnICsgKHQueSAtIDUpO1xuICAgICAgICAgICAgICAgIGFyci5wdXNoKHRlbXApO1xuICAgICAgICAgICAgICAgIHZhciBlbmQgPSAodC54KSArICcsJyArICh0LnkgKyA3KTsgLy/lsL7ngrlcbiAgICAgICAgICAgICAgICBhcnIucHVzaChlbmQpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciBzdGFydCA9ICdNJyArIHMueCArICcsJyArIChzLnkgKyAxMyk7IC8v6aaW54K5LCsxM+WImuWlveaYr+S7u+WKoeeahOato+S4rVxuICAgICAgICAgICAgICAgIGFyci5wdXNoKHN0YXJ0KTtcbiAgICAgICAgICAgICAgICBpZiAocy54ID49IHQueCkge1xuICAgICAgICAgICAgICAgICAgLy/lhYjlvoDlm57otbA15YOP57SgXG4gICAgICAgICAgICAgICAgICB2YXIgdGVtcCA9ICh0LngpICsgJywnICsgKHMueSArIDEzKTtcbiAgICAgICAgICAgICAgICAgIGFyci5wdXNoKHRlbXApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAvL+WFiOW+gOWbnui1sDXlg4/ntKBcbiAgICAgICAgICAgICAgICAgIHZhciB0ZW1wID0gKHMueCAtIDUpICsgJywnICsgKHMueSArIDEzKTtcbiAgICAgICAgICAgICAgICAgIGFyci5wdXNoKHRlbXApO1xuICAgICAgICAgICAgICAgICAgLy/ku47ov5nkuKrkvY3nva7lho3lvoDkuIrotbDliLDnu4jmraLngrnnmoR56L20XG4gICAgICAgICAgICAgICAgICB0ZW1wID0gKHMueCAtIDUpICsgJywnICsgKHQueSArIDMyKTtcbiAgICAgICAgICAgICAgICAgIGFyci5wdXNoKHRlbXApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvL+S/neaMgXnkuI3lvK/vvIzotbDliLDnu4jmraLngrnnmoR46L20XG4gICAgICAgICAgICAgICAgdGVtcCA9ICh0LngpICsgJywnICsgKHQueSArIDMyKTtcbiAgICAgICAgICAgICAgICBhcnIucHVzaCh0ZW1wKTtcbiAgICAgICAgICAgICAgICB2YXIgZW5kID0gKHQueCkgKyAnLCcgKyAodC55ICsgMjUpOyAvL+WwvueCuVxuICAgICAgICAgICAgICAgIGFyci5wdXNoKGVuZCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIGFyci5qb2luKCcgJyk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgYXBwLnBhdGhzV3JhcHBlclxuICAgICAgICAgICAgLmFwcGVuZChcInBhdGhcIilcbiAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJsaW5rLWFycm93XCIpXG4gICAgICAgICAgICAuYXR0cihcImRcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHZhciByZXN1bHQgPSBcIk0wLDAgTDMuNSwtNyAtMy41LC03IDAsMFwiO1xuICAgICAgICAgICAgICBpZiAocy55IDwgdC55KSB7XG5cbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBcIk0wLDAgTDMuNSw3IC0zLjUsNyAwLDBcIjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IFwidHJhbnNsYXRlKFwiICsgKHQueCkgKyBcIiwgXCIgKyAodC55ICsgNykgKyBcIilcIjtcbiAgICAgICAgICAgICAgaWYgKHMueSA8IHQueSkge1xuXG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gXCJ0cmFuc2xhdGUoXCIgKyAodC54KSArIFwiLCBcIiArICh0LnkgKyAyMikgKyBcIilcIjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIGNhc2UgMzogLy9mc1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHZhciBzID0gbGluay5zb3VyY2UgPSB7XG4gICAgICAgICAgICAgIHg6IGZyb21UYXNrLm1hcmtlciA/IHhTY2FsZShmcm9tVGFzay5lbmREYXRlKSArIDIyIDogeFNjYWxlKGZyb21UYXNrLmVuZERhdGUpLFxuICAgICAgICAgICAgICB5OiB5U2NhbGUoZnJvbVRhc2sudXVpZCksXG4gICAgICAgICAgICAgIHV1aWQ6IGZyb21UYXNrLnV1aWRcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB2YXIgdCA9IGxpbmsudGFyZ2V0ID0ge1xuICAgICAgICAgICAgICB4OiB4U2NhbGUodG9UYXNrLnN0YXJ0RGF0ZSksXG4gICAgICAgICAgICAgIHk6IHlTY2FsZSh0b1Rhc2sudXVpZCksXG4gICAgICAgICAgICAgIHV1aWQ6IHRvVGFzay51dWlkXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBhcHAucGF0aHNXcmFwcGVyXG4gICAgICAgICAgICAuYXBwZW5kKCdwYXRoJylcbiAgICAgICAgICAgIC5hdHRyKCd0aXRsZScsICdmaW5pc2ggdG8gc3RhcnQnKVxuICAgICAgICAgICAgLmF0dHIoJ2NsYXNzJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHJldHVybiAncGF0aCBsaW5rJyArICcgc291cmNlLScgKyBzLnV1aWQgKyAnIHRhcmdldC0nICsgdC51dWlkO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5hdHRyKCdzdHJva2UtbGluZWpvaW4nLCAncm91bmQnKVxuICAgICAgICAgICAgLmF0dHIoJ3NvdXJjZUlkJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHJldHVybiBzLnV1aWQ7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmF0dHIoJ3RhcmdldElkJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHJldHVybiB0LnV1aWQ7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmF0dHIoXCJkXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICB2YXIgYXJyID0gW107XG4gICAgICAgICAgICAgIGlmIChzLnkgPCB0LnkpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3RhcnQgPSAnTScgKyBzLnggKyAnLCcgKyAocy55ICsgMTMpOyAvL+mmlueCuSwrMTPliJrlpb3mmK/ku7vliqHnmoTmraPkuK1cbiAgICAgICAgICAgICAgICBhcnIucHVzaChzdGFydCk7XG4gICAgICAgICAgICAgICAgaWYgKHMueCA8PSB0LngpIHtcbiAgICAgICAgICAgICAgICAgIC8v5YWI5b6A5Zue6LWwNeWDj+e0oFxuICAgICAgICAgICAgICAgICAgdmFyIHRlbXAgPSAodC54KSArICcsJyArIChzLnkgKyAxMyk7XG4gICAgICAgICAgICAgICAgICBhcnIucHVzaCh0ZW1wKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgLy/lhYjlvoDlm57otbA15YOP57SgXG4gICAgICAgICAgICAgICAgICB2YXIgdGVtcCA9IChzLnggKyA1KSArICcsJyArIChzLnkgKyAxMyk7XG4gICAgICAgICAgICAgICAgICBhcnIucHVzaCh0ZW1wKTtcbiAgICAgICAgICAgICAgICAgIC8vIC8v5LuO6L+Z5Liq5L2N572u5YaN5b6A5LiL6LWw5Yiw57uI5q2i54K555qEeei9tFxuICAgICAgICAgICAgICAgICAgdGVtcCA9IChzLnggKyA1KSArICcsJyArICh0LnkgLSA1KTtcbiAgICAgICAgICAgICAgICAgIGFyci5wdXNoKHRlbXApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvL+S/neaMgXnkuI3lvK/vvIzotbDliLDnu4jmraLngrnnmoR46L20XG4gICAgICAgICAgICAgICAgdGVtcCA9ICh0LngpICsgJywnICsgKHQueSAtIDUpO1xuICAgICAgICAgICAgICAgIGFyci5wdXNoKHRlbXApO1xuICAgICAgICAgICAgICAgIHZhciBlbmQgPSAodC54KSArICcsJyArICh0LnkgKyA3KTsgLy/lsL7ngrlcbiAgICAgICAgICAgICAgICBhcnIucHVzaChlbmQpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciBzdGFydCA9ICdNJyArIHMueCArICcsJyArIChzLnkgKyAxMyk7IC8v6aaW54K5LCsxM+WImuWlveaYr+S7u+WKoeeahOato+S4rVxuICAgICAgICAgICAgICAgIGFyci5wdXNoKHN0YXJ0KTtcbiAgICAgICAgICAgICAgICBpZiAocy54ID49IHQueCkge1xuICAgICAgICAgICAgICAgICAgLy/lhYjlvoDlm57otbA15YOP57SgXG4gICAgICAgICAgICAgICAgICB2YXIgdGVtcCA9ICh0LngpICsgJywnICsgKHMueSArIDEzKTtcbiAgICAgICAgICAgICAgICAgIGFyci5wdXNoKHRlbXApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAvL+WFiOW+gOWbnui1sDXlg4/ntKBcbiAgICAgICAgICAgICAgICAgIHZhciB0ZW1wID0gKHMueCAtIDUpICsgJywnICsgKHMueSArIDEzKTtcbiAgICAgICAgICAgICAgICAgIGFyci5wdXNoKHRlbXApO1xuICAgICAgICAgICAgICAgICAgLy/ku47ov5nkuKrkvY3nva7lho3lvoDkuIrotbDliLDnu4jmraLngrnnmoR56L20XG4gICAgICAgICAgICAgICAgICB0ZW1wID0gKHMueCAtIDUpICsgJywnICsgKHQueSArIDMyKTtcbiAgICAgICAgICAgICAgICAgIGFyci5wdXNoKHRlbXApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvL+S/neaMgXnkuI3lvK/vvIzotbDliLDnu4jmraLngrnnmoR46L20XG4gICAgICAgICAgICAgICAgdGVtcCA9ICh0LngpICsgJywnICsgKHQueSArIDMyKTtcbiAgICAgICAgICAgICAgICBhcnIucHVzaCh0ZW1wKTtcbiAgICAgICAgICAgICAgICB2YXIgZW5kID0gKHQueCkgKyAnLCcgKyAodC55ICsgMjUpOyAvL+WwvueCuVxuICAgICAgICAgICAgICAgIGFyci5wdXNoKGVuZCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIGFyci5qb2luKCcgJyk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgYXBwLnBhdGhzV3JhcHBlclxuICAgICAgICAgICAgLmFwcGVuZChcInBhdGhcIilcbiAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJsaW5rLWFycm93XCIpXG4gICAgICAgICAgICAuYXR0cihcImRcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHZhciByZXN1bHQgPSBcIk0wLDAgTDMuNSwtNyAtMy41LC03IDAsMFwiO1xuICAgICAgICAgICAgICBpZiAocy55IDwgdC55KSB7XG5cbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBcIk0wLDAgTDMuNSw3IC0zLjUsNyAwLDBcIjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IFwidHJhbnNsYXRlKFwiICsgKHQueCkgKyBcIiwgXCIgKyAodC55ICsgNykgKyBcIilcIjtcbiAgICAgICAgICAgICAgaWYgKHMueSA8IHQueSkge1xuXG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gXCJ0cmFuc2xhdGUoXCIgKyAodC54KSArIFwiLCBcIiArICh0LnkgKyAyMikgKyBcIilcIjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIGNhc2UgNDogLy9mZlxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHZhciBzID0gbGluay5zb3VyY2UgPSB7XG4gICAgICAgICAgICAgIHg6IGZyb21UYXNrLm1hcmtlciA/IHhTY2FsZShmcm9tVGFzay5lbmREYXRlKSArIDIyIDogeFNjYWxlKGZyb21UYXNrLmVuZERhdGUpLFxuICAgICAgICAgICAgICAvLyB4OiB4U2NhbGUoZnJvbVRhc2suZW5kRGF0ZSksXG4gICAgICAgICAgICAgIHk6IHlTY2FsZShmcm9tVGFzay51dWlkKSxcbiAgICAgICAgICAgICAgdXVpZDogZnJvbVRhc2sudXVpZFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHZhciB0ID0gbGluay50YXJnZXQgPSB7XG4gICAgICAgICAgICAgIHg6IHRvVGFzay5tYXJrZXIgPyB4U2NhbGUodG9UYXNrLmVuZERhdGUpICsgMjIgOiB4U2NhbGUodG9UYXNrLmVuZERhdGUpLFxuICAgICAgICAgICAgICAvLyB4OiB4U2NhbGUodG9UYXNrLmVuZERhdGUpLFxuICAgICAgICAgICAgICB5OiB5U2NhbGUodG9UYXNrLnV1aWQpLFxuICAgICAgICAgICAgICB1dWlkOiB0b1Rhc2sudXVpZFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgYXBwLnBhdGhzV3JhcHBlclxuICAgICAgICAgICAgLmFwcGVuZCgncGF0aCcpXG4gICAgICAgICAgICAuYXR0cigndGl0bGUnLCAnZmluaXNoIHRvIGZpbmlzaCcpXG4gICAgICAgICAgICAuYXR0cignY2xhc3MnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICdwYXRoIGxpbmsnICsgJyBzb3VyY2UtJyArIHMudXVpZCArICcgdGFyZ2V0LScgKyB0LnV1aWQ7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmF0dHIoJ3N0cm9rZS1saW5lam9pbicsICdyb3VuZCcpXG4gICAgICAgICAgICAuYXR0cignc291cmNlSWQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHMudXVpZDtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuYXR0cigndGFyZ2V0SWQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHQudXVpZDtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuYXR0cihcImRcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHZhciBhcnIgPSBbXTtcbiAgICAgICAgICAgICAgaWYgKHMueSA8IHQueSkge1xuICAgICAgICAgICAgICAgIHZhciBzdGFydCA9ICdNJyArIHMueCArICcsJyArIChzLnkgKyAxMyk7IC8v6aaW54K5LCsxM+WImuWlveaYr+S7u+WKoeeahOato+S4rVxuICAgICAgICAgICAgICAgIGFyci5wdXNoKHN0YXJ0KTtcbiAgICAgICAgICAgICAgICBpZiAocy54IDw9IHQueCkge1xuICAgICAgICAgICAgICAgICAgLy/lhYjlvoDlm57otbA15YOP57SgXG4gICAgICAgICAgICAgICAgICB2YXIgdGVtcCA9ICh0LngpICsgJywnICsgKHMueSArIDEzKTtcbiAgICAgICAgICAgICAgICAgIGFyci5wdXNoKHRlbXApO1xuICAgICAgICAgICAgICAgICAgLy/ku47ov5nkuKrkvY3nva7lho3lvoDkuIvotbDliLDnu4jmraLngrnnmoR56L20XG4gICAgICAgICAgICAgICAgICAvLyB0ZW1wID0gKHMueCArIDUpICsgJywnICsgKHQueSAtIDUpO1xuICAgICAgICAgICAgICAgICAgLy8gYXJyLnB1c2godGVtcCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIC8v5YWI5b6A5Zue6LWwNeWDj+e0oFxuICAgICAgICAgICAgICAgICAgdmFyIHRlbXAgPSAocy54ICsgNSkgKyAnLCcgKyAocy55ICsgMTMpO1xuICAgICAgICAgICAgICAgICAgYXJyLnB1c2godGVtcCk7XG4gICAgICAgICAgICAgICAgICAvLyAvL+S7jui/meS4quS9jee9ruWGjeW+gOS4i+i1sOWIsOe7iOatoueCueeahHnovbRcbiAgICAgICAgICAgICAgICAgIHRlbXAgPSAocy54ICsgNSkgKyAnLCcgKyAodC55IC0gNSk7XG4gICAgICAgICAgICAgICAgICBhcnIucHVzaCh0ZW1wKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy/kv53mjIF55LiN5byv77yM6LWw5Yiw57uI5q2i54K555qEeOi9tFxuICAgICAgICAgICAgICAgIHRlbXAgPSAodC54KSArICcsJyArICh0LnkgLSA1KTtcbiAgICAgICAgICAgICAgICBhcnIucHVzaCh0ZW1wKTtcbiAgICAgICAgICAgICAgICB2YXIgZW5kID0gKHQueCkgKyAnLCcgKyAodC55ICsgNyk7IC8v5bC+54K5XG4gICAgICAgICAgICAgICAgYXJyLnB1c2goZW5kKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgc3RhcnQgPSAnTScgKyBzLnggKyAnLCcgKyAocy55ICsgMTMpOyAvL+mmlueCuSwrMTPliJrlpb3mmK/ku7vliqHnmoTmraPkuK1cbiAgICAgICAgICAgICAgICBhcnIucHVzaChzdGFydCk7XG4gICAgICAgICAgICAgICAgaWYgKHMueCA+PSB0LngpIHtcbiAgICAgICAgICAgICAgICAgIC8v5YWI5b6A5Zue6LWwNeWDj+e0oFxuICAgICAgICAgICAgICAgICAgdmFyIHRlbXAgPSAocy54ICsgNSkgKyAnLCcgKyAocy55ICsgMTMpO1xuICAgICAgICAgICAgICAgICAgYXJyLnB1c2godGVtcCk7XG4gICAgICAgICAgICAgICAgICB0ZW1wID0gKHMueCArIDUpICsgJywnICsgKHMueSArIDMpO1xuICAgICAgICAgICAgICAgICAgYXJyLnB1c2godGVtcCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIC8v5YWI5b6A5Zue6LWwNeWDj+e0oFxuICAgICAgICAgICAgICAgICAgdmFyIHRlbXAgPSAodC54KSArICcsJyArIChzLnkgKyAxMyk7XG4gICAgICAgICAgICAgICAgICBhcnIucHVzaCh0ZW1wKTtcbiAgICAgICAgICAgICAgICAgIC8v5LuO6L+Z5Liq5L2N572u5YaN5b6A5LiK6LWw5Yiw57uI5q2i54K555qEeei9tFxuICAgICAgICAgICAgICAgICAgLy8gdGVtcCA9ICh0LnggLSA1KSArICcsJyArICh0LnkgKyAzMik7XG4gICAgICAgICAgICAgICAgICAvLyBhcnIucHVzaCh0ZW1wKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy/kv53mjIF55LiN5byv77yM6LWw5Yiw57uI5q2i54K555qEeOi9tFxuICAgICAgICAgICAgICAgIHRlbXAgPSAodC54KSArICcsJyArIChzLnkgKyAzKTtcbiAgICAgICAgICAgICAgICBhcnIucHVzaCh0ZW1wKTtcbiAgICAgICAgICAgICAgICB2YXIgZW5kID0gKHQueCkgKyAnLCcgKyAodC55ICsgMjUpOyAvL+WwvueCuVxuICAgICAgICAgICAgICAgIGFyci5wdXNoKGVuZCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIGFyci5qb2luKCcgJyk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgYXBwLnBhdGhzV3JhcHBlclxuICAgICAgICAgICAgLmFwcGVuZChcInBhdGhcIilcbiAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJsaW5rLWFycm93XCIpXG4gICAgICAgICAgICAuYXR0cihcImRcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHZhciByZXN1bHQgPSBcIk0wLDAgTDMuNSwtNyAtMy41LC03IDAsMFwiO1xuICAgICAgICAgICAgICBpZiAocy55IDwgdC55KSB7XG5cbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBcIk0wLDAgTDMuNSw3IC0zLjUsNyAwLDBcIjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IFwidHJhbnNsYXRlKFwiICsgKHQueCkgKyBcIiwgXCIgKyAodC55ICsgNykgKyBcIilcIjtcbiAgICAgICAgICAgICAgaWYgKHMueSA8IHQueSkge1xuXG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gXCJ0cmFuc2xhdGUoXCIgKyAodC54KSArIFwiLCBcIiArICh0LnkgKyAyMikgKyBcIilcIjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgICAgbWUuY29uZmlnLnRhc2tNYXBzW2Zyb21UYXNrLnV1aWRdID0gZnJvbVRhc2s7XG4gICAgICAgICAgbWUuY29uZmlnLnRhc2tNYXBzW3RvVGFzay51dWlkXSA9IHRvVGFzaztcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8v55S75Lu75YqhXG4gIHJldHVybiBpbml0KGxpbmtzKTtcbn07IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZDMpIHtcbiAgdmFyIGxvZyA9IHtcblxuICB9O1xuICBsb2cuYnVpbGQgPSBmdW5jdGlvbihpZCkge1xuICAgIGxvZyA9IHtcbiAgICAgIGlkOiBpZCxcbiAgICAgIHN0OiBuZXcgRGF0ZSgpLmdldFRpbWUoKSxcbiAgICAgIGFycjogW10sXG4gICAgfTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBsb2cuaW5mbyA9IGZ1bmN0aW9uKHN0cikge1xuICAgIHZhciB0ID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgdmFyIGNvc3QgPSB0LWxvZy5zdDtcbiAgICBsb2cuYXJyLnB1c2goc3RyICsgJz0nICsgY29zdCArICdtcyAnKTtcbiAgfVxuICBsb2cub3V0ID0gZnVuY3Rpb24oKXtcbiAgICAvLy8vY29uc29sZS5sb2cobG9nLmlkKyc9PT09Jytsb2cuYXJyLmpvaW4oJywgJykpO1xuICB9XG4gIHJldHVybiBsb2c7XG59IiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgYXBwID0gcmVxdWlyZSgnLi9hcHAnKTtcblxuaWYgKHR5cGVvZiBkZWZpbmUgPT09IFwiZnVuY3Rpb25cIiAmJiBkZWZpbmUuYW1kKSB7XG4gIGRlZmluZSgnZDMuY2hhcnQuYXBwJywgW1wiZDNcIl0sIGZ1bmN0aW9uKGQzKSB7XG4gICAgZDMuY2hhcnQgPSBkMy5jaGFydCB8fCB7fTtcbiAgICBkMy5jaGFydC5hcHAgPSBhcHAoZDMpO1xuICB9KTtcbn0gZWxzZSBpZiAod2luZG93KSB7XG4gIHdpbmRvdy5kMy5jaGFydCA9IHdpbmRvdy5kMy5jaGFydCB8fCB7fTtcbiAgd2luZG93LmQzLmNoYXJ0LmFwcCA9IGFwcCh3aW5kb3cuZDMpO1xufSBlbHNlIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBhcHA7XG59XG4iLCJcInVzZSBzdHJpY3RcIjtcbi8vIHZhciBQdWJTdWIgPSByZXF1aXJlKCdwdWJzdWItanMnKTtcbnZhciBmb3JtYXRlciA9IGQzLnRpbWUuZm9ybWF0KFwiJVktJW0tJWQgJUhcIik7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChkMywgYXBwLCBncmFwaCwgdGFzaykge1xuICAgIHZhciBtZW51ID0ge307XG4gICAgdmFyIGNvbmZpZyA9IGFwcC5jb25maWc7XG4gICAgdmFyIHhTY2FsZSA9IGFwcC54U2NhbGU7XG4gICAgdmFyIHlTY2FsZSA9IGFwcC55U2NhbGU7XG4gICAgdmFyIG1lbnVCb2R5LCBtZW51QmcsIGxlZnRCdG4sIHJpZ2h0QnRuLCBwZXJjZW50QnRuO1xuICAgIHZhciB5T2Zmc2V0ID0gMDtcbiAgICB2YXIgeE9mZnNldCA9IDA7XG4gICAgdmFyIGJ0bldpZHRoID0gMTA7XG4gICAgdmFyIGJ0bkhlaWdodCA9IDMwO1xuICAgIHZhciBidG5Db2xvciA9IGZhbHNlID8gJ3JlZCcgOiAndHJhbnNwYXJlbnQnO1xuICAgIHZhciBjeWNsZUJ0bkNvbG9yID0gXCJyZWRcIjtcbiAgICB2YXIgc3RlcHMgPSAwO1xuICAgIHZhciBkcmFnZ2luZ05vZGUsIHNlbGVjdGVkTm9kZTtcblxuICAgIHZhciBwZXJjZW50TGlzdGVuZXIgPSBkMy5iZWhhdmlvci56b29tKCkuY2VudGVyKG51bGwpO1xuICAgIHZhciBzdGFydFRpbWVMaXN0ZW5lciA9IGQzLmJlaGF2aW9yLnpvb20oKS5jZW50ZXIobnVsbCk7XG4gICAgdmFyIGVuZFRpbWVMaXN0ZW5lciA9IGQzLmJlaGF2aW9yLnpvb20oKS5jZW50ZXIobnVsbCk7XG5cbiAgICB2YXIgZ2V0VGFza0JveCA9IGZ1bmN0aW9uICh0YXNrKSB7XG4gICAgICAgIHZhciBsaW5lID0gJy50YXNrLWxpbmUtJyArIHRhc2sudXVpZDtcbiAgICAgICAgcmV0dXJuIGQzLnNlbGVjdChsaW5lKS5zZWxlY3QoJy5pdGVtJyk7XG4gICAgfVxuXG4gICAgdmFyIHRhc2tib3ggPSBnZXRUYXNrQm94KHRhc2spO1xuXG4gICAgdmFyIGluaXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vIHRhc2sgPSBhcHAuY29uZmlnLnRhc2tNYXBzW3Rhc2tdO1xuICAgICAgICB2YXIgbGluZSA9ICcudGFzay1saW5lLScgKyB0YXNrLnV1aWQ7XG4gICAgICAgIHZhciB0YXNrc1dyYXBwZXIgPSBkMy5zZWxlY3QobGluZSk7XG4gICAgICAgIGQzLnNlbGVjdCgnLm1lbnVCb2R5JykucmVtb3ZlKCk7XG4gICAgICAgIGlmIChjb25maWcucmVhZG9ubHkpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBtZW51Qm9keSA9IHRhc2tzV3JhcHBlci5hcHBlbmQoJ2cnKVxuICAgICAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ21lbnVCb2R5JylcbiAgICAgICAgICAgIC5hdHRyKCdpZCcsICdtZW51Qm9keScpLmF0dHIoJ3RyYW5zZm9ybScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ3RyYW5zbGF0ZSgnICsgeFNjYWxlKHRhc2suc3RhcnREYXRlKSArICcsICcgKyAwICsgJyknO1xuICAgICAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gLy/lpITnkIbov5vluqbvvIzlj7PkvqfvvIznm67lvZVcbiAgICAvLyB2YXIgcmVmcmVzaCA9IGZ1bmN0aW9uKCkge1xuICAgIC8vICAgLy8gcmV0dXJuIGZhbHNlO1xuICAgIC8vICAgY2hhbmdlRW5kVGltZVxuICAgIC8vICAgZDMuc2VsZWN0KCcjbWVudUJvZHknKS5hdHRyKCd0cmFuc2Zvcm0nLCBmdW5jdGlvbigpIHtcbiAgICAvLyAgICAgcmV0dXJuICd0cmFuc2xhdGUoJyArIHhTY2FsZSh0YXNrLnN0YXJ0RGF0ZSkgKyAnLCAwKSdcbiAgICAvLyAgIH0pXG5cbiAgICAvLyAgIHZhciB4ID0geFNjYWxlKHRhc2suZW5kRGF0ZSkgLSB4U2NhbGUodGFzay5zdGFydERhdGUpICsgeE9mZnNldDtcbiAgICAvLyAgIHJpZ2h0QnRuLmF0dHIoJ3RyYW5zZm9ybScsIGZ1bmN0aW9uKCkge1xuICAgIC8vICAgICB2YXIgeSA9IDAgKyB5T2Zmc2V0O1xuICAgIC8vICAgICByZXR1cm4gXCJ0cmFuc2xhdGUoXCIgKyB4ICsgXCIsIFwiICsgeSArIFwiKVwiO1xuICAgIC8vICAgfSk7XG4gICAgLy8gICBwZXJjZW50QnRuLmF0dHIoJ3RyYW5zZm9ybScsIGZ1bmN0aW9uKCkge1xuICAgIC8vICAgICB2YXIgeDEgPSAwO1xuICAgIC8vICAgICB2YXIgeDIgPSB4U2NhbGUodGFzay5lbmREYXRlKSAtIHhTY2FsZSh0YXNrLnN0YXJ0RGF0ZSk7XG4gICAgLy8gICAgIHgxID0geDEgKyAoeDIgLSB4MSkgKiB0YXNrLnBlcmNlbnQ7XG4gICAgLy8gICAgIHZhciB5ID0gMDtcbiAgICAvLyAgICAgcmV0dXJuIFwidHJhbnNsYXRlKFwiICsgeDEgKyBcIiwgXCIgKyB5ICsgXCIpXCI7XG4gICAgLy8gICB9KTtcbiAgICAvLyAgIGQzLnNlbGVjdEFsbCgnLmNvbG9yJykuYXR0cigndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZSgnICsgKHggKyAyMCkgKyAnLCAnICsgdGFzay5feU9mZnNldCArICcpJyk7XG4gICAgLy8gfVxuXG4gICAgdmFyIG12UGFyID0ge307IC8v6ZKI5a+556e75Yqo5pe255qE5YWo5bGA5Y+Y6YePXG4gICAgc3RhcnRUaW1lTGlzdGVuZXJcbiAgICAgICAgLm9uKCd6b29tc3RhcnQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoY29uZmlnLnJlYWRvbmx5KSB7IC8v54i25Lu75Yqh5LiN5YWB6K645ouW5YqoTGl1XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGQzLmV2ZW50LnNvdXJjZUV2ZW50ICYmIGQzLmV2ZW50LnNvdXJjZUV2ZW50LnRvU3RyaW5nKCkgPT09ICdbb2JqZWN0IFdoZWVsRXZlbnRdJykge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG12UGFyLmNoYW5nZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIG12UGFyLnN0YXJ0RGF0ZSA9IHRhc2suc3RhcnREYXRlLmdldFRpbWUoKTsgLy/orrDlvZXku7vliqHnmoTlvIDlp4vml7bpl7TvvIznnIvnnIvku7vliqHmmK/lkKbnnJ/nmoTooqvmi5bliqjkuoZcbiAgICAgICAgICAgIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICAgICAgICAgdGFzay5fc3RhcnREYXRlID0gdGFzay5zdGFydERhdGU7XG4gICAgICAgICAgICB0YXNrLl9lbmREYXRlID0gdGFzay5lbmREYXRlO1xuICAgICAgICAgICAgdGFzay5fbW91c2VTdGFydFggPSBkMy5ldmVudC5zb3VyY2VFdmVudC5jbGllbnRYOyAvL+ihqOekuum8oOagh+iQveeCuei3neemu1xuICAgICAgICAgICAgdGFzay5feFdpZHRoID0geFNjYWxlKHRhc2suZW5kRGF0ZSkgLSB4U2NhbGUodGFzay5zdGFydERhdGUpO1xuICAgICAgICAgICAgLy8gdGFzay5feE1pbiA9IHhTY2FsZShkMy50aW1lLmRheS5vZmZzZXQodGFzay5zdGFydERhdGUsIDEpKSArIHhPZmZzZXQ7IC8v5Y+v5Yiw6L6+55qE5pyA5bCP5L2N572uXG4gICAgICAgICAgICB0YXNrLl94U3RhcnQgPSAwIC0geE9mZnNldCAtIGJ0bldpZHRoOyAvL3hTY2FsZSh0YXNrLnN0YXJ0RGF0ZSkgLSB4T2Zmc2V0IC0gYnRuV2lkdGg7XG4gICAgICAgICAgICB0YXNrLl9kYXlzID0gZDMudGltZS5kYXlzKHRhc2suX3N0YXJ0RGF0ZSwgdGFzay5fZW5kRGF0ZSkubGVuZ3RoO1xuICAgICAgICAgICAgdmFyIG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICB0YXNrLl9kYXlXaWR0aCA9IHhTY2FsZShkMy50aW1lLmRheS5vZmZzZXQobm93LCAxKSkgLSB4U2NhbGUobm93KTtcbiAgICAgICAgICAgIC8v6I635Y+Weei3neemu1xuICAgICAgICAgICAgdmFyIHRyYW5zZm9ybSA9IHBlcmNlbnRCdG4uYXR0cigndHJhbnNmb3JtJyk7XG4gICAgICAgICAgICB0YXNrLl95T2Zmc2V0ID0gYXBwLmdldFRyYW5zZm9ybVkodHJhbnNmb3JtKSArIHlPZmZzZXQ7XG4gICAgICAgICAgICAvLyB0b29sdGlwKCdib2R5JywgdGFzayk7XG5cbiAgICAgICAgICAgIHRhc2tib3gudGV4dCA9IHRhc2tib3guYXBwZW5kKCd0ZXh0JylcbiAgICAgICAgICAgICAgICAudGV4dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmb3JtYXRlcih0YXNrLnN0YXJ0RGF0ZSkgKyBcIi9cIiArIGZvcm1hdGVyKHRhc2suZW5kRGF0ZSk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwic3RhcnRcIilcbiAgICAgICAgICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgeCA9IDM7IC8vKHhTY2FsZSh0YXNrLmVuZERhdGUpIC0geFNjYWxlKHRhc2suc3RhcnREYXRlKSkgKyAxMDtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICd0cmFuc2xhdGUoJyArIHggKyAnLCAtNiknXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5vbihcInpvb21cIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKGNvbmZpZy5yZWFkb25seSkgeyAvL+eItuS7u+WKoeS4jeWFgeiuuOaLluWKqExpdVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChkMy5ldmVudC5zb3VyY2VFdmVudCAmJiBkMy5ldmVudC5zb3VyY2VFdmVudC50b1N0cmluZygpID09PSAnW29iamVjdCBXaGVlbEV2ZW50XScpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZDMuZXZlbnQuc291cmNlRXZlbnQgJiYgZDMuZXZlbnQuc291cmNlRXZlbnQudG9TdHJpbmcoKSA9PT0gJ1tvYmplY3QgTW91c2VFdmVudF0nKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1vdXNlWCA9IGQzLmV2ZW50LnNvdXJjZUV2ZW50LmNsaWVudFg7IC8v6byg5qCH5b2T5YmN5L2N572uXG4gICAgICAgICAgICAgICAgdmFyIG9mZnNldCA9IG1vdXNlWCAtIHRhc2suX21vdXNlU3RhcnRYOyAvL+enu+WKqOS6huWkmuWwkVxuICAgICAgICAgICAgICAgIHN0ZXBzID0gTWF0aC5yb3VuZChvZmZzZXQgLyB0YXNrLl9kYXlXaWR0aCk7XG4gICAgICAgICAgICAgICAgc3RlcHMgPSBNYXRoLm1pbigodGFzay5fZGF5cyAtIDEpLCBzdGVwcyk7XG4gICAgICAgICAgICAgICAgdmFyIHhDdXJyID0gdGFzay5feFN0YXJ0ICsgc3RlcHMgKiB0YXNrLl9kYXlXaWR0aDtcbiAgICAgICAgICAgICAgICB0YXNrLnN0YXJ0RGF0ZSA9IGQzLnRpbWUuZGF5Lm9mZnNldCh0YXNrLl9zdGFydERhdGUsIHN0ZXBzKTtcbiAgICAgICAgICAgICAgICBhcHAuY2hhbmdlU3RhcnRUaW1lKHRhc2spO1xuICAgICAgICAgICAgICAgIC8vIHJlZnJlc2goKTtcbiAgICAgICAgICAgICAgICAvLyB0b29sdGlwKCdib2R5JywgdGFzayk7XG4gICAgICAgICAgICAgICAgdGFza2JveC50ZXh0XG4gICAgICAgICAgICAgICAgICAgIC50ZXh0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmb3JtYXRlcih0YXNrLnN0YXJ0RGF0ZSkgKyBcIi9cIiArIGZvcm1hdGVyKHRhc2suZW5kRGF0ZSk7XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJzdGFydFwiKVxuICAgICAgICAgICAgICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHggPSAzOyAvLyh4U2NhbGUodGFzay5lbmREYXRlKSAtIHhTY2FsZSh0YXNrLnN0YXJ0RGF0ZSkpICsgMTA7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ3RyYW5zbGF0ZSgnICsgeCArICcsIC02KSdcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgLy/liKTmlq3mmK/lkKbnnJ/nmoTnp7vliqjkuobvvIzov5jmmK/ku4Xku4Xngrnlh7vkuoZcbiAgICAgICAgICAgICAgICBpZiAobXZQYXIuc3RhcnREYXRlICE9IHRhc2suc3RhcnREYXRlLmdldFRpbWUoKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhtdlBhci5zdGFydERhdGUrXCJcXHRcIit0YXNrLnN0YXJ0RGF0ZS5nZXRUaW1lKCkpO1xuICAgICAgICAgICAgICAgICAgICBtdlBhci5jaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgYXBwLmNvbmZpZy50YXNrTWFwc1t0YXNrLnV1aWRdID0gdGFzaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5vbihcInpvb21lbmRcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKGNvbmZpZy5yZWFkb25seSkgeyAvL+eItuS7u+WKoeS4jeWFgeiuuOaLluWKqExpdVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChkMy5ldmVudC5zb3VyY2VFdmVudCAmJiBkMy5ldmVudC5zb3VyY2VFdmVudC50b1N0cmluZygpID09PSAnW29iamVjdCBXaGVlbEV2ZW50XScpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBjbGVhck1hc2soKTtcbiAgICAgICAgICAgIGRyYXdNZW51KCk7XG4gICAgICAgICAgICBhcHAuZHJhd1Rhc2sodGFzayk7XG4gICAgICAgICAgICBhcHAucmVkcmF3KHRydWUpO1xuICAgICAgICAgICAgLy8gUHViU3ViLnB1Ymxpc2goJ3Rvb2x0aXAucmVtb3ZlJywge30pO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBjb25maWcuY2hhbmdlU3RhcnRUaW1lSGFuZGxlciA9PT0gJ2Z1bmN0aW9uJyAmJiBtdlBhci5jaGFuZ2VkKSB7XG4gICAgICAgICAgICAgICAgY29uZmlnLmNoYW5nZVN0YXJ0VGltZUhhbmRsZXIodGFzayk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgLy/nmb7liIbmr5RcbiAgICBwZXJjZW50TGlzdGVuZXJcbiAgICAgICAgLm9uKCd6b29tc3RhcnQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoY29uZmlnLnJlYWRvbmx5KSB7IC8v54i25Lu75Yqh5LiN5YWB6K645ouW5YqoTGl1XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGQzLmV2ZW50LnNvdXJjZUV2ZW50ICYmIGQzLmV2ZW50LnNvdXJjZUV2ZW50LnRvU3RyaW5nKCkgPT09ICdbb2JqZWN0IFdoZWVsRXZlbnRdJykge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG12UGFyLmNoYW5nZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIG12UGFyLnBlcmNlbnQgPSB0YXNrLnBlcmNlbnQ7IC8v6K6w5b2V5Lu75Yqh55qE5byA5aeL5pe26Ze077yM55yL55yL5Lu75Yqh5piv5ZCm55yf55qE6KKr5ouW5Yqo5LqGXG4gICAgICAgICAgICAvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAgICAgICAgIHRhc2suX3BlcmNlbnQgPSB0YXNrLnBlcmNlbnQgfHwgMDtcbiAgICAgICAgICAgIHRhc2suX21vdXNlU3RhcnRYID0gZDMuZXZlbnQuc291cmNlRXZlbnQuY2xpZW50WDsgLy/ooajnpLrpvKDmoIfokL3ngrnot53nprtcbiAgICAgICAgICAgIHRhc2suX3hXaWR0aCA9IHhTY2FsZSh0YXNrLmVuZERhdGUpIC0geFNjYWxlKHRhc2suc3RhcnREYXRlKTtcbiAgICAgICAgICAgIHRhc2suX3hNaW4gPSAwOyAvL3hTY2FsZSh0YXNrLnN0YXJ0RGF0ZSk7IC8v5Y+v5Yiw6L6+55qE5pyA5bCP5L2N572uXG4gICAgICAgICAgICB0YXNrLl94TWF4ID0gdGFzay5feE1pbiArIHRhc2suX3hXaWR0aDsgLy94U2NhbGUodGFzay5lbmREYXRlKTsgLy/lj6/liLDovr7nmoTmnIDlpKfkvY3nva5cbiAgICAgICAgICAgIHRhc2suX3hTdGFydCA9IHRhc2suX3hNaW4gKyB0YXNrLl94V2lkdGggKiB0YXNrLl9wZXJjZW50O1xuICAgICAgICAgICAgLy/ojrflj5Z56Led56a7XG4gICAgICAgICAgICB2YXIgdHJhbnNmb3JtID0gcGVyY2VudEJ0bi5hdHRyKCd0cmFuc2Zvcm0nKTtcbiAgICAgICAgICAgIHRhc2suX3lPZmZzZXQgPSBhcHAuZ2V0VHJhbnNmb3JtWSh0cmFuc2Zvcm0pO1xuICAgICAgICAgICAgLy8gdG9vbHRpcCgnYm9keScsIHRhc2spO1xuXG4gICAgICAgICAgICB0YXNrYm94LnRleHQgPSB0YXNrYm94LmFwcGVuZCgndGV4dCcpXG4gICAgICAgICAgICAgICAgLnRleHQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGFzay5wZXJjZW50ICogMTAwICsgJyUnO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcInN0YXJ0XCIpXG4gICAgICAgICAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gdmFyIHggPSAoeFNjYWxlKHRhc2suZW5kRGF0ZSkgLSB4U2NhbGUodGFzay5zdGFydERhdGUpKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICd0cmFuc2xhdGUoJyArIHRhc2suX3hTdGFydCArICcsIC02KSdcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfSlcbiAgICAgICAgLm9uKFwiem9vbVwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoY29uZmlnLnJlYWRvbmx5KSB7IC8v54i25Lu75Yqh5LiN5YWB6K645ouW5YqoTGl1XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGQzLmV2ZW50LnNvdXJjZUV2ZW50ICYmIGQzLmV2ZW50LnNvdXJjZUV2ZW50LnRvU3RyaW5nKCkgPT09XG4gICAgICAgICAgICAgICAgJ1tvYmplY3QgTW91c2VFdmVudF0nKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1vdXNlWCA9IGQzLmV2ZW50LnNvdXJjZUV2ZW50LmNsaWVudFg7IC8v6byg5qCH5b2T5YmN5L2N572uXG4gICAgICAgICAgICAgICAgdmFyIG9mZnNldCA9IG1vdXNlWCAtIHRhc2suX21vdXNlU3RhcnRYOyAvL+enu+WKqOS6huWkmuWwkVxuICAgICAgICAgICAgICAgIHZhciB4Q3VyciA9IHRhc2suX3hTdGFydCArIG9mZnNldDsgLy/lvZPliY3kvY3nva5cbiAgICAgICAgICAgICAgICB4Q3VyciA9IE1hdGgubWluKHhDdXJyLCB0YXNrLl94TWF4KTsgLy/ojIPlm7TpmZDliLbvvIzmnIDlpKfkuI3ov4dcbiAgICAgICAgICAgICAgICB4Q3VyciA9IE1hdGgubWF4KHhDdXJyLCB0YXNrLl94TWluKTtcbiAgICAgICAgICAgICAgICB2YXIgX3BlcmNlbnQgPSAoeEN1cnIgLSB0YXNrLl94TWluKSAvIHRhc2suX3hXaWR0aDsgLy/lvZPliY3nmb7liIbmr5TvvIzlubbmlbTmlbDljJZcbiAgICAgICAgICAgICAgICB0YXNrLnBlcmNlbnQgPSBNYXRoLnJvdW5kKF9wZXJjZW50ICogMTApIC8gMTBcbiAgICAgICAgICAgICAgICB4Q3VyciA9IHRhc2suX3hNaW4gKyB0YXNrLl94V2lkdGggKiB0YXNrLnBlcmNlbnQ7XG4gICAgICAgICAgICAgICAgd2luZG93LnRhc2sgPSB0YXNrO1xuICAgICAgICAgICAgICAgIHBlcmNlbnRCdG4uYXR0cigndHJhbnNmb3JtJywgXCJ0cmFuc2xhdGUoXCIgKyB4Q3VyciArIFwiLCBcIiArIHRhc2suX3lPZmZzZXQgKyBcIikgcm90YXRlKDApXCIpO1xuICAgICAgICAgICAgICAgIC8vIFB1YlN1Yi5wdWJsaXNoKCd0YXNrLmNoYW5nZV9wZXJjZW50Jywge1xuICAgICAgICAgICAgICAgIC8vICAgbmFtZTogJ215IG5ldyBjYXInXG4gICAgICAgICAgICAgICAgLy8gfSk7XG4gICAgICAgICAgICAgICAgYXBwLmNoYW5nZVBlcmNlbnQodGFzayk7XG4gICAgICAgICAgICAgICAgLy8gdG9vbHRpcCgnYm9keScsIHRhc2spO1xuXG4gICAgICAgICAgICAgICAgdGFza2JveC50ZXh0LnRleHQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGFzay5wZXJjZW50ICogMTAwICsgJyUnO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJzdGFydFwiKVxuICAgICAgICAgICAgICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdmFyIHggPSAoeFNjYWxlKHRhc2suZW5kRGF0ZSkgLSB4U2NhbGUodGFzay5zdGFydERhdGUpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAndHJhbnNsYXRlKCcgKyB4Q3VyciArICcsIC02KSdcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgLy/liKTmlq3mmK/lkKbnnJ/nmoTnp7vliqjkuobvvIzov5jmmK/ku4Xku4Xngrnlh7vkuoZcbiAgICAgICAgICAgICAgICBpZiAobXZQYXIucGVyY2VudCAhPSB0YXNrLnBlcmNlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2cobXZQYXIuc3RhcnREYXRlK1wiXFx0XCIrdGFzay5zdGFydERhdGUuZ2V0VGltZSgpKTtcbiAgICAgICAgICAgICAgICAgICAgbXZQYXIuY2hhbmdlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGFwcC5jb25maWcudGFza01hcHNbdGFzay51dWlkXSA9IHRhc2s7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAub24oXCJ6b29tZW5kXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChjb25maWcucmVhZG9ubHkpIHsgLy/niLbku7vliqHkuI3lhYHorrjmi5bliqhMaXVcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBQdWJTdWIucHVibGlzaCgndG9vbHRpcC5yZW1vdmUnLCB7fSk7XG4gICAgICAgICAgICBhcHAucmVkcmF3KHRydWUpO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBjb25maWcuY2hhbmdlUGVyY2VudEhhbmRsZXIgPT09ICdmdW5jdGlvbicgJiYgbXZQYXIuY2hhbmdlZCkge1xuICAgICAgICAgICAgICAgIGNvbmZpZy5jaGFuZ2VQZXJjZW50SGFuZGxlcih0YXNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAvL+e7k+adn+aXtumXtOiwg+aVtOW8gOWni1xuICAgIGVuZFRpbWVMaXN0ZW5lci5vbignem9vbXN0YXJ0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoY29uZmlnLnJlYWRvbmx5KSB7IC8v54i25Lu75Yqh5LiN5YWB6K645ouW5YqoTGl1XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGQzLmV2ZW50LnNvdXJjZUV2ZW50ICYmIGQzLmV2ZW50LnNvdXJjZUV2ZW50LnRvU3RyaW5nKCkgPT09ICdbb2JqZWN0IFdoZWVsRXZlbnRdJykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIG12UGFyLmNoYW5nZWQgPSBmYWxzZTtcbiAgICAgICAgbXZQYXIuZW5kRGF0ZSA9IHRhc2suZW5kRGF0ZS5nZXRUaW1lKCk7IC8v6K6w5b2V5Lu75Yqh55qE5byA5aeL5pe26Ze077yM55yL55yL5Lu75Yqh5piv5ZCm55yf55qE6KKr5ouW5Yqo5LqGXG4gICAgICAgIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICAgICB0YXNrLl9zdGFydERhdGUgPSB0YXNrLnN0YXJ0RGF0ZTtcbiAgICAgICAgdGFzay5fZW5kRGF0ZSA9IHRhc2suZW5kRGF0ZTtcbiAgICAgICAgdGFzay5fbW91c2VTdGFydFggPSBkMy5ldmVudC5zb3VyY2VFdmVudC5jbGllbnRYOyAvL+ihqOekuum8oOagh+iQveeCuei3neemu1xuICAgICAgICB0YXNrLl94V2lkdGggPSB4U2NhbGUodGFzay5lbmREYXRlKSAtIHhTY2FsZSh0YXNrLnN0YXJ0RGF0ZSk7XG4gICAgICAgIHRhc2suX3hNaW4gPSB4U2NhbGUoZDMudGltZS5kYXkub2Zmc2V0KHRhc2suc3RhcnREYXRlLCAxKSkgLSB4U2NhbGUodGFzay5zdGFydERhdGUpICsgeE9mZnNldDsgLy/lj6/liLDovr7nmoTmnIDlsI/kvY3nva5cbiAgICAgICAgdGFzay5feFN0YXJ0ID0geFNjYWxlKHRhc2suZW5kRGF0ZSkgLSB4U2NhbGUodGFzay5zdGFydERhdGUpICsgeE9mZnNldDsgLy94U2NhbGUodGFzay5lbmREYXRlKSArIHhPZmZzZXQ7XG4gICAgICAgIHRhc2suX2RheXMgPSBkMy50aW1lLmRheXModGFzay5fc3RhcnREYXRlLCB0YXNrLl9lbmREYXRlKS5sZW5ndGg7XG4gICAgICAgIHZhciBub3cgPSBuZXcgRGF0ZSgpO1xuICAgICAgICB0YXNrLl9kYXlXaWR0aCA9IHhTY2FsZShkMy50aW1lLmRheS5vZmZzZXQobm93LCAxKSkgLSB4U2NhbGUobm93KTtcbiAgICAgICAgLy/ojrflj5Z56Led56a7XG4gICAgICAgIHZhciB0cmFuc2Zvcm0gPSBwZXJjZW50QnRuLmF0dHIoJ3RyYW5zZm9ybScpO1xuICAgICAgICB0YXNrLl95T2Zmc2V0ID0gYXBwLmdldFRyYW5zZm9ybVkodHJhbnNmb3JtKSArIHlPZmZzZXQ7XG4gICAgICAgIC8vIHRvb2x0aXAoJ2JvZHknLCB0YXNrKTtcblxuICAgICAgICB0YXNrYm94LnRleHQgPSB0YXNrYm94LmFwcGVuZCgndGV4dCcpXG4gICAgICAgICAgICAudGV4dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZvcm1hdGVyKHRhc2suc3RhcnREYXRlKSArIFwiL1wiICsgZm9ybWF0ZXIodGFzay5lbmREYXRlKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwiZW5kXCIpXG4gICAgICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciB4ID0gKHhTY2FsZSh0YXNrLmVuZERhdGUpIC0geFNjYWxlKHRhc2suc3RhcnREYXRlKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuICd0cmFuc2xhdGUoJyArIHggKyAnLCAtNiknXG4gICAgICAgICAgICB9KTtcbiAgICB9KS5vbihcInpvb21cIixcbiAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKGNvbmZpZy5yZWFkb25seSkgeyAvL+eItuS7u+WKoeS4jeWFgeiuuOaLluWKqExpdVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChkMy5ldmVudC5zb3VyY2VFdmVudCAmJiBkMy5ldmVudC5zb3VyY2VFdmVudC50b1N0cmluZygpID09PSAnW29iamVjdCBNb3VzZUV2ZW50XScpIHtcbiAgICAgICAgICAgICAgICB2YXIgbW91c2VYID0gZDMuZXZlbnQuc291cmNlRXZlbnQuY2xpZW50WDsgLy/pvKDmoIflvZPliY3kvY3nva5cbiAgICAgICAgICAgICAgICB2YXIgb2Zmc2V0ID0gbW91c2VYIC0gdGFzay5fbW91c2VTdGFydFg7IC8v56e75Yqo5LqG5aSa5bCRXG4gICAgICAgICAgICAgICAgc3RlcHMgPSBNYXRoLnJvdW5kKG9mZnNldCAvIHRhc2suX2RheVdpZHRoKTtcbiAgICAgICAgICAgICAgICBzdGVwcyA9IE1hdGgubWF4KCgwIC0gdGFzay5fZGF5cyArIDEpLCBzdGVwcyk7XG4gICAgICAgICAgICAgICAgdmFyIHhDdXJyID0gdGFzay5feFN0YXJ0ICsgc3RlcHMgKiB0YXNrLl9kYXlXaWR0aDtcbiAgICAgICAgICAgICAgICAvLyB4Q3VyciA9IE1hdGgubWF4KHhDdXJyLCB0YXNrLl94TWluKTtcbiAgICAgICAgICAgICAgICByaWdodEJ0bi5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKCcgKyB4Q3VyciArICcsICcgKyB0YXNrLl95T2Zmc2V0ICsgJyknKTtcbiAgICAgICAgICAgICAgICBkMy5zZWxlY3RBbGwoJy5jb2xvcicpLmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoJyArICh4Q3VyciArIDIwKSArICcsICcgKyB0YXNrLl95T2Zmc2V0ICsgJyknKTtcbiAgICAgICAgICAgICAgICB0YXNrLmVuZERhdGUgPSBkMy50aW1lLmRheS5vZmZzZXQodGFzay5fZW5kRGF0ZSwgc3RlcHMpO1xuICAgICAgICAgICAgICAgIC8vIHZhciB3ID0geFNjYWxlKHRhc2suZW5kRGF0ZSkgLSB4U2NhbGUodGFzay5zdGFydERhdGUpO1xuXG4gICAgICAgICAgICAgICAgLy8gY2hhbmdlUGVyY2VudFBvcygpO1xuICAgICAgICAgICAgICAgIGFwcC5jaGFuZ2VFbmRUaW1lKHRhc2spO1xuICAgICAgICAgICAgICAgIC8vIC8vY29uc29sZS5sb2coY29uZmlnKTtcbiAgICAgICAgICAgICAgICBhcHAuZHJhd0xpbmtzKGNvbmZpZy5kYXRhLmxpbmtzKTtcbiAgICAgICAgICAgICAgICAvLyB0b29sdGlwKCdib2R5JywgdGFzayk7XG4gICAgICAgICAgICAgICAgdGFza2JveC50ZXh0XG4gICAgICAgICAgICAgICAgICAgIC50ZXh0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmb3JtYXRlcih0YXNrLnN0YXJ0RGF0ZSkgKyBcIi9cIiArIGZvcm1hdGVyKHRhc2suZW5kRGF0ZSk7XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJlbmRcIilcbiAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB4ID0gKHhTY2FsZSh0YXNrLmVuZERhdGUpIC0geFNjYWxlKHRhc2suc3RhcnREYXRlKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ3RyYW5zbGF0ZSgnICsgeCArICcsIC02KSdcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgLy/liKTmlq3mmK/lkKbnnJ/nmoTnp7vliqjkuobvvIzov5jmmK/ku4Xku4Xngrnlh7vkuoZcbiAgICAgICAgICAgICAgICBpZiAobXZQYXIuZW5kRGF0ZSAhPSB0YXNrLmVuZERhdGUuZ2V0VGltZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIG12UGFyLmNoYW5nZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBhcHAuY29uZmlnLnRhc2tNYXBzW3Rhc2sudXVpZF0gPSB0YXNrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSlcbiAgICAgICAgLm9uKFwiem9vbWVuZFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoY29uZmlnLnJlYWRvbmx5KSB7IC8v54i25Lu75Yqh5LiN5YWB6K645ouW5YqoTGl1XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gZHJhd01lbnUoKTtcbiAgICAgICAgICAgIC8vIGFwcC5kcmF3VGFzayh0YXNrKTtcbiAgICAgICAgICAgIC8vIGFwcC5hZnRlclByb2Nlc3ModGFzayk7XG4gICAgICAgICAgICBhcHAucmVkcmF3KHRydWUpO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBjb25maWcuY2hhbmdlRW5kVGltZUhhbmRsZXIgPT09ICdmdW5jdGlvbicgJiYgbXZQYXIuY2hhbmdlZCkge1xuICAgICAgICAgICAgICAgIGNvbmZpZy5jaGFuZ2VFbmRUaW1lSGFuZGxlcih0YXNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICB2YXIgYnVpbGRMZWZ0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBsZWZ0QnRuID0gbWVudUJvZHlcbiAgICAgICAgICAgIC5hcHBlbmQoJ3JlY3QnKVxuICAgICAgICAgICAgLmF0dHIoJ3dpZHRoJywgMTApXG4gICAgICAgICAgICAuYXR0cignaGVpZ2h0JywgYnRuSGVpZ2h0KVxuICAgICAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2J0biBsZWZ0QnRuJylcbiAgICAgICAgICAgIC5hdHRyKCdmaWxsJywgYnRuQ29sb3IpXG4gICAgICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciB4ID0gMCAtIGJ0bldpZHRoIC0geE9mZnNldDsgLy9idG7mnKzouqvnmoTlrr3luqblkozlgY/np7vph49cbiAgICAgICAgICAgICAgICB2YXIgeSA9IDAgKyB5T2Zmc2V0O1xuICAgICAgICAgICAgICAgIHJldHVybiBcInRyYW5zbGF0ZShcIiArIHggKyBcIiwgXCIgKyB5ICsgXCIpXCI7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhbGwoc3RhcnRUaW1lTGlzdGVuZXIpO1xuICAgICAgICByZXR1cm4gbGVmdEJ0bjtcbiAgICB9XG5cbiAgICB2YXIgcGF0aEluZm8gPSB7fTtcbiAgICB2YXIgbGluZTtcblxuXG4gICAgLy8gdmFyIGJ1aWxkTGVmdEN5Y2xlID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gICBsZWZ0QnRuID0gbWVudUJvZHlcbiAgICAvLyAgICAgLmFwcGVuZCgnY2lyY2xlJylcbiAgICAvLyAgICAgLmF0dHIoJ3InLCA0KVxuICAgIC8vICAgICAuYXR0cignY2xhc3MnLCAnZG90JylcbiAgICAvLyAgICAgLmF0dHIoJ2ZpbGwnLCBjeWNsZUJ0bkNvbG9yKVxuICAgIC8vICAgICAuYXR0cigndHJhbnNmb3JtJywgZnVuY3Rpb24oKSB7XG4gICAgLy8gICAgICAgdmFyIHggPSAwIC0gYnRuV2lkdGggLSB4T2Zmc2V0IC0gMzsgLy9idG7mnKzouqvnmoTlrr3luqblkozlgY/np7vph49cbiAgICAvLyAgICAgICB2YXIgeSA9IDAgKyB5T2Zmc2V0ICsgMTU7XG4gICAgLy8gICAgICAgcmV0dXJuIFwidHJhbnNsYXRlKFwiICsgeCArIFwiLCBcIiArIHkgKyBcIilcIjtcbiAgICAvLyAgICAgfSlcbiAgICAvLyAgICAgLmNhbGwoZHJhZyk7XG4gICAgLy8gICByZXR1cm4gbGVmdEJ0bjtcbiAgICAvLyB9XG5cbiAgICAvLyB2YXIgYnVpbGRSaWdodEN5Y2xlID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gICBsZWZ0QnRuID0gbWVudUJvZHlcbiAgICAvLyAgICAgLmFwcGVuZCgnY2lyY2xlJylcbiAgICAvLyAgICAgLmF0dHIoJ3InLCA0KVxuICAgIC8vICAgICAuYXR0cignY2xhc3MnLCAnZG90JylcbiAgICAvLyAgICAgLmF0dHIoJ2ZpbGwnLCBjeWNsZUJ0bkNvbG9yKVxuICAgIC8vICAgICAuYXR0cigndHJhbnNmb3JtJywgZnVuY3Rpb24oKSB7XG4gICAgLy8gICAgICAgdmFyIHggPSB4U2NhbGUodGFzay5lbmREYXRlKSAtIHhTY2FsZSh0YXNrLnN0YXJ0RGF0ZSkgKyB4T2Zmc2V0ICsgMTI7XG4gICAgLy8gICAgICAgdmFyIHkgPSAwICsgeU9mZnNldCArIDE1O1xuICAgIC8vICAgICAgIHJldHVybiBcInRyYW5zbGF0ZShcIiArIHggKyBcIiwgXCIgKyB5ICsgXCIpXCI7XG4gICAgLy8gICAgIH0pXG4gICAgLy8gICAgIC5jYWxsKGRyYWcpO1xuICAgIC8vICAgcmV0dXJuIGxlZnRCdG47XG4gICAgLy8gfVxuXG5cbiAgICB2YXIgYnVpbGRSaWdodCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmlnaHRCdG4gPSBtZW51Qm9keVxuICAgICAgICAgICAgLmFwcGVuZCgncmVjdCcpXG4gICAgICAgICAgICAuYXR0cignd2lkdGgnLCAxMClcbiAgICAgICAgICAgIC5hdHRyKCdoZWlnaHQnLCBidG5IZWlnaHQpXG4gICAgICAgICAgICAuYXR0cignY2xhc3MnLCAnYnRuIHJpZ2h0IHJpZ2h0QnRuJylcbiAgICAgICAgICAgIC5hdHRyKCdmaWxsJywgYnRuQ29sb3IpXG4gICAgICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciB4ID0geFNjYWxlKHRhc2suZW5kRGF0ZSkgLSB4U2NhbGUodGFzay5zdGFydERhdGUpICsgeE9mZnNldDtcbiAgICAgICAgICAgICAgICB2YXIgeSA9IDAgKyB5T2Zmc2V0O1xuICAgICAgICAgICAgICAgIHJldHVybiBcInRyYW5zbGF0ZShcIiArIHggKyBcIiwgXCIgKyB5ICsgXCIpXCI7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhbGwoZW5kVGltZUxpc3RlbmVyKTtcbiAgICAgICAgcmV0dXJuIHJpZ2h0QnRuO1xuICAgIH1cblxuICAgIHZhciBjbGlja0NvbG9yID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgdmFyIHByaW9yaXR5ID0gZDMuc2VsZWN0KHRoaXMpLmF0dHIoJ3ByaW9yaXR5Jyk7XG4gICAgICAgIHRhc2sucHJpb3JpdHkgPSBwcmlvcml0eTtcbiAgICAgICAgY29uZmlnLmNoYW5nZVByaW9yaXR5KHRhc2spO1xuICAgICAgICBoaWRlQ29sb3JNZW51KCk7XG4gICAgfVxuXG4gICAgdmFyIGhpZGVDb2xvck1lbnUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGQzLnNlbGVjdEFsbCgnLmNvbG9yJykuY2xhc3NlZCgnb3BlbicsIGZhbHNlKVxuICAgICAgICAgICAgZDMuc2VsZWN0QWxsKCcuY29sb3ItaXRlbScpLmF0dHIoJ2NsYXNzJywgJ2NvbG9yLWl0ZW0gY2xvc2UnKVxuICAgICAgICB9LCAxMDApO1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGQzLnNlbGVjdEFsbCgnLmNvbG9yLWl0ZW0nKS5yZW1vdmUoKTtcbiAgICAgICAgfSwgMzAwKTsgLy82MDDmnaXmupDkuo5jc3NcbiAgICB9XG5cbiAgICB2YXIgc2hvd0NvbG9yTWVudSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gdmFyIGNvbG9yID0gZDMuc2NhbGUuY2F0ZWdvcnkxMCgpO1xuICAgICAgICBkMy5zZWxlY3RBbGwoJy5jb2xvci1pdGVtJykucmVtb3ZlKCk7XG4gICAgICAgIHZhciBhcnIgPSBbXTtcbiAgICAgICAgdmFyIGJveCA9IGQzLnNlbGVjdCgnLmNvbG9yJylcbiAgICAgICAgICAgIC5hcHBlbmQoJ2cnKVxuICAgICAgICAgICAgLmNsYXNzZWQoJ2NvbG9yLWJveCcsIHRydWUpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDQ7IGkrKykge1xuICAgICAgICAgICAgLy8gdmFyIGMgPSBjb2xvcihpKTtcbiAgICAgICAgICAgIC8vIGFyci5wdXNoKGMpO1xuICAgICAgICAgICAgdmFyIGl0ZW0gPSBib3guYXBwZW5kKCdyZWN0JylcbiAgICAgICAgICAgICAgICAuY2xhc3NlZCgnY29sb3ItaXRlbScsIHRydWUpXG4gICAgICAgICAgICAgICAgLmF0dHIoJ3ByaW9yaXR5JywgaSlcbiAgICAgICAgICAgICAgICAvLyAuYXR0cignZmlsbCcsIGMpXG4gICAgICAgICAgICAgICAgLmF0dHIoJ3J4JywgNilcbiAgICAgICAgICAgICAgICAuYXR0cigncnknLCA2KVxuICAgICAgICAgICAgICAgIC5hdHRyKCd3aWR0aCcsIDEyKVxuICAgICAgICAgICAgICAgIC5hdHRyKCdoZWlnaHQnLCAxMilcbiAgICAgICAgICAgICAgICAvLyAuYXR0cigndHJhbnNmb3JtJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgLy8gICB2YXIgeCA9IHhPZmZzZXQ7Ly8gKyAyMCAqIChpKzIpO1xuICAgICAgICAgICAgICAgIC8vICAgcmV0dXJuIFwidHJhbnNsYXRlKFwiICsgeCArIFwiLCBcIiArIDAgKyBcIilcIjtcbiAgICAgICAgICAgICAgICAvLyB9KVxuICAgICAgICAgICAgICAgIC8vIC5zdHlsZShcImRpc3BsYXlcIiwgXCJub25lXCIpXG4gICAgICAgICAgICAgICAgLm9uKCdjbGljaycsIGNsaWNrQ29sb3IpO1xuICAgICAgICAgICAgLy8gLy8vL2NvbnNvbGUubG9nKCdiYWNrZ3JvdW5kOmxpZ2h0ZW4oXCInK2MrJ1wiLCAxMCUpOycpO1xuICAgICAgICB9XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZDMuc2VsZWN0QWxsKCcuY29sb3InKS5jbGFzc2VkKCdvcGVuJywgdHJ1ZSlcbiAgICAgICAgICAgIGQzLnNlbGVjdEFsbCgnLmNvbG9yLWl0ZW0nKS5hdHRyKCdjbGFzcycsICdjb2xvci1pdGVtIG9wZW4nKVxuICAgICAgICB9LCAxMDApXG4gICAgICAgIC8vIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICB2YXIgYnVpbGRDb2xvckJ0biA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGNvbG9yID0gbWVudUJvZHlcbiAgICAgICAgICAgIC5hcHBlbmQoJ2cnKVxuICAgICAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgeCA9IHhTY2FsZSh0YXNrLmVuZERhdGUpIC0geFNjYWxlKHRhc2suc3RhcnREYXRlKSArIHhPZmZzZXQgKyAyMDtcbiAgICAgICAgICAgICAgICB2YXIgeSA9IDAgKyB5T2Zmc2V0O1xuICAgICAgICAgICAgICAgIHJldHVybiBcInRyYW5zbGF0ZShcIiArIHggKyBcIiwgXCIgKyB5ICsgXCIpXCI7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2J0biByaWdodCBjb2xvcicpXG4gICAgICAgIGNvbG9yLmFwcGVuZCgncmVjdCcpXG4gICAgICAgICAgICAuYXR0cignZmlsbCcsICcjNkRGM0QyJylcbiAgICAgICAgICAgIC5hdHRyKCdzdHJva2UnLCAnIzMzQjE5MicpXG4gICAgICAgICAgICAuYXR0cignYWx0JywgJ+S8mOWFiOe6pycpXG4gICAgICAgICAgICAuYXR0cigncngnLCA2KVxuICAgICAgICAgICAgLmF0dHIoJ3J5JywgNilcbiAgICAgICAgICAgIC5hdHRyKCd3aWR0aCcsIDEyKVxuICAgICAgICAgICAgLmF0dHIoJ2hlaWdodCcsIDEyKTtcbiAgICAgICAgY29sb3Iub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICB2YXIgYm94ID0gZDMuc2VsZWN0QWxsKCcuY29sb3InKTtcbiAgICAgICAgICAgIGlmIChib3guYXR0cignY2xhc3MnKS5pbmRleE9mKCdvcGVuJykgIT0gLTEpIHtcbiAgICAgICAgICAgICAgICBoaWRlQ29sb3JNZW51KCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNob3dDb2xvck1lbnUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBjb2xvcjtcbiAgICB9XG5cbiAgICB2YXIgYnVpbGRQZXJjZW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBwZXJjZW50QnRuID0gbWVudUJvZHlcbiAgICAgICAgICAgIC5hcHBlbmQoJ3BvbHlsaW5lJylcbiAgICAgICAgICAgIC5hdHRyKCdzdHJva2UnLCBidG5Db2xvcilcbiAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsIFwiYnRuIHBlcmNlbnRCdG5cIilcbiAgICAgICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKDAsIDI0KScpXG4gICAgICAgICAgICAuYXR0cigncG9pbnRzJywgJzAsJyArICh5T2Zmc2V0IC0gNSkgKyAnIDAsJyArICh5T2Zmc2V0ICsgYnRuSGVpZ2h0ICsgNSkpXG4gICAgICAgICAgICAuYXR0cignc3R5bGUnLCAnZmlsbDonICsgYnRuQ29sb3IgKyAnO3N0cm9rZS13aWR0aDozJylcbiAgICAgICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHgxID0gMDtcbiAgICAgICAgICAgICAgICB2YXIgeDIgPSB4U2NhbGUodGFzay5lbmREYXRlKSAtIHhTY2FsZSh0YXNrLnN0YXJ0RGF0ZSk7XG4gICAgICAgICAgICAgICAgeDEgPSB4MSArIE1hdGgubWF4KCh4MiAtIHgxKSAqICh0YXNrLnBlcmNlbnQgfHwgMCksIDApO1xuICAgICAgICAgICAgICAgIHZhciB5ID0gMDtcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJ0cmFuc2xhdGUoXCIgKyB4MSArIFwiLCBcIiArIHkgKyBcIilcIjtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2FsbChwZXJjZW50TGlzdGVuZXIpO1xuICAgICAgICAvLyB2YXIgcGVyY2VudExpbmUgPSBwZXJjZW50QnRuXG4gICAgICAgIC8vICAgLmFwcGVuZCgncG9seWxpbmUnKVxuICAgICAgICAvLyAgIC5hdHRyKCdzdHJva2UnLCBcIiNhMGEwYTBcIilcbiAgICAgICAgLy8gICAuYXR0cignY2xhc3MnLCBcInBlcmNlbnRCdG5cIilcbiAgICAgICAgLy8gICAuYXR0cigndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZSgwLCAyNCknKVxuICAgICAgICAvLyAgIC8vIC5hdHRyKCdwb2ludHMnLCAnMCwwIDYsNyA2LDEzLCAtNiwxMyAtNiw3IDAsMCcpXG4gICAgICAgIC8vICAgLmF0dHIoJ3N0eWxlJywgJ2ZpbGw6d2hpdGU7c3Ryb2tlLXdpZHRoOjEnKTtcbiAgICAgICAgcmV0dXJuIHBlcmNlbnRCdG47XG4gICAgfVxuXG4gICAgdmFyIGNoYW5nZVBlcmNlbnRQb3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHBlcmNlbnRCdG4uYXR0cigndHJhbnNmb3JtJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHgxID0geFNjYWxlKHRhc2suc3RhcnREYXRlKTtcbiAgICAgICAgICAgIHZhciB4MiA9IHhTY2FsZSh0YXNrLmVuZERhdGUpO1xuICAgICAgICAgICAgdmFyIHAxID0gKHgyIC0geDEpICogdGFzay5wZXJjZW50OyAvL3gxICsgKHgyIC0geDEpICogdGFzay5wZXJjZW50O1xuICAgICAgICAgICAgLy8gLy8vL2NvbnNvbGUubG9nKFt4MSwgcDEsIHgyXS5qb2luKCcsJykpO1xuICAgICAgICAgICAgdmFyIHkgPSAwOyAvL3lTY2FsZSh0YXNrLnV1aWQpO1xuICAgICAgICAgICAgcmV0dXJuIFwidHJhbnNsYXRlKFwiICsgcDEgKyBcIiwgXCIgKyB5ICsgXCIpXCI7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHZhciBkcmF3TWVudSA9IGZ1bmN0aW9uIGRyYXdNZW51KCkge1xuICAgICAgICBpZiAodGFzay5tYXJrZXIgfHwgY29uZmlnLnJlYWRvbmx5IHx8IGNvbmZpZy5kaXNhYmxlKHRhc2spKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaW5pdCgpO1xuICAgICAgICBidWlsZExlZnQoKTtcbiAgICAgICAgYnVpbGRSaWdodCgpO1xuICAgICAgICAvLyBidWlsZExlZnRDeWNsZSgpO1xuICAgICAgICAvLyBidWlsZFJpZ2h0Q3ljbGUoKTtcbiAgICAgICAgLy8gYnVpbGRDb2xvckJ0bigpO1xuICAgICAgICBidWlsZFBlcmNlbnQoKTtcbiAgICAgICAgYXBwLmRyYXdQb2ludGVyKHRhc2spO1xuICAgICAgICByZXR1cm4gbWVudTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIGRyYXdNZW51KCk7XG59OyIsIlwidXNlIHN0cmljdFwiO1xudmFyIFB1YlN1YiA9IHJlcXVpcmUoJ3B1YnN1Yi1qcycpO1xudmFyIG1lbnVGYWN0b3J5ID0gcmVxdWlyZSgnLi9tZW51RmFjdG9yeScpO1xudmFyIGZvcm1hdGVyID0gZDMudGltZS5mb3JtYXQoXCIlWS0lbS0lZCAlSFwiKTtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGQzLCBhcHAsIHhTY2FsZSwgeVNjYWxlLCBncmFwaCwgdGFza0lkKSB7XG4gICAgdmFyIGNvbmZpZyA9IGFwcC5jb25maWc7XG4gICAgdmFyIHRhc2tzV2FycHBlciA9IGQzLnNlbGVjdCgnI3Rhc2tzLXdyYXBwZXInKTtcbiAgICB2YXIgdGFza2JveCwgcHJlLCBiYWNrZ3JvdW5kLCBtYXNrLCB0aW1lSW5mbztcbiAgICAvLyB2YXIgbW92ZUxpc3RlbmVyID0gZDMuYmVoYXZpb3Iuem9vbSgpLmNlbnRlcihudWxsKTtcbiAgICB2YXIgdGFza0hlaWdodCA9IDE0O1xuICAgIHZhciB0YXNrT2ZmVG9wID0gNztcbiAgICB2YXIgcGFja2FnZUhlaWdodCA9IDk7IC8vTElVIOWOn+adpemrmOW6puaYrzQgIOS6p+WTgeiuqeiwg+mrmOS6hlxuICAgIHZhciBwYWNrYWdlT2ZmVG9wID0gNztcbiAgICB2YXIgc3RvbmVIZWlnaHQgPSA0O1xuICAgIHZhciBzdG9uZU9mZlRvcCA9IDc7XG4gICAgdmFyIHRhc2sgPSBhcHAuY29uZmlnLnRhc2tNYXBzW3Rhc2tJZF07XG5cbiAgICB2YXIgaW5pdCA9IGZ1bmN0aW9uICh0YXNrKSB7XG4gICAgICAgIC8vIC8vY29uc29sZS5sb2codGFzayk7XG4gICAgICAgIHZhciBsaW5lID0gJy50YXNrLWxpbmUtJyArIHRhc2sudXVpZDtcbiAgICAgICAgZDMuc2VsZWN0QWxsKGxpbmUpLnJlbW92ZSgpO1xuICAgICAgICAvL+WIpOaWrXRhc2vmmK/lkKblt7Lnu4/ov4fmnJ/kuoZcbiAgICAgICAgaWYgKHRhc2suZW5kRGF0ZSkge1xuICAgICAgICAgICAgdmFyIGVuZCA9IHRhc2suZW5kRGF0ZS5nZXRUaW1lKCk7XG4gICAgICAgICAgICB2YXIgbm93ID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICAgICAgICBpZiAoZW5kIDwgbm93KSB7XG4gICAgICAgICAgICAgICAgdGFzay5kdWVPdXQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0YXNrLm1hcmtlcikge1xuICAgICAgICAgICAgc2hvd01hcmtlcih0YXNrKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRyYXdUYXNrKHRhc2spO1xuICAgICAgICB9XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCfmnInkuIDkuKrpgInkuK3nmoTku7vliqHvvJonICsgdGFzay51dWlkKydcXHQnK2NvbmZpZy5zZWxlY3RUYXNrSWQpO1xuICAgICAgICBpZiAodGFzay51dWlkID09IGNvbmZpZy5zZWxlY3RUYXNrSWQpIHtcbiAgICAgICAgICAgIGFwcC5zZWxlY3RUYXNrKHRhc2sudXVpZCk7XG4gICAgICAgICAgICBtZW51RmFjdG9yeShkMywgYXBwLCBkMy5zZWxlY3QoJy50YXNrcy13cmFwcGVyJyksIHRhc2spO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhcHAuY29uZmlnLnNob3dCYXNlbGluZSkge1xuICAgICAgICAgICAgc2hvd09sZFRhc2sodGFzayk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIHZhciBnZXRUYXNrQm94ID0gZnVuY3Rpb24gKHRhc2spIHtcbiAgICAgICAgdmFyIGxpbmUgPSAnLnRhc2stbGluZS0nICsgdGFzay51dWlkO1xuICAgICAgICByZXR1cm4gZDMuc2VsZWN0KGxpbmUpLnNlbGVjdCgnLml0ZW0nKTtcbiAgICB9XG5cbiAgICAvL+eUu+enu+WKqOaXtueahG1hc2vmlYjmnpzvvIzkuIDkuKrnn6nlvaIr5Lik5p2h6L65XG4gICAgdmFyIGRyYXdNb3ZlTWFzayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gLy8vLy8vY29uc29sZS5sb2coJ3h4eCcpO1xuICAgICAgICB2YXIgYm94ID0gZDMuc2VsZWN0KCcjYXBwLXdyYXBwZXInKTtcbiAgICAgICAgYm94LnNlbGVjdCgnI21vdmUtbWFzaycpLnJlbW92ZSgpO1xuICAgICAgICB2YXIgdyA9IHhTY2FsZSh0YXNrLmVuZERhdGUpIC0geFNjYWxlKHRhc2suc3RhcnREYXRlKTtcbiAgICAgICAgdmFyIHggPSB4U2NhbGUodGFzay5zdGFydERhdGUpO1xuICAgICAgICB2YXIgeVNjcm9sbCA9IDA7Ly8wIC0gJCgnI2dhbnR0LXNjcm9sbGVyJykub2Zmc2V0KCkudG9wICsgNDI7XG4gICAgICAgIHZhciBoZWlnaHQgPSAkKCcjZ2FudHQtd3JhcHBlcicpLmhlaWdodCgpO1xuXG4gICAgICAgIG1hc2sgPSBib3guYXBwZW5kKCdnJylcbiAgICAgICAgICAgIC5hdHRyKCdpZCcsICdtb3ZlLW1hc2snKVxuICAgICAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2xsaW5lJylcbiAgICAgICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKCcgKyB4ICsgJywgJyArIHlTY3JvbGwgKyAnKScpO1xuXG4gICAgICAgICQoJyNhcHAtd3JhcHBlcicpLnByZXBlbmQoJCgnLmxsaW5lJykpO1xuICAgICAgICBtYXNrLmFwcGVuZCgncmVjdCcpXG4gICAgICAgICAgICAuc3R5bGUoJ2ZpbGwnLCBcIiMwY2NcIilcbiAgICAgICAgICAgIC5hdHRyKCdvcGFjaXR5JywgJzAuMScpXG4gICAgICAgICAgICAuYXR0cignaGVpZ2h0JywgaGVpZ2h0KVxuICAgICAgICAgICAgLmF0dHIoJ3dpZHRoJywgdylcblxuICAgICAgICBtYXNrLmFwcGVuZCgnbGluZScpXG4gICAgICAgICAgICAuYXR0cigneDEnLCAwKVxuICAgICAgICAgICAgLmF0dHIoJ3kxJywgMClcbiAgICAgICAgICAgIC5hdHRyKCd4MicsIDApXG4gICAgICAgICAgICAuYXR0cigneTInLCBoZWlnaHQpO1xuXG4gICAgICAgIG1hc2suYXBwZW5kKCdsaW5lJylcbiAgICAgICAgICAgIC5hdHRyKCd4MScsIHcpXG4gICAgICAgICAgICAuYXR0cigneTEnLCAwKVxuICAgICAgICAgICAgLmF0dHIoJ3gyJywgdylcbiAgICAgICAgICAgIC5hdHRyKCd5MicsIGhlaWdodCk7XG4gICAgICAgIHJldHVybiBtYXNrO1xuICAgIH1cblxuICAgIHZhciBjbGVhck1vdmVNYXNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYm94ID0gZDMuc2VsZWN0KCcjYXBwLXdyYXBwZXInKTtcbiAgICAgICAgYm94LnNlbGVjdCgnLmxsaW5lJykucmVtb3ZlKCk7XG4gICAgICAgIG1hc2sgPSBudWxsO1xuICAgIH1cblxuICAgIC8vIHZhciBnZXRUcmFuc2Zvcm1YID0gZnVuY3Rpb24oc3RyKSB7XG4gICAgLy8gICB2YXIgcmVzdWx0ID0gMDtcbiAgICAvLyAgIGlmIChzdHIpIHtcbiAgICAvLyAgICAgdmFyIHN0YXJ0ID0gc3RyLmluZGV4T2YoJygnKTtcbiAgICAvLyAgICAgdmFyIGVuZCA9IHN0ci5pbmRleE9mKCcsJyk7XG4gICAgLy8gICAgIHZhciBfc3RyID0gc3RyLnN1YnN0cmluZyhzdGFydCArIDEsIGVuZClcbiAgICAvLyAgICAgcmVzdWx0ID0gcGFyc2VGbG9hdChfc3RyKTtcbiAgICAvLyAgIH1cbiAgICAvLyAgIHJldHVybiByZXN1bHQ7XG4gICAgLy8gfVxuXG4gICAgLy8gdmFyIGdldFRyYW5zZm9ybVkgPSBmdW5jdGlvbihzdHIpIHtcbiAgICAvLyAgIHZhciByZXN1bHQgPSAwO1xuICAgIC8vICAgaWYgKHN0cikge1xuICAgIC8vICAgICB2YXIgc3RhcnQgPSBzdHIuaW5kZXhPZignLCcpO1xuICAgIC8vICAgICB2YXIgZW5kID0gc3RyLmluZGV4T2YoJyknKTtcbiAgICAvLyAgICAgdmFyIF9zdHIgPSBzdHIuc3Vic3RyaW5nKHN0YXJ0ICsgMSwgZW5kKTtcbiAgICAvLyAgICAgcmVzdWx0ID0gcGFyc2VGbG9hdChfc3RyKTtcbiAgICAvLyAgIH1cbiAgICAvLyAgIHJldHVybiByZXN1bHQ7XG4gICAgLy8gfVxuXG5cbiAgICB2YXIgY2xlYXJUaW1lSW5mbyA9IGZ1bmN0aW9uIChjb250YWluZXIsIG1vZGVsKSB7XG4gICAgICAgIGQzLnNlbGVjdEFsbCgnLnRpbWUtaW5mbycpLnJlbW92ZSgpO1xuICAgIH1cblxuXG4gICAgdmFyIHNob3dUaW1lSW5mbyA9IGZ1bmN0aW9uIChjb250YWluZXIsIG1vZGVsKSB7XG4gICAgICAgIGlmIChtb2RlbCA9PT0gJ3N0YXJ0Jykge1xuICAgICAgICAgICAgdGltZUluZm8gPSBjb250YWluZXIuYXBwZW5kKCd0ZXh0JylcbiAgICAgICAgICAgICAgICAudGV4dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmb3JtYXRlcih0YXNrLnN0YXJ0RGF0ZSkgKyBcIi9cIiArIGZvcm1hdGVyKHRhc2suZW5kRGF0ZSk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwic3RhcnRcIilcblxuICAgICAgICAgICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAndHJhbnNsYXRlKDMsIC02KSdcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5jbGFzc2VkKCd0aW1lLWluZm8nLCB0cnVlKTtcbiAgICAgICAgICAgIHJldHVybiB0aW1lSW5mbztcbiAgICAgICAgfSBlbHNlIGlmIChtb2RlbCA9PT0gJ2VuZCcpIHtcblxuICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIHZhciBtdlBhciA9IHt9OyAvL+mSiOWvueenu+WKqOaXtueahOWFqOWxgOWPmOmHj1xuICAgIHZhciBzdGFydE1vdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGFwcC5zZWxlY3RUYXNrKHRhc2sudXVpZCk7XG4gICAgICAgIGlmICh0eXBlb2YgYXBwLmNvbmZpZy5zZWxlY3RIYW5kbGVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBhcHAuY29uZmlnLnNlbGVjdEhhbmRsZXIodGFzayk7XG4gICAgICAgIH1cbiAgICAgICAgLy9jb25zb2xlLmxvZygnZXZlbnQ6c3RhcnRNb3ZlJyk7XG4gICAgICAgIGlmIChjb25maWcucmVhZG9ubHkgfHwgY29uZmlnLmRpc2FibGUodGFzaykpIHsgLy/niLbku7vliqHkuI3lhYHorrjmi5bliqhMaXVcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZDMuZXZlbnQuc291cmNlRXZlbnQgJiYgZDMuZXZlbnQuc291cmNlRXZlbnQudG9TdHJpbmcoKSA9PT0gJ1tvYmplY3QgTW91c2VFdmVudF0nKSB7XG4gICAgICAgICAgICBhcHAuc2VsZWN0VGFzayh0YXNrLnV1aWQpO1xuICAgICAgICAgICAgcmVkcmF3TWVudSgpO1xuICAgICAgICAgICAgbWFzayA9IG51bGw7XG4gICAgICAgICAgICB0YXNrLl9zdGFydERhdGUgPSB0YXNrLnN0YXJ0RGF0ZTtcbiAgICAgICAgICAgIHRhc2suX2VuZERhdGUgPSB0YXNrLmVuZERhdGU7XG4gICAgICAgICAgICB2YXIgdHJhbnMgPSB0YXNrYm94LmF0dHIoJ3RyYW5zZm9ybScpO1xuICAgICAgICAgICAgdmFyIG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICB0YXNrLl9kYXlXaWR0aCA9IHhTY2FsZShkMy50aW1lLmRheS5vZmZzZXQobm93LCAxKSkgLSB4U2NhbGUobm93KTtcbiAgICAgICAgICAgIHRhc2suX3N0YXJ0WCA9IGFwcC5nZXRUcmFuc2Zvcm1YKHRyYW5zKTtcbiAgICAgICAgICAgIHRhc2suX21vdXNlU3RhcnRYID0gZDMuZXZlbnQuc291cmNlRXZlbnQuY2xpZW50WDsgLy/pvKDmoIflvZPliY3kvY3nva5cbiAgICAgICAgICAgIG12UGFyLm1vdmVkID0gZmFsc2U7XG4gICAgICAgICAgICBtdlBhci5zdGFydERhdGUgPSB0YXNrLnN0YXJ0RGF0ZS5nZXRUaW1lKCk7IC8v6K6w5b2V5Lu75Yqh55qE5byA5aeL5pe26Ze077yM55yL55yL5Lu75Yqh5piv5ZCm55yf55qE6KKr5ouW5Yqo5LqGXG4gICAgICAgICAgICAvLyAkKCcjZ2FudHQtY29udGFpbmVyJykuY3NzKFwiY3Vyc29yXCIsIFwibW92ZVwiKTtcbiAgICAgICAgICAgIC8vIGRyYXdNb3ZlTWFzaygpO1xuICAgICAgICAgICAgY2xlYXJNb3ZlTWFzaygpO1xuICAgICAgICAgICAgY2xlYXJUaW1lSW5mbygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmFyIG1vdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vY29uc29sZS5sb2coJ2V2ZW50Om1vdmUnKTtcbiAgICAgICAgaWYgKGNvbmZpZy5yZWFkb25seSB8fCBjb25maWcuZGlzYWJsZSh0YXNrKSkgeyAvL+eItuS7u+WKoeS4jeWFgeiuuOaLluWKqExpdVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGQzLmV2ZW50LnNvdXJjZUV2ZW50ICYmIGQzLmV2ZW50LnNvdXJjZUV2ZW50LnRvU3RyaW5nKCkgPT09ICdbb2JqZWN0IE1vdXNlRXZlbnRdJykge1xuICAgICAgICAgICAgaWYgKGQzLmV2ZW50LnNvdXJjZUV2ZW50ICYmIGQzLmV2ZW50LnNvdXJjZUV2ZW50LnRvU3RyaW5nKCkgPT09ICdbb2JqZWN0IE1vdXNlRXZlbnRdJykge1xuICAgICAgICAgICAgICAgIHZhciBtb3VzZVggPSBkMy5ldmVudC5zb3VyY2VFdmVudC5jbGllbnRYOyAvL+m8oOagh+W9k+WJjeS9jee9rlxuICAgICAgICAgICAgICAgIHZhciBvZmZzZXQgPSBtb3VzZVggLSB0YXNrLl9tb3VzZVN0YXJ0WDsgLy/np7vliqjkuoblpJrlsJFcbiAgICAgICAgICAgICAgICB2YXIgc3RlcHMgPSB0YXNrLl9zdGVwcyA9IE1hdGgucm91bmQob2Zmc2V0IC8gdGFzay5fZGF5V2lkdGgpO1xuICAgICAgICAgICAgICAgIHZhciB4ID0gdGFzay5fc3RhcnRYICsgc3RlcHMgKiB0YXNrLl9kYXlXaWR0aDtcblxuICAgICAgICAgICAgICAgIC8v5Lu75Yqh56e75YqoXG4gICAgICAgICAgICAgICAgdGFza2JveC5hdHRyKCd0cmFuc2Zvcm0nLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAndHJhbnNsYXRlKCcgKyB4ICsgJywgJyArIHRhc2tPZmZUb3AgKyAnKSc7XG4gICAgICAgICAgICAgICAgfSkuYXR0cignY2xhc3MnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhcHAuY29uZmlnLmNsYXNzRml4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXBwLmNvbmZpZy5jbGFzc0ZpeCh0YXNrKVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiaXRlbVwiXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICAgLy/lpITnkIbnp7vliqjlsYJcbiAgICAgICAgICAgICAgICBpZiAoIW1hc2spIHtcbiAgICAgICAgICAgICAgICAgICAgbWFzayA9IGRyYXdNb3ZlTWFzaygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgdHJhbnMgPSBtYXNrLmF0dHIoJ3RyYW5zZm9ybScpO1xuICAgICAgICAgICAgICAgIHZhciB5ID0gYXBwLmdldFRyYW5zZm9ybVkodHJhbnMpO1xuICAgICAgICAgICAgICAgIG1hc2suYXR0cigndHJhbnNmb3JtJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ3RyYW5zbGF0ZSgnICsgeCArICcsICcgKyB5ICsgJyknO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIC8v5aSE55CG56e75Yqo5bGC57uT5p2fXG5cbiAgICAgICAgICAgICAgICB0YXNrLnN0YXJ0RGF0ZSA9IGQzLnRpbWUuZGF5Lm9mZnNldCh0YXNrLl9zdGFydERhdGUsIHN0ZXBzIHx8IDApO1xuICAgICAgICAgICAgICAgIHRhc2suZW5kRGF0ZSA9IGQzLnRpbWUuZGF5Lm9mZnNldCh0YXNrLl9lbmREYXRlLCBzdGVwcyB8fCAwKTtcblxuICAgICAgICAgICAgICAgIGFwcC5jb25maWcudGFza01hcHNbdGFzay51dWlkXSA9IHRhc2s7XG5cbiAgICAgICAgICAgICAgICAvL+iPnOWNleS4gOi1t+i/kOWKqFxuICAgICAgICAgICAgICAgIGQzLnNlbGVjdCgnI21lbnVCb2R5JykuYXR0cigndHJhbnNmb3JtJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ3RyYW5zbGF0ZSgnICsgeCArICcsIDApJztcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIC8v5aSE55CG5o+Q56S65L+h5oGvXG4gICAgICAgICAgICAgICAgaWYgKCF0aW1lSW5mbykge1xuICAgICAgICAgICAgICAgICAgICB0aW1lSW5mbyA9IHNob3dUaW1lSW5mbyh0YXNrYm94LCAnc3RhcnQnKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aW1lSW5mb1xuICAgICAgICAgICAgICAgICAgICAudGV4dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZm9ybWF0ZXIodGFzay5zdGFydERhdGUpICsgXCIvXCIgKyBmb3JtYXRlcih0YXNrLmVuZERhdGUpO1xuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwic3RhcnRcIilcbiAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB4ID0gMzsgLy8oeFNjYWxlKHRhc2suZW5kRGF0ZSkgLSB4U2NhbGUodGFzay5zdGFydERhdGUpKSArIDEwO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICd0cmFuc2xhdGUoJyArIHggKyAnLCAtNiknXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGFwcC5kcmF3TGlua3MoY29uZmlnLmRhdGEubGlua3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy/liKTmlq3mmK/lkKbnnJ/nmoTnp7vliqjkuobvvIzov5jmmK/ku4Xku4Xngrnlh7vkuoZcbiAgICAgICAgICAgIGlmIChtdlBhci5zdGFydERhdGUgIT0gdGFzay5zdGFydERhdGUpIHtcbiAgICAgICAgICAgICAgICBtdlBhci5tb3ZlZCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHZhciBlbmRNb3ZlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAkKCcjZ2FudHQtY29udGFpbmVyJykuY3NzKFwiY3Vyc29yXCIsIFwiZGVmYXVsdFwiKTtcbiAgICAgICAgaWYgKCFtdlBhci5tb3ZlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUubG9nKCdldmVudDplbmRNb3ZlJyk7XG4gICAgICAgIC8vY29uc29sZS5sb2coJ+ecn+eahOenu+WKqOS6hicpO1xuICAgICAgICBpZiAoY29uZmlnLnJlYWRvbmx5KSB7IC8v54i25Lu75Yqh5LiN5YWB6K645ouW5YqoTGl1XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgYXBwLmNvbmZpZy50YXNrTWFwc1t0YXNrLnV1aWRdID0gdGFzaztcbiAgICAgICAgaWYgKGQzLmV2ZW50LnNvdXJjZUV2ZW50ICYmIGQzLmV2ZW50LnNvdXJjZUV2ZW50LnRvU3RyaW5nKCkgPT09ICdbb2JqZWN0IE1vdXNlRXZlbnRdJykge1xuICAgICAgICAgICAgY2xlYXJNb3ZlTWFzaygpO1xuICAgICAgICAgICAgYXBwLnJlZHJhdyh0cnVlKTtcbiAgICAgICAgICAgIC8vIGFwcC5hZnRlclByb2Nlc3ModGFzayk7XG4gICAgICAgICAgICAvLyByZWRyYXdNZW51KCk7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGNvbmZpZy5tb3ZlSGFuZGxlciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIGNvbmZpZy5tb3ZlSGFuZGxlcih0YXNrKTtcbiAgICAgICAgICAgIH0gLy/mi5bliqjku7vliqHop6blj5Hnm5HlkKxMaXVcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHZhciBkcmFnID0gZDMuYmVoYXZpb3IuZHJhZygpXG4gICAgICAgIC5vbihcImRyYWdzdGFydFwiLCBzdGFydE1vdmUpXG4gICAgICAgIC5vbihcImRyYWdcIiwgbW92ZSlcbiAgICAgICAgLm9uKFwiZHJhZ2VuZFwiLCBlbmRNb3ZlKVxuXG5cbiAgICAvLyDlpITnkIbku7vliqHlt6blj7Pnp7vliqjnmoTpl67pophcbiAgICB2YXIgbWFza0JveDtcbiAgICAvLyBtb3ZlTGlzdGVuZXJcbiAgICAvLyAvL+W8gOWni+enu+WKqFxuICAgIC8vICAgLm9uKCd6b29tc3RhcnQnLCBmdW5jdGlvbigpIHtcblxuICAgIC8vICAgfSlcbiAgICAvLyAgIC8v56e75Yqo5LitXG4gICAgLy8gICAub24oXCJ6b29tXCIsIGZ1bmN0aW9uKCkge1xuXG4gICAgLy8gICB9KVxuICAgIC8vICAgLy/lgZzmraLnp7vliqhcbiAgICAvLyAgIC5vbihcInpvb21lbmRcIiwgZnVuY3Rpb24oKSB7XG5cbiAgICAvLyAgIH0pO1xuXG4gICAgdmFyIGNoYW5nZVBlcmNlbnQgPSBmdW5jdGlvbiAodGFzaykge1xuICAgICAgICB2YXIgdGFza2JveCA9IGdldFRhc2tCb3godGFzayk7XG4gICAgICAgIHRhc2tib3guc2VsZWN0KCcucHJlJykuYXR0cignd2lkdGgnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgd2lkdGggPSAoeFNjYWxlKHRhc2suZW5kRGF0ZSkgLSB4U2NhbGUodGFzay5zdGFydERhdGUpKSAtIDE7XG4gICAgICAgICAgICByZXR1cm4gd2lkdGggKiB0YXNrLnBlcmNlbnQgfHwgMDtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHZhciBjaGFuZ2VTdGFydFRpbWUgPSBmdW5jdGlvbiAodGFzaykge1xuICAgICAgICB2YXIgdGFza2JveCA9IGdldFRhc2tCb3godGFzayk7XG4gICAgICAgIHRhc2suZGFzaGFycmF5ID0gZmFsc2U7XG4gICAgICAgIHRhc2tib3guYXR0cihcInN0cm9rZS1kYXNoYXJyYXlcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgIHJldHVybiAnMCdcbiAgICAgICAgfSlcbiAgICAgICAgdGFza2JveC5hdHRyKCd0cmFuc2Zvcm0nLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJ3RyYW5zbGF0ZSgnICsgeFNjYWxlKHRhc2suc3RhcnREYXRlKSArICcsICcgKyB0YXNrT2ZmVG9wICsgJyknXG4gICAgICAgIH0pXG4gICAgICAgIHRhc2tib3guc2VsZWN0KCcucHJlJykuYXR0cignd2lkdGgnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gKHhTY2FsZSh0YXNrLmVuZERhdGUpIC0geFNjYWxlKFxuICAgICAgICAgICAgICAgICAgICB0YXNrLnN0YXJ0RGF0ZSkpICogdGFzay5wZXJjZW50IHx8IDA7XG4gICAgICAgIH0pO1xuICAgICAgICB0YXNrYm94LnNlbGVjdCgnLmJhY2tncm91bmQnKS5hdHRyKCd3aWR0aCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAoeFNjYWxlKHRhc2suZW5kRGF0ZSkgLSB4U2NhbGUodGFzay5zdGFydERhdGUpKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHZhciBjaGFuZ2VFbmRUaW1lID0gZnVuY3Rpb24gKHRhc2spIHtcbiAgICAgICAgdmFyIHRhc2tib3ggPSBnZXRUYXNrQm94KHRhc2spO1xuICAgICAgICB0YXNrLmRhc2hhcnJheSA9IGZhbHNlO1xuICAgICAgICB0YXNrYm94LmF0dHIoXCJzdHJva2UtZGFzaGFycmF5XCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICByZXR1cm4gJzAnXG4gICAgICAgIH0pXG4gICAgICAgIHRhc2tib3guc2VsZWN0KCcucHJlJykuYXR0cignd2lkdGgnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gKHhTY2FsZSh0YXNrLmVuZERhdGUpIC0geFNjYWxlKFxuICAgICAgICAgICAgICAgICAgICB0YXNrLnN0YXJ0RGF0ZSkpICogdGFzay5wZXJjZW50IHx8IDA7XG4gICAgICAgIH0pO1xuICAgICAgICB0YXNrYm94LnNlbGVjdCgnLmJhY2tncm91bmQnKS5hdHRyKCd3aWR0aCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAoeFNjYWxlKHRhc2suZW5kRGF0ZSkgLSB4U2NhbGUodGFzay5zdGFydERhdGUpKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIC8vIHZhciBjdXJ4LCBjdXJ5O1xuICAgIHZhciBjbGlja0hhbmRsZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBldmVudCA9IGQzLmV2ZW50O1xuICAgICAgICB2YXIgZWwgPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KGQzLmV2ZW50LmNsaWVudFgsIGQzLmV2ZW50LmNsaWVudFkpO1xuICAgICAgICByZWRyYXdNZW51KCk7XG4gICAgfVxuXG4gICAgdmFyIGNoYW5nZVByaW9yaXR5ID0gZnVuY3Rpb24gKHRhc2spIHtcbiAgICAgICAgdmFyIHRhc2tib3ggPSBnZXRUYXNrQm94KHRhc2spO1xuICAgICAgICB0YXNrYm94LmF0dHIoJ2NsYXNzJywgJ2l0ZW0gcHJpb3JpdHktJyArIHRhc2sucHJpb3JpdHkpO1xuICAgIH1cblxuICAgIHZhciByZWRyYXdNZW51ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoY29uZmlnLnJlYWRvbmx5KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgYXBwLmNoYW5nZVByaW9yaXR5ID0gY2hhbmdlUHJpb3JpdHk7XG4gICAgICAgIGFwcC5jaGFuZ2VTdGFydFRpbWUgPSBjaGFuZ2VTdGFydFRpbWU7XG4gICAgICAgIGFwcC5jaGFuZ2VQZXJjZW50ID0gY2hhbmdlUGVyY2VudDtcbiAgICAgICAgYXBwLmNoYW5nZUVuZFRpbWUgPSBjaGFuZ2VFbmRUaW1lO1xuICAgICAgICAvL+mAieS4rVxuICAgICAgICBtZW51RmFjdG9yeShkMywgYXBwLCBkMy5zZWxlY3QoJy50YXNrcy13cmFwcGVyJyksIHRhc2spO1xuICAgIH1cblxuICAgIHZhciBzaG93TWFya2VyID0gZnVuY3Rpb24gKHRhc2spIHtcbiAgICAgICAgdGFzay5lbmREYXRlID0gdGFzay5zdGFydERhdGU7XG4gICAgICAgIHZhciBsaW5lU3ZnID0gdGFza3NXYXJwcGVyXG4gICAgICAgICAgICAuYXBwZW5kKCdnJylcbiAgICAgICAgICAgIC5jbGFzc2VkKCdsaW5lJywgdHJ1ZSlcbiAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ3Rhc2stbGluZS0nICsgdGFzay51dWlkO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICd0cmFuc2xhdGUoMCwnICsgKHlTY2FsZSh0YXNrLnV1aWQpKSArICcpJztcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuc3R5bGUoJ2ZpbGwnLCBjb25maWcuZXZlbnRMaW5lQ29sb3IpO1xuICAgICAgICBsaW5lU3ZnLnNlbGVjdEFsbCgnLml0ZW0nKS5yZW1vdmUoKTtcbiAgICAgICAgLy/lrrnlmahcbiAgICAgICAgdGFza2JveCA9IGxpbmVTdmdcbiAgICAgICAgICAgIC5hcHBlbmQoJ2cnKVxuICAgICAgICAgICAgLy8gLm9uKCdjbGljaycsIGNsaWNrSGFuZGxlcilcbiAgICAgICAgICAgIC5zdHlsZSgnZmlsbCcsIGNvbmZpZy5ldmVudENvbG9yKVxuICAgICAgICAgICAgLmF0dHIoJ2NsYXNzJywgXCJpdGVtXCIpXG4gICAgICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciB0cmFucyA9ICd0cmFuc2xhdGUoJyArICh4U2NhbGUodGFzay5zdGFydERhdGUpIC0gMCkgKyAnLCAnICsgc3RvbmVPZmZUb3AgKyAnKSc7XG4gICAgICAgICAgICAgICAgLy8gdmFyIHRyYW5zID0gJ3RyYW5zbGF0ZSgnICsgKHhTY2FsZSh0YXNrLmVuZERhdGUpIC0gMCkgKyAnLCAnICsgc3RvbmVPZmZUb3AgKyAnKSc7IC8v5bqU5Lqn5ZOB6KaB5rGCLOmHjOeoi+eikeaYvuekuuWcqOe7k+adn+aXtumXtOWkhExpdVxuICAgICAgICAgICAgICAgIHJldHVybiB0cmFucztcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuYXR0cignaGVpZ2h0JywgMjApO1xuXG4gICAgICAgIGlmICghY29uZmlnLnJlYWRvbmx5KSB7XG4gICAgICAgICAgICB0YXNrYm94Lm9uKCdjbGljaycsIGNsaWNrSGFuZGxlcikuY2FsbChkcmFnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBmaWxsQ29sb3IgPSBcIiMwY2NcIjtcbiAgICAgICAgLy8gaWYgKHRhc2suZW5kRGF0ZSA8IG5ldyBEYXRlKCkpIHtcbiAgICAgICAgLy8gICBmaWxsQ29sb3IgPSAnI2ZmNzc3ZCc7XG4gICAgICAgIC8vIH1cblxuICAgICAgICBiYWNrZ3JvdW5kID0gdGFza2JveC5hcHBlbmQoJ2cnKVxuICAgICAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ3RyYW5zbGF0ZSgxMCwgLTUpJ1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5hcHBlbmQoJ3JlY3QnKVxuICAgICAgICAgICAgLy8gLnN0eWxlKCdmaWxsJywgXCJ0cmFuc3BhcmVudFwiKVxuICAgICAgICAgICAgLnN0eWxlKCdmaWxsJywgdGFzay5kdWVPdXQgPyBcIiNmZjc3N2RcIiA6IFwidHJhbnNwYXJlbnRcIilcbiAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsIFwidGFzayBtYXJrZXJcIilcbiAgICAgICAgICAgIC5zdHlsZSgnZmlsbCcsIFwiIzBmMFwiKSAvLzZkZjNkMlxuICAgICAgICAgICAgLmF0dHIoJ3J4JywgMClcbiAgICAgICAgICAgIC5hdHRyKCdyeScsIDApXG4gICAgICAgICAgICAuYXR0cignc3Ryb2tlJywgXCIjYTBhMGEwXCIpXG4gICAgICAgICAgICAuYXR0cignc3Ryb2tlLXdpZHRoJywgMSlcbiAgICAgICAgICAgIC8vIC5hdHRyKCd0cmFuc2Zvcm0nLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vICAgcmV0dXJuICd0cmFuc2xhdGUoMTAwLCAxMyknXG4gICAgICAgICAgICAvLyB9KVxuICAgICAgICAgICAgLmF0dHIoJ2hlaWdodCcsIDE1KVxuICAgICAgICAgICAgLmF0dHIoJ3dpZHRoJywgMTUpO1xuXG4gICAgICAgIGlmICh0YXNrLnV1aWQgPT0gY29uZmlnLnNlbGVjdFRhc2tJZCkge1xuICAgICAgICAgICAgYXBwLnNlbGVjdFRhc2sodGFzay51dWlkKTtcbiAgICAgICAgICAgIG1lbnVGYWN0b3J5KGQzLCBhcHAsIGQzLnNlbGVjdCgnLnRhc2tzLXdyYXBwZXInKSwgdGFzayk7XG4gICAgICAgIH1cbiAgICAgICAgLypMSVUg6YeM56iL56KR5Lmf5pi+56S65Lu75Yqh5ZCN56ewKi9cbiAgICAgICAgaWYgKGNvbmZpZy5zaG93VGFza05hbWUpIHtcbiAgICAgICAgICAgIHRhc2tib3guYXBwZW5kKCd0ZXh0JylcbiAgICAgICAgICAgICAgICAudGV4dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhcHAuY29uZmlnLnRleHRGaXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhcHAuY29uZmlnLnRleHRGaXgodGFzaylcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0YXNrLm5hbWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJlbmRcIilcbiAgICAgICAgICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgeCA9IC0zMDsgLy8oeFNjYWxlKHRhc2suZW5kRGF0ZSkgLSB4U2NhbGUodGFzay5zdGFydERhdGUpKSArIDEwO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ3RyYW5zbGF0ZSgnICsgeCArICcsIDEwKSdcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICB9XG5cbiAgICB9O1xuXG5cbiAgICAvLyAvL+eUu+Wfuue6v1xuICAgIHZhciBzaG93T2xkVGFzayA9IGZ1bmN0aW9uICh0YXNrKSB7XG4gICAgICAgIC8vIHJldHVybiB0cnVlO1xuICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgICAgICB2YXIgY2xzID0gJy50YXNrLWxpbmUtJyArIHRhc2sudXVpZDtcbiAgICAgICAgdmFyIGxpbmVTdmcgPSB0YXNrc1dhcnBwZXIuc2VsZWN0KGNscyk7XG4gICAgICAgIGlmICh0YXNrLmJhc2VsaW5lU3RhcnREYXRlICYmIHRhc2suYmFzZWxpbmVFbmREYXRlKSB7XG4gICAgICAgICAgICB2YXIgb2xkVGFza0JveCA9IGxpbmVTdmdcbiAgICAgICAgICAgICAgICAuYXBwZW5kKCdnJylcbiAgICAgICAgICAgICAgICAuc3R5bGUoJ2ZpbGwnLCBjb25maWcuZXZlbnRDb2xvcilcbiAgICAgICAgICAgICAgICAuYXR0cignY2xhc3MnLCBcIm9sZC10YXNrIHByaW9yaXR5LVwiICsgdGFzay5wcmlvcml0eSlcbiAgICAgICAgICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ3RyYW5zbGF0ZSgnICsgKHhTY2FsZSh0YXNrLmJhc2VsaW5lU3RhcnREYXRlKSkgKyAnLCAwKSdcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5hdHRyKCdoZWlnaHQnLCAyMCk7XG4gICAgICAgICAgICB2YXIgb2xkID0gb2xkVGFza0JveC5hcHBlbmQoJ3JlY3QnKVxuICAgICAgICAgICAgICAgIC5zdHlsZSgnZmlsbCcsIFwiIzAwMFwiKVxuICAgICAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsIFwiYmFja2dyb3VuZFwiKVxuICAgICAgICAgICAgICAgIC5hdHRyKCdoZWlnaHQnLCA0KVxuICAgICAgICAgICAgICAgIC5hdHRyKCdzdHJva2UnLCBcIiMwMDBcIilcbiAgICAgICAgICAgICAgICAuYXR0cignc3Ryb2tlLXdpZHRoJywgMSlcbiAgICAgICAgICAgICAgICAuYXR0cignd2lkdGgnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAoeFNjYWxlKHRhc2suYmFzZWxpbmVFbmREYXRlKSAtIHhTY2FsZSh0YXNrLmJhc2VsaW5lU3RhcnREYXRlKSlcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOeUu+S7u+WKoeebuOWFs+eahOWKn+iDvVxuICAgICAqL1xuICAgIHZhciBkcmF3VGFzayA9IGZ1bmN0aW9uICh0YXNrKSB7XG4gICAgICAgIHZhciBpc3BrZyA9IHRhc2suY2hpbGRyZW4gJiYgdGFzay5jaGlsZHJlbi5sZW5ndGggPiAwO1xuXG4gICAgICAgIC8v6L2o6YGTXG4gICAgICAgIHZhciBsaW5lU3ZnID0gdGFza3NXYXJwcGVyXG4gICAgICAgICAgICAuYXBwZW5kKCdnJylcbiAgICAgICAgICAgIC5jbGFzc2VkKCdsaW5lJywgdHJ1ZSlcbiAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ3Rhc2stbGluZS0nICsgdGFzay51dWlkO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICd0cmFuc2xhdGUoMCwnICsgKHlTY2FsZSh0YXNrLnV1aWQpKSArICcpJztcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuc3R5bGUoJ2ZpbGwnLCBjb25maWcuZXZlbnRMaW5lQ29sb3IpO1xuICAgICAgICAvL+a4hei9qFxuICAgICAgICBsaW5lU3ZnLnNlbGVjdEFsbCgnLml0ZW0nKS5yZW1vdmUoKTtcbiAgICAgICAgLy/ku7vliqHlrrnlmahcbiAgICAgICAgdGFza2JveCA9IGxpbmVTdmdcbiAgICAgICAgICAgIC5hcHBlbmQoJ2cnKVxuICAgICAgICAgICAgLnN0eWxlKCdmaWxsJywgY29uZmlnLmV2ZW50Q29sb3IpXG4gICAgICAgICAgICAuYXR0cignY2xhc3MnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFwcC5jb25maWcuY2xhc3NGaXgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFwcC5jb25maWcuY2xhc3NGaXgodGFzaylcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJpdGVtXCJcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmF0dHIoXCJzdHJva2UtZGFzaGFycmF5XCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRhc2suZGFzaGFycmF5KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnNSwgNSdcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNsYXNzZWQoXCJwYWNrYWdlXCIsIGlzcGtnKVxuICAgICAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgb2ZmVG9wID0gaXNwa2cgPyBwYWNrYWdlT2ZmVG9wIDogdGFza09mZlRvcDtcbiAgICAgICAgICAgICAgICB2YXIgdHJhbnMgPSAndHJhbnNsYXRlKCcgKyB4U2NhbGUodGFzay5zdGFydERhdGUpICsgJywgJyArIG9mZlRvcCArICcpJztcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJhbnM7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmF0dHIoJ2hlaWdodCcsIDIwKTtcblxuXG4gICAgICAgIHZhciBmaWxsQ29sb3IgPSBcIiMwY2NcIjtcbiAgICAgICAgaWYgKHRhc2suZW5kRGF0ZSA8IG5ldyBEYXRlKCkpIHtcbiAgICAgICAgICAgIGZpbGxDb2xvciA9ICcjZmY3NzdkJztcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBoZWlnaHQgPSBpc3BrZyA/IHBhY2thZ2VIZWlnaHQgOiB0YXNrSGVpZ2h0O1xuICAgICAgICB2YXIgc3Ryb2tlID0gaXNwa2cgPyAncmVkJyA6IFwiIzY2NjY2NlwiO1xuICAgICAgICBiYWNrZ3JvdW5kID0gdGFza2JveC5hcHBlbmQoJ3JlY3QnKVxuICAgICAgICAvLyAuc3R5bGUoJ2ZpbGwnLCB0YXNrLmR1ZU91dCA/IFwiI2ZmNzc3ZFwiIDogXCJ0cmFuc3BhcmVudFwiKVxuICAgICAgICAgICAgLmF0dHIoJ2NsYXNzJywgXCJ0YXNrIGJhY2tncm91bmRcIilcbiAgICAgICAgICAgIC5hdHRyKCdoZWlnaHQnLCBoZWlnaHQpXG4gICAgICAgICAgICAvLyAuYXR0cignc3Ryb2tlJywgdGFzay5kdWVPdXQgPyBcIiNmZjAwMDBcIiA6IHN0cm9rZSlcbiAgICAgICAgICAgIC5hdHRyKCdzdHJva2Utd2lkdGgnLCAxKVxuICAgICAgICAgICAgLmF0dHIoJ3dpZHRoJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBNYXRoLm1heCgoeFNjYWxlKHRhc2suZW5kRGF0ZSkgLSB4U2NhbGUodGFzay5zdGFydERhdGUpKSwgNSlcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIHByZSA9IHRhc2tib3guYXBwZW5kKCdyZWN0JylcbiAgICAgICAgICAgIC5zdHlsZSgnZmlsbCcsIFwiIzZkZjNkMlwiKVxuICAgICAgICAgICAgLmF0dHIoJ3N0cm9rZScsIHN0cm9rZSlcbiAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsIFwidGFzayBwcmVcIilcbiAgICAgICAgICAgIC5hdHRyKCdoZWlnaHQnLCBoZWlnaHQgLSAxKVxuICAgICAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoMSwgMSknKVxuICAgICAgICAgICAgLmF0dHIoJ3N0cm9rZS13aWR0aCcsIDApXG4gICAgICAgICAgICAuYXR0cignd2lkdGgnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHcgPSB4U2NhbGUodGFzay5lbmREYXRlKSAtIHhTY2FsZSh0YXNrLnN0YXJ0RGF0ZSkgLSAxO1xuXG4gICAgICAgICAgICAgICAgaWYgKHcgPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHcgPSA1O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdyAqIHRhc2sucGVyY2VudCB8fCAwO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gdGFza2JveC5hcHBlbmQoXCJjaXJjbGVcIilcbiAgICAgICAgLy8gICAuYXR0cignY2xhc3MnLCAnZ2hvc3RDaXJjbGUnKVxuICAgICAgICAvLyAgIC5hdHRyKFwiclwiLCAzMClcbiAgICAgICAgLy8gICAuYXR0cihcIm9wYWNpdHlcIiwgMC4yKSAvLyBjaGFuZ2UgdGhpcyB0byB6ZXJvIHRvIGhpZGUgdGhlIHRhcmdldCBhcmVhXG4gICAgICAgIC8vICAgLnN0eWxlKFwiZmlsbFwiLCBcInJlZFwiKVxuICAgICAgICAvLyAgIC5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKDAsIDcpJylcbiAgICAgICAgLy8gICAuYXR0cigncG9pbnRlci1ldmVudHMnLCAnbW91c2VvdmVyJylcbiAgICAgICAgLy8gICAub24oXCJtb3VzZW92ZXJcIiwgZnVuY3Rpb24obm9kZSkge1xuICAgICAgICAvLyAgICAgYXBwLnNlbGVjdGVkTm9kZSA9IG5vZGU7XG4gICAgICAgIC8vICAgICBhcHAudXBkYXRlVGVtcENvbm5lY3RvcigpO1xuICAgICAgICAvLyAgIH0pXG4gICAgICAgIC8vICAgLm9uKFwibW91c2VvdXRcIiwgZnVuY3Rpb24obm9kZSkge1xuICAgICAgICAvLyAgICAgYXBwLnNlbGVjdGVkTm9kZSA9IG51bGw7XG4gICAgICAgIC8vICAgICBhcHAudXBkYXRlVGVtcENvbm5lY3RvcigpO1xuICAgICAgICAvLyAgIH0pO1xuXG5cbiAgICAgICAgLy8gdGFza2JveC5hcHBlbmQoXCJjaXJjbGVcIilcbiAgICAgICAgLy8gICAuYXR0cignY2xhc3MnLCAnZ2hvc3RDaXJjbGUnKVxuICAgICAgICAvLyAgIC5hdHRyKFwiclwiLCAzMClcbiAgICAgICAgLy8gICAuYXR0cihcIm9wYWNpdHlcIiwgMC4yKSAvLyBjaGFuZ2UgdGhpcyB0byB6ZXJvIHRvIGhpZGUgdGhlIHRhcmdldCBhcmVhXG4gICAgICAgIC8vICAgLnN0eWxlKFwiZmlsbFwiLCBcInJlZFwiKVxuICAgICAgICAvLyAgIC5hdHRyKCd0cmFuc2Zvcm0nLCBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gICAgIHZhciB4ID0gKHhTY2FsZSh0YXNrLmVuZERhdGUpIC0geFNjYWxlKHRhc2suc3RhcnREYXRlKSk7XG4gICAgICAgIC8vICAgICByZXR1cm4gJ3RyYW5zbGF0ZSgnICsgeCArICcsIDcpJztcbiAgICAgICAgLy8gICB9KVxuICAgICAgICAvLyAgIC5hdHRyKCdwb2ludGVyLWV2ZW50cycsICdtb3VzZW92ZXInKVxuICAgICAgICAvLyAgIC5vbihcIm1vdXNlb3ZlclwiLCBmdW5jdGlvbihub2RlLCB4KSB7XG4gICAgICAgIC8vICAgICBjb25zb2xlLmxvZyh4KTtcbiAgICAgICAgLy8gICAgIGFwcC5zZWxlY3RlZE5vZGUgPSBub2RlO1xuICAgICAgICAvLyAgICAgYXBwLnVwZGF0ZVRlbXBDb25uZWN0b3IoKTtcbiAgICAgICAgLy8gICB9KVxuICAgICAgICAvLyAgIC5vbihcIm1vdXNlb3V0XCIsIGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgLy8gICAgIGFwcC5zZWxlY3RlZE5vZGUgPSBudWxsO1xuICAgICAgICAvLyAgICAgYXBwLnVwZGF0ZVRlbXBDb25uZWN0b3IoKTtcbiAgICAgICAgLy8gICB9KTtcblxuICAgICAgICAvL+WGs+WumueUu+eItuS7u+WKoei/mOaYr+WtkOS7u+WKoVxuICAgICAgICBpZiAoaXNwa2cpIHtcbiAgICAgICAgICAgIHZhciB3ID0geFNjYWxlKHRhc2suZW5kRGF0ZSkgLSB4U2NhbGUodGFzay5zdGFydERhdGUpICsgMTtcbiAgICAgICAgICAgIHZhciBwdyA9IHcgKiB0YXNrLnBlcmNlbnQgfHwgMDtcbiAgICAgICAgICAgIHZhciBiZ0NvbG9yID0gdGFzay5kdWVPdXQgPyBcIiNmZjc3N2RcIiA6IFwidHJhbnNwYXJlbnRcIjtcbiAgICAgICAgICAgIHRhc2tib3guYXBwZW5kKCdwb2x5bGluZScpXG4gICAgICAgICAgICAgICAgLmF0dHIoJ3N0cm9rZScsICdyZWQnKVxuICAgICAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsIFwiZGVjb3JhdGlvblwiKVxuICAgICAgICAgICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCBcInRyYW5zbGF0ZSgwLCBcIiArIHBhY2thZ2VIZWlnaHQgKyBcIilcIilcbiAgICAgICAgICAgICAgICAuYXR0cigncG9pbnRzJywgJzAsMCAnICsgKHcgLSAxKSArICcsMCAnICsgKHcgLSAxKSArICcsOCAnICsgKHcgLVxuICAgICAgICAgICAgICAgICAgICA1KSArICcsMCA1LDAgMCw4IDAsMCcpXG4gICAgICAgICAgICAgICAgLmF0dHIoJ3N0eWxlJywgJ2ZpbGw6cmVkO3N0cm9rZS13aWR0aDowJyk7XG5cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRhc2tib3gub24oJ21vdXNlb3ZlcicsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAvLyAvLy8vY29uc29sZS5sb2coZDMuZXZlbnQudGFyZ2V0KTtcbiAgICAgICAgICAgICAgICB3aW5kb3cubyA9IGQzLmV2ZW50LnRhcmdldDtcbiAgICAgICAgICAgICAgICBpZiAoZDMuZXZlbnQgJiYgZDMuZXZlbnQuYnV0dG9ucyAhPSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIGlzVGJ4ID0gby50YWdOYW1lID09ICdyZWN0JztcbiAgICAgICAgICAgICAgICBpZiAoaXNUYngpIHtcbiAgICAgICAgICAgICAgICAgICAgYXBwLmNoYW5nZVByaW9yaXR5ID0gY2hhbmdlUHJpb3JpdHk7XG4gICAgICAgICAgICAgICAgICAgIGFwcC5jaGFuZ2VTdGFydFRpbWUgPSBjaGFuZ2VTdGFydFRpbWU7XG4gICAgICAgICAgICAgICAgICAgIGFwcC5jaGFuZ2VQZXJjZW50ID0gY2hhbmdlUGVyY2VudDtcbiAgICAgICAgICAgICAgICAgICAgYXBwLmNoYW5nZUVuZFRpbWUgPSBjaGFuZ2VFbmRUaW1lO1xuICAgICAgICAgICAgICAgICAgICBhcHAuZHJhd1Rhc2sgPSBpbml0O1xuICAgICAgICAgICAgICAgICAgICBtZW51RmFjdG9yeShkMywgYXBwLCBkMy5zZWxlY3QoJy50YXNrcy13cmFwcGVyJyksIHRhc2spO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIC8v5aKe5Yqg5LqL5Lu26ZSB5a6aXG4gICAgICAgIGlmICghY29uZmlnLnJlYWRvbmx5ICYmICFpc3BrZykge1xuICAgICAgICAgICAgdGFza2JveC5vbignY2xpY2snLCBjbGlja0hhbmRsZXIpLmNhbGwoZHJhZyk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gfVxuXG5cbiAgICAgICAgLy/lpoLmnpzpgYfkuIrmmK/pgInkuK3nmoTku7vliqHvvIznlLvkuIrlm77og4zmma9cbiAgICAgICAgaWYgKHRhc2sudXVpZCA9PSBjb25maWcuc2VsZWN0VGFza0lkKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygn5pyJ5LiA5Liq6YCJ5Lit55qE5Lu75Yqh77yaJyArIHRhc2sudXVpZCk7XG4gICAgICAgICAgICBhcHAuc2VsZWN0VGFzayh0YXNrLnV1aWQpO1xuICAgICAgICAgICAgbWVudUZhY3RvcnkoZDMsIGFwcCwgZDMuc2VsZWN0KCcudGFza3Mtd3JhcHBlcicpLCB0YXNrKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8v5Yaz5a6a5piv5LiN5piv6KaB5pi+56S65Lu75Yqh5ZCN56ewXG4gICAgICAgIGlmIChjb25maWcuc2hvd1Rhc2tOYW1lKSB7XG4gICAgICAgICAgICB0YXNrYm94LmFwcGVuZCgndGV4dCcpXG4gICAgICAgICAgICAgICAgLnRleHQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoYXBwLmNvbmZpZy50ZXh0Rml4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXBwLmNvbmZpZy50ZXh0Rml4KHRhc2spXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGFzay5uYW1lO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwiZW5kXCIpXG4gICAgICAgICAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHggPSAtMzA7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAndHJhbnNsYXRlKCcgKyB4ICsgJywgMTApJ1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLy/nlLvku7vliqFcbiAgICByZXR1cm4gaW5pdCh0YXNrKTtcbn07IiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgXyA9IHJlcXVpcmUoJ3VuZGVyc2NvcmUnKTtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZDMsIGFwcCwgdGFzaykge1xuXG4gIHZhciBmb3JtYXRlciA9IGQzLnRpbWUuZm9ybWF0KFwiJVktJW0tJWQgJUhcIik7XG5cbiAgdmFyIGVtID0ge1xuICAgIHV1aWQ6ICcnLFxuICAgIG5hbWU6ICcnLFxuICAgIGNoaWxkcmVuOiBbXSxcbiAgICBwYXJlbnQ6IG51bGwsXG4gICAgcGFyZW50SWQ6ICcnLFxuICAgIHN0YXR1czogJycsXG4gICAgc3RhcnREYXRlOiBudWxsLFxuICAgIGVuZERhdGU6IG51bGwsXG4gICAgYmFzZWxpbmVTdGFydERhdGU6IG51bGwsXG4gICAgYmFzZWxpbmVFbmREYXRlOiBudWxsLFxuICAgIG1hcmtlcjogZmFsc2UsXG4gICAgZnJvbTogW10sIC8v5oiR5Y+X5ZOq5Lqb5Lu75Yqh55qE5b2x5ZONXG4gICAgdG86IFtdLCAvL+aIkeiDveW9seWTjeWTquS6m+S7u+WKoVxuICAgIGdldE5hbWU6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMubmFtZTtcbiAgICB9LFxuICAgIG1vdmU6IGZ1bmN0aW9uKHNlY29uZCkge1xuICAgICAgLy8gY29uc29sZS5sb2coJ21vdmUnKTtcbiAgICAgIHZhciBzdGFydCA9IGZvcm1hdGVyKHRoaXMuc3RhcnREYXRlKTtcbiAgICAgIGlmICh0aGlzLnN0YXJ0RGF0ZS5nZXRUaW1lKCkpIHtcbiAgICAgICAgLy8gbWUuZHJhdygpO1xuICAgICAgfVxuICAgICAgaWYgKGFwcC5jb3VudCAmJiBhcHAuY291bnQgPiAxMDAwKSB7XG4gICAgICAgIC8vIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIC8vIGFwcC5jb3VudCA9IGFwcC5jb3VudCB8fCAwO1xuICAgICAgLy8gYXBwLmNvdW50Kys7XG4gICAgICAvLyBjb25zb2xlLmxvZyhhcHAuY291bnQgKyBcIj09PVwiICsgdGhpcy51dWlkKTtcbiAgICAgIHZhciBtZSA9IHRoaXM7XG4gICAgICB2YXIgbGVuID0gdGhpcy5lbmREYXRlLmdldFRpbWUoKSAtIHRoaXMuc3RhcnREYXRlLmdldFRpbWUoKTtcbiAgICAgIHZhciBzdGFydERhdGUgPSBkMy50aW1lLnNlY29uZC5vZmZzZXQodGhpcy5zdGFydERhdGUsIC1zZWNvbmQpO1xuICAgICAgdmFyIGVuZERhdGUgPSBkMy50aW1lLnNlY29uZC5vZmZzZXQodGhpcy5lbmREYXRlLCAtc2Vjb25kKTtcbiAgICAgIHRoaXMuX3N0YXJ0VGltZSA9IHRoaXMuX3N0YXJ0VGltZSB8fCAwO1xuICAgICAgLy8gdGhpcy5fc3RhcnRUaW1lID0gTWF0aC5tYXgodGhpcy5fc3RhcnRUaW1lLCBzdGFydERhdGUuZ2V0VGltZSgpKTtcbiAgICAgIHRoaXMuX3N0YXJ0VGltZSA9IHN0YXJ0RGF0ZS5nZXRUaW1lKCk7XG4gICAgICB0aGlzLnN0YXJ0RGF0ZSA9IG5ldyBEYXRlKHRoaXMuX3N0YXJ0VGltZSk7XG4gICAgICB0aGlzLmVuZERhdGUgPSBuZXcgRGF0ZSh0aGlzLl9zdGFydFRpbWUgKyBsZW4pO1xuXG4gICAgICAvLyB0aGlzLmZyb20gPSBfLnVuaXEodGhpcy5mcm9tKTtcbiAgICAgIC8vIHRoaXMudG8gPSBfLnVuaXEodGhpcy50byk7XG4gICAgICAvLyAvLyBjb25zb2xlLmxvZyh0aGlzLm5hbWUgKyBcInNlY29uZDpcIiArIChzZWNvbmQgLyA2MCAvIDYwKSArIFwiXFx0IOWIneWni1wiICsgc3RhcnQgKyBcIlxcdCDkuYvlkI5cIiArIGZvcm1hdGVyKHRoaXMuc3RhcnREYXRlKSk7XG4gICAgICAvLyBfLmVhY2godGhpcy50bywgZnVuY3Rpb24odCkge1xuICAgICAgLy8gICAvLyBjb25zb2xlLmxvZyhhcHAuY29uZmlnKTtcbiAgICAgIC8vICAgdmFyIHRvVGFzayA9IGFwcC5jb25maWcudGFza01hcHNbdF07XG4gICAgICAvLyAgIHZhciBvZmZzZXQgPSAodG9UYXNrLnN0YXJ0RGF0ZS5nZXRUaW1lKCkgLSBtZS5lbmREYXRlLmdldFRpbWUoKSkgLyAxMDAwO1xuICAgICAgLy8gICAvLyBjb25zb2xlLmxvZyhcInNlY29uZDpcIiArIChvZmZzZXQgLyA2MCAvIDYwKSArIFwiXFx0IOWInVwiICsgdG9UYXNrLnV1aWQgKyBcInxcIiArIGZvcm1hdGVyKHRvVGFzay5zdGFydERhdGUpICsgXCJcXHQg5LmLXCIgKyBtZS51dWlkICsgXCJ8XCIgKyBmb3JtYXRlcihtZS5lbmREYXRlKSk7XG5cbiAgICAgIC8vICAgdG9UYXNrLm1vdmUob2Zmc2V0KTtcbiAgICAgIC8vIH0pO1xuICAgICAgLy8gXy5lYWNoKHRoaXMuZnJvbSwgZnVuY3Rpb24oZikge1xuXG4gICAgICAvLyB9KVxuICAgIH0sXG4gICAgY2FsVGltZTogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLmZyb20gPSBfLnVuaXEodGhpcy5mcm9tKTtcbiAgICAgIF8uZWFjaCh0aGlzLmZyb20sIGZ1bmN0aW9uKGYpIHtcblxuICAgICAgfSlcbiAgICB9LFxuICAgIGlzUGFyZW50OiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLmNoaWxkcmVuICYmIHRoaXMuY2hpbGRyZW4ubGVuZ3RoID4gMDtcbiAgICB9LFxuICAgIGlzTWFya2VyOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLm1hcmtlcjtcbiAgICB9LFxuICAgIGdldFBhdGg6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHBhdGggPSBbXTtcbiAgICAgIHBhdGgucHVzaCh0aGlzLnV1aWQpO1xuICAgICAgdmFyIG8gPSB0aGlzLnBhcmVudDtcbiAgICAgIGlmIChvKSB7XG4gICAgICAgIHBhdGgucHVzaChvLnV1aWQpO1xuICAgICAgICB3aGlsZSAoby5wYXJlbnQpIHtcbiAgICAgICAgICBwYXRoLnB1c2goby5wYXJlbnQudXVpZCk7XG4gICAgICAgICAgbyA9IG8ucGFyZW50O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gcGF0aC5qb2luKFwiL1wiKTtcbiAgICB9XG4gIH1cblxuICB2YXIgaW5pdCA9IGZ1bmN0aW9uKHRhc2spIHtcbiAgICB0YXNrID0gZW0gPSBfLmV4dGVuZChlbSwgdGFzayk7XG4gICAgYXBwLmNvbmZpZy50YXNrTWFwc1t0YXNrLnV1aWRdID0gdGFzaztcbiAgICByZXR1cm4gdGFzaztcbiAgfVxuXG4gIC8v55S75Lu75YqhXG4gIHJldHVybiBpbml0KHRhc2spO1xufTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNvbmZpZ3VyYWJsZSh0YXJnZXRGdW5jdGlvbiwgY29uZmlnLCBsaXN0ZW5lcnMpIHtcbiAgbGlzdGVuZXJzID0gbGlzdGVuZXJzIHx8IHt9O1xuICBmb3IgKHZhciBpdGVtIGluIGNvbmZpZykge1xuICAgIChmdW5jdGlvbihpdGVtKSB7XG4gICAgICB0YXJnZXRGdW5jdGlvbltpdGVtXSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIGNvbmZpZ1tpdGVtXTtcbiAgICAgICAgY29uZmlnW2l0ZW1dID0gdmFsdWU7XG4gICAgICAgIGlmIChsaXN0ZW5lcnMuaGFzT3duUHJvcGVydHkoaXRlbSkpIHtcbiAgICAgICAgICBsaXN0ZW5lcnNbaXRlbV0odmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0YXJnZXRGdW5jdGlvbjtcbiAgICAgIH07XG4gICAgfSkoaXRlbSk7IC8vIGZvciBkb2Vzbid0IGNyZWF0ZSBhIGNsb3N1cmUsIGZvcmNpbmcgaXRcbiAgfVxufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZDMsIGFwcCwgZG9tRWwsIHdoZXJlKSB7XG4gIHZhciB4QXhpcyA9IHt9O1xuICB2YXIgeEF4aXNFbHMgPSB7fTtcbiAgdmFyIGZvcm1hdGVyID0gZDMudGltZS5mb3JtYXQoXCIlWS0lbS0lZCAlSDolTTolU1wiKVxuICB2YXIgc3QgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgdmFyIGNvbmZpZyA9IGFwcC5jb25maWc7XG4gIHZhciB4U2NhbGUgPSBhcHAueFNjYWxlO1xuICB2YXIgem9vbSA9IGFwcC56b29tO1xuICAvLyDliJ3lp4vljJbog4zlvbFcbiAgdmFyIG15Y2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJhcHAtd3JhcHBlci1iZ1wiKTtcbiAgdmFyIG15Y29udGV4dCA9IG15Y2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gIG15Y29udGV4dC5jbGVhclJlY3QoMCwgMCwgbXljYW52YXMud2lkdGgsIG15Y2FudmFzLmhlaWdodCk7XG5cbiAgdmFyIHRpY2tGb3JtYXREYXRhID0gW107XG4gIGNvbmZpZy50aWNrRm9ybWF0LmZvckVhY2goZnVuY3Rpb24oaXRlbSkge1xuICAgIHZhciB0aWNrID0gaXRlbS5zbGljZSgwKTtcbiAgICB0aWNrRm9ybWF0RGF0YS5wdXNoKHRpY2spO1xuICB9KTtcblxuICB2YXIgdGlja0Zvcm1hdCA9IGNvbmZpZy5sb2NhbGUgPyBjb25maWcubG9jYWxlLnRpbWVGb3JtYXQubXVsdGkodGlja0Zvcm1hdERhdGEpIDogZDMudGltZS5mb3JtYXQubXVsdGkodGlja0Zvcm1hdERhdGEpO1xuXG4gIHhBeGlzW3doZXJlXSA9IGQzLnN2Zy5heGlzKClcbiAgICAuc2NhbGUoeFNjYWxlKVxuICAgIC5vcmllbnQod2hlcmUpXG4gICAgLnRpY2tzKGNvbmZpZy5zdGVwKVxuICAgIC50aWNrRm9ybWF0KHRpY2tGb3JtYXQpO1xuXG4gIC8vIHZhciB6b29tID0gY29uZmlnLnpvb207XG4gIGRvbUVsLnNlbGVjdEFsbCgnLnhBeGlzJykucmVtb3ZlKCk7XG4gIHZhciBtYWluQm94ID0gZG9tRWwuYXBwZW5kKCdnJykuY2xhc3NlZCgneEF4aXMnLCB0cnVlKTtcbiAgZG9tRWwuc2VsZWN0QWxsKCcueFN1YkF4aXMnKS5yZW1vdmUoKTtcbiAgdmFyIHN1YkJveCA9IGRvbUVsLmFwcGVuZCgnZycpLmNsYXNzZWQoJ3hTdWJBeGlzJywgdHJ1ZSk7XG4gIFxuICB2YXIgZG9tYWluID0geFNjYWxlLmRvbWFpbigpO1xuICB2YXIgem9vbVNjYWxlID0gem9vbS5zY2FsZSgpO1xuXG4gIC8qKlxuICAgKiDlt6Xlhbflh73mlbDvvJrnlLvkuIDmnaHnur9cbiAgICovXG4gIHZhciBkcmF3TGluZSA9IGZ1bmN0aW9uKGRvdFhZLCBvcHMpIHtcbiAgICBteWNvbnRleHQuYmVnaW5QYXRoKCk7XG4gICAgZm9yICh2YXIgYXR0IGluIG9wcykgbXljb250ZXh0W2F0dF0gPSBvcHNbYXR0XTtcbiAgICBkb3RYWSA9IGRvdFhZLmNvbnN0cnVjdG9yID09IE9iamVjdCA/IFtkb3RYWSB8fCB7XG4gICAgICB4OiAwLFxuICAgICAgeTogMFxuICAgIH1dIDogZG90WFk7XG4gICAgbXljb250ZXh0Lm1vdmVUbyhkb3RYWVswXS54LCBkb3RYWVswXS55KTtcbiAgICBmb3IgKHZhciBpID0gMSwgbGVuID0gZG90WFkubGVuZ3RoOyBpIDwgbGVuOyBpKyspIG15Y29udGV4dC5saW5lVG8oZG90WFlbaV0ueCwgZG90WFlbaV0ueSk7XG4gICAgbXljb250ZXh0LnN0cm9rZSgpO1xuICB9O1xuXG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgdmFyIGRyYXdZZWFyRWwgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgc3RhcnQgPSBkMy50aW1lLnllYXIub2Zmc2V0KGRvbWFpblswXSwgLTUpO1xuICAgIHZhciBlbmQgPSBkMy50aW1lLnllYXIub2Zmc2V0KGRvbWFpblsxXSwgNSk7XG4gICAgdmFyIG1vbnRocyA9IGQzLnRpbWUueWVhcnMoc3RhcnQsIGVuZCk7XG5cbiAgICB2YXIgeEF4aXMgPSBudWxsLFxuICAgICAgbW9udGhXaWR0aCA9IDA7XG4gICAgeEF4aXMgPSBtYWluQm94LnNlbGVjdEFsbCgnZycpLmRhdGEobW9udGhzKTtcbiAgICB2YXIgbyA9IHhBeGlzLmVudGVyKClcbiAgICAgIC5hcHBlbmQoJ2cnKVxuICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuICd0cmFuc2xhdGUoJyArICh4U2NhbGUoZCkpICsgJywwKSc7XG4gICAgICB9KVxuXG4gICAgby5hcHBlbmQoJ3JlY3QnKVxuICAgICAgLmF0dHIoJ3dpZHRoJywgZnVuY3Rpb24oZCkge1xuICAgICAgICB2YXIgbmV4dCA9IGQzLnRpbWUueWVhci5vZmZzZXQoZCwgMSk7XG4gICAgICAgIG5leHQgPSBkMy50aW1lLnllYXIobmV4dCk7XG4gICAgICAgIG1vbnRoV2lkdGggPSB4U2NhbGUobmV4dCkgLSB4U2NhbGUoZCk7XG4gICAgICAgIHJldHVybiBtb250aFdpZHRoIC0gMTtcbiAgICAgIH0pXG4gICAgICAuYXR0cignZmlsbCcsICcjZjlmOWY5JylcbiAgICAgIC5hdHRyKCdoZWlnaHQnLCAyMClcblxuICAgIG8uYXBwZW5kKCd0ZXh0JylcbiAgICAgIC5hdHRyKFwiZHhcIiwgMTApXG4gICAgICAuYXR0cihcImR5XCIsIDEzKVxuICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gJ3RyYW5zbGF0ZSgnICsgKG1vbnRoV2lkdGggLyAyIC0gNDApICsgJywgMCknO1xuICAgICAgfSlcbiAgICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgd2luZG93LmQgPSBkO1xuICAgICAgICByZXR1cm4gZC5nZXRGdWxsWWVhcigpICsgJ+W5tCc7XG4gICAgICB9KTtcblxuICAgIHhBeGlzLmV4aXQoKS5yZW1vdmUoKTtcbiAgfVxuXG4gIHZhciBkcmF3TW9udGhFbCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzdGFydCA9IGQzLnRpbWUuZGF5Lm9mZnNldChkb21haW5bMF0sIC0zMCk7XG4gICAgdmFyIGVuZCA9IGQzLnRpbWUuZGF5Lm9mZnNldChkb21haW5bMV0sIDMwKTtcbiAgICB2YXIgbW9udGhzID0gZDMudGltZS5tb250aHMoc3RhcnQsIGVuZCk7XG5cbiAgICB2YXIgeEF4aXMgPSBudWxsLFxuICAgICAgbW9udGhXaWR0aCA9IDA7XG4gICAgeEF4aXMgPSBtYWluQm94LnNlbGVjdEFsbCgnZycpLmRhdGEobW9udGhzKTtcblxuICAgIHZhciBvID0geEF4aXMuZW50ZXIoKVxuICAgICAgLmFwcGVuZCgnZycpXG4gICAgICAuYXR0cigndHJhbnNmb3JtJywgZnVuY3Rpb24oZCkge1xuICAgICAgICByZXR1cm4gJ3RyYW5zbGF0ZSgnICsgKHhTY2FsZShkKSkgKyAnLDApJztcbiAgICAgIH0pXG5cbiAgICBvLmFwcGVuZCgncmVjdCcpXG4gICAgICAuYXR0cignd2lkdGgnLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIHZhciBuZXh0ID0gZDMudGltZS5kYXkub2Zmc2V0KGQsIDMxKTtcbiAgICAgICAgbmV4dCA9IGQzLnRpbWUubW9udGgobmV4dCk7XG4gICAgICAgIG1vbnRoV2lkdGggPSB4U2NhbGUobmV4dCkgLSB4U2NhbGUoZCk7XG4gICAgICAgIHJldHVybiBtb250aFdpZHRoO1xuICAgICAgfSlcbiAgICAgIC5hdHRyKCdmaWxsJywgJyNmOWY5ZjknKVxuICAgICAgLmF0dHIoJ3N0cm9rZScsICcjRDJEMUQxJylcbiAgICAgIC5hdHRyKCdzdHJva2Utd2lkdGgnLCAnMScpXG4gICAgICAuYXR0cignc2hhcGUtcmVuZGVyaW5nJywgJ2NyaXNwRWRnZXMnKVxuICAgICAgLmF0dHIoJ2hlaWdodCcsIDIwKVxuXG4gICAgby5hcHBlbmQoJ3RleHQnKVxuICAgICAgLmF0dHIoXCJkeFwiLCAxMClcbiAgICAgIC5hdHRyKFwiZHlcIiwgMTMpXG4gICAgICAuYXR0cigndHJhbnNmb3JtJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiAndHJhbnNsYXRlKCcgKyAobW9udGhXaWR0aCAvIDIgLSA0MCkgKyAnLCAwKSc7XG4gICAgICB9KVxuICAgICAgLnRleHQoZnVuY3Rpb24oZCkge1xuICAgICAgICB3aW5kb3cuZCA9IGQ7XG4gICAgICAgIHJldHVybiBkLmdldEZ1bGxZZWFyKCkgKyAn5bm0JyArIChkLmdldE1vbnRoKCkgKyAxKSArICfmnIgnO1xuICAgICAgfSk7XG5cbiAgICB4QXhpcy5leGl0KCkucmVtb3ZlKCk7XG4gIH1cblxuXG5cbiAgLy8vLy8vL1xuXG5cbiAgdmFyIGRyYXdEYXlNb2RlbCA9IGZ1bmN0aW9uKCkge1xuICAgIGRyYXdNb250aEVsKCk7XG5cbiAgICB2YXIgc3RhcnQgPSBkMy50aW1lLmRheS5vZmZzZXQoZG9tYWluWzBdLCAtNyk7XG4gICAgdmFyIGVuZCA9IGQzLnRpbWUuZGF5Lm9mZnNldChkb21haW5bMV0sICs3KTtcbiAgICB2YXIgZGF5cyA9IGQzLnRpbWUuZGF5cyhzdGFydCwgZW5kKTtcbiAgICB2YXIgeFN1YkF4aXMgPSBzdWJCb3guc2VsZWN0QWxsKCdnJykuZGF0YShkYXlzKTtcblxuICAgIHZhciBvID0geFN1YkF4aXMuZW50ZXIoKVxuICAgICAgLmFwcGVuZCgnZycpXG4gICAgICAuYXR0cignY2xhc3MnLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIHZhciBkYXkgPSBkLmdldERheSgpO1xuICAgICAgICB2YXIgcmVzdWx0ID0gJyc7XG4gICAgICAgIGlmIChkYXkgPT0gMCB8fCBkYXkgPT0gNikge1xuICAgICAgICAgIHJlc3VsdCA9ICdkIGgnXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzdWx0ID0gJ2QnXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH0pXG4gICAgICAuYXR0cigndHJhbnNmb3JtJywgZnVuY3Rpb24oZCkge1xuICAgICAgICB2YXIgZHggPSBkMy50aW1lLmRheS5vZmZzZXQoZCwgMCk7XG4gICAgICAgIHJldHVybiAndHJhbnNsYXRlKCcgKyAoeFNjYWxlKGR4KSkgKyAnLDApJztcbiAgICAgIH0pO1xuXG4gICAgby5hcHBlbmQoJ3JlY3QnKVxuICAgICAgLmF0dHIoJ3dpZHRoJywgZnVuY3Rpb24oZCkge1xuICAgICAgICB2YXIgZHggPSBkMy50aW1lLmRheS5vZmZzZXQoZCwgMSk7XG4gICAgICAgIHJldHVybiB4U2NhbGUoZHgpIC0geFNjYWxlKGQpO1xuICAgICAgfSlcbiAgICAgIC5hdHRyKCdzdHJva2UnLCAnI0QyRDFEMScpXG4gICAgICAuYXR0cignc3Ryb2tlLXdpZHRoJywgJzEnKVxuICAgICAgLmF0dHIoJ3NoYXBlLXJlbmRlcmluZycsICdjcmlzcEVkZ2VzJylcbiAgICAgIC5hdHRyKCdoZWlnaHQnLCAyMClcblxuICAgIG8uYXBwZW5kKCd0ZXh0JylcbiAgICAgIC5hdHRyKFwiZHhcIiwgMTApXG4gICAgICAuYXR0cihcImR5XCIsIDEzKVxuICAgICAgLnRleHQoZnVuY3Rpb24oZCkge1xuICAgICAgICByZXR1cm4gZC5nZXREYXRlKCk7XG4gICAgICB9KTtcblxuICAgIHhTdWJBeGlzLmV4aXQoKS5yZW1vdmUoKTtcbiAgICAvLyDlpKfog4zlvbHlkajmnKvnu5jliLZcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRheXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBkYXkgPSBkYXlzW2ldO1xuICAgICAgdmFyIHgxID0geFNjYWxlKGRheSk7XG4gICAgICB2YXIgbmV4dCA9IGQzLnRpbWUuZGF5Lm9mZnNldChkYXksIDEpO1xuICAgICAgdmFyIHgyID0geFNjYWxlKG5leHQpIC0geFNjYWxlKGRheSkgLSAwO1xuICAgICAgeDEgPSBNYXRoLnJvdW5kKHgxKSArIDAuNTtcbiAgICAgIHZhciBkYXkgPSBkYXkuZ2V0RGF5KCk7XG4gICAgICB2YXIgcmVzdWx0ID0gJyc7XG4gICAgICBpZiAoZGF5ID09IDAgfHwgZGF5ID09IDYpIHtcbiAgICAgICAgbXljb250ZXh0LmZpbGxTdHlsZSA9ICcjZjRmOWZmJzsgLy9MaXXmjaLpopzoibJcbiAgICAgICAgbXljb250ZXh0LmZpbGxSZWN0KHgxLCAwLCB4MiwgMTAwMCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgdmFyIGRyYXdXZWVrTW9kZWwgPSBmdW5jdGlvbigpIHtcbiAgICBkcmF3TW9udGhFbCgpO1xuICAgIHZhciBzdGFydCA9IGQzLnRpbWUuZGF5Lm9mZnNldChkb21haW5bMF0sIC0xNCk7XG4gICAgdmFyIGVuZCA9IGQzLnRpbWUuZGF5Lm9mZnNldChkb21haW5bMV0sICsxNCk7XG4gICAgdmFyIHdlZWtzID0gZDMudGltZS53ZWVrcyhzdGFydCwgZW5kKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHdlZWtzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB3ZWVrc1tpXSA9IGQzLnRpbWUuZGF5Lm9mZnNldCh3ZWVrc1tpXSwgMSk7XG4gICAgfVxuXG4gICAgdmFyIHhTdWJBeGlzID0gbnVsbCxcbiAgICAgIHdlZWtXaWR0aCA9IDA7XG4gICAgeFN1YkF4aXMgPSBzdWJCb3guc2VsZWN0QWxsKCdnJykuZGF0YSh3ZWVrcyk7XG5cbiAgICB2YXIgbyA9IHhTdWJBeGlzLmVudGVyKClcbiAgICAgIC5hcHBlbmQoJ2cnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgZnVuY3Rpb24oZCkge1xuICAgICAgICB2YXIgZGF5ID0gZC5nZXREYXkoKTtcbiAgICAgICAgaWYgKGRheSA9PSAwIHx8IGRheSA9PSA2KSB7XG4gICAgICAgICAgcmV0dXJuICdkIGgnXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuICdkJ1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgdmFyIGR4ID0gZDMudGltZS5kYXkub2Zmc2V0KGQsIDApO1xuICAgICAgICByZXR1cm4gJ3RyYW5zbGF0ZSgnICsgKHhTY2FsZShkeCkpICsgJywwKSc7XG4gICAgICB9KTtcblxuICAgIG8uYXBwZW5kKCdyZWN0JylcbiAgICAgIC5hdHRyKCd3aWR0aCcsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgdmFyIGR4ID0gZDMudGltZS5kYXkub2Zmc2V0KGQsICs3KTtcbiAgICAgICAgd2Vla1dpZHRoID0geFNjYWxlKGR4KSAtIHhTY2FsZShkKTtcbiAgICAgICAgcmV0dXJuIHdlZWtXaWR0aDtcbiAgICAgIH0pXG4gICAgICAuYXR0cignc3Ryb2tlJywgJyNjNWM1YzUnKVxuICAgICAgLmF0dHIoJ3N0cm9rZS13aWR0aCcsICcxJylcbiAgICAgIC5hdHRyKCdzaGFwZS1yZW5kZXJpbmcnLCAnY3Jpc3BFZGdlcycpXG4gICAgICAuYXR0cignaGVpZ2h0JywgMjApXG5cbiAgICBvLmFwcGVuZCgndGV4dCcpXG4gICAgICAuYXR0cihcImR4XCIsIDEwKVxuICAgICAgLmF0dHIoXCJkeVwiLCAxMylcbiAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuICd0cmFuc2xhdGUoJyArICh3ZWVrV2lkdGggLyAyIC0gMjApICsgJywgMCknO1xuICAgICAgfSlcbiAgICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgdmFyIHdlZWsgPSBhcHAuZ2V0WWVhcldlZWsoZC5nZXRGdWxsWWVhcigpLCBkLmdldE1vbnRoKCkgKyAxLCBkLmdldERhdGUoKSk7XG4gICAgICAgIHJldHVybiB3ZWVrICsgJ+WRqCc7XG4gICAgICB9KTtcblxuICAgIHhTdWJBeGlzLmV4aXQoKS5yZW1vdmUoKTtcbiAgICAvLy0tLS0tLVxuXG4gICAgdmFyIG15Y2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJhcHAtd3JhcHBlci1iZ1wiKTtcbiAgICB2YXIgbXljb250ZXh0ID0gbXljYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICBteWNvbnRleHQuY2xlYXJSZWN0KDAsIDAsIG15Y2FudmFzLndpZHRoLCBteWNhbnZhcy5oZWlnaHQpO1xuXG5cblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgd2Vla3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBkYXkgPSB3ZWVrc1tpXTtcbiAgICAgIHZhciB4MSA9IHhTY2FsZShkYXkpO1xuICAgICAgdmFyIG5leHQgPSBkMy50aW1lLmRheS5vZmZzZXQoZGF5LCA3KTtcbiAgICAgIHZhciB4MiA9IHhTY2FsZShuZXh0KSAtIHhTY2FsZShkYXkpIC0gMTtcbiAgICAgIHgxID0gTWF0aC5yb3VuZCh4MSkgKyAwLjU7XG5cbiAgICAgIHZhciBkYXkgPSBkYXkuZ2V0RGF5KCk7XG4gICAgICB2YXIgcmVzdWx0ID0gJyc7XG4gICAgICBkcmF3TGluZShbe1xuICAgICAgICB4OiB4MSxcbiAgICAgICAgeTogMFxuICAgICAgfSwge1xuICAgICAgICB4OiB4MSxcbiAgICAgICAgeTogMTAwMFxuICAgICAgfV0sIHtcbiAgICAgICAgbGluZVdpZHRoOiAxLFxuICAgICAgICBzdHJva2VTdHlsZTogJ3JnYigyMzAsMjI4LDIyOSknXG4gICAgICB9KTsgLy8rMC415YGP56e7XG4gICAgfVxuICB9XG5cbiAgdmFyIGRyYXdNb3VudGhNb2RlbCA9IGZ1bmN0aW9uKCkge1xuICAgIGRyYXdZZWFyRWwoKTtcblxuICAgIHZhciBzdGFydCA9IGQzLnRpbWUubW9udGgub2Zmc2V0KGRvbWFpblswXSwgLTEpO1xuICAgIHZhciBlbmQgPSBkMy50aW1lLm1vbnRoLm9mZnNldChkb21haW5bMV0sICsxKTtcbiAgICB2YXIgbW9udGhzID0gZDMudGltZS5tb250aHMoc3RhcnQsIGVuZCk7XG5cbiAgICB2YXIgeFN1YkF4aXMgPSBudWxsLFxuICAgICAgbW9udGhXaWR0aCA9IDA7XG4gICAgeFN1YkF4aXMgPSBzdWJCb3guc2VsZWN0QWxsKCdnJykuZGF0YShtb250aHMpO1xuXG4gICAgdmFyIG8gPSB4U3ViQXhpcy5lbnRlcigpXG4gICAgICAuYXBwZW5kKCdnJylcbiAgICAgIC5hdHRyKCdjbGFzcycsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuICdkJ1xuICAgICAgfSlcbiAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIHZhciBkeCA9IGQzLnRpbWUuZGF5Lm9mZnNldChkLCAwKTtcbiAgICAgICAgcmV0dXJuICd0cmFuc2xhdGUoJyArICh4U2NhbGUoZHgpKSArICcsMCknO1xuICAgICAgfSk7XG5cbiAgICBvLmFwcGVuZCgncmVjdCcpXG4gICAgICAuYXR0cignd2lkdGgnLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIHZhciBkeCA9IGQzLnRpbWUubW9udGgub2Zmc2V0KGQsICsxKTtcbiAgICAgICAgbW9udGhXaWR0aCA9IHhTY2FsZShkeCkgLSB4U2NhbGUoZCk7XG4gICAgICAgIHJldHVybiBtb250aFdpZHRoO1xuICAgICAgfSlcbiAgICAgIC5hdHRyKCdzdHJva2UnLCAnI2M1YzVjNScpXG4gICAgICAuYXR0cignc3Ryb2tlLXdpZHRoJywgJzEnKVxuICAgICAgLmF0dHIoJ3NoYXBlLXJlbmRlcmluZycsICdjcmlzcEVkZ2VzJylcbiAgICAgIC5hdHRyKCdoZWlnaHQnLCAyMClcblxuICAgIG8uYXBwZW5kKCd0ZXh0JylcbiAgICAgIC5hdHRyKFwiZHhcIiwgMTApXG4gICAgICAuYXR0cihcImR5XCIsIDEzKVxuICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gJ3RyYW5zbGF0ZSgnICsgKG1vbnRoV2lkdGggLyAyIC0gMjApICsgJywgMCknO1xuICAgICAgfSlcbiAgICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuIChkLmdldE1vbnRoKCkgKyAxKSArICfmnIgnO1xuICAgICAgfSk7XG5cbiAgICB4U3ViQXhpcy5leGl0KCkucmVtb3ZlKCk7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1vbnRocy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGRheSA9IG1vbnRoc1tpXTtcbiAgICAgIHZhciB4MSA9IHhTY2FsZShkYXkpO1xuICAgICAgdmFyIG5leHQgPSBkMy50aW1lLm1vbnRoLm9mZnNldChkLCArMSk7XG4gICAgICB2YXIgeDIgPSB4U2NhbGUobmV4dCkgLSB4U2NhbGUoZGF5KSAtIDE7XG4gICAgICB4MSA9IE1hdGgucm91bmQoeDEpICsgMC41O1xuXG4gICAgICB2YXIgZGF5ID0gZGF5LmdldERheSgpO1xuICAgICAgdmFyIHJlc3VsdCA9ICcnO1xuICAgICAgZHJhd0xpbmUoW3tcbiAgICAgICAgeDogeDEsXG4gICAgICAgIHk6IDBcbiAgICAgIH0sIHtcbiAgICAgICAgeDogeDEsXG4gICAgICAgIHk6IDEwMDBcbiAgICAgIH1dLCB7XG4gICAgICAgIGxpbmVXaWR0aDogMSxcbiAgICAgICAgc3Ryb2tlU3R5bGU6ICdyZ2IoMjMwLDIyOCwyMjkpJ1xuICAgICAgfSk7IC8vKzAuNeWBj+enu1xuICAgIH1cbiAgfVxuXG4gIGlmICh6b29tU2NhbGUgPiAwLjcpIHtcbiAgICBkcmF3RGF5TW9kZWwoKTtcbiAgfSBlbHNlIGlmICh6b29tU2NhbGUgPiAwLjE1KSB7XG4gICAgZHJhd1dlZWtNb2RlbCgpO1xuICB9IGVsc2Uge1xuICAgIGRyYXdNb3VudGhNb2RlbCgpO1xuICB9XG5cbiAgaWYgKHdoZXJlID09ICd0b3AnKSB7XG4gICAgc3ViQm94LmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoMCwgMjEpJyk7XG4gICAgbWFpbkJveC5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKDAsIDEpJyk7XG4gIH0gZWxzZSB7XG4gICAgc3ViQm94LmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoMCwgMiknKTtcbiAgICBtYWluQm94LmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoMCwgMjIpJyk7XG4gIH1cblxuICB2YXIgZHJhd1RvZGF5ID0gZnVuY3Rpb24oKSB7XG4gICAgICBkYXkgPSBkMy50aW1lLmRheShuZXcgRGF0ZSgpKTtcbiAgICAgIHZhciB4MSA9IHhTY2FsZShkYXkpO1xuICAgICAgeDEgPSBNYXRoLnJvdW5kKHgxKSArIDAuNTtcbiAgICAgIGRyYXdMaW5lKFt7XG4gICAgICAgIHg6IHgxLFxuICAgICAgICB5OiAwXG4gICAgICB9LCB7XG4gICAgICAgIHg6IHgxLFxuICAgICAgICB5OiAxMDAwXG4gICAgICB9XSwge1xuICAgICAgICBsaW5lV2lkdGg6IDEsXG4gICAgICAgIHN0cm9rZVN0eWxlOiAncmdiKDIzMCwwLDApJ1xuICAgICAgfSk7IC8vKzAuNeWBj+enu1xuICAgIH1cbiAgLy/nlLvlh7rlvZPlpKnnmoTliIblibLnur9cbiAgZHJhd1RvZGF5KCk7XG5cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgaWYgKHR5cGVvZiBjb25maWcuYXhpc0Zvcm1hdCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGNvbmZpZy5heGlzRm9ybWF0KHhBeGlzKTtcbiAgfVxuXG4gIHZhciBkcmF3WEF4aXMgPSBmdW5jdGlvbiBkcmF3WEF4aXMoKSB7XG4gICAgeEF4aXNFbHNbd2hlcmVdLmNhbGwoeEF4aXNbd2hlcmVdKTtcbiAgfTtcblxuICByZXR1cm4ge1xuICAgIGRyYXdYQXhpczogZHJhd1hBeGlzXG4gIH07XG59OyJdfQ==
