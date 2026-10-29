
"use strict";

// ========================================
// 1. HTML 요소 연결
// ========================================

const sizeInput = document.getElementById("queue-size");
const createButton = document.getElementById("create-queue");
const valueInput = document.getElementById("enqueue-value");
const enqueueButton = document.getElementById("enqueue-button");
const dequeueButton = document.getElementById("dequeue-button");

const queueStatus = document.getElementById("queue-status");
const codeTitle = document.getElementById("code-title");
const codeDisplay = document.getElementById("code-display");
const structureBadge = document.getElementById("structure-badge");

const queueCanvas = document.getElementById("queue-canvas");
const elementCount = document.getElementById("element-count");
const capacityCount = document.getElementById("capacity-count");
const variableGrid = document.getElementById("variable-grid");

const clearOutputButton = document.getElementById("clear-output");
const outputConsole = document.getElementById("output-console");

// 현재 페이지의 큐 종류: simple / circular / linked
const queueType = document.body.dataset.queueType
    || document.querySelector("[data-queue-type]")?.dataset.queueType
    || "simple";

// ========================================
// 2. 큐의 상태
// ========================================

let capacity = 0;
let items = [];

let front = 0;
let rear = 0;
let count = 0;

let head = null;
let tail = null;

let queueCreated = false;
let nextNodeId = 1;

// ========================================
// 3. 버튼에서 보여줄 알고리즘 코드
// ========================================

const algorithmCode = {
    create: {
        title: "큐 생성",
        simple: `items = []
capacity = size`,
        circular: `queue = [None] * size
front = 0
rear = 0
count = 0`,
        linked: `head = None
tail = None
count = 0`
    },

    enqueue: {
        title: "enqueue(data)",
        simple: `if len(items) == capacity:
    raise OverflowError

items.append(data)`,
        circular: `if count == capacity:
    raise OverflowError

queue[rear] = data
rear = (rear + 1) % capacity
count += 1`,
        linked: `if count == capacity:
    raise OverflowError

node = Node(data)

if head is None:
    node.next = node
    head = tail = node
else:
    node.next = head
    tail.next = node
    tail = node

count += 1`
    },

    dequeue: {
        title: "dequeue()",
        simple: `if len(items) == 0:
    raise IndexError

data = items.pop(0)
return data`,
        circular: `if count == 0:
    raise IndexError

data = queue[front]
queue[front] = None
front = (front + 1) % capacity
count -= 1
return data`,
        linked: `if count == 0:
    raise IndexError

data = head.data

if count == 1:
    head = tail = None
else:
    head = head.next
    tail.next = head

count -= 1
return data`
    }
};

// ========================================
// 4. 출력창에 메시지 추가
// ========================================

function logMessage(message, type = "info") {
    const line = document.createElement("div");

    line.className = `console-line ${type}`;
    line.textContent = `[${new Date().toLocaleTimeString("ko-KR")}] ${message}`;

    outputConsole.appendChild(line);
    outputConsole.scrollTop = outputConsole.scrollHeight;
}

// ========================================
// 5. 실행 코드 표시
// ========================================

function showCode(action) {
    const info = algorithmCode[action];

    if (!info) return;

    codeTitle.textContent = info.title;
    codeDisplay.textContent = info[queueType];
}

// ========================================
// 6. 현재 큐의 원소 개수
// ========================================

function getLength() {
    if (queueType === "simple") {
        return items.length;
    }

    return count;
}

// ========================================
// 7. 원형 연결 리스트 순회
// ========================================

function getLinkedNodes() {
    const nodes = [];

    if (head === null) {
        return nodes;
    }

    let current = head;

    do {
        nodes.push(current);
        current = current.next;
    } while (current !== head && nodes.length <= capacity);

    return nodes;
}

// ========================================
// 8. 변수 값 표시
// ========================================

function renderVariables() {
    variableGrid.replaceChildren();

    const variables = [];

    if (queueType === "simple") {
        variables.push(
            ["items", JSON.stringify(items)],
            ["size", capacity],
            ["count", items.length]
        );
    }

    if (queueType === "circular") {
        variables.push(
            ["queue", JSON.stringify(
                Array.from({ length: capacity }, (_, i) => {
                    return circularQueue[i] ?? null;
                })
            )],
            ["front", front],
            ["rear", rear],
            ["count", count],
            ["size", capacity]
        );
    }

    if (queueType === "linked") {
        variables.push(
            ["head", head ? `Node(${head.data})` : "None"],
            ["tail", tail ? `Node(${tail.data})` : "None"],
            ["head.data", head ? head.data : "None"],
            ["tail.data", tail ? tail.data : "None"],
            ["tail.next", tail
                ? (tail.next === head
                    ? "head"
                    : `Node(${tail.next.data})`)
                : "None"],
            ["count", count],
            ["size", capacity]
        );
    }

    for (const [name, value] of variables) {
        const card = document.createElement("div");
        card.className = "variable-card";

        const variableName = document.createElement("span");
        variableName.className = "variable-name";
        variableName.textContent = name;

        const variableValue = document.createElement("span");
        variableValue.className = "variable-value";
        variableValue.textContent = String(value);

        card.append(variableName, variableValue);
        variableGrid.appendChild(card);
    }
}

// 원형 큐의 실제 저장 공간
let circularQueue = [];

// ========================================
// 9. 큐 시각화
// ========================================

function renderQueue(animationIndex = -1) {
    queueCanvas.replaceChildren();

    const length = getLength();

    elementCount.textContent = length;
    capacityCount.textContent = capacity;

    structureBadge.textContent = {
        simple: "LIST QUEUE",
        circular: "CIRCULAR ARRAY",
        linked: "CIRCULAR LINKED LIST"
    }[queueType];

    if (!queueCreated) {
        queueCanvas.textContent = "먼저 큐를 생성해 주세요.";
        renderVariables();
        return;
    }

    if (queueType === "simple") {
        renderSimpleQueue(animationIndex);
    } else if (queueType === "circular") {
        renderCircularQueue(animationIndex);
    } else {
        renderLinkedQueue(animationIndex);
    }

    renderVariables();
}

// ========================================
// 10. 단순 리스트 큐 그리기
// ========================================

function renderSimpleQueue(animationIndex = -1) {
    const row = document.createElement("div");
    row.className = "queue-row";

    if (items.length === 0) {
        row.textContent = "큐가 비어 있습니다.";
        queueCanvas.appendChild(row);
        return;
    }

    items.forEach((value, index) => {
        const cell = document.createElement("div");
        cell.className = "queue-cell";

        if (index === 0) cell.classList.add("front-cell");
        if (index === items.length - 1) cell.classList.add("rear-cell");
        if (index === animationIndex) cell.classList.add("queue-animate");

        const valueElement = document.createElement("div");
        valueElement.className = "cell-value";
        valueElement.textContent = value;

        const indexElement = document.createElement("div");
        indexElement.className = "cell-index";
        indexElement.textContent = `index ${index}`;

        const pointer = document.createElement("div");
        pointer.className = "cell-pointer";

        if (index === 0) pointer.textContent = "FRONT";
        if (index === items.length - 1) {
            pointer.textContent = index === 0 ? "FRONT / REAR" : "REAR";
        }

        cell.append(pointer, valueElement, indexElement);
        row.appendChild(cell);
    });

    queueCanvas.appendChild(row);
}

// ========================================
// 11. 리스트 원형 큐 그리기
// ========================================

function renderCircularQueue(animationIndex = -1) {
    const row = document.createElement("div");
    row.className = "queue-row circular-row";

    for (let i = 0; i < capacity; i++) {
        const cell = document.createElement("div");
        cell.className = "queue-cell";

        if (i === front && count > 0) {
            cell.classList.add("front-cell");
        }

        if (i === rear && count < capacity) {
            cell.classList.add("rear-cell");
        }

        if (i === animationIndex) {
            cell.classList.add("queue-animate");
        }

        const pointer = document.createElement("div");
        pointer.className = "cell-pointer";

        const labels = [];

        if (count > 0 && i === front) labels.push("FRONT");
        if (count < capacity && i === rear) labels.push("REAR");

        pointer.textContent = labels.join(" / ");

        const valueElement = document.createElement("div");
        valueElement.className = "cell-value";
        valueElement.textContent = circularQueue[i] ?? "∅";

        const indexElement = document.createElement("div");
        indexElement.className = "cell-index";
        indexElement.textContent = `index ${i}`;

        cell.append(pointer, valueElement, indexElement);
        row.appendChild(cell);
    }

    queueCanvas.appendChild(row);

    const note = document.createElement("p");
    note.className = "queue-note";
    note.textContent =
        `front = ${front}, rear = ${rear}, count = ${count} / ${capacity}`;

    queueCanvas.appendChild(note);
}

// ========================================
// 12. 원형 연결 리스트 큐 그리기
// ========================================

function renderLinkedQueue(animationIndex = -1) {
    const nodes = getLinkedNodes();

    if (nodes.length === 0) {
        queueCanvas.textContent = "큐가 비어 있습니다. head = tail = None";
        return;
    }

    const row = document.createElement("div");
    row.className = "queue-row linked-row";

    nodes.forEach((node, index) => {
        const cell = document.createElement("div");
        cell.className = "queue-cell linked-cell";

        if (node === head) cell.classList.add("front-cell");
        if (node === tail) cell.classList.add("rear-cell");
        if (index === animationIndex) cell.classList.add("queue-animate");

        const pointer = document.createElement("div");
        pointer.className = "cell-pointer";

        const labels = [];
        if (node === head) labels.push("HEAD");
        if (node === tail) labels.push("TAIL");

        pointer.textContent = labels.join(" / ");

        const valueElement = document.createElement("div");
        valueElement.className = "cell-value";
        valueElement.textContent = node.data;

        const indexElement = document.createElement("div");
        indexElement.className = "cell-index";
        indexElement.textContent = `Node ${node.id}`;

        cell.append(pointer, valueElement, indexElement);
        row.appendChild(cell);

        if (index < nodes.length - 1) {
            const arrow = document.createElement("div");
            arrow.className = "node-arrow";
            arrow.textContent = "→";
            row.appendChild(arrow);
        }
    });

    const returnArrow = document.createElement("div");
    returnArrow.className = "linked-return";
    returnArrow.textContent =
    `↶ tail.next → head (Node ${head.id})`;

    queueCanvas.append(row, returnArrow);
}

// ========================================
// 13. 큐 생성
// ========================================

function createQueue() {
    const size = Number(sizeInput.value);

    if (!Number.isInteger(size) || size < 1 || size > 20) {
        logMessage("큐 크기는 1부터 20 사이의 정수여야 합니다.", "error");
        queueStatus.textContent = "올바른 큐 크기를 입력하세요.";
        return;
    }

    capacity = size;

    items = [];
    circularQueue = Array(size).fill(null);

    front = 0;
    rear = 0;
    count = 0;

    head = null;
    tail = null;

    nextNodeId = 1;
    queueCreated = true;

    showCode("create");
    renderQueue();

    queueStatus.textContent = `큐 생성 완료 (최대 크기: ${capacity})`;
    logMessage(`크기 ${capacity}의 큐를 생성했습니다.`, "success");

    enqueueButton.disabled = false;
    dequeueButton.disabled = false;
}

// ========================================
// 14. enqueue - 데이터 삽입
// ========================================

function enqueue() {
    if (!queueCreated) {
        logMessage("먼저 큐를 생성하세요.", "error");
        return;
    }

    const value = valueInput.value.trim();

    if (value === "") {
        logMessage("삽입할 데이터를 입력하세요.", "error");
        valueInput.focus();
        return;
    }

    if (getLength() >= capacity) {
        showCode("enqueue");
        queueStatus.textContent = "큐가 가득 찼습니다.";
        logMessage("OverflowError: 큐가 가득 찼습니다.", "error");
        return;
    }

    showCode("enqueue");

    if (queueType === "simple") {
        items.push(value);
        renderQueue(items.length - 1);
    } else if (queueType === "circular") {
        const insertedIndex = rear;

        circularQueue[rear] = value;
        rear = (rear + 1) % capacity;
        count++;

        renderQueue(insertedIndex);
    } else {
        const node = {
            id: nextNodeId++,
            data: value,
            next: null
        };

        if (head === null) {
            node.next = node;
            head = node;
            tail = node;
        } else {
            node.next = head;
            tail.next = node;
            tail = node;
        }

        count++;

        renderQueue(getLinkedNodes().length - 1);
    }

    queueStatus.textContent = `${value} 삽입 완료`;
    logMessage(`enqueue(${value}) 실행 완료`, "success");

    valueInput.value = "";
    valueInput.focus();
}

// ========================================
// 15. dequeue - 데이터 추출
// ========================================

async function dequeue() {
    if (!queueCreated) {
        logMessage("먼저 큐를 생성하세요.", "error");
        return;
    }

    if (getLength() === 0) {
        showCode("dequeue");
        queueStatus.textContent = "큐가 비어 있습니다.";
        logMessage("IndexError: 빈 큐에서 추출할 수 없습니다.", "error");
        return;
    }

    // 중복 클릭으로 삭제 상태가 꼬이지 않게 잠시 잠금
    enqueueButton.disabled = true;
    dequeueButton.disabled = true;
    createButton.disabled = true;

    showCode("dequeue");

    const firstCell = queueCanvas.querySelector(
        queueType === "circular"
            ? `.queue-cell:nth-child(${front + 1})`
            : ".queue-cell.front-cell"
    );

    // 삭제될 노드가 사라지는 애니메이션
    if (firstCell) {
        firstCell.classList.add("is-removing");
        await new Promise(resolve => setTimeout(resolve, 260));
    }

    let removedValue;

    if (queueType === "simple") {
        removedValue = items.shift();
    } else if (queueType === "circular") {
        removedValue = circularQueue[front];

        circularQueue[front] = null;
        front = (front + 1) % capacity;
        count--;
    } else {
        removedValue = head.data;

        if (count === 1) {
            head = null;
            tail = null;
        } else {
            head = head.next;
            tail.next = head;
        }

        count--;
    }

    renderQueue();

    // 단순 큐는 남은 데이터가 앞으로 이동하는 모습을 표시
    if (queueType === "simple") {
        const remainingCells = queueCanvas.querySelectorAll(".queue-cell");

        remainingCells.forEach(cell => {
            cell.classList.add("is-shifting");
        });
    }

    queueStatus.textContent = `${removedValue} 추출 완료`;
    logMessage(`dequeue() → ${removedValue}`, "success");

    enqueueButton.disabled = false;
    dequeueButton.disabled = false;
    createButton.disabled = false;
}

// ========================================
// 16. 이벤트 연결
// ========================================

createButton.addEventListener("click", createQueue);
enqueueButton.addEventListener("click", enqueue);
dequeueButton.addEventListener("click", dequeue);

valueInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        enqueue();
    }
});

sizeInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        createQueue();
    }
});

clearOutputButton.addEventListener("click", () => {
    outputConsole.replaceChildren();
    logMessage("출력 기록을 지웠습니다.");
});

// ========================================
// 17. 초기 화면
// ========================================

enqueueButton.disabled = true;
dequeueButton.disabled = true;

queueStatus.textContent = "큐 크기를 입력하고 생성 버튼을 누르세요.";

codeTitle.textContent = "알고리즘 코드";
codeDisplay.textContent = "버튼을 누르면 실행되는 코드가 표시됩니다.";

structureBadge.textContent = {
    simple: "LIST QUEUE",
    circular: "CIRCULAR ARRAY",
    linked: "CIRCULAR LINKED LIST"
}[queueType] || "QUEUE";

renderQueue();
