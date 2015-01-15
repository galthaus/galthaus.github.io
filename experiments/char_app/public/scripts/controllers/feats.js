'use strict';

/**
 * @ngdoc function
 * @name iwildWestCharSheetApp.controller:FeatsCtrl
 * @description
 * # FeatsCtrl
 * Controller of the wildWestCharSheetApp
 */
angular.module('wildWestCharSheetApp').controller('FeatsCtrl', function ($scope, dataService) {

  dataService.getCharacter().then(function(character) {
    $scope.character=character;
  });

  dataService.getItems().then(function(items) {
    $scope.items=items;
  });

  $scope.$on('dataService:character', function(event, data) {
    $scope.character = data;
  });

  $scope.$watch(function(scope) { return scope.items.current_date; },
                function(newValue, oldValue) {
                  if (newValue !== oldValue) {
                    $scope.calculate();
                  }
                });

  $scope.calculate = function() {
    ledger_calculate($scope.items, $scope.character);
  };
}).filter('filterFunction', function() {
  return function(list, items, character, options) {
    //console.log("Calling filter with options: " + options)
    if (items === undefined) {
      //console.log("items undefined returning list");
      return list;
    }
    if (character === undefined) {
      //console.log("character undefined returning list");
      return list;
    }
    if (options === undefined) {
      //console.log("options undefined returning list");
      return list;
    }
    if (options.show_all) {
      //console.log("options true = returning list");
      return list;
    } 

    var arr = [];
    for (var i = 0; i < list.length; i++) {
      var feat = list[i];

      var varName = "character.wiki.ci.feats[\""+feat.name+"\"]";

      var_expand(items, character, varName, "Feat");
      var featData = eval(varName);

      if (featData === undefined) {
        // Skip
      }
      else if (featData.purchased === true) {
        arr.push(feat);
      }
    }

    return arr;
  };

});

angular.module('wildWestCharSheetApp').directive('featsRow', function() {
  return {
    restrict: 'A',
    scope: {
      rowdata: '=rowdata',
      items: '=items',
      character: '=character',
      calculate: '&calculate'
    },
    controller: function($scope) {
      var varName = "character.wiki.ci.feats[\""+$scope.rowdata.name+"\"]";
      var character = $scope.character;

      var_expand($scope.items, $scope.character, varName, "Feat");
      $scope.feat = eval(varName);
    },
    templateUrl: '/views/feats-row.html'
  };
});

