(function() {
  function nilf() {}

  window.DragSession = Class.create();

  Object.extend(DragSession, {
    SLOP: 2,

  DragSession.addMethods({
    onClick: nilf,
    onStart: nilf,
    onMove: nilf,
    onStop: nilf,
    onAbort: nilf,
    onDone: nilf,

    initialize: function(e, doc) {
      zen.bind(this, '#_handleEvent');

      if (DragSession.currentSession) {
        DragSession.currentSession.abort();
      }

      this._doc = doc || document;

      this._handleEvent(e);

      // Activate handlers
      this._activate(true);

      e.stop();

      /**
       * @var {static DragSession} currentSession The currently active drag session.
       */
      DragSession.currentSession = this;
    },

    /**
     * Activate the session by registering/unregistering event handlers
     */
    _activate: function(flag) {
      var f = flag ? Event.observe : Event.stopObserving;
      f(this._doc, 'mousemove', this._handleEvent, true);
      f(this._doc, 'mouseup', this._handleEvent, true);
      f(this._doc, 'keyup', this._handleEvent, true);
    },

    /**
     * Set x and y properties to the desired coordinates based on the event.
     * Provided as a hook for subclasses/instances that need/want to do event
     * coordinate transformations
     */
    _copyEventCoords: function(e) {
      /** @var {Number} ? Absolute X of current event */
      this.x = e.pointerX();

      /** @var {Number} ? Absolute Y of current event */
      this.y = e.pointerY();
    },

    /**
     * All-in-one event handler for managing a drag session
     */
    _handleEvent: function(e) {
      this._copyEventCoords(e);

      if (e.type == 'mousedown') {
        /** @var {Number} ? Absolute X of initial mouse down */
        this.xStart = this.x;

        /** @var {Number} ? Absolute Y of initial mouse down */
        this.yStart = this.y;
      }

      /** @var {Number} ? X-coord relative to initial mouse down */
      this.dx = this.x - this.xStart;

      /** @var {Number} ? Y-coord relative to initial mouse down */
      this.dy = this.y - this.yStart;

      switch (e.type) {
        case 'mousemove':
          if (!this._dragging) {
            // Sloppy click?
            if (this.dx*this.dx + this.dy*this.dy >=
              DragSession.SLOP*DragSession.SLOP) {
              this._dragging = true;
              this.onStart(this, e);
            }
          } else {
            this.onMove(this, e);
          }
          break;
        case 'mouseup':
          if (!this._dragging) {
            this.onClick(this, e);
          } else {
            this.stop();
          }
          this._stop();
          break;
        case 'keyup':
          if (e.keyCode != Event.KEY_ESC) return;
          this.abort();
          break;
        default:
          return;
      }

      e.stop();
    },

    /**
     * Stop the drag session
     */
    _stop: function(abort) {
      DragSession.currentSession = null;

      // Deactivate handlers
      this._activate(false);

      if (this._dragging) {
        if (abort) {
          this.onAbort(this);
        } else {
          this.onStop(this);
        }
        this.onDone(this);
      }
    },

    /**
     * Fire the onStop event and stop the drag session.
     *
     * @function stop
     */
    stop: function() {
      this._stop();
    },

    /**
     * Fire the onAbort event and stop the drag session.
     *
     * @function abort
     */
    abort: function() {
      this._stop(true);
    }
  });
})();
