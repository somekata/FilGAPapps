document.addEventListener("DOMContentLoaded", () => {
    const tabs = document.querySelectorAll(".tab-button");
    const sections = document.querySelectorAll(".tab-section");
    const quizList = document.getElementById("quiz-list");
    const startQuizButton = document.getElementById("start-quiz");
    const levelSelect = document.getElementById("level-select");
    const questionCountSelect = document.getElementById("question-count");
    const previewButton = document.getElementById("preview-answers");
    const resetButton = document.getElementById("reset-answers");
    const submitButton = document.getElementById("submit-answers");
    const answersReview = document.getElementById("answers-review");
    const historySection = document.getElementById("history");
    const downloadCertificateButton = document.getElementById("download-certificate");
    const quizSettings = document.getElementById("quiz-settings"); // 設定部分

    const questionStatsDiv = document.getElementById("question-stats");

    // Add event listeners for new filters
    const typeSelect = document.getElementById("type-select");
    const languageSelect = document.getElementById("language-select");    

    // 問題数をレベル別に集計
    function calculateQuestionStats() {
        const stats = {}; // レベル別の問題数を記録
        questionPool.forEach(question => {
            stats[question.level] = (stats[question.level] || 0) + 1;
        });

        return stats;
    }

    // レベル別の問題数を表示
    function displayQuestionStats() {
        const stats = calculateQuestionStats();
        const statsHTML = Object.entries(stats)
            .map(([level, count]) => `<p>レベル${level}: ${count}問</p>`)
            .join("");
        questionStatsDiv.innerHTML = statsHTML;
    }

    // 初期表示
    displayQuestionStats();

    // Function to calculate and display detailed stats for each level
    function calculateDetailedQuestionStats() {
        const detailedStats = {};

        // Initialize stats structure
        for (let level = 1; level <= 5; level++) {
            detailedStats[level] = {
                日本語: { 一般: 0, 症例: 0 },
                英語: { 一般: 0, 症例: 0 }
            };
        }

        // Populate stats by iterating over the question pool
        questionPool.forEach(question => {
            const level = question.level;
            const language = question.language;
            const type = question.type;

            if (detailedStats[level] && detailedStats[level][language] && detailedStats[level][language][type] !== undefined) {
                detailedStats[level][language][type]++;
            }
        });

        return detailedStats;
    }

    // Function to display detailed stats in HTML
    function displayDetailedQuestionStats() {
        const stats = calculateDetailedQuestionStats();
        /*古いバージョン　pからtableに変更
        const statsHTML = Object.entries(stats)
            .map(([level, details]) => {
                const japanese = details["日本語"];
                const english = details["英語"];
                return `
                    <p>
                        レベル${level}：${japanese.一般 + japanese.症例 + english.一般 + english.症例}問
                        （日本語・一般${japanese.一般}, 日本語・症例${japanese.症例}, 
                        英語・一般${english.一般}, 英語・症例${english.症例}）
                    </p>
                `;
            })
            .join("");
        document.getElementById("question-stats").innerHTML = statsHTML;
        */

                    // テーブルのヘッダー
            let statsHTMLtable = `
            <table border="1" id="statTable">
                <thead>
                    <tr>
                        <th>レベル</th>
                        <th>合計問題数</th>
                        <th>日本語・一般</th>
                        <th>日本語・症例</th>
                        <th>英語・一般</th>
                        <th>英語・症例</th>
                    </tr>
                </thead>
                <tbody>
        `;

        // 各レベルのデータをテーブルの行に追加
        statsHTMLtable += Object.entries(stats)
            .map(([level, details]) => {
                const japanese = details["日本語"];
                const english = details["英語"];
                const total = japanese.一般 + japanese.症例 + english.一般 + english.症例;
                
                return `
                    <tr>
                        <th>レベル${level}</th>
                        <td>${total}</td>
                        <td>${japanese.一般}</td>
                        <td>${japanese.症例}</td>
                        <td>${english.一般}</td>
                        <td>${english.症例}</td>
                    </tr>
                `;
            })
            .join("");

        // テーブルの閉じタグ
        statsHTMLtable += `
                </tbody>
            </table>
        `;

        document.getElementById("question-stats").innerHTML = statsHTMLtable;
    }

    // Initial display of detailed stats
    displayDetailedQuestionStats();

    let selectedQuestions = [];
    let userAnswers = {};
    let totalScore = 0;

    const history = []; // 履歴を保存する配列

    // タブ切り替え
    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            sections.forEach(section => section.classList.remove("active"));
            document.getElementById(tab.dataset.tab).classList.add("active");
        });
    });

    // 問題選択と表示
    // Update the filterQuestions function
    function filterQuestions(level, type, language) {
        let filteredQuestions = questionPool;
    
        // Filter by level
        if (level !== "all") {
        filteredQuestions = filteredQuestions.filter(q => q.level === parseInt(level, 10));
        }
    
        // Filter by type
        if (type !== "all") {
        filteredQuestions = filteredQuestions.filter(q => q.type === type);
        }
    
        // Filter by language
        if (language !== "all") {
        filteredQuestions = filteredQuestions.filter(q => q.language === language);
        }
    
        return filteredQuestions;
    }
    
    function displayQuestions(questions, isLocked = false) {
        quizList.innerHTML = "";
        questions.forEach((q, index) => {
            const inputType = q.selectionCount === 1 ? "radio" : "checkbox";
            const questionElement = document.createElement("div");
            questionElement.innerHTML = `
                <h3>問題${index + 1} (レベル${q.level}): ${q.question}</h3>
                ${q.choices.map((choice, i) => `
                    <label>
                        <input type="${inputType}" name="question-${index}" value="${String.fromCharCode(97 + i)}" 
                        ${userAnswers[index]?.includes(String.fromCharCode(97 + i)) ? "checked" : ""} 
                        ${isLocked ? "disabled" : ""}>
                        ${choice}
                    </label><br>
                `).join("")}
            `;
            quizList.appendChild(questionElement);
        });

        previewButton.style.display = isLocked ? "none" : "block";
        resetButton.style.display = isLocked ? "block" : "none";
        submitButton.style.display = isLocked ? "block" : "none";
    }

    // プレビュー: チェック数のバリデーションと選択肢の固定
    previewButton.addEventListener("click", () => {
        let isValid = true;
        userAnswers = {};

        selectedQuestions.forEach((q, index) => {
            const checkedInputs = Array.from(document.querySelectorAll(`[name="question-${index}"]:checked`));
            const checkedValues = checkedInputs.map(input => input.value);

            // "all" は1つ以上チェックが必要
            if (q.selectionCount === "all" && checkedValues.length === 0) {
                alert(`問題${index + 1}: 1つ以上選択してください。`);
                isValid = false;
            } 
            // 複数または単一指定のバリデーション
            else if (q.selectionCount !== "all" && checkedValues.length !== q.selectionCount) {
                alert(`問題${index + 1}: ${q.selectionCount}つ選択してください。`);
                isValid = false;
            }

            userAnswers[index] = checkedValues;
        });

        if (isValid) {
            displayQuestions(selectedQuestions, true);
        }
    });

    // 解答しなおす: チェックを保持しつつ選択肢の固定を解除
    resetButton.addEventListener("click", () => {
        displayQuestions(selectedQuestions, false);
    });

    // 確定: 正解と解説ページに移動、履歴に追加
    submitButton.addEventListener("click", () => {
        let correctCount = 0;
        let incorrectCount = 0;
        const levelStats = {};
    
        const results = selectedQuestions.map((q, index) => {
            const correct = JSON.stringify(q.correct.sort());
            const user = JSON.stringify(userAnswers[index]?.sort() || []);
            const isCorrect = user === correct;
    
            if (isCorrect) {
                correctCount++;
                levelStats[q.level] = (levelStats[q.level] || 0) + 1;
            } else {
                incorrectCount++;
                levelStats[q.level] = (levelStats[q.level] || 0) - 1;
            }
    
            totalScore += isCorrect ? 10 : 0;
    
            // 選択肢にフィードバックを追加
            const questionElement = document.querySelectorAll(`[name="question-${index}"]`);
            questionElement.forEach((input) => {
                const label = input.parentElement;
                const markSpan = document.createElement("span"); // 印を追加するための要素
    
                if (q.correct.includes(input.value)) {
                    // 正答肢
                    markSpan.textContent = userAnswers[index]?.includes(input.value) ? "〇" : "正答肢";
                    markSpan.style.color = userAnswers[index]?.includes(input.value) ? "green" : "blue";
                } else if (userAnswers[index]?.includes(input.value)) {
                    // 不正解
                    markSpan.textContent = "×";
                    markSpan.style.color = "red";
                } else {
                    // 何も選択されていない選択肢は印なし
                    markSpan.textContent = "";
                }
    
                markSpan.style.marginLeft = "10px"; // マークと選択肢の間に余白を作る
                label.appendChild(markSpan); // 印を選択肢のラベルに追加
            });
    
            return `<h4>問題${index + 1} ${q.question} (レベル${q.level})<br>判定: ${isCorrect ? "正解" : "不正解"}</h4>
                    <p><b>解説</b>: ${q.explanation}</p><p><b>キーワード</b>: ${q.tag}</p><p><b>言語</b>: ${q.language}, <b>タイプ</b>: ${q.type}, <b>選択肢</b>: ${q.selectionCount}択</p>`;
        });
        const viewMessage ="<p>選択した問題の正解と解説です。選択肢などを確認する場合は問題ページに移動してください。</p><hr>";
        answersReview.innerHTML = viewMessage+results.join("");
    
        // 履歴にスコアを追加
        const selectedLevel = levelSelect.value === "all" ? "全てのレベル" : `レベル${levelSelect.value}`;
        history.push({
            level: selectedLevel,
            questionCount: selectedQuestions.length,
            correctCount,
            incorrectCount,
            score: totalScore,
            questionResults: selectedQuestions.map((q, index) => ({
                id: q.id, // 問題ID
                isCorrect: JSON.stringify(q.correct.sort()) === JSON.stringify(userAnswers[index]?.sort() || [])
            })),
            timestamp: Date.now() // 現在の時刻を追加
        });
    
        // 履歴セクションの更新
        updateHistorySection();
    
        document.querySelector("[data-tab='section2']").click();
        downloadCertificateButton.style.display = "block";

        resetButton.style.display = "none";
        submitButton.style.display = "none";

        quizSettings.classList.remove("hidden");
        // Reset the form
        resetQuizForm();
    });    

    // 履歴更新（Table形式で表示）
    function updateHistorySection() {
        const tableHeaders = `
            <tr>
                <th>履歴</th>
                <th>難易度</th>
                <th>正解数/問題数</th>
                <th>スコア/満点</th>
                <th>問題結果 (ID:正誤)</th>
                <th>日付時間</th>
            </tr>
        `;
        const tableRows = history.map((entry, index) => {
            const fullScore = entry.questionCount * 10; // 満点計算
            const dateTime = new Date(entry.timestamp).toLocaleString(); // 日付時間をフォーマット
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${entry.level}</td>
                    <td>${entry.correctCount}/${entry.questionCount}</td>
                    <td>${entry.score}/${fullScore}</td>
                    <td>${entry.questionResults.map(r => `ID:${r.id}-${r.isCorrect ? '正解' : '不正解'}`).join(", ")}</td>
                    <td>${dateTime}</td>
                </tr>
            `;
        }).join("");
        historySection.innerHTML = `
            <table>
                ${tableHeaders}
                ${tableRows}
            </table>
        `;
    }
    

    // 証明書ダウンロード（PNG形式）
    downloadCertificateButton.addEventListener("click", () => {
        // 氏名をプロンプトで取得
        let participantName = prompt("受験者氏名を入力してください（任意）:");
        if (!participantName || participantName.trim() === "") {
            participantName = "受験者"; // 空の場合のデフォルト
        }
    
        // Canvasを作成
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
    
        // キャンバスサイズ設定
        canvas.width = 1000;
        canvas.height = 1400;
    
        // 背景色
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);

        // ランダムな水玉の描画
        const totalDots = 50; // 水玉の数
        for (let i = 0; i < totalDots; i++) {
            // ランダムな位置とサイズ
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const radius = Math.random() * (40 - 10) + 10; // 半径10mm〜40mm

            // ランダムな透明度（淡さ）
            const alpha = Math.random() * (0.04 - 0.01) + 0.01; // 0.01～0.04

            // ランダムに赤または青を選択
            const color = Math.random() < 0.5
                ? `rgba(255, 0, 0, ${alpha})` // 淡い赤
                : `rgba(0, 0, 255, ${alpha})`; // 淡い青

            // 水玉を描画
            context.beginPath();
            context.arc(x, y, radius, 0, Math.PI * 2);
            context.fillStyle = color;
            context.fill();
        }


        // 文字列の描画設定
        const rows = 1; // 行数
        const cols = 1; // 列数
        const marginX = 400; // 水平方向の間隔
        const marginY = 200; // 垂直方向の間隔
        const startX = 100; // 描画開始位置（X軸）
        const startY = 1200; // 描画開始位置（Y軸）

        // 文字とその色を定義
        const textParts = [
            { text: "Shiro", color: "rgba(255, 0, 0, 0.05)" }, // 赤の淡い色
            { text: " ", color: "rgba(0, 0, 0, 0.00)" },       // 空白
            { text: "Somekata", color: "rgba(0, 0, 255, 0.05)" },  // 青の淡い色
            { text: " Certificate", color: "rgba(0, 0, 0, 0.05)" } // 黒の淡い色
        ];

        // 文字の描画ループ
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = startX + col * marginX; // X位置
                const y = startY + row * marginY; // Y位置

                // キャンバス内に収まる場合のみ描画
                if (x + marginX <= canvas.width && y + marginY <= canvas.height) {
                    context.save(); // 状態を保存

                    // 原点を移動してから回転
                    context.translate(x, y);
                    context.rotate((-45 * Math.PI) / 180); // 45度右上がりに回転

                    // 各文字を描画
                    let currentX = 0; // 回転した座標系でのX位置
                    for (const part of textParts) {
                        context.font = "100px Arial"; // フォント設定
                        context.fillStyle = part.color; // 色設定
                        context.fillText(part.text, currentX, 0); // 回転後の座標系で描画
                        currentX += context.measureText(part.text).width; // 次の文字の位置を計算
                    }

                    context.restore(); // 状態を元に戻す
                }
            }
        }

        
        // 赤線 (タイトル上)
        context.globalAlpha = 0.5; // 50%の透明度
        context.strokeStyle = "#d9534f"; // 赤
        context.lineWidth = 10;
        context.beginPath();
        context.moveTo(100, 60);
        context.lineTo(900, 60);
        context.stroke();

        // 青線 (タイトル下)
        context.strokeStyle = "#0275d8"; // 青
        context.lineWidth = 10;
        context.beginPath();
        context.moveTo(100, 150);
        context.lineTo(900, 150);
        context.stroke();

        // 透明度を元に戻す
        context.globalAlpha = 1.0;
        // タイトル
        context.fillStyle = "#000"; // 黒
        context.font = "48px Georgia, serif";
        context.textAlign = "center";
        context.fillText("Fil-GAP問題解答証明書", canvas.width / 2, 120);
      
        // 祝福メッセージ
        context.fillStyle = "#555"; // グレー
        context.font = "24px Arial, sans-serif";
        context.fillText(`おめでとうございます！`, canvas.width / 2, 200);
        context.fillText(`${participantName} 様がクイズに挑戦され、以下の成績を修めました。`, canvas.width / 2, 240);
    
        // 履歴情報を描画
        context.textAlign = "left";
        context.font = "20px Arial, sans-serif";
        context.fillStyle = "#000"; // 黒
        let offsetY = 300;

        history.forEach((entry, index) => {
            const fullScore = entry.questionCount * 10; // 満点
            const dateTime = new Date(entry.timestamp).toLocaleString(); // 日付時間をフォーマット

            // 履歴番号と難易度
            context.fillText(`履歴${index + 1}`, 70, offsetY);
            context.fillText(`難易度: ${entry.level}`, 150, offsetY);

            // 正解数/問題数
            context.fillText(`正解数/問題数: ${entry.correctCount}/${entry.questionCount}`, 310, offsetY);

            // スコア/満点 (間隔を調整)
            context.fillText(`スコア: ${entry.score}/${fullScore}`, 510, offsetY);

            // 日付
            context.fillText(`日付: ${dateTime}`, 660, offsetY);

            offsetY += 40; // 行間
        });
    
        // 赤線 (フッター上)
        offsetY += 50;
        context.globalAlpha = 0.5; // 50%の透明度
        context.strokeStyle = "#d9534f"; // 赤
        context.lineWidth = 5;
        context.beginPath();
        context.moveTo(100, canvas.height - 100);
        context.lineTo(900, canvas.height - 100);
        context.stroke();
    
        // 青線 (フッター下)
        offsetY += 30;
        context.strokeStyle = "#0275d8"; // 青
        context.lineWidth = 5;
        context.beginPath();
        context.moveTo(100, canvas.height - 30);
        context.lineTo(900, canvas.height - 30);
        context.stroke();

        // 透明度を元に戻す
        context.globalAlpha = 1.0;
        // 証明者情報
        offsetY += 30;
        context.font = "22px Georgia, serif";
        context.fillStyle = "#555"; // グレー
        context.fillText(`発行者: Fil-GAP`, 100, offsetY);
        offsetY += 30;
        context.fillText(`証明書発行日: ${new Date().toLocaleDateString()}`, 100, offsetY);

        // フッター
        context.textAlign = "center";
        context.font = "16px Arial, sans-serif";
        context.fillStyle = "#555"; // グレー
        context.fillText("© 2025 Fil-GAP All Rights Reserved", canvas.width / 2, canvas.height - 50);
    
        // ダウンロードリンクを作成してPNG形式で保存
        const link = document.createElement("a");
        link.download = "certificate.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
    });
    
        

    // キーワードを問題文、選択肢、解説、タグでフィルタリング
    function filterQuestionsByKeyword(questions, keyword) {
        if (!keyword || keyword.length < 2) {
            return questions; // キーワードが未入力または2文字未満の場合は全件返す
        }

        return questions.filter(q =>
            q.question.includes(keyword) || // 問題文にキーワードが含まれる
            q.choices.some(choice => choice.includes(keyword)) || // 選択肢にキーワードが含まれる
            (q.explanation && q.explanation.includes(keyword)) || // 解説にキーワードが含まれる
            q.tag.some(tag => tag.includes(keyword)) // タグにキーワードが含まれる
        );
    }

    // Fisher-Yatesアルゴリズムによる配列シャッフル関数
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // 要素を交換
        }
        return array;
    }

    // Function to reset form inputs
    function resetQuizForm() {
        // フォームの入力値をリセット
        document.getElementById("keyword-input").value = "";
        levelSelect.selectedIndex = 0;
        typeSelect.selectedIndex = 0;
        languageSelect.selectedIndex = 0;
        questionCountSelect.selectedIndex = 0;
    
        // Deselect all radio and checkbox inputs
        const inputs = document.querySelectorAll("#quiz-list input[type='radio'], #quiz-list input[type='checkbox']");
        inputs.forEach(input => {
            input.checked = false;
        });
    
        // Reset user answers and selected questions
        userAnswers = {};
        selectedQuestions = [];
    }
    

    // クイズ開始時に問題をシャッフル
    // Update the startQuizButton event listener
    startQuizButton.addEventListener("click", () => {


        // Clear the quiz list
        quizList.innerHTML = "";
                
        const level = levelSelect.value;
        const type = typeSelect.value;
        const language = languageSelect.value;
        const keyword = document.getElementById("keyword-input").value.trim();
  
    // Apply filters
    let filteredQuestions = filterQuestions(level, type, language);
  
    // Filter by keyword
    filteredQuestions = filterQuestionsByKeyword(filteredQuestions, keyword);
  
    // Handle case where no questions are found
    if (filteredQuestions.length === 0) {
      alert("選択された条件に一致する問題が見つかりませんでした。");
      return;
    }
  
    // Shuffle and display questions
    selectedQuestions = shuffleArray(filteredQuestions).slice(0, parseInt(questionCountSelect.value, 10) || filteredQuestions.length);
    displayQuestions(selectedQuestions);
  }); 
});
