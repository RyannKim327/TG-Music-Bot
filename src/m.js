const axios = require("axios");
const fs = require("fs");
const http = require("https");

module.exports = async (api, msg, search) => {
  const { data } = await axios.get(
    `https://kaiz-apis.gleeze.com/api/music?q=${encodeURIComponent(search)}`,
  );
  api
    .sendMessage(msg.chat.id, `Trial search [${search}]`)
    .then((r) => {
      setTimeout(() => {
        api.deleteMessage(r.chat.id, r.message_id);
      }, 2500);
    })
    .catch((e) => {});

  const filename = `${__dirname}/../temp/${data.title}.mp3`;
  const file = fs.createWriteStream(filename);
  http.get(data.mp3Link, (res) => {
    res.pipe(file);
    file.on("finish", () => {
      api
        .sendAudio(msg.chat.id, fs.createReadStream(filename), {}, {})
        .then((r) => {
          console.log(`INFO: ${JSON.stringify(r)}`);
          if (fs.existsSync(filename)) {
            setTimeout(() => {
              if (fs.existsSync(filename)) {
                fs.unlinkSync(filename, (e) => {});
              }
            }, 10000);
          }
        })
        .catch((error) => {});
    });
  });
};
