// Hardcoded categories
const categories = ['Food','Transport','Utilities','Other'];
const form = document.getElementById('expense-form');
const list = document.getElementById('expense-list');
const cancelEditBtn = document.getElementById('cancel-edit');
const categorySelect = document.getElementById('category');
const exportLink = document.getElementById('export-csv');
let highlightedIndex = null;


categories.forEach(cat => {
  const opt = document.createElement('option');
  opt.value = cat;
  opt.textContent = cat;
  categorySelect.appendChild(opt);
});

// Imposta la categoria di default
categorySelect.value = 'Food';


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
    li.innerHTML=`<span>€${exp.amount.toFixed(2)} [${exp.category}]</span>
      <div class='expense-actions'>
        <img src='assets/icons/edit.svg' alt='Edit' onclick='editExpense(${index})'>
        <img src='assets/icons/delete.svg' alt='Delete' onclick='deleteExpense(${index})'>
      </div>`;
    
    // Evidenzia se è la riga in modifica
    if (index === highlightedIndex) {
        li.style.backgroundColor = '#fff3cd'; // giallo chiaro
    }

    list.appendChild(li);
  });

  document.getElementById('daily-total').textContent='€ '+dailyTotal.toFixed(2);
  document.getElementById('monthly-total').textContent='€ '+monthlyTotal.toFixed(2);
  document.getElementById('empty-state').style.display=expenses.length?'none':'block';
  document.getElementById('total-count').textContent =`Sono state registrate ${expenses.length} voci di spesa`;
}

// Funzione per ottenere la data di oggi in formato YYYY-MM-DD
function todayISO() {
   const d = new Date();
   return d.toISOString().split('T')[0];
}

form.addEventListener('submit',e=>{
  e.preventDefault();
  //const desc=document.getElementById('desc').value;
  const amount=parseFloat(document.getElementById('amount').value);
  const date=document.getElementById('date').value;
  // Imposta la data di default se il campo è vuoto
   if (!date.value) {
        date.value = todayISO();
  }
  const category=categorySelect.value;
  const editIndex=document.getElementById('edit-index').value;

  // Validazione importo > 0
  if (isNaN(amount) || amount <= 0) {
        alert('Inserisci un importo maggiore di zero');
        return;
    }

  if(editIndex){
    expenses[editIndex]={amount,date,category};
  }else{
    expenses.push({amount,date,category});
  }
  localStorage.setItem('expenses',JSON.stringify(expenses));
  form.reset();
  document.getElementById('date').value=todayISO();
  document.getElementById('edit-index').value='';
  cancelEditBtn.hidden=true;
  highlightedIndex = null;
  renderExpenses();
});

function deleteExpense(index){
  const exp=expenses[index];
  if(confirm(`Confermi l'eliminazione di "${exp.category}" (€${exp.amount.toFixed(2)} del ${exp.date})?`)){
    expenses.splice(index,1);
    localStorage.setItem('expenses',JSON.stringify(expenses));
    renderExpenses();
  }
}

function editExpense(index){
  const exp=expenses[index];
  //document.getElementById('desc').value=exp.desc;
  document.getElementById('amount').value=exp.amount;
  document.getElementById('date').value=exp.date;
  categorySelect.value=exp.category;
  document.getElementById('edit-index').value=index;

  // Cambia testo pulsante
    submitBtn.textContent = 'Modifica';
    cancelEditBtn.hidden = false;

  // Evidenzia la riga in modifica
    highlightedIndex = index; // variabile globale
    renderExpenses(); // aggiorna la lista con evidenziazione
}

cancelEditBtn.addEventListener('click',()=>{
  form.reset();
  document.getElementById('date').value=todayISO();
  document.getElementById('edit-index').value='';
  cancelEditBtn.hidden=true;
});

exportLink.addEventListener('click',e=>{
  e.preventDefault();
  if(expenses.length===0){alert('Nessuna spesa da esportare');return;}
  let csv='Importo,Data,Categoria';
  expenses.forEach(exp=>{
    csv+=`${exp.amount},${exp.date},${exp.category}`;
  });
  const blob=new Blob([csv],{type:'text/csv'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download='spese.csv';
  a.click();
  URL.revokeObjectURL(url);
});

renderExpenses();
