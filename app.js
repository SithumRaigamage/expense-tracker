// Global variables
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
const balanceElement = document.getElementById('balance');
const transactionList = document.getElementById('transactionList');
const amountInput = document.getElementById('amount');
const descriptionInput = document.getElementById('description');
const categorySelect = document.getElementById('category');
const addTransactionButton = document.getElementById('addTransaction');
const generateReportButton = document.getElementById('generateReport');
const reportElement = document.getElementById('report');

// Update the balance
function updateBalance() {
    let balance = 0;
    transactions.forEach(transaction => {
        if (transaction.type === 'Income') {
            balance += transaction.amount;
        } else {
            balance -= transaction.amount;
        }
    });
    balanceElement.textContent = balance.toFixed(2);
}

// Display transactions
function displayTransactions() {
    transactionList.innerHTML = '';
    transactions.forEach(transaction => {
        const li = document.createElement('li');
        li.classList.add(transaction.type.toLowerCase());
        li.textContent = `${transaction.description} - $${transaction.amount} (${transaction.category})`;
        transactionList.appendChild(li);
    });
}

// Add new transaction
function addTransaction() {
    const amount = parseFloat(amountInput.value);
    const description = descriptionInput.value;
    const category = categorySelect.value;

    if (!amount || !description) {
        alert('Please enter both amount and description');
        return;
    }

    const type = category === 'Income' ? 'Income' : 'Expense';
    const transaction = { amount, description, category, type };
    
    transactions.push(transaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    
    updateBalance();
    displayTransactions();

    amountInput.value = '';
    descriptionInput.value = '';
    categorySelect.value = 'Income';
}

// Generate report
function generateReport() {
    let income = 0;
    let expenses = 0;
    let food = 0;
    let entertainment = 0;
    let utilities = 0;

    transactions.forEach(transaction => {
        if (transaction.type === 'Income') {
            income += transaction.amount;
        } else {
            expenses += transaction.amount;
        }
        if (transaction.category === 'Food') {
            food += transaction.amount;
        } else if (transaction.category === 'Entertainment') {
            entertainment += transaction.amount;
        } else if (transaction.category === 'Utilities') {
            utilities += transaction.amount;
        }
    });

    reportElement.innerHTML = `
        <p>Total Income: $${income.toFixed(2)}</p>
        <p>Total Expenses: $${expenses.toFixed(2)}</p>
        <p>Food Expenses: $${food.toFixed(2)}</p>
        <p>Entertainment Expenses: $${entertainment.toFixed(2)}</p>
        <p>Utilities Expenses: $${utilities.toFixed(2)}</p>
    `;
}

// Event listeners
addTransactionButton.addEventListener('click', addTransaction);
generateReportButton.addEventListener('click', generateReport);

// Initial setup
updateBalance();
displayTransactions();
