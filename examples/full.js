const adsbConnect = require("../src/index");

const subject = adsbConnect()
  .retryWhen(errors => {
    console.log("Reconnecting...");
    return errors.delay(1000);
  })
  .share();

const subscription = subject.subscribe(
  updates => console.log("Parsed", updates.length, "items"),
  error => console.log("Error", error),
  () => console.log("Complete")
);
