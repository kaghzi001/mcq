let questions = [];
let currentQuestion = 0;
let score = 0;
let incorrect = 0;
let selectedOption = null;

const questionEl = document.getElementById('question');
const optionsEl = document.getElementById('options');
const nextBtn = document.getElementById('next-btn');
const resultEl = document.getElementById('result');

let selectedPaperInfo = { Category: '', Name: '' };

// Reference static UI elements
const container = document.querySelector('.container');
const fileSelectDiv = document.getElementById('file-select');
const statusDiv = document.getElementById('status-bar');
fileSelectDiv.innerHTML = '<h2>Select a question set:</h2>';

function showFileOptions(papers) {
    fileSelectDiv.style.display = '';
    fileSelectDiv.innerHTML = '<h2>Select a question set:</h2>';
    // Group by category
    const categories = {};
    papers.forEach(paper => {
        if (!categories[paper.Category]) categories[paper.Category] = [];
        categories[paper.Category].push(paper);
    });
    Object.keys(categories).forEach(category => {
        const catDiv = document.createElement('div');
        catDiv.style.marginBottom = '18px';
        const catTitle = document.createElement('h3');
        catTitle.textContent = category;
        catDiv.appendChild(catTitle);
        categories[category].forEach(paper => {
            const btn = document.createElement('button');
            btn.textContent = paper.Name;
            btn.className = 'option-btn';
            btn.onclick = () => loadQuestions(paper.filename, { Category: paper.Category, Name: paper.Name });
            catDiv.appendChild(btn);
        });
        fileSelectDiv.appendChild(catDiv);
    });
}

function loadQuestions(filename, paperInfo) {
    fileSelectDiv.style.display = 'none';
    document.getElementById('quiz-box').classList.remove('hidden');
    resultEl.classList.add('hidden');
    currentQuestion = 0;
    score = 0;
    incorrect = 0;
    selectedPaperInfo = paperInfo || { Category: '', Name: '' };
    fetch(`Data/${filename}`)
        .then(response => {
            if (!response.ok) throw new Error('Failed to load questions');
            return response.json();
        })
        .then(data => {
            questions = data;
            showQuestion(currentQuestion);
        })
        .catch(error => {
            document.getElementById('quiz-box').classList.add('hidden');
            resultEl.classList.remove('hidden');
            resultEl.textContent = 'Error loading questions.';
        });
}

// Fetch QuestionPapers and show file options
fetch('Data/' + (typeof QUESTION_PAPERS_FILE !== 'undefined' ? QUESTION_PAPERS_FILE : 'QuestionPapers.json'))
    .then(response => response.json())
    .then(papers => {
        document.getElementById('quiz-box').classList.add('hidden');
        fileSelectDiv.style.display = '';
        showFileOptions(papers);
    })
    .catch(() => {
        fileSelectDiv.innerHTML = 'Error loading question sets.';
    });

function showQuestion(index) {
    const q = questions[index];
    // Update status bar
    statusDiv.innerHTML = `Question ${index + 1} / ${questions.length} | <span style="color:#388e3c;">Correct: ${score}</span> | <span style="color:#d32f2f;">Incorrect: ${incorrect}</span><br/><span style="color:#1976d2;">${selectedPaperInfo.Category ? selectedPaperInfo.Category + ' - ' : ''}${selectedPaperInfo.Name ? selectedPaperInfo.Name : ''}</span>`;
    questionEl.textContent = `Q${index + 1}. ${q.question}`;
    optionsEl.innerHTML = '';
    selectedOption = null;
    nextBtn.style.display = 'none';
    // Remove any previous feedback or show answer button
    let feedback = document.getElementById('feedback');
    if (feedback) feedback.remove();
    let showAnsBtn = document.getElementById('show-answer-btn');
    if (showAnsBtn) showAnsBtn.remove();

    q.options.forEach((option, i) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn answer-btn';
        btn.textContent = option;
        btn.onclick = () => selectOption(btn, i);
        optionsEl.appendChild(btn);
    });
}

function selectOption(btn, idx) {
    if (selectedOption !== null) return;
    selectedOption = idx;
    const q = questions[currentQuestion];
    const optionButtons = document.querySelectorAll('.answer-btn');
    optionButtons.forEach(b => b.disabled = true);
    let feedback = document.getElementById('feedback');
    if (feedback) feedback.remove();
    let showAnsBtn = document.getElementById('show-answer-btn');
    if (showAnsBtn) showAnsBtn.remove();

    if (idx === q.answer) {
        btn.classList.add('correct');
        score++;
        // Update status bar
        statusDiv.innerHTML = `Question ${currentQuestion + 1} / ${questions.length} | <span style="color:#388e3c;">Correct: ${score}</span> | <span style="color:#d32f2f;">Incorrect: ${incorrect}</span><br/><span style="color:#1976d2;">${selectedPaperInfo.Category ? selectedPaperInfo.Category + ' - ' : ''}${selectedPaperInfo.Name ? selectedPaperInfo.Name : ''}`;
        // Show correct message
        feedback = document.createElement('div');
        feedback.id = 'feedback';
        feedback.textContent = 'Correct!';
        feedback.style.color = '#388e3c';
        feedback.style.marginTop = '10px';
        optionsEl.appendChild(feedback);
        setTimeout(() => {
            currentQuestion++;
            if (currentQuestion < questions.length) {
                showQuestion(currentQuestion);
            } else {
                showResult();
            }
        }, typeof CORRECT_ANSWER_DELAY !== 'undefined' ? CORRECT_ANSWER_DELAY : 3000);
    } else {
        btn.classList.add('incorrect');
        incorrect++;
        // Update status bar
        statusDiv.innerHTML = `Question ${currentQuestion + 1} / ${questions.length} | <span style="color:#388e3c;">Correct: ${score}</span> | <span style="color:#d32f2f;">Incorrect: ${incorrect}</span><br/><span style="color:#1976d2;">${selectedPaperInfo.Category ? selectedPaperInfo.Category + ' - ' : ''}${selectedPaperInfo.Name ? selectedPaperInfo.Name : ''}`;
        // Show the Show Answer button
        showAnsBtn = document.createElement('button');
        showAnsBtn.id = 'show-answer-btn';
        showAnsBtn.textContent = 'Show Answer';
        showAnsBtn.className = 'option-btn';
        showAnsBtn.style.background = '#1976d2';
        showAnsBtn.style.color = '#fff';
        showAnsBtn.style.marginTop = '10px';
        let answerShown = false;
        showAnsBtn.onclick = () => {
            const answerButtons = document.querySelectorAll('.answer-btn');
            if (!answerShown) {
                // Highlight the correct answer
                answerButtons[q.answer].classList.add('correct');
                showAnsBtn.textContent = 'Continue';
                answerShown = true;
            } else {
                // Move to next question or show result
                currentQuestion++;
                if (currentQuestion < questions.length) {
                    showQuestion(currentQuestion);
                } else {
                    showResult();
                }
            }
        };
        optionsEl.appendChild(showAnsBtn);
    }
}

function showResult() {
    document.getElementById('quiz-box').classList.add('hidden');
    resultEl.classList.remove('hidden');
    resultEl.textContent = `Quiz Completed! Your score: ${score} / ${questions.length} | Correct: ${score} | Incorrect: ${incorrect}`;
    statusDiv.innerHTML = `Quiz Completed! | <span style="color:#388e3c;">Correct: ${score}</span> | <span style="color:#d32f2f;">Incorrect: ${incorrect}</span><br/><span style="color:#1976d2;">${selectedPaperInfo.Category ? selectedPaperInfo.Category + ' - ' : ''}${selectedPaperInfo.Name ? selectedPaperInfo.Name : ''}</span>`;
}

// Quiz will be loaded after file selection
