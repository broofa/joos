// Copyright 2010, Robert Kieffer. Dual licensed under MIT and GPLv2 licenses.
// You are free to use this code as long as this copyright header remains intact

/*
 * joos.js provides the core OO support for joos. A class is defined via an API
 * Definition object (APID). The currently supported APID keys:
 *   "superclass$":      Superclass of the class
 *   "initialize$":      Static initializer
 *   "initialize":       Instance initializer.
 *   "static$(name)":    Static member (applied to the class object)
 *   "$(name)":          alias for "static$" see static$(name), above
 *   "get$(name)":       Getter method (defined using __defineGetter__)
 *   "set$(name)":       Setter method (defined using __defineSetter__)
 *   "bind$(name)":      Instance-bound method (method is bound to object as
 *                       part of initialize)
 *   (name):             Instance members (applied to prototype object)
 */

(function() {
  /* Empty function (for stubbing out callbacks, etc.)
   *
   * Use: joos.nilf
   */
  var nilf = function() {};

  /* Copy properties from 'src' object to 'dst' object.
   *
   * dst - object properties are copied to (if null, a new object is created)
   * src - object properties are copied from
   *
   * Returns: dst, or the newly created object
   *
   * Use: joos.extend()
   */
  function extend(dst, src) {
    if (!dst) dst = {};
    if (src) for (var k in src) dst[k] = src[k];
    return dst;
  }

  /* Return a function that invokes 'f' with the 'this' property bound to a
   * specific object.  This returned function has a 'boundFunction' property that
   * can be used to reference the original function (f).  Note that if 'f' is a
   * binder function already (i.e. a function returned by this method), the
   * original function is used instead.  E.g. "joos.bind(joos.bind(f), obj)" is
   * identical to "joos.bind(f, obj)";
   *
   * f    - function to invoke
   * obj  - object to assign 'this' to
   *
   * Returns: the binder function
   *
   * Use: joos.bind()
   */
  function bind(f, obj) {
    if (!obj) throw new Error('obj not defined');
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
  function isFunction(o) {return o && o.call && o.apply;}

  /* Return an object that inherits properties from another object
   *
   */
  function _getPrototypedObject(proto) {
    var f = function ProtoObject() {};
    f.prototype = proto;
    return new f();
  }

  /* Regex to detect _super references in functions
   *
   * Use: (private)
   */
  var _fnTest = /xyz/.test(function(){xyz;}) ? /\bthis\._super\b/ : /.?/;

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
  function _superify(f, superf, fdbg) {
    if (!isFunction(f) || !_fnTest.test(f)) return f;
    if (!isFunction(superf)) throw new Error('this._super in ' + fdbg
      + ' could not be resolved');

    return function() {
      var tmp = this._super;
      this._super = superf;
      var ret = f.apply(this, arguments);
      tmp === undefined ? (delete this._super) : (this._super = tmp);
      return ret;
    };
  }

  /* Define a getter/setter ("xetter") propert on an object. (This is just a wrapper around
   * the various platform-specific methods of creating xetters).
   *
   * obj    - object the xetter applies to
   * name   - name of the property in question
   * mod    - defines the type of xetter, either 'get' or 'set'
   * xetter - function that does the get or set operation
   *
   * Returns: undefined
   *
   * Use: (private)
   */
  function _applyXetter(obj, name, mod, xetter) {
    if (Object.defineProperty) {
      Object.defineProperty(obj, name, mod == 'get' ? {get:xetter} : {set:xetter});
    } else if (obj.__defineGetter__) {
      obj[mod == 'get' ? '__defineGetter__' : '__defineSetter__'](name, xetter);
    } else {
      // We could do some sort of munging to create setFoo/getFoo methods
      // but it's not clear that would be helpful.  So just throw a wobbly ...
      throw new Error('No support for getter/setter methods');
    }
  }

  /* Extend a class or object in really bitchin' ways.  This is the heart of
   * joos' OO support and, honestly, I'm not sure there's a clear, concise
   * way of explaining exactly what goes on here.  I've tried to do a good
   * job documenting the source however.
   *
   * obj        - class or object to be extended
   * apid       - API definition object
   * [superObj] - object that 'this._super' references should point at
   *
   * Returns: obj
   *
   * Use: (private)
   */
  function _extend(obj, apid, superObj) {
    if (!obj || !apid) throw new Error('obj or apid is not defined');

    // Set up metadata cache where we store various info we'll need later
    var meta = obj.__meta;
    if (!meta) {
      meta = obj.__meta = {
        xetters: {}, // declared getter/setter methods
        binds: {},   // methods that need to be bound during initialize
        superclass: superObj // The declared super object
      };

      // If there's a superclass with meta info, make sure we inherit it's
      // bound properties
      if (superObj && superObj.__meta) meta.binds = _getPrototypedObject(superObj.__meta.binds);
    };

    // We're done dealing with the declared superObj, so switch to the one
    // we're gonna actually use
    superObj = superObj || obj.__meta.superclass || obj.superclass || obj._superclass || obj;

    // Are we dealing with a class, or some other sort of object?
    var objIsClass = !!obj.prototype;

    // For each key in the API definition ...
    for (var key in apid) {
      var member = apid[key];

      // Parse key for name & modifier(s).  This is a bit simplistic, but works
      // well enough for now.
      var words = key.split('$'), name = words.pop(), mod = words.shift();
      var isStatic = mod === '' || mod == 'static';

      // If the modifier is 'static', there might be another one, so grab that.
      // E.g. "static$get$foo"
      if (isStatic) mod = words.shift();

      // Ignore static members when not working with a class
      if (isStatic && !objIsClass) continue;

      // Standalone modifiers (that don't operate on a specific APID member),
      // like initialize$ and superclass$, are all currently handled elsewhere,
      // so we can ignore them
      if (!name) continue;

      // Figure out which object's we're *really* dealing with
      var target = obj, superTarget = superObj;
      var useProto = !isStatic && objIsClass;
      if (useProto) {
        target = target.prototype;
        superTarget = superTarget.prototype;
      }

      // Apply APID member to the object, as per the modifier
      if (mod == 'get' || mod == 'set') {
        // We have to process getter/setters in pairs, so just build up a list
        // of what's defined here.  We'll process it in a seperate loop, below.
        var xk = key.replace(/(get|set)\$/, 'xet$');
        var xet = meta.xetters[xk];
        if (!xet) xet = meta.xetters[xk] = {target:target, name:name, mod: mod};
        xet[mod] = member;
      } else {
        // Enable 'this._super' support if needed
        member = _superify(member, superTarget[name], key);

        if (mod == 'bind') {
          if (!isFunction(member)) throw new Error(key + ' is not a function');
          if (objIsClass && useProto) {
            // Instance method: Store the name of the method so we can bind it
            // to object instances in the constructor function.
            // See "JoosClass" constructor function, below
            meta.hasBinds = meta.binds[name] = true;
          } else {
            // Either obj isn't a class, or we're dealing with a class member:
            // Bind it to the object
            member = joos.bind(member, obj);
          }
        }

        // Assign the APID member to the object
        target[name] = member;
      }
    }

    // Process getter/setter pairs
    for (var xk in meta.xetters) {
      var xet = meta.xetters[xk], name = xet.name;

      // Process xetters in get/set pairs, even though they may not be declared
      // in pairs in the APID
      for (var i = 0; i < 2; i++) {
        var mod = i ? 'set' : 'get',  // getter .vs. setter
            member = xet[mod];        // get/setter function

        // Yup, xetters have to be functions
        if (member && !isFunction(member)) throw new Error(mod + '$' + name + ' is not a function');

        // See if we can find a super-function for this xetter
        var superf = superObj.__meta;
        if (superf && (superf = superf.xetters[xk])) superf = superf[mod];

        // If member is defined, enable this._super support.  If not, use the
        // super-function (if available)
        member = member ? _superify(member, superf, xk) : superf;

        // To Do: Refine this warning.  There are times when getter/setters need to be defined in
        // pairs.
        // if (!member && mod) throw new Error(mod + '$' + name + ' must be defined');
        if (member) _applyXetter(xet.target, name, mod, member);
      }
    }

    // Invoke static initializer, if provided
    if (apid.initialize$) apid.initialize$.call(obj);

    return obj;
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
    var sklass = apid.superclass$ || Object, sproto = sklass.prototype;

    // Create the class constructor function
    var klass = function JoosClass() {
      var init = this.initialize;
      // bind 'bind$...' functions to this instance
      for (var k in klass.__meta.binds) this[k] = bind(this[k], this);

      // Call this.initialize()
      if (init != nilf && init) init.apply(this, arguments);
    };

    // Create un-init'ed prototype by short-circuiting the initialize method.
    // (Note: While it would be simpler to have a private flag in the
    // constructor function that we could use to turn off the call to the init
    // method, this approach will allow us to play nice with classes created by
    // other libraries)
    var oldinit = sproto.initialize;
    sproto.initialize = nilf;
    klass.prototype = new sklass();
    delete sproto.initialize;
    if (sproto.initialize !== oldinit) sproto.initialize = oldinit;

    // Make sure constructor is set
    klass.prototype.constructor = klass;

    // Apply the rest of the class definition
    return _extend(klass, apid, sklass);
  }

  // Create the joos object, with the properties we want to make public
  self.joos = {
    // The main joos API  ...
    createClass: createClass,
    extendClass: _extend,
    extendObject: _extend,

    // Useful methods we make available because... well... they're useful
    nilf: nilf,
    bind: bind,
    isFunction: isFunction,
    extend: extend
  };
})();
