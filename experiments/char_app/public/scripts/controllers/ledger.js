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
          rowdata.choices.push(arr[i].name);
        }
        return rowdata.choices;
      };
      $scope.setChoices();
    },
    templateUrl: '/views/ledger-row.html'
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
    if (arr[i].name === p2) {
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
    if (type === "Skill") {
      eval(varName + " = { \"total\": 0, \"ranks\": 0, \"extra_mod\": 0, \"attr_mod\": 0 }");
    }
    if (type === "Feat") {
      eval(varName + " = { \"purchased\": false }");
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
        eval(strbase + "[\"" + val + "\"]." + strend + "=" + gameData.ledger_clear[key]);
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
            "id": character.wiki.ledger_id, "children": [] };
  character.wiki.ledger_id += 1;

  character.wiki.ledger.push(e);

  return e;
}

function ledger_deleteentry(character, index) {
  var arr = character.wiki.ledger.splice(index,1);
  var le = arr[0];

  for (var i = 0; i < le.children.length; i++) {
    var index;
    for (index = 0; index < character.wiki.ledger.length; index++) {
      if (character.wiki.ledger[index].id === le.children[i])
        break;
    }

    if (index !== character.wiki.ledger.length) {
      ledger_deleteentry(character, index);
    }
  }
}

function add_skill_bonus(gameData, character, skill, bonus) {
  var cskill = character.wiki.ci.skills[skill];
    
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
  cskill.extra_mod += bonus;  
}

function ledger_calculate(gameData, character) {
  // Sort ledger
  character.wiki.ledger.sort(function(a,b) {
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
  for (var i = 0; i < character.wiki.ledger.length; i++) {
    var le = character.wiki.ledger[i];

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
      var varName = base.replace("__REPLACE__", el.name);

      var_expand(gameData, character, varName, el.type);
      eval(varName + " += Number(" + le.value + ");");
    }
    if (el.type === "Boolean") {
      var base = eval("gameData." + type_name + "_base");
      var varName = base.replace("__REPLACE__", el.name);

      var_expand(gameData, character, varName, el.type);
      eval(varName + " = true;");
    }
    
    if (type_name === "feats") {
      for (var ii = 0; ii < el.actions.length; ii++) {
        var action = el.actions[ii];
        eval(action);
      }
    }

    if (type_name === "occupations") {
      character.wiki.ci.base.occupation = el.name;
      character.wiki.ci.scratch.feats += el.BonusFeatCount;

      if (le.children.length === 0) { 
        for (var ii = 0; ii < el.SkillsCount; ii++) {
          var e;
        
          e = ledger_addentry(character, "Spend", "PermanentSkill", el.Skills[0], 1, "Permanent Skill for " + el.name);
          e.parent = le.id;
          e.choices = el.Skills;
          le.children.push(e.id);
        }
      
        for (var ii = 0; ii < el.BonusFeatCount; ii++) {
          var e;
        
          e = ledger_addentry(character, "Spend", "Feat", el.BonusFeats[0], 1, "Starting Feat for " + el.name);
          e.parent = le.id;
          e.choices = el.BonusFeats;
          le.children.push(e.id);
        }
      }
      character.wiki.ci.misc.wealth += el.WealthBonus;
      character.wiki.ci.misc.reputation.bonus += el.RepBonus;
    }

    if (type_name === "classes") {
      var ci = 0;
      var addedLevel = 0;
      var level_index = 0;
      var level_feature = "";
      var grit_value = 0;

      for (ci = 0; ci < character.wiki.ci.base.classes.length; ci++) {
        var e = character.wiki.ci.base.classes[ci];
        if (e.name === el.name) {
          level_index = e.level;
          e.level += 1;
          addedLevel = 1;
          break;
        }
      }
      if (addedLevel === 0) {
        var e = { "name": el.name, "level": 1 };
        character.wiki.ci.base.classes.push(e);
      }
      
      if (level_index > 0) {
        character.wiki.ci.misc.bab -= gameData.charts.bab[el.charts.bab][level_index - 1];
        character.wiki.ci.saves.fort.base -= gameData.charts.fort[el.charts.fort][level_index - 1];
        character.wiki.ci.saves.ref.base -= gameData.charts.ref[el.charts.ref][level_index - 1];
        character.wiki.ci.saves.will.base -= gameData.charts.will[el.charts.will][level_index - 1];
        character.wiki.ci.misc.defense.base -= gameData.charts.defense[el.charts.defense][level_index - 1];
        character.wiki.ci.misc.reputation.base -= gameData.charts.reputation[el.charts.reputation][level_index - 1];   
      }
      character.wiki.ci.misc.bab += gameData.charts.bab[el.charts.bab][level_index];
      character.wiki.ci.saves.fort.base += gameData.charts.fort[el.charts.fort][level_index];
      character.wiki.ci.saves.ref.base += gameData.charts.ref[el.charts.ref][level_index];
      character.wiki.ci.saves.will.base += gameData.charts.will[el.charts.will][level_index];
      character.wiki.ci.misc.defense.base += gameData.charts.defense[el.charts.defense][level_index];
      character.wiki.ci.misc.reputation.base += gameData.charts.reputation[el.charts.reputation][level_index];
      
      level_feature = el.Features[level_index];
      if (level_feature === "Bonus Feat") {
        character.wiki.ci.scratch.feats += 1;
      }
      else if (level_feature === "Talent") {
        character.wiki.ci.scratch.talents += 1;  
      }
      
      character.wiki.ci.base.current_class = el.name;
      character.wiki.ci.base.character_level += 1;
      character.wiki.ci.misc.action_points += eval(el.ActionPoints);
      character.wiki.ci.scratch.gritdie += 1;

      if (character.wiki.ci.base.character_level % 4 === 0) {
        character.wiki.ci.scratch.stats += 1;
      }
      if (character.wiki.ci.base.character_level % 3 === 0) {
        character.wiki.ci.scratch.feats += 1;
      }

      if (addedLevel === 0 && ci === 0) {
        // Initial Level
        character.wiki.ci.scratch.skills += eval(el.StartSkillPoints);
	character.wiki.ci.scratch.feats += el.StartingFeatCount + 
	           el.StartingFeats.length;

        if (le.children.length === 0) {
          grit_value = el.GritDie.substring(1);
        }
      }
      else {
        // Follow-on Level
        character.wiki.ci.scratch.skills += eval(el.SkillPoints);

        if (le.children.length === 0) {
          grit_value = getRandomInt(0, Number(el.GritDie.substring(1))) + 1;
        }
      }

      if (le.children.length === 0) {  
        var e;

        e = ledger_addentry(character, "Roll", "Grit", el.GritDie, grit_value, "Grit Die for " + el.name);
        e.parent = le.id;
        le.children.push(e.id);
          
        if (addedLevel === 0 && ci === 0) {
          for (var xxi = 0; xxi < el.StartingFeats.length; xxi++) {
            e = ledger_addentry(character, "Spend", "Feat", el.StartingFeats[xxi], 1, "Starting Feat for " + el.name);
            e.parent = le.id;
            e.choices = [ el.StartingFeats[xxi] ];
            le.children.push(e.id);
          }
        }
          
        // Add Talent or Bonus Feat from list
        if (level_feature === "Bonus Feat") {
          e = ledger_addentry(character, "Spend", "Feat", el.BonusFeatList[0], 1, "Bonus Feat for " + el.name);
          e.parent = le.id;
          e.choices = el.BonusFeatList;
          le.children.push(e.id);
        }
        else if (level_feature === "Talent") {
          e = ledger_addentry(character, "Spend", "Talent", "???", 1, "Talent for " + el.name);
          e.parent = le.id;
          e.choices = el.Talents;
          e.param2 = e.choices[0];
          le.children.push(e.id);  
        }
      
        // Add stat on levels / 4. 
        if (character.wiki.ci.base.character_level % 4 === 0) {
          e = ledger_addentry(character, "Spend", "Stat", "Strength", 1, "Stat Point for Level/4"); 
          e.parent = le.id;
          le.children.push(e.id);
        }
          
        // Add Feat on levels / 3. 
        if (character.wiki.ci.base.character_level % 3 === 0) {
          e = ledger_addentry(character, "Spend", "Feat", "?GREG?", 1, "Feat for Level/3"); 
          e.parent = le.id;
          le.children.push(e.id);
        }
      }
    }

    if (le.action === "Roll" && le.param1 === "Grit") {
      character.wiki.ci.scratch.gritdie -= 1;
    }
    else if (le.action === "Roll") {
        // Nothing
    }
    else if (le.action === "Buy") {
        // Nothing
    }
    else if (le.action === "Spend" && le.param1 === "Stat") {
      character.wiki.ci.scratch.stats -= Number(le.value);
    }
    else if (le.action === "Spend" && le.param1 === "Skill") {
      character.wiki.ci.scratch.skills -= Number(le.value);
      var cc = findLedgerTypeEntry(gameData.classes, character.wiki.ci.base.current_class);
      var divMod = 2;
      if ($.inArray(le.param2, cc.ClassSkills) !== -1) {
        divMod = 1;
      }
      if ($.inArray(le.param2, character.wiki.ci.base.permanentSkills) !== -1) {
        divMod = 1;
      }
      character.wiki.ci.skills[le.param2].ranks += (Number(le.value) / divMod);
    }
    else if (le.action === "Spend" && le.param1 === "PermanentSkill") {
      character.wiki.ci.base.permanentSkills.push(le.param2);
    }
    else if (le.action === "Spend" && le.param1 === "Feat") {
      character.wiki.ci.scratch.feats -= 1;
    }
    else if (le.action === "Spend" && le.param1 === "Talent") {
      character.wiki.ci.scratch.talents -= 1;
    }
    else if (le.action === "Spend" && le.param1 === "Occupation") {
      character.wiki.ci.scratch.occupation -= 1;
    }

    // Calculate each time - this is badish, but okay for now.
    calculate(gameData, character);
  }
}
