const tg = require("node-telegram-bot-api");
const fs = require("fs");
const express = require("express");
require("dotenv").config();

const music = require("./src/m2");
const fb = require("./src/fbmusic");

const c = require("./utils/console");

const token = process.env.TOKEN;
const url = "https://tg-music-bot-svnp.onrender.com";

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Currently working now");
});

const start = async () => {
  const cache = JSON.parse(fs.readFileSync("x.json", "utf-8"));
  if (!token) {
    return console.error(`TOKEN [ERR]: Token not found`);
  }

  c(
    "Starter",
    `
        ╭―――――――――――――――――――――――――――――――――――――――――╮
        │                                          │
        │      Welcome to Telegram Music Bot       │
        │     Developed by Ryann Kim Sesgundo      │
        │                                          │
        ╰―――――――――――――――――――――――――――――――――――――――――╯`,
  );

  const directory = `${__dirname}/temp`;

  try {
    const api = new tg(token);

    api.setWebHook(`${url}/bot${token}`);

    app.post(`/bot${token}`, (req, res) => {
      api.processUpdate(req.body);
      res.sendStatus(200);
    });

    app.listen(process.env.PORT || 3000, () => {
      c("Server Initiator", "Server started.");
      c("Server Initiator", "Developed under MPOP Reverse II");
    });

    if (fs.existsSync(directory)) {
      fs.rm(directory, { recursive: true }, (e) => {});
    }

    setTimeout(() => {
      fs.mkdirSync(directory);
    }, 1000);

    setTimeout(() => {
      if (Object.keys(cache).length > 0) {
        for (let i in cache) {
          music(api, cache[i], i);
        }
      }
    }, 1500);

    c("Server Engine", "Server is now restarted...");

    api.onText(/([\w\W]+)/gi, (msg, match) => {
      if (match[0].startsWith("/start")) {
        api.deleteMessage(msg.chat.id, msg.message_id);
        api
          .sendMessage(
            msg.chat.id,
            "Greetings, I am ඞ, your telegram bot music (based on youtube music). If you want to get started, kindly message back your music you want to look for its either title or link. If you want to grab a music easily from Youtube, you may click on share from youtube, look for telegram or telegram x and look for my profile.\n\nThis message will automatically deleted after 2 minutes.\n\n- Developed by MPOP Reverse II",
          )
          .then((r) => {
            setTimeout(() => {
              api.deleteMessage(r.chat.id, r.message_id);
            }, 120000);
          })
          .catch((e) => {});
      } else if (match[0].startsWith("/delete")) {
        if (msg.reply_to_message) {
          api.deleteMessage(
            msg.reply_to_message.chat.id,
            msg.reply_to_message.message_id,
          );
          api.deleteMessage(msg.chat.id, msg.message_id);
        }
      } else if (match[0].startsWith("/fbmusic ")) {
        const s = match[1];
        fb(api, msg, s.substring("/fbmusic ".length));
      } else if (match[0].startsWith("/clear")) {
        if (fs.existsSync(`${directory}/${msg.chat.id}`)) {
          fs.rm(`${directory}/${msg.chat.id}`, { recursive: true }, (e) => {});
        }
        api
          .sendMessage(msg.chat.id, "Done")
          .then((r) => {
            setTimeout(() => {
              api.deleteMessage(r.chat.id, r.message_id);
              api.deleteMessage(msg.chat.id, msg.message_id);
            }, 1500);
          })
          .catch((e) => {});
      } else {
        if (match[1]) {
          music(api, msg, match[0]);
          setTimeout(() => {
            api.deleteMessage(msg.chat.id, msg.message_id);
          }, 1000);
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
