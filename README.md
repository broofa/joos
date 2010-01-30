# joos == "OO in JS"

"joos" is a compact library (< 2KB minified+gzip'ed) that provides a clean, powerful, consistent, approach to creating classes and other OO patterns in JavaScript.

## API Definition Objects (APID's)
joos allows you to define your APIs using a single object (referred to in joos as an API Definition, or "APID").  It's no longer necessary to write code that declares the constructor function in one place, assigns the prototype properties in another, the class properties in yet a third place and, finally has some static initialization code in yet another spot.  Just put it all in an API Definition object, and let joos do the rest.

## Killer "super" support
joos allows you to inherit superclass methods by simply calling 'this._super' from within subclass methods.  But this isn't limited to just traditional class-based inheritance.  You can use this exact same technique when overriding native methods, and even when mixing methods into object instances.  It all just works.

And the approach joos uses for this is *fast*. (Faster than Prototype's $super!)

## APID Key Syntax and Modifiers
But joos isn't just about letting you lay your code out in a clean, logical manner, and leverage easy-to-use, fast, method inheritance.  joos allows you to prefix your APID keys with special modifiers that provide useful, powerful functionality.  We'll show you how this works below, but for now here's the list of currently supported modifiers:

  * **bind**$*name* - Binds the *name* function to each object instance.
  * **get**$*name* - Specifies the getter function for the *name* property
  * **set**$*name* - Specifies the setter function for the *name* property
  * **static**$*name* - Specifies that *name* is a static (class) member, as opposed to a prototype property.  This can be abbreviated as just "$" - e.g. "$*name*" is identical to "static$*name*"
  * **superclass**$ - Specifies the superclass to inherit from
  * **initialize**$ - The static initializer method.  This is only called once, immediatley after a class has been created.
  * **initialize** - The method to invoke for initializing a new object.  (This is not technically a modifier - it's just a special property)

## API (w/ examples)
Okay, APIDs and key modifiers sound good, but what does this stuff look like? How's it work?  Let's check out a few examples ...

### joos.createClass()

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

#### Subclasses

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

### joos.extendClass()
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

### joos.extendObject()

joos.extendObject() allows you to extend object instances in much the same way you would extend a class.  This allows you to easily leverage the powerful "mixin" pattern.

