const game = {
  playerList: [],
  playerIndex: Math.floor(2 * Math.random()),
  lastWord: null,
  wordChain: [],
  getCurrentPlayer: function () {
    return this.playerList[this.playerIndex];
  },
  getNextPlayer: function () {
    return this.playerList[1 - this.playerIndex];
  },
  changePlayer: function () {
    this.playerIndex = 1 - this.playerIndex;
  },
}

// Fetch related things
const URL = `https://dictionaryapi.com/api/v3/references/sd3/json`
const QUERY_STRING = `key=689b7ccf-441b-4d52-8782-39fc2aba053e`;

function fetchDefinition(word) {
  return fetch(`${ URL }/${ word }?${ QUERY_STRING }`)
          .then(res => res.json())
          .then(res => {
            console.log(res);
            return res;
          })
          .catch(console.error);
}

// Renderers
function renderSuggestions(suggestions, stageElement) {
  const suggestionElement = stageElement.find('.suggestions');

  suggestionElement.empty();
  stageElement.find('.selection').empty();
  stageElement.find('.advance').attr('disabled', true);
  stageElement.find('.message').html(
    '<h2>I don\'t know that word. Click one below, or search again.</h2>'
  )

  suggestions.forEach(suggestion => {
    suggestionElement.append($(`<span>${ suggestion }</span>`))
  });
}

function renderSelection(selection, stageElement) {
  const selectionElement = stageElement.find('.selection');

  stageElement.find('.message').html(
    '<h2>Search successful.  Lock in word, or search again.</h2>'
  )

  selectionElement.empty();
  stageElement.find('.suggestions').empty();
  stageElement.find('.advance').attr('disabled', false);

  selectionElement.append(renderDefinition(selection));
}

function renderDefinition(definition) {
  return $(`<div class="definition">
    <h3>${ definition.meta.stems[0] } (${ definition.fl })</h3>
    <p>${ definition.shortdef[0].replace(/\w+/g, '<span>$&</span>') }</p>
  </div>`);
}

function startGame() {
  $('#word-chain').append(renderDefinition(game.wordChain[0]));
}

// Interactivity
$('#wizard').on('click', '.stage .advance', function () {
  const stageElement = $(this).closest('.stage');

  if (stageElement.is(':last-of-type')) {
    $('#wizard').addClass('complete').on('transitionend', function () {
      stageElement.removeClass('active');
      $(this).hide();
      startGame();
    });

    return;
  }

  const nextStageElement = stageElement.next();

  let currentPlayerElements = nextStageElement.find('.current-player');
  let nextPlayerElements = nextStageElement.find('.next-player')

  if (currentPlayerElements.length > 0) {
    currentPlayerElements.text(game.getCurrentPlayer());
  }

  if (nextPlayerElements.length > 0) {
    nextPlayerElements.text(game.getNextPlayer());
  }

  stageElement.removeClass('active');
  nextStageElement.addClass('active');
});

// prevent moving on to next wizard stage if there are invalid inputs within the stage
$('.set-player-names form').on('input', 'input', function () {
  const formElement = $(this).closest('form');
  const advanceElement = $(this).closest('.stage').find('.advance');

  if (formElement.is(':valid')) {
    advanceElement.attr('disabled', false);
  } else {
    advanceElement.attr('disabled', true);
  }
});

$('.set-player-names').on('click', '.advance', function (event) {
  game.playerList = [$('#player-one').val(), $('#player-two').val()];
});


$('.set-first-word form').on('submit', function (event) {
  event.preventDefault();

  const firstWord = $('#first-word').val();

  fetchDefinition(firstWord)
    .then(function (response) {
      if (typeof response[0] === "string") {
        renderSuggestions(response, $('.set-first-word'));
      } else {
        let bestChoice = response.find(x => x.shortdef.length);
        // assume that the selection will be accepted
        game.wordChain = [ bestChoice ];
        renderSelection(bestChoice, $('.set-first-word'));
      }
    });
});

$('.set-first-word').on('click', '.suggestions span', function () {
  let firstWord = $(this).text();
  $('#first-word').val(firstWord);
  $('.set-first-word form').submit();
});

$('.set-last-word form').on('submit', function (event) {
  event.preventDefault();

  const lastWord = $('#last-word').val();

  fetchDefinition(lastWord)
    .then(function (response) {
      if (typeof response[0] === "string") {
        renderSuggestions(response, $('.set-last-word'));
      } else {
        game.lastWord = response[0];
        renderSelection(response[0], $('.set-last-word'));
      }
    });
});

$('.set-last-word').on('click', '.suggestions span', function () {
  let lastWord = $(this).text();
  $('#last-word').val(lastWord);
  $('.set-last-word form').submit();
});

$('.set-last-word').on('click', '.stage .advance', function (event) {
  event.stopPropagation();
});

$('#word-chain').on('click', '.definition span', function () {
  const nextWord = $(this).text().trim();

  fetchDefinition(nextWord).then(function (response) {
    if (typeof response[0] !== 'string') {
      $('#word-chain').append(
        renderDefinition( response.find(x => x.shortdef.length > 0) )
      );
    }
  });
});