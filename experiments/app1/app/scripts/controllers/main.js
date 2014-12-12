'use strict';

/**
 * @ngdoc function
 * @name wildWestCharSheetApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the wildWestCharSheetApp
 */
angular.module('wildWestCharSheetApp').controller('MainCtrl', function ($scope, dataService) {
    dataService.getItems().then(function(items) {
      $scope.items=items;
    });

    $scope.$on('dataService:character', function(event,data) {
      $scope.character = data;
    });

  });
