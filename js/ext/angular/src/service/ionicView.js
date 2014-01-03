angular.module('ionic.service.view', ['ui.router'])


.run(     ['$rootScope', '$state', '$window', '$document', 
  function( $rootScope,   $state,   $window,   $document) {
    
  // init the variables that keep track of the view history
  $rootScope.$viewHistory = {
    histories: { root: { historyId: 'root', parentHistoryId: null, stack: [] } },
    backView: null,
    forwardView: null,
    currentView: null,
    navDirection: null
  };

  $rootScope.$on('viewState.changeHistory', function(e, data) {
    if(!data) return;

    var hist = (data.historyId ? $rootScope.$viewHistory.histories[ data.historyId ] : null );
    if(hist) {

      if(hist.stack.length) {
        var view = hist.stack[ hist.stack.length - 1 ];
        view.go();
        return;
      }
    }

    if(!data.url && data.uiSref) {
      data.url = $state.href(data.uiSref);
    }
    
    if(data.url &&
       data.url !== $window.location.href && 
       data.url !== $window.location.hash && 
       data.url !== $window.location.pathname) {
      $window.location.href = data.url;
    }

  });

  $rootScope.$on('viewState.viewShown', function(e, data) {
    if(data && data.title) {
      document.title = data.title;
    }
  });

}])

.factory('ViewService', ['$rootScope', '$state', '$window', '$window', 
                function( $rootScope,   $state,   $window,   $window) {

  var View = function(){};
  View.prototype.initialize = function(data) {
    for(var name in data) {
      this[name] = data[name];
    }
  };
  View.prototype.go = function() {
    if(this.url &&
       this.url !== $window.location.href &&
       this.url !== $window.location.hash &&
       this.url !== $window.location.pathname) {

      if($rootScope.$viewHistory.backView === this) {
        return $window.history.go(-1);
      } else if($rootScope.$viewHistory.forwardView === this) {
        return $window.history.go(1);
      }
    }

    $state.go(this.stateName, this.stateParams);
  };

  return {

    register: function(scope) {
      var viewHistory = $rootScope.$viewHistory;
      var currentStateId = this.getCurrentStateId();
      var hist = this._getHistory(scope);
      var currentView = viewHistory.currentView;
      var backView = viewHistory.backView;
      var forwardView = viewHistory.forwardView;
      viewHistory.navDirection = null;

      if(currentView && currentView.stateId === currentStateId) {
        // do nothing if its the same stateId
        if(hist.historyId !== currentView.historyId) {
          var oldHist = viewHistory.histories[currentView.historyId];
          if(oldHist && oldHist.stack.length >= currentView.index + 1) {
            oldHist.stack.splice(currentView.index, 1);
          }
        } else {
          return;
        }
      }

      if(backView && backView.stateId === currentStateId) {
        // they went back one, set the old current view as a forward view
        scope.$viewId = backView.viewId;
        if(backView.historyId === currentView.historyId) {
          viewHistory.navDirection = 'back';
        }

      } else if(forwardView && forwardView.stateId === currentStateId) {
        // they went to the forward one, set the forward view to no longer a forward view
        scope.$viewId = forwardView.viewId;
        if(forwardView.historyId === currentView.historyId) {
          viewHistory.navDirection = 'forward';
        }

        var parentHistory = this._getParentHistoryObj(scope);
        if(forwardView.historyId && parentHistory.scope) {
          // if a history has already been created then delete it to keep things tidy
          parentHistory.scope.$historyId = forwardView.historyId;
        }

      } else {
        if(currentView && forwardView && currentView.stateId !== forwardView.stateId) {
          // they navigated to a view, and the stack has a forward view
          // but where they navigated wasn't the forward view, so remove existing forward stack
          hist.stack.splice(forwardView.index);
        }

        // set a new unique viewId
        scope.$viewId = 'v' + Math.round(Math.random() * 9999999999);

        if(currentView) {
          // set the forward view if there is a current view (ie: if its not the first view)
          currentView.forwardViewId = scope.$viewId;
        }

        viewHistory.navDirection = 'forward';

        // add the new view to the stack
        var newView = new View();
        newView.initialize({ 
          viewId: scope.$viewId,
          index: hist.stack.length,
          historyId: hist.historyId,
          backViewId: (currentView && currentView.viewId ? currentView.viewId : null),
          forwardViewId: null,
          stateId: currentStateId,
          stateName: this.getCurrentStateName(),
          stateParams: this.getCurrentStateParams(),
          url: $window.location.href
        })
        hist.stack.push(newView);

        viewHistory.histories[scope.$viewId] = hist.stack[ hist.stack.length - 1];
      }

      viewHistory.currentView = this._getView(scope.$viewId);
      viewHistory.backView = this._getBackView(viewHistory.currentView);
      viewHistory.forwardView = this._getForwardView(viewHistory.currentView);
    },

    registerHistory: function(scope) {
      scope.$historyId = 'h' + Math.round(Math.random() * 9999999999);
    },

    getCurrentView: function() {
      return $rootScope.$viewHistory.currentView;
    },

    getBackView: function() {
      return $rootScope.$viewHistory.backView;
    },

    getForwardView: function() {
      return $rootScope.$viewHistory.forwardView;
    },

    getNavDirection: function() {
      return $rootScope.$viewHistory.navDirection;
    },

    getCurrentStateName: function() {
      return ($state && $state.current ? $state.current.name : null);
    },

    isCurrentStateUiView: function(uiView) {
      return ($state && 
              $state.current && 
              $state.current.views && 
              $state.current.views[uiView] ? true : false);
    },

    getCurrentStateParams: function() {
      var rtn;
      if ($state && $state.params) {
        for(var key in $state.params) {
          if($state.params.hasOwnProperty(key)) {
            rtn = rtn || {};
            rtn[key] = $state.params[key];
          }
        }
      }
      return rtn;
    },

    getCurrentStateId: function() {
      var id;
      if($state && $state.current && $state.current.name) {
        id = $state.current.name;
        if($state.params) {
          for(var key in $state.params) {
            if($state.params.hasOwnProperty(key) && $state.params[key]) {
              id += "_" + key + "=" + $state.params[key];
            }
          }
        }
        return id;
      }
      // if something goes wrong make sure its got a unique stateId
      return 'r' + Math.round(Math.random() * 9999999);
    },

    _getView: function(viewId) {
      return (viewId ? $rootScope.$viewHistory.histories[ viewId ] : null );
    },

    _getBackView: function(view) {
      return (view ? this._getView(view.backViewId) : null );
    },

    _getForwardView: function(view) {
      return (view ? this._getView(view.forwardViewId) : null );
    },

    _getHistory: function(scope) {
      var histObj = this._getParentHistoryObj(scope);

      if( !$rootScope.$viewHistory.histories[ histObj.historyId ] ) {
        // this history object exists in parent scope, but doesn't
        // exist in the history data yet
        $rootScope.$viewHistory.histories[ histObj.historyId ] = { 
          historyId: histObj.historyId, 
          parentHistoryId: this._getParentHistoryObj(histObj.scope).historyId,
          stack: [] 
        };
      }

      return $rootScope.$viewHistory.histories[ histObj.historyId ];
    },

    _getParentHistoryObj: function(scope) {
      if(scope) {
        var parentScope = scope.$parent;
        while(parentScope) {
          if(parentScope.hasOwnProperty('$historyId')) {
            // this parent scope has a historyId
            return { historyId: parentScope.$historyId, scope: parentScope };
          }
          // nothing found keep climbing up
          parentScope = parentScope.$parent;
        }
      }
      // no history for for the parent, use the root
      return { historyId: 'root', scope: $rootScope };
    }

  };
}]);
