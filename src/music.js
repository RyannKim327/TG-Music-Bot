const axios = require("axios");
const fs = require("fs");
const http = require("https");

module.exports = async (api, msg, search) => {
  const cache = JSON.parse(fs.readFileSync("x.json", "utf-8"));
  if (!fs.existsSync(`${__dirname}/../temp/${msg.chat.id}`)) {
    fs.mkdirSync(`${__dirname}/../temp/${msg.chat.id}`);
  }
  api
    .sendMessage(
      msg.chat.id,
      `Now looking for ${search}.\n────────── ୨୧ ──────────\nPlease wait ...`,
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
      .sendMessage(msg.chat.id, `ERR [${search}]: There's an error occured`)
      .then((r) => {
        setTimeout(() => {
          api.deleteMessage(r.chat.id, r.message_id);
        }, 2500);
      })
      .catch((e) => {});
  }

  api
    .sendMessage(msg.chat.id, `INFO [${data.title}]: Song Found`)
    .then((r) => {
      setTimeout(() => {
        api.deleteMessage(r.chat.id, r.message_id);
      }, 2500);
    })
    .catch((e) => {});

  cache[search] = msg;
  fs.writeFileSync("x.json", JSON.stringify(cache, null, 2), "utf-8");
  let tries = 1;
  const retry = async () => {
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
          `RETRY [${data.title}]: Failed to retrieve the download url. The system will automatically retry: [${tries}/10]`,
        )
        .then((r) => {
          setTimeout(() => {
            api.deleteMessage(r.chat.id, r.message_id);
          }, 2500);
          if (tries <= 10) {
            tries++;
            setTimeout(() => {
              retry();
            }, 1000);
          } else {
            api
              .sendMessage(
                msg.chat.id,
                `ERR [${data.title}]: The retry exceeds its limit, kindly retry later.`,
              )
              .then((r) => {
                setTimeout(() => {
                  api.deleteMessage(r.chat.id, r.message_id);
                }, 2500);
              });
          }
        })
        .catch((e) => {});
    }
    const filename = `${__dirname}/../temp/${msg.chat.id}/${data.title.replace(/\W/gi, " ").trim().replace(/\s/gi, "_")}.mp3`;
    const file = fs.createWriteStream(filename);

    const _cache = JSON.parse(fs.readFileSync("x.json", "utf-8"));
    api
      .sendMessage(
        msg.chat.id,
        `INFO [${data.title}]: The audio file is now processing...`,
      )
      .then((rx) => {
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
                      delete _cache[search];
                      fs.writeFileSync(
                        "x.json",
                        JSON.stringify(_cache, null, 2),
                        "utf-8",
                      );
                    }
                  }, 10000);
                }
                api.deleteMessage(rx.chat.id, rx.message_id);
              })
              .catch((error) => {
                api
                  .sendMessage(
                    msg.chat.id,
                    `ERR [${data.title}]: ${JSON.stringify(error, null, 2)}`,
                  )
                  .then((res) => {
                    setTimeout(() => {
                      api.deleteMessage(res.chat.id, res.message_id);
                    }, 2500);
                  });
                api.deleteMessage(rx.chat.id, rx.message_id);
              });
          });
        });
      })
      .catch((e) => {});
  };
  retry();
};
