var app = angular
  .module('dsApp', ['ngMaterial', 'ngMessages', 'ngCookies'])
  .controller('dsController', dsController)
  .config(function($mdThemingProvider) {
    $mdThemingProvider.theme('default')
      .primaryPalette('blue') // specify primary color, all
      // other color intentions will be inherited
      // from default
      //.warnPalette('red')
      .accentPalette('blue')
      .backgroundPalette('grey')
  });

function dsController($scope, $http, $log, $timeout, $q, $mdDialog, $filter, $cookies) {

  var self = this;
  
  $scope.runit = function(ev) {
    $log.info('runit!');
    $mdDialog.show({
        controller: RunDialogController
        , locals: {
            sascode: $scope.sascode
        }
        , templateUrl: 'dialogRun.tmpl.html'
        , parent: angular.element(document.body)
        , targetEvent: ev
        , clickOutsideToClose: false
        , fullscreen: $scope.customFullscreen // Only for -xs, -sm breakpoints.
      })
      .then(function(answer) {
      }, function(answer) {
        $scope.status = '';
    });

  }

}
