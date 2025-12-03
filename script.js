
const form = document.getElementById('expense-form');
const list = document.getElementById('expense-list');
const cancelEditBtn = document.getElementById('cancel-edit');
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];

function todayISO() { return new Date().toISOString().split('T')[0]; }
if (!document.getElementById('date').value) document.getElementById('date').value = todayISO();

function renderExpenses() {
  list.innerHTML = '';
  let dailyTotal = 0, monthlyTotal = 0;
  const today = todayISO();
  const currentMonth = today.slice(0,7);

  expenses.forEach((exp,index)=>{
    if(exp.date===today) dailyTotal+=exp.amount;
    if(exp.date.startsWith(currentMonth)) monthlyTotal+=exp.amount;

    const li=document.createElement('li');
    li.className='expense-item';
    li.innerHTML=`<span>${exp.desc} - €${exp.amount.toFixed(2)}</span>
      <div class='expense-actions'>
        <img src='assets/icons/edit.svg' alt='Edit' onclick='editExpense(${index})'>
        <img src='assets/icons/delete.svg' alt='Delete' onclick='deleteExpense(${index})'>
      </div>`;
    list.appendChild(li);
  });

  document.getElementById('daily-total').textContent='€ '+dailyTotal.toFixed(2);
  document.getElementById('monthly-total').textContent='€ '+monthlyTotal.toFixed(2);
  document.getElementById('empty-state').style.display=expenses.length?'none':'block';
}

form.addEventListener('submit',e=>{
  e.preventDefault();
  const desc=document.getElementById('desc').value;
  const amount=parseFloat(document.getElementById('amount').value);
  const date=document.getElementById('date').value;
  const editIndex=document.getElementById('edit-index').value;

  if(editIndex){
    expenses[editIndex]={desc,amount,date};
  }else{
    expenses.push({desc,amount,date});
  }
  localStorage.setItem('expenses',JSON.stringify(expenses));
  form.reset();
  document.getElementById('date').value=todayISO();
  document.getElementById('edit-index').value='';
  cancelEditBtn.hidden=true;
  renderExpenses();
});

function deleteExpense(index){
  const exp=expenses[index];
  if(confirm(`Confermi l'eliminazione di "${exp.desc}" (€${exp.amount.toFixed(2)} del ${exp.date})?`)){
    expenses.splice(index,1);
    localStorage.setItem('expenses',JSON.stringify(expenses));
    renderExpenses();
  }
}

function editExpense(index){
  const exp=expenses[index];
  document.getElementById('desc').value=exp.desc;
  document.getElementById('amount').value=exp.amount;
  document.getElementById('date').value=exp.date;
  document.getElementById('edit-index').value=index;
  cancelEditBtn.hidden=false;
}

cancelEditBtn.addEventListener('click',()=>{
  form.reset();
  document.getElementById('date').value=todayISO();
  document.getElementById('edit-index').value='';
  cancelEditBtn.hidden=true;
});

renderExpenses();
