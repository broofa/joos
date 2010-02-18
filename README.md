<style>
.key {
  font-weight: bold;
  color: #084;
}
</style>
# Joos - OO in JS 

Joos is a lightweight library that makes writing Object Oriented JavaScript easier.

Joos **is** ...

  * **Small** - &lt; 1.5KB minified and gzipped
  * **Agnostic** - it can be used standalone, or in conjunction with jQuery, Prototype, Dojo, MooTools, etc.
  * **Powerful** - it provides OO constructs that are traditionally difficult to implement
  * **Intuitive** - code written with Joos is more readable and easier to organize; it just *looks* better
  * **Performant** - Joos is fast and efficient
  * **Cross-platform** - urrr... well... sort of.  I need to spec out what the exact browser support story is.)

Joos is **not** ...

  * A metalanguage - it's JavaScript, for JavaScript coders.

## Joos Features

Joos' feature set is minimal by design.  It provides elegant solutions to a handful of fundamental problems JavaScript developers face every day (still!)  Specifically, it provides ...

  * A comprehensive API definition framework that allows for cleaner, more readable code
  * A powerful inheritance model.  "this.\_super()" can be used anywhere you override ...
    * Instance methods
    * Class methods
    * Getter / setter methods
    * Extended object (mixin) methods
    * Methods on native objects and classes
  * A cross-platform syntax for defining getters and setters
  * A simple, powerful mechanism for binding methods to object instances as part of the method declaration
  * Built in class and object initialization

For details on how this works, read on ...

## API Definitions (APIDs)

APIs are defined using standard JS objects.  For example:

    var MyClass = joos.createClass({
      someProperty: 123,
      someMethod: function() { /* ... */ },
      someOtherMethod: function() { /* ... */}
    });

This is a common pattern in libraries like Prototype (Class.create) and Dojo (dojo.declare), and mirrors how object prototypes are defined.

But the "magic sauce" in Joos comes from it's support for modifier directives in the property names.  For example, a "Joos"-ified version of MyClass might look like this:

    var MyClass = joos.createClass({
      initialize$: function() { /* ... */ },

      $SOME_CONSTANT: 123,

      $aStaticMethod: function() { /* ... */ },

      initialize: function() { /* ... */ },

      get$someProperty: function() { /* ... */ },
      set$someProperty: function(aValue) { /* ... */ },

      bind$anEventHandler: function() { /* ... */ },

      someMethod: function() { /* ... */ },
      someOtherMethod: function() { /* ... */}
    });

The above code illustrates Joos' support for ...

  * Static initializers ("initialize$")
  * Static variables ("$SOME\_CONSTANT")
  * Static methods ("$aStaticMethod")
  * Instance initialization ("initialize")
  * Getters and setters ("get$someProperty" and "set$someProperty")
  * Declarative method binding ("bind$anEventHandler")
  * Regular instance members ("someMethod" and "someOtherMethod")

For a complete description of keys and ** APID Key Syntax and Modifiers ** below

## Joos API

### joos.createClass(_APIDefinition_)

Create a class. _APIDefinition_ is a Joos API definition object as described above.  It supports the following modifiers:
  * **initialize$** - Static initializer function.  Run once, immediately after class is created
  * **initialize** - instance initializer function.  Run once for each new instance of the class, as part of instance creation.
  * **superclass$** - Specifies the class to inherit from

Classes a "joos.createClass(_apid\_definition_)"

#### Example: Creating a class

    var MyClass = joos.createClass({
      // Define a static initializer method. This method is called once,
      // immediately after the class is created.
      initialize$: function() {
        // Invoked once MyClass is ready for use
        // this == MyClass
      },

      // Define MyClass.SOME_CONSTANT
      $SOME_CONSTANT: 'a value',

      // Define , MyClass.find()
      $find: function() {
        // this == MyClass
      }

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

#### Example: Creating a Subclass

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

### joos.extendClass(_APIDefinition_)

joos.extendClass() allows you to enhance existing classes.  This works for _any_ class, not just those created with joos.createClass.

#### Example: Extending native Array class

    joos.extendClass({
      // Define Array.SOME_CONSTANT
      $SOME_CONSTANT: 'a value',

      // Override super method to do something interesting, like filter results
      $find: function() {
        var results = this._super();
        // (filter results)
        return results;
      },

      // Override join() to change default separator
      join: function(sep) {return this._super(sep || ' - ');},

      // Define read-only "isEmpty" property.  E.g. "if (array.isEmpty) ..."
      get$isEmpty: function() {
        for (var i=0, l = this.length; i < l; i++) if (this[i] != null) return false;
        return true;
      },

      // Map function to get the results of applying iterator function to each element
      map: function(iterator) {
        var arr = [];
        for (var i=0, l = this.length; i < l; i++) arr[i] = iterator(this[i]);
        return arr;
      }
    });

### joos.extendObject(_APIDefinition_)

joos.extendObject() allows you to extend object instances in much the same way you would extend a class.  This allows you to leverage the powerful "mixin" pattern.

#### Example: Extending a DOM object

    // Define a "Collapsable" API that can be used to expand/collapse DOM elements
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

## APID Key Modifiers

As discussed above, API definitions in Joos can contain modifier directives in the object keys.  These will always take the form of "*modifier*$".  Furthermore, you're allowed to specify more than one.  For example:

  * bind$someMethod
  * get$aProperty
  * $get$aProperty (abbreviated form of static$get$aProperty)
  * $bind$someMethod
  * superclass$
  * initialize$

Joos currently supports the following APID key modifiers...

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

For convenience (and because it is somewhat of a convention) this can be abbreviated as just, "$".  E.g. "$*name*" is identical to "static$*name*"

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
