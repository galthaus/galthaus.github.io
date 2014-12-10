'use strict';

/**
 * @ngdoc overview
 * @name dicerRollerApp
 * @description
 * # dicerRollerApp
 *
 * Main module of the application.
 */
angular
  .module('dicerRollerApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'dgAuth'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .when('/about', {
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  })
  .config(['dgAuthServiceProvider', function(dgAuthServiceProvider) {
    dgAuthServiceProvider.setConfig({
      login: {
        method: 'POST',
        url: '/signin'
      },
      logout: {
        method: 'POST',
        url: '/signout'
      }
    });
    /**
     * Specifies the header to look for server information.
     * The header you have used in the server side.
     */
    //dgAuthServiceProvider.setHeader('Your-Header-For-Authentication');
    //
    /**
     * Sets the limit of requests to infinite.
     */
    dgAuthServiceProvider.setLimit('inf');

    /**
     * You can add the callbacks to manage what happens after
     * successful of the login.
     */
    dgAuthServiceProvider.callbacks.login.push(['serviceInject', function(serviceInject) {
      return {
        successful: function(response) {
          //Your code...
        },
        error: function(response) {
          //Your code...
        },
        required: function(response) {
          //Your code...
        },
        limit: function(response) {
          //Your code...
        }
      };
    }]);

    //This is the same for the logout.

    /**
     * You can add the callbacks to manage what happens after
     * successful of the logout.
     */
    dgAuthServiceProvider.callbacks.logout.push(['serviceInject', function(serviceInject) {
      return {
        successful: function(response) {
          //Your code...
        },
        error: function(response) {
          //Your code...
        }
      };
    }]);
  }])
  .run(['dgAuthService', function(dgAuthService) {
    /**
     * It tries to sign in. If the service doesn't find
     * the credentials stored or the user is not signed in yet,
     * the service executes the required function.
     */
    dgAuthService.start();
  }]);
