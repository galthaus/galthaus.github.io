'use strict';

/**
 * @ngdoc function
 * @name wildWestCharSheetApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the wildWestCharSheetApp
 */
angular.module('wildWestCharSheetApp').controller('MainCtrl', function ($scope, dataService) {
    dataService.getCharacter().then(function(character) {
      $scope.character=character;
    });

    dataService.getItems().then(function(items) {
      $scope.items=items;
    });

    $scope.$on('dataService:character', function(event,data) {
      $scope.character = data;
    });

    $scope.calculate = function() {
      calculate($scope.items, $scope.character);
    };

  });
  
angular.module('wildWestCharSheetApp').directive('chAttribute', function() {
  return {
    restrict: 'A',
    scope: {
      info: '=info',
      aname: '@',
      calculate: '&calculate'
    },
    templateUrl: 'views/ch-attribute.html'
  };
});

angular.module('wildWestCharSheetApp').directive('chSave', function() {
  return {
    restrict: 'A',
    scope: {
      info: '=info',
      aname: '@',
      calculate: '&calculate'
    },
    templateUrl: 'views/ch-save.html'
  };
});