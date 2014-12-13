'use strict';

/**
 * @ngdoc overview
 * @name wildWestCharSheetApp
 * @description
 * # wildWestCharSheetApp
 *
 * Main module of the application.
 */
angular.module('wildWestCharSheetApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch'
  ])
  .config(function ($locationProvider, $routeProvider) {
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
  });

angular.module('wildWestCharSheetApp').factory('dataService', [ '$q', '$resource', '$rootScope', function($q, $resource, $rootScope) {
  var items=[];
  var character={};
  var service={};

  service.getItems=function() {
    var itemsDefer=$q.defer();
    if(items.length > 0) {
      itemsDefer.resolve(items);
    } else {
      $.ajax({
        url: "game-data.json",
        beforeSend: function(xhr){
          if (xhr.overrideMimeType) {
            xhr.overrideMimeType("application/json");
          }
        },
        dataType: 'json',
        data: null,
        success: function( data ) {
          items=data.data;
          itemsDefer.resolve(items)
        }
      });
    }
    return itemsDefer.promise;
  };

  service.setCharacter=function(data) {
    character = data;
    $rootScope.$broadcast('dataService:character',data);
  };

  return service;
}]);

function handleFileSelect(evt) {
  var files = evt.target.files; // FileList object
  var file = files[0];

  var reader = new FileReader();

  // Closure to capture the file information.
  reader.onload = (function(theFile) {
    return function(e) {
      var character = JSON && JSON.parse(e.target.result) || $.parseJSON(e.target.result);
      angular.element($("#microController-div")).scope().setCharacter(character);
    };
  })(file);

  // Read in the image file as a data URL.
  reader.readAsText(file);
}

function download(strData, strFileName, strMimeType) {
    var D = document,
        A = arguments,
        a = D.createElement("a"),
        d = A[0],
        n = A[1],
        t = A[2] || "text/plain";

    //build download link:
    a.href = "data:" + strMimeType + "charset=utf-8," + escape(strData);


    if (window.MSBlobBuilder) { // IE10
        var bb = new MSBlobBuilder();
        bb.append(strData);
        return navigator.msSaveBlob(bb, strFileName);
    } /* end if(window.MSBlobBuilder) */



    if ('download' in a) { //FF20, CH19
        a.setAttribute("download", n);
        a.innerHTML = "downloading...";
        D.body.appendChild(a);
        setTimeout(function() {
            var e = D.createEvent("MouseEvents");
            e.initMouseEvent("click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
            a.dispatchEvent(e);
            D.body.removeChild(a);
        }, 66);
        return true;
    }; /* end if('download' in a) */



    //do iframe dataURL download: (older W3)
    var f = D.createElement("iframe");
    D.body.appendChild(f);
    f.src = "data:" + (A[2] ? A[2] : "application/octet-stream") + (window.btoa ? ";base64" : "") + "," + (window.btoa ? window.btoa : escape)(strData);
    setTimeout(function() {
        D.body.removeChild(f);
    }, 333);
    return true;
}

