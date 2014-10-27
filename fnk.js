var fnk = {};

fnk.argsToArray = function(args){
    return Array.prototype.slice.call(args, 0);
};

fnk.dontCurry = ['argsToArray', 'getType', 'isType', 'curry', 'autoCurry', 'isTrue', 'compose', 'composeAsync', 'withArgs', 'waterfall'];

fnk.append = function(append, str){
    return str + append;
};

fnk.prepend = function(prepend, str){
    return prepend + str;
};

fnk.groupBy = function(fn, data){
    var obj = {};
    fnk.forEach(function(item, i){
        var key = fn(item, i).toString();
        if(!obj.hasOwnProperty(key)){
            obj[key] = [];
        }
        obj[key].push(item);
    }, data);
    return obj;
};

fnk.values = function(data){
    var vals = [];
    fnk.forEach(function(item){
        vals.push(item);
    }, data);
    return vals;
};

fnk.groupByCount = function(object, count){
    var result = fnk.groupBy(function(item, i){
        return Math.floor((i)/count);
    }, object);
    return fnk.values(result);
};

fnk.reduce = function(fnc, data){
    if(data.reduce){
        data.reduce(fnc);
    }else{
        var firstArg = data[0];
        var result;
        fnk.forEach(function(item, i){
            if(i === 0){
                result = item;
            }else{
                result = fnc(result, item);
            }
        }, data);
    }
};

fnk.skip = function(num, _data){
    var data = _data;
    data.unshift(num);
    return data;
};

fnk.drop = function(num, _data){
    var data = _data;
    data.shift(num);
    return data;
};

fnk.flatten = function(data){
    var result = [];
    fnk.forEach(function(item){
        if(fnk.isType(item) == array){
            result.concat(fnk.flatten(item));
        }else{
            result.push(item);
        }
    });
    return result;
};

fnk.join = function(symbol, array){
    return array.join(symbol);
};

fnk.getType = function(thing){
    if(thing === null)return "null"; // special case
    var string = Object.prototype.toString.call(thing);
    return string.substr(8, string.length - 9).toLowerCase();
};

fnk.isType = function(thing, name){
    return fnk.getType(thing) === name;
};

fnk.withArgs = function(func, args){
    return function(){
        return func.apply(this, fnk.argsToArray(args).concat(fnk.argsToArray(arguments)));
    };
};

fnk.curry = function(fn, args) {
    return function () {
        return fn.call(this, fnk.argsToArray(args).concat(fnk.argsToArray(arguments)));
    };
};

fnk.wrapNodeFunction = function(fn){
    return fnk.autoCurry(function(cb, arg){
        fn(arg, function(err, data){
            if(err){
                throw err;
            }else{
                return cb(data);
            }
        });
    });
};

// So what does currying do
// Return a function until all arguments
// are fulfilled
fnk.autoCurry = function(fn, expected){ 
    expected = expected || fn._length || fn.length;
    return function f() {
        var args = arguments;
        if(args.length >= expected){
            return fn.apply(this, args);
        }else{
            return fnk.withArgs(f, args);
        }
    };
};

fnk.isTrue = function(val){
    if(fnk.getType(val) === 'function'){
        return !!val();
    }else{
        return !!val;
    }
};

fnk.maybe = function(func, val){
    return function(){
        if(fnk.isTrue(val)){
            return func;
        }
    };
};

fnk.reverseArgs = function(fn){
    var func = function(){
        fn.apply(this, fnk.argsToArray(arguments).reverse());
    };
    func._length = fn.length;
    return func;
};

var iterateThroughFunctions = function(fns, args, fulfill){
    if(fns && fns.length > 0){
        // If we're encountering a promise proceed to next function
        // through then callback
        if(args.then && args.spread && args.error && args.bind){
            args.then(function(data){
                iterateThroughFunctions(fns, data, fulfill);
            });
        }else{
            args = fns[0](args);
            fns.shift();
            iterateThroughFunctions(fns, args, fulfill);
        }
    }else{
        fulfill(args);
    }
};

fnk.tap = function(fnk, data){
    fnk(data);
    return data;
};

fnk.compose = function(){
    var fns = arguments;
    return function(){
        var args = arguments;
        fnk.forEach(function(fn){
            args = [fn.apply(this, args)];
        }, fnk.argsToArray(fns));
        return args[0];
    };
};

fnk.composeAsync = function(){
    var fns = fnk.argsToArray(arguments);
    return function(args){
        return new Promise(function(fulfill, reject){
            iterateThroughFunctions(fns, args, fulfill);
        });
    };
};

fnk.compose = function(){
    var fns = fnk.argsToArray(arguments);
    return function(){
        var args = arguments;
        fnk.forEach(function(fn){
            args = [fn.apply(this, args)];
        }, fns);
        return args[0];
    };
};


fnk.forEach = function(fn, obj){
    if(typeof obj.forEach === Array.prototype.forEach){
        obj.forEach(fn);
    }else{
        for(var key in obj){
            if(obj.hasOwnProperty(key)){
                fn(obj[key], key);
            }
        }
    }
};

fnk.dot = function(member, obj){
    return obj[member];
};

fnk.map = function(fn, obj){
    var type = fnk.getType(obj);
    var result;
    if(type === 'array'){
        result = [];
    }else{
        result = {};
    }

    fnk.forEach(function(v, k){
        result[k] = fn(v, k);
    }, obj);
    return result;
};

fnk.mapKeyValuePairs = function(fn, obj){
    var result = {};
    fnk.forEach(function(v, k){
        var keyValuePair = fn(v, k);
        var key = keyValuePair[1] || k;
        result[key] = keyValuePair[0];
    }, obj);
    return result;
};

fnk.plusOne = function(num){
    return num + 1;
};

fnk.reduce = function(fn, obj){
    var result = 0;
    fnk.forEach(function(v, k){
        result = fn(result, v, k);
    }, obj);
    return result;
};

fnk.contains = function(obj, val){
    for (var i = 0; i < obj.length; i++){
        if(val === obj[i]){
            return true;
        }
    }
    return false;
};

fnk.div = function(fns, data, output){
    output = output = {};
    output.div = {};
    output.div = fnk.compose.apply(this, fns)(data, output.div);
    return output;
};

fnk.text = function(fns, data, output){
    output = output = {};
    output.text = fnk.compose.apply(this, fns)(data, output.div);
    return output;
};

fnk = fnk.map(function(v, k){
    if(fnk.getType(v) === 'function' && !fnk.contains(fnk.dontCurry, k)){
        return fnk.autoCurry(v);
    }else{
        return v;
    }
}, fnk);

if (typeof module !== 'undefined' && module.exports) {
    var Promise = require('bluebird');
    module.exports = fnk;
} else {
    window.fnk = fnk;
}
