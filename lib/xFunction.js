(function() {
  joos.extendClass(Function, {
    name$: 'Function (joos)',

    run: function(aName) {
      if (!this._runner) {
        var runnable = this;
        this._runName = aName || 'anonymous thread function';
        this._runner = function() {
          var again = !runnable._runTimer;
          try {
            again = again || runnable();
          } catch (e) {
            throw e;
          } finally {
            runnable._running = !!again;
          }

          if (again) {
            runnable._runTimer = setTimeout(runnable._runner, 0);
          } else {
            runnable.stopRunning();

            if (runnable.onStop) runnable.onStop();
          }
        };
      }

      if (!this._runTimer) this._runner();
    },

    stopRunning: function() {
      if (this._runTimer) {
        clearTimeout(this._runTimer);
        delete this._runTimer;
      }
    },

    lazy: function(ms, context) {
      var f = this, lz = f._lz;
      if (ms < 0) {
        delete f._lz;
      } else if (!ms && lz) {
        // Aready queued? Do nothing
      } else {
        if (!f._lz) lz = f._lz = {
          invoker: function() {
            try {
              f.call(lz.context);
            } catch (e) {
              throw e;
            } finally {
              delete f._lz;
            }
          }
        };

        if (lz.timer) clearTimeout(lz.timer);

        lz.delay = ms || 0;
        lz.context = context;
        lz.timer = setTimeout(lz.invoker, lz.delay);
      }

      return f;
    }
  });
})();
