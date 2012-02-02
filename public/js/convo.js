define(['jquery', 'vendor/underscore'], function($) {
  var Convo = {}

  Convo.askQuestions = function(n) {
    var question = {
      message: n.name,
      responses: n.children
    }
    Convo.prompt(question)
  }

  Convo.prompt = function(question) {
    $(document).trigger('askQuestion', question)
  }

  Convo.answerQuestion = function(answerIndex, nodes) {
    console.log("answerQuestion", nodes)
    var choice = nodes[answerIndex]
    debugger
    if (_.isObject(choice)) {
      var whatsNext = choice.children[0]

      if (whatsNext && whatsNext.children && whatsNext.children.length) {
        Convo.askQuestions(whatsNext)
      } else {
        Convo.over(whatsNext)
      }
    } else {
      convoOver({name : "... that was not an option"})
    }
  }

  Convo.over = function(lastNode) {
    if (lastNode && lastNode.name) {
      console.log("Lst node!", lastNode.name)
    } else {
      console.log("Game over, man")
    }
    return 1
  }

  Convo.onErr = function(err) {
    console.log("ERROR!!", err)
    return 0
  }


  return Convo

});