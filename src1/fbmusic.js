const axios = require("axios");
const fs = require("fs");
const http = require("https");

module.exports = async (api, msg, search) => {
  console.log("EPbi");
  const { data } = await axios.post("https://avd.vercel.app/convert", {
    url: encodeURI(search),
  });
  let result = data.medias[0];
  for (let i = 0; i < data.medias.length; i++) {
    const d = data.medias[i];
    if (d) {
      if (d.audioAvailable && !d.videoAvailable) {
        result = d;
        break;
      }
    }
  }
  const name = `${__dirname}/../temp/APT Multiverse Extended.mp3`;
  const file = fs.createWriteStream(name);

  console.log("Epbi");

  http.get(result.url, (res) => {
    res.pipe(file);
    file.on("finish", () => {
      api
        .sendAudio(msg.chat.id, fs.createReadStream(name), {}, {})
        .then((r) => {
          console.log(`INFO: ${JSON.stringify(r)}`);
          if (fs.existsSync(name)) {
            setTimeout(() => {
              if (fs.existsSync(name)) {
                fs.unlinkSync(name, (e) => {});
              }
            }, 10000);
          }
        })
        .catch((error) => {});
    });
  });
};
