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

  $scope.calculate = function() {
    var character = $scope.character;

    // Sort ledger
    $scope.character.ledger.sort(function(a,b) {
      if ( a.date < b.date )
        return -1;
      if ( a.date > b.date )
         return 1;
      return 0;
    });

    // Clear values
    for (var key in $scope.items.ledger_clear) {
      eval(key + "=" + $scope.items.ledger_clear[key]);
    }

    // Process ledger
    for (var i = 0; i < $scope.character.ledger.length; i++) {
      // GREG: If after date then break

      var le = $scope.character.ledger[i];
      var item = getLedgerTypeData($scope.items, le.action, le.param1);
      var el = findLedgerTypeEntry(item, le.param2);

      if (el === undefined || el.lf === undefined) {
        continue;
      }

      eval(el.lf);
    }

    calculate($scope.items, $scope.character);
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

