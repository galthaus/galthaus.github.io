'use strict';

// Returns a random integer between min (included) and max (excluded)
// Using Math.round() will give you a non-uniform distribution!
function getRandomInt(min, max) {
   return Math.floor(Math.random() * (max - min)) + min;
}

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
      .when('/ledger', {
        templateUrl: 'views/ledger.html',
        controller: 'LedgerCtrl'
      })
      .when('/skills', {
        templateUrl: 'views/skills.html',
        controller: 'SkillsCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });

angular.module('wildWestCharSheetApp').factory('dataService', [ '$q', '$resource', '$rootScope', function($q, $resource, $rootScope) {
  var items=0;
  var character=0;
  var service={};

  service.getItems=function() {
    var itemsDefer=$q.defer();
    if (typeof items !== 'number') {
      itemsDefer.resolve(items);
    } else {
      $.ajax({
        url: "game-data.json",
        mimeType: "application/json",
        dataType: 'json',
        data: null,
        success: function( data ) {
          var d = new Date();
          items=data;
          items.current_date = d.getFullYear() + "/" + (d.getMonth()+1) + "/" + d.getDate();
          if (typeof items !== 'number' && typeof character !== 'number')
            ledger_calculate(items, character);
          itemsDefer.resolve(items);
        },
        error: function(jq, reason, error) {
          alert(reason + "::" + error);
        }
      });
    }
    return itemsDefer.promise;
  };

  service.getCharacter=function() {
    var itemsDefer=$q.defer();
    if (typeof character !== 'number') {
      itemsDefer.resolve(character);
    } else {
      $.ajax({
        url: "character-base.json",
        mimeType: "application/json",
        dataType: 'json',
        data: null,
        success: function( data ) {
          character=data;
          if (typeof items !== 'number' && typeof character !== 'number')
            ledger_calculate(items, character);
          itemsDefer.resolve(character);
        },
        error: function(jq, reason, error) {
          alert(reason + "::" + error);
        }
      });
    }
    return itemsDefer.promise;
  };

  service.setCharacter=function(data) {
    character = data;
    $rootScope.$broadcast('dataService:character',data);
    if (typeof items !== 'number' && typeof character !== 'number')
      ledger_calculate(items, character);
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

function calculate(gameData, character) {
  for (var i = 0; i < gameData.calculations.length; i++) {
    var v = gameData.calculations[i].value;
    var e = gameData.calculations[i].eval;

    eval(v + " = " + e);
  }
    
  var cc = findLedgerTypeEntry(gameData.classes, character.character_info.base.current_class);
  for (var i = 0; i < gameData.skills.length; i++) {
    var dskill = gameData.skills[i];
    var cskill = character.character_info.skills[dskill.name];
    
    if (cskill === undefined) {
      character.character_info.skills[dskill.name] = {
        "tmp_mod": 0,
        "extra_mod": 0,
        "total": 0,
        "ranks": 0,
        "attr_mod": 0
      };
      cskill = character.character_info.skills[dskill.name];
    }
    
    if (cskill.tmp_mod === undefined) {
      cskill.tmp_mod = 0;
    }
    cskill.extra_mod = 0;
    if (($.inArray(dskill.name, character.character_info.base.permanentSkills) !== -1) &&
        cc !== undefined && ($.inArray(dskill.name, cc.ClassSkills) !== -1)) {
      cskill.extra_mod = 1;
    }

    cskill.attr_mod = character.character_info.attributes[dskill.attribute].mod;
    cskill.total = cskill.ranks + cskill.attr_mod + cskill.extra_mod + Number(cskill.tmp_mod);
  }
}
