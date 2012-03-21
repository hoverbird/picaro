define(["jquery", "vendor/underscore"], function($) {
  var Talk;
  Talk = {};
  Talk.currentConversation = {};
  Talk.prompt = function(question) {
    return $(document).trigger("askQuestion", question);
  };
  Talk.askQuestions = function(node) {
    Talk.currentConversation = node.children;
    return Talk.prompt({
      message: node.message,
      responses: node.children
    });
  };
  Talk.answerQuestion = function(answerIndex) {
    var choice, whatsNext;
    choice = Talk.currentConversation[answerIndex];
    if (_.isObject(choice)) {
      whatsNext = choice.children[0];
      if (whatsNext && whatsNext.children && whatsNext.children.length) {
        return Talk.askQuestions(whatsNext);
      } else {
        return Talk.over(whatsNext);
      }
    } else {
      return Talk.over({
        message: "... that was not an option"
      });
    }
  };
  Talk.over = function(lastNode) {
    var message;
    message = lastNode ? lastNode.message : "<i>The Converstation drifts into silence.</i>";
    $(document).trigger("updateCharacterDialog", message);
    $(document).trigger("endTalk");
    return Talk.currentConversation = {};
  };
  $(document).bind('beginTalk', function(event, item) {
    return Talk.askQuestions(item.talk);
  });
  return Talk;
});