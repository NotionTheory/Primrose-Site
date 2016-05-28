var idSpec = location.search.match(/id=(\w+)/),
meetingID = idSpec && idSpec[1] || "public",
env = new Primrose.BrowserEnvironment( "Meeting:" + meetingID, {
  skyTexture: "bg.jpg",
  groundTexture: "deck.png",
  fullScreenIcon: "monitor.obj",
  VRIcon: "cardboard.obj",
  font: "helvetiker_regular.typeface.js"
});

console.log(env);

env.addEventListener( "ready", function (){

});

env.addEventListener( "gazecomplete", function(evt){
  
});

env.addEventListener( "pointerend", function(evt){

});

env.addEventListener( "update", function (dt){

});