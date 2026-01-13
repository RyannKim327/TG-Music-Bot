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

  await client.get("https://api-mpop-backend.onrender.com/set-cookie");

  const { data } = await client.post(
    "https://api-mpop-backend.onrender.com/feedback/submit",
    {
      application: "Amogus Bot [Music Bot]",
      message: content,
    },
  );
  if (data) {
    api.sendMessage(msg.chat.id, data.from).then((r) => {
      setTimeout(() => {
        api.deleteMessage(msg.chat.id, r.message_id);
      });
    });
  }
};
