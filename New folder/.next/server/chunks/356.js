"use strict";exports.id=356,exports.ids=[356],exports.modules={7425:(a,b,c)=>{c.d(b,{A:()=>e});var d=c(38301);let e=d.forwardRef(function({title:a,titleId:b,...c},e){return d.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:e,"aria-labelledby":b},c),a?d.createElement("title",{id:b},a):null,d.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"}))})},73918:(a,b,c)=>{c.d(b,{A:()=>e});var d=c(38301);let e=d.forwardRef(function({title:a,titleId:b,...c},e){return d.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:e,"aria-labelledby":b},c),a?d.createElement("title",{id:b},a):null,d.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"}))})},94356:(a,b,c)=>{c.d(b,{default:()=>p});var d=c(21124),e=c(38301),f=c(14101),g=c(46479),h=c(90088),i=c(73918),j=c(95964),k=c(7425),l=c(9614);let m=`
  .custom-select {
    accent-color: ${l.T.zB};
  }
  .custom-select option {
    background-color: white;
    color: black;
  }
  .custom-select option:hover {
    background-color: ${l.T.zB} !important;
    background: ${l.T.zB} !important;
    color: white !important;
  }
  .custom-select option:focus {
    background-color: ${l.T.zB} !important;
    background: ${l.T.zB} !important;
    color: white !important;
  }
  .custom-select option:checked {
    background-color: ${l.T.zB} !important;
    background: ${l.T.zB} !important;
    color: white !important;
  }
  .custom-select option[selected] {
    background-color: ${l.T.zB} !important;
    background: ${l.T.zB} !important;
    color: white !important;
  }
  
  /* Dark mode styles */
  .dark .custom-select option {
    background-color: #374151;
    color: white;
  }
  .dark .custom-select option:hover {
    background-color: ${l.T.zB} !important;
    background: ${l.T.zB} !important;
    color: white !important;
  }
`,n="4214a0ea-b594-435d-9abb-599c1f3a81ea",o="https://api.vapi.ai";function p(){let{isDark:a}=(0,f.D)(),{showSuccess:b,showError:c}=(0,g.d)(),[p,q]=(0,e.useState)(""),[r,s]=(0,e.useState)(!1),[t,u]=(0,e.useState)(""),[v,w]=(0,e.useState)(""),[x,y]=(0,e.useState)([]),[z,A]=(0,e.useState)(!0),[B,C]=(0,e.useState)(!1),D=async()=>{C(!0);try{console.log("\uD83D\uDD04 Starting VAPI sync process...");let a=await fetch(`${o}/assistant`,{method:"GET",headers:{Authorization:`Bearer ${n}`,"Content-Type":"application/json"}});if(!a.ok)throw Error(`Failed to fetch VAPI assistants: ${a.status}`);let c=await a.json();console.log("\uD83D\uDCE6 Fetched VAPI assistants:",c);let d=new Map;c.forEach(a=>{if(a.id){let b="";if(a.model?.messages&&Array.isArray(a.model.messages)){let c=a.model.messages.find(a=>"system"===a.role);c&&(b=c.content||"")}d.set(a.id,{firstMessage:a.firstMessage||"",systemPrompt:b})}}),console.log("\uD83D\uDDFA️ Assistant mapping:",Array.from(d.entries()));let e=x.map(a=>{if(a.agent_id&&d.has(a.agent_id)){let b=d.get(a.agent_id);console.log(`🔄 Updating user ${a.name} (${a.agent_id}):`,b);let c=b.systemPrompt;return{...a,prompt:c}}return a});try{let a=e.filter(a=>{let b=x.find(b=>b.id===a.id);return b&&b.prompt!==a.prompt});for(let b of(console.log("\uD83D\uDDC3️ Updating database with new prompts for users:",a.map(a=>({id:a.id,name:a.name}))),a)){console.log(`📝 Updating prompt for user ${b.name} (ID: ${b.id})`);let a=await fetch(`https://3758a6b3509d.ngrok-free.app/api/auth/users/${b.id}/prompt`,{method:"PUT",headers:{"Content-Type":"application/json","ngrok-skip-browser-warning":"true"},body:JSON.stringify({prompt:b.prompt})});a.ok?console.log(`✅ Successfully updated prompt for user ${b.name} in database`):console.warn(`Failed to update prompt for user ${b.id} in database:`,a.status)}}catch(a){console.warn("Failed to update database with new prompts:",a)}if(y(e),p){let a=e.find(a=>a.id.toString()===p);if(a){console.log("\uD83D\uDD04 Refreshing form with updated user data:",a);let b=`Hello, Thank you for calling ${a.name}. How can I help you today?`,c=a.prompt||"";if(a.agent_id&&d.has(a.agent_id)){let e=d.get(a.agent_id);b=e.firstMessage||b,c=e.systemPrompt||c}else if(a.prompt){let d=a.prompt?.match(/(?:Hello|Hi|Thank you for calling)[^.!?]*[.!?]/i);d&&(b=d[0].trim()),c=a.prompt}console.log("\uD83D\uDD04 Setting form state to:",{greetingMessage:b,systemPrompt:c}),u(b),w(c)}}console.log("✅ VAPI sync completed successfully"),b("Successfully synced with VAPI assistants"),h.vF.logSystemAction("VAPI_ASSISTANTS_SYNCED",`Successfully synced ${d.size} VAPI assistants with user database`,"MEDIUM")}catch(a){console.error("❌ Error syncing VAPI assistants:",a),c(`Failed to sync with VAPI: ${a instanceof Error?a.message:"Unknown error"}`),h.vF.logSystemAction("VAPI_SYNC_FAILED",`Failed to sync VAPI assistants: ${a}`,"HIGH")}finally{C(!1)}},E=async a=>{if(q(a),a){let b=x.find(b=>b.id.toString()===a);if(b){if(!b.agent_id){let a=`Hello, Thank you for calling ${b.name}. How can I help you today?`,c=`You are a friendly, fast restaurant phone attendant for ${b.name.toUpperCase()}. Goal: Ask for the customer's name, take accurate pickup or delivery orders and confirm timing--clearly, politely, and in as few words as possible.
Style:
-
warm, concise, professional. One to two sentences at a time.
Ask one question at a time. Do not interrupt the caller.
If unsure, ask a clarifying question; don't guess.
Core flow (follow in order):
1) Greet Intent: "Pickup or delivery today?"
2) Get name and callback number.
3) For delivery: get full address (street, apartment, city) and any gate/buzzer notes.
4) Take the order:
-
Item, size/variant, quantity, options (sauce/spice/temperature), extras, special instructions.
If an item is unavailable or unclear, offer close alternatives or best-sellers.
5) Ask about allergies or dietary needs. Offer safe options without medical advice.
6) Upsell gently (ONE quick option): sides, drinks, or desserts.
7) Read-back and confirm: items, quantities, options, subtotal if known, delivery fee/taxes, and total if available.
8) Quote timing: pickup-ready time or delivery estimate.
9) Payment:
-
Prefer pay at pickup/delivery or a secure link if available.
Do NOT collect full credit card numbers over the phone.`;u(a),w(c);return}console.log(`🔄 [Dropdown] Fetching assistant configuration from VAPI for user ${b.name} (Agent ID: ${b.agent_id})`);try{let a=await fetch(`${o}/assistant/${b.agent_id}`,{method:"GET",headers:{Authorization:`Bearer ${n}`,"Content-Type":"application/json"}});if(a.ok){let c=await a.json();console.log("\uD83D\uDCE6 [Dropdown] Fetched assistant data from VAPI:",JSON.stringify(c,null,2));let d=c.firstMessage||`Hello, Thank you for calling ${b.name}. How can I help you today?`,e="";if(c.model?.messages&&Array.isArray(c.model.messages)){let a=c.model.messages.find(a=>"system"===a.role);a&&a.content&&(e=a.content)}e||(e=`You are a friendly, fast restaurant phone attendant for ${b.name.toUpperCase()}. Goal: Ask for the customer's name, take accurate pickup or delivery orders and confirm timing--clearly, politely, and in as few words as possible.
Style:
-
warm, concise, professional. One to two sentences at a time.
Ask one question at a time. Do not interrupt the caller.
If unsure, ask a clarifying question; don't guess.
Core flow (follow in order):
1) Greet Intent: "Pickup or delivery today?"
2) Get name and callback number.
3) For delivery: get full address (street, apartment, city) and any gate/buzzer notes.
4) Take the order:
-
Item, size/variant, quantity, options (sauce/spice/temperature), extras, special instructions.
If an item is unavailable or unclear, offer close alternatives or best-sellers.
5) Ask about allergies or dietary needs. Offer safe options without medical advice.
6) Upsell gently (ONE quick option): sides, drinks, or dessents.
7) Read-back and confirm: items, quantities, options, subtotal if known, delivery fee/taxes, and total if available.
8) Quote timing: pickup-ready time or delivery estimate.
9) Payment:
-
Prefer pay at pickup/delivery or a secure link if available.
Do NOT collect full credit card numbers over the phone.`),console.log("✅ [Dropdown] Using VAPI data:"),console.log("   Starting Message:",d),console.log("   System Prompt:",e.substring(0,100)+"..."),u(d),w(e)}else{let c=await a.json().catch(()=>({error:"Unknown error"}));console.error("❌ [Dropdown] Failed to fetch assistant from VAPI:",a.status,c);let d=`Hello, Thank you for calling ${b.name}. How can I help you today?`,e=`You are a friendly, fast restaurant phone attendant for ${b.name.toUpperCase()}. Goal: Ask for the customer's name, take accurate pickup or delivery orders and confirm timing--clearly, politely, and in as few words as possible.
Style:
-
warm, concise, professional. One to two sentences at a time.
Ask one question at a time. Do not interrupt the caller.
If unsure, ask a clarifying question; don't guess.
Core flow (follow in order):
1) Greet Intent: "Pickup or delivery today?"
2) Get name and callback number.
3) For delivery: get full address (street, apartment, city) and any gate/buzzer notes.
4) Take the order:
-
Item, size/variant, quantity, options (sauce/spice/temperature), extras, special instructions.
If an item is unavailable or unclear, offer close alternatives or best-sellers.
5) Ask about allergies or dietary needs. Offer safe options without medical advice.
6) Upsell gently (ONE quick option): sides, drinks, or desserts.
7) Read-back and confirm: items, quantities, options, subtotal if known, delivery fee/taxes, and total if available.
8) Quote timing: pickup-ready time or delivery estimate.
9) Payment:
-
Prefer pay at pickup/delivery or a secure link if available.
Do NOT collect full credit card numbers over the phone.`;console.log("⚠️ [Dropdown] Using fallback defaults due to VAPI fetch failure"),u(d),w(e)}}catch(d){console.error("❌ [Dropdown] Error fetching assistant from VAPI:",d);let a=`Hello, Thank you for calling ${b.name}. How can I help you today?`,c=`You are a friendly, fast restaurant phone attendant for ${b.name.toUpperCase()}. Goal: Ask for the customer's name, take accurate pickup or delivery orders and confirm timing--clearly, politely, and in as few words as possible.
Style:
-
warm, concise, professional. One to two sentences at a time.
Ask one question at a time. Do not interrupt the caller.
If unsure, ask a clarifying question; don't guess.
Core flow (follow in order):
1) Greet Intent: "Pickup or delivery today?"
2) Get name and callback number.
3) For delivery: get full address (street, apartment, city) and any gate/buzzer notes.
4) Take the order:
-
Item, size/variant, quantity, options (sauce/spice/temperature), extras, special instructions.
If an item is unavailable or unclear, offer close alternatives or best-sellers.
5) Ask about allergies or dietary needs. Offer safe options without medical advice.
6) Upsell gently (ONE quick option): sides, drinks, or desserts.
7) Read-back and confirm: items, quantities, options, subtotal if known, delivery fee/taxes, and total if available.
8) Quote timing: pickup-ready time or delivery estimate.
9) Payment:
-
Prefer pay at pickup/delivery or a secure link if available.
Do NOT collect full credit card numbers over the phone.`;console.log("⚠️ [Dropdown] Using fallback defaults due to VAPI error"),u(a),w(c)}}}else u(""),w("")},F=async()=>{if(p){let a=x.find(a=>a.id.toString()===p);if(a){if(!a.agent_id)return void c(`No agent ID found for ${a.name}. Cannot update VAPI assistant.`);try{let d={firstMessage:t,backgroundSound:"office",model:{provider:"openai",model:"gpt-4o",toolIds:["351ff32f-5b41-4f96-a103-1d2b90b64574"],messages:[{content:v,role:"system"}]}};console.log("\uD83D\uDE80 Updating VAPI assistant:",a.agent_id),console.log("\uD83D\uDCDD Request body:",d);let e=await fetch(`${o}/assistant/${a.agent_id}`,{method:"PATCH",headers:{Authorization:`Bearer ${n}`,"Content-Type":"application/json"},body:JSON.stringify(d)});if(e.ok){let c=await e.json();console.log("✅ VAPI assistant updated successfully:",c),console.log("\uD83D\uDCCB BEFORE SYNC - Form State:",{greetingMessage:t,systemPrompt:v,selectedUser:p,userAgentId:a.agent_id}),await D(),console.log("\uD83D\uDCCB AFTER SYNC - Form State:",{greetingMessage:t,systemPrompt:v,selectedUser:p,userAgentId:a.agent_id});let d=x.find(a=>a.id.toString()===p);d&&console.log("\uD83D\uDD0D VERIFICATION - Updated User Data:",{userName:d.name,prompt:d.prompt,formSystemPrompt:v,doTheyMatch:d.prompt===v}),h.vF.logPromptChanged(a.email,a.name,{oldPrompt:a.prompt||void 0,newPrompt:v}),b(`Assistant configuration updated for ${a.name}`)}else{let b=await e.json().catch(()=>({error:"Unknown error"}));console.error("❌ Failed to update VAPI assistant:",e.status,b),h.vF.logSystemAction("ASSISTANT_CONFIGURATION_FAILED",`Failed to update VAPI assistant for: ${a.name} - ${JSON.stringify(b)}`,"HIGH"),c(`Failed to update VAPI assistant: ${b.error||b.message||"API request failed"}`);return}}catch(b){console.error("❌ Error updating VAPI assistant:",b),h.vF.logSystemAction("ASSISTANT_CONFIGURATION_ERROR",`Error updating VAPI assistant for: ${a.name} - ${b}`,"HIGH"),c(`Failed to connect to VAPI API: ${b instanceof Error?b.message:"Unknown error"}`);return}}}else b("Changes saved successfully");s(!1)};return(0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)("style",{dangerouslySetInnerHTML:{__html:m}}),(0,d.jsxs)("div",{className:"space-y-6",children:[(0,d.jsxs)("div",{className:"flex items-center justify-between",children:[(0,d.jsxs)("div",{children:[(0,d.jsx)("h1",{className:`text-2xl font-bold ${a?"text-white":"text-gray-900"}`,children:"Assistant Management"}),(0,d.jsx)("p",{className:`mt-2 text-sm ${a?"text-gray-400":"text-gray-600"}`,children:"Configure AI assistant prompts and settings for each restaurant"})]}),(0,d.jsxs)("button",{onClick:D,disabled:B||z,className:`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md border transition-colors ${B||z?"opacity-50 cursor-not-allowed":""}`,style:{color:a?l.T.Oh.Sh:l.T.Oh.eD,borderColor:a?l.T.Oh.l8:l.T.Oh.Sh},onMouseEnter:b=>{B||z||(b.currentTarget.style.backgroundColor=a?l.T.Oh.eD:l.T.Oh[50])},onMouseLeave:a=>{a.currentTarget.style.backgroundColor="transparent"},title:"Sync with VAPI assistants to get latest prompts",children:[(0,d.jsx)(i.A,{className:`h-4 w-4 mr-2 ${B?"animate-spin":""}`}),B?"Syncing...":"Sync VAPI"]})]}),z?(0,d.jsx)("div",{className:"flex items-center justify-center py-12",children:(0,d.jsxs)("div",{className:"text-center",children:[(0,d.jsx)("div",{className:"animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"}),(0,d.jsx)("p",{className:`text-lg ${a?"text-gray-300":"text-gray-600"}`,children:"Loading users..."})]})}):(0,d.jsxs)(d.Fragment,{children:[(0,d.jsxs)("div",{children:[(0,d.jsx)("div",{className:"mb-2",children:(0,d.jsx)("label",{className:"text-sm font-medium",style:{color:a?l.T.Oh.Sh:l.T.Oh.eD},children:"Select User"})}),(0,d.jsxs)("div",{className:"relative",children:[(0,d.jsxs)("select",{value:p,onChange:a=>E(a.target.value),className:`custom-select w-full px-3 py-2 border rounded-lg text-sm appearance-none cursor-pointer ${a?"bg-gray-800 border-gray-600 text-white":"bg-white border-gray-300 text-gray-900"} focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500`,children:[(0,d.jsx)("option",{value:"",children:"-- Select a user --"}),x.filter(a=>a.agent_id).map(a=>(0,d.jsxs)("option",{value:a.id.toString(),children:[a.name," (#",a.id,")"]},a.id))]}),(0,d.jsx)("div",{className:"absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none",children:(0,d.jsx)("svg",{className:"h-4 w-4 text-gray-400",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:(0,d.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M19 9l-7 7-7-7"})})})]})]}),!p&&(0,d.jsxs)("div",{className:"text-center py-12",children:[(0,d.jsx)(j.A,{className:`mx-auto h-12 w-12 ${a?"text-gray-600":"text-gray-400"}`,style:{color:a?l.T.Oh.l8:l.T.Oh.jC}}),(0,d.jsx)("h3",{className:"mt-2 text-sm font-medium",style:{color:a?l.T.Oh.Sh:l.T.Oh.uu},children:"Select a user to manage their VAPI configurations"}),(0,d.jsx)("p",{className:"mt-1 text-sm",style:{color:a?l.T.Oh.jC:l.T.Oh.C2},children:"Choose a user from the dropdown above to configure their assistant settings."})]}),p&&(0,d.jsxs)(d.Fragment,{children:[(0,d.jsxs)("div",{className:`${a?"bg-gray-800 border-gray-700":"bg-white border-gray-200"} rounded-lg border p-4 mb-6`,children:[(0,d.jsx)("h3",{className:`text-lg font-semibold mb-3 ${a?"text-white":"text-gray-900"}`,children:"User Information"}),(()=>{let b=x.find(a=>a.id.toString()===p);return b?(0,d.jsxs)("div",{className:"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",children:[(0,d.jsxs)("div",{children:[(0,d.jsx)("label",{className:`text-xs font-medium uppercase tracking-wide ${a?"text-gray-400":"text-gray-500"}`,children:"Restaurant Name"}),(0,d.jsx)("p",{className:`text-sm font-medium ${a?"text-white":"text-gray-900"}`,children:b.name})]}),(0,d.jsxs)("div",{children:[(0,d.jsx)("label",{className:`text-xs font-medium uppercase tracking-wide ${a?"text-gray-400":"text-gray-500"}`,children:"Email"}),(0,d.jsx)("p",{className:`text-sm ${a?"text-gray-300":"text-gray-600"}`,children:b.email})]}),(0,d.jsxs)("div",{children:[(0,d.jsx)("label",{className:`text-xs font-medium uppercase tracking-wide ${a?"text-gray-400":"text-gray-500"}`,children:"Agent ID"}),(0,d.jsx)("p",{className:`text-sm ${a?"text-gray-300":"text-gray-600"}`,children:b.agent_id?(0,d.jsx)("span",{className:"font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded",children:b.agent_id}):(0,d.jsx)("span",{className:"text-gray-400 italic",children:"No agent assigned"})})]}),(0,d.jsxs)("div",{children:[(0,d.jsx)("label",{className:`text-xs font-medium uppercase tracking-wide ${a?"text-gray-400":"text-gray-500"}`,children:"Location"}),(0,d.jsx)("p",{className:`text-sm ${a?"text-gray-300":"text-gray-600"}`,children:b.location||"Not specified"})]}),(0,d.jsxs)("div",{children:[(0,d.jsx)("label",{className:`text-xs font-medium uppercase tracking-wide ${a?"text-gray-400":"text-gray-500"}`,children:"Plan"}),(0,d.jsx)("p",{className:`text-sm ${a?"text-gray-300":"text-gray-600"}`,children:b.plan?(0,d.jsx)("span",{className:"capitalize font-medium",style:{color:l.T.zB},children:b.plan}):(0,d.jsx)("span",{className:"text-gray-400 italic",children:"Free"})})]}),(0,d.jsxs)("div",{children:[(0,d.jsx)("label",{className:`text-xs font-medium uppercase tracking-wide ${a?"text-gray-400":"text-gray-500"}`,children:"Status"}),(0,d.jsx)("p",{className:"text-sm",children:(0,d.jsx)("span",{className:`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${"active"===b.status.toLowerCase()?"bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300":"bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300"}`,children:b.status})})]})]}):null})()]}),(0,d.jsxs)("div",{className:`${a?"bg-gray-800 border-gray-700":"bg-white border-gray-200"} rounded-lg border p-4`,children:[(0,d.jsxs)("div",{className:"flex items-center justify-between mb-6",children:[(0,d.jsx)("h3",{className:`text-lg font-semibold ${a?"text-white":"text-gray-900"}`,children:"Assistant Configuration"}),(0,d.jsx)("div",{className:"flex items-center space-x-2",children:r?(0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)("button",{onClick:()=>{p?E(p):(u(""),w("")),s(!1)},className:"px-3 py-2 text-sm font-medium rounded-md border transition-colors",style:{color:a?l.T.Oh.Sh:l.T.Oh.eD,borderColor:a?l.T.Oh.l8:l.T.Oh.Sh},onMouseEnter:b=>{b.currentTarget.style.backgroundColor=a?l.T.Oh.eD:l.T.Oh[50]},onMouseLeave:a=>{a.currentTarget.style.backgroundColor="transparent"},children:"Cancel"}),(0,d.jsx)("button",{onClick:F,className:"px-3 py-2 text-sm font-medium text-white rounded-md transition-colors",style:{backgroundColor:l.T.zB},children:"Save Changes"})]}):(0,d.jsxs)("button",{onClick:()=>{p&&x.find(a=>a.id.toString()===p),s(!0)},className:"inline-flex items-center px-3 py-2 text-sm font-medium rounded-md border transition-colors",style:{color:a?l.T.Oh.Sh:l.T.Oh.eD,borderColor:a?l.T.Oh.l8:l.T.Oh.Sh},onMouseEnter:b=>{b.currentTarget.style.backgroundColor=a?l.T.Oh.eD:l.T.Oh[50]},onMouseLeave:a=>{a.currentTarget.style.backgroundColor="transparent"},children:[(0,d.jsx)(k.A,{className:"h-4 w-4 mr-2"}),"Edit"]})})]}),(0,d.jsxs)("div",{className:"mb-4",children:[(0,d.jsx)("div",{className:"mb-2",children:(0,d.jsx)("label",{className:"text-sm font-medium",style:{color:a?l.T.Oh.Sh:l.T.Oh.eD},children:"Starting Message"})}),r?(0,d.jsx)("input",{type:"text",value:t,onChange:a=>u(a.target.value),className:"w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20",style:{backgroundColor:a?l.T.Oh.eD:l.T.ON,borderColor:a?l.T.Oh.l8:l.T.Oh.Sh,color:a?l.T.ON:l.T.Oh.uu},onFocus:a=>{a.currentTarget.style.borderColor=l.T.zB},onBlur:b=>{b.currentTarget.style.borderColor=a?l.T.Oh.l8:l.T.Oh.Sh},placeholder:"Enter starting message"}):(0,d.jsx)("p",{className:"text-sm rounded-md p-3",style:{color:a?l.T.Oh.Sh:l.T.Oh.eD,backgroundColor:a?l.T.Oh.eD:l.T.Oh.Id},children:t})]}),(0,d.jsxs)("div",{children:[(0,d.jsx)("div",{className:"mb-2",children:(0,d.jsx)("label",{className:"text-sm font-medium",style:{color:a?l.T.Oh.Sh:l.T.Oh.eD},children:"System Prompt"})}),r?(0,d.jsx)("textarea",{rows:6,value:v,onChange:a=>w(a.target.value),className:"w-full px-3 py-2 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/20",style:{backgroundColor:a?l.T.Oh.eD:l.T.ON,borderColor:a?l.T.Oh.l8:l.T.Oh.Sh,color:a?l.T.ON:l.T.Oh.uu},onFocus:a=>{a.currentTarget.style.borderColor=l.T.zB},onBlur:b=>{b.currentTarget.style.borderColor=a?l.T.Oh.l8:l.T.Oh.Sh},placeholder:"Enter system prompt"}):(0,d.jsx)("p",{className:"text-sm rounded-md p-3 whitespace-pre-wrap",style:{color:a?l.T.Oh.Sh:l.T.Oh.eD,backgroundColor:a?l.T.Oh.eD:l.T.Oh.Id},children:v})]})]})]})]})]})]})}}};