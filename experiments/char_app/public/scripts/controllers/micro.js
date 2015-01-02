'use strict';

/**
 * @ngdoc function
 * @name iwildWestCharSheetApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the wildWestCharSheetApp
 */
angular.module('wildWestCharSheetApp')
  .controller('microController', function ($scope, dataService) {
    $scope.setCharacter = function(data) {
      dataService.setCharacter(data);
      $scope.$apply();
    };
  });
