(function() {
  /**
   * joos.Animation provides a framework for  animation support.  It is not (yet) a
   * super-friendly API but, rather, is designed to provide a powerful
   * foundation upon which to build.
   *
   * In most cases, there's no need for you to create your own Animation
   * instance.  Instead, just use the default instance, 'joos.anim'
   */
  joos.Animation = joos.createClass({
    /* Map of easing functions for manipulating progress.  Each function should
     * take a value 'x' that represents the progress of the animation (0 =
     * start of animation, 1 = end of animation).  The returned value should
     * generally return a similar progress value (i.e. between 0 and 1).  This
     * is not mandatory, of course, but values outside this range may produce
     * unexpected results, depending on what effect they are applied to
     *
     * You can see visualizations of these functions here:
     * http://fooplot.com/index.php?&y0=sin%28x*pi/2%29&y1=.5-cos%28x*pi%29*.5&y2=sin%28x*pi%29%20%2B%20x*x*x&y3=&y4=x&igx=1&igy=1&igl=1&igs=1&iax=1&ila=1&xmin=-0.5&xmax=1.5&ymin=-0.5&ymax=1.5
     */
    $EASINGS: {
      // Start rapidly, eases into finish
      sin: function(x) {return Math.sin(x*Math.PI/2);},

      // Eases off start, and into finish, with rapid progress in the middle
      cos: function(x) {return .5 - Math.cos(x*Math.PI)*.5;},

      // Rapid start, with bounch past finish, and returns to finish.
      bounce: function(x) {return Math.sin(x*Math.PI) + x*x*x;},

      // Random jitter that settles down to 1
      jitter: function(x) {return x + (1-x)*Math.random();},

      // Default - 1:1 mapping
      linear: function(x) {return x;}
    },

    /**
     * Takes an optional effects params object.  See joos.Animation#add for
     * more info
     */
    initialize: function(params) {
      this.effects = [];
      if (params) this.add(params);
    },


    /**
     * Add an effect to the animation. The following parameters are supported:
     *
     * block:       If true, blocks until all previously added effects have finished
     * context:     If specified defines a context object for the effect (may
     *              be any object).  Only one effect is allowed per context.
     *              If a context already has an effect assigned to it, that
     *              effect is replaced.
     * duration:    Effect duration, in milliseconds. (default = 500)
     * easing:
     * finish:      If true, effect is immediately finished. onProgress and
     *              onFinish will both be called exactly once.
     * from:        The initial value for progress calculation. Default = 0.
     * to:          The final value for progress calculation. Default = 1.
     * onFinish:    Callback function invoked when an effect finishes
     * onProgress:  Callback function invoked for each step in the animation sequence
     * onStart:     Callback function invoked immediately prior to the effect starting
     */
    add: function(params) {
      var context = params.context;
      var effect = context && context._effect;
      if (!effect) {
        effect = {};
        if (context) context._effect = effect;
        this.effects.push(effect);
      }

      // Set/replace params for effect
      effect.params = params;
      delete effect.t0;

      if (!this._timer) {
        this._timer = setTimeout(this._step, 0);
      }
    },

    /**
     * Shortcut for creating a blocking effect that finishes immediately.
     * Useful when you want to instruct the animation to finish a set of added
     * effects before beginning another set of effects.  E.g.
     *
     * // Start two simultaneous effects
     * joos.anim.add(effect1);
     * joos.anim.add(effect2);
     *
     * // Block until effect1 and effect2 have finished
     * joos.anim.block(myCallback);
     *
     * // These effects will start after effect1 and effect2 have finished
     * joos.anim.add(effect3);
     * joos.anim.add(effect4);
     */
    block: function(onFinish) {
      this.add({block: true, finish: true, onFinish: onFinish});
    },

    /**
     * Private animation stepper method.
     */
    bind$_step: function() {
      this._timer = null;

      var activeEffects = false;
      var fx = this.effects, l = fx.length;
      var easings = joos.Animation.EASINGS;

      var now = new Date().getTime();

      // Process each effect
      for (var i = 0; i < l; i++) {
        var effect = fx[i], params = effect.params;

        // If this effect is blocked until previous effects have finished, stop processing
        if (params.block && activeEffects) break;

        // Okay, there's at least one effect still active
        activeEffects = true;

        // Calculate the progress for this effect
        if (params.onProgress) {
          if (!effect.t0) {
            effect.t0 = now;
            if (params.onStart) params.onStart(params);
          }
          var dt = now - effect.t0;
          var progress = params.finish ? 999 : dt / (params.duration || 500);
          effect.animating = progress <= 1.0;
          if (!effect.animating) progress = 1;
          var easing = params.easing ? easings[params.easing] : easings.linear;

          var from = params.from || 0, to = params.to || 1;
          progress = from + (to-from)*easing(progress);

          // Invoke effect callback
          if (params.onProgress) params.onProgress(progress, params);
        }

        // If this effect is done ...
        if (!effect.animating) {
          // Call complete callback
          if (params.onFinish) params.onFinish(params);

          // Remove the effect
          if (params.context) delete params.context._effect;
          fx[i] = null;
        }
      }

      // Clean up any completed (nulled out) effects
      joos.thinArray(fx);

      // Keep going(?)
      if (fx.length > 0) {
        // We don't use setInterval because it has a nasty tendency to queue up
        // calls.  Using setTimeout insures that we don't schedule anything
        // until after the current step has completed
        this._timer = setTimeout(this._step, 20);
      }
    }
  });

  // Create the default animation object
  joos.anim = new joos.Animation();
})();
