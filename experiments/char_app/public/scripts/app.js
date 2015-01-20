'use strict';

// Returns a random integer between min (included) and max (excluded)
// Using Math.round() will give you a non-uniform distribution!
function getRandomInt(min, max) {
   return Math.floor(Math.random() * (max - min)) + min;
}

function migrationCharacterData(character) {
  // Migrate data
  if (typeof character.wiki.ci.misc.grit === "number") {
    character.wiki.ci.misc.grit = {};
  }
  if (character.wiki.options === undefined) {
    character.wiki.options = {};
    character.wiki.options.show_all = false;
  }
  if (character.wiki.ci.misc.initiative === undefined) {
    character.wiki.ci.misc.initiative = {};
  }
  if (character.wiki.ci.misc.speed === undefined) {
    character.wiki.ci.misc.speed = {};
  }
  if (character.wiki.ci.misc.ranged === undefined) {
    character.wiki.ci.misc.ranged = {};
  }
  if (character.wiki.ci.misc.melee === undefined) {
    character.wiki.ci.misc.melee = {};
  }
  if (character.wiki.ci.misc.grapple === undefined) {
    character.wiki.ci.misc.grapple = {};
  }
  if (character.wiki.ci.misc.grit.damage === undefined) {
    character.wiki.ci.misc.grit.damage = 0;
  }
  if (character.wiki.ci.misc.reputation.tmpadj === undefined) {
    character.wiki.ci.misc.reputation.tmpadj = 0;
  }
  if (character.wiki.ci.misc.defense.tmpadj === undefined) {
    character.wiki.ci.misc.defense.tmpadj = 0;
  }
  if (character.wiki.ci.misc.initiative.tmpadj === undefined) {
    character.wiki.ci.misc.initiative.tmpadj = 0;
  }
  if (character.wiki.ci.misc.speed.tmpadj === undefined) {
    character.wiki.ci.misc.speed.tmpadj = 0;
  }
  if (character.wiki.ci.misc.melee.tmpadj === undefined) {
    character.wiki.ci.misc.melee.tmpadj = 0;
  }
  if (character.wiki.ci.misc.ranged.tmpadj === undefined) {
    character.wiki.ci.misc.ranged.tmpadj = 0;
  }
  if (character.wiki.ci.misc.grapple.tmpadj === undefined) {
    character.wiki.ci.misc.grapple.tmpadj = 0;
  }
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
        templateUrl: '/views/info.html',
        controller: 'InfoCtrl'
      })
      .when('/base', {
        templateUrl: '/views/main.html',
        controller: 'MainCtrl'
      })
      .when('/info', {
        templateUrl: '/views/info.html',
        controller: 'InfoCtrl'
      })
      .when('/ledger', {
        templateUrl: '/views/ledger.html',
        controller: 'LedgerCtrl'
      })
      .when('/skills', {
        templateUrl: '/views/skills.html',
        controller: 'SkillsCtrl'
      })
      .when('/feats', {
        templateUrl: '/views/feats.html',
        controller: 'FeatsCtrl'
      })
      .when('/talents', {
        templateUrl: '/views/talents.html',
        controller: 'TalentsCtrl'
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
        url: "/game-data.json",
        mimeType: "application/json",
        dataType: 'json',
        data: null,
        success: function( data ) {
          var d = new Date();
          items=data;
          items.current_date = d.getFullYear() + "/" + (d.getMonth()+1) + "/" + d.getDate();
          if (typeof items !== 'number' && typeof character !== 'number' && character.wiki !== null) {
            ledger_calculate(items, character);
          }
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
        url: global_character_id + ".json",
        mimeType: "application/json",
        dataType: 'json',
        data: null,
        success: function( data ) {
          character=data;
          if (character.wiki === null || character.wiki.ledger_id === undefined) {
            $.ajax({
              url: "/character-base.json",
              mimeType: "application/json",
              dataType: 'json',
              data: null,
              success: function( data ) {
                character.wiki=data;
                migrationCharacterData(character);
                if (typeof items !== 'number' && typeof character !== 'number') {
                  ledger_calculate(items, character);
                }
                itemsDefer.resolve(character);
              },
              error: function(jq, reason, error) {
                alert(reason + "::" + error);
              }
            });
          }
          else {
            migrationCharacterData(character);
            if (typeof items !== 'number' && typeof character !== 'number') {
              ledger_calculate(items, character);
            }
            itemsDefer.resolve(character);
          }
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

  service.saveCharacter=function() {
    var data = {};
    data.data = character;
    $.ajax({
      type: "PUT",
      url: "/characters/" + global_character_id + ".json",
      data: JSON.stringify(data),
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      success: function(msg) {
        alert(character.name + " saved successfully");
      },
      error: function(msg) {
        alert('Error: ' + character.name + " saved failed. " + msg);
      }
    });
  };

  return service;
}]);

function calculate(gameData, character) {
  for (var i = 0; i < gameData.calculations.length; i++) {
    var v = gameData.calculations[i].value;
    var e = gameData.calculations[i].eval;

    eval(v + " = " + e);
  }

  var cc = findLedgerTypeEntry(gameData.classes, character.wiki.ci.base.current_class);
  for (var i = 0; i < gameData.skills.length; i++) {
    var dskill = gameData.skills[i];
    var cskill = character.wiki.ci.skills[dskill.name];

    if (cskill === undefined) {
      character.wiki.ci.skills[dskill.name] = {
        "tmp_mod": 0,
        "extra_mod": 0,
        "total": 0,
        "ranks": 0,
        "attr_mod": 0
      };
      cskill = character.wiki.ci.skills[dskill.name];
    }

    if (cskill.tmp_mod === undefined) {
      cskill.tmp_mod = 0;
    }

    if (($.inArray(dskill.name, character.wiki.ci.base.permanentSkills) !== -1) &&
        cc !== undefined && ($.inArray(dskill.name, cc.ClassSkills) !== -1)) {
      cskill.extra_mod += 1;
    }

    if (dskill.attribute === "None") {
      cskill.attr_mod = 0;
    }
    else {
      cskill.attr_mod = character.wiki.ci.attributes[dskill.attribute].mod;
    }
    cskill.total = cskill.ranks + cskill.attr_mod + cskill.extra_mod + Number(cskill.tmp_mod);
  }
}
