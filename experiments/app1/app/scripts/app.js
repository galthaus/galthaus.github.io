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

  if (expanded === 1) {
    if (type === "Number") {
      eval(varName + " = Number(0)");
    }
  }
}

function ledger_clear(gameData, character) {
  for (var key in gameData.ledger_clear) {
    var index = key.indexOf(".*.");

    if (index !== -1) {
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
  var d = new Date();
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
      if (character.ledger[index].id === le.children[i])
        break;
    }

    if (index !== character.ledger.length) {
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
    if ( a.id < b. id )
        return -1;
    if ( a.id > b.id )
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
      var level_index = 0;
      var level_feature = "";
      var grit_value = 0;

      for (ci = 0; ci < character.character_info.base.classes.length; ci++) {
        var e = character.character_info.base.classes[ci];
        if (e.name === el.long) {
          level_index = e.level;
          e.level += 1;
          addedLevel = 1;
          break;
        }
      }
      if (addedLevel === 0) {
        var e = { "name": el.long, "level": 1 };
        character.character_info.base.classes.push(e);
      }
      
      if (level_index > 0) {
        character.character_info.misc.bab -= gameData.charts.bab[el.charts.bab][level_index - 1];
        character.character_info.saves.fort.base -= gameData.charts.fort[el.charts.fort][level_index - 1];
        character.character_info.saves.ref.base -= gameData.charts.ref[el.charts.ref][level_index - 1];
        character.character_info.saves.will.base -= gameData.charts.will[el.charts.will][level_index - 1];
        character.character_info.misc.defense.base -= gameData.charts.defense[el.charts.defense][level_index - 1];
        character.character_info.misc.reputation.base -= gameData.charts.reputation[el.charts.reputation][level_index - 1];   
      }
      character.character_info.misc.bab += gameData.charts.bab[el.charts.bab][level_index];
      character.character_info.saves.fort.base += gameData.charts.fort[el.charts.fort][level_index];
      character.character_info.saves.ref.base += gameData.charts.ref[el.charts.ref][level_index];
      character.character_info.saves.will.base += gameData.charts.will[el.charts.will][level_index];
      character.character_info.misc.defense.base += gameData.charts.defense[el.charts.defense][level_index];
      character.character_info.misc.reputation.base += gameData.charts.reputation[el.charts.reputation][level_index];
      
      level_feature = el.Features[level_index];
      if (level_feature === "Bonus Feat") {
        character.character_info.scratch.feats += 1;
      }
      else if (level_feature === "Talent") {
        character.character_info.scratch.talents += 1;  
      }
      
      character.character_info.base.current_class = el.long;
      character.character_info.base.character_level += 1;
      character.character_info.misc.action_points += eval(el.ActionPoints);
      character.character_info.scratch.gritdie += 1;

      if (character.character_info.base.character_level % 4 === 0) {
        character.character_info.scratch.stats += 1;
      }
      if (character.character_info.base.character_level % 3 === 0) {
        character.character_info.scratch.feats += 1;
      }

      if (addedLevel === 0 && ci === 0) {
        // Initial Level
        character.character_info.scratch.skills += eval(el.StartSkillPoints);
	character.character_info.scratch.feats += el.StartingFeatCount + 
	           el.StartingFeats.length;

        if (le.children.length === 0) {
          grit_value = el.GritDie.substring(1);
        }
      }
      else {
        // Follow-on Level
        character.character_info.scratch.skills += eval(el.SkillPoints);

        if (le.children.length === 0) {
          grit_value = getRandomInt(0, Number(el.GritDie.substring(1))) + 1;
        }
      }

      if (le.children.length === 0) {  
        var e;

        e = ledger_addentry(character, "Roll", "Grit", el.GritDie, grit_value, "Edit Me");
        e.parent = le.id;
        le.children.push(e.id);
          
        if (addedLevel === 0 && ci === 0) {
          for (var xx in el.StartingFeats) {
            e = ledger_addentry(character, "Spend", "Feat", xx, 1, "Starting Feat for " + el.long);
            e.parent = le.id;
            le.children.push(e.id);
          }
        }
          
        // Add Talent or Bonus Feat from list
        if (level_feature === "Bonus Feat") {
          e = ledger_addentry(character, "Spend", "Feat", "???", 1, "Bonus Feat for " + el.long);
          e.parent = le.id;
          le.children.push(e.id);
        }
        else if (level_feature === "Talent") {
          e = ledger_addentry(character, "Spend", "Talent", "???", 1, "Talent for " + el.long);
          e.parent = le.id;
          le.children.push(e.id);  
        }
      
        // Add stat on levels / 4. 
        if (character.character_info.base.character_level % 4 === 0) {
          e = ledger_addentry(character, "Spend", "Stat", "???", 1, "Stat Point for Level/4"); 
          e.parent = le.id;
          le.children.push(e.id);
        }
          
        // Add Feat on levels / 3. 
        if (character.character_info.base.character_level % 3 === 0) {
          e = ledger_addentry(character, "Spend", "Feat", "???", 1, "Feat for Level/3"); 
          e.parent = le.id;
          le.children.push(e.id);
        }
      }
    }

    if (le.action === "Roll" && le.param1 === "Grit") {
      character.character_info.scratch.gritdie -= 1;
    }
    if (le.action === "Spend" && le.param1 === "Stat") {
      character.character_info.scratch.stats -= Number(le.value);
    }
    if (le.action === "Spend" && le.param1 === "Skill") {
      character.character_info.scratch.skills -= Number(le.value);
    }
    if (le.action === "Spend" && le.param1 === "Feat") {
      character.character_info.scratch.feats -= Number(le.value);
    }
    if (le.action === "Spend" && le.param1 === "Talent") {
      character.character_info.scratch.talents -= Number(le.value);
    }
    if (le.action === "Spend" && le.param1 === "Occupation") {
      character.character_info.scratch.occupation -= 1;
    }

    // Calculate each time - this is badish, but okay for now.
    calculate(gameData, character);
  }
}
