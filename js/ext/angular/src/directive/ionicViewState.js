(function() {
'use strict';

/**
 * @description
 * The NavController is a navigation stack View Controller modelled off of 
 * UINavigationController from Cocoa Touch. With the Nav Controller, you can
 * "push" new "pages" on to the navigation stack, and then pop them off to go
 * back. The NavController controls a navigation bar with a back button and title
 * which updates as the pages switch.
 *
 * The NavController makes sure to not recycle scopes of old pages
 * so that a pop will still show the same state that the user left.
 *
 * However, once a page is popped, its scope is destroyed and will have to be
 * recreated then next time it is pushed.
 *
 */

angular.module('ionic.ui.viewState', ['ionic.service.view', 'ionic.service.gesture']) 

/**
 * Our Nav Bar directive which updates as the controller state changes.
 */
.directive('viewBar', ['ViewService', '$rootScope', '$animate', '$compile', 
              function( ViewService,   $rootScope,   $animate,   $compile) {

  /**
   * Perform an animation between one tab bar state and the next.
   * Right now this just animates the titles.
   */
  var animate = function($scope, $element, oldTitle, data, cb) {
    var title, nTitle, oTitle, titles = $element[0].querySelectorAll('.title');

    var newTitle = data.title;
    if(!oldTitle || oldTitle === newTitle) {
      cb();
      return;
    }

    // Clone the old title and add a new one so we can show two animating in and out
    // add ng-leave and ng-enter during creation to prevent flickering when they are swapped during animation
    title = angular.element(titles[0]);
    oTitle = $compile('<h1 class="title" ng-bind="oldTitle"></h1>')($scope);
    title.replaceWith(oTitle);
    nTitle = $compile('<h1 class="title" ng-bind="currentTitle"></h1>')($scope);

    var insert = $element[0].firstElementChild || null;

    // Insert the new title
    $animate.enter(nTitle, $element, insert && angular.element(insert), function() {
      cb();
    });

    // Remove the old title
    $animate.leave(angular.element(oTitle), function() {
    });
  };

  return {
    restrict: 'E',
    replace: true,
    scope: {
      type: '@',
      backButtonType: '@',
      backButtonLabel: '@',
      backButtonIcon: '@',
      alignTitle: '@'
    },
    template: '<header class="bar bar-header nav-bar">'+//' ng-class="{invisible: !navController.navBar.isVisible}">' + 
        '<div class="buttons"> ' +
          '<button view-back class="button" ng-show="enableBackButton && showBackButton" ng-class="backButtonClass" ng-bind-html="backButtonLabel"></button>' +
          '<button ng-click="button.tap($event)" ng-repeat="button in leftButtons" class="button no-animation {{button.type}}" ng-bind-html="button.content"></button>' + 
        '</div>' +
        '<h1 class="title" ng-bind="currentTitle"></h1>' + 
        '<div class="buttons" ng-if="rightButtons.length"> ' +
          '<button ng-click="button.tap($event)" ng-repeat="button in rightButtons" class="button no-animation {{button.type}}" ng-bind-html="button.content"></button>' + 
        '</div>' +
      '</header>',
    link: function($scope, $element, $attr, navCtrl) {
      var backButton;

      if($attr.animation) {
        $element[0].classList.add($attr.animation);
      }

      // Create the back button content and show/hide it based on scope settings
      $scope.enableBackButton = true;
      $scope.backButtonClass = $attr.backButtonType;
      if($attr.backButtonIcon) {
        $scope.backButtonClass += ' icon ' + $attr.backButtonIcon;
      }

      // Listen for changes in the stack cursor position to indicate whether a back
      // button should be shown (this can still be disabled by the $scope.enableBackButton
      $rootScope.$watch('$viewHistory.backView', function(backView) {
        if(backView) {
          var currentView = ViewService.getCurrentView();
          if(currentView) {
            if(backView.historyId === currentView.historyId) {
              $scope.showBackButton = true;
              return;
            }
          }
        }
        $scope.showBackButton = false;
      });

      // Store a reference to our nav controller
      $scope.navController = navCtrl;

      // Initialize our header bar view which will handle resizing and aligning our title labels
      var hb = new ionic.views.HeaderBar({
        el: $element[0],
        alignTitle: $scope.alignTitle || 'center'
      });
      $scope.headerBarView = hb;

      // Add the type of header bar class to this element
      $element.addClass($scope.type);

      var updateHeaderData = function(data) {
        var oldTitle = $scope.currentTitle;
        $scope.oldTitle = oldTitle;

        if(typeof data.title !== 'undefined') {
          $scope.currentTitle = data.title;
        }

        $scope.leftButtons = data.leftButtons;
        $scope.rightButtons = data.rightButtons;

        if(typeof data.hideBackButton !== 'undefined') {
          $scope.enableBackButton = data.hideBackButton !== true;
        }

        if(data.animate !== false && data.title) {
          animate($scope, $element, oldTitle, data, function() {
            hb.align();
          });
        } else {
          hb.align();
        }
      };

      $rootScope.$on('viewState.viewShown', function(e, data) {
        updateHeaderData(data);
      });

      // // If a nav page changes the left or right buttons, update our scope vars
      // $scope.$parent.$on('viewState.leftButtonsChanged', function(e, data) {
      //   $scope.leftButtons = data;
      // });
      // $scope.$parent.$on('viewState.rightButtonsChanged', function(e, data) {
      //   $scope.rightButtons = data;
      // });

    }
  };
}])

.directive('view', ['ViewService', '$parse', function(ViewService, $parse) {
  return {
    restrict: 'E',
    scope: {
      leftButtons: '=',
      rightButtons: '=',
      title: '=',
      icon: '@',
      iconOn: '@',
      iconOff: '@',
      type: '@',
      alignTitle: '@',
      hideBackButton: '@',
      hideNavBar: '@',
      animate: '@'
    },
    link: function($scope, $element, $attr) {

      $element.addClass('pane');

      // Should we hide a back button when this tab is shown
      $scope.hideBackButton = $scope.$eval($scope.hideBackButton);

      $scope.hideNavBar = $scope.$eval($scope.hideNavBar);

      if($scope.hideBackButton === true) {
        $scope.$emit('viewState.hideBackButton');
      } else {
        $scope.$emit('viewState.showBackButton');
      }

      // Whether we should animate on tab change, also impacts whether we
      // tell any parent nav controller to animate
      $scope.animate = $scope.$eval($scope.animate);
        

      // watch for changes in the left buttons
      $scope.$watch('leftButtons', function(value) {
        $scope.$emit('viewState.leftButtonsChanged', $scope.leftButtons);
      });

      $scope.$watch('rightButtons', function(val) {
        $scope.$emit('viewState.rightButtonsChanged', $scope.rightButtons);
      });

      // watch for changes in the title
      $scope.$watch('title', function(value) {
        $scope.$emit('viewState.titleChanged', {
          title: value,
          animate: $scope.animate
        });
      });
    }
  };
}])



.directive('viewBack', ['ViewService', '$state', function(ViewService, $state) {
  return {
    restrict: 'AC',
    link: function($scope, $element, $attr) {
      var goBack = function(e) {
        var backView = ViewService.getBackView();
        if(backView) {
          backView.go();
        }
        e.alreadyHandled = true;
        return false;
      };
      $element.bind('click', goBack);
    }
  };
}])



.directive('uiView', ['ViewService', '$state', '$anchorScroll', '$compile', '$controller', '$animate', 
             function( ViewService,   $state,   $anchorScroll,   $compile,   $controller,   $animate) {

  var viewIsUpdating = false;

  var directive = {
    restrict: 'ECA',
    terminal: true,
    priority: 2000,
    transclude: true,
    link: function(scope, $element, attr, ctrl, $transclude) {
        var currentElement,
            autoScrollExp = attr.autoscroll,
            onloadExp = attr.onload || '',
            viewLocals,
            viewScope,
            name = attr[directive.name] || attr.name || '';

        var parent = $element.parent().inheritedData('$uiView');
        if (name.indexOf('@') < 0) name = name + '@' + (parent ? parent.state.name : '');
        var view = { name: name, state: null, animation: null };
        $element.data('$uiView', view);

        if(attr.animation) {
          view.animation = attr.animation;
        } else if(parent && parent.animation) {
          view.animation = parent.animation;
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
        update(false);

        function update(doAnimation) {
          var locals = $state.$current && $state.$current.locals[name],
              template = (locals && locals.$template ? locals.$template.trim() : null);
          if (locals === viewLocals) return; // nothing to do

          if (template) {

            var removeElement = currentElement;
            var removeScope = viewScope;

            currentElement = angular.element(template);

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

            // register the new view and figure out it's nav direction
            ViewService.register(viewScope);

            var navDirection = ViewService.getNavDirection();
            if(doAnimation && navDirection && view.animation) {
              // use animations to remove and show content
              var classList = $element[0].classList;
              if(navDirection === 'forward') {
                classList.add(view.animation);
                classList.remove('reverse');
              } else if(navDirection === 'back') {
                classList.add(view.animation);
                classList.add('reverse');
              } else {
                classList.remove(view.animation);
                classList.remove('reverse');
              }

              if(removeElement) {
                $animate.leave(removeElement, function onUiViewLeave() {
                  
                });
              }

              $animate.enter(currentElement, $element, null, function onUiViewEnter () {
                if (angular.isDefined(autoScrollExp) && 
                   (!autoScrollExp || scope.$eval(autoScrollExp))) {
                  $anchorScroll();
                }
              });

            } else {
              // just remove old element, no animations
              if (removeScope) {
                removeScope.$destroy();
                removeScope = null;
              }
              if(removeElement) {
                removeElement.remove();
                removeElement = null;
              }

              // add new element, no animations
              $element.append(currentElement);
            }

          } else {
            // no template to render new view, just remove the old stuff, no hoopla
            if (viewScope) {
              viewScope.$destroy();
              viewScope = null;
            }
            if(currentElement) {
              currentElement.remove();
              currentElement = null;
            }
          }
        }
    }
  };
  return directive;
}]);


})();