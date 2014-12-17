'use strict';

function ledgerEntry(l, a, p1, p2) {
  for (var i = 0; i < l.length; i++) { 
    var le = l[i]; 

    if (le.action === a &&
        le.param1 === p1 && 
        le.param2 === p2) {
      return Number(le.value);
    }
  }
  return 0;
}

function ledgerSum(l, a, p1, p2) {
  var acc = 0;

  for (var i = 0; i < l.length; i++) {
    var le = l[i]; 

    if (le.action === a &&
        (p1 === '*' || le.param1 === p1) &&
        (p2 === '*' || le.param2 === p2)) {
      acc = acc + Number(le.value);
    }
  }
  return acc;
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
    // Sort ledger
    $scope.character.ledger.sort(function(a,b) {
      if ( a.date < b.date )
        return -1;
      if ( a.date > b.date )
         return 1;
      return 0;
    });

    // GREG: things that are set in ledger

    // GREG: Walk the ledger from 0 to date.
    // GREG:   update scratch/remaining fields

    // Run the ledger calcs
    for (var i = 0; i < items.ledger_calculations.length; i++) {
      var v = items.calculations[i].value;
      var e = items.calculations[i].eval;

      eval(v + " = " + e);
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
  }
});

