(function() {
  // Object to throw to stop enumerations
  var STOP = self.StopIteration || '__break__';

  // Use whatever method is available for querying dom elements by selector. Why?
  // Because this functionality is in every damn library out there, not to mention
  // the native support for it.
  //
  // Your library not in here? Fine. Just do "joos.query = <your function here>"
  var query = self.Sizzle     // Sizzle - sizzlejs.com
              || self.$$      // Prototype - www.prototypejs.org, MooTools - mootools.net
              || self.jQuery // jQuery - jquery.com
              || (self.Ext && self.Ext.query) // Ext - www.extjs.com
              || (self.dojo && self.dojo.query) // Dojo - dojotoolkit.org
              || function() {
                throw new Error('No query method found.  Maybe consider including Sizzle(http://sizzlejs.com/)?');
              };

  /** Array test */
  function isArray(o) {return o && o.concat && o.join;}

  /**
  * Convert an object to an array.  This is guaranteed to return an array object.
  * Conversion is done as follows:
  * - If obj is a native JS array, returns obj
  * - If obj is array-like, returns an array copy of obj
  * - If obj is an Object, returns an array whose contents depend on 'what', as follows:
  *   - what == 2: array of [key, value] pairs
  *   - what == 1: array of keys
  *   - otherwise: array of values
  * - Otherwise returns [obj]
  */
  function toArray(obj, what) {
    if (obj.concat && obj.join) return obj;
    if (typeof(obj) != 'object') return [obj];
    var arr = [], l = obj.length;
    if (l == undefined) {
      for (var i = 0; i < l; i++) arr[i] = obj[i];
    } else {
      for (var k in obj) arr[i] = !what ? obj[k] : (what == 1 ? k : [k, obj[k]]);
    }
    return arr;
  }

  /**
  * General iteration support.  Allows ES5 'forEach'-style iteration on a variety
  * of object types.  Specifically:
  * - If obj defines forEach(): Calls forEach()
  * - If obj is a DOM element: Iterates through children
  * - If obj defines 'length': Iterates over indexes ("for (i=0;i<length;i++) ...")
  * - ... otherwise: Iterates over key-values
  *
  * Iterations can be interrupted by throwing joos.STOP (Synonomous with
  * "throw StopIteration" on FF)
  *
  * Prototype: provides index & key arguments to enumerators.  Enumerates dom children.
  * jQuery: arguments are inconsistent with standard 'forEach' enumeration support in arrays.
  */
  function each(obj, iterator, context) {
    if (!obj) return;
    try {
      if (obj.forEach) return obj.forEach(iterator, context);
      if (obj.childNodes) obj = toArray(obj.childNodes);
      if (obj.length) {
        // Iterate through array-like objects (works for Strings on *some* browsers)
        for (var l = obj.length, i = 0; i < l; i++) iterator.call(context, obj[i], i);
        return;
      }
      // Iterate through object properties
      for (var k in obj) iterator.call(context, obj[k], k);
    } catch (e) {
      if (e != STOP) throw e;
    }
    return obj;
  };

  function keys(obj) {
    var ks = [];
    for (var k in obj) ks[ks.length] = k;
    return ks;
  }

  function values(obj) {
    var ks = [];
    for (var k in obj) ks[ks.length] = obj[k];
    return ks;
  }

  function $(el) {
    el = (el && el.nodeType) ? el : document.getElementById(el);
    //if (el) el = el._joosEl || (el._joosEl = new Element(el));
    return el;
  }

  function create(name, className, html) {
    var el = document.createElement(name);
    if (className) el.className = className;
    if (html) el.innerHTML = html;
    return el;
  }

  function remove(el) {
    el.parentNode.removeChild(el);
    return el;
  }

  function clear(el) {
    joos.each(el, function(cel) {el.removeChild(cel);}, el);
    return el;
  }

  function clone(el) {
    return el.cloneNode(true);
  }

  function offsetTo(parent, child) {
    var offset = {left: 0, top:0};
    while (child && child != parent) {
      offset.left += child.offsetLeft;
      offset.top += child.offsetTop;
      child = child.offsetParent;
    }
    return offset;
  }

  /**
  * Convert any value into a css pixel dimension. e.g. "123.4" -> "123px".
  * Non-number-like values convert to '0px'
  */
  function px(x) {return (x|0) + 'px';}


  var Template = joos.createClass({
    $byId: {},

    initialize: function(el) {
      el = this.el = joos.$(el);
      if (!el) throw new Error('Element,"' + el + '", not found');
      Template.byId[el.id] = this;
      el.id = '';
      remove(el);
    },

    clone: function() {
      return clone(this.el, true);
    }
  });

  function template(el) {
    if (!Template.byId[el]) new Template(el);
    return Template.byId[el];
  }

  joos.extend(joos, {
    $: $,
    query: query,
    $STOP: STOP,
    isArray: isArray,
    toArray: toArray,
    each: each,
    keys: keys,
    values: values,
    create: create,
    remove: remove,
    clear: clear,
    clone: clone,
    offsetTo: offsetTo,
    px: px,
    template: template
  });

  // Stub out console so we can call it w/out erroring out
  if (!self.console) {
    self.console = {};
    joos.each('assert count debug dir dirxml error group groupEnd info log profile profileEnd profiles time timeEnd trace warn'.split(/\s+/), function(k) {console[k] = joos.nilf;});
  };
})();
