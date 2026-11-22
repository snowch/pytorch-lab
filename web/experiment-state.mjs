// Atomic restart snapshots are per tab; existing lesson keys remain unchanged.
const key='pytorch-lab:reading-snapshot';let composing=false,lock,timer;
export function saveReadingState(){
 if(composing||document.readyState!=='complete'||!window.pytorchApp||window.pytorchApp.busy())throw Error('Finish typing and wait for the current run or lesson to finish loading.');
 const snapshot=window.pytorchApp.snapshot();const encoded=JSON.stringify({url:location.pathname+location.search,scroll:[scrollX,scrollY],snapshot,details:[...document.querySelectorAll('main details')].map((el,i)=>[i,el.open])});
 sessionStorage.setItem(key,encoded);if(sessionStorage.getItem(key)!==encoded)throw Error('This window could not save its work. Allow browser storage or export your code first.');
}
export function restoreReadingState(){
 let saved;try{saved=JSON.parse(sessionStorage.getItem(key));}catch{return;}
 if(saved?.url!==location.pathname+location.search)return;
 window.pytorchApp.restore(saved.snapshot);const nodes=[...document.querySelectorAll('main details')];for(const[i,open]of saved.details||[])if(nodes[i])nodes[i].open=open;
 requestAnimationFrame(()=>scrollTo(...saved.scroll));sessionStorage.removeItem(key);
}
function unlock(){clearTimeout(timer);lock=null;document.querySelector('.course-layout').inert=false;document.querySelector('.site-header').inert=false;}
document.addEventListener('compositionstart',()=>composing=true);document.addEventListener('compositionend',()=>composing=false);
navigator.serviceWorker?.addEventListener('message',({data,ports})=>{
 if(data?.type==='PREPARE_RESTART')try{if(lock)throw Error('This tab is already restarting.');saveReadingState();lock=data.token;document.querySelector('.course-layout').inert=true;document.querySelector('.site-header').inert=true;timer=setTimeout(unlock,12000);ports[0].postMessage({ready:true});}catch(error){ports[0].postMessage({ready:false,error:error.message});}
 if(data?.type==='ABORT_RESTART'&&data.token===lock){unlock();sessionStorage.removeItem(key);}
 if(data?.type==='COMMIT_RESTART'&&data.token===lock)location.reload();
});
