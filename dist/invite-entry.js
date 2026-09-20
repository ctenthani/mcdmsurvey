(function(){
  const params=new URLSearchParams(location.hash.slice(1));
  const token=params.get("invite_token");
  if(token)location.replace(`/login.html${location.hash}`);
})();
