'use strict';

/**
 * @ngdoc function
 * @name iwildWestCharSheetApp.controller:SkillsCtrl
 * @description
 * # SkillsCtrl
 * Controller of the wildWestCharSheetApp
 */
angular.module('wildWestCharSheetApp').controller('SkillsCtrl', function ($scope, dataService) {

  dataService.getCharacter().then(function(character) {
    $scope.character=character;
  });

  dataService.getItems().then(function(items) {
    $scope.items=items;
  });

  $scope.$on('dataService:character', function(event,data) {
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

});

angular.module('wildWestCharSheetApp').directive('skillsRow', function() {
  return {
    restrict: 'A',
    scope: {
      rowdata: '=rowdata',
      items: '=items',
      character: '=character',
      calculate: '&calculate'
    },
    controller: function($scope) {
      var varName = "character.dynamic_sheet.ci.skills[\""+$scope.rowdata.name+"\"]";
      var character = $scope.character;
      
      var_expand($scope.items, $scope.character, varName, "Skill");
      $scope.cskill = eval(varName);
    },
    templateUrl: '/views/skills-row.html'
  };
});

