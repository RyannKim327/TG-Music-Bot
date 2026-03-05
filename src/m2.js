const axios = require("axios");
const fs = require("fs");
const http = require("https");
const log = require("./../utils/console");

const editMessage = (api, res, msg) => {
  try {
    api.editMessageText(msg, {
      chat_id: res.chat.id,
      message_id: res.message_id,
    });
    return res;
  } catch (e) {
    api
      .sendMessage(res.chat.id, msg)
      .then(async (res_) => {
        api.deleteMessage(res.chat.id, res.message_id);
        return res_;
      })
      .catch((e) => {
        return res;
      });
  }
  return res;
};

module.exports = async (api, msg, search) => {
  if (!fs.existsSync(`${__dirname}/../temp/${msg.chat.id}`)) {
    fs.mkdirSync(`${__dirname}/../temp/${msg.chat.id}`);
  }
  let res = await api
    .sendMessage(
      msg.chat.id,
      `────────── ୨୧ ──────────\nPlease wait...\n────────── ୨୧ ──────────`,
    )
    .then(async (res) => {
      return res;
    })
    .catch((e) => {
      return { error: "Erorr Ngani" };
    });
  if (res === null) {
    res = editMessage(api, res, "Error");
    setTimeout(() => {
      api.deleteMessage(res.chat.id, res.message_id);
    }, 5000);
  }
  const data = await axios
    .get(`${process.env.API_BACKEND}/yt?videoID=${encodeURIComponent(search)}`)
    .then((r) => {
      return r.data;
    })
    .catch((err) => {
      return { error: "Error" };
    });
  if (data.error) {
    res = editMessage(api, res, `ERR [${search}]: An error occured`);
    setTimeout(() => {
      api.deleteMessage(res.chat.id, res.message_id);
    }, 5000);
    return;
  }
  res = editMessage(api, res, `INFO [${data.title}]: Music found`);

  const filename = `${__dirname}/../temp/${msg.chat.id}/${data.title
    .replace(/([\\\/]+)/gi, " ")
    .trim()
    .replace(/\s/gi, "_")}.mp3`;
  const file = fs.createWriteStream(filename);
  res = editMessage(
    api,
    res,
    `INFO [${data.title}]: The audio file is now processing...`,
  );
  http.get(data.url, async (r) => {
    r.pipe(file);
    file.on("finish", async () => {
      fs.stat(filename, (error, f) => {
        $_ = f.size;

        console.log($_);
        if ($_ >= 1000) {
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
          res = editMessage(api, res, `[ERR]: The file is corrupted`);
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
};
