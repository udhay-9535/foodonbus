/************************************************************
 *  UNIVERSAL DASHBOARD — FOODONBUS NEON v6
 *  Full Logic For Every Menu Option (Orders, Drivers, Buses, Menu, Analytics)
 ************************************************************/

// Fake Database (Replace with Backend Later)
const DB = {
  orders: [
    { id: 101, seat: "12A", items: [{name:"Veg Biryani",price:120}], status: "Preparing", eta: 10 },
    { id: 102, seat: "7B", items: [{name:"Chicken Roll",price:150}], status: "Out for Delivery", eta: 4 },
  ],
  menu: [
    { id: 1, name: "Veg Biryani", price: 120, tags:["veg","popular"] },
    { id: 2, name: "Chicken Roll", price: 150, tags:["nonveg","quick"] },
    { id: 3, name: "Idli Sambhar", price: 90, tags:["veg","healthy"] }
  ],
  drivers: [
    { id:1, name: "Raju", phone: "9876543210", bus: "MH12 AB 3344", lat:19.07, lng:72.87 },
    { id:2, name: "Kumar", phone: "9988776655", bus: "KA09 XY 4433", lat:18.52, lng:73.85 }
  ],
  buses: [
    { number: "MH12 AB 3344", route: "Pune → Mumbai", seats: 42, lat:19.07, lng:72.87 },
    { number: "KA09 XY 4433", route: "Bangalore → Mysore", seats: 36, lat:18.52, lng:73.85 }
  ],
  passengers: [
    { seat: "12A", order: 101, status: "Preparing", eta: 10 },
    { seat: "7B", order: 102, status: "Out for Delivery", eta: 4 }
  ]
};

// PAGE TEMPLATES
const PAGES = {
  overview: `
    <section class="metrics">
      <div class="metric-card card"><div class="metric-title">New Orders</div><div id="mNew" class="metric-value">0</div></div>
      <div class="metric-card card"><div class="metric-title">Preparing</div><div id="mPreparing" class="metric-value">0</div></div>
      <div class="metric-card card"><div class="metric-title">Delivered</div><div id="mDelivered" class="metric-value">0</div></div>
      <div class="metric-card card"><div class="metric-title">Avg ETA</div><div id="mEta" class="metric-value">—</div></div>
    </section>

    <section class="card">
      <h4>Live Summary</h4>
      <div id="liveSummary">Loading...</div>
    </section>
  `,
  orders: `
    <section class="orders-section card">
      <h4>Live Orders</h4>
      <table class="orders-table" id="ordersTable">
        <thead>
          <tr><th>Order</th><th>Seat</th><th>Items</th><th>Status</th><th>ETA</th><th>Action</th></tr>
        </thead>
        <tbody></tbody>
      </table>
    </section>
  `,
  menu: `
    <section class="card">
      <h4>Menu Management</h4>
      <div class="row"><button class="btn-primary" id="addFoodBtn">Add Item</button><input id="menuSearch" placeholder="Search menu..." /></div>
      <div id="menuEditor"></div>
    </section>
  `,
  drivers: `
    <section class="card">
      <h4>Drivers</h4>
      <div id="driverList"></div>
    </section>
  `,
  buses: `
    <section class="card">
      <h4>Bus Management</h4>
      <div id="busList"></div>
    </section>
  `,
  map: `
    <section class="map-section card">
      <h4>Live Map</h4>
      <div id="liveMap" style="height:420px;border-radius:10px"></div>
    </section>
  `,
  analytics: `
    <section class="card">
      <h4>Analytics Dashboard</h4>
      <div id="analyticsBox"></div>
    </section>
  `,
  passengers: `
    <section class="card">
      <h4>Passenger Monitoring</h4>
      <p class="muted">Seat → Order → Status → ETA</p>
      <div id="passengerMonitor"></div>
    </section>
  `,
  settings: `
    <section class="card">
      <h4>Settings</h4>
      <p class="muted">System settings, theme, notifications, role controls.</p>
      <div class="row">
        <button class="btn-primary" id="toggleTheme">Toggle Dark/Light</button>
        <button class="btn-ghost" id="exportDB">Export DB (JSON)</button>
      </div>
    </section>
  `
};

// LOAD PAGE
const content = document.getElementById("content");
const title = document.getElementById("pageTitle");
const subtitle = document.getElementById("pageSubtitle");

document.querySelectorAll(".side-nav a").forEach(a => {
  a.addEventListener("click", () => {
    document.querySelector(".side-nav .active")?.classList.remove("active");
    a.classList.add("active");

    const page = a.dataset.page;
    title.textContent = a.textContent;
    subtitle.textContent = "Live management • " + a.textContent;

    content.innerHTML = PAGES[page];

    // INITIALIZE SPECIFIC PAGE FUNCTIONS
    if (page === "overview") loadOverview();
    if (page === "orders") loadOrders();
    if (page === "menu") loadMenuEditor();
    if (page === "drivers") loadDrivers();
    if (page === "buses") loadBuses();
    if (page === "map") initLiveMap();
    if (page === "passengers") loadPassengerMonitor();
    if (page === "analytics") loadAnalytics();
    if (page === "settings") loadSettings();
  });
});

/*****************************************************
 * 1. OVERVIEW FUNCTIONS
 *****************************************************/
function loadOverview() {
  document.getElementById("mNew").textContent = DB.orders.length;
  document.getElementById("mPreparing").textContent = DB.orders.filter(o => o.status === "Preparing").length;
  document.getElementById("mDelivered").textContent = DB.orders.filter(o => o.status === "Delivered").length;

  let avg = DB.orders.length ? Math.floor(DB.orders.reduce((a, b) => a + b.eta, 0) / DB.orders.length) : "—";
  document.getElementById("mEta").textContent = avg;

  document.getElementById("liveSummary").innerHTML = `
    Total Drivers: <strong>${DB.drivers.length}</strong><br>
    Active Buses: <strong>${DB.buses.length}</strong><br>
    Menu Items: <strong>${DB.menu.length}</strong><br>
    Pending Orders: <strong>${DB.orders.filter(o=>o.status!=='Delivered').length}</strong>
  `;
}

/*****************************************************
 * 2. ORDERS PAGE
 *****************************************************/
function renderOrderRow(o){
  const itemsText = o.items.map(i=>i.name).join(", ");
  return `
    <tr>
      <td>#${o.id}</td>
      <td>${o.seat}</td>
      <td>${itemsText}</td>
      <td>${o.status}</td>
      <td>${o.eta} min</td>
      <td>
        <button class="btn-primary" onclick="updateOrderStatus(${o.id})">Next</button>
        <button class="btn-ghost" onclick="cancelOrder(${o.id})">Cancel</button>
      </td>
    </tr>
  `;
}

function loadOrders() {
  let tbody = document.querySelector("#ordersTable tbody");
  tbody.innerHTML = "";

  DB.orders.forEach(o => {
    tbody.insertAdjacentHTML('beforeend', renderOrderRow(o));
  });
}

function updateOrderStatus(id) {
  let order = DB.orders.find(o => o.id === id);

  if (!order) return alert("Order not found");
  if (order.status === "Preparing") order.status = "Out for Delivery";
  else if (order.status === "Out for Delivery") order.status = "Delivered";
  else if (order.status === "Delivered") order.status = "Delivered";

  // Update passenger record
  const passenger = DB.passengers.find(p=>p.order===id);
  if(passenger) passenger.status = order.status;

  loadOrders();
  updateOverviewIfVisible();
}

function cancelOrder(id){
  const idx = DB.orders.findIndex(o=>o.id===id);
  if(idx===-1) return alert("Not found");
  if(!confirm("Cancel order #" + id + "?")) return;
  DB.orders.splice(idx,1);
  const pidx = DB.passengers.findIndex(p=>p.order===id);
  if(pidx!==-1) DB.passengers.splice(pidx,1);
  loadOrders();
  updateOverviewIfVisible();
}

/*****************************************************
 * 3. MENU PAGE
 *****************************************************/
function loadMenuEditor() {
  let box = document.getElementById("menuEditor");
  box.innerHTML = "";

  DB.menu.forEach(item => {
    box.innerHTML += `
      <div class="row" style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.02)">
        <div style="flex:1"><strong>${item.name}</strong><br><span class="muted">₹${item.price} • ${item.tags.join(", ")}</span></div>
        <div style="min-width:140px;text-align:right">
          <button class="btn-primary" onclick="editMenuItem(${item.id})">Edit</button>
          <button class="btn-ghost" onclick="removeMenuItem(${item.id})">Remove</button>
        </div>
      </div>
    `;
  });

  document.getElementById("addFoodBtn").onclick = () => {
    let n = prompt("Item Name?");
    let p = prompt("Price?");
    if (!n || !p) return;
    const nid = DB.menu.reduce((a,b)=>Math.max(a,b.id),0)+1;
    DB.menu.push({ id: nid, name: n, price: Number(p), tags:[] });
    loadMenuEditor();
  };

  const search = document.getElementById("menuSearch");
  search.addEventListener('input', (e)=>{
    const q = e.target.value.toLowerCase();
    const filtered = DB.menu.filter(m=>m.name.toLowerCase().includes(q) || (m.tags && m.tags.join(" ").includes(q)));
    box.innerHTML = "";
    filtered.forEach(item=>{
      box.innerHTML += `
        <div class="row" style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.02)">
          <div style="flex:1"><strong>${item.name}</strong><br><span class="muted">₹${item.price} • ${item.tags.join(", ")}</span></div>
          <div style="min-width:140px;text-align:right">
            <button class="btn-primary" onclick="editMenuItem(${item.id})">Edit</button>
            <button class="btn-ghost" onclick="removeMenuItem(${item.id})">Remove</button>
          </div>
        </div>
      `;
    });
  });
}

function editMenuItem(id){
  const item = DB.menu.find(m=>m.id===id);
  if(!item) return alert("Item not found");
  const name = prompt("Name", item.name);
  const price = prompt("Price", item.price);
  if(name) item.name = name;
  if(price) item.price = Number(price);
  loadMenuEditor();
}

function removeMenuItem(id){
  if(!confirm("Remove item?")) return;
  const idx = DB.menu.findIndex(m=>m.id===id);
  if(idx!==-1) DB.menu.splice(idx,1);
  loadMenuEditor();
}

/*****************************************************
 * 4. DRIVERS PAGE
 *****************************************************/
function loadDrivers() {
  let div = document.getElementById("driverList");
  div.innerHTML = "";

  DB.drivers.forEach(d => {
    div.innerHTML += `
      <div class="card small" style="margin-bottom:8px">
        <strong>${d.name}</strong><br>
        Phone: ${d.phone}<br>
        Bus: ${d.bus}<br>
        <div style="margin-top:8px">
          <button class="btn-primary" onclick="callDriver('${d.phone}')">Call</button>
          <button class="btn-ghost" onclick="trackDriver(${d.id})">Track</button>
        </div>
      </div>
    `;
  });

  div.innerHTML += '<div style="margin-top:8px"><button class="btn-primary" onclick="addDriver()">Add Driver</button></div>';
}

function callDriver(phone){
  alert("Simulated call to " + phone);
}

function trackDriver(id){
  const d = DB.drivers.find(x=>x.id===id);
  if(!d) return alert("Driver not found");
  alert("Open Live Map and look for driver near lat:"+d.lat.toFixed(3)+" lng:"+d.lng.toFixed(3));
  // show map page
  document.querySelector('[data-page="map"]').click();
  setTimeout(()=>{ if (map){ map.setView([d.lat,d.lng], 12);} },800);
}

function addDriver(){
  const name = prompt("Driver name?");
  const phone = prompt("Phone?");
  const bus = prompt("Assigned bus?");
  if(!name) return;
  DB.drivers.push({ id: DB.drivers.reduce((a,b)=>Math.max(a,b.id||0),0)+1, name, phone, bus, lat:19.2, lng:72.9});
  loadDrivers();
}

/*****************************************************
 * 5. BUSES PAGE
 *****************************************************/
function loadBuses() {
  let div = document.getElementById("busList");
  div.innerHTML = "";

  DB.buses.forEach(b => {
    div.innerHTML += `
      <div class="card small" style="margin-bottom:8px">
        <strong>${b.number}</strong><br>
        Route: ${b.route}<br>
        Seats: ${b.seats}<br>
        <div style="margin-top:8px">
          <button class="btn-primary" onclick="viewBus('${b.number}')">View</button>
          <button class="btn-ghost" onclick="removeBus('${b.number}')">Remove</button>
        </div>
      </div>
    `;
  });

  div.innerHTML += '<div style="margin-top:8px"><button class="btn-primary" onclick="addBus()">Add Bus</button></div>';
}

function viewBus(number){
  alert("Bus: " + number);
}

function addBus(){
  const number = prompt("Bus Number?");
  const route = prompt("Route?");
  const seats = prompt("Seats?");
  if(!number) return;
  DB.buses.push({ number, route, seats: Number(seats||36), lat:19.0, lng:72.9});
  loadBuses();
}

function removeBus(number){
  if(!confirm("Remove bus " + number + "?")) return;
  const idx = DB.buses.findIndex(b=>b.number===number);
  if(idx!==-1) DB.buses.splice(idx,1);
  loadBuses();
}

/*****************************************************
 * 6. PASSENGER MONITOR PAGE
 *****************************************************/
function loadPassengerMonitor() {
  let div = document.getElementById("passengerMonitor");
  div.innerHTML = "";

  DB.passengers.forEach(p => {
    const order = DB.orders.find(o=>o.id===p.order);
    div.innerHTML += `
      <div class="row card small" style="margin-bottom:8px">
        <div style="flex:1"><strong>Seat:</strong> ${p.seat}<br><span class="muted">Order: #${p.order} • ${p.status}</span></div>
        <div style="min-width:120px;text-align:right">
          <button class="btn-primary" onclick="viewPassenger(${p.order})">View</button>
          <button class="btn-ghost" onclick="messagePassenger('${p.seat}')">Message</button>
        </div>
      </div>
    `;
  });
}

function viewPassenger(orderId){
  const o = DB.orders.find(x=>x.id===orderId);
  if(!o) return alert("No order");
  alert("Order #" + o.id + "\nSeat: " + o.seat + "\nItems: " + o.items.map(i=>i.name).join(", ") + "\nStatus: " + o.status);
}

function messagePassenger(seat){
  alert("Simulated message to seat " + seat);
}

/*****************************************************
 * 7. ANALYTICS PAGE
 *****************************************************/
function loadAnalytics() {
  document.getElementById("analyticsBox").innerHTML = `
    <h3>Today Summary</h3>
    Orders: <strong>${DB.orders.length}</strong><br>
    Avg ETA: <strong>${DB.orders.length?Math.floor(DB.orders.reduce((a,b)=>a+b.eta,0)/DB.orders.length):0}</strong> mins<br>
    Active Drivers: <strong>${DB.drivers.length}</strong><br>
    Popular Items: <strong>${getTopItems().slice(0,3).join(", ")}</strong>
  `;
}

function getTopItems(){
  const count = {};
  DB.orders.forEach(o=>o.items.forEach(i=>{ count[i.name]=(count[i.name]||0)+1 }));
  return Object.keys(count).sort((a,b)=>count[b]-count[a]);
}

/*****************************************************
 * 8. MAP PAGE – LIVE BUS + DRIVER TRACKING
 *****************************************************/
let map, markers = [];
function initLiveMap() {
  if (map) return;

  map = L.map("liveMap").setView([20.5937, 78.9629], 5);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

  // add bus & drivers
  DB.buses.forEach(b=>{
    const m = L.marker([b.lat, b.lng]).addTo(map).bindPopup(`<strong>${b.number}</strong><br>${b.route}`);
    markers.push(m);
  });
  DB.drivers.forEach(d=>{
    const m = L.circleMarker([d.lat,d.lng], {radius:6}).addTo(map).bindPopup(`<strong>${d.name}</strong><br>${d.bus}`);
    markers.push(m);
  });

  // Simulated movement
  setInterval(()=> {
    markers.forEach((m, idx)=>{
      const ll = m.getLatLng();
      const nlat = ll.lat + (Math.random()-0.5)*0.02;
      const nlng = ll.lng + (Math.random()-0.5)*0.02;
      m.setLatLng([nlat, nlng]);
    });
  }, 2000);
}

/*****************************************************
 * 9. SETTINGS
 *****************************************************/
function loadSettings(){
  document.getElementById("toggleTheme").onclick = ()=> {
    document.body.classList.toggle("light-theme");
    alert("Theme toggled (visual simulation). Replace with real CSS toggle.");
  };

  document.getElementById("exportDB").onclick = ()=> {
    const data = JSON.stringify(DB, null, 2);
    const blob = new Blob([data], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "foodonbus_db.json";
    a.click();
    URL.revokeObjectURL(url);
  };
}

/*****************************************************
 * 10. UTILS
 *****************************************************/
function updateOverviewIfVisible(){
  if(document.querySelector('.side-nav .active')?.dataset.page === 'overview'){
    loadOverview();
  }
}

// Expose some functions to window for inline onclick usage:
window.updateOrderStatus = updateOrderStatus;
window.cancelOrder = cancelOrder;
window.editMenuItem = editMenuItem;
window.removeMenuItem = removeMenuItem;
window.callDriver = callDriver;
window.trackDriver = trackDriver;
window.addDriver = addDriver;
window.viewBus = viewBus;
window.removeBus = removeBus;
window.addBus = addBus;
window.viewPassenger = viewPassenger;
window.messagePassenger = messagePassenger;

// Load initial page
document.querySelector('[data-page="overview"]').click();
