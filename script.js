(function () {
  'use strict';

  var DESIGN_TYPES = {
    'Tarjeta personal': [['Concepto y research', 1], ['Diseño y bocetado', 2], ['Ajustes y entrega', 1]],
    Logo: [['Investigación de marca', 2], ['Bocetado de propuestas', 3], ['Diseño digital', 3], ['Rondas de revisión', 2]],
    'Identidad de marca completa': [['Investigación y moodboard', 3], ['Logo y variantes', 4], ['Paleta y tipografía', 2], ['Manual de marca', 3], ['Revisiones', 2]],
    'Papelería / stationery': [['Investigación', 1], ['Diseño de piezas', 3], ['Revisiones', 1]],
    'Post para redes (unidad)': [['Concepto', 0.5], ['Diseño', 1], ['Ajustes', 0.5]],
    'Kit mensual de redes sociales': [['Planificación de contenido', 2], ['Diseño de piezas', 8], ['Revisiones', 2]],
    'Flyer / volante': [['Concepto', 1], ['Diseño', 2], ['Revisiones', 1]],
    'Editorial / revista': [['Maquetación', 6], ['Diseño de portada', 2], ['Revisiones', 3]],
    'Sitio web': [['Investigación y wireframes', 4], ['Diseño UI', 8], ['Prototipo', 3], ['Revisiones', 3]],
    'Landing page': [['Wireframe', 2], ['Diseño UI', 4], ['Revisiones', 2]],
    'UI/UX de app': [['Research y flujos', 5], ['Wireframes', 4], ['Diseño UI', 10], ['Prototipo', 3], ['Revisiones', 3]],
    'Edición de video': [['Preproducción', 2], ['Edición', 6], ['Color y sonido', 2], ['Revisiones', 2]],
    'Motion graphics': [['Storyboard', 2], ['Animación', 8], ['Revisiones', 2]],
    'Presentación / pitch deck': [['Estructura de contenido', 2], ['Diseño de slides', 4], ['Revisiones', 1]],
    'Empaque / packaging': [['Investigación', 2], ['Diseño estructural', 3], ['Diseño gráfico', 3], ['Revisiones', 2]],
    Otro: []
  };
  var EXPENSE_CATS = {
    Ninguno: [],
    'Software de diseño': ['Adobe Creative Cloud', 'Figma', 'Canva Pro', 'Procreate', 'Affinity', 'Otro programa'],
    'Inteligencia artificial': ['ChatGPT Plus', 'Midjourney', 'Claude', 'Runway', 'Otra IA'],
    'Stock / recursos': ['Banco de imágenes', 'Fuentes tipográficas', 'Mockups', 'Otro recurso'],
    'Hosting / dominio': ['Hosting web', 'Dominio', 'Plugins o templates', 'Otro'],
    Colaboradores: ['Freelancer externo', 'Traductor', 'Otro colaborador'],
    'Otro gasto': []
  };
  var state = { tasks: [], expenses: [], taskId: 0, expenseId: 0 };
  var $ = function (id) { return document.getElementById(id); };
  var designSelect = $('f-designtype');
  var profitInput = $('f-profit');
  var profitValue = $('profit-val');
  var pills = document.querySelectorAll('#client-pills .pill');

  function money(value) {
    var currency = $('f-currency').value || '$';
    var rounded = Math.round((Number(value) || 0) * 100) / 100;
    var parts = rounded.toFixed(2).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return currency + parts[0] + (parts[1] === '00' ? '' : '.' + parts[1]);
  }

  function currentMultiplier() {
    var active = document.querySelector('#client-pills .pill.active');
    return active ? parseFloat(active.dataset.mult) : 1;
  }

  function addTask(name, hours) { state.taskId += 1; state.tasks.push({ id: state.taskId, name: name || '', hours: hours === undefined ? 1 : hours }); }
  function addExpense(category, subcategory, amount) { state.expenseId += 1; state.expenses.push({ id: state.expenseId, cat: category || 'Ninguno', sub: subcategory || '', amount: amount || 0 }); }

  function renderTasks() {
    var list = $('tasks-list');
    list.innerHTML = '';
    state.tasks.forEach(function (task) {
      var row = document.createElement('div'); row.className = 'row';
      var name = document.createElement('input'); name.type = 'text'; name.placeholder = 'Ej. Diseño y bocetado'; name.value = task.name;
      name.addEventListener('input', function () { task.name = name.value; });
      var hours = document.createElement('input'); hours.type = 'number'; hours.min = '0'; hours.step = '0.5'; hours.value = task.hours; hours.placeholder = 'hs';
      hours.addEventListener('input', function () { task.hours = parseFloat(hours.value) || 0; recalculate(); });
      var remove = document.createElement('button'); remove.className = 'del'; remove.type = 'button'; remove.textContent = '×'; remove.setAttribute('aria-label', 'Quitar tarea');
      remove.addEventListener('click', function () { state.tasks = state.tasks.filter(function (item) { return item.id !== task.id; }); renderTasks(); recalculate(); });
      row.append(name, hours, remove); list.appendChild(row);
    });
  }

  function renderExpenses() {
    var list = $('expenses-list'); list.innerHTML = '';
    state.expenses.forEach(function (expense) {
      var row = document.createElement('div'); row.className = 'row expense-row';
      var category = document.createElement('select');
      Object.keys(EXPENSE_CATS).forEach(function (key) { var option = new Option(key, key); option.selected = key === expense.cat; category.add(option); });
      var subcategory = document.createElement('select');
      var amount = document.createElement('input'); amount.type = 'number'; amount.min = '0'; amount.step = '1'; amount.placeholder = 'monto'; amount.value = expense.amount;
      function refreshSubcategory() {
        subcategory.innerHTML = ''; var choices = EXPENSE_CATS[expense.cat] || [];
        subcategory.style.display = expense.cat === 'Ninguno' || !choices.length ? 'none' : '';
        amount.style.display = expense.cat === 'Ninguno' ? 'none' : '';
        choices.forEach(function (choice) { subcategory.add(new Option(choice, choice)); });
        if (choices.length && !expense.sub) expense.sub = choices[0]; subcategory.value = expense.sub;
        if (expense.cat === 'Ninguno') { expense.amount = 0; amount.value = 0; }
      }
      category.addEventListener('change', function () { expense.cat = category.value; expense.sub = ''; refreshSubcategory(); recalculate(); });
      subcategory.addEventListener('change', function () { expense.sub = subcategory.value; });
      amount.addEventListener('input', function () { expense.amount = parseFloat(amount.value) || 0; recalculate(); });
      var remove = document.createElement('button'); remove.className = 'del'; remove.type = 'button'; remove.textContent = '×'; remove.setAttribute('aria-label', 'Quitar gasto');
      remove.addEventListener('click', function () { state.expenses = state.expenses.filter(function (item) { return item.id !== expense.id; }); renderExpenses(); recalculate(); });
      refreshSubcategory(); row.append(category, subcategory, amount, remove); list.appendChild(row);
    });
  }

  function totals() {
    var rate = parseFloat($('f-rate').value) || 0;
    var hours = state.tasks.reduce(function (total, task) { return total + (parseFloat(task.hours) || 0); }, 0);
    var timeCost = rate * hours;
    var expenseCost = state.expenses.reduce(function (total, expense) { return total + (parseFloat(expense.amount) || 0); }, 0);
    var profitPct = parseFloat(profitInput.value) || 0;
    var profit = (timeCost + expenseCost) * profitPct / 100;
    var subtotal = timeCost + expenseCost + profit;
    return { rate: rate, hours: hours, timeCost: timeCost, expenseCost: expenseCost, profitPct: profitPct, profit: profit, subtotal: subtotal, mult: currentMultiplier(), total: subtotal * currentMultiplier() };
  }

  function saveState() {
    try { localStorage.setItem('cc_pricing_state', JSON.stringify({ designer: $('f-designer').value, client: $('f-client').value, project: $('f-project').value, currency: $('f-currency').value, rate: $('f-rate').value, designtype: designSelect.value, profit: profitInput.value, mult: currentMultiplier(), tasks: state.tasks, expenses: state.expenses })); } catch (error) { return; }
  }

  function recalculate() {
    var result = totals();
    $('time-cost-display').textContent = money(result.timeCost); $('expense-cost-display').textContent = money(result.expenseCost);
    $('s-time').textContent = money(result.timeCost); $('s-expenses').textContent = money(result.expenseCost); $('s-profit-pct').textContent = result.profitPct; $('s-profit').textContent = money(result.profit);
    $('s-mult').textContent = '×' + result.mult.toFixed(result.mult % 1 ? 1 : 0); $('s-total').textContent = money(result.total); $('m-total').textContent = money(result.total);
    $('s-perhour').textContent = result.hours ? '≈ ' + money(result.total / result.hours) + ' por hora trabajada' : ''; saveState();
  }

  Object.keys(DESIGN_TYPES).forEach(function (key) { designSelect.add(new Option(key, key)); });
  designSelect.addEventListener('change', function () { state.tasks = []; state.taskId = 0; (DESIGN_TYPES[designSelect.value] || [['', 1]]).forEach(function (task) { addTask(task[0], task[1]); }); renderTasks(); recalculate(); });
  pills.forEach(function (pill) { pill.addEventListener('click', function () { pills.forEach(function (item) { item.classList.remove('active'); }); pill.classList.add('active'); pill.querySelector('input').checked = true; recalculate(); }); });
  $('add-task').addEventListener('click', function () { addTask('', 1); renderTasks(); recalculate(); });
  $('add-expense').addEventListener('click', function () { addExpense('Ninguno', '', 0); renderExpenses(); recalculate(); });
  profitInput.addEventListener('input', function () { profitValue.textContent = profitInput.value + '%'; recalculate(); });
  $('f-rate').addEventListener('input', recalculate); $('f-currency').addEventListener('input', recalculate);

  function loadState() {
    try {
      var saved = JSON.parse(localStorage.getItem('cc_pricing_state')); if (!saved) return false;
      $('f-designer').value = saved.designer || ''; $('f-client').value = saved.client || ''; $('f-project').value = saved.project || ''; $('f-currency').value = saved.currency || '$'; $('f-rate').value = saved.rate || 10;
      if (saved.designtype && DESIGN_TYPES[saved.designtype]) designSelect.value = saved.designtype; profitInput.value = saved.profit || 35; profitValue.textContent = profitInput.value + '%';
      if (saved.mult) pills.forEach(function (pill) { pill.classList.toggle('active', parseFloat(pill.dataset.mult) === saved.mult); });
      state.tasks = saved.tasks || []; state.expenses = saved.expenses || []; state.taskId = state.tasks.reduce(function (max, item) { return Math.max(max, item.id || 0); }, 0); state.expenseId = state.expenses.reduce(function (max, item) { return Math.max(max, item.id || 0); }, 0); return true;
    } catch (error) { return false; }
  }

  $('btn-reset').addEventListener('click', function () { if (!confirm('¿Empezar una cotización nueva? Se perderán los datos actuales.')) return; localStorage.removeItem('cc_pricing_state'); location.reload(); });
  function downloadPdf() { var result = totals(); var pdf = window.jspdf && window.jspdf.jsPDF; if (!pdf) return; var documentPdf = new pdf({ unit: 'pt', format: 'a4' }); documentPdf.setFont('helvetica', 'bold'); documentPdf.setFontSize(20); documentPdf.text('Cotización de diseño', 48, 56); documentPdf.setFont('helvetica', 'normal'); documentPdf.setFontSize(11); documentPdf.text('Precio total: ' + money(result.total), 48, 100); documentPdf.text('Horas estimadas: ' + result.hours, 48, 120); documentPdf.save('cotizacion-proyecto.pdf'); }
  $('btn-pdf').addEventListener('click', downloadPdf); $('m-pdf').addEventListener('click', downloadPdf);

  var steps = [{ id: 'sec-datos', label: 'Datos' }, { id: 'sec-cliente', label: 'Cliente' }, { id: 'sec-tipo', label: 'Diseño' }, { id: 'sec-tiempo', label: 'Tiempo' }, { id: 'sec-gastos', label: 'Gastos' }, { id: 'sec-ganancia', label: 'Ganancia' }];
  var stepButtons = [];
  var navigationLockUntil = 0;
  function setActiveStep(id) { stepButtons.forEach(function (item) { item.button.classList.toggle('active', item.id === id); }); }
  steps.forEach(function (step, index) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'step-item' + (index === 0 ? ' active' : '');
    button.innerHTML = '<span class="dot">' + (index + 1) + '</span><span class="lbl">' + step.label + '</span>';
    button.addEventListener('click', function () {
      var target = $(step.id);
      if (!target) return;
      setActiveStep(step.id);
      navigationLockUntil = Date.now() + 900;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    $('stepper').appendChild(button);
    stepButtons.push({ id: step.id, button: button });
  });

  function updateStepFromScroll() {
    if (Date.now() < navigationLockUntil) return;
    var marker = window.innerHeight * 0.28;
    var current = steps[0].id;
    steps.forEach(function (step) {
      var section = $(step.id);
      if (section && section.getBoundingClientRect().top <= marker) current = step.id;
    });
    setActiveStep(current);
  }
  window.addEventListener('scroll', updateStepFromScroll, { passive: true });
  updateStepFromScroll();

  if (!loadState()) { (DESIGN_TYPES[designSelect.value] || [['', 1]]).forEach(function (task) { addTask(task[0], task[1]); }); addExpense('Ninguno', '', 0); }
  renderTasks(); renderExpenses(); recalculate();
}());
