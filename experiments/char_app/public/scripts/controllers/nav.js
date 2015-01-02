'use strict';

/**
 * @ngdoc function
 * @name iwildWestCharSheetApp.controller:NavCtrl
 * @description
 * # NavCtrl
 * Controller of the wildWestCharSheetApp
 */
angular.module('wildWestCharSheetApp')
  .controller('NavCtrl', function ($scope, $location, dataService) {
    $scope.filename = "charname.json";

    $scope.isActive = function(route) {
      $scope.path = $location.path();
      return $location.path() === route;
    };
    dataService.getCharacter().then(function(character) {
      $scope.character=character;
    });

    dataService.getItems().then(function(items) {
      $scope.items=items;
    });

    $scope.$on('dataService:character', function(event,data) {
      $scope.character = data;
    });

    $scope.saveCharacter = function() {
      dataService.saveCharacter();
    };

    $scope.download = function() {
      download(JSON.stringify($scope.character), $scope.filename, 'application/json');
    };

    $scope.ledger_calculate = function() {
      ledger_calculate($scope.items, $scope.character);
    };

    $scope.checked = false;

  });
