
define(["jquery", "game", "item", "inventory", "room", "util", "vendor/underscore"], function($, Game, Item, Inventory, Room, util) {
  var GameEvent;
  GameEvent = {
    init: function(events) {
      var event, _i, _len, _results;
      if (events) {
        _results = [];
        for (_i = 0, _len = events.length; _i < _len; _i++) {
          event = events[_i];
          _results.push(this.allById[event.id] = event);
        }
        return _results;
      }
    },
    allById: {},
    verifyAndExecute: function(eventData) {
      var dataType, datum, event, _i, _len, _results;
      dataType = util.typeOf(eventData);
      switch (dataType) {
        case "string":
          event = GameEvent.allById[eventData];
          if (event != null) {
            return GameEvent.verifyAndExecute(event);
          } else {
            throw "Couldn't find an event in your game with id '" + eventData + "'";
          }
          break;
        case "array":
          _results = [];
          for (_i = 0, _len = eventData.length; _i < _len; _i++) {
            datum = eventData[_i];
            _results.push(GameEvent.verifyAndExecute(datum));
          }
          return _results;
          break;
        case "object":
          if (typeof GameEvent[eventData.type] !== 'function') {
            throw "The event '" + eventData.id + "'' you specified is of a type unknown to Picaro: " + eventData.type;
          }
          return GameEvent.execute(eventData);
        default:
          throw "Your action had an invalid 'after' event specified: " + eventData;
      }
    },
    execute: function(event) {
      if (event.message) {
        $(document).trigger("updateStatus", event.message);
      }
      return GameEvent[event.type](event);
    },
    updateStatus: function(gameEvent) {},
    takeItem: function(gameEvent) {
      var item;
      item = Item.find(util.toIdString(gameEvent.item));
      return $(document).trigger("immediateTake", item);
    },
    dropItem: function(gameEvent) {
      Inventory.remove(gameEvent.item);
      gameEvent.item.location = Room.current.name;
      return $(document).trigger("resetMenus");
    },
    removeItem: function(gameEvent) {
      Inventory.remove(gameEvent.item);
      Item.find(gameEvent.item).location = void 0;
      return $(document).trigger("resetMenus");
    },
    updateAttribute: function(gameEvent) {
      Item.find(gameEvent.item)[gameEvent.attribute] = gameEvent.newValue;
      return $(document).trigger("resetMenus");
    },
    decreaseAttribute: function(gameEvent) {
      var item;
      item = Item.find(gameEvent.item);
      return item[gameEvent.attribute] -= gameEvent.by;
    },
    increaseAttribute: function(gameEvent) {
      var item;
      item = Item.find(gameEvent.item);
      return item[gameEvent.attribute] += gameEvent.by;
    },
    checkAttribute: function(gameEvent) {
      var attributeValue, event;
      attributeValue = Item.find(gameEvent.item)[gameEvent.attribute];
      if (event = gameEvent.when[attributeValue] || gameEvent.when["else"]) {
        if (typeof event === 'string') {
          return $(document).trigger("updateStatus", event);
        } else if (event.after) {
          if (event.message) {
            $(document).trigger("updateStatus", event.message);
          }
          return this.verifyAndExecute(event.after);
        }
      }
    },
    endGame: function(gameEvent) {
      var gameAuthor, gameName;
      gameName = Game.current.name || "a mysteriously un-named Picaro Game";
      gameAuthor = Game.current.author || "Anonymous";
      if (Game.current.authorURL) {
        gameAuthor = "<a href='" + (encodeURI(Game.current.authorURL)) + "'>" + gameAuthor + "</a>";
      }
      return $(document).trigger("gameOver", "This has been &ldquo;" + gameName + "&rdquo; by " + gameAuthor + ".");
    },
    replaceItems: function(gameEvent) {
      var newItem, oldItemsWereInInventory;
      oldItemsWereInInventory = false;
      _(gameEvent.items).each(function(itemId, index) {
        var id;
        id = util.toIdString(itemId);
        if (Inventory.remove(id)) {
          oldItemsWereInInventory = true;
        }
        return Item.remove(id);
      });
      newItem = Item.create(gameEvent.newItem, {
        location: Room.current.id
      });
      if (oldItemsWereInInventory || gameEvent.takeNewItem) {
        Inventory.add(newItem);
      }
      return $(document).trigger("resetMenus");
    }
  };
  $(document).bind("gameEvent", function(e, action) {
    return GameEvent.verifyAndExecute(action.after);
  });
  return GameEvent;
});
