const fs = require("fs");
const { Innertube, UniversalCache, Utils, ClientType } = require("youtubei.js");

const logs = (_logs) => {
  if (false) {
    let current = fs.readFileSync("logs.txt", "utf8");
    const t = new Date();
    const time = `${t.getHours()}:${t.getMinutes()}`;
    current += `[${time}] ${_logs}\n`;
    fs.writeFileSync("logs.txt", current, "utf8");
  }
};

const _music = async (api, msg, search, n = 1, _title = "") => {
  process.env["NTBA_FIX_350"] = 1;
  api
    .sendMessage(
      msg.chat.id,
      `Trial search [${_title == "" ? search : _title}]: ${n}`,
    )
    .then((r) => {
      setTimeout(() => {
        api.deleteMessage(r.chat.id, r.message_id);
      }, 2500);
    })
    .catch((e) => {});

  if (n <= 1) {
    api
      .deleteMessage(msg.chat.id, msg.message_id)
      .then((r) => {
        console.log(`INFO: ${r}`);
        logs(`INFO: ${r}`);
      })
      .catch((e) => {
        logs(`ERR: ${e}`);
        setTimeout(() => {
          api.sendMessage(msg.chat.id, JSON.stringify(e));
        }, 2500);
      });
  }

  try {

    const yt = await Innertube.create({
      cache: new UniversalCache(false),
      generate_session_locally: false,
      cookie: fs.readFileSync("b.json", "utf-8"),
      client_type: ClientType.WEB_EMBEDDED,
      enable_session_cache: true,
      account_index: 0
    });

    if (
      (search.includes("http") ||
        search.includes("youtube.com") ||
        search.includes("youtu.be")) &&
      search.includes("&")
    ) {
      search = search.split("&")[0];
    }

    if (msg.link_preview_options) {
      search = msg.link_preview_options.url;
      if (
        (search.includes("http") ||
          search.includes("youtube.com") ||
          search.includes("youtu.be")) &&
        search.includes("&")
      ) {
        search = search.split("&")[0];
      }
    }

    const s = await yt.music.search(search, {
      type: "video",
      client: 'YTMUSIC'
    });

    if (!s) {
      return console.error(`ERR: Not found`);
    }

    const info = s.contents;
    let i = info[0];
    let j = 0;

    while (!i && j < info.length) {
      i = info[j];
      j++;
    }

    while (i.type != "MusicShelf") {
      j++;
      i = info[j];
    }

    const details = i.contents[0];

    api
      .sendMessage(msg.chat.id, `Music [FOUND]: ${details.title}`)
      .then((r) => {
        setTimeout(() => {
          api.deleteMessage(r.chat.id, r.message_id);
        }, 3000);
      })
      .catch((e) => {});

    const send_now = async (sender = 1) => {
      if (!details.id) {
        return console.error("Error");
      }
      const stream = await yt.download(`${details.id}`, {
        type: "audio",
        quality: "bestefficiency",
        format: "mp4",
        client: "YTMUSIC",
      });

      if (!stream) {
        return console.error("Error");
      }

      const name = `${__dirname}/../temp/${details.title.replace(/\W/gi, "_")} - ${details.authors[0].name.replace(/W/gi, "_")}.mp3`;
      const file = fs.createWriteStream(name);

      for await (const chunk of Utils.streamToIterable(stream)) {
        file.write(chunk);
      }

      api
        .sendMessage(msg.chat.id, `Found [INFO]: ${details.title}`)
        .then((r) => {
          setTimeout(() => {
            api.deleteMessage(r.chat.id, r.message_id);
          }, 5000);
        })
        .catch((e) => {});

      if (sender > 25) {
        api
          .sendMessage(
            msg.chat.id,
            "The bot exceed the limit, so that the system automatically terminates the process.",
          )
          .then((r) => {
            setTimeout(() => {
              api.deleteMessage(r.chat.id, r.message_id);
            }, 3000);
          })
          .catch((e) => {});
        if (fs.existsSync(name)) {
          fs.unlinkSync(name, (e) => {});
        }
        return;
      }
      api
        .sendMessage(msg.chat.id, `Audio [INFO]: ${sender}`)
        .then((r) => {
          setTimeout(() => {
            api.deleteMessage(r.chat.id, r.message_id);
          }, 1500);
          api
            .sendAudio(msg.chat.id, fs.createReadStream(name), {}, {})
            .then((r) => {
              logs(`INFO: ${JSON.stringify(r)}`);
              if (fs.existsSync(name)) {
                setTimeout(() => {
                  if (fs.existsSync(name)) {
                    fs.unlinkSync(name, (e) => {});
                  }
                }, 10000);
              }
            })
            .catch((error) => {
              if (error) {
                console.log(`ERR [Send Audio]: ${JSON.stringify(error)}`);
              }
              api
                .sendMessage(msg.chat.id, `ERR [Somewhere]: ${error.message}`)
                .then((r) => {
                  setTimeout(() => {
                    api.deleteMessage(r.chat.id, r.message_id);
                    if (error.message.includes("413 Request Entity Too Large"))
                      return;
                    send_now(sender + 1);
                  }, 2500);
                })
                .catch((e) => {});
              logs(`ERR: ${error}`);
            });
        })
        .catch((e) => {
          send_now(sender + 1);
        });
    };
    send_now();
  } catch (error) {
    logs(`ERR: ${error}`);
    api
      .sendMessage(msg.chat.id, `ERR: ${error}`)
      .then((r) => {
        setTimeout(() => {
          api.deleteMessage(r.chat.id, r.message_id);
        }, 5000);
      })
      .catch((e) => {
        console.error(`ERR: ${JSON.stringify(e)}`);
      });
  }
};

module.exports = _music;
