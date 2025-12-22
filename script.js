
// ======== CONFIG: aggiorna gli ID se diversi nel tuo index.html ========
const FORM_ID = 'expense-form';
const AMOUNT_ID = 'amount';
const DATE_ID = 'date';
const CATEGORY_ID = 'category';
const DESCRIPTION_ID = 'description';
const LIST_ID = 'list';
const LS_KEY = 'expenses';

// ======== UTILS ========
const $ = (sel) => document.getElementById(sel) || document.querySelector(`[name="${sel}"]`);
const toNumber = (v) => {
  const n = Number.parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
};
const todayISO = () => new Date().toISOString().slice(0,10); // 'YYYY-MM-DD'
const toEpoch = (yyyyMMdd) => {
  // Se yyyyMMdd mancante o invalida => oggi
  if (!yyyyMMdd || !/^\d{4}-\d{2}-\d{2}$/.test(yyyyMMdd)) return Date.now();
  const [y,m,d] = yyyyMMdd.split('-').map(Number);
  // Costruiamo a mezzogiorno per evitare edge timezone
  return new Date(Date.UTC(y, m-1, d, 12, 0, 0, 0)).getTime();
};
const uuid = () => (crypto?.randomUUID ? crypto.randomUUID() : `id_${Date.now()}_${Math.random().toString(16).slice(2)}`);

// ======== STORAGE LAYER ========
function readExpenses() {
  // MDN: getItem -> null se chiave assente; gestiamo null/JSON non valido in modo sicuro
  // https://developer.mozilla.org/en-US/docs/Web/API/Storage/getItem
  const raw = localStorage.getItem(LS_KEY); // può essere null al primo avvio [1](https://developer.mozilla.org/en-US/docs/Web/API/Storage/getItem)
  if (raw === null) return []; // nessun dato salvato
  try {
    const parsed = JSON.parse(raw); // JSON.parse(null) -> null; JSON.parse('') lancia eccezione [2](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse)[3](https://stackoverflow.com/questions/74914978/why-does-json-parsenull-return-null)[4](https://sqlpey.com/javascript/resolved-why-does-json-parse-fail-when-given-an-empty-string/)
    // Normalizziamo: ci aspettiamo un array; qualunque altra cosa -> []
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    console.warn('[expenses] JSON corrotto in LS, resetto a []');
    return [];
  }
}

function saveExpenses(list) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Impossibile salvare su localStorage:', e);
    alert('Errore: spazio di archiviazione esaurito o bloccato.');
  }
}

// ======== DOMAIN MODEL ========
function normalizeExpense(obj) {
  // Garantiamo proprietà sempre presenti e tipi coerenti
  const amount = toNumber(obj?.amount);
  const category = (obj?.category ?? 'Other').trim() || 'Other';
  const description = (obj?.description ?? '').trim();
  const date = (obj?.date ?? todayISO()); // stringa 'YYYY-MM-DD'
  const ts = Number.isFinite(obj?.ts) ? obj.ts : toEpoch(date);

  return {
    id: obj?.id ?? uuid(),
    amount,           // number
    category,         // string
    description,      // string
    date,             // 'YYYY-MM-DD'
    ts                // epoch ms per ordinamento
  };
}

function validateExpenseFields({ amount, date }) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Inserisci un importo numerico maggiore di zero.');
  }
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('Inserisci una data valida (YYYY-MM-DD).');
  }
}

// ======== RENDER ========
function renderExpenses(expenses) {
  const listEl = $(LIST_ID);
  if (!listEl) return;

  // Ordinamento per data: dal più recente al più vecchio
  const sorted = expenses.slice().sort((a, b) => b.ts - a.ts);

  // Svuota e ricostruisci
  listEl.innerHTML = '';
  if (sorted.length === 0) {
    listEl.innerHTML = '<li>Nessuna spesa</li>';
    return;
  }

  const frag = document.createDocumentFragment();
  for (const e of sorted) {
    // Difese: e può essere undefined se qualcuno ha manipolato LS a mano
    if (!e || typeof e.amount === 'undefined') continue;

    const li = document.createElement('li');
    li.dataset.id = e.id;
    li.innerHTML = `
      <strong>${e.category}</strong> — 
      <span>${e.description ? e.description + ' — ' : ''}</span>
      <span>${e.amount.toFixed(2)} €</span>
      <small style="opacity:.7">(${e.date})</small>
      <button data-action="delete" aria-label="Eliminai);
  }
  listEl.appendChild(frag);
}

// ======== CONTROLLER ========
function addExpenseFromForm() {
  const amountEl = $(AMOUNT_ID);
  const dateEl = $(DATE_ID);
  const categoryEl = $(CATEGORY_ID);
  const descriptionEl = $(DESCRIPTION_ID);

  // Guardie contro elementi mancanti (evita il crash "reading 'amount'")
  if (!amountEl) { alert('Campo "amount" non trovato nel DOM.'); throw new Error('amount element missing'); }

  const candidate = {
    amount: toNumber(amountEl.value),
    date: (dateEl?.value || todayISO()),
    category: categoryEl?.value ?? 'Other',
    description: descriptionEl?.value ?? ''
  };

  validateExpenseFields(candidate); // lancia con messaggio chiaro se invalido

  const expenses = readExpenses();
  const normalized = normalizeExpense(candidate);
  expenses.push(normalized);
  saveExpenses(expenses);
  renderExpenses(expenses);
}

function deleteExpense(id) {
  const expenses = readExpenses();
  const next = expenses.filter(e => e?.id !== id);
  saveExpenses(next);
  renderExpenses(next);
}

function wireEvents() {
  const form = $(FORM_ID);
  if (!form) {
    console.error(`Form con id/name "${FORM_ID}" non trovato. Nessun salvataggio possibile.`);
    return;
  }

  // Primo submit: con queste guardie SALVA sempre o mostra errore leggibile
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    try {
      addExpenseFromForm();
      form.reset();
      $(AMOUNT_ID)?.focus();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Errore durante l\'aggiunta della spesa.');
    }
  });

  // Delegazione per pulsanti elimina nella lista
  const listEl = $(LIST_ID);
  if (listEl) {
    listEl.addEventListener('click', (ev) => {
      const btn = ev.target.closest('button[data-action="delete"]');
      if (!btn) return;
      const li = btn.closest('li');
      const id = li?.dataset?.id;
      if (!id) return;
      if (confirm('Confermi l’eliminazione della spesa?')) deleteExpense(id);
    });
  }
}

// ======== BOOT ========
document.addEventListener('DOMContentLoaded', () => {
  // Migrazione/normalizzazione eventuali dati esistenti
  const current = readExpenses().map(normalizeExpense);
  saveExpenses(current);
  renderExpenses(current);
  wireEvents();
});




/* OLD FILE

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

OLD */ 



