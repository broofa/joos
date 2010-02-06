# joos == "OO in JS"

"joos" is a compact javascript library that provides an elegant way of writing Object-Oriented code.

joos **is**:

  * Lightweight - &lt; 1.5KB minified and gzipped
  * Library agnostic - Use it with jQuery, Prototype, Ext... whatever.
  * Powerful - Supports OO constructs that aren't typically available in JS or other 3rd-party JS libraries.
  * Intuitive - joos-enabled code is more readable, and easier to organize.  And it just *looks* better
  * Cross-platform - Urrr... well... sort of.  I need to spec out what the exact browser support story is.

joos **is not**:

  * Compiled into javascript. It *is* javascript.
  * A replacement for existing libraries.

Some of the more interesting features in joos include:

  * API-defined-as-object approach for more intuitive code structure
  * Simple, efficient "super" support (e.g. "this.\_super()") for:
    * object prototypes
    * static class methods (!)
    * getter / setter methods(!!)
    * extended object (mixin) methods (!!!)
  * Simple getter/setter support, e.g. "set$foo", "get$foo"
  * Automatic binding of methods to object instances (e.g. "bind$someMethod")
  * Object and static initializer support (via "initialize" and "initialize$")

## API (w/ examples)

### API Definition Objects (APID's)
When using joos, you define your class, extension, and object APIs using an API Definition object (APID).  These are simply regular javascript objects, with a key syntax that allows you to specify optional modifiers for your API members.  For example, the 

    var Loggable = {
      get$prefix: function() {return this._prefix || "> ";},

      set$prefix: function(v) {this._prefix = v;},

      bind$log: function(msg) {
        var el = document.createElement('div');
        el.className = 'log';
        el.innerHTML = this.prefix + msg;
        this.appendChild(el);
      }
    };

    joos.extendObject(document.getElementById('log'), LOGGABLE);

joos allows you to define your APIs using a single object (referred to in joos as an API Definition, or "APID").  It's no longer necessary to write code that declares the constructor function in one place, assigns the prototype properties in another, the class properties in yet a third place and, finally has some static initialization code in yet another spot.  Just put it all in an API Definition object, and let joos do the rest.

Okay, APIDs and key modifiers sound good, but what does this stuff look like? How's it work?  Let's check out a few examples ...

### joos.createClass()

Classes are created with "joos.createClass(apid)", where 'apid' is an API Definition (APID) object.  The simplest form of this is:

      var MyClass = joos.createClass();

This creates a new, empty class.  But for a slightly more interesting example, let's instead create a class that has some properties and methods by passing in an API Definition object:

    var MyClass = joos.createClass({

      // Define MyClass.SOME_CONSTANT
      $SOME_CONSTANT: 'a value',

      // Define , MyClass.find()
      $find: function() {
        // this == MyClass
      }

      // Define a static initializer method. This method is called once,
      // immediately after the class is created.
      initialize$: function() {
        // Invoked once MyClass is ready for use
        // this == MyClass
      },

      // MyClass instance initializer.
      initialize: function() {
        // Invoked as part of each "new MyClass()" call
        // this == the new MyClass instance
      },

      // Define a setter method for this.something property
      // E.g. "this.something = 123"
      set$something: function(val) {
        this._something = val;
      },

      // Define a getter method for this.something property
      // E.g. "this.something == 123"
      get$something: function() {
        return this._something;
      },

      // Define this.doSomething() method, and tell joos to bind it to each
      // object instance.
      // E.g.:
      //      var x = foo.doSomething;
      //      x();  // Calls 'x' with this == foo
      bind$doSomething: function() {
        // this == MyClass instance, regardless of how this method is invoked
      }
    });

#### Subclasses

With MyClass defined, we can create a subclass like this:

    var MySubclass = joos.createClass({
      superclass$: MyClass
    });

Again, not very interesting.  So lets flesh it out a bit:

**Note the use of this.\_super() to invoke superclass methods (for both instance and class methods, no less!)**

    var MySubclass = joos.createClass({

      // Inherit members from MyClass
      superclass$: MyClass,

      // Static initializer for the subclass
      initialize$: function() {
        // Invoked once MySubclass is ready for use
        // this == MySubclass
      },
 
      // Override superclass' find() method
      $find: function() {
        // this == MySubclass
        this._super();  // Calls MyClass.find() method
      },

      // Override the instance setter
      set$something: function(val) {
        this._super(val + ' blah'); // Calls MyClass#something setter
      },

      // Override doSomething()
      bind$doSomething: function() {
        // this == MySubclass instance, regardless of how invoked
        this._super();  // Calls MyClass#doSomething()
      }
    });

### joos.extendClass()
joos.extendClass() allows you to enhance existing classes.  This works for _any_ class, not just those created with joos.createClass.  For example, to extend the native Array class:

    joos.extendClass({
      // Define Array.SOME_CONSTANT
      $SOME_CONSTANT: 'a value',

      // Override super method to do something interesting, like filter results
      $find: function() {
        var results = this._super();
        // (filter results)
        return results;
      }

      // Replace prior initialize() method
      initialize: function() {
        // If class being extended had an initialize method, it can be accessed
        // by calling this._super()t 
        this._super();
        // (finish initializing)
      }
    });

### joos.extendObject()

joos.extendObject() allows you to extend object instances in much the same way you would extend a class.  This allows you to leverage the powerful "mixin" pattern.  For example, to give a DOM widget "collapsable" behavior, you could do this:

    // First, we define the Collapsable APID...
    var Collapsable = {
      // Static constant.
      $CONTENT\_CLASS: 'content',

      initialize$: function() {
        // Initialize the object being extended
        // ('this' refers to the object)
        this.addEventListener('click', this.handleClick);
      },

      destroy: function() {
        this.removeEventListener('click', this.handleClick);
      },

      bind$handleClick: function() {
        this.collapsed = !this.collapsed
      },

      bind$\_getContent: function() {
        return this.getElementsByClassName(Collapsable.$CONTENT\_CLASS)[0];
      }
      
      // Add support for the 'collapsed' property
      get$collapsed: function() {
        return this.\_getContent().style.display == 'none';
      },
      set$collapsed: function(v) {
        this.\_getContent().style.display = v ? 'none' : '';
      }
    }

    // Then, to apply Collapsable to an element, we do ...
    joos.extendObject(*someElement*, Collapsable);

There are a couple things to note here.  First, extendObject() ignores static$ members in your APID.  Which is nice, because it allows you to include static members in your code.  However - and this is something that may be addressed in a future version of joos - it requires that you reference them using the exact property name in the APID; e.g. "$CONTENT\_CLASS" as opposed to "CONTENT\_CLASS".

Also, note that in methods, 'this' refers to the object being extended.  And that it is bindable using bind$, which is just damn cool when setting up event handlers, like handleClick, above.

## APID Key Syntax and Modifiers
But joos isn't just about letting you lay your code out in a clean, logical manner, and leverage easy-to-use, fast, method inheritance.  joos allows you to prefix your APID keys with special modifiers that provide useful, powerful functionality.  We'll show you how this works below, but for now here's the list of currently supported modifiers:

### **bind**$*name*
Activates binding on the *name* function.

Functions are bound to each instance (cool, right?), meaning regardless of how the function is invoked, 'this' will refer to the object instance.

If used in conjunction with static$, 'this' will refer to the class object.

Note: When using joos.extendClass() to enhance a non-joos class, non-static bind$s will produce an error.

### **get**$*name* / **set**$*name*
Applies the *name* function using built-in getter/setter support.

Note: get$ and set$ will produce errors on older browsers [TODO: such as?]

### **static**$*name* / $*name*
Identifies *name* as a static (class) member, as opposed to a prototype member.

The static$ modifier can be abbreviated as simple, "$".  I.e. "$*name*" is identical to "static$*name*"

### **superclass**$
Specifies the superclass to inherit from

Note: Only meaningful in joos.createClass.

### **initialize**$
Identifies a static initializer method.  The supplied function will be invoked immediately before returning from joos.createClass/extendClass/extendObject.

### **initialize**
Specifies the instance initializer method.  joos classes invoke this method as part of "new" object creation.

(This is not technically a modifier, it's just a special property)

## Debugging joos
joos may occasionally throw errors when it sees something it doesn't like. These may or may not make much sense, and can be difficult to debug without having a stack trace to inspect.  If you would prefer that joos open halt execution and open your debugger of choice (e.g. Firebug), simply add 'joosdebug' as a query parameter or anchor name to your page's URL.  E.g. "http://foobar.com/mypage?joosdebug" or "http://foobar.com/mypage#joosdebug".
