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
      .otherwise({
        redirectTo: '/'
      });
  });

angular.module('wildWestCharSheetApp').directive('chAttribute', function() {
  return {
    restrict: 'A',
    scope: {
      info: '=info',
      aname: '@',
      calculate: '&calculate'
    },
    templateUrl: 'views/ch-attribute.html'
  };
});

angular.module('wildWestCharSheetApp').directive('chSave', function() {
  return {
    restrict: 'A',
    scope: {
      info: '=info',
      aname: '@',
      calculate: '&calculate'
    },
    templateUrl: 'views/ch-save.html'
  };
});

angular.module('wildWestCharSheetApp').directive('ledgerRow', function() {
  return {
    restrict: 'A',
    scope: {
      rowdata: '=rowdata',
      items: '=items',
      calculate: '&calculate',
      delete: '&'
    },
    controller: function($scope) {
      $scope.getTypeData = function(act, p1) {
        return getLedgerTypeData($scope.items, act, p1);
      };
    },
    templateUrl: 'views/ledger-row.html'
  };
});

angular.module('wildWestCharSheetApp').factory('dataService', [ '$q', '$resource', '$rootScope', function($q, $resource, $rootScope) {
  var items=0;
  var character=0;
  var service={};

  service.getItems=function() {
    var itemsDefer=$q.defer();
    if (typeof items != 'number') {
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
          itemsDefer.resolve(items)
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
          itemsDefer.resolve(character)
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
    calculate(items, character);
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
}

function getLedgerType(gameData, act, p1) {
  if (gameData.ledger[act] === undefined) {
    return [];
  }
  if (gameData.ledger[act][p1] === undefined) {
    return [];
  }

  return gameData.ledger[act][p1]["type"];
}

function getLedgerTypeData(gameData, act, p1) {
  var atype = getLedgerType(gameData, act, p1);
  return gameData[atype];
}

function findLedgerTypeEntry(arr, p2) {
  if (arr === undefined) {
    return undefined;
  }
  for (var i = 0; i < arr.length; i++) {
    if (arr[i].long === p2) {
      return arr[i];
    }
  }
  return undefined;
}

function var_expand(gameData, character, varName, type) {
  var arr = varName.split(".");
  var newVar = arr[0];
  var expanded = 0;

  for (var i = 1; i < (arr.length-1); i++) {
    newVar = newVar + "." + arr[i];

    if (eval(newVar) === undefined) {
      eval(newVar + " = {}");
      expanded = 1;
    }
  }

  if (expanded == 1) {
    if (type === "Number") {
      eval(varName + " = Number(0)");
    }
  }
}

function ledger_clear(gameData, character) {
  for (var key in gameData.ledger_clear) {
    var index = key.indexOf(".*.");

    if (index != -1) {
      var strbase = key.substring(0, index);
      var strend = key.substring(index+3);

      for (var val in eval(strbase)) {
        eval(strbase + "." + val + "." + strend + "=" + gameData.ledger_clear[key]);
      }
    }
    else {
      eval(key + "=" + gameData.ledger_clear[key]);
    }
  }
}

function ledger_addentry(character, a, p1, p2, v, details) {
  var d = new Date()
  var date = d.getFullYear() + "/" + (d.getMonth()+1) + "/" + d.getDate();

  var e = { "date": date, "action": a, "param1": p1, "param2": p2, "value": v, "details": details,
            "id": character.ledger_id, "children": [] };
  character.ledger_id += 1;

  character.ledger.push(e);

  return e;
}

function ledger_deleteentry(character, index) {
  var arr = character.ledger.splice(index,1);
  var le = arr[0];

  for (var i = 0; i < le.children.length; i++) {
    var index;
    for (index = 0; index < character.ledger.length; index++) {
      if (character.ledger[index].id == le.children[i])
        break;
    }

    if (index != character.ledger.length) {
      ledger_deleteentry(character, index);
    }
  }
}

function ledger_calculate(gameData, character) {
  // Sort ledger
  character.ledger.sort(function(a,b) {
    if ( a.date < b.date )
      return -1;
    if ( a.date > b.date )
      return 1;
    return 0;
  });

  // Clear values
  ledger_clear(gameData, character);

  // Process ledger
  for (var i = 0; i < character.ledger.length; i++) {
    var le = character.ledger[i];

    if (gameData.current_date < le.date) {
      break;
    }

    var type_name = getLedgerType(gameData, le.action, le.param1);
    var item = gameData[type_name];
    var el = findLedgerTypeEntry(item, le.param2);

    if (el === undefined) {
      continue;
    }

    if (el.type === "Number") {
      var base = eval("gameData." + type_name + "_base");
      var varName = base.replace("__REPLACE__", el.long);

      var_expand(gameData, character, varName, el.type);
      eval(varName + " += Number(" + le.value + ");");
    }

    if (type_name === "occupations") {
      character.character_info.base.occupation = el.long;

      // GREG: Add benefits!
    }

    if (type_name === "classes") {
      var ci = 0;
      var addedLevel = 0;

      for (ci = 0; ci < character.character_info.base.classes.length; ci++) {
        var e = character.character_info.base.classes[ci];
        if (e.name === el.long) {
          e.level += 1;
          addedLevel = 1;
          break;
        }
      }

      if (addedLevel == 0) {
        var e = { "name": el.long, "level": 1 };
        character.character_info.base.classes.push(e);
      }
      character.character_info.base.current_class = el.long;

      if (addedLevel == 0 && ci == 0) {
        // Initial Level
        character.character_info.scratch.gritdie += 1;

        if (le.children.length == 0) {
          var e;

          e = ledger_addentry(character, "Roll", "Grit", el.GritDie, el.GritDie.substring(1), "Edit Me");
          e.parent = le.id;
          le.children.push(e.id);
        }
      }
      else {

        // Follow-on Level
        character.character_info.scratch.gritdie += 1;

        if (le.children.length == 0) {
          var e;

          e = ledger_addentry(character, "Roll", "Grit", el.GritDie, 
                              getRandomInt(0, Number(el.GritDie.substring(1))) + 1, "Edit Me");
          e.parent = le.id;
          le.children.push(e.id);
        }
      }

      // GREG: Add benefits!
    }

    if (le.action == "Roll" && le.param1 === "Grit") {
      character.character_info.scratch.gritdie -= 1;
    }
    if (le.action == "Spend" && le.param1 === "Stat") {
      character.character_info.scratch.stats -= Number(le.value);
    }
    if (le.action == "Spend" && le.param1 === "Skill") {
      character.character_info.scratch.skills -= Number(le.value);
    }
    if (le.action == "Spend" && le.param1 === "Feat") {
      character.character_info.scratch.feats -= Number(le.value);
    }
    if (le.action == "Spend" && le.param1 === "Talent") {
      character.character_info.scratch.talents -= Number(le.value);
    }
    if (le.action == "Spend" && le.param1 === "Occupation") {
      character.character_info.scratch.occupation -= 1;
    }

  }

  calculate(gameData, character);
}

