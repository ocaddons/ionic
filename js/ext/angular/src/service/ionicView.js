angular.module('ionic.service.view', ['ui.router'])

.config(function($stateProvider, $urlRouterProvider) {

  // $stateProvider.$get =
  //   [        '$location', '$rootScope', '$injector',
  //   function ($location,   $rootScope,   $injector) {
  //     // TODO: Optimize groups of rules with non-empty prefix into some sort of decision tree
  //     function update(evt) {
  //       if (evt && evt.defaultPrevented) return;
  //       function check(rule) {
  //         var handled = rule($injector, $location);
  //         if (handled) {
  //           if (isString(handled)) $location.replace().url(handled);
  //           return true;
  //         }
  //         return false;
  //       }
  //       var n=rules.length, i;
  //       for (i=0; i<n; i++) {
  //         if (check(rules[i])) return;
  //       }
  //       // always check otherwise last to allow dynamic updates to the set of rules
  //       if (otherwise) check(otherwise);
  //     }

  //     $rootScope.$on('$locationChangeSuccess', update);

  //     return {
  //       sync: function () {
  //         update();
  //       }
  //     };
  //   }];

  // $stateProvider.state('viewmanager', {
  //   url: '/view-:id',
  //   controller: function($stateParams) {
  //     console.log($stateParams.id)
  //   }
  // });

  //$urlRouterProvider.otherwise("/sign-in");

})

.run(['$rootScope', '$state', function($rootScope, $state) {
  // init the variables that keep track of the view history
  $rootScope.$viewHistory = {
    histories: { root: { historyId: 'root', parentHistoryId: null, stack: [] } },
    backView: null,
    forwardView: null,
    currentView: null
  };

  // $rootScope.$on('$locationChangeSuccess', function(evt){
  //   console.log('own $locationChangeSuccess')
  // });

  // $rootScope.$on('$stateChangeSuccess', function(evt){
  //   console.log('own $stateChangeSuccess')
  // });

  // $rootScope.$on('$stateChangeStart', function(evt){
  //   console.log('own $stateChangeStart')
  // });

  // $rootScope.$on('$viewContentLoading', function(evt){
  //   console.log('own $viewContentLoading')
  // });

  // $rootScope.$on('$viewContentLoaded', function(evt){
  //   console.log('own $viewContentLoaded')
  // });

  $rootScope.$on('viewState.viewShown', function(e, data) {
    
    //console.log('viewState.viewShown', data.title);

    if(data.href) {
      window.location.href = data.href;
    } else if(data.uiSref) {
      window.location.href = $state.href(data.uiSref);
    }

    if(data.title) {
      document.title = data.title;
    }

  });

  // var doNotify = true;

  // $state._transitionTo = $state.transitionTo;

  //   $state.transitionTo = function transitionTo(to, toParams, options) {
  //     options.notify = doNotify;

  //     var from = $state.$current;
  //     var fromParams = $state.params;

  //     if(!doNotify) {
  //       evt = $rootScope.$broadcast('$stateChangeStart');
  //       if (evt.defaultPrevented) {
  //         syncUrl();
  //         return TransitionPrevented;
  //       }
  //     }

  //     var transition = $state._transitionTo(to, toParams, options);

  //     if(!doNotify) {
  //       $rootScope.$broadcast('$stateChangeSuccess', $state.$current.self, $state.params, from.self, fromParams); 
  //     }

  //     doNotify = false;

  //     return transition;
  //   };



}])

.factory('ViewService', ['$rootScope', '$state', function($rootScope, $state) {
  return {

    register: function($scope) {
      var currentStateId = this.getCurrentStateId();
      var hist = this._getHistory($scope);
      var currentView = $rootScope.$viewHistory.currentView;
      var backView = $rootScope.$viewHistory.backView;
      var forwardView = $rootScope.$viewHistory.forwardView;

      if(currentView && currentView.stateId === currentStateId) {
        // do nothing if its the same stateId
        return;
      }

      if(backView && backView.stateId === currentStateId) {
        // they went back one, set the old current view as a forward view
        $scope.$viewId = backView.viewId;

      } else if(forwardView && forwardView.stateId === currentStateId) {
        // they went to the forward one, set the forward view to no longer a forward view
        $scope.$viewId = forwardView.viewId;

        var parentHistory = this._getParentHistoryObj($scope);
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
        $scope.$viewId = 'v' + Math.round(Math.random() * 9999999999);

        if(currentView) {
          // set the forward view if there is a current view (ie: if its not the first view)
          currentView.forwardViewId = $scope.$viewId;
        }

        // add the new view to the stack
        hist.stack.push({ 
          viewId: $scope.$viewId,
          index: hist.stack.length,
          historyId: hist.historyId,
          backViewId: (currentView && currentView.viewId ? currentView.viewId : null),
          forwardViewId: null,
          stateId: currentStateId,
          stateName: this.getCurrentStateName(),
          stateParams: this.getCurrentStateParams()
        });

        $rootScope.$viewHistory.histories[$scope.$viewId] = hist.stack[ hist.stack.length - 1];
      }

      $rootScope.$viewHistory.currentView = this._getView($scope.$viewId);
      $rootScope.$viewHistory.backView = this._getBackView($rootScope.$viewHistory.currentView);
      $rootScope.$viewHistory.forwardView = this._getForwardView($rootScope.$viewHistory.currentView);
    },

    registerHistory: function($scope) {
      $scope.$historyId = 'h' + Math.round(Math.random() * 9999999999);
    },

    getCurrentView: function() {
      return this._cloneView( $rootScope.$viewHistory.currentView );
    },

    getBackView: function() {
      return this._cloneView( $rootScope.$viewHistory.backView );
    },

    getForwardView: function() {
      return this._cloneView( $rootScope.$viewHistory.forwardView );
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
      return 'rndState' + Math.round(Math.random() * 9999999);
    },

    _getView: function(viewId) {
      return (viewId ? $rootScope.$viewHistory.histories[ viewId ] : null );
    },

    _getBackView: function(view) {
      return (view ? this._cloneView( this._getView(view.backViewId) ) : null );
    },

    _getForwardView: function(view) {
      return (view ? this._cloneView( this._getView(view.forwardViewId) ) : null );
    },

    _getHistory: function($scope) {
      var histObj = this._getParentHistoryObj($scope);

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

    _getParentHistoryObj: function($scope) {
      if($scope) {
        var parentScope = $scope.$parent;
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
    },

    _cloneView: function(view) {
      // just to ensure no cicular structures
      return (view ? {
        viewId: view.viewId,
        index: view.index,
        historyId: view.historyId,
        backViewId: view.backViewId,
        forwardViewId: view.forwardViewId,
        stateId: view.stateId,
        stateName: view.stateName,
        stateParams: view.stateParams
      } : null);
    }

  };
}]);

ngViewFactory.$inject = ['$state', '$anchorScroll', '$compile', '$controller', '$animate'];
function ngViewFactory(   $state,   $anchorScroll,   $compile,   $controller,   $animate) {
  var viewIsUpdating = false;

  var directive = {
    restrict: 'ECA',
    terminal: true,
    priority: 2000,
    transclude: true,
    link: function(scope, $element, attr, ctrl, $transclude) {
        var currentScope,
            currentElement,
            autoScrollExp = attr.autoscroll,
            onloadExp = attr.onload || '',
            viewLocals,
            name = attr[directive.name] || attr.name || '',
            anchor = angular.element(document.createComment(' ui-view '));

        $element.prepend(anchor);

        var parent = $element.parent().inheritedData('$uiView');
        if (name.indexOf('@') < 0) name = name + '@' + (parent ? parent.state.name : '');
        var view = { name: name, state: null, animation: null };
        $element.data('$uiView', view);

        console.log(attr.$attr.animation)
        if(attr.animation) {
          view.animation = attr.animation;
        } else if(parent && parent.animation) {
          view.animation = parent.animation;
        }

        if(view.animation) {
          $element[0].classList.add(view.animation);
        }

        var eventHook = function() {
          if (viewIsUpdating) return;
          viewIsUpdating = true;

          try { update(true); } catch (e) {
            viewIsUpdating = false;
            throw e;
          }
          viewIsUpdating = false;
        };

        scope.$on('$stateChangeSuccess', eventHook);
        scope.$on('$viewContentLoading', eventHook);
        update();

        function cleanupLastView() {
          if (currentScope) {
            currentScope.$destroy();
            currentScope = null;
          }
          if(currentElement) {
            $animate.leave(currentElement);
            currentElement = null;
          }
        }

        function update(doAnimate) {
          var locals = $state.$current && $state.$current.locals[name],
              template = (locals && locals.$template ? locals.$template.trim() : null);
          if (locals === viewLocals) return; // nothing to do

          if (template) {
            cleanupLastView();

            currentElement = angular.element(template);

            $animate.enter(currentElement, null, anchor, function onUiViewEnter () {
              console.log('onUiViewEnter');
              if (angular.isDefined(autoScrollExp)
                && (!autoScrollExp || scope.$eval(autoScrollExp))) {
                $anchorScroll();
              }
            });

            viewLocals = locals;
            view.state = locals.$$state;

            var link = $compile(currentElement),
                current = $state.current;

            viewScope = current.scope = scope.$new();

            if (locals.$$controller) {
              locals.$scope = viewScope;
              var controller = $controller(locals.$$controller, locals);
              if (current.controllerAs) {
                viewScope[current.controllerAs] = controller;
              }
              currentElement.data('$ngControllerController', controller);
              currentElement.children().data('$ngControllerController', controller);
            }

            link(viewScope);
            viewScope.$emit('$viewContentLoaded');
            viewScope.$eval(onloadExp);
          } else {
            cleanupLastView();
          }
        }
    }
  };
  return directive;
}
angular.module('ui.router.state').directive('uiView', ngViewFactory);


// $ViewDirective.$inject = ['$state', '$compile', '$controller', '$injector', '$anchorScroll', '$document'];
// function $ViewDirective(   $state,   $compile,   $controller,   $injector,   $anchorScroll,   $document) {
  
//   var viewIsUpdating = false;
//   var $animate = $injector.has('$animate') ? $injector.get('$animate') : null;

//   var removeAngularMarkup = function(ele) {
//     var x, tmp = [];
//     for(x=0; x<ele.classList.length; x++) {
//       if( ele.classList[x].indexOf('ng-') !== 0 ) {
//         tmp.push(ele.classList[x]);
//       }
//     }
//     if(tmp.length) {
//       ele.className = tmp.join(' ');
//     }
//     tmp = [];
//     for(x=0; x<ele.attributes.length; x++) {
//       if(ele.attributes[x].name.indexOf('ng-') === 0) {
//         tmp.push(ele.attributes[x].name);
//       }
//     }
//     for(x=0; x<tmp.length; x++) {
//       ele.removeAttribute(tmp[x]);
//     }
//     for(x=0; x<ele.children.length; x++) {
//       removeAngularMarkup(ele.children[x]);
//     }
//   }

//   var directive = {
//     restrict: 'ECA',
//     terminal: true,
//     priority: 2000, // Using a higher priority and terminal=true overrides the default ui-view
//     transclude: true,
//     compile: function (element, attr, transclude) {
//       return function(scope, element, attr) {
//         var viewScope, viewLocals,
//             name = attr[directive.name] || attr.name || '',
//             onloadExp = attr.onload || '',
//             initialView = transclude(scope);


//         // Put back the compiled initial view
//         element.append(initialView);

//         // Find the details of the parent view directive (if any) and use it
//         // to derive our own qualified view name, then hang our own details
//         // off the DOM so child directives can find it.
//         var parent = element.parent().inheritedData('$uiView');
//         if (name.indexOf('@') < 0) name  = name + '@' + (parent ? parent.state.name : '');
//         var view = { name: name, state: null };
//         element.data('$uiView', view);

//         var eventHook = function() {
//           console.log('eventHook', viewIsUpdating)
//           if (viewIsUpdating) return;
//           viewIsUpdating = true;

//           try { updateView(true); } catch (e) {
//             viewIsUpdating = false;
//             throw e;
//           }
//           viewIsUpdating = false;
//         };

//         scope.$on('$stateChangeSuccess', eventHook);
//         scope.$on('$viewContentLoading', eventHook);
//         updateView(false);

//         function updateView(doAnimate) {
//           var locals = $state.$current && $state.$current.locals[name];
//           if (locals === viewLocals) return; // nothing to do
//           console.log('updateView')

//           // Destroy previous view scope
//           if (viewScope) {
//             viewScope.$destroy();
//             viewScope = null;
//           }

//           if (!locals) {
//             viewLocals = null;
//             view.state = null;
//             return;
//           }

//           viewLocals = locals;
//           view.state = locals.$$state;

//           var existingHtml = '';
//           var newHtml = (locals.$template ? locals.$template.trim() : '');

//           if($animate && doAnimate) {
//             newHtml = (newHtml !== '' ? newHtml : '<div></div>');

//             var elementChildren = element.children();
//             angular.forEach(elementChildren, function(viewElement) {
//               var div = $document[0].createElement('remove-view');
//               div.innerHTML = viewElement.innerHTML;
//               div.className = viewElement.className;
//               removeAngularMarkup(div);

//               element.html(div.outerHTML);

//             });

//             var removeViews = element.find('remove-view');
//             if(removeViews.length) {
//               $animate.leave( removeViews, function(){
//                 console.log('animate.leave')
//               });
//             }
//             $animate.enter( angular.element(newHtml), element, null, function() {
//               console.log('animate.enter')
//             });

//           } else {
//             element.html(newHtml);
//           }

//           var link = $compile( element.contents() );
//           viewScope = scope.$new();

//           if (locals.$$controller) {
//             locals.$scope = viewScope;
//             var controller = $controller(locals.$$controller, locals);
//             element.children().data('$ngControllerController', controller);
//           }
//           link(viewScope);

//           viewScope.$emit('$viewContentLoaded');
//           if (onloadExp) viewScope.$eval(onloadExp);

//           // TODO: This seems strange, shouldn't $anchorScroll listen for $viewContentLoaded if necessary?
//           // $anchorScroll might listen on event...
//           $anchorScroll();
//         }
//       };
//     }
//   };
//   return directive;
// }

// angular.module('ui.router.state').directive('uiView', $ViewDirective);



// $UrlRouterProvider.$inject = ['$urlMatcherFactoryProvider'];
// function $UrlRouterProvider(  $urlMatcherFactory) {
//   var isDefined = angular.isDefined,
//       isFunction = angular.isFunction,
//       isString = angular.isString,
//       isObject = angular.isObject,
//       isArray = angular.isArray,
//       forEach = angular.forEach,
//       extend = angular.extend,
//       copy = angular.copy;

//   var rules = [], 
//       otherwise = null;

//   // Returns a string that is a prefix of all strings matching the RegExp
//   function regExpPrefix(re) {
//     var prefix = /^\^((?:\\[^a-zA-Z0-9]|[^\\\[\]\^$*+?.()|{}]+)*)/.exec(re.source);
//     return (prefix != null) ? prefix[1].replace(/\\(.)/g, "$1") : '';
//   }

//   // Interpolates matched values into a String.replace()-style pattern
//   function interpolate(pattern, match) {
//     return pattern.replace(/\$(\$|\d{1,2})/, function (m, what) {
//       return match[what === '$' ? 0 : Number(what)];
//     });
//   }

//   this.rule =
//     function (rule) {
//       if (!isFunction(rule)) throw new Error("'rule' must be a function");
//       rules.push(rule);
//       return this;
//     };

//   this.otherwise =
//     function (rule) {
//       if (isString(rule)) {
//         var redirect = rule;
//         rule = function () { return redirect; };
//       }
//       else if (!isFunction(rule)) throw new Error("'rule' must be a function");
//       otherwise = rule;
//       return this;
//     };


//   function handleIfMatch($injector, handler, match) {
//     if (!match) return false;
//     $state.transitionTo(state, match, { location: false });
//     var result = $injector.invoke(handler, handler, { $match: match });
//     return isDefined(result) ? result : true;
//   }

//   this.when =
//     function (what, handler) {

//       // override ui-router's handler
//       handler = ['$match', '$stateParams', function ($match, $stateParams) {
//         if ($state.$current.navigable != state || !equalForKeys($match, $stateParams)) {
//           $state.transitionTo(state, $match, { location: false });
//         }
//       }];

//       var redirect, handlerIsString = isString(handler);
//       if (isString(what)) what = $urlMatcherFactory.compile(what);

//       if (!handlerIsString && !isFunction(handler) && !isArray(handler))
//         throw new Error("invalid 'handler' in when()");

//       var strategies = {
//         matcher: function (what, handler) {
//           if (handlerIsString) {
//             redirect = $urlMatcherFactory.compile(handler);
//             handler = ['$match', function ($match) { return redirect.format($match); }];
//           }
//           return extend(function ($injector, $location) {
//             return handleIfMatch($injector, handler, what.exec($location.path(), $location.search()));
//           }, {
//             prefix: isString(what.prefix) ? what.prefix : ''
//           });
//         },
//         regex: function (what, handler) {
//           if (what.global || what.sticky) throw new Error("when() RegExp must not be global or sticky");

//           if (handlerIsString) {
//             redirect = handler;
//             handler = ['$match', function ($match) { return interpolate(redirect, $match); }];
//           }
//           return extend(function ($injector, $location) {
//             return handleIfMatch($injector, handler, what.exec($location.path()));
//           }, {
//             prefix: regExpPrefix(what)
//           });
//         }
//       };

//       var check = { matcher: $urlMatcherFactory.isMatcher(what), regex: what instanceof RegExp };

//       for (var n in check) {
//         if (check[n]) {
//           return this.rule(strategies[n](what, handler));
//         }
//       }

//       throw new Error("invalid 'what' in when()");
//     };

//   this.$get =
//     [        '$location', '$rootScope', '$injector',
//     function ($location,   $rootScope,   $injector) {
//       // TODO: Optimize groups of rules with non-empty prefix into some sort of decision tree
//       function update(evt) {
//         if (evt && evt.defaultPrevented) return;
//         function check(rule) {
//           var handled = rule($injector, $location);
//           if (handled) {
//             if (isString(handled)) $location.replace().url(handled);
//             console.log('handled ui router')
//             return true;
//           }
//           return false;
//         }
//         var n=rules.length, i;
//         for (i=0; i<n; i++) {
//           if (check(rules[i])) return;
//         }
//         // always check otherwise last to allow dynamic updates to the set of rules
//         if (otherwise) check(otherwise);
//       }

//       $rootScope.$on('$locationChangeSuccess', update);

//       return {
//         sync: function () {
//           update();
//         }
//       };
//     }];
// }

// angular.module('ui.router.router').provider('$urlRouter', $UrlRouterProvider);


