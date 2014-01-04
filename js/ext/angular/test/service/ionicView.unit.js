describe('Ionic View Service', function() {
  var viewService, rootScope, stateProvider, window;

  beforeEach(module('ionic.service.view'));
  beforeEach(module('ui.router'));

  beforeEach(module(function ($stateProvider, $provide) {
    stateProvider = $stateProvider;

    $stateProvider
      .state('home', { url: "/" })
      .state('home.item', { url: "front/:id" })

      .state('about', { url: "/about" })
      .state('about.person', { url: "/person" })
      .state('about.person.item', { url: "/id" })

      .state('about.sidebar', {})
      .state('about.sidebar.item', {})

      .state('contact', { url: "/contact" })

      .state('info', { url: "/info" })

      .state('tabs', { abstract: true })
      .state('tabs.tab1view1', {})
      .state('tabs.tab1view2', {})
      .state('tabs.tab1view3', {})

      .state('tabs.tab2view1', {})
      .state('tabs.tab2view2', {})
      .state('tabs.tab2view3', {})

      .state('tabs.tab3view1', {})
      .state('tabs.tab3view2', {})
      .state('tabs.tab3view3', {})

  }));

  beforeEach(inject(function(ViewService, $rootScope, $window) {
    viewService = ViewService;
    rootScope = $rootScope;
    window = $window;
    window.history.go = function(val) { return val };
  }));

  it('Should do nothing if the same state happens', inject(function($state) {
    var homeViewScope = {};
    $state.go('home');
    rootScope.$apply();
    viewService.register(homeViewScope);

    var originalHomeViewId = homeViewScope.$viewId;

    homeViewScope = {};
    $state.go('home');
    rootScope.$apply();
    viewService.register(homeViewScope);
    currentView = viewService.getCurrentView();
    expect(currentView.viewId).toEqual(originalHomeViewId);
    expect(currentView.backViewId).toEqual(null);
    expect(currentView.forwardViewId).toEqual(null);
  }));

  it('Should create a new view', inject(function($location, $state) {
    $location.url('/home');
    var view1Scope = {};
    viewService.register(view1Scope);

    var currentView = viewService.getCurrentView();
    expect(currentView.viewId).toBeDefined();
    expect(currentView.index).toEqual(0);
    expect(currentView.historyId).toBeDefined();
    expect(currentView.backViewId).toEqual(null);
    expect(currentView.forwardViewId).toEqual(null);
    expect(currentView.url).toEqual('/home');
  }));

  it('Should register two sequential views', inject(function($state) {
    $state.go('home');
    rootScope.$apply();
    expect(viewService.getCurrentStateName()).toEqual('home');
    var view1Scope = {};
    viewService.register(view1Scope);
    expect(rootScope.$viewHistory.currentView.stateName).toEqual('home');

    expect(view1Scope.$viewId).not.toBeUndefined();
    expect(rootScope.$viewHistory.histories[view1Scope.$viewId].viewId).toEqual(view1Scope.$viewId);
    expect(viewService.getBackView()).toEqual(null);
    expect(viewService.getForwardView()).toEqual(null);

    expect(rootScope.$viewHistory.currentView.stateName).toEqual('home');
    var currentView = viewService.getCurrentView();
    expect(currentView.index).toEqual(0);

    $state.go('about');
    rootScope.$apply();
    expect(viewService.getCurrentStateName()).toEqual('about');
    viewService.register({});
    expect(viewService.getCurrentView().stateName).toEqual('about');
    expect(viewService.getBackView().stateName).toEqual('home');
    expect(viewService.getForwardView()).toEqual(null);
  }));

  it('Should register views and go back to start', inject(function($state) {
    $state.go('home');
    rootScope.$apply();
    viewService.register({});
    expect(viewService.getCurrentView().stateName).toEqual('home');
    expect(viewService.getBackView()).toEqual(null);
    expect(viewService.getForwardView()).toEqual(null);

    $state.go('about');
    rootScope.$apply();
    viewService.register({});
    var currentView = viewService.getCurrentView();
    var backView = viewService.getBackView();
    var forwardView = viewService.getForwardView();
    expect(currentView.stateName).toEqual('about');
    expect(currentView.backViewId).toEqual(backView.viewId);
    expect(backView.stateName).toEqual('home');
    expect(forwardView).toEqual(null);

    $state.go('contact');
    rootScope.$apply();
    viewService.register({});
    currentView = viewService.getCurrentView();
    backView = viewService.getBackView();
    forwardView = viewService.getForwardView();
    expect(backView.stateName).toEqual('about');
    expect(currentView.backViewId).toEqual(backView.viewId);
    expect(viewService.getForwardView()).toEqual(null);

    $state.go('about');
    rootScope.$apply();
    viewService.register({});
    currentView = viewService.getCurrentView();
    backView = viewService.getBackView();
    forwardView = viewService.getForwardView();
    expect(currentView.stateName).toEqual('about');
    expect(currentView.backViewId).toEqual(backView.viewId);
    expect(currentView.forwardViewId).toEqual(forwardView.viewId);
    expect(backView.stateName).toEqual('home');
    expect(forwardView.stateName).toEqual('contact');

    $state.go('home');
    rootScope.$apply();
    viewService.register({});
    currentView = viewService.getCurrentView();
    backView = viewService.getBackView();
    forwardView = viewService.getForwardView();
    expect(currentView.stateName).toEqual('home');
    expect(currentView.forwardViewId).toEqual(forwardView.viewId);
    expect(backView).toEqual(null);
    expect(forwardView.stateName).toEqual('about');
  }));

  it('Should register four views, and not go back to the first', inject(function($state) {
    var homeViewScope = {};
    $state.go('home');
    rootScope.$apply();
    viewService.register(homeViewScope);
    expect(viewService.getCurrentStateName()).toEqual('home');
    expect(viewService.getCurrentView().stateName).toEqual('home');
    expect(viewService.getBackView()).toEqual(null);
    expect(viewService.getForwardView()).toEqual(null);

    var aboutViewScope = {};
    $state.go('about');
    rootScope.$apply();
    viewService.register(aboutViewScope);
    var currentView = viewService.getCurrentView();
    var backView = viewService.getBackView();
    var forwardView = viewService.getForwardView();
    expect(currentView.viewId).toEqual(aboutViewScope.$viewId);
    expect(currentView.backViewId).toEqual(homeViewScope.$viewId);
    expect(currentView.forwardViewId).toEqual(null);
    expect(backView.viewId).toEqual(homeViewScope.$viewId);
    expect(backView.forwardViewId).toEqual(currentView.viewId);

    var tab1Scope = {};
    viewService.registerHistory(tab1Scope);
    var tab1view1Scope = { $parent: tab1Scope };

    $state.go('tabs.tab1view1');
    rootScope.$apply();
    viewService.register(tab1view1Scope);

    expect(rootScope.$viewHistory.histories[tab1Scope.$historyId].historyId).toEqual(tab1Scope.$historyId);
    expect(rootScope.$viewHistory.histories[tab1Scope.$historyId].stack[0].viewId).toEqual(tab1view1Scope.$viewId);

    currentView = viewService.getCurrentView();
    backView = viewService.getBackView();
    forwardView = viewService.getForwardView();
    expect(currentView.viewId).toEqual(tab1view1Scope.$viewId);
    expect(currentView.backViewId).toEqual(aboutViewScope.$viewId);
    expect(currentView.forwardViewId).toEqual(null);
    expect(backView.viewId).toEqual(aboutViewScope.$viewId);
    expect(backView.forwardViewId).toEqual(currentView.viewId);

    $state.go('home');
    rootScope.$apply();
    viewService.register({});
    currentView = viewService.getCurrentView();
    backView = viewService.getBackView();
    forwardView = viewService.getForwardView();
    expect(currentView.backViewId).toEqual(tab1view1Scope.$viewId);
    expect(currentView.forwardViewId).toEqual(null);
    expect(backView.viewId).toEqual(tab1view1Scope.$viewId);
    expect(backView.forwardViewId).toEqual(currentView.viewId);
  }));

  it('Should register views, go back, then overwrite the forward', inject(function($state) {
    var homeViewScope = {};
    $state.go('home');
    rootScope.$apply();
    viewService.register(homeViewScope);
    currentView = viewService.getCurrentView();
    backView = viewService.getBackView();
    forwardView = viewService.getForwardView();
    expect(currentView.viewId).toEqual(homeViewScope.$viewId);
    expect(currentView.backViewId).toEqual(null);
    expect(currentView.forwardViewId).toEqual(null);

    var originalHomeViewId = homeViewScope.$viewId;

    var aboutScope = {};
    $state.go('about');
    rootScope.$apply();
    viewService.register(aboutScope);
    currentView = viewService.getCurrentView();
    backView = viewService.getBackView();
    forwardView = viewService.getForwardView();
    expect(currentView.viewId).toEqual(aboutScope.$viewId);
    expect(currentView.backViewId).toEqual(homeViewScope.$viewId);
    expect(currentView.forwardViewId).toEqual(null);
    expect(backView.viewId).toEqual(homeViewScope.$viewId);
    expect(backView.forwardViewId).toEqual(currentView.viewId);

    homeViewScope = {};
    $state.go('home');
    rootScope.$apply();
    viewService.register(homeViewScope);
    currentView = viewService.getCurrentView();
    backView = viewService.getBackView();
    forwardView = viewService.getForwardView();
    expect(currentView.viewId).toEqual(originalHomeViewId);
    expect(currentView.backViewId).toEqual(null);
    expect(currentView.forwardViewId).toEqual(aboutScope.$viewId);
    expect(forwardView.viewId).toEqual(aboutScope.$viewId);
    expect(forwardView.backViewId).toEqual(currentView.viewId);

    // this should overwrite that we went to the "about" view
    contactScope = {};
    $state.go('contact');
    rootScope.$apply();
    viewService.register(contactScope);
    currentView = viewService.getCurrentView();
    backView = viewService.getBackView();
    forwardView = viewService.getForwardView();
    expect(currentView.backViewId).toEqual(homeViewScope.$viewId);
    expect(currentView.forwardViewId).toEqual(null);
    expect(backView.viewId).toEqual(homeViewScope.$viewId);
    expect(backView.forwardViewId).toEqual(currentView.viewId);
  }));

  it('Should go to a new history, come back out, go to same history and come back out', inject(function($state) {
    var homeViewScope = {};
    $state.go('home');
    rootScope.$apply();
    viewService.register(homeViewScope);
    var currentView = viewService.getCurrentView();
    expect(currentView.historyId).toEqual('root');
    
    // each tab gets its own history in the tabs directive
    var tab1Scope = {};
    viewService.registerHistory(tab1Scope);
    expect(tab1Scope.$historyId).toBeDefined();

    var originalTab1ViewId = tab1Scope.$historyId;

    // the actual view within the tab renders
    var tab1ViewScope = { $parent: tab1Scope };
    $state.go('tabs.tab1view1');
    rootScope.$apply();
    viewService.register(tab1ViewScope);
    currentView = viewService.getCurrentView();
    expect(currentView.historyId).toEqual(tab1Scope.$historyId);

    currentView = viewService.getCurrentView();
    backView = viewService.getBackView();
    forwardView = viewService.getForwardView();

    expect(currentView.stateName).toEqual('tabs.tab1view1');
    expect(currentView.viewId).toEqual(tab1ViewScope.$viewId);
    expect(currentView.backViewId).toEqual(homeViewScope.$viewId);
    expect(currentView.forwardViewId).toEqual(null);

    expect(backView.stateName).toEqual('home');
    expect(backView.backViewId).toEqual(null);
    expect(backView.forwardViewId).toEqual(currentView.viewId);

    expect(forwardView).toEqual(null);

    homeViewScope = {};
    $state.go('home');
    rootScope.$apply();
    viewService.register(homeViewScope);

    currentView = viewService.getCurrentView();
    backView = viewService.getBackView();
    forwardView = viewService.getForwardView();

    expect(currentView.stateName).toEqual('home');
    expect(currentView.backViewId).toEqual(null);
    expect(currentView.forwardViewId).toEqual(tab1ViewScope.$viewId);

    expect(forwardView.stateName).toEqual('tabs.tab1view1');
    expect(forwardView.viewId).toEqual(tab1ViewScope.$viewId);
    expect(forwardView.backViewId).toEqual(currentView.viewId);
    expect(forwardView.forwardViewId).toEqual(null);

    tab1Scope = {};
    viewService.registerHistory(tab1Scope);
    expect(originalTab1ViewId.viewId).not.toEqual(tab1Scope.$historyId);

    tab1ViewScope = { $parent: tab1Scope };
    $state.go('tabs.tab1view1');
    rootScope.$apply();
    viewService.register(tab1ViewScope);
    currentView = viewService.getCurrentView();
    expect(currentView.historyId).toEqual(tab1Scope.$historyId);

    currentView = viewService.getCurrentView();
    backView = viewService.getBackView();
    forwardView = viewService.getForwardView();

    expect(currentView.stateName).toEqual('tabs.tab1view1');
    expect(currentView.viewId).toEqual(tab1ViewScope.$viewId);
    expect(currentView.backViewId).toEqual(homeViewScope.$viewId);
    expect(currentView.forwardViewId).toEqual(null);

    expect(backView.stateName).toEqual('home');
    expect(backView.backViewId).toEqual(null);
    expect(backView.forwardViewId).toEqual(currentView.viewId);

    expect(forwardView).toEqual(null);
  }));

  it('Should nav to a container history, move around in it, and come back', inject(function($state) {
    // go to the first page
    $state.go('home');
    rootScope.$apply();
    viewService.register({});

    // each tab gets its own history in the tabs directive
    var tab1Scope = { $viewId: 'tab1' };
    var tab2Scope = { $viewId: 'tab2' };
    var tab3Scope = { $viewId: 'tab3' };
    viewService.registerHistory(tab1Scope);
    viewService.registerHistory(tab2Scope);
    viewService.registerHistory(tab3Scope);

    // the actual view renders
    var tab1view1Scope = { $viewId: 'tab1view1', $parent: tab1Scope };
    $state.go('tabs.tab1view1');
    rootScope.$apply();
    viewService.register(tab1view1Scope);
    expect(viewService.getCurrentStateName()).toEqual('tabs.tab1view1');
    expect(viewService.getBackView().stateName).toEqual('home');
    expect(viewService.getForwardView()).toEqual(null);
    var lastView = viewService.getCurrentView();
    expect(lastView.index).toEqual(0);

    // inside first tab, go to another list inside the same tab
    var tab1view2Scope = { $viewId: 'tab1view2', $parent: tab1Scope };
    $state.go('tabs.tab1view2');
    rootScope.$apply();
    viewService.register(tab1view2Scope);
    expect(viewService.getCurrentStateName()).toEqual('tabs.tab1view2');
    expect(viewService.getBackView().stateName).toEqual('tabs.tab1view1');
    expect(viewService.getForwardView()).toEqual(null);
    var lastView = viewService.getCurrentView();
    expect(lastView.index).toEqual(1);

    // go back one within the tab
    $state.go('tabs.tab1view1');
    rootScope.$apply();
    viewService.register(tab1view1Scope);
    expect(viewService.getCurrentStateName()).toEqual('tabs.tab1view1');
    expect(viewService.getBackView().stateName).toEqual('home');
    expect(viewService.getForwardView().stateName).toEqual('tabs.tab1view2');
    var lastView = viewService.getCurrentView();
    expect(lastView.index).toEqual(0);

    // go back again, and should break out of the tab's history
    $state.go('home');
    rootScope.$apply();
    viewService.register({});
    expect(viewService.getCurrentStateName()).toEqual('home');

    $state.go('about');
    rootScope.$apply();
    viewService.register({});
    expect(viewService.getCurrentStateName()).toEqual('about');
  }));

  it('Should init root viewHistory data', inject(function() {
    expect(rootScope.$viewHistory.backView).toEqual(null);
    expect(rootScope.$viewHistory.currentView).toEqual(null);
    expect(rootScope.$viewHistory.forwardView).toEqual(null);
    expect(rootScope.$viewHistory.navDirection).toEqual(null);
    expect(rootScope.$viewHistory.histories).toEqual({
        root: { historyId: 'root', parentHistoryId: null, stack: [] }
    });
  }));

  it('Should create a viewService view', inject(function($location) {
    var newView = viewService.createView();
    expect(newView).toEqual(null);

    newView = viewService.createView({ stateName: 'about', url: '/url',  });
    expect(newView.stateName).toEqual('about');
  }));

  it('Should go() to a view', inject(function($location) {
    var newView = viewService.createView({ stateName: 'about' });
    newView.go();
    rootScope.$apply();
    expect($location.url()).toEqual('/about');

    $location.url('/nochange');
    newView = viewService.createView({ url: '/nochange' });
    var result = newView.go();
    expect(result).toEqual(null);

    $location.url('/nochange')
    newView = viewService.createView({ url: '/nochange' });
    result = newView.go();
    expect(result).toEqual(null);

    newView = rootScope.$viewHistory.backView = viewService.createView({ url: '/url' });
    result = newView.go();
    expect(result).toEqual(-1);

    newView = rootScope.$viewHistory.forwardView = viewService.createView({ url: '/url' });
    result = newView.go();
    expect(result).toEqual(1);

    newView = viewService.createView({ url: '/url' });
    newView.go();
    expect($location.url()).toEqual('/url');
  }));

  it('Should change history on event changeHistory', inject(function($location, $state) {
    $location.url('/original');

    rootScope.$broadcast("viewState.changeHistory");
    expect($location.url()).toEqual('/original');

    rootScope.$broadcast("viewState.changeHistory", { uiSref: 'about' });
    expect($location.url()).toEqual('/about');

    rootScope.$broadcast("viewState.changeHistory", { url: '/url' });
    expect($location.url()).toEqual('/url');

    rootScope.$viewHistory.histories['h123'] = { stack: [] }
    rootScope.$broadcast("viewState.changeHistory", { historyId: 'h123' });
    expect($location.url()).toEqual('/url');

    var newView = viewService.createView({ stateName: 'about' });
    rootScope.$viewHistory.histories['h123'].stack.push(newView);
    rootScope.$broadcast("viewState.changeHistory", { historyId: 'h123' });
    rootScope.$apply();
    expect($state.current.name).toEqual('about');
  }));

  it('Should update document title', inject(function($document) {
    $document.title = 'Original Title';

    rootScope.$broadcast("viewState.viewShown");
    expect($document.title).toEqual('Original Title');

    rootScope.$broadcast("viewState.viewShown", {});
    expect($document.title).toEqual('Original Title');

    rootScope.$broadcast("viewState.viewShown", { title: 'New Title' });
    expect($document.title).toEqual('New Title');
  }));

});
