# joos Design Notes

Various technical notes related to the joos OO lib...

## '$' delimited object keys

joos is unique among javascript libraries in it's use of '%'-delimited object keys.  "static$get$someMethod" is likely to throw some people for a loop at first glance.  However my hope is that once people understand the fairly simple logic behind this, they'll quickly embrace the syntax.

And that logic is this:  Pretty much every language except javascript allows for modifiers when declaring API members. "static" , "private", "public", "const", are just a few of the ones that are commonplace.  joos is simply introducing it's own set of modifiers.  But instead of using a space (' ') to separate them, as other languages do, joos uses the '$' character.  This is necessary to conform with the existing javascript syntax.  (although... APID keys could be quoted I suppose, to allow for code like:

  "static get someMethod": function() {...},
  "bind otherMethod": function() {...},

... and so on.  But it's not clear that this is any more intuitive.  So '$' it is for now.

## bind$-able methods and subclasses

The use of bind$ is (IMHO) a pretty cool feature of joos.  The ability to specify that methods should be bound to object instances, as part part of the method declaration makes for simpler, more readable code.

Support for this is implemented by maintaining a list of bound method names (in _class_.\__meta.binds), which is then used to perform the binding in the class constructor, prior to calling the initialize() method.

In simple cases, this works well, however when dealing with subclasses, it becomes necessary to insure this list of method binds is inherited by subclasses.  To accomplish this, we use the (private) \_prototypify method to create a binds object for the subclass that inherits all of the bind properties of it's parent class.  It's not complicated, but at first glance, the code is a little un-intuitive.

## "this._super"-style inheritance

One of the biggest buggaboos with JavaScript development is figuring out how to do inheritance.  There are a variety of approaches, each with their own pros and cons.  The tradeoffs are, generally between niceness of the syntactic sugar, maintainability, and performance.

The approach joos uses is a heavily modified version of John Resig's implementation, documented here: http://ejohn.org/blog/simple-javascript-inheritance/

The syntax is reasonably intuitive, the code is maintainable (it doesn't break if you rename the supermethod, for example), and it is more performant than Prototype's "$super" approach.

## "getter/setter" wierdness

I ran into some interesting issues on Firefox when creating classes that had only a getter or only a setter.  Because of this, getter/setters are processed in pairs when building the api.  Unfortunately I forgot what the exact problem was I ran into, so can't precisely document this here.  I'll reproduce this at some point and update this section once I have a remember just what the hell the problem was. :)

## Browser platforms

joos will work on pretty much all browsers.  However not *all* features of joos will work.  For example, getter/setter support is only available in newer javascript engines.

[TODO: add table of feature .vs. browser support here]
