const express = require("express");
const app = express();
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const User = require("./models/userModel");
const bcrypt = require("bcrypt");
const session = require("express-session");

app.use(
  session({
    secret: "any string is ok.", //用來認證該 Session 的資料。
    resave: false, //即使 Session 沒做變動，是否強制重新儲存進 Store。
    saveUninitialized: true, //是否強制將未初始化的 Session 儲存至 Store。（新產生的 Session）
  })
);

mongoose
  .connect("mongodb://127.0.0.1:27017/DB")
  .then(() => {
    console.log("mongoose connected.");
  })
  .catch((err) => {
    console.log("connecting failed, " + err);
  });

const saltRounds = 10;
const myPlaintextPassword = "s0//P4$$w0rD";
const someOtherPlaintextPassword = "not_bacon";

app.set("view engine", "ejs");

//裡面加入隨自字串的簽名key，建議使用128 bytes key
app.use(bodyParser.urlencoded({ extended: true }));

const requireLoginMiddleware = (req, res, next) => {
  console.log(req.session);
  if (req.session.isVerified != true) {
    // 如果還沒登入就引導至登入頁面
    res.redirect("login");
  } else {
    next();
  }
};

app.use("/secret", (req, res, next) => {
  console.log(req.session);
  if (req.session.isVerified != true) {
    // 如果還沒登入就引導至登入頁面
    res.redirect("login");
  } else {
    next();
  }
});

app.get("/secret", (req, res) => {
  res.render("secret");
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/signup", (req, res, next) => {
  let { username, password } = req.body;
  bcrypt.genSalt(saltRounds, (err, salt) => {
    if (err) next(err);
    bcrypt.hash(password, salt, (err, hash) => {
      if (err) next(err);
      let newUser = new User({ username, password: hash });
      try {
        newUser
          .save()
          .then(() => {
            res.send(`${username} successfuflly saved.`);
          })
          .catch((e) => {
            res.send(e);
          });
      } catch (e) {
        res.send(e);
      }
    });
  });
});

app.post("/login", async (req, res, next) => {
  let { username, password } = req.body;
  try {
    let foundUser = await User.findOne({ username: username });
    if (foundUser) {
      bcrypt.compare(password, foundUser.password, (err, result) => {
        if (err) next(err);
        if (result === true) {
          req.session.isVerified = true;
          res.redirect("secret");
        } else {
          res.send("Username or password not correct.");
        }
      });
    } else {
      res.send("Username or password not correct.");
    }
  } catch (e) {
    next(e);
  }
});

app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).send("Something is wrong.");
});

app.listen(3000, () => {
  console.log("Server running on port 3000.");
});
