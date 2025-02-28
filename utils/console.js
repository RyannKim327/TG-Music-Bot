module.exports = (from, msg, status = "i") => {
  let color = 36;
  status = status[0].toLowerCase();
  switch (status) {
    case "w":
      color = 33;
      status = "WARN";
      break;
    case "e":
      color = 31;
      status = "ERROR";
      break;
    case "s":
      color = 32;
      status = "SUCCESS";
      break;
    default:
      color = 36;
      status = "INFO";
  }
  if (typeof msg === "object") {
    msg = JSON.stringify(msg, null, 2);
  }
  console.log(
    `\x1b[${color}m${status} [${from
      .replace(/\W/gi, " ")
      .trim()
      .toUpperCase()}]:\t\x1b[37m${msg}`,
  );
};
// log = (from, message, type) => {
//   if(typeof message === "object"){
//     message = JSON.stringify(message, null, 2)
//   }
//   let color =
//   switch(type.toLowerCase()[0]){
//
//   }
//   console.log(`\x1b[32mLOG [${from}]:\x1b[37m ${message}`)
// }
