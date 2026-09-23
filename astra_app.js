/* ============================================================
   ASTRA OIL & GAS — PROCUREMENT INTELLIGENCE OS
   Cloud-first · Supabase as single source of truth
   ============================================================ */

const SUPABASE_URL="https://iplpvmrxhvuuszzwrgta.supabase.co";
const SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwbHB2bXJ4aHZ1dXN6endyZ3RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwNTQ0ODIsImV4cCI6MjEwNTYzMDQ4Mn0.zDWFeswSTAONX7Bqxz70dsQmSve8yEbEgEVKIltUlHs";
const T={suppliers:"suppliers",contacts:"supplier_contacts",products:"supplier_products",documents:"Documentos",certifications:"supplier_certifications",timeline:"supplier_timeline"};
const BUCKET="astra-docs";

let supa=null,connected=false,currentArea="feedstock",currentPage="dashboard",currentTab="company";
let suppliers=[],contacts=[],products=[],documents=[],certifications=[],timelineEvents=[];
let selectedSupplierId=null;

const FORM_FIELDS=[
  ["fCode","code"],["fCompany","company"],["fCountry","country"],["fLocation","location"],
  ["fCnpj","cnpj"],["fCnae","cnae"],["fAdmin","admin"],["fCompanyType","company_type"],
  ["fConstitutionDate","constitution_date"],["fShareCapital","share_capital"],["fLegalStatus","legal_status"],
  ["fManager","manager"],["fPhone","phone"],["fWhatsapp","whatsapp"],["fEmail","email"],["fWebsite","website"],
  ["fProduct","product"],["fOrigin","origin"],["fFfa","ffa"],["fMoisture","moisture"],["fMiu","miu"],
  ["fInsolubles","insolubles"],["fIodine","iodine"],["fTfm","tfm"],["fCapacity","capacity"],
  ["fConsistency","consistency"],["fPrice","price"],["fCurrency","currency"],["fIncoterm","incoterm"],
  ["fPayment","payment"],["fIscc","iscc"],["fExportHistory","export_history"],["fLogistics","logistics"],
  ["fEnvironmental","environmental"],["fEvidence","evidence"],["fInternal","internal"]
];

const CONTACT_FIELDS=[["cName","name"],["cRole","role"],["cDepartment","department"],["cEmail","email"],["cPhone","phone"],["cWhatsapp","whatsapp"],["cNotes","notes"]];
const PRODUCT_FIELDS=[["pName","name"],["pCategory","category"],["pOrigin","origin"],["pDescription","description"],["pVolume","volume"],["pUnit","unit"],["pFrequency","frequency"],["pAvailability","availability"],["pFfa","ffa"],["pMoisture","moisture"],["pMiu","miu"],["pInsolubles","insolubles"],["pPhosphorus","phosphorus"],["pSulfur","sulfur"],["pIodine","iodine"],["pTfm","tfm"],["pPrice","price"],["pCurrency","currency"],["pIncoterm","incoterm"],["pPort","port"],["pObservations","observations"]];
const CERT_FIELDS=[["certType","type"],["certNumber","number"],["certIssuer","issuer"],["certIssueDate","issue_date"],["certExpiryDate","expiry_date"],["certStatus","cert_status"],["certObservations","observations"]];
const TIMELINE_FIELDS=[["tlType","event_type"],["tlDesc","description"],["tlDate","event_date"]];

const DD_DOMAINS=["legal","operations","quality","export","commercial","compliance"];
const DD_LABELS={legal:"Legal",operations:"Operativa",quality:"Calidad",export:"Exportación",commercial:"Comercial",compliance:"Compliance"};

/* ============================================================
   SUPABASE INIT
   ============================================================ */
function initSupabase(){
  try{
    if(window.supabase&&SUPABASE_URL&&SUPABASE_KEY){
      supa=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
      return true;
    }
  }catch(e){console.error("INIT ERROR:",e)}
  return false;
}

/* ============================================================
   CONNECTION
   ============================================================ */
async function connectSupabase(showToast){
  if(!supa)initSupabase();
  if(!supa){updateConnection(false,"AstraDB · error");setDBStatus("No se pudo inicializar el cliente Supabase.","error");return false}
  setDBStatus("Conectando a AstraDB...");
  try{
    const{error}=await supa.from(T.suppliers).select("id").limit(1);
    if(error){connected=false;updateConnection(false,"AstraDB · error");setDBStatus("AstraDB error: "+(error.message||"desconocido"),"error");toast("Error AstraDB: "+(error.message||"conexion fallida"));return false}
    connected=true;updateConnection(true,"AstraDB · conectado");setDBStatus("Conexion correcta. AstraDB disponible.","success");if(showToast)toast("AstraDB conectado.");return true;
  }catch(e){connected=false;updateConnection(false,"AstraDB · error");setDBStatus("Error: "+(e.message||"desconocido"),"error");toast("Error AstraDB: "+(e.message||"conexion fallida"));return false}
}

/* ============================================================
   DATA LOADING
   ============================================================ */
async function loadAll(){
  await Promise.all([loadSuppliers(),loadContacts(),loadProducts(),loadDocuments(),loadCertifications(),loadTimeline()]);
}
async function loadSuppliers(){
  const{data,error}=await supa.from(T.suppliers).select("*").order("created_at",{ascending:true});
  if(error)throw new Error("suppliers: "+error.message);
  suppliers=(data||[]).map(normalizeSupplier);
}
async function loadContacts(){
  const{data,error}=await supa.from(T.contacts).select("*").order("created_at",{ascending:true});
  if(error)throw new Error("contacts: "+error.message);
  contacts=data||[];
}
async function loadProducts(){
  const{data,error}=await supa.from(T.products).select("*").order("created_at",{ascending:true});
  if(error)throw new Error("products: "+error.message);
  products=data||[];
}
async function loadDocuments(){
  const{data,error}=await supa.from(T.documents).select("*").order("created_at",{ascending:false});
  if(error)throw new Error("documents: "+error.message);
  documents=data||[];
}
async function loadCertifications(){
  const{data,error}=await supa.from(T.certifications).select("*").order("created_at",{ascending:true});
  if(error)throw new Error("certifications: "+error.message);
  certifications=data||[];
}
async function loadTimeline(){
  const{data,error}=await supa.from(T.timeline).select("*").order("event_date",{ascending:false});
  if(error)throw new Error("timeline: "+error.message);
  timelineEvents=data||[];
}

/* ============================================================
   NORMALIZE / HELPERS
   ============================================================ */
function normalizeSupplier(row){
  const meta=row.metadata||{};
  return Object.assign({},row,{dd:meta.dd||{},contacted:meta.contacted!==undefined?meta.contacted:false});
}
function esc(v){return String(v==null?"":v).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}
function toast(msg){const el=document.getElementById("toast");if(!el)return;el.textContent=msg;el.classList.add("show");clearTimeout(window.__toastTimer);window.__toastTimer=setTimeout(function(){el.classList.remove("show")},3000)}
function val(v,f){if(v===null||v===undefined||String(v).trim()==="")return f||"PENDIENTE DE CONFIRMAR";return String(v)}
function normalizedText(v){return String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()}
function nextCode(){var m=0;suppliers.forEach(function(s){var n=parseInt(String(s.code||"").replace(/\D/g,""),10);if(Number.isFinite(n))m=Math.max(m,n)});return"AST-"+String(m+1).padStart(3,"0")}
function isMain(s){if(["AST-001","AST-002","AST-003"].includes(s.code))return true;var n=normalizedText(s.company);return["olam agroindustrial","renovar oleos vegetais","fl oleos"].includes(n)}
function isContacted(s){if(s.contacted!==undefined)return!!s.contacted;return["review","verified","risk"].includes(s.status)}
function ddState(s,d){var dd=s.dd||{};if(dd[d])return dd[d];if(isMain(s))return"verified";if(s.evidence||s.manager||s.phone||s.email||s.product)return"review";return"pending"}
function statusOf(s){if(s.status&&["verified","review","pending","risk"].includes(s.status))return s.status;if(isMain(s))return"verified";var st=DD_DOMAINS.map(function(d){return ddState(s,d)});if(st.includes("risk"))return"risk";if(st.every(function(x){return x==="verified"}))return"verified";if(st.includes("verified")||st.includes("review"))return"review";return"pending"}
function verificationPercent(s){var sc={verified:1,review:.5,pending:0,risk:0};var t=DD_DOMAINS.reduce(function(sum,d){return sum+sc[ddState(s,d)]},0);return Math.round(t/DD_DOMAINS.length*100)}
function statusBadge(s){var st=statusOf(s);var m={verified:["badge-green","VERIFICADO"],review:["badge-orange","EN DILIGENCIA"],pending:["badge-grey","PENDIENTE"],risk:["badge-red","RIESGO"]};var r=m[st];return'<span class="badge '+r[0]+'">'+r[1]+'</span>'}
function field(label,v,cls){return'<div class="field '+(cls||"")+'"><div class="field-label">'+esc(label)+'</div><div class="field-value">'+esc(val(v))+'</div></div>'}
function areaSuppliers(){return suppliers.filter(function(s){return s.business_area===currentArea})}
function areaContacts(){var ids=new Set(areaSuppliers().map(function(s){return s.id}));return contacts.filter(function(c){return ids.has(c.supplier_id)})}
function areaProducts(){var ids=new Set(areaSuppliers().map(function(s){return s.id}));return products.filter(function(p){return ids.has(p.supplier_id)})}
function areaDocuments(){var ids=new Set(areaSuppliers().map(function(s){return s.id}));return documents.filter(function(d){return ids.has(d.supplier_id)||ids.has(d.supplier_uuid)})}
function docUrl(path){if(!path||!supa)return"#";return supa.storage.from(BUCKET).getPublicUrl(path).data.publicUrl}
function supplierName(id){var s=suppliers.find(function(x){return x.id===id});return s?esc(s.company):"N/A"}

/* ============================================================
   GENERIC DB
   ============================================================ */
async function dbUpsert(table,payload){
  var r=await sup.from(table)
    .upsert(payload,{onConflict:"id"})
    .select()
    .single();

  if(r.error){
    console.error("SUPABASE UPSERT ERROR:",r.error);
    throw new Error(
      "Supabase: "+
      (r.error.message||"error")+
      " | code="+
      (r.error.code||"")+
      " | details="+
      (r.error.details||"")
    );
  }

  return r.data;
}
async function dbDeleteRow(table,id){
  var r=await supa.from(table).delete().eq("id",id);
  if(r.error)throw r.error;
}

/* ============================================================
   MODALS
   ============================================================ */
function openModal(id){var el=document.getElementById(id);if(el)el.classList.add("show")}
function closeModal(id){var el=document.getElementById(id);if(el)el.classList.remove("show")}

/* ============================================================
   SUPPLIER CRUD
   ============================================================ */
function openNewSupplier(){
  document.getElementById("fId").value=crypto.randomUUID();
  FORM_FIELDS.forEach(function(f){var el=document.getElementById(f[0]);if(el)el.value=""});
  document.getElementById("fCode").value=nextCode();
  document.getElementById("fCurrency").value="USD/MT";
  document.getElementById("modalTitle").textContent="Nuevo proveedor — "+currentArea.toUpperCase();
  openModal("supplierModal");
}
function editSupplier(id){
  var s=suppliers.find(function(x){return x.id===id});if(!s)return;
  document.getElementById("fId").value=s.id;
  FORM_FIELDS.forEach(function(f){var el=document.getElementById(f[0]);if(el)el.value=s[f[1]]||""});
  document.getElementById("modalTitle").textContent="Editar proveedor — "+(s.company||"");
  openModal("supplierModal");
}
async function saveSupplier(){
  var id=document.getElementById("fId").value||crypto.randomUUID();
  var payload={id:id};
  FORM_FIELDS.forEach(function(f){var el=document.getElementById(f[0]);if(el)payload[f[1]]=el.value.trim()||null});
  payload.business_area=currentArea;
  var existing=suppliers.find(function(s){return s.id===id});
  payload.metadata={dd:(existing&&existing.dd)||{},contacted:true};
  payload.status=(existing&&existing.status)||"pending";
  try{
    var row=await dbUpsert(T.suppliers,payload);
    var norm=normalizeSupplier(row);
    var idx=suppliers.findIndex(function(s){return s.id===id});
    if(idx>=0)suppliers[idx]=norm;else suppliers.push(norm);
    closeModal("supplierModal");renderAll();
    if(currentPage==="s360"&&selectedSupplierId===id)renderS360();
    toast("Proveedor guardado en AstraDB.");
  }catch(e){toast("Error guardando: "+e.message);console.error(e)}
}
async function deleteSupplier(id){
  var s=suppliers.find(function(x){return x.id===id});if(!s)return;
  if(!confirm("Eliminar "+(s.company||"este proveedor")+"? Se eliminaran tambien contactos, productos, certificaciones y timeline asociados."))return;
  try{
    await dbDeleteRow(T.suppliers,id);
    suppliers=suppliers.filter(function(x){return x.id!==id});
    contacts=contacts.filter(function(c){return c.supplier_id!==id});
    products=products.filter(function(p){return p.supplier_id!==id});
    certifications=certifications.filter(function(c){return c.supplier_id!==id});
    timelineEvents=timelineEvents.filter(function(t){return t.supplier_id!==id});
    documents=documents.filter(function(d){return d.supplier_id!==id&&d.supplier_uuid!==id});
    if(selectedSupplierId===id){selectedSupplierId=null;goPage("suppliers")}
    renderAll();toast("Proveedor eliminado de AstraDB.");
  }catch(e){toast("Error eliminando: "+e.message)}
}

/* ============================================================
   CONTACT CRUD
   ============================================================ */
function openNewContact(sid){
  document.getElementById("cId").value="";
  document.getElementById("cSupplierId").value=sid;
  CONTACT_FIELDS.forEach(function(f){var el=document.getElementById(f[0]);if(el)el.value=""});
  var pm=document.getElementById("cPrimary");if(pm)pm.value="false";
  var tm=document.getElementById("cTechnical");if(tm)tm.value="false";
  var cm=document.getElementById("cCommercial");if(cm)cm.value="false";
  document.getElementById("contactModalTitle").textContent="Nuevo contacto";
  openModal("contactModal");
}
function editContact(id){
  var c=contacts.find(function(x){return x.id===id});if(!c)return;
  document.getElementById("cId").value=c.id;
  document.getElementById("cSupplierId").value=c.supplier_id;
  CONTACT_FIELDS.forEach(function(f){var el=document.getElementById(f[0]);if(el)el.value=c[f[1]]||""});
  document.getElementById("cPrimary").value=String(!!c.is_primary);
  document.getElementById("cTechnical").value=String(!!c.is_technical);
  document.getElementById("cCommercial").value=String(!!c.is_commercial);
  document.getElementById("contactModalTitle").textContent="Editar contacto";
  openModal("contactModal");
}
async function saveContact(){
  var id=document.getElementById("cId").value||crypto.randomUUID();
  var sid=document.getElementById("cSupplierId").value;
  if(!sid){toast("Falta supplier_id");return}
  var payload={id:id,supplier_id:sid};
  CONTACT_FIELDS.forEach(function(f){var el=document.getElementById(f[0]);if(el)payload[f[1]]=el.value.trim()||null});
  payload.is_primary=document.getElementById("cPrimary").value==="true";
  payload.is_technical=document.getElementById("cTechnical").value==="true";
  payload.is_commercial=document.getElementById("cCommercial").value==="true";
  try{
    await dbUpsert(T.contacts,payload);
    await loadContacts();
    closeModal("contactModal");
    if(currentPage==="s360")renderS360Tab("contacts");
    renderContactsPage();renderDashboard();
    toast("Contacto guardado en AstraDB.");
  }catch(e){toast("Error: "+e.message)}
}
async function deleteContact(id){
  if(!confirm("Eliminar este contacto?"))return;
  try{
    await dbDeleteRow(T.contacts,id);
    contacts=contacts.filter(function(c){return c.id!==id});
    if(currentPage==="s360")renderS360Tab("contacts");
    renderContactsPage();toast("Contacto eliminado.");
  }catch(e){toast("Error: "+e.message)}
}

/* ============================================================
   PRODUCT CRUD
   ============================================================ */
function openNewProduct(sid){
  document.getElementById("pId").value="";
  document.getElementById("pSupplierId").value=sid;
  PRODUCT_FIELDS.forEach(function(f){var el=document.getElementById(f[0]);if(el)el.value=""});
  document.getElementById("productModalTitle").textContent="Nuevo producto";
  openModal("productModal");
}
function editProduct(id){
  var p=products.find(function(x){return x.id===id});if(!p)return;
  document.getElementById("pId").value=p.id;
  document.getElementById("pSupplierId").value=p.supplier_id;
  PRODUCT_FIELDS.forEach(function(f){var el=document.getElementById(f[0]);if(el)el.value=p[f[1]]||""});
  document.getElementById("productModalTitle").textContent="Editar producto";
  openModal("productModal");
}
async function saveProduct(){
  var id=document.getElementById("pId").value||crypto.randomUUID();
  var sid=document.getElementById("pSupplierId").value;
  if(!sid){toast("Falta supplier_id");return}
  var payload={id:id,supplier_id:sid};
  PRODUCT_FIELDS.forEach(function(f){var el=document.getElementById(f[0]);if(el)payload[f[1]]=el.value.trim()||null});
  try{
    await dbUpsert(T.products,payload);
    await loadProducts();
    closeModal("productModal");
    if(currentPage==="s360")renderS360Tab("products");
    renderProductsPage();toast("Producto guardado en AstraDB.");
  }catch(e){toast("Error: "+e.message)}
}
async function deleteProduct(id){
  if(!confirm("Eliminar este producto?"))return;
  try{
    await dbDeleteRow(T.products,id);
    products=products.filter(function(p){return p.id!==id});
    if(currentPage==="s360")renderS360Tab("products");
    renderProductsPage();toast("Producto eliminado.");
  }catch(e){toast("Error: "+e.message)}
}

/* ============================================================
   DOCUMENT UPLOAD
   ============================================================ */
async function uploadDocument(sid){
  var fileInput=document.getElementById("s360DocFile")||document.getElementById("docFile");
  var catSelect=document.getElementById("s360DocCategory")||document.getElementById("docCategory");
  if(!fileInput||!fileInput.files||!fileInput.files[0]){toast("Selecciona un archivo.");return}
  if(!sid){sid=(document.getElementById("docSupplierFilter")||{}).value||"";if(!sid){toast("Selecciona un proveedor primero.");return}}
  var file=fileInput.files[0];
  var category=(catSelect||{}).value||"Otro";
  var path=sid+"/"+Date.now()+"-"+file.name;
  try{
    var upR=await supa.storage.from(BUCKET).upload(path,file,{upsert:false});
    if(upR.error){toast("Error subiendo archivo: "+upR.error.message);return}
    var insR=await supa.from(T.documents).insert({name:file.name,category:category,supplier_id:sid,supplier_uuid:sid,storage_path:path,doc_status:"pending"}).select();
    if(insR.error){toast("Error guardando metadata: "+insR.error.message);return}
    if(insR.data&&insR.data[0])documents.unshift(insR.data[0]);
    fileInput.value="";
    if(currentPage==="s360")renderS360Tab("documents");
    renderDocumentsPage();renderDashboard();
    toast("Documento subido a AstraDB Storage.");
  }catch(e){toast("Error: "+e.message)}
}
async function deleteDocument(id){
  if(!confirm("Eliminar este documento?"))return;
  var doc=documents.find(function(d){return d.id===id});
  if(doc&&doc.storage_path){try{await supa.storage.from(BUCKET).remove([doc.storage_path])}catch(e){console.warn("Storage delete:",e)}}
  try{
    await dbDeleteRow(T.documents,id);
    documents=documents.filter(function(d){return d.id!==id});
    if(currentPage==="s360")renderS360Tab("documents");
    renderDocumentsPage();renderDashboard();
    toast("Documento eliminado.");
  }catch(e){toast("Error: "+e.message)}
}

/* ============================================================
   CERTIFICATION CRUD
   ============================================================ */
function openNewCert(sid){
  document.getElementById("certId").value="";
  document.getElementById("certSupplierId").value=sid;
  CERT_FIELDS.forEach(function(f){var el=document.getElementById(f[0]);if(el)el.value=""});
  var st=document.getElementById("certStatus");if(st)st.value="pending";
  document.getElementById("certModalTitle").textContent="Nueva certificacion";
  openModal("certModal");
}
function editCert(id){
  var c=certifications.find(function(x){return x.id===id});if(!c)return;
  document.getElementById("certId").value=c.id;
  document.getElementById("certSupplierId").value=c.supplier_id;
  CERT_FIELDS.forEach(function(f){var el=document.getElementById(f[0]);if(el)el.value=c[f[1]]||""});
  document.getElementById("certModalTitle").textContent="Editar certificacion";
  openModal("certModal");
}
async function saveCertification(){
  var id=document.getElementById("certId").value||crypto.randomUUID();
  var sid=document.getElementById("certSupplierId").value;
  if(!sid){toast("Falta supplier_id");return}
  var payload={id:id,supplier_id:sid};
  CERT_FIELDS.forEach(function(f){var el=document.getElementById(f[0]);if(el)payload[f[1]]=el.value.trim()||null});
  try{
    await dbUpsert(T.certifications,payload);
    await loadCertifications();
    closeModal("certModal");
    if(currentPage==="s360")renderS360Tab("certs");
    toast("Certificacion guardada en AstraDB.");
  }catch(e){toast("Error: "+e.message)}
}
async function deleteCertification(id){
  if(!confirm("Eliminar esta certificacion?"))return;
  try{
    await dbDeleteRow(T.certifications,id);
    certifications=certifications.filter(function(c){return c.id!==id});
    if(currentPage==="s360")renderS360Tab("certs");
    toast("Certificacion eliminada.");
  }catch(e){toast("Error: "+e.message)}
}

/* ============================================================
   TIMELINE CRUD
   ============================================================ */
function openNewTimeline(sid){
  document.getElementById("tlId").value="";
  document.getElementById("tlSupplierId").value=sid;
  TIMELINE_FIELDS.forEach(function(f){var el=document.getElementById(f[0]);if(el)el.value=""});
  var d=document.getElementById("tlDate");if(d)d.value=new Date().toISOString().slice(0,10);
  document.getElementById("timelineModalTitle").textContent="Nuevo evento";
  openModal("timelineModal");
}
async function saveTimelineEvent(){
  var id=document.getElementById("tlId").value||crypto.randomUUID();
  var sid=document.getElementById("tlSupplierId").value;
  if(!sid){toast("Falta supplier_id");return}
  var payload={id:id,supplier_id:sid};
  TIMELINE_FIELDS.forEach(function(f){var el=document.getElementById(f[0]);if(el)payload[f[1]]=el.value.trim()||null});
  try{
    await dbUpsert(T.timeline,payload);
    await loadTimeline();
    closeModal("timelineModal");
    if(currentPage==="s360")renderS360Tab("activity");
    toast("Evento guardado en AstraDB.");
  }catch(e){toast("Error: "+e.message)}
}
async function deleteTimelineEvent(id){
  if(!confirm("Eliminar este evento?"))return;
  try{
    await dbDeleteRow(T.timeline,id);
    timelineEvents=timelineEvents.filter(function(t){return t.id!==id});
    if(currentPage==="s360")renderS360Tab("activity");
    toast("Evento eliminado.");
  }catch(e){toast("Error: "+e.message)}
}

/* ============================================================
   DD UPDATE
   ============================================================ */
async function updateDD(sid,domain,state){
  var s=suppliers.find(function(x){return x.id===sid});if(!s)return;
  s.dd=s.dd||{};s.dd[domain]=state;
  try{
    var r=await supa.from(T.suppliers).update({metadata:{dd:s.dd,contacted:s.contacted}}).eq("id",sid);
    if(r.error){toast("Error DD: "+r.error.message);return}
    renderS360DD(s);renderDashboard();renderSuppliers();
    toast("DD "+DD_LABELS[domain]+": "+state);
  }catch(e){toast("Error: "+e.message)}
}

/* ============================================================
   RENDERING
   ============================================================ */
function renderAll(){renderDashboard();renderSuppliers();renderProductsPage();renderContactsPage();renderPipeline();renderDocumentsPage()}

function renderDashboard(){
  var a=areaSuppliers();
  document.getElementById("mSuppliers").textContent=a.length;
  document.getElementById("mVerified").textContent=a.filter(function(s){return statusOf(s)==="verified"}).length;
  document.getElementById("mReview").textContent=a.filter(function(s){return statusOf(s)==="review"}).length;
  document.getElementById("mPending").textContent=a.filter(function(s){return statusOf(s)==="pending"}).length;
  document.getElementById("mDocs").textContent=areaDocuments().length;
  var main=a.filter(isMain);
  var contacted=a.filter(function(s){return isContacted(s)&&!isMain(s)});
  var untouched=a.filter(function(s){return!isContacted(s)});
  var pct=function(n){return a.length?Math.round(n/a.length*100):0};
  document.getElementById("pipelineDashboard").innerHTML=
    '<div style="margin-bottom:17px"><div style="display:flex;justify-content:space-between;font-size:11px;font-weight:800;margin-bottom:6px"><span>Proveedores principales</span><span>'+main.length+'</span></div><div class="progress"><span style="width:'+pct(main.length)+'%"></span></div></div>'+
    '<div style="margin-bottom:17px"><div style="display:flex;justify-content:space-between;font-size:11px;font-weight:800;margin-bottom:6px"><span>Contrapartes contactadas</span><span>'+contacted.length+'</span></div><div class="progress"><span style="width:'+pct(contacted.length)+'%;background:var(--orange)"></span></div></div>'+
    '<div><div style="display:flex;justify-content:space-between;font-size:11px;font-weight:800;margin-bottom:6px"><span>Sin contactar</span><span>'+untouched.length+'</span></div><div class="progress"><span style="width:'+pct(untouched.length)+'%;background:#aab2b9"></span></div></div>';
  var priority=a.filter(function(s){return["verified","review"].includes(statusOf(s))}).slice(0,8);
  document.getElementById("priorityDashboard").innerHTML=priority.length?priority.map(function(s){
    return'<div style="padding:10px;border-bottom:1px solid #edf0f2;cursor:pointer" onclick="openSupplier360(\''+s.id+'\')"><div style="font-weight:800;font-size:12px">'+esc(s.company||"PENDIENTE")+'</div><div style="font-size:10px;color:var(--muted);margin-top:3px">'+esc(s.code||"")+" · "+statusBadge(s)+'</div></div>';
  }).join(""):'<div class="empty-state">No hay prioridades.</div>';
}

function renderSuppliers(){
  var tbody=document.getElementById("supplierTable");if(!tbody)return;
  if(!connected){tbody.innerHTML='<tr><td colspan="10" class="empty-state">No hay conexion con AstraDB. Verifica Configuracion.</td></tr>';return}
  var searchVal=(document.getElementById("supplierSearch")||{}).value||"";
  var search=normalizedText(searchVal);
  var sf=(document.getElementById("supplierStatusFilter")||{}).value||"all";
  var f=areaSuppliers();
  if(search)f=f.filter(function(s){var hay=[s.company,s.code,s.country,s.location,s.cnpj,s.manager,s.phone,s.email,s.product,s.origin].map(function(v){return normalizedText(v||"")}).join(" ");return hay.includes(search)});
  if(sf!=="all")f=f.filter(function(s){return statusOf(s)===sf});
  f.sort(function(a,b){if(isMain(a)&&!isMain(b))return-1;if(!isMain(a)&&isMain(b))return 1;if(isContacted(a)&&!isContacted(b))return-1;if(!isContacted(a)&&isContacted(b))return 1;return(a.company||"").localeCompare(b.company||"")});
  if(!f.length){tbody.innerHTML='<tr><td colspan="10" class="empty-state">No se encontraron proveedores.</td></tr>';return}
  tbody.innerHTML=f.map(function(s){
    var cls=isMain(s)?"priority-main":isContacted(s)?"priority-contact":"priority-unworked";
    var price=val(s.price)!=="PENDIENTE DE CONFIRMAR"?s.price+" "+(s.currency||""):"PENDIENTE";
    return'<tr class="'+cls+'"><td><div class="company">'+esc(s.company||"PENDIENTE")+'</div><div class="code">'+esc(s.code||"")+'</div></td><td>'+esc(s.location||"")+'<br><span class="muted">'+esc(s.country||"")+'</span></td><td>'+esc(val(s.product,"—"))+'</td><td>'+esc(val(s.ffa,"—"))+'</td><td>'+esc(val(s.capacity,"—"))+'</td><td class="price">'+esc(price)+'</td><td>'+esc(val(s.incoterm,"—"))+'</td><td>'+statusBadge(s)+'</td><td>'+verificationPercent(s)+'%</td><td><button class="btn" onclick="openSupplier360(\''+s.id+'\')">Abrir</button></td></tr>';
  }).join("");
}

/* ============================================================
   SUPPLIER 360
   ============================================================ */
function openSupplier360(id){selectedSupplierId=id;currentTab="company";goPage("s360")}
function renderS360(){
  var s=suppliers.find(function(x){return x.id===selectedSupplierId});
  var c=document.getElementById("s360Content");if(!c)return;
  if(!s){c.innerHTML='<div class="empty-state">Proveedor no encontrado.</div>';return}
  var tabs=["company","contacts","products","documents","certs","dd","activity"];
  var tabLabels={company:"Empresa",contacts:"Contactos",products:"Productos",documents:"Documentos",certs:"Certificaciones",dd:"Due Diligence",activity:"Actividad"};
  c.innerHTML=
    '<div class="s360-back"><button class="btn" onclick="goPage(\'suppliers\')">← Volver</button></div>'+
    '<div class="s360-header"><div><div class="s360-title">'+esc(s.company||"PENDIENTE")+'</div><div class="s360-code">'+esc(s.code||"")+" · "+esc(s.country||"")+" · "+esc(s.location||"")+'</div></div><div style="display:flex;gap:8px;align-items:center">'+statusBadge(s)+'<button class="btn" onclick="editSupplier(\''+s.id+'\')">Editar</button><button class="btn btn-danger" onclick="deleteSupplier(\''+s.id+'\')">Eliminar</button></div></div>'+
    '<div class="s360-tabs">'+tabs.map(function(t){return'<button class="s360-tab '+(currentTab===t?"active":"")+'" data-tab="'+t+'" onclick="switchS360Tab(\''+t+'\')">'+tabLabels[t]+'</button>'}).join("")+'</div>'+
    '<div id="s360TabContent" class="s360-content"></div>';
  renderS360Tab(currentTab);
}
function switchS360Tab(tab){currentTab=tab;document.querySelectorAll(".s360-tab").forEach(function(b){b.classList.toggle("active",b.dataset.tab===tab)});renderS360Tab(tab)}
function renderS360Tab(tab){
  var c=document.getElementById("s360TabContent");if(!c)return;
  var s=suppliers.find(function(x){return x.id===selectedSupplierId});if(!s)return;
  if(tab==="company")c.innerHTML=renderS360Company(s);
  else if(tab==="contacts")c.innerHTML=renderS360Contacts(s.id);
  else if(tab==="products")c.innerHTML=renderS360Products(s.id);
  else if(tab==="documents")c.innerHTML=renderS360Documents(s.id);
  else if(tab==="certs")c.innerHTML=renderS360Certs(s.id);
  else if(tab==="dd")c.innerHTML=renderS360DD(s);
  else if(tab==="activity")c.innerHTML=renderS360Timeline(s.id);
}
function renderS360Company(s){
  return'<div class="detail-grid">'+
    field("CNPJ / Registro",s.cnpj)+field("CNAE",s.cnae)+field("Administrador",s.admin)+
    field("Tipo de empresa",s.company_type)+field("Fecha de constitucion",s.constitution_date)+field("Capital social",s.share_capital)+
    field("Estado legal",s.legal_status)+field("Manager / Contacto",s.manager)+field("Telefono",s.phone)+
    field("WhatsApp",s.whatsapp)+field("Email",s.email)+field("Website",s.website)+
    field("Producto",s.product)+field("Origen / proceso",s.origin,"field-wide")+
    field("FFA",s.ffa)+field("Humedad",s.moisture)+field("MIU",s.miu)+
    field("Insolubles",s.insolubles)+field("Iodine",s.iodine)+field("TFM / TFA",s.tfm)+
    field("Capacidad",s.capacity)+field("Consistencia mensual",s.consistency)+field("Precio",s.price)+
    field("Moneda",s.currency)+field("Incoterm",s.incoterm)+field("Pago",s.payment)+
    field("ISCC",s.iscc)+field("Historial exportador",s.export_history)+field("Logistica",s.logistics,"field-wide")+
    field("Licencia ambiental",s.environmental,"field-wide")+field("Evidencia",s.evidence,"field-wide")+field("Notas internas",s.internal,"field-wide")+
  '</div>';
}
function renderS360Contacts(sid){
  var items=contacts.filter(function(c){return c.supplier_id===sid});
  var h='<button class="btn btn-primary" style="margin-bottom:14px" onclick="openNewContact(\''+sid+'\')">+ Contacto</button>';
  if(!items.length)return h+'<div class="empty-state">No hay contactos para este proveedor.</div>';
  h+='<div class="contact-grid">'+items.map(function(c){
    return'<div class="contact"><div style="display:flex;justify-content:space-between"><div><div class="contact-name">'+esc(c.name||"PENDIENTE")+'</div><div class="contact-company">'+esc(c.role||"")+" · "+esc(c.department||"")+'</div></div><div style="display:flex;gap:4px"><button class="btn" onclick="editContact(\''+c.id+'\')">Editar</button><button class="btn btn-danger" onclick="deleteContact(\''+c.id+'\')">×</button></div></div><div class="contact-line">'+(c.email?"📧 "+esc(c.email):"")+'</div><div class="contact-line">'+(c.phone?"📞 "+esc(c.phone):"")+'</div><div class="contact-line">'+(c.whatsapp?"💬 "+esc(c.whatsapp):"")+'</div>'+(c.is_primary?'<span class="badge badge-blue">Principal</span>':"")+(c.is_technical?'<span class="badge badge-grey">Tecnico</span>':"")+(c.is_commercial?'<span class="badge badge-orange">Comercial</span>':"")+(c.notes?'<div style="font-size:10px;color:var(--muted);margin-top:6px">'+esc(c.notes)+'</div>':"")+'</div>';
  }).join("")+'</div>';
  return h;
}
function renderS360Products(sid){
  var items=products.filter(function(p){return p.supplier_id===sid});
  var h='<button class="btn btn-primary" style="margin-bottom:14px" onclick="openNewProduct(\''+sid+'\')">+ Producto</button>';
  if(!items.length)return h+'<div class="empty-state">No hay productos para este proveedor.</div>';
  h+='<div class="product-grid">'+items.map(function(p){
    return'<div class="product-card"><div style="display:flex;justify-content:space-between"><div class="product-name">'+esc(p.name||"PENDIENTE")+'</div><div style="display:flex;gap:4px"><button class="btn" onclick="editProduct(\''+p.id+'\')">Editar</button><button class="btn btn-danger" onclick="deleteProduct(\''+p.id+'\')">×</button></div></div><div class="product-meta">Categoria: '+esc(p.category||"N/A")+'<br>Origen: '+esc(p.origin||"N/A")+'<br>FFA: '+esc(p.ffa||"N/A")+" · MIU: "+esc(p.miu||"N/A")+'<br>Volumen: '+esc(p.volume||"N/A")+" "+esc(p.unit||"")+'<br>Precio: '+esc(p.price||"N/A")+" "+esc(p.currency||"")+'<br>'+(p.observations?esc(p.observations):"")+'</div></div>';
  }).join("")+'</div>';
  return h;
}
function renderS360Documents(sid){
  var docs=documents.filter(function(d){return d.supplier_id===sid||d.supplier_uuid===sid});
  var h='<div class="toolbar" style="margin-bottom:14px"><input id="s360DocFile" type="file"><select id="s360DocCategory"><option>ISCC</option><option>COA</option><option>SGS</option><option>Ficha tecnica</option><option>Fotos</option><option>Legal</option><option>BL</option><option>Licencia ambiental</option><option>Contrato</option><option>Otro</option></select><button class="btn btn-primary" onclick="uploadDocument(\''+sid+'\')">Subir documento</button></div>';
  if(!docs.length)return h+'<div class="empty-state">No hay documentos para este proveedor.</div>';
  h+='<div class="doc-list">'+docs.map(function(d){var url=docUrl(d.storage_path);return'<div class="doc"><div class="doc-main"><div class="doc-name">'+esc(d.name||"")+'</div><div class="doc-meta">'+esc(d.category||"")+" · "+(d.created_at?new Date(d.created_at).toLocaleDateString():"")+(d.doc_status?" · "+esc(d.doc_status):"")+'</div></div><div style="display:flex;gap:6px">'+(d.storage_path?'<a class="btn" href="'+url+'" target="_blank" download="'+esc(d.name||"")+'">Descargar</a>':"")+'<button class="btn btn-danger" onclick="deleteDocument(\''+d.id+'\')">Eliminar</button></div></div>'}).join("")+'</div>';
  return h;
}
function renderS360Certs(sid){
  var items=certifications.filter(function(c){return c.supplier_id===sid});
  var h='<button class="btn btn-primary" style="margin-bottom:14px" onclick="openNewCert(\''+sid+'\')">+ Certificacion</button>';
  if(!items.length)return h+'<div class="empty-state">No hay certificaciones para este proveedor.</div>';
  h+='<div class="detail-grid">'+items.map(function(c){
    var sm={verified:["badge-green","VERIFICADO"],pending:["badge-grey","PENDIENTE"],expired:["badge-red","EXPIRADO"]};
    var r=sm[c.cert_status]||sm.pending;
    return'<div class="field field-wide"><div style="display:flex;justify-content:space-between"><div><div class="field-label">'+esc(c.type||"Certificacion")+'</div><div class="field-value">Nº '+esc(c.number||"N/A")+" · "+esc(c.issuer||"N/A")+'</div><div style="font-size:10px;color:var(--muted);margin-top:4px">Emision: '+esc(c.issue_date||"N/A")+" · Expira: "+esc(c.expiry_date||"N/A")+'</div></div><div style="display:flex;gap:4px;align-items:center"><span class="badge '+r[0]+'">'+r[1]+'</span><button class="btn" onclick="editCert(\''+c.id+'\')">Editar</button><button class="btn btn-danger" onclick="deleteCertification(\''+c.id+'\')">×</button></div></div>'+(c.observations?'<div style="font-size:10px;color:var(--muted);margin-top:6px">'+esc(c.observations)+'</div>':"")+'</div>';
  }).join("")+'</div>';
  return h;
}
function renderS360DD(s){
  var states=["verified","review","pending","risk"];
  var stateLabel={verified:"Verificado",review:"Documentado",pending:"Pendiente",risk:"No disponible"};
  var stateColor={verified:"badge-green",review:"badge-orange",pending:"badge-grey",risk:"badge-red"};
  return'<div class="dd-grid">'+DD_DOMAINS.map(function(d){
    var cur=ddState(s,d);
    return'<div class="dd"><div class="dd-title">'+DD_LABELS[d]+'</div><div class="dd-status"><span class="badge '+stateColor[cur]+'">'+stateLabel[cur]+'</span></div><div class="dd-note" style="margin-bottom:10px">Estado actual: '+stateLabel[cur]+'</div><select onchange="updateDD(\''+s.id+"','"+d+"',this.value)\" style=\"width:100%\">"+states.map(function(st){return'<option value="'+st+'" '+(st===cur?"selected":"")+'>'+stateLabel[st]+'</option>'}).join("")+'</select></div>';
  }).join("")+'</div>';
}
function renderS360Timeline(sid){
  var items=timelineEvents.filter(function(t){return t.supplier_id===sid});
  var h='<button class="btn btn-primary" style="margin-bottom:14px" onclick="openNewTimeline(\''+sid+'\')">+ Evento</button>';
  if(!items.length)return h+'<div class="empty-state">No hay actividad registrada.</div>';
  h+='<div>'+items.map(function(t){return'<div class="timeline-item"><div class="timeline-date">'+(t.event_date?new Date(t.event_date).toLocaleDateString():"")+'</div><div style="flex:1"><div class="timeline-type">'+esc(t.event_type||"").replace(/_/g," ")+'</div><div class="timeline-desc">'+esc(t.description||"")+'</div></div><button class="btn btn-danger" onclick="deleteTimelineEvent(\''+t.id+'\')">×</button></div>'}).join("")+'</div>';
  return h;
}

/* ============================================================
   GLOBAL PAGES
   ============================================================ */
function renderProductsPage(){
  var g=document.getElementById("productsGrid");if(!g)return;
  var items=areaProducts();
  if(!items.length){g.innerHTML='<div class="empty-state">No hay productos cargados.</div>';return}
  g.innerHTML=items.map(function(p){return'<div class="product-card"><div class="product-name">'+esc(p.name||"PENDIENTE")+'</div><div class="product-meta">Proveedor: '+supplierName(p.supplier_id)+'<br>Categoria: '+esc(p.category||"N/A")+'<br>Origen: '+esc(p.origin||"N/A")+'<br>FFA: '+esc(p.ffa||"N/A")+" · MIU: "+esc(p.miu||"N/A")+'<br>Volumen: '+esc(p.volume||"N/A")+" "+esc(p.unit||"")+'<br>Precio: '+esc(p.price||"N/A")+" "+esc(p.currency||"")+'</div></div>'}).join("");
}
function renderContactsPage(){
  var g=document.getElementById("contactsGrid");if(!g)return;
  var items=areaContacts();
  if(!items.length){g.innerHTML='<div class="empty-state">No hay contactos cargados.</div>';return}
  g.innerHTML=items.map(function(c){return'<div class="contact"><div class="contact-name">'+esc(c.name||"PENDIENTE")+'</div><div class="contact-company">'+supplierName(c.supplier_id)+'</div><div class="contact-line">'+(c.role?esc(c.role):"")+'</div><div class="contact-line">'+(c.email?"📧 "+esc(c.email):"")+'</div><div class="contact-line">'+(c.phone?"📞 "+esc(c.phone):"")+'</div>'+(c.is_primary?'<span class="badge badge-blue">Principal</span>':"")+'</div>'}).join("");
}
function renderPipeline(){
  var c=document.getElementById("pipelineContent");if(!c)return;
  var a=areaSuppliers();
  var sts=["verified","review","pending","risk"];
  var sl={verified:"Verificados",review:"En diligencia",pending:"Pendientes",risk:"Riesgo"};
  c.innerHTML='<div class="pipeline-board">'+sts.map(function(st){
    var items=a.filter(function(s){return statusOf(s)===st});
    return'<div class="pipeline-col"><div class="pipeline-col-title">'+sl[st]+" ("+items.length+')</div>'+items.map(function(s){return'<div class="pipeline-card" onclick="openSupplier360(\''+s.id+'\')"><div class="pipeline-card-name">'+esc(s.company||"PENDIENTE")+'</div><div class="pipeline-card-meta">'+esc(s.code||"")+" · "+esc(s.country||"")+'</div></div>'}).join("")||'<div style="font-size:11px;color:var(--muted);padding:8px">Sin elementos</div>'+'</div>';
  }).join("")+'</div>';
}
function renderDocumentsPage(){
  var filter=document.getElementById("docSupplierFilter");
  if(filter){var cur=filter.value;filter.innerHTML='<option value="">Todos los proveedores</option>'+areaSuppliers().map(function(s){return'<option value="'+s.id+'">'+esc(s.company||"PENDIENTE")+'</option>'}).join("");filter.value=cur}
  var list=document.getElementById("documentsList");if(!list)return;
  var sf=filter?filter.value:"";
  var docs=areaDocuments();
  if(sf)docs=documents.filter(function(d){return d.supplier_id===sf||d.supplier_uuid===sf});
  if(!docs.length){list.innerHTML='<div class="empty-state">No hay documentos cargados.</div>';return}
  list.innerHTML=docs.map(function(d){var url=docUrl(d.storage_path);return'<div class="doc"><div class="doc-main"><div class="doc-name">'+esc(d.name||"")+'</div><div class="doc-meta">'+esc(d.category||"")+" · "+supplierName(d.supplier_id||d.supplier_uuid)+" · "+(d.created_at?new Date(d.created_at).toLocaleDateString():"")+'</div></div><div style="display:flex;gap:6px">'+(d.storage_path?'<a class="btn" href="'+url+'" target="_blank" download="'+esc(d.name||"")+'">Descargar</a>':"")+'<button class="btn btn-danger" onclick="deleteDocument(\''+d.id+'\')">Eliminar</button></div></div>'}).join("");
}

/* ============================================================
   NAVIGATION
   ============================================================ */
function pageTitle(page){var a=currentArea==="feedstock"?"Feedstock":"Energy";var m={dashboard:"Dashboard",suppliers:a+" · Proveedores",products:a+" · Productos",contacts:a+" · Contactos",pipeline:a+" · Pipeline",documents:"Documentacion",map:"Mapa mental",intelligence:"Inteligencia",settings:"Configuracion",s360:"Supplier 360"};return m[page]||"Astra OS"}
function goPage(page){
  document.querySelectorAll(".page").forEach(function(p){p.style.display="none"});
  var t=document.getElementById("page-"+page);if(t)t.style.display="";
  document.querySelectorAll(".nav button[data-page]").forEach(function(b){b.classList.toggle("active",b.dataset.page===page)});
  document.getElementById("pageTitle").textContent=pageTitle(page);
  if(page==="dashboard")renderDashboard();
  else if(page==="suppliers")renderSuppliers();
  else if(page==="products")renderProductsPage();
  else if(page==="contacts")renderContactsPage();
  else if(page==="pipeline")renderPipeline();
  else if(page==="documents")renderDocumentsPage();
  else if(page==="settings")initSettings();
  else if(page==="s360")renderS360();
  currentPage=page;
}
function switchArea(area){
  currentArea=area;
  document.querySelectorAll(".area-btn").forEach(function(b){b.classList.toggle("active",b.dataset.area===area)});
  if(currentPage==="s360"){goPage("suppliers")}
  else{goPage(currentPage)}
  renderAll();
}

/* ============================================================
   SETTINGS
   ============================================================ */
function initSettings(){
  var u=document.getElementById("cfgUrl");if(u)u.value=SUPABASE_URL;
  var k=document.getElementById("cfgKey");if(k)k.value=SUPABASE_KEY;
  if(connected)setDBStatus("AstraDB conectado. "+suppliers.length+" proveedores en base de datos.","success");
  else setDBStatus("AstraDB desconectado. Haz clic en Conectar.","warning");
}
function updateConnection(ok,text){var el=document.getElementById("connection");if(el){el.textContent=text;el.className="connection "+(ok?"ok":"")}var p=document.getElementById("modePill");var t=document.getElementById("modeText");if(p&&t){if(ok){p.className="mode-pill cloud";t.textContent="ASTRADB"}else{p.className="mode-pill";t.textContent="LOCAL"}}}
function setDBStatus(text,type){var el=document.getElementById("dbStatus");if(el){el.textContent=text;el.className="config-note "+(type||"")}}
function exportJSON(){
  var data={suppliers:suppliers,contacts:contacts,products:products,documents:documents,certifications:certifications,timelineEvents:timelineEvents,exportedAt:new Date().toISOString()};
  var blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  var url=URL.createObjectURL(blob);var a=document.createElement("a");a.href=url;a.download="astra-export-"+Date.now()+".json";a.click();URL.revokeObjectURL(url);toast("JSON exportado.");
}

/* ============================================================
   BOOT
   ============================================================ */
async function boot(){
  initSupabase();
  var ok=await connectSupabase(false);
  if(ok){
    try{
      setDBStatus("Cargando datos de AstraDB...");
      await loadAll();
      setDBStatus("AstraDB cargado: "+suppliers.length+" proveedores, "+contacts.length+" contactos, "+products.length+" productos, "+documents.length+" documentos.","success");
    }catch(err){
      setDBStatus("Error cargando datos: "+err.message,"error");
      toast("Error cargando datos: "+err.message);
      console.error("LOAD ERROR:",err);
    }
  }
  initSettings();
  renderAll();
}

/* ============================================================
   EVENT LISTENERS
   ============================================================ */
document.addEventListener("DOMContentLoaded",function(){
  document.querySelectorAll(".nav button[data-page]").forEach(function(b){b.addEventListener("click",function(){goPage(b.dataset.page)})});
  document.querySelectorAll(".area-btn").forEach(function(b){b.addEventListener("click",function(){switchArea(b.dataset.area)})});

  var el;
  if(el=document.getElementById("newSupplierBtn"))el.addEventListener("click",openNewSupplier);
  if(el=document.getElementById("saveSupplierBtn"))el.addEventListener("click",saveSupplier);
  if(el=document.getElementById("closeModalBtn"))el.addEventListener("click",function(){closeModal("supplierModal")});
  if(el=document.getElementById("cancelModalBtn"))el.addEventListener("click",function(){closeModal("supplierModal")});
  if(el=document.getElementById("saveContactBtn"))el.addEventListener("click",saveContact);
  if(el=document.getElementById("closeContactBtn"))el.addEventListener("click",function(){closeModal("contactModal")});
  if(el=document.getElementById("cancelContactBtn"))el.addEventListener("click",function(){closeModal("contactModal")});
  if(el=document.getElementById("saveProductBtn"))el.addEventListener("click",saveProduct);
  if(el=document.getElementById("closeProductBtn"))el.addEventListener("click",function(){closeModal("productModal")});
  if(el=document.getElementById("cancelProductBtn"))el.addEventListener("click",function(){closeModal("productModal")});
  if(el=document.getElementById("saveCertBtn"))el.addEventListener("click",saveCertification);
  if(el=document.getElementById("closeCertBtn"))el.addEventListener("click",function(){closeModal("certModal")});
  if(el=document.getElementById("cancelCertBtn"))el.addEventListener("click",function(){closeModal("certModal")});
  if(el=document.getElementById("saveTimelineBtn"))el.addEventListener("click",saveTimelineEvent);
  if(el=document.getElementById("closeTimelineBtn"))el.addEventListener("click",function(){closeModal("timelineModal")});
  if(el=document.getElementById("cancelTimelineBtn"))el.addEventListener("click",function(){closeModal("timelineModal")});

  if(el=document.getElementById("connectBtn"))el.addEventListener("click",async function(){
    var ok=await connectSupabase(true);
    if(ok){try{await loadAll();renderAll();initSettings()}catch(e){toast("Error: "+e.message)}}
  });
  if(el=document.getElementById("refreshBtn"))el.addEventListener("click",async function(){
    if(connected){try{await loadAll();renderAll();toast("Datos actualizados desde AstraDB.")}catch(e){toast("Error: "+e.message)}}else{boot()}
  });
  if(el=document.getElementById("exportBtn"))el.addEventListener("click",exportJSON);

  if(el=document.getElementById("supplierSearch"))el.addEventListener("input",renderSuppliers);
  if(el=document.getElementById("supplierStatusFilter"))el.addEventListener("change",renderSuppliers);
  if(el=document.getElementById("supplierRegionFilter"))el.addEventListener("change",renderSuppliers);
  if(el=document.getElementById("docSupplierFilter"))el.addEventListener("change",renderDocumentsPage);
  if(el=document.getElementById("uploadDocBtn"))el.addEventListener("click",function(){uploadDocument()});

  boot();
});