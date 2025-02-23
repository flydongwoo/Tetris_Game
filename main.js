(function (){
    initializeGame();
})();

function initializeGame() {
    resize();
    setInitialBoardState();
    rebuild();
}

function main() {
    window.addEventListener('resize', resize);
    window.addEventListener('keydown', keyHandler);
}

function setInitialBoardState() {
    matrixMainBoard = initMatrix(ROWS_MAIN_BOARD, COLS_MAIN_BOARD);
    nextBlock = createNextBlock();
    mainBlock = createNextBlock();
    mainBlock.x = (mainBlock.shape[0][0] === 1) ? 4 : 3;
    mainBlock.y = 0;
}

function rebuild() {
    resize();
    drawLattice(matrixMainBoard.board, ctxMainBoard);
    drawLattice((new Array(4)).fill((new Array(4)).fill(0)), ctxNextBoard);
    if(mainBlock && nextBlock) {
        if(gameStatus === 'A') {
            drawBlock(mainBlock, ctxMainBoard, COLOR_SET);
        }
    }
    if (nextBlock && gameStatus === 'A') {
        drawBlock(nextBlock, ctxNextBoard, COLOR_SET);
    }
    drawBoard(matrixMainBoard, ctxMainBoard, COLOR_SET);
    drawRemovingLines(ctxMainBoard, matrixMainBoard, filledLines, COLOR_SET);
    drawCombo(ctxMainBoard, comboCount, COLOR_SET);
}

function resize() {
    const WINDOW_INNERWIDTH = (window.innerWidth > 660)?660:window.innerWidth;
    const MAIN_CONTENTS_WIDTH = Math.floor(WINDOW_INNERWIDTH*0.6);
    const BLOCK_SIZE = Math.floor(MAIN_CONTENTS_WIDTH/COLS_MAIN_BOARD);

    ctxMainBoard.canvas.width = BLOCK_SIZE*COLS_MAIN_BOARD;
    ctxMainBoard.canvas.height = BLOCK_SIZE*ROWS_MAIN_BOARD;
    ctxMainBoard.scale(BLOCK_SIZE, BLOCK_SIZE);

    ctxNextBoard.canvas.width = BLOCK_SIZE*COLS_NEXT_BOARD;
    ctxNextBoard.canvas.height = BLOCK_SIZE*ROWS_NEXT_BOARD;
    ctxNextBoard.scale(BLOCK_SIZE, BLOCK_SIZE);

    title.style.fontSize = WINDOW_INNERWIDTH/150+'rem';
    sideContents.style.fontSize = WINDOW_INNERWIDTH/350+'rem';

    setButtonStyle(startButton, WINDOW_INNERWIDTH);
    setButtonStyle(quitButton, WINDOW_INNERWIDTH);
    setButtonStyle(pauseButton, WINDOW_INNERWIDTH);
    //
    setButtonStyle(toggleSoundButton, WINDOW_INNERWIDTH);

    bottomContainer.style.fontSize = WINDOW_INNERWIDTH/150+'rem';
}

function setButtonStyle(elem, witdh) {
    elem.style.fontSize = witdh/350+'rem';
    elem.style.paddingTop = witdh/1400+'rem';
    elem.style.paddingBottom = witdh/1400+'rem';
    elem.style.paddingLeft = witdh/350+'rem';
    elem.style.paddingRight = witdh/350+'rem';
}

function reset() {
    matrixMainBoard = initMatrix(ROWS_MAIN_BOARD, COLS_MAIN_BOARD);
    resetScoreBoard();
    time = 0;
    timeForRemovingLines = 0;
    mainBlock = null;
    nextBlock = null;
    bgmElem.pause();
    bgmElem.currentTime = 0;
}

function isTopReached(block) {
    return block.shape.some((row, dy) => {
        return row.some((value, dx) => {
            return value > 0 && (block.y + dy) === 0;
        });
    });
}

function start() {
    reset();
    bgmElem.play();
    gameStatus = 'A';
    window.addEventListener('keydown', keyHandler);
    setNextBlock();
    addLines(3);
    repeatMotion(0);
    startButton.blur();
    gameEnded = false; // 게임 시작 시 게임 종료 상태를 false로 설정
}

let gameEnded = true; // 초기에는 게임 종료 상태로 설정

function quit() {
    if (gameStatus === 'A') {
        // 게임이 진행 중일 때 Finish 버튼을 눌렀을 경우 처리
        bgmElem.pause();
        bgmElem.currentTime = 0;
        window.cancelAnimationFrame(requestAnimationId);
        requestAnimationId = null;
        window.removeEventListener('keydown', keyHandler);

        ctxMainBoard.fillStyle = '#f0b71b';
        ctxMainBoard.fillRect(1, 3, 8, 1.8);
        ctxMainBoard.font = '1px NeoDungGeunMo';
        ctxMainBoard.fillStyle = '#ffffff';

        let highScore = Number(localStorage.getItem('high-score')) || 0;
        if (totalScore > highScore) {
            localStorage.setItem('high-score', totalScore);
            highScoreElem.textContent = totalScore;
            ctxMainBoard.fillText('기록 갱신', 2.8, 4.2);
        } else {
            ctxMainBoard.fillText('게임 오버', 2.8, 4.2);
        }

        gameStatus = 'Q';
        gameEnded = true; // 게임 종료 상태로 변경
    } else if (gameStatus === 'Q' && gameEnded) {
        // 게임이 종료된 상태에서 Finish 버튼을 눌렀을 경우 처리
        resetGame(); // 게임 리셋 함수 호출
        rebuild(); // 초기화 후 재구성
        gameEnded = false; // 게임 종료 상태 초기화
    }
}

function resetGame() {
    // 최고 점수는 유지하고 게임을 초기 상태로 리셋하는 함수
    reset();
    setInitialBoardState(); // 초기 게임 상태 설정 호출
    gameEnded = false; // 게임 종료 상태 초기화
    // 여기서 추가적으로 필요한 초기화 작업 수행
    // 예: 초기 블록 생성, UI 업데이트 등
}

function pause() {
    if(requestAnimationId) {
        window.cancelAnimationFrame(requestAnimationId);
        requestAnimationId = null;
        gameStatus = 'P';
        
        ctxMainBoard.fillStyle = '#6f9cf0';
        ctxMainBoard.fillRect(1, 3, 8, 1.8);
        ctxMainBoard.font = '1px NeoDungGeunMo';
        ctxMainBoard.fillStyle = '#ffffff';
        ctxMainBoard.fillText('일시 정지', 2.8, 4.2);
    
    } else {
        gameStatus = 'A';
        repeatMotion(0);
    }
}

function createNextBlock() {
    const randomBlock = randomNextBlockMatrix();
    const nextBlock = {
        x: 0,
        y: 0,
        shape: randomBlock.block_set,
        shape_options: randomBlock.block_set_options
    }

    return nextBlock;
}

function toggleSound() {
    if(bgmElem.paused) {
        allowSound = true;
        bgmElem.play();
        toggleSoundButton.textContent = '소리 끄기';
    } else {
        allowSound = false;
        bgmElem.pause();
        bgmElem.currentTime = 0;
        toggleSoundButton.textContent = '소리 켜기';
    }
}

function pressKey(keyCode) {
    if(gameStatus === 'A' || gameStatus === 'P') {
        const obj = {
            keyCode: keyCode
        };
        keyHandler(obj);
    }
}

function keyHandler(event) {

    if(typeof event.preventDefault != 'undefined') {
        event.preventDefault();
    }

    const inputKey = event.keyCode;

    const KEY = {
        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        DOWN: 40,
        SPACE: 32,
        P: 80,
        ESC: 27 
    }

    switch(inputKey) {
        case KEY.UP :
            if(gameStatus === 'A') validRotate(mainBlock, matrixMainBoard);
            break;
        case KEY.DOWN :
            if(gameStatus === 'A') {
                if(validMove(mainBlock, matrixMainBoard, 0, 1)) {
                    addScore(10*currentLevel);
                } else {
                    nextStep();
                    time = 0;
                };
            }
            break;
        case KEY.LEFT :
            if(gameStatus === 'A') validMove(mainBlock, matrixMainBoard, -1, 0);
            break;
        case KEY.RIGHT :
            if(gameStatus === 'A') validMove(mainBlock, matrixMainBoard, 1, 0);
            break;
        case KEY.SPACE :
            if(gameStatus === 'A') {
                while(validMove(mainBlock, matrixMainBoard, 0, 1)) {
                    globalAddScore += 20*currentLevel;
                };
                nextStep();
                time = 0;
            }
            break;
        case KEY.P :
            pause();
            break;
        case KEY.ESC:
            quit();
            break;
    }
}

function resetScoreBoard() {
    totalScore = 0;
    scoreElem.textContent = "0";
    addScoreElem.textContent = "";

    currentLevel = 1;
    levelElem.textContent = "1";
    levelUpElem.textContent = "";

    remaningLines = 0;
    linesElem.textContent = "0";
    removeLinesElem.textContent = "";
}

function addScore(score) {
    totalScore += score;
    scoreElem.textContent = totalScore;
    if(score > 0) {
        addScoreElem.textContent = '+' + score;
    }
    if(addScoreId){
        clearTimeout(addScoreId);
    }
    addScoreId = setTimeout(() => {
        addScoreElem.textContent = "";
    }, 1000);
}

function addLines(lines) {
    remaningLines += lines;
    linesElem.textContent = remaningLines;
    if(lines < 0) {
        removeLinesElem.textContent = lines;
    }
    if(removeLinesId){
        clearTimeout(removeLinesId);
    }
    removeLinesId = setTimeout(() => {
        removeLinesElem.textContent = "";
    }, 1000);
}

function addLevel(level) {
    currentLevel += level;
    levelElem.textContent = currentLevel;
    if(level > 0) {
        levelUpElem.textContent = '레벨 업!';
    }
    if(levelUpId){
        clearTimeout(levelUpId);
    }
    levelUpId = setTimeout(() => {
        levelUpElem.textContent = "";
    }, 2000);

}

function playSound(type) {
    if(allowSound) {
        switch(type) {
            case 'drop':
                soundElem.src = './resources/drop.mp3';
                break;
            case 'remove':
                soundElem.src = './resources/remove.mp3';
                break;
        }
        if(soundElem.paused) { 
            soundElem.play();
        } else { 
            soundElem.pause(); 
            soundElem.currentTime = 0;
            soundElem.play();
        } 
    }
}

function nextStep() {
    stack(mainBlock, matrixMainBoard);
    filledLines = checkFilledLines(matrixMainBoard);

    if (isTopReached(mainBlock)) { 
        gameOver();  
        return;
    }

    stack(mainBlock, matrixMainBoard);
    filledLines = checkFilledLines(matrixMainBoard);

    if(filledLines.length === 0) {
        playSound('drop');
        addScore(globalAddScore);
        globalAddScore = 0;
        comboCount = 0;
        matrixMainBoard.board[0].some((value, x) => {
            if(value > 0) {
                gameStatus = 'Q';
                return true;
            }
        });

        const cloneNextBlock = clone(nextBlock);
        cloneNextBlock.y = 0;
        cloneNextBlock.x = 3;
        if(validate(cloneNextBlock, matrixMainBoard)) {
            setNextBlock();
        } else {
            gameStatus = 'Q';
        }
    }

    rebuild();
}


function setNextBlock() {
    mainBlock = nextBlock?nextBlock:createNextBlock();
    mainBlock.y = 0;
    mainBlock.x = (mainBlock.shape[0][0]===1)?4:3;
    nextBlock = createNextBlock();
    nextBlock.y = (nextBlock.shape[1][0]===7)?0:1;
    nextBlock.x = (nextBlock.shape[0][0]===1)?1:0;
}

function initRemoveLines() {
    filledLines = [];
    timeForRemovingLines = 0;
    time = 0;
}

function makeOneLine() {
    let cloneBoard = JSON.parse(JSON.stringify(matrixMainBoard));

    const randomIndex = getRandomIndex(COLS_MAIN_BOARD);
    const opacitySet = ['1.0','0.95','0.9','0.85'];
    let tempBoard = [];
    let tempOptions = [];
    for(let x=0; x < COLS_MAIN_BOARD;x++){
        if(x === randomIndex) {
            tempBoard.push(0);
            tempOptions.push({opacity: '1.0'});
        } else {
            tempBoard.push(8);
            tempOptions.push({opacity: opacitySet[getRandomIndex(4)]});
        }
    }

    cloneBoard.board.shift();
    cloneBoard.board.push(tempBoard);
    cloneBoard.options.shift();
    cloneBoard.options.push(tempOptions);


    let cloneBlock = JSON.parse(JSON.stringify(mainBlock));
    if(validMove(cloneBlock, cloneBoard, 0, 0)){
        matrixMainBoard = cloneBoard;
    }
}

function repeatMotion(timeStamp) {
    if(time === 0) {
        time = timeStamp;
    }

    if(timeStamp - time > 2000/currentLevel) {
        if(!validMove(mainBlock, matrixMainBoard, 0, 1)) {
            nextStep();
        }
        time = timeStamp;
    }

    if(filledLines.length > 0) {
        if(timeForRemovingLines === 0) {
            timeForRemovingLines = timeStamp;
        }

        if(timeStamp - timeForRemovingLines > 100) {
            playSound('remove');
            removeLines(matrixMainBoard, filledLines);
            comboCount++;
            globalAddScore += 100*filledLines.length*currentLevel*comboCount;
            addScore(globalAddScore);
            globalAddScore = 0;
            addLines(filledLines.length*-1);

            while(remaningLines <= 0) {
                addLevel(1);
                addLines(3*currentLevel);
            }

            initRemoveLines();
            setNextBlock();
        }
    }

    function gameOver() {
        playSound('drop'); 
    
        gameStatus = 'Q'; 
        gameEnded = true; 
    
        ctxMainBoard.fillStyle = '#f0b71b';
        ctxMainBoard.fillRect(1, 3, 8, 1.8);
        ctxMainBoard.font = '1px NeoDungGeunMo';
        ctxMainBoard.fillStyle = '#ffffff';
    
        let highScore = Number(localStorage.getItem('high-score')) || 0;
        if (totalScore > highScore) {
            localStorage.setItem('high-score', totalScore);
            highScoreElem.textContent = totalScore;
            ctxMainBoard.fillText('기록 갱신', 2.8, 4.2);
        } else {
            ctxMainBoard.fillText('게임 오버', 2.8, 4.2);
        }
    }

    if(currentLevel >= levelToStartForMakingOneLine) {
        if(timeForMakingOneLine === 0) {
            timeForMakingOneLine = timeStamp;
        }

        if(timeStamp - timeForMakingOneLine > 10000/(currentLevel-levelToStartForMakingOneLine+1)*2) {
            makeOneLine();
            timeForMakingOneLine = timeStamp;
        }
    }

    rebuild();

    if(gameStatus === 'A') {
        requestAnimationId = window.requestAnimationFrame(repeatMotion);
    } else {
        quit();
    }
}
