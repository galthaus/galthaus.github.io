'use strict';

/**
 * @ngdoc function
 * @name wildWestCharSheetApp.controller:InfoCtrl
 * @description
 * # InfoCtrl
 * Controller of the wildWestCharSheetApp
 */
angular.module('wildWestCharSheetApp').controller('InfoCtrl', function ($scope, dataService) {
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

