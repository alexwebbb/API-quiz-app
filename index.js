"use strict";

let QUESTIONS = [];

// using an object to store the state
const currentState = {
    // called at the beginning of every session
    resetState: function() {
        // initialize values
        this.questionNum = 0;
        this.playerAnswers = [];
        this.correct = 0;
        this.wrong = 0;
    },
    updateScore: function() {
        // this method updates the values for correct and wrong
        this.correct = this.wrong = 0;
        // doesn't run when playerAnswers is empty
        this.playerAnswers.forEach((playerAnswer, i) => {
            // count the score
            if (parseInt(playerAnswer, 10) === 0) {
                this.correct++;
            } else {
                this.wrong++;
            }
        }, this);
    }
};
// stubs for rapidly testing win or lose state
// to use just change currentState in 'handleQuiz' to one of these
const loseState = Object.create(currentState);
loseState.resetState = function() {
    this.questionNum = 0;
    this.playerAnswers = [2, 1, 2, 3, 2];
    this.correct = 0;
    this.wrong = 0;
};
// this one does require you to get the first answer correct
const winState = Object.create(currentState);
winState.resetState = function() {
    this.questionNum = 0;
    this.playerAnswers = [0, 0, 0, 0, 0];
    this.correct = 0;
    this.wrong = 0;
};

// helper functions
// fisher-yates shuffle
// for shuffling answers
const shuffle = array => {
    let currentIndex = array.length,
        temporaryValue,
        randomIndex;
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    return array;
};

// serialize function processes our response data into our model format
const _serializeResponse = r => {
    return r.results.map(function(e) {
        let array = [],
            uniqueID = 0;

        array.push({
            ID: uniqueID,
            value: e.correct_answer
        });

        e.incorrect_answers.forEach(function(answer) {
            uniqueID++;

            array.push({
                ID: uniqueID,
                value: answer
            });
        });

        return {
            question: e.question,
            answers: shuffle(array)
        };
    });
};

// this generates a form entry and positions it using inline css
function _generateAnswer(a) {
    return `         
<figure 
    class="answer"
    >
    <label 
        id="label-${a.ID}"
        for="answer-${a.ID}"
        class="js-label-${a.position}"
        >
        ${a.value}
    </label>
    <input 
        id="answer-${a.ID}"
        type="radio"
        role="radio"
        aria-labelledby="label-${a.ID}"
        name="answer-set" 
        class="question js-input-${a.position}"
        value="${a.ID}"
        >
</figure>                          
            `;
}//////

// more or less the main internal function
// this covers everything except the win screen
function _renderForm(c, index) {
    const q = QUESTIONS[index];
    const a = q.answers;
    // we will join this in a template string down below
    const formElements = [];
    // place our form elements in the queue
    a.forEach((answer, i) => {
        // push the actual form element
        formElements.push(_generateAnswer(answer));
    });

    $("#js-fieldset").html(
        $(`
<legend>
    Question ${index + 1}
</legend>
<h1>
    ${q.question}
</h1>
<section>
    ${formElements.join("")}
</section>
        `)
    );

    $("#js-nav").html(
        $(`
<span
    class="nav-element"
    >
    Correct: ${c.correct}
</span>
<span
    class="nav-element"
    >
    Wrong: ${c.wrong}
</span>
<button
    form="main-form"
    role="button"
    type="button"
    class="nav-element js-prev-button"
    >
    Prev
</button>
<button
    form="main-form"    
    role="button"
    type="submit"
    class="nav-element js-next-button"
    >
    Next
</button>
        `)
    );

    return true;
}

// This returns the innermost part of the win screen.
// It also handles the logic of  reviewing your game
function _returnWinScreenContent(c) {
    // you won, easy enough
    if (QUESTIONS.length === c.correct) {
        return `
<legend>
    Nice
</legend>
<h1>
    Congratulations!
</h1>
<section>
    <p>
        You Win!
    </p>
</section>
                `;
    } else {
        // you lost, begin the long process of string concatenation
        let wrongAnswers = [];
        // get all the question titles
        c.playerAnswers.forEach((answer, index) => {
            if (parseInt(answer, 10) !== 0) {
                wrongAnswers.push(`Question ${index + 1},`);
            }
        });
        // put an 'and' in there 2nd to last
        if (wrongAnswers.length > 1)
            wrongAnswers.splice(wrongAnswers.length - 1, 0, "and");
        // slice in the template down below removes the trailing comma
        return `
<legend>
    Too bad!
</legend>
<h1>
    Try again.
</h1>
<section>
    <p>
        You Lose...
        <br>
        You got ${wrongAnswers.join(" ").slice(0, -1)} wrong.
    </p>
</section>
                `;
    }
}
// main function for the win screen
function _generateWinScreen(c) {
    $("#js-fieldset").html($(_returnWinScreenContent(c)));

    // where the strings are put in the html
    $("#js-nav").html(
        $(`
<span
    class="nav-element"
    >
    Correct: ${c.correct}
</span>
<span
    class="nav-element"
    >
    Wrong: ${c.wrong}
</span>
<button
    form="main-form"
    role="button"
    type="button"
    class="nav-element js-prev-button"
    disabled
    >
</button>
<button
    form="main-form"
    role="button"
    type="reset"
    class="nav-element js-next-button reset"
    >
    Reset?
</button>
        `)
    );
    // reset the game
    $(".reset").click(event => {
        event.preventDefault();
        loadInitialState(c);
    });
}

function loadInitialState(c) {
    // very simple, call the state object's native method
    c.resetState();
    // render the form, passing in the first index
    _renderForm(c, 0);
}
// basically the main logic function. handles score checking round to round
function handleNav(c) {
    // watch for a click on the go back button
    $("#js-nav").on("click", ".js-prev-button", () => {
        if (c.questionNum > 0) {
            c.questionNum--;
            _renderForm(c, c.questionNum);
        }
    });
    // watch for click on next button. because it is also submit, it is more complex
    $("#js-nav").on("click", ".js-next-button", event => {
        event.preventDefault();
        // update the value of the answer in the state.
        // in this version, you must always pick an answer again if you go back
        c.playerAnswers[c.questionNum] = $("input.question:checked").val();
        // call the update score method on the state and increment the question number
        if (
            c.questionNum < c.playerAnswers.length &&
            c.playerAnswers[c.questionNum]
        ) {
            c.updateScore();
            c.questionNum++;
            // if we have answers for all questions, we go to the win screen,
            // otherwise, we go to the next question
            if (QUESTIONS.length === c.playerAnswers.length) {
                _generateWinScreen(c);
            } else {
                _renderForm(c, c.questionNum);
            }
        }
    });
}

function handleQuiz(data) {
    QUESTIONS = _serializeResponse(data);

    // change current to win or lose to try that stub
    // state is always passed as a parameter for easy stubbing
    const state = currentState;
    // load the initial view
    loadInitialState(state);
    // call the function that establishes our main event listeners
    handleNav(state);
    // just a fun c convention, no purpose really but doesn't hurt
    return 0;
}
// here is where we import our questions data model.
$.getJSON("https://opentdb.com/api.php?amount=5", handleQuiz);
