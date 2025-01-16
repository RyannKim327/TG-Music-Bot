const axios = require("axios");
const fs = require("fs");
const http = require("https");

module.exports = async (api, msg, search) => {
  api.sendMessage(msg.chat.id, "Please wait for a moment...").then(r => {
    setTimeout(() => {
      api.deleteMessage(r.chat.id, r.message_id)
    }, 2500)
  }).catch(e => {})
  try{
    const { data } = await axios.get(
      `https://dlvc.vercel.app/yt-audio?search=${encodeURI(search)}`,
    );
    api
      .sendMessage(msg.chat.id, `Trial search [${search}]`)
      .then((r) => {
        setTimeout(() => {
          api.deleteMessage(r.chat.id, r.message_id);
        }, 2500);
      })
      .catch((e) => {});

    const filename = `${__dirname}/../temp/${data.title.replace(/\W/gi, "_")}.mp3`;
    const file = fs.createWriteStream(filename);
    http.get(data.downloadUrl, (res) => {
      res.pipe(file);
      file.on("finish", () => {
        api
          .sendAudio(msg.chat.id, fs.createReadStream(filename), {}, {})
          .then((r) => {
            // console.log(`INFO: ${JSON.stringify(r)}`);
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
  }catch(e){
    api.sendMessage(msg.chat.id, `Error [Music]: ${JSON.stringify(e, null, 2)}`).then(r => {
      setTimeout(() => {
        api.deleteMessage(msg.chat.id, msg.message_id)
      }, 2500)
    })
    console.error(`Error [Music]: ${e}`)
  }
};
