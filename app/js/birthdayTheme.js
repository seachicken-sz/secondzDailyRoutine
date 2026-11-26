// Birthday-only palettes.
(function(){
  const themes={
  "green": [
    "#4d9b50",
    "#75b96a",
    "#a8d595",
    "#d4ebc5",
    "12,25,17",
    "#52704a",
    "#344a38",
    "#263b2d",
    "#183525",
    "#81aa76",
    "#e0efda",
    "#36583a",
    "#51834d"
  ],
  "red": [
    "#b94851",
    "#dc6b72",
    "#eea0a5",
    "#f9d9db",
    "35,12,17",
    "#85434b",
    "#48232b",
    "#48232b",
    "#401923",
    "#ce8188",
    "#f9e0e2",
    "#81353e",
    "#ad4651"
  ],
  "purple": [
    "#8055b1",
    "#a78acb",
    "#c9b4e6",
    "#e9def8",
    "25,14,38",
    "#70558d",
    "#342644",
    "#342644",
    "#30203f",
    "#ab90c7",
    "#eee4f8",
    "#61417f",
    "#8055b1"
  ],
  "sky": [
    "#439ac0",
    "#82cde3",
    "#afe3f2",
    "#d9f3fa",
    "10,25,37",
    "#42788e",
    "#20394b",
    "#20394b",
    "#163447",
    "#75b5ce",
    "#dff3fa",
    "#28617a",
    "#3784a5"
  ],
  "lime": [
    "#8ca93c",
    "#b7d86c",
    "#d2e99b",
    "#eaf4cb",
    "23,30,10",
    "#657b3b",
    "#303e20",
    "#303e20",
    "#293817",
    "#a4b96a",
    "#edf4d9",
    "#526722",
    "#789333"
  ],
  "pink": [
    "#c45f91",
    "#e89bbd",
    "#f2bed5",
    "#fbe2ed",
    "35,13,28",
    "#8c526f",
    "#44263a",
    "#44263a",
    "#431d34",
    "#d18bab",
    "#fbe3ee",
    "#8b4165",
    "#b85b88"
  ],
  "white": [
    "#ffffff",
    "#f5f5e9",
    "#dce9e7",
    "#a9c5c7",
    "25,39,44",
    "#7d9296",
    "#303c43",
    "#303c43",
    "#25363b",
    "#a9c5c7",
    "#e8f0ef",
    "#40575b",
    "#68888b"
  ]
};
  const keys=["particle1","particle2","particle3","light","darkRgb","cardGlow","cardStart","cardEnd","shadow","accent","selectedBg","selectedText","focus"];
  window.getBirthdayTheme=function(name){
    const values=Object.prototype.hasOwnProperty.call(themes,name)?themes[name]:themes.green;
    const t=Object.fromEntries(keys.map((key,i)=>[key,values[i]]));
    t.palette=[t.particle1,t.particle2,t.particle3,t.light,"#e5c675","#fff0c6","#ffffff","#efd28b","#fffaf0"];
    t.lightColors=["#ffffff","#fff0c6",name==="white"?"#dce9e7":t.light];
    return t;
  };
  window.applyBirthdayTheme=function(element,t){
    keys.forEach(key=>element.style.setProperty("--birthday-"+key.replace(/[A-Z]/g,c=>"-"+c.toLowerCase()),t[key]));
    element.style.setProperty("--birthday-accent-rgb",t.accent.slice(1).match(/../g).map(v=>parseInt(v,16)).join(","));
  };
})();
