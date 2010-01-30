# joos == "OO in JS"

"joos" is a compact library (< 2KB minified+gzip'ed) that provides a clean, powerful, consistent, approach to creating classes and other OO patterns in JavaScript.

## joos.createClass()
Classes are created with "joos.createClass(apid)", where 'apid' is an API Definition (APID) object.  The simplest form of this is:

      var MyClass = joos.createClass();

This creates a new, empty class.  But for a slightly more interesting example, let's instead create a class that has some properties and methods by passing in an API Definition object:

    var MyClass = joos.createClass({

      // Define a class variable, "MyClass.SOME_CONSTANT"
      $SOME_CONSTANT: 'a value',

      // Define a class method, "MyClass.find"
      $find: function() {
        // (code goes here)
      }

      // Define a static initializer method. This method is called once, immediately
      // after the class is created.
      initialize$: function() {
        // (code goes here)
      },

      // Define initializer.  This is invoked automatically during new object
      // creation (e.g. "new MyClass()" will call this)
      initialize: function() {
        // (code goes here)
      },

      // Define a getter for the 'this.something' property
      get$something: function() {
        return this._something;
      },

      // Define a setter for the 'this.something' property
      set$something: function(val) {
        this._something = val;
      },

      // Define this.doSomething() method, and tell joos to bind it to each
      // object instance
      bind$doSomething: function() {
        // (code goes here)
      }
    });

### Subclasses

With MyClass defined, we can create a subclass like this:

    var MySubclass = joos.createClass({
      superclass$: MyClass
    });

Again, not very interesting.  So lets flesh it out a bit:

**Note the use of this._super() to invoke superclass methods (for both instance and class methods, no less!)**

    var MySubclass = joos.createClass({

      // Declare MyClass as our superclass
      superclass$: MyClass,

      // static initializer for the subclass
      initialize$: function() {
        // (code goes here)
      },

      // Override the setter for 'something'
      set$something: function(val) {
        // Use this._super() to invoke superclass' method!
        this._super(val + ' blah');
      },

      // Override doSomethin()
      // object instance
      bind$doSomething: function() {
        // (function implementation)
      }
    });

## joos.extendClass()
joos.extendClass() allows you to add members to an existing class.  This works for _any_ class, not just those created with joos.createClass.  For example, to extend the native Array class:

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
        this._super()
        // (finish initializing)
      }
    });

## joos.extendObject()
