# Game Events
# ==============
# The primary way in which the gameworld responds to player action is via events.  Currently, an "after" event is all that's specified, but at some point we will likely add "before" events or events that occur after some period of time has elapsed. The idea is that an event ID can be attached to any action (a verb called on an item) as its "after" property.  When an action (generally, anything of the form "verb + noun") is performed, the event will be looked up and triggered here if it is one of the known types.

# First we declare our dependencies on Item, Inventory and Room, as well as the usual suspects, $ and _.
define [ "jquery", "game", "item", "inventory", "room", "util", "vendor/underscore"], ($, Game, Item, Inventory, Room, util) ->
  GameEvent =
    # We take the array of events from the game JSON and store them, hashed by ID.
    init: (events) ->
      @allById[event.id] = event for event in events if events

    allById: {}

    # Makes sure the game event that was triggered is defined in your game file, and is of a type supported by Picaro.
    verifyAndExecute: (eventData) ->
      # event is a single event ID
      dataType = util.typeOf(eventData)
      switch dataType
        when "string"
          event = GameEvent.allById[eventData]
          if event? then GameEvent.verifyAndExecute event else throw "Couldn't find an event in your game with id '#{eventData}'"
        when "array"
          GameEvent.verifyAndExecute datum for datum in eventData
        when "object"
          # Ensure GameEvent has a function corresponding to this event's type
          throw "The event '#{eventData.id}'' you specified is of a type unknown to Picaro: #{eventData.type}" unless typeof GameEvent[eventData.type] is 'function'
          GameEvent.execute eventData
        else
          throw "Your action had an invalid 'after' event specified: #{eventData}"

    # Calls the function for this event type (optionally displaying an accompanying message)
    execute: (event) ->
      $(document).trigger "updateStatus", event.message if event.message
      GameEvent[event.type](event)

    #### Types

    # Simply add a new message to the game's main display.
    updateStatus: (gameEvent) ->

    # The player actually takes the item. Item listens to `immediateTake` and adds to the Inventory with not further checks.
    takeItem: (gameEvent) ->
      item = Item.find(util.toIdString(gameEvent.item))
      $(document).trigger "immediateTake", item

    # Removes the item from inventory and sets its location to the current room, effectively dropping it there.
    dropItem: (gameEvent) ->
      Inventory.remove gameEvent.item
      gameEvent.item.location = Room.current.name
      $(document).trigger "resetMenus"

    # Remove the item from the game and set its location to nil, effectively removing it from the gameworld. It's still available in the Item list if it needs to pop back into existence later.
    removeItem: (gameEvent) ->
      Inventory.remove gameEvent.item
      Item.find(gameEvent.item).location = undefined
      $(document).trigger "resetMenus"

    # Take the item specified and replace the named attribute with a new value; this might be just a string replacement, or swapping in a complex object.
    updateAttribute: (gameEvent) ->
      Item.find(gameEvent.item)[gameEvent.attribute] = gameEvent.newValue
      $(document).trigger "resetMenus"

    decreaseAttribute: (gameEvent) ->
      item = Item.find(gameEvent.item)
      item[gameEvent.attribute] -= gameEvent.by

    increaseAttribute: (gameEvent) ->
      item = Item.find(gameEvent.item)
      item[gameEvent.attribute] += gameEvent.by

    # The gameEvent specifies an item, an attribute to check, and a dictionary ("when"). If the value is found in the "when" dictionary, the event with that ID will be triggered. Lastly, a catch-all event, 'else', can be fire if no other value matches.
    checkAttribute: (gameEvent) ->
      attributeValue = Item.find(gameEvent.item)[gameEvent.attribute]
      if event = gameEvent.when[attributeValue] || gameEvent.when.else
        if typeof event is 'string'
          $(document).trigger "updateStatus", event
        else if event.after
          $(document).trigger "updateStatus", event.message if event.message
          @verifyAndExecute event.after


    # Triggers the UI to disable itself and show the end-game message.
    endGame: (gameEvent) ->
      gameName = Game.current.name || "a mysteriously un-named Picaro Game"
      gameAuthor = Game.current.author || "Anonymous"
      gameAuthor = "<a href='#{encodeURI Game.current.authorURL}'>#{gameAuthor}</a>" if Game.current.authorURL
      $(document).trigger "gameOver", "This has been &ldquo;#{gameName}&rdquo; by #{gameAuthor}."

    # Entirely blows away the `items` specified in the gameEvent which is passed in, and replaces them with the `newItem`.  Should work with items in the Inventory, in the room, or a mix between the two.  If any of the old items were in the user's Inventory, the new item will appear there as well.
    replaceItems: (gameEvent) ->
      oldItemsWereInInventory = false
      _(gameEvent.items).each (itemId, index) ->
        id = util.toIdString itemId
        oldItemsWereInInventory = true if Inventory.remove id
        Item.remove id

      newItem = Item.create(gameEvent.newItem, location: Room.current.id)
      Inventory.add(newItem) if oldItemsWereInInventory || gameEvent.takeNewItem
      $(document).trigger "resetMenus"

  #### DOM Event binding

  # This is the generic event listener for all Game Events. An 'action' (verb + noun) object is passed along, and if the `after` event therein exists in `@allById`, it's passed to the function specified by its type.
  $(document).bind "gameEvent", (e, action) -> GameEvent.verifyAndExecute action.after

  # Return the GameEvent module, so it can be required by others.
  GameEvent
