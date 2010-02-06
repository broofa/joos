// Copyright 2010, Robert Kieffer. Dual licensed under MIT and GPLv2
// licenses.  You are free to use this code as long as this copyright header
// remains intact

(function() {
  /* Empty function (for stubbing out callbacks, etc.)
   *
   * Use: joos.nilf
   */
  var nilf = function() {};

  /* Copy properties from one or more objects
   *
   * dst - object properties are copied to (if null, a new object is created)
   * ... - object(s) to copy properties from
   *
   * Returns: dst, or the newly created object
   *
   * Use: joos.extend()
   */
  function extend(dst) {
    var a = arguments, l = a.length;
    if (!dst) dst = {};
    while (l-- > 1) {
      var src = a[l];
      if (src) for (var k in src) dst[k] = src[k];
    }
    return dst;
  }

  /* Return a function that invokes 'f' with the 'this' property bound to a
   * specific object.  This returned function has a 'boundFunction' property
   * that can be used to reference the original function (f).  Note that if 'f'
   * is a binder function already (i.e. a function returned by this method),
   * the original function is used instead.  E.g. "joos.bind(joos.bind(f),
   * obj)" is identical to "joos.bind(f, obj)";
   *
   * f    - function to invoke
   * obj  - object to assign 'this' to
   *
   * Returns: the binder function
   *
   * Use: joos.bind()
   */
  function bind(f, obj) {
    if (!obj) _err(Error('obj not defined'));
    while (f.boundFunction) f = f.boundFunction;
    var ff = function binder() {
      return f.apply(obj, arguments);
    };
    ff.boundFunction = f;
    return ff;
  }

  /* Detect a function
   *
   * o - object to test
   *
   * Returns: true if 'o' is a function, false otherwise
   *
   * Use: joos.isFunction()
   */
  function isFunction(o) {return o && o.apply;}

  /* Throw an exception, optionally opening debugger if page location
   * contains 'joosdebug'. (e.g. "http"//....?joosdebug")
   *
   * e - Error object to throw
   *
   * Use: (private)
   */
  function _err(e) {
    if (/joosdebug/i.test(location)) {
      console.error(e);
      debugger;
    }
    throw e;
  }

  /* Return an object that inherits properties from another object
   *
   * Returns: prototyped object
   *
   * Use: (private)
   */
  function _prototypify(proto) {
    if (!proto) return {};
    var f = function _prototypifier() {};
    f.prototype = proto;
    return new f();
  }

  /* Regex to detect _super references in functions
   *
   * Use: (private)
   */
  var _fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : false;

  /* Return a function that enables calls to "this._super()" from within a
   * function, 'f', where _super refers to 'superf'.
   *
   * f      - function in which calls to 'this._super' are expected
   * superf - function that _super should refer to
   * [fdbg] - what to call 'f' when throwing errors
   *
   * Returns: Function that is a 'this._super'-enabled version of 'f'
   *
   * Use: (private)
   */
  function _superify(f, superf, proto, fdbg) {
    if (!_fnTest || !isFunction(f) || !_fnTest.test(f)) return f;
    if (!isFunction(superf)) _err(Error('no super-method found for ' + fdbg));

    return function _superifier() {
      var me = proto || this, tmp = me._super;
      me._super = superf;
      var ret = f.apply(this, arguments);
      tmp === undefined ? (delete me._super) : (me._super = tmp);
      return ret;
    };
  }

  function _processAPI(apid, force) {
    if (!apid.__joosCache || force) {
      // Preprocess apid keys
      var api = apid.__joosCache = {};
      for (var key in apid) {
        var splits = key.split('$'), name = splits.pop();

        // Name-less keys are dealt with elsewhere
        if (!name || key == '__joosCache') continue;

        // Create member info, set modifier flags
        var member = {name:name};  // Info object for this member.
        while (splits.length) {
          var modifier = splits.shift() || 'STATIC';
          member[modifier.toUpperCase()] = true;
        }

        // Merge member definitions(?)
        var memberKey = (member.STATIC ? '+' : '-') + name;
        var lmember = api[memberKey];
        if (member.GET || member.SET) {
          member[member.GET ? 'GET' : 'SET'] = apid[key];
          if (lmember) member = extend(lmember, member);
        } else {
          if (lmember) _err(Error('found duplicate ' + memberKey + ' definition'));
          member.value = apid[key]; // "value" == member value
        }
        if (!lmember) api[memberKey] = member;
      }
    }

    return apid.__joosCache;
  }

  // Set up metadata cache where we store various info we'll need later
  function _metafy(obj, superObj) {
    if (!obj.__meta) {
      var smeta = superObj && superObj.__meta;
      obj.__meta = {
        // methods that need to be bound during initialize
        binds: (superObj && smeta) ? _prototypify(smeta.binds) : {},
        hasBinds: smeta && smeta.hasBinds,
        // Superclass, if applicable
        superclass: null
      };
    }
    return obj.__meta;
  }

  /* Define a getter/setter ("xetter") propert on an object. (This is just a wrapper around
   * the various platform-specific methods of creating xetters).
   *
   * obj    - object the xetter applies to
   * name   - name of the property in question
   * mod    - defines the type of xetter, either 'GET' or 'SET'
   * xetter - function that does the get or set operation
   *
   * Returns: undefined
   *
   * Use: (private)
   */
  function _applyXetter(obj, name, xet, xetter) {
    if (!/^[GS]ET$/.test(xet)) _err(Error('unexpected xet: ' + xet));
    if (Object.defineProperty) {
      Object.defineProperty(obj, name, xet == 'GET' ? {get:xetter} : {set:xetter});
    } else if (obj.__defineGetter__) {
      obj[xet == 'GET' ? '__defineGetter__' : '__defineSetter__'](name, xetter);
    } else {
      // We could do some sort of munging to create setFoo/getFoo methods
      // but it's not clear that would be helpful.  So just throw a wobbly ...
      _err(Error('No support for getter/setter methods'));
    }
  }

  /* Extend a class or object in really bitchin' ways.  This is the heart of
   * joos' OO support.  Describing what this does in detail is non-trivial so
   * just read the (well-documented) source code.
   *
   * obj      - class or object to be extended
   * superObj - object that 'this._super' references should point at
   * apid     - API definition object
   * isClass  - if true, obj is expected to be a class constructor.
   *
   * Returns: obj
   *
   * Use: (private)
   */
  function _extend(obj, superObj, apid, isClass) {
    var meta = _metafy(obj, superObj);

    // Get processed APID structure
    var api = meta.api = _processAPI(apid);

    // Detect classes that require setting _super on the prototype in order for
    // superifying to work
    var nativeSuper = (superObj === Number || superObj === String);

    // Apply each member
    for (var memberKey in api) {
      var member = api[memberKey], name = member.name;
      var dst = obj, superDst = superObj, protoForSuper = false;
      var value = member.value;

      // Ignore static members for non-classes
      if (member.STATIC && !isClass) continue;

      // If non-static member, and a class, switch to prototypes
      if (!member.STATIC && isClass) {
        dst = dst.prototype;
        superDst = superDst.prototype;
        protoForSuper = nativeSuper && superDst;
      }

      if (member.BIND) {
        if (!isFunction(value)) _err(Error(name + ' is not a function'));

        if (isClass && !member.STATIC) {
          if (!meta.isJoosClass) _err(Error(name + ' can\'t be bound by non-joos class'));
          // Instance method: Store the name of the method so we can bind it
          // to object instances in the constructor function.
          // See "JoosClass" constructor function, below
          meta.hasBinds = meta.binds[name] = true;
        } else {
          // Bind it to the object
          value = joos.bind(value, dst);
        }
      }

      if (member.GET || member.SET) {
        if (member.BIND) _err(Error('Binding not supported for getter/setters (' + name + ')'));

        // Process xetters in get/set pairs, even though they may not be
        // declared in pairs in the APID
        for (var i = 0; i < 2; i++) {
          var xet = i ? 'SET' : 'GET',  // getter .vs. setter
              value = member[xet];        // get/setter function

          // Yup, xetters have to be functions
          if (value && !isFunction(value)) _err(Error(xet + '$' + name + ' is not a function'));

          // See if we can find a super-function for this xetter
          var superf = superObj.__meta;
          if (superf && (superf = superf.api[memberKey])) superf = superf[xet];

          // If value is defined, enable this._super support.  If not, use the
          // super-function (if available)
          value = value ? _superify(value, superf, protoForSuper, name) : superf;

          // To Do: Refine this warning.  There are times when getter/setters need to be defined in
          // pairs.
          // if (!value && mod) _err(Error(mod + '$' + name + ' must be defined'));
          if (value) _applyXetter(dst, name, xet, value);
        }
      } else {
        // Simple case - straight-up assign
        dst[name] = _superify(value, superDst[name], protoForSuper, name);
      }
    }
  }

  /* Create un-init'ed prototype by short-circuiting the initialize method.
   * (Note: While it would be simpler to have a private flag in the
   * constructor function that we could use to turn off the call to the init
   * method, this approach will allow us to play nice with classes created by
   * other libraries)
   *
   * klass - Class to instantiate
   *
   * Returns: un-initialized instance of klass
   *
   * Use: (private)
   */
  function _uninitedInstance(klass) {
    var proto = klass.prototype, oldinit = proto.initialize;
    proto.initialize = nilf;
    var obj = new klass();
    delete proto.initialize;
    // (initializer may be inherited, so we still have to check)
    if (proto.initialize !== oldinit) proto.initialize = oldinit;

    return obj;
  }

  function _makeClass(sklass) {
    sklass = sklass || Object;

    // Create the class constructor function
    var klass = function JoosClass() {
      var init = this.initialize;

      // bind 'bind$...' functions to this instance
      if (meta.hasBinds) for (var k in meta.binds) {
        if (k == 'fireChanged') console.log('binding ' + k + ' ' + this.id);
        this[k] = bind(this[k], this);
      }

      // Call this.initialize()
      if (init != nilf && init) init.apply(this, arguments);
    };

    // Create the class' meta info object
    var meta = extend(_metafy(klass, sklass), {superclass: sklass, isJoosClass: true});

    // Create class prototype
    klass.prototype = _uninitedInstance(sklass);
    klass.prototype.constructor = klass;

    return klass;
  }

  /* Create a new class.
   *
   * apid    - The API Definition object (see file header for details)
   *
   * Returns: The newly created class
   *
   * Use: joos.createClass()
   */
  function createClass(apid) {
    var klass = _makeClass(apid.superclass$);
    if (apid) _extend(klass, klass.__meta.superclass, apid, true);
    if (apid.initialize$) apid.initialize$.call(klass);
    return klass;
  };

  /* Add methods and properties to a class
   *
   * klass - Class to enhance
   * apid - API definition object
   *
   * Returns: klass
   *
   * use: joos.extendClass()
   */
  function extendClass(klass, apid) {
    _extend(klass, klass, apid, true);
    if (apid.initialize$) apid.initialize$.call(klass);
    return klass;
  };

  /* Add methods and properties to an object.  Properties of 'apid' with the
   * static$ (or '$') modifier are ignored.
   *
   * obj - Object to enhance
   * apid - API definition object
   *
   * Returns: obj
   *
   * use: joos.extendObject()
   */
  function extendObject(obj, apid) {
    _extend(obj, obj, apid, false);
    if (apid.initialize$) apid.initialize$.call(obj);
    return obj;
  };

  // Create the joos object, with the properties we want to make public
  self.joos = {
    // The main joos API  ...
    createClass: createClass,
    extendClass: extendClass,
    extendObject: extendObject,

    // Useful methods we might as well make available
    nilf: nilf,
    bind: bind,
    isFunction: isFunction,
    extend: extend
  };
})();
