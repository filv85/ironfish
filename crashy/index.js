const native = require("./crashy");

module.exports.crashyInitHandler = native.crashyInitHandler;
module.exports.crashyTriggerSegfault = native.crashyTriggerSegfault;
module.exports.crashyHello = () => {
  console.log("HELLO FROM CRASHY!");
};
