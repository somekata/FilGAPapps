document.addEventListener("DOMContentLoaded", () => {
  const viewToggle = document.getElementById("view-toggle");
  const tableView = document.getElementById("tableview");
  const verticalView = document.getElementById("verticalview");
  const howToUse = document.getElementById("howtouse");
  const filterContainer = document.getElementById("filter-container");
  const filterInput = document.getElementById("filter-input");
  const levelFilterContainer = document.createElement("div");

  const parseNumberInput = (input) => {
    const result = [];
    const parts = input.split(",");
    parts.forEach((part) => {
      if (part.includes("-")) {
        const [start, end] = part.split("-").map(Number);
        if (start <= end) {
          for (let i = start; i <= end; i++) {
            result.push(i);
          }
        }
      } else if (!isNaN(part)) {
        result.push(Number(part));
      }
    });
    return result;
  };

  const filterInputHandler = () => {
    const filterValue = filterInput.value.trim().toLowerCase();
    const numberList = parseNumberInput(filterValue);

    if (tableView.style.display !== "none") {
      const tbody = document.querySelector("#tableview tbody");
      Array.from(tbody.rows).forEach((row, index) => {
        const rowText = row.textContent.toLowerCase();
        const matchKeyword = rowText.includes(filterValue);
        const matchNumber = numberList.includes(index + 1);
        row.style.display = matchKeyword || matchNumber ? "" : "none";
      });
    } else if (verticalView.style.display !== "none") {
      const blocks = verticalView.children;
      Array.from(blocks).forEach((block, index) => {
        const blockText = block.textContent.toLowerCase();
        const matchKeyword = blockText.includes(filterValue);
        const matchNumber = numberList.includes(index + 1);
        block.style.display = matchKeyword || matchNumber ? "" : "none";
      });
    }
  };

  const filterByLevel = (level) => {
    if (tableView.style.display !== "none") {
      const tbody = document.querySelector("#tableview tbody");
      Array.from(tbody.rows).forEach((row, index) => {
        const questionLevel = questionPool[index].level;
        row.style.display = level === null || questionLevel === level ? "" : "none";
      });
    } else if (verticalView.style.display !== "none") {
      const blocks = verticalView.children;
      Array.from(blocks).forEach((block, index) => {
        const questionLevel = questionPool[index].level;
        block.style.display = level === null || questionLevel === level ? "" : "none";
      });
    }
  };

  const createLevelFilterButtons = () => {
    const levels = [...new Set(questionPool.map((q) => q.level))].sort((a, b) => a - b);

    levels.forEach((level) => {
      const button = document.createElement("button");
      button.textContent = `レベル ${level}`;
      button.style.margin = "0 5px 10px 0";
      button.addEventListener("click", () => {
        filterByLevel(level);
      });
      levelFilterContainer.appendChild(button);
    });

    const resetButton = document.createElement("button");
    resetButton.textContent = "全てのレベル";
    resetButton.style.margin = "0 5px 10px 0";
    resetButton.addEventListener("click", () => {
      filterByLevel(null);
    });
    levelFilterContainer.appendChild(resetButton);

    filterContainer.appendChild(levelFilterContainer);
  };

  const createTableView = () => {
    const table = document.createElement("table");
    table.innerHTML = `
      <thead>
        <tr>
          <th>問題番号</th>
          <th>問題文と選択肢</th>
          <th>正解と解説</th>
          <th>レベル</th>
        </tr>
      </thead>
      <tbody>
      </tbody>
    `;

    const tbody = table.querySelector("tbody");
    questionPool.forEach((question, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>
          <strong>${question.question}</strong>
          <ol>${question.choices.map((choice) => `<li>${choice}</li>`).join("")}</ol>
        </td>
        <td>
          <strong>正解:</strong> ${question.correct.join(", ")}<br />
          <strong>解説:</strong> ${question.explanation[0] || "なし"}<br />
          <strong>キーワード:</strong> ${question.tag || "なし"}
        </td>
        <td>${question.level}</td>
      `;
      tbody.appendChild(row);
    });

    tableView.innerHTML = "";
    tableView.appendChild(table);

    filterInput.addEventListener("input", filterInputHandler);
  };

  const createVerticalView = () => {
    verticalView.innerHTML = questionPool
      .map(
        (question, index) => {
          // ボタンのHTMLを条件付きで生成
          const buttonHTML = question.explanation.length > 1 
            ? `<button onclick="showFullExplanation(${index})">詳しく</button>`
            : "";

          // 参考文献リスト生成
          const referencesHTML = question.reference && question.url
          ? `<ul style="list-style-type: none; padding-left: 0;">` +
            question.reference.map(
              (ref, i) =>
                `<li style="margin-bottom: 5px;">
                  👉 <a href="${question.url[i]}" target="_blank">${ref}</a>
                </li>`
            ).join("") +
            `</ul>`
          : "なし";         
  
          return `
            <div>
              <h2>${index + 1}. ${question.question}</h2>
              <ol>${question.choices.map((choice) => `<li>${choice}</li>`).join("")}</ol>
              <p><strong>レベル:</strong> ${question.level}</p>
              <p><strong>正解:</strong> ${question.correct.join(", ")}</p>

              <p><strong>キーワード:</strong> ${question.tag || "なし"}</p>
              <p><strong>参考:</strong> ${question.pastexam || "なし"}</p>
              <p><strong>参考文献:</strong></p>
            ${referencesHTML}
              <div id="explanation-${index}">
                <strong>解説:</strong> <span>${question.explanation[0] || "なし"}</span>
                ${buttonHTML}
              </div>
            </div>
          `;
        }
      )
      .join("");
  };
  
  
  window.showFullExplanation = (index) => {
    const explanationElement = document.getElementById(`explanation-${index}`);
    if (explanationElement) {
      const explanationArray = questionPool[index].explanation || ["なし"];
      const explanationHTML = explanationArray.map((item) => `<p>${item}</p>`).join("");
      explanationElement.innerHTML = `<strong>解説:</strong>${explanationHTML}`;
    }
  };  
  
  createLevelFilterButtons();
  createTableView();
  createVerticalView();

  viewToggle.addEventListener("change", () => {
    const selectedView = viewToggle.value;
    if (selectedView === "table") {
      tableView.style.display = "block";
      verticalView.style.display = "none";
      howToUse.style.display = "none";
      filterContainer.style.display = "block";
    } else if (selectedView === "vertical") {
      tableView.style.display = "none";
      verticalView.style.display = "block";
      howToUse.style.display = "none";
      filterContainer.style.display = "block";
    } else if (selectedView === "howtouse") {
      tableView.style.display = "none";
      verticalView.style.display = "none";
      howToUse.style.display = "block";
      filterContainer.style.display = "none";
    }
  });

  viewToggle.value = "table";
  tableView.style.display = "block";
  verticalView.style.display = "none";
  howToUse.style.display = "none";
});
