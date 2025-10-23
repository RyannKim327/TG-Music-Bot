const axios = require("axios");
const fs = require("fs");
const https = require("https");
const log = require("./../utils/console");

const editMessage = async (api, res, msg) => {
  try {
    await api.editMessageText(msg, {
      chat_id: res.chat.id,
      message_id: res.message_id,
    });
    return res;
  } catch {
    try {
      const newRes = await api.sendMessage(res.chat.id, msg);
      await api.deleteMessage(res.chat.id, res.message_id);
      return newRes;
    } catch {
      return res;
    }
  }
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = async (api, msg, search) => {
  if (search.startsWith("/music")) {
    search = search.substring("/music").trim();
  }
  const tempDir = `${__dirname}/../temp/${msg.chat.id}`;
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  let res;
  try {
    res = await api.sendMessage(
      msg.chat.id,
      `────────── ୨୧ ──────────\nNow looking for ${search}.\nPlease wait ...\n────────── ୨୧ ──────────`,
    );
  } catch {
    return { error: "Error sending initial message" };
  }

  // Fetch video metadata
  let data;
  try {
    const response = await axios.get(
      `https://api.ccprojectsapis-jonell.gleeze.com/api/ytsearch?title=${encodeURIComponent(search)}`,
    );
    data = response.data[0];
  } catch {
    await editMessage(api, res, `ERR [${search}]: An error occurred`);
    setTimeout(() => api.deleteMessage(res.chat.id, res.message_id), 5000);
    return;
  }

  // if (data.error) {
  //   await editMessage(api, res, `ERR [${search}]: An error occurred`);
  //   setTimeout(() => api.deleteMessage(res.chat.id, res.message_id), 5000);
  //   return;
  // }

  await editMessage(api, res, `INFO [${data.title}]: Music found`);

  let tries = 0;
  const maxRetries = 10;
  const filename = `${tempDir}/${data.title
    .replace(/[\\/]+/g, " ")
    .trim()
    .replace(/\s+/g, "_")}.mp3`;

  const downloadMusic = async () => {
    if (tries >= maxRetries) {
      await editMessage(
        api,
        res,
        `ERR [${data.title}]: Retry limit exceeded. Please try again later.`,
      );
      setTimeout(() => api.deleteMessage(res.chat.id, res.message_id), 5000);
      return;
    }

    tries++;
    await editMessage(
      api,
      res,
      `INFO [${data.title}]: Attempt ${tries} to retrieve music info...`,
    );

    let music;
    try {
      const response = await axios.get(
        // `https://kaiz-apis.gleeze.com/api/ytdl?url=${encodeURIComponent("https://youtube.com/watch?v=" + data.videoId)}&apikey=${process.env.KAIZAPI}`,
        `https://api.ccprojectsapis-jonell.gleeze.com/api/audiomp3?url=${encodeURIComponent("https://youtube.com/watch?v=" + data.videoId)}`,
      );
      music = response.data;
    } catch (e) {
      log("Search", e);
      await delay(5000);
      return downloadMusic();
    }

    if (music.error) {
      await editMessage(
        api,
        res,
        `ERR [${data.title}]: Failed to retrieve the download URL. Retrying [${tries}/${maxRetries}]...`,
      );
      await delay(5000);
      return downloadMusic();
    }

    if (fs.existsSync(filename)) {
      try {
        fs.unlinkSync(filename);
      } catch (e) {
        log("File Deletion", `Error deleting existing file: ${e.message}`);
      }
    }

    await editMessage(
      api,
      res,
      `INFO [${data.title}]: Processing audio file...`,
    );

    return new Promise((resolve) => {
      const file = fs.createWriteStream(filename);
      https
        .get(music.downloadUrl, (response) => {
          response.pipe(file);
          file.on("finish", async () => {
            file.close();

            fs.stat(filename, async (err, stats) => {
              if (err || stats.size < 1000) {
                await editMessage(
                  api,
                  res,
                  `[ERR]: The file is corrupted or too small.`,
                );
                if (fs.existsSync(filename)) {
                  fs.unlinkSync(filename);
                }
                setTimeout(
                  () => api.deleteMessage(res.chat.id, res.message_id),
                  5000,
                );
                return resolve();
              }

              try {
                await api.sendAudio(
                  msg.chat.id,
                  fs.createReadStream(filename),
                  {},
                  {},
                );
                if (fs.existsSync(filename)) {
                  setTimeout(() => fs.unlinkSync(filename), 10000);
                }
                await api.deleteMessage(res.chat.id, res.message_id);
                resolve();
              } catch {
                await editMessage(api, res, `[ERR]: Failed to send audio.`);
                resolve();
              }
            });
          });
        })
        .on("error", async (e) => {
          log("Catch function", e);
          await editMessage(api, res, `[ERR]: Download failed, retrying...`);
          await delay(5000);
          resolve(downloadMusic());
        });
    });
  };

  downloadMusic();
};
