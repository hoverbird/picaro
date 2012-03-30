
define(function() {
  var Game;
  return Game = (function() {

    function Game(name, author, version, authorURL) {
      this.name = name;
      this.author = author;
      this.version = version;
      this.authorURL = authorURL;
    }

    Game.init = function(data) {
      this.data = data;
      return this.current = new Game(data.gameName, data.author, data.version, data.authorURL);
    };

    return Game;

  })();
});