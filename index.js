const tg = require("node-telegram-bot-api");
const fs = require("fs");

const music = require("./src/music");

const token = "7363842676:AAHMYrc-QqcBoIYa_1TTX8_YMuFpkqVW-2g";

const start = async () => {
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
        api
          .sendMessage(
            msg.chat.id,
            "Greetings, I am AmogusBot, your telegram bot music (based on youtube music). If you want to get started, kindly chat your music you want to look for.",
          )
          .then((r) => {
            setTimeout(() => {
              api.deleteMessage(r.chat.id, r.message_id);
              api.deleteMessage(msg.chat.id, msg.message_id);
              console.log(`LOG: ${JSON.stringify(r)}`);
            }, 60000);
          })
          .catch((e) => {});
      } else {
        if (match[1]) {
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
