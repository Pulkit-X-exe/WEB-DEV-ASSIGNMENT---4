const EventEmitter = require("events");

const eventEmitter = new EventEmitter();

eventEmitter.on("userSignup", (name) => {
  console.log("New user registered: " + name);
});

eventEmitter.on("noteCreated", (title) => {
  console.log("New note created: " + title);
});

module.exports = eventEmitter;
