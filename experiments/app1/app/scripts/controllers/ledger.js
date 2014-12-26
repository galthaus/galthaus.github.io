'use strict';

/**
 * @ngdoc function
 * @name iwildWestCharSheetApp.controller:LedgerCtrl
 * @description
 * # LedgerCtrl
 * Controller of the wildWestCharSheetApp
 */
angular.module('wildWestCharSheetApp').controller('LedgerCtrl', function ($scope, dataService) {

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

  $scope.addEntry = function() {
    ledger_addentry($scope.character, "Buy", "Equipment", "Boomerang", "0", "Edit me");
  };

  $scope.deleteEntry = function(index) {
    ledger_deleteentry($scope.character, index);
    $scope.calculate();
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
      $scope.setChoices = function() {
        var rowdata = $scope.rowdata;
        
        if (rowdata.choices !== undefined) {
          return rowdata.choices;
        }
          
        var arr = getLedgerTypeData($scope.items, rowdata.action, rowdata.param1);
        if (arr === undefined) {
          return [];
        }
        rowdata.choices = [];
        for (var i = 0; i < arr.length; i++) {
          rowdata.choices.push(arr[i].long);
        }
        return rowdata.choices;
      };
      $scope.setChoices();
    },
    templateUrl: 'views/ledger-row.html'
  };
});

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
    newVar = newVar + "." + arr[i].replace(/ /g, "_");

    if (eval(newVar) === undefined) {
      eval(newVar + " = {}");
      expanded = 1;
    }
  }

  if (expanded === 1) {
    if (type === "Number") {
      eval(varName.replace(/ /g, "_") + " = Number(0)");
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
      eval(varName.replace(/ /g, "_") + " += Number(" + le.value + ");");
    }

    if (type_name === "occupations") {
      character.character_info.base.occupation = el.long;
      character.character_info.scratch.feats += el.BonusFeatCount;

      if (le.children.length === 0) { 
        for (var ii = 0; ii < el.SkillsCount; ii++) {
          var e;
        
          e = ledger_addentry(character, "Spend", "PermanentSkill", el.Skills[0], 1, "Permanent Skill for " + el.long);
          e.parent = le.id;
          e.choices = el.Skills;
          le.children.push(e.id);
        }
      
        for (var ii = 0; ii < el.BonusFeatCount; ii++) {
          var e;
        
          e = ledger_addentry(character, "Spend", "Feat", el.BonusFeats[0], 1, "Starting Feat for " + el.long);
          e.parent = le.id;
          e.choices = el.BonusFeats;
          le.children.push(e.id);
        }
      }
      character.character_info.misc.wealth += el.WealthBonus;
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

        e = ledger_addentry(character, "Roll", "Grit", el.GritDie, grit_value, "Grit Die for " + el.long);
        e.parent = le.id;
        le.children.push(e.id);
          
        if (addedLevel === 0 && ci === 0) {
          for (var xxi = 0; xxi < el.StartingFeats.length; xxi++) {
            e = ledger_addentry(character, "Spend", "Feat", el.StartingFeats[xxi], 1, "Starting Feat for " + el.long);
            e.parent = le.id;
            e.choices = [ el.StartingFeats[xxi] ];
            le.children.push(e.id);
          }
        }
          
        // Add Talent or Bonus Feat from list
        if (level_feature === "Bonus Feat") {
          e = ledger_addentry(character, "Spend", "Feat", el.BonusFeatList[0], 1, "Bonus Feat for " + el.long);
          e.parent = le.id;
          e.choices = el.BonusFeatList;
          le.children.push(e.id);
        }
        else if (level_feature === "Talent") {
          e = ledger_addentry(character, "Spend", "Talent", "???", 1, "Talent for " + el.long);
          e.parent = le.id;
          e.choices = el.Talents;
          e.param2 = e.choices[0];
          le.children.push(e.id);  
        }
      
        // Add stat on levels / 4. 
        if (character.character_info.base.character_level % 4 === 0) {
          e = ledger_addentry(character, "Spend", "Stat", "Strength", 1, "Stat Point for Level/4"); 
          e.parent = le.id;
          le.children.push(e.id);
        }
          
        // Add Feat on levels / 3. 
        if (character.character_info.base.character_level % 3 === 0) {
          e = ledger_addentry(character, "Spend", "Feat", "?GREG?", 1, "Feat for Level/3"); 
          e.parent = le.id;
          le.children.push(e.id);
        }
      }
    }

    if (le.action === "Roll" && le.param1 === "Grit") {
      character.character_info.scratch.gritdie -= 1;
    }
    else if (le.action === "Roll") {
        // Nothing
    }
    else if (le.action === "Buy") {
        // Nothing
    }
    else if (le.action === "Spend" && le.param1 === "Stat") {
      character.character_info.scratch.stats -= Number(le.value);
    }
    else if (le.action === "Spend" && le.param1 === "Skill") {
      character.character_info.scratch.skills -= Number(le.value);
    }
    else if (le.action === "Spend" && le.param1 === "Feat") {
      character.character_info.scratch.feats -= 1;
    }
    else if (le.action === "Spend" && le.param1 === "Talent") {
      character.character_info.scratch.talents -= 1;
    }
    else if (le.action === "Spend" && le.param1 === "Occupation") {
      character.character_info.scratch.occupation -= 1;
    }

    // Calculate each time - this is badish, but okay for now.
    calculate(gameData, character);
  }
}
