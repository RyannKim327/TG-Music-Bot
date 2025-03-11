const axios = require("axios");
const fs = require("fs");
const http = require("https");
const log = require("./../utils/console");

const editMessage = (api, res, msg) => {
  api.editMessageText(msg, {
    chat_id: res.chat.id,
    message_id: res.message_id,
  });
};

module.exports = async (api, msg, search) => {
  if (!fs.existsSync(`${__dirname}/../temp/${msg.chat.id}`)) {
    fs.mkdirSync(`${__dirname}/../temp/${msg.chat.id}`);
  }
  const res = await api
    .sendMessage(
      msg.chat.id,
      `────────── ୨୧ ──────────\nNow looking for ${search}.\nPlease wait ...\n────────── ୨୧ ──────────`,
    )
    .then(async (res) => {
      return res;
    })
    .catch((e) => {
      return null;
    });
  if (res === null) {
    editMessage(api, res, "Error");
    setTimeout(() => {
      api.deleteMessage(res.chat.id, res.message_id);
    });
  }
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
    let music = await axios
      .get(
        `https://kaiz-ytmp4-downloader.vercel.app/ytdown-mp3?url=${encodeURIComponent(data.url)}&quality=mp3`,
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
        // music = await axios
        //   .get(
        //     `https://kaiz-ytmp4-downloader.vercel.app/ytmp3-v2?url=${encodeURI(data.url)}&quality=mp3`,
        //   )
        //   .then((res) => {
        //     return res.data;
        //   })
        //   .catch((error) => {
        //     console.error(error);
        //     return null;
        //   });
        junk();
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
      const filename = `${__dirname}/../temp/${msg.chat.id}/${data.title
        .replace(/([\W])/gi, " ")
        .trim()
        .replace(/\s/gi, "_")}.mp3`;
      const file = fs.createWriteStream(filename);
      editMessage(
        api,
        res,
        `INFO [${data.title}]: The audio file is now processing...\n${music.download_url}`,
      );
      http.get(music.download_url, (r) => {
        r.pipe(file);
        file.on("finish", () => {
          const _ = fs.stat(filename, (error, f) => {
            if (error) {
              return 0;
            }
            return f.size;
          });
          if (_ > 10000) {
            api
              .sendAudio(msg.chat.id, fs.createReadStream(filename), {}, {})
              .then((_) => {
                if (fs.existsSync(filename)) {
                  setTimeout(() => {
                    fs.unlinkSync(filename, (e) => {});
                  }, 10000);
                }
                api.deleteMessage(res.chat.id, res.message_id);
              })
              .catch((e) => {});
          } else {
            editMessage(api, res, `[ERR]: The file is corrupted`);
            if (fs.existsSync(filename)) {
              setTimeout(() => {
                fs.unlinkSync(filename, (e) => {});
              }, 100);
            }
            setTimeout(() => {
              api.deleteMessage(res.chat.id, res.message_id);
            }, 5000);
          }
        });
      });
    }
  };
  junk();
};
