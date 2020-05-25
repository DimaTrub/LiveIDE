
    code = localStorage.getItem("code")
    var x = document.createElement("SCRIPT");
    var t = document.createTextNode(code);
    x.appendChild(t);
    document.head.appendChild(x); 
    var newScript = document.createElement("SCRIPT");
    newScript.src = "https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.0.0/p5.js";
    document.head.appendChild(newScript);






