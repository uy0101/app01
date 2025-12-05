// Hardcoded categories
const categories = ['Food','Transport','Utilities','Other'];
const form = document.getElementById('expense-form');
const list = document.getElementById('expense-list');
const cancelEditBtn = document.getElementById('cancel-edit');
const categorySelect = document.getElementById('category');
const exportLink = document.getElementById('export-csv');
let highlightedIndex = null;
let editIndex = null


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
  let n = expenses.length;

  
  // Copia e ordina per data: più recente in alto
  const sorted = expenses.slice().sort((a, b) => {
  //  'a.date' e 'b.date' devono essere  stringhe parsabili (idealmente ISO 'YYYY-MM-DD')
  const da = new Date(a.date || '1970-01-01' );
  const db = new Date(b.date || '1970-01-01' );
  return db - da; // decrescente
  });
  
  sorted.slice().forEach((exp, index) => {
  //expenses.forEach((exp,index)=>{
    let originalIndex = exp.key;
    if(exp.date===today) dailyTotal+=exp.amount;
    if(exp.date.startsWith(currentMonth)) monthlyTotal+=exp.amount;

    const li=document.createElement('li');
    li.dataset.index = String(index);
    li.className='expense-item';
    li.innerHTML=`<span class="expense-title">€${exp.amount.toFixed(2)} [${exp.category}]</span>
                  <small class="expense-date">${exp.date || ''}</small>
      <div class='expense-actions'>
        <img src='assets/icons/edit.svg' alt='Edit' onclick='editExpense(${originalIndex})'>
        <img src='assets/icons/delete.svg' alt='Delete' onclick='deleteExpense(${originalIndex})'>
      </div>`;
    
    // Evidenzia se è la riga in modifica
    if (originalIndex === highlightedIndex) {
      li.classList.add('editing');
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

//commit changes
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



  
   const recordIndex = expenses.findIndex(record => record.key === editIndex);
   if (recordIndex !== -1) {
   
   } 
   else{
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
  submitBtn.textContent = 'Aggiungi';
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
  
  // index è l'indice originale dell'array 'expenses'
  editIndex = index;

  const expense = expenses[index]; // carica quello giusto
  //document.getElementById('desc').value=exp.desc;
  document.getElementById('amount').value=exp.amount;
  document.getElementById('date').value=exp.date;
  document.getElementById('category').value = expense.category;
  //replaced by line above
  //categorySelect.value=exp.category;
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
  submitBtn.textContent = 'Aggiungi';
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
