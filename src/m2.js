const axios = require("axios");
const fs = require("fs");
const http = require("https");
const log = require("./../utils/console");

const editMessage = (api, res, msg) => {
  api.editMessage(msg, {
    chat_id: res.chat.id,
    message_id: res.message_id,
  });
};

module.exports = async (api, msg, search) => {
  if (!fs.existsSync(`${__dirname}/../temp/${msg.chat.id}`)) {
    fs.mkdirSync(`${__dirname}/../temp/${msg.chat.id}`);
  }
  api
    .sendMessage(
      msg.chat.id,
      `────────── ୨୧ ──────────\nNow looking for ${search}.\nPlease wait ...\n────────── ୨୧ ──────────`,
    )
    .then(async (res) => {
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
        editMessage(api, res, `ERR [${search}]: An error occured`);
        setTimeout(() => {
          api.deleteMessage(res.chat.id, res.message_id);
        }, 5000);
      }
      editMessage(api, res, `INFO [${search}]: Music found`);
      let tries = 1;
      const junk = async () => {
        const music = await axios
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
        if (!music) {
          editMessage(
            api,
            res,
            `ERR [${data.title}]: Failed to retrieve the download url. The system will automatically retry [${tries}/10]`,
          );
          if (tries <= 10) {
            tries++;
            return junk();
          } else {
            editMessage(
              api,
              res,
              `ERR [${data.title}]: The retry exceeds its limit, kindly retry later.`,
            );
            setTimeout(() => {
              api.deleteMessage(res.chat.id, res.message_id);
            }, 2500);
            return;
          }
        }
        if (tries <= 10) {
          const filename = `${__dirname}/../temp/${msg.chat.id}/${data.title.replace(/\W/gi, " ").trim().replace(/\s/gi, "_")}.mp3`;
          const file = fs.createWriteStream(filename);
          editMessage(
            api,
            res,
            `INFO [${data.title}]: The audio file is now processing...`,
          );
          http.get(music.download_url, (r) => {
            r.pipe(file);
            file.on("finish", () => {
              api
                .sendAudio(res.chat.id, fs.createReadStream(filename), {}, {})
                .then((_) => {
                  if (fs.existsSync(filename)) {
                    setTimeout(() => {
                      fs.unlinkSync(filename, (e) => {});
                    }, 10000);
                  }
                  api.deleteMessage(res.chat.id, res.message_id);
                })
                .catch((e) => {});
            });
          });
        }
      };
      junk();
    })
    .catch((e) => {
      log("Music", e, "error");
    });
};
