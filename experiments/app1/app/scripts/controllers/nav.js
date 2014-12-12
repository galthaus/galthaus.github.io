'use strict';

/**
 * @ngdoc function
 * @name iwildWestCharSheetApp.controller:NavCtrl
 * @description
 * # NavCtrl
 * Controller of the wildWestCharSheetApp
 */
angular.module('wildWestCharSheetApp')
  .controller('NavCtrl', function ($scope, $location) {
    $scope.isActive = function(route) {
      $scope.path = $location.path();
      return $location.path() === route;
    };
  });
