const tc = require("tough-cookie");
const wrap = require("axios-cookiejar-support");
const axios = require("axios");

module.exports = async (api, msg, content) => {
  const jar = new tc.CookieJar();
  const client = wrap.wrapper(
    axios.create({
      jar,
      withCredentials: true,
    }),
  );

  await client.get(`${env.API_BACKEND}/set-cookie`);

  const { data } = await client.post(`${env.API_BACKEND}/feedback/submit`, {
    application: "Amogus Bot [Music Bot]",
    message: content,
    userId: msg.chat.id,
  });

  if (data) {
    api
      .sendMessage(
        msg.chat.id,
        "Thank you for your feedback. If ever you encounter some error, please let us know.",
      )
      .then((r) => {
        setTimeout(() => {
          api.deleteMessage(msg.chat.id, r.message_id);
        }, 5000);
      });
  }
};
