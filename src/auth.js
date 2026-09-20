import {acceptInvite,getUser,handleAuthCallback,login,logout} from "@netlify/identity";

const form=document.querySelector("#loginForm");
const inviteForm=document.querySelector("#inviteForm");
const account=document.querySelector("#accountPanel");
const status=document.querySelector("#authStatus");
const defaultNext=location.pathname.startsWith("/owner")?"/owner/":"/portal/";
const next=new URLSearchParams(location.search).get("next")||defaultNext;
let inviteToken=null;
const callbackKeys=["access_token","confirmation_token","recovery_token","invite_token","email_change_token"];

function hasAuthCallback(){
  const params=new URLSearchParams(location.hash.slice(1));
  return callbackKeys.some(key=>Boolean(params.get(key)));
}

function message(text,type="neutral"){status.textContent=text;status.className=`auth-status ${type}`;}
function destination(user){return user?.roles?.includes("owner")?"/owner/":"/portal/";}
function showUser(user){
  if(!user)return;
  form.hidden=true;inviteForm.hidden=true;account.hidden=false;
  document.querySelector("#accountEmail").textContent=user.email||"Signed-in user";
  document.querySelector("#accountRoles").textContent=(user.roles||[]).join(", ")||"No access role assigned";
  document.querySelector("#openPortal").href=next.startsWith("/")?next:destination(user);
}

async function initialise(){
  try{
    const callback=hasAuthCallback()?await handleAuthCallback():null;
    if(callback?.type==="invite"){
      inviteToken=callback.token;form.hidden=true;inviteForm.hidden=false;
      message("Invitation verified. Create a password to activate your account.","ok");return;
    }
    const user=callback?.user||await getUser();
    if(user){showUser(user);message("You are signed in.","ok");}
  }catch(error){message(error.message||"The sign-in link could not be processed.","error");}
}

form?.addEventListener("submit",async event=>{
  event.preventDefault();message("Signing in…");
  const data=new FormData(form);
  try{const user=await login(data.get("email"),data.get("password"));message("Signed in. Continuing…","ok");location.assign(next.startsWith("/")?next:destination(user));}
  catch(error){message(error.message||"Sign-in failed. Check the email address and password.","error");}
});

inviteForm?.addEventListener("submit",async event=>{
  event.preventDefault();const data=new FormData(inviteForm),password=data.get("new_password"),confirm=data.get("confirm_password");
  if(password!==confirm){message("The two passwords do not match.","error");return;}
  try{const user=await acceptInvite(inviteToken,password);message("Account activated. Continuing…","ok");location.assign(destination(user));}
  catch(error){message(error.message||"The invitation could not be accepted.","error");}
});

document.querySelector("#signOut")?.addEventListener("click",async()=>{await logout();location.assign("/login.html");});
initialise();
