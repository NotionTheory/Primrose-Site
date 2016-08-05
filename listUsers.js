var db = require("./server/data/users"),
  fs = require("fs");

function escape(s){
  return "\"" + s.replace(/\\"/g, "&QUOTEDQUOTE;")
    .replace(/(?:"|&QUOTEDQUOTE;)/g, "\\\"") + "\"";
}

db.search().then((users) => {
  fs.writeFileSync("../PrimroseUsers.csv",
    "userName, email, created, lastLogin\n" + users
      .filter((u) => u.email)
      .map((u) => [
        escape(u.userName),
        escape(u.email),
        new Date(u.Timestamp).toLocaleDateString(),
        new Date(u.lastLogin).toLocaleDateString()
      ]).join("\n"));
});