# joos == "OO in JS"

"joos" is a compact library (< 2KB minified+gzip'ed) that provides a clean, powerful, consistent, approach to creating classes and other OO patterns in JavaScript.

## Class creation
Classes are created with "joos.createClass(apid)", where 'apid' is an API Definition (APID) object.  These objects can 

Here's a simple class that demonstrates just some of the features of joos:

    var MyClass = joos.createClass({
      superclass$: SomeOtherClass,

      // Define MyClass.SOME_CONSTANT
      $SOME_CONSTANT: 'a value',


      // Define a static initializer method. This method is called once, immediately
      // after the class is created.
      initialize$: function() {
        // (function implementation)
      },

      // Define a static initializer method. This method is called once, immediately
      // after the class is created.
      initialize: function() {
        // (function implementation)
      }

      // API Definition goes here
    });

