const axios = require("axios");
const fs = require("fs");
const http = require("https");

module.exports = async (api, msg, search) => {
  api
    .sendMessage(msg.chat.id, "Please wait for a moment...")
    .then((r) => {
      setTimeout(() => {
        api.deleteMessage(r.chat.id, r.message_id);
      }, 2500);
    })
    .catch((e) => {});
  try {
    let q = "?q=";
    const data = await axios
      .get(
        `https://kaiz-apis.gleeze.com/api/ytsearch${q}${encodeURIComponent(search)}`,
      )
      .then((r) => {
        return r.data.items[0];
      })
      .catch((err) => {
        return null;
      });

    api
      .sendMessage(msg.chat.id, `Trial search [${search}]`)
      .then((r) => {
        setTimeout(() => {
          api.deleteMessage(r.chat.id, r.message_id);
        }, 2500);
      })
      .catch((e) => {});

    if (!data) {
      return api
        .sendMessage(msg.chat.id, `There's an error occured`)
        .then((r) => {
          setTimeout(() => {
            api.deleteMessage(r.chat.id, r.message_id);
          }, 2500);
        })
        .catch((e) => {});
    }
    const newData = await axios
      .get(
        `https://kaiz-ytmp4-downloader.vercel.app/ytmp4?url=${encodeURIComponent(data.url)}&quality=mp3`,
      )
      .then((res) => {
        return res.data;
      })
      .catch((error) => {
        return null;
      });
    if (!data) {
      return api
        .sendMessage(msg.chat.id, `There's an error occured`)
        .then((r) => {
          setTimeout(() => {
            api.deleteMessage(r.chat.id, r.message_id);
          }, 2500);
        })
        .catch((e) => {});
    }
    const filename = `${__dirname}/../temp/${data.title.replace(/\W/gi, " ").trim().replace(/ /, "_")}.mp3`;
    const file = fs.createWriteStream(filename);

    http.get(newData.download_url, (res) => {
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
  } catch (e) {
    api
      .sendMessage(msg.chat.id, `Error [Music]: ${JSON.stringify(e, null, 2)}`)
      .then((r) => {
        setTimeout(() => {
          api.deleteMessage(r.chat.id, r.message_id);
        }, 5000);
      });
    console.error(`Error [Music]: ${e}`);
  }
};
