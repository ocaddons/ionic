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
.directive('viewBar', ['$rootScope', '$animate', '$compile', function($rootScope, $animate, $compile) {

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
          '<button view-back class="button" ng-if="enableBackButton && showBackButton" ng-class="backButtonClass" ng-bind-html="backButtonLabel"></button>' +
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
        $scope.showBackButton = (backView ? true : false);
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

        if(data.animate !== false && typeof data.title !== 'undefined') {
          animate($scope, $element, oldTitle, data, function() {
            hb.align();
          });
        } else {
          hb.align();
        }
      };

      $scope.$parent.$on('viewState.viewShown', function(e, data) {
        updateHeaderData(data);
      });

      // $scope.$parent.$on('viewState.showBackButton', function(e, data) {
      //   $scope.enableBackButton = true;
      // });

      // $scope.$parent.$on('viewState.hideBackButton', function(e, data) {
      //   $scope.enableBackButton = false;
      // });

      // // Listen for changes on title change, and update the title
      // $scope.$parent.$on('viewState.pageChanged', function(e, data) {
      //   updateHeaderData(data);
      // });

      // $scope.$parent.$on('viewState.pageShown', function(e, data) {
      //   updateHeaderData(data);
      // });

      // $scope.$parent.$on('viewState.titleChanged', function(e, data) {
      //   var oldTitle = $scope.currentTitle;
      //   $scope.oldTitle = oldTitle;

      //    if(typeof data.title !== 'undefined') {
      //     $scope.currentTitle = data.title;
      //   }

      //   if(data.animate !== false && typeof data.title !== 'undefined') {
      //     animate($scope, $element, oldTitle, data, function() {
      //       hb.align();
      //     });
      //   } else {
      //     hb.align();
      //   }
      // });

      // // If a nav page changes the left or right buttons, update our scope vars
      // $scope.$parent.$on('viewState.leftButtonsChanged', function(e, data) {
      //   $scope.leftButtons = data;
      // });
      // $scope.$parent.$on('viewState.rightButtonsChanged', function(e, data) {
      //   $scope.rightButtons = data;
      // });

      $scope.$on('$destroy', function() {
        //
      });
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
      animate: '@',
    },
    link: function($scope, $element, $attr) {

      ViewService.register($scope);

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
          $state.go(backView.stateName, backView.stateParams);
        }
        e.alreadyHandled = true;
        return false;
      };
      $element.bind('click', goBack);
    }
  };
}]);


})();