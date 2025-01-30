const axios = require("axios");
const fs = require("fs");
const http = require("https");

module.exports = async (api, msg, search) => {
  api
    .sendMessage(
      msg.chat.id,
      `Now looking for ${search}.\n───────────────────── ୨୧ ─────────────────────\nPlease wait ...`,
    )
    .then((r) => {
      setTimeout(() => {
        api.deleteMessage(r.chat.id, r.message_id);
      }, 5000);
    })
    .catch((e) => {});
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

  api
    .sendMessage(msg.chat.id, `Song found: [${data.title}]`)
    .then((r) => {
      setTimeout(() => {
        api.deleteMessage(r.chat.id, r.message_id);
      }, 2500);
    })
    .catch((e) => {});

  const newData = await axios
    .get(
      `https://kaiz-ytmp4-downloader.vercel.app/ytmp4?url=${encodeURI(data.url)}&quality=mp3`,
    )
    .then((res) => {
      return res.data;
    })
    .catch((error) => {
      console.error(error);
      return null;
    });
  if (!newData) {
    return api
      .sendMessage(
        msg.chat.id,
        `Failed to retrieve the download url. Please try again.`,
      )
      .then((r) => {
        setTimeout(() => {
          api.deleteMessage(r.chat.id, r.message_id);
        }, 2500);
      })
      .catch((e) => {});
  }
  const filename = `${__dirname}/../temp/${data.title.replace(/\W/gi, " ").trim().replace(/\s/gi, "_")}.mp3`;
  const file = fs.createWriteStream(filename);

  http.get(newData.download_url, (res) => {
    res.pipe(file);
    file.on("finish", () => {
      api
        .sendAudio(msg.chat.id, fs.createReadStream(filename), {}, {})
        .then((r) => {
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
