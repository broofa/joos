(function() {
  var CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');

  joos.extendObject(Math, {
    /**
      * Get a random integer
      *
      * @function {static Number} ?
      * @paramset Specify maximum only
      * @param {Number} max
      * @paramset Specify maximum and minimum
      * @param {Number} min
      * @param {Number} max
      */
    rnd: function(m, n) {
      if (arguments.length < 2) {n = m; m = 0;}
      return Math.floor(m + (n - m)*Math.random());
    },

    uuid: function () {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
        }).toUpperCase();
      }
  });
})();
