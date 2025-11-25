
const dateInput = document.getElementById('date');
const amountInput = document.getElementById('amount');
const categorySelect = document.getElementById('category');
const listDiv = document.getElementById('expenseList');
const downloadLink = document.getElementById('downloadLink');

const categories = ['Food', 'Transport', 'Utilities', 'Other'];
categories.forEach(cat => {
  const option = document.createElement('option');
  option.textContent = cat;
  categorySelect.appendChild(option);
});

// Default date
dateInput.value = new Date().toISOString().split('T')[0];

let expenses = JSON.parse(localStorage.getItem('expenses') || '[]');

function save() {
  localStorage.setItem('expenses', JSON.stringify(expenses));
}

function renderList() {
  listDiv.innerHTML = '';
  expenses.slice(-5).forEach((e, index) => {
    const item = document.createElement('div');
    item.textContent = `${e.date} - ${e.amount} - ${e.category}`;
    
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.onclick = () => {
      dateInput.value = e.date;
      amountInput.value = e.amount;
      categorySelect.value = e.category;
      expenses.splice(index, 1);
      save();
      renderList();
    };
    
    const delBtn = document.createElement('button');
    delBtn.textContent = 'Delete';
    delBtn.onclick = () => {
      expenses.splice(index, 1);
      save();
      renderList();
    };
    
    item.appendChild(editBtn);
    item.appendChild(delBtn);
    listDiv.appendChild(item);
  });

  const csv = 'Date,Amount,Category\n' + expenses.map(e => `${e.date},${e.amount},${e.category}`).join('\n');
  downloadLink.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  downloadLink.download = 'expenses.csv';
}

document.getElementById('submit').onclick = () => {
  const date = dateInput.value;
  const amount = amountInput.value;
  const category = categorySelect.value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(date) && /^\d+(\.\d{1,2})?$/.test(amount)) {
    expenses.push({ date, amount, category });
    save();
    renderList();
    amountInput.value = '';
  } else {
    alert('Invalid input');
  }
};

renderList();
