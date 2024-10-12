const { Innertube, UniversalCache } = require("youtubei.js");
const music = require("./music");

const logs = (_logs) => {
  if (true) {
    let current = fs.readFileSync("logs.txt", "utf8");
    const t = new Date();
    const time = `${t.getHours()}:${t.getMinutes()}`;
    current += `[${time}] ${_logs}\n`;
    fs.writeFileSync("logs.txt", current, "utf8");
  }
};

module.exports = async (api, msg, search) => {
  try {
    const youtube = await Innertube.create({
      cache: new UniversalCache(false),
      generate_session_locally: true,
    });
    console.log("search " + search);
    const pl = await youtube.getPlaylist(search);
    logs(pl);
  } catch (e) {
    console.error(JSON.stringify(e));
  }
};
