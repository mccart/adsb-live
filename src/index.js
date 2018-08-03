const net = require("net")
  const oboe = require("oboe")
const Rx = require("rxjs/Rx")

const adsbConnect = ({
  host = "pub-vrs.adsbexchange.com",
  port = 32015
} = {}) => {
  return new Rx.Observable(observer => {
    const socket = new net.Socket()
    socket.on("error", err => observer.error(err))
    socket.on("close", () => observer.error("Socket closed unexpectedly"))
    socket.connect({ host, port })
    oboe(socket)
      .on("fail", () => observer.error("Parse error"))
      .on("node", {
        "!": data => observer.next(data.acList)
      })
    return () => socket.destroy()
  })
}

const subject = adsbConnect()
  .retryWhen(errors => {
    console.log("Reconnecting...")
    return errors.delay(1000)
  })
  .share()

const subscription = subject.subscribe(
  updates => console.log("Parsed", updates.length, "items"),
  error => console.log("Error", error),
  () => console.log("Complete")
)

console.log("Subscribed")
setTimeout(() => subscription.unsubscribe(), 10000)
