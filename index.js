'use strict'
// helper functions
// fisher-yates shuffle
const shuffle = (array) => {
    let currentIndex = array.length,
        temporaryValue, randomIndex;
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
}
// question data model
let model = {
    "category": "Entertainment: Video Games",
    "type": "multiple",
    "difficulty": "easy",
    "question": "What&#039;s the best selling video game to date?",
    "correct_answer": "Tetris",
    "incorrect_answers": ["Wii Sports", "Minecraft", "Super Mario Bros"]
};
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
            if (QUESTIONS[i].answers[playerAnswer].isCorrect) {
                this.correct++;
            } else {
                this.wrong++;
            }
        }, this);
    }
}
// stubs for rapidly testing win or lose state
// to use just change currentState in 'handleQuiz' to one of these
const loseState = Object.create(currentState);
loseState.resetState = function() {
    this.questionNum = 0;
    this.playerAnswers = [0, 0, 0, 0, 0];
    this.correct = 0;
    this.wrong = 0;
}
// this one does require you to get the first answer correct
const winState = Object.create(currentState);
winState.resetState = function() {
    this.questionNum = 0;
    this.playerAnswers = [2, 1, 2, 3, 2];
    this.correct = 0;
    this.wrong = 0;
}
// this generates a form entry and positions it using inline css
function _generateAnswer(a) {
    return `
                
<figure 
    class="answer"
    style="
        left: ${a.offset.left}px; 
        top: ${a.offset.top}px;"
    >
    <label 
        for="answer-${a.ID}" 
        class="js-label-${a.position}"
        >
        ${a.value}
    </label>
    <input 
        type="radio" 
        name="answer-set" 
        id="answer-${a.ID}" 
        class="question js-input-${a.position}"
        value="${a.ID}"
        >
</figure>
                             
            `;
}
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
    // here is the template string where all these strings will be dumped into the scene
    // note the html comments
    $('#main-app').html($(`

<form method="post" id="main-form">
    <fieldset>
        <legend>
            ${q.title}
        </legend>
        <h1>
            ${q.text}
        </h1>
        <section 
            id="drag-zone"
            >
            ${formElements.join('')}
        </section>
    </fieldset>
    <nav 
        role="navigation"
        >
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
        <input 
            class="nav-element prev-button nav-button" 
            role="button" 
            type="button" 
            value="Prev"
            >
        <input 
            class="nav-element next-button nav-button" 
            role="button" 
            type="submit" 
            value="Next"
            >
    </nav>
</form>

        `));
    // this is where our obstructions become draggable elements
    // ideally youd want to do this with a delegate as in handle nav, but with widgets that is not available
    $("#drag-zone").draggable({
        containment: "#drag-zone-parent",
        scroll: false
    });
    $(".obstruction").draggable({
        containment: "#drag-zone",
        scroll: false
    });
    // tooltip actually uses title text, not alt text
    $('.answer-obstruction').tooltip();
    return true;
}
// This returns the innermost part of the win screen. 
// It also handles the logic of  reviewing your game
function _returnWinScreenContent(c) {
    // you won, easy enough
    if (QUESTIONS.length === c.correct) {
        return `

<fieldset>
    <legend>
        Nice
    </legend>
    <h1>
        Congratulations!
    </h1>
    <div 
        id="drag-zone-frame"
        class="win-condition"
        >
        <div class="win-subgroup">
            <img
                class="grail" 
                src="http://res.cloudinary.com/execool/image/upload/c_scale,h_200/v1510143883/quiz/high-quality-income-stocks-the-holy-grail-for-investors_yqlmqp.png" 
                alt="Its the Holy Grail! You now have eternal life I guess. Don't drop it down a ravine." 
                class="obstruct-img"
                >
            <p>
                You Win!<br>
                Here it is!
            </p>
        </div>
    </div>
</fieldset>

                `;
    } else {
        // you lost, begin the long process of string concatenation
        let wrongAnswers = [];
        // get all the question titles
        QUESTIONS.forEach((question, index) => {
            if (!question.answers[c.playerAnswers[index]].isCorrect) {
                wrongAnswers.push(question.title + ',');
            }
        });
        // put an 'and' in there 2nd to last
        if (wrongAnswers.length > 1) wrongAnswers.splice(wrongAnswers.length - 1, 0, 'and');
        // slice in the template down below removes the trailing comma
        return `

<fieldset>
    <legend>
        Too bad!
    </legend>
    <h1>
        You turned into a skeleton!
    </h1>
    <div 
        id="drag-zone-frame"
        class="win-condition"
        >
        <div class="win-subgroup">
            <img
                class="grail" 
                src="http://res.cloudinary.com/execool/image/upload/v1510200475/quiz/holy_grail_skeleton.jpg" 
                alt="You turned into a skeleton because you made the wrong choice. Sorry!"
                title="You turned into a skeleton because you made the wrong choice. Sorry!"
                class="obstruct-img"
                >
            <p>
                You Lose...<br>
                You got ${wrongAnswers.join(' ').slice(0, -1)} wrong.</p>
        </div>
    </div>
</fieldset>

                `;
    }
}
// main function for the win screen
function _generateWinScreen(c) {
    // where the strings are put in the html
    $('#main-app').html($(`

<form 
    method="post"
    id="main-form"
    >
    ${_returnWinScreenContent(c)}
    <nav role="navigation">
        <span class="nav-element">Correct: ${c.correct}</span>
        <span class="nav-element">Wrong: ${c.wrong}</span>
        <input class="nav-element prev-button" role="button" type="button" value="" disabled>
        <input class="nav-element next-button reset" role="button" type="submit" value="Reset?">
    </nav>
</form>

        `));
    // make our win/lose pic draggable and tool tippy
    $('.grail').draggable().tooltip();
    // reset the game
    $('.reset').click((event) => {
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
    $('#main-app').on('click', '.prev-button', () => {
        if (c.questionNum > 0) {
            c.questionNum--;
            _renderForm(c, c.questionNum);
        }
    });
    // watch for click on next button. because it is also submit, it is more complex
    $('#main-app').on('click', '.next-button', (event) => {
        event.preventDefault();
        // update the value of the answer in the state.
        // in this version, you must always pick an answer again if you go back
        c.playerAnswers[c.questionNum] = $('input.question:checked').val();
        // call the update score method on the state and increment the question number
        if (c.questionNum < c.playerAnswers.length && c.playerAnswers[c.questionNum]) {
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

function handleQuiz() {
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
$.getScript('questions.js', handleQuiz);