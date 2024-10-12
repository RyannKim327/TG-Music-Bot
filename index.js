const tg = require("node-telegram-bot-api");
const fs = require("fs");
require("dotenv").config();

const music = require("./src/music");
const playlist = require("./src/playlists");
const playlists = require("./src/playlists");

const token = process.env.TOKEN;

const start = async () => {
  if (!token) {
    return console.error(`TOKEN [ERR]: Token not found`);
  }

  console.log("+-----------------------------------------+");
  console.log("|      Welcome to Telegram Music Bot      |");
  console.log("|     Developed by Ryann Kim Sesgundo     |");
  console.log("+-----------------------------------------+");

  const directory = `${__dirname}/temp`;

  try {
    const api = new tg(token, {
      polling: true,
    });

    if (fs.existsSync(directory)) {
      fs.rm(directory, { recursive: true }, (e) => {});
    }

    setTimeout(() => {
      fs.mkdirSync(directory);
    }, 1000);

    api.onText(/([\w\W]+)/gi, (msg, match) => {
      if (match[0].startsWith("/start")) {
        console.log(`KIM: ${JSON.stringify(msg)}`);
        api.deleteMessage(msg.chat.id, msg.message_id);
        api
          .sendMessage(
            msg.chat.id,
            "Greetings, I am ඞ, your telegram bot music (based on youtube music). If you want to get started, kindly message back your music you want to look for its either title or link. If you want to grab a music easily from Youtube, you may click on share from youtube, look for telegram or telegram x and look for my profile.\n\nThis message will automatically deleted after 2 minutes.\n\n- Developed by MPOP Reverse II",
          )
          .then((r) => {
            setTimeout(() => {
              api.deleteMessage(r.chat.id, r.message_id);
              console.log(`LOG: ${JSON.stringify(r)}`);
            }, 120000);
          })
          .catch((e) => {});
      } else if (match[0].startsWith("/playlist")) {
        const s = match[1];
        console.log("pl");
        playlists(api, msg, s.substring("/playlist ".length));
      } else {
        if (match[1]) {
          console.log(`KIMMY: ${JSON.stringify(msg)}`);
          music(api, msg, match[0]);
        } else {
          api
            .sendMessage(msg.chat.id, "Invalid message, please try again")
            .then((r) => {
              setTimeout(() => {
                api.deleteMessage(r.chat.id, r.message_id);
              });
            })
            .catch((e) => {});
        }
      }
    });
  } catch (error) {
    console.error(`ERR: ${error}`);
  }
};

start();
