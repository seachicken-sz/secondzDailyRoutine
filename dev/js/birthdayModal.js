// Shared birthday modal. Created only for an active birthday.
window.createBirthdayModal = function(event,onClose) {
  const template=document.createElement("template");
  template.innerHTML="<!-- 誕生日限定モーダル -->\n  <div id=\"birthdayModal\" class=\"modal-overlay hidden\">\n    <div class=\"modal-content\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"birthdayModalTitle\">\n      <div class=\"modal-header\">\n        <h2 id=\"birthdayModalTitle\" class=\"modal-title\"></h2>\n        <button id=\"birthdayModalCloseButton\" class=\"modal-close-button\" type=\"button\" aria-label=\"閉じる\">×</button>\n      </div>\n      <div class=\"modal-body birthday-modal-body\">\n        <div class=\"birthday-greeting\">\n          <div class=\"birthday-greeting-decoration\" aria-hidden=\"true\"><span>✦</span><span>♡</span><span>✧</span><span>✦</span><span>♡</span><span>✧</span></div>\n          <div class=\"birthday-greeting-title\">Happy Birthday!!</div>\n          <div class=\"birthday-greeting-name\"></div>\n          <div class=\"birthday-greeting-date\"></div>\n        </div>\n        <div class=\"birthday-post-field\">\n          <label for=\"birthdayPostText\">お祝いメッセージ</label>\n          <textarea id=\"birthdayPostText\" rows=\"3\" ></textarea>\n        </div>\n        <fieldset class=\"birthday-tags\">\n          <legend>つけたいハッシュタグを選んでね</legend>\n          <div class=\"birthday-tag-list\"></div>\n        </fieldset>\n        <button id=\"birthdayPostButton\" class=\"primary-button\" type=\"button\"><i class=\"bi bi-twitter-x\" aria-hidden=\"true\"></i> Xでお祝いする</button>\n        <button id=\"birthdayModalCloseOnlyButton\" class=\"text-link-button\" type=\"button\">閉じる</button>\n      </div>\n    </div>\n  </div>";
  const modal=template.content.querySelector("#birthdayModal");
  document.body.appendChild(modal);
  const listeners=new AbortController();
    modal.querySelector("#birthdayModalTitle").textContent=event.modalTitle;
    modal.querySelector(".birthday-greeting-name").textContent=event.name;
    modal.querySelector(".birthday-greeting-date").textContent=event.dateText;
    modal.querySelector("#birthdayPostText").placeholder=event.placeholder;
    const tags=modal.querySelector(".birthday-tag-list");
    tags.replaceChildren();
    event.hashtags.forEach(tag=>{
      const label=document.createElement("label"),input=document.createElement("input"),span=document.createElement("span");
      label.className="birthday-tag-chip";input.type="checkbox";input.name="birthdayTag";input.value=tag;span.textContent="#"+tag;label.append(input,span);tags.appendChild(label);
    });
    const decoration=modal?.querySelector(".birthday-greeting-decoration");
    if (decoration) {
      decoration.replaceChildren();
      for (let i=0;i<65;i++) {
        const s=document.createElement("span"), b=i<25;
        let x=Math.random()*96;
        if(b) {
          // Smoothly favor the sides without excluding the center.
          while(Math.random() > .25+.75*Math.pow(Math.abs(x-48)/48,1.5)) x=Math.random()*96;
        }
        const center=1-Math.abs(x-48)/48;
        const size=b?(12+Math.random()*28)*(1-.4*center):6+Math.random()*13;
        s.className=b?"birthday-card-bokeh":"birthday-card-star";
        s.textContent=b?"":"✦";
        s.style.cssText="--cx:"+x+"%;--cy:"+Math.random()*94+"%;--cs:"+size+"px;--cd:"+(-Math.random()*4)+"s;--cc:"+["#ffffff","#fff0c6","#d4ebc5"][i%3]+";--ca:"+(b?1-.55*center:1);
        decoration.appendChild(s);
      }
      const ns="http://www.w3.org/2000/svg";
      const add=(tag,attrs,root)=>{const e=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));root.appendChild(e);return e;};
      const svg=add("svg",{viewBox:"0 0 360 44",class:"birthday-card-garland","aria-hidden":"true"},decoration);
      add("path",{d:"M0 3 Q90 29 180 4 Q270 29 360 3",fill:"none",stroke:"#c9b17a","stroke-width":".8"},svg);
      ["#ff727b","#bd91ff","#63cf88","#82dfff","#c8ed78","#ff9bc9","#ffffff"].forEach((color,i)=>{
        const x=27+i*51, u=(x%180)/180, y=(x<180?3:4)*(1-u)*(1-u)+58*u*(1-u)+(x<180?4:3)*u*u, end=23+i%2*12;
        const g=add("g",{class:"birthday-card-lamp"},svg);
        g.style.transformOrigin=x+"px "+y+"px";
        g.style.animationDelay=(-i*.37)+"s";
        add("path",{d:"M"+x+" "+y+"V"+end,stroke:"#c9b17a","stroke-width":".7"},g);
        const core=add("g",{class:"birthday-card-lamp-core"},g);
        core.style.animationDelay=(-i*.53)+"s";
        [13,9].forEach((r,j)=>add("circle",{cx:x,cy:end,r,fill:color,opacity:[.08,.15][j]},core));
        const points=Array.from({length:10},(_,j)=>{const a=j*Math.PI/5-Math.PI/2,r=j%2?3.5:8;return (x+Math.cos(a)*r)+","+(end+Math.sin(a)*r);});
        add("polygon",{points:points.join(" "),fill:color},core);
      });
    }
    const resetPostFields = () => {
      const field = document.getElementById("birthdayPostText");
      if (field) field.value = "";
      modal?.querySelectorAll('input[name="birthdayTag"]').forEach(el => { el.checked = false; });
    };
    resetPostFields();
    document.getElementById("birthdayModalCloseButton")?.addEventListener("click", onClose,{signal:listeners.signal});
    document.getElementById("birthdayModalCloseOnlyButton")?.addEventListener("click", onClose,{signal:listeners.signal});
    modal?.addEventListener("click", event => { if (event.target === modal) onClose(); },{signal:listeners.signal});
    document.getElementById("birthdayPostButton")?.addEventListener("click", () => {
      const message = document.getElementById("birthdayPostText").value.trim();
      const tags = Array.from(modal.querySelectorAll('input[name="birthdayTag"]:checked'), el => "#" + el.value);
      const postText = [message, tags.join(" ")].filter(Boolean).join("\n\n");
      if (!postText) { document.getElementById("birthdayPostText").focus(); return; }
      onClose();
      location.href = X_POST_URL + encodeURIComponent(postText);
    },{signal:listeners.signal});

  return {
    element:modal,
    reset:resetPostFields,
    show:()=>modal.classList.remove("hidden"),
    hide:()=>modal.classList.add("hidden"),
    destroy:()=>{listeners.abort();modal.remove();}
  };
};
