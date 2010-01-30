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

joos.extendObject() allows you to extend object instances in much the same way you would extend a class.  This allows you to easily leverage the powerful "mixin" pattern.

## API Definition Objects (APID's)

One of the really nice features of joos is that it's no longer necessary to fragment your class definitions.  Code like this ...
    // Define class
    var MyClass = function() {
      // initialization code goes here
    };

    // Define class-level members
    MyClass.load = function() {
      // code goes here
    };
    MyClass.FOO = 123;

    // Define prototype members
    MyClass.prototype = {
      // instance member and properties go here
      foo: 123
    };

    // Finish class initialization
    window.onload = MyClass.load;

... is a thing of the past.  Instead, the above can now all be done with a single APID object, passed to joos.createClass():
    
    var MyClass = joos.createClass({
      $FOO: 123,
      foo: 123,

      $load: function() {
        // code goes here
      },

      initialize$: function() {
        window.onload = this.load;
      },

      initialize: function() {
        // initialization code goes here
      }
    });

### APID Key Syntax and Modifiers

APID object keys can contain special modifiers. The "$" symbol is used to separate modifiers from the name of the member being modified.  The currently supported modifiers are as follows:

  * bind$**name** - Binds the **name** function to each object instance.
  * get$**name** - Specifies the getter function for the **name** property
  * set$**name** - Specifies the setter function for the **name** property
  * static$**name** - e.g. "static$something": specifies that the member is a static (class) member as opposed to a prototype property.  Note that this can be abbreviated with just a "$" sign - e.g. "$something" is identical to "static$something"
  * superclass$ - Specifies the superclass to inherit from
  * initialize$ - The static initializer method.  This is only called once, immediatley after a class has been created.
  * initialize - The method to invoke for initializing a new object.  (This is not technically a modifier - it's just a special property)
