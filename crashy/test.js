var a = require("./crashy");

a.crashyInitHandler();

console.log("Hello world");

a.crashyTriggerSegfault();

console.log("This won't print");
