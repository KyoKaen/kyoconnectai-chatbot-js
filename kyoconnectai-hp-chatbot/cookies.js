// cookies.js
const Cookies = {
  setCookie: function(name, value, days = 90) {
    const d = new Date();
    d.setTime(d.getTime() + days * 86400000);
    const expires = "expires=" + d.toUTCString();
    document.cookie = `${name}=${value};${expires};path=/;Secure;SameSite=Strict`;
  },

  getCookie(name) {
    const cname = name + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for(let c of ca) {
      c = c.trim();
      if (c.indexOf(cname) === 0) return c.substring(cname.length, c.length);
    }
    return "";
  },

  ensureUserId() {
    let userId = this.getCookie("kyoconnectai_chatbot_user_id");
    if (!userId) {
      userId = crypto.randomUUID();
      this.setCookie("kyoconnectai_chatbot_user_id", userId, 180); // 180 days expiry
    }
    return userId;
  }
};
