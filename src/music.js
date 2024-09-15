const fs = require("fs");
const { Innertube, UniversalCache, Utils } = require("youtubei.js");

const logs = (_logs) => {
  let current = fs.readFileSync("logs.txt", "utf8");
  const t = new Date();
  const time = `${t.getHours()}:${t.getMinutes()}`;
  current += `[${time}] ${_logs}\n`;
  fs.writeFileSync("logs.txt", current, "utf8");
};

module.exports = async (api, msg, search) => {
  try {
    const yt = await Innertube.create({
      cache: new UniversalCache(false),
      generate_session_locally: true,
    });

    const s = await yt.music.search(search, {
      type: "video",
    });

    const info = await s.contents;
    let i = info[0];
    let j = 0;

    while (i.type != "MusicShelf") {
      j++;
      i = info[j];
    }

    const details = i.contents[0];

    console.log(`Found [INFO]: ${details.id}`);

    const stream = await yt.download(`${details.id}`, {
      type: "audio",
      quality: "bestefficiency",
      format: "mp4",
      client: "YTMUSIC",
    });

    const name = `${__dirname}/../temp/${details.title.replace(/([\s\W]+)/gi, "_")}_${details.authors[0].name.replace(/([\s\W]+)/gi, "_")}.mp3`;
    const file = fs.createWriteStream(name);

    for await (const chunk of Utils.streamToIterable(stream)) {
      file.write(chunk);
    }

    api
      .deleteMessage(msg.chat.id, msg.message_id)
      .then((r) => {
        console.log(`INFO: ${r}`);
        logs(`INFO: ${r}`);
      })
      .catch((e) => {
        logs(`ERR: ${e}`);
        api.sendMessage(msg.chat.id, JSON.stringify(e));
      });

    api
      .sendMessage(msg.chat.id, `Found [INFO]: ${details.title}`)
      .then((r) => {
        setTimeout(() => {
          api.deleteMessage(r.chat.id, r.message_id);
        }, 5000);
      })
      .catch((e) => {});

    api
      .sendAudio(msg.chat.id, fs.createReadStream(name), {}, {})
      .then((r) => {
        console.log(`INFO: ${JSON.stringify(r)}`);
        logs(`INFO: ${JSON.stringify(r)}`);
        if (fs.existsSync(name)) {
          setTimeout(() => {
            if (fs.existsSync(name)) {
              fs.unlinkSync(name, (e) => {});
            }
          }, 2500);
        }
      })
      .catch((error) => {
        if (fs.existsSync(name)) {
          setTimeout(() => {
            fs.unlinkSync(name, (e) => {});
          }, 2500);
        }
        api
          .sendMessage(msg.chat.id, `ERR: ${error}`)
          .then((r) => {
            setTimeout(() => {
              api.deleteMessage(r.chat.id, r.message_id);
            }, 5000);
          })
          .catch((e) => {});
        logs(`ERR: ${error}`);
      });

    setTimeout(() => {
      if (fs.existsSync(name)) {
        fs.unlinkSync(name, (e) => {});
      }
    }, 60000);
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
    // await api.deleteMessage(msg.chat.id, msg.message_id);
  }
};
