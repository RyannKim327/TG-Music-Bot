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
      return { error: "Erorr Ngani" };
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
  if (data.error) {
    editMessage(api, res, `ERR [${search}]: An error occured`);
    setTimeout(() => {
      api.deleteMessage(res.chat.id, res.message_id);
    }, 5000);
    return;
  }
  editMessage(api, res, `INFO [${data.title}]: Music found`);
  let tries = 1;
  const junk = async () => {
    setTimeout(() => {
      editMessage(api, res, `INFO [${data.title}]: Gathering information`);
    }, 1000);
    let music = await axios
      .get(
        `https://kaiz-apis.gleeze.com/api/ytmp3-v2?url=${encodeURI(data.url)}`,
      )
      .then((res) => {
        return res.data;
      })
      .catch((error) => {
        console.error(error);
        throw new Error(error);
        // return null;
      });
    try {
      if (music.error) {
        editMessage(
          api,
          res,
          `ERR [${data.title}]: Failed to retrieve the download url. The system will automatically retry [${tries}/10]`,
        );
        if (tries <= 10) {
          tries++;
          setTimeout(() => {
            junk();
          }, 1500);
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
        editMessage(
          api,
          res,
          `ERR [${data.title}]: Failed to retrieve the download url. The system will automatically retry [${tries}/10]`,
        );
        if (tries <= 10) {
          tries++;
          setTimeout(() => {
            junk();
          }, 1500);
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
          .replace(/([\\\/]+)/gi, " ")
          .trim()
          .replace(/\s/gi, "_")}.mp3`;
        if (fs.existsSync(filename)) {
          editMessage(
            api,
            res,
            `INFO [${data.title}]: The file is currently existing. Kindly message '/clear' without any quotation mark and retry.\n\nThis message will automatically deleted after 5 seconds`,
          );
          setTimeout(() => {
            api.deleteMessage(res.chat.id, res, message_id);
            return;
          }, 5000);
        } else {
          const file = fs.createWriteStream(filename);
          editMessage(
            api,
            res,
            `INFO [${data.title}]: The audio file is now processing...`,
          );
          http.get(music.download_url, async (r) => {
            r.pipe(file);
            file.on("finish", async () => {
              fs.stat(filename, (error, f) => {
                $_ = f.size;

                console.log($_);
                if ($_ >= 1000) {
                  api
                    .sendAudio(
                      msg.chat.id,
                      fs.createReadStream(filename),
                      {},
                      {},
                    )
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
          });
        }
      }
    } catch (err) {
      editMessage(
        api,
        res,
        `ERR [${data.title}]: Failed to retrieve the download url. The system will automatically retry [${tries}/10]`,
      );
      if (tries <= 10) {
        tries++;
        setTimeout(() => {
          junk();
        }, 1500);
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
      editMessage(
        api,
        res,
        `ERR [${data.title}]: Failed to retrieve the download url. The system will automatically retry [${tries}/10]`,
      );
      if (tries <= 10) {
        tries++;
        setTimeout(() => {
          junk();
        }, 1500);
      } else {
        editMessage(
          api,
          res,
          `ERR [${data.title}]: The retry exceeds its limit, kindly retry later.`,
        );
        setTimeout(() => {
          api.deleteMessage(res.chat.id, res.message_id);
        }, 2500);
        // return;
      }
    }
  };
  junk();
};
