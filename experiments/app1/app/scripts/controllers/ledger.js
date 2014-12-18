'use strict';

function getLedgerTypeData(gameData, act, p1) {
  var atype;

  if (gameData.ledger[act] === undefined) {
    return [];
  }
  if (gameData.ledger[act][p1] === undefined) {
    return [];
  }

  atype = gameData.ledger[act][p1]["type"];

  return gameData[atype];
};

function findLedgerTypeEntry(arr, p2) {
  for (var i = 0; i < arr.length; i++) {
    if (arr[i].long === p2) {
      return arr[i];
    }
  }
  return undefined;
}

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
    var e = { "date": date, "action": "Buy", "param1": "Equipment", "param2": "Boomerang", "details": "Edit me" };
    $scope.character.ledger.push(e);
  }

  $scope.deleteEntry = function(index) {
    $scope.character.ledger.splice(index,1);
    $scope.calculate();
  }
});

