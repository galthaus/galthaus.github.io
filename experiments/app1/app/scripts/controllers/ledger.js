'use strict';

/**
 * @ngdoc function
 * @name iwildWestCharSheetApp.controller:LedgerCtrl
 * @description
 * # LedgerCtrl
 * Controller of the wildWestCharSheetApp
 */
angular.module('wildWestCharSheetApp').controller('LedgerCtrl', function ($scope, $location, dataService) {

  dataService.getCharacter().then(function(character) {
    $scope.character=character;
  });

  dataService.getItems().then(function(items) {
    $scope.items=items;
  });

  $scope.$on('dataService:character', function(event,data) {
    $scope.character = data;
  });

  $scope.$watch(function(scope) { return scope.items.current_date },
                function(newValue, oldValue) {
                  if (newValue !== oldValue) {
                    $scope.calculate();
                  }
                });

  $scope.calculate = function() {
    ledger_calculate($scope.items, $scope.character);
  };

  $scope.addEntry = function() {
    var d = new Date()
    var date = d.getFullYear() + "/" + (d.getMonth()+1) + "/" + d.getDate();
    var e = { "date": date, "action": "Buy", "param1": "Equipment", "param2": "Boomerang", "value": "0", "details": "Edit me" };
    $scope.character.ledger.push(e);
  }

  $scope.deleteEntry = function(index) {
    $scope.character.ledger.splice(index,1);
    $scope.calculate();
  }
});

