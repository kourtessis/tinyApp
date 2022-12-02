const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieSession = require('cookie-session');
const { fileLoader } = require("ejs");
const bcrypt = require("bcryptjs");

const {
  generateRandomString,
  findUserByEmail,
  emptyFields,
  loggedIn,
  urlsForUser,
} = require("./helpers");

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
// app.use(cookieParser());

app.use(cookieSession({
  name: 'session',
  keys: ["cats", "persimmons", "mango", "toblerone"],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

const randomName = generateRandomString();
const users = {
  userRandomID: {
    id: "userRandomID",
    email: "a@a.com",
    password: "1234",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "b@b.com",
    password: "12345",
  },
};

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "userRandomID",
  },
};


app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });

// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");

app.get("/urls", (req, res) => {
  const userId = req.session["user_id"];
  if (!userId)
    return res.status(401).send("User not logged in");
  // filtering the URL based on user ID
  // console.log(user)
  const filteredUrlDatabase = urlsForUser(userId, urlDatabase);
  console.log("checking", users.userId);


  const templateVars = { urls: filteredUrlDatabase, user: users[userId] };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {

  if (!req.session["user_id"]) {
    return res.redirect("/login");
  }
  const templateVars = { urls: urlDatabase, user: users[req.session["user_id"]] };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  // console.log(req.body); // Log the POST request body to the console
  if (!req.session["user_id"]) {
    return res.send("Sorry, only logged in users can have shorted URLs");
  }
  const randomName = generateRandomString();
  const newLongUrl = req.body.longURL;

  if (newLongUrl.slice(0, 8) === 'https://' || newLongUrl.slice(0, 7) === 'http://') {
    urlDatabase[randomName] = { longURL: newLongUrl, userID: req.session["user_id"] };  // check if contains http: already
  } else {
    urlDatabase[randomName] = { longURL: `https://${newLongUrl}`, userID: req.session["user_id"] };  // check if contains https: already
  }
  res.redirect(`/urls/${randomName}`);
  console.log(urlDatabase);
});


app.get("/urls/:id", (req, res) => {
  const id = req.params.id;
  const userId = req.session["user_id"];
  if (!userId) {
    return res.send("Please login to view this content.");
  }
  // need to chck filtered database
  const filteredUrlDatabase = urlsForUser(userId, urlDatabase);
  console.log(filteredUrlDatabase);
  // const templateVars = { urls: filteredUrlDatabase, user: users.userId };

  if (filteredUrlDatabase[id] && req.session["user_id"] !== filteredUrlDatabase[id].userID) {
    return res.send("You do not own this ID, only owners can update URLS");
  }

  const longURL = filteredUrlDatabase[id].longURL;
  const templateVars = {
    id,
    longURL,
    urls: filteredUrlDatabase,
    user: users[req.session["user_id"]],
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  if (!urlDatabase[id].longURL) {
    return res.send("Short URL doesn't exist!");
  };
  const longURL = urlDatabase[id].longURL;
  res.redirect(longURL);
});

app.post("/urls/:id/delete", (req, res) => {   // redirect to  summary id page
  const userId = req.session["user_id"];
  const databaseObject = urlDatabase[req.params.id];
  const deleteshortUrl = req.params.id;
  const filteredUrlDatabase = urlsForUser(userId, urlDatabase);
  const doesExist = false; // the url does not belong to that obj 
  console.log(filteredUrlDatabase);
  if (!databaseObject) {
    return res.status(400).send("User not found!");
  }
  if (userId !== databaseObject.userID) {
    return res.status(401).send("User is not logged in to TinyUrl");
  }
  // if true then we can delete the url
  delete urlDatabase[deleteshortUrl];
  res.redirect("/urls");
});


app.post("/urls/:id/edit", (req, res) => {
  const shortUrl = req.params.id;
  const newLongUrl = req.body.longUrl;
  const userId = req.session["user_id"];
  if (!userId) {
    return res.status(400).send("Sorry you need to log in to edit");
  }
  urlDatabase[shortUrl] = { longURL: newLongUrl, userID: req.session["user_id"] };

  // if (newLongUrl.slice(0, 8) === 'https://' || newLongUrl.slice(0, 7) === 'http://') {
  //   urlDatabase[shortUrl] = { longURL: newLongUrl, userID: req.cookies["user_id"] };  // adds http: into input feild so http not manually required
  // } else {
  //   urlDatabase[shortUrl] = { longURL: `https://${newLongUrl}`, userID: req.cookies["user_id"] };  // check if contains https: already
  // }
  res.redirect('/urls');
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  let userId = findUserByEmail(email, users);
  emptyFields(req, res);
  if (!userId) {
    return res.status(400).send("User not found!");
  }
  console.log(users[userId].password);
  console.log(req.body.password);
  //comparing plain password to hash
  if (!bcrypt.compareSync(req.body.password, users[userId].password)) {

    return res.status(400).send("Incorrect password");
  }
  // const cookieObj = {
  //   email,
  //   password,
  //   id: userId,
  // };
  req.session["user_id"] = userId;
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  const user = req.body.email;
  const templateVars = { user };

  if (loggedIn(req, users)) {
    return res.redirect('/urls');
  }

  res.render("urls_login", templateVars);
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/login');
});


app.get("/register", (req, res) => {
  const templateVars = { user: null };
  if (loggedIn(req, users)) {
    return res.redirect('/urls');
  }

  res.render("urls_register", templateVars);

});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  const user_id = generateRandomString();
  emptyFields(req, res);
  // if (!email || !password) {
  //   //respond with an error 
  //   res.status(400).send("400 Bad Request");
  // }
  const foundUser = findUserByEmail(email, users);
  if (foundUser) {
    //respond with error email in use 
    res.status(400).send("400 User Already in Database");
  } else {
    const newUser = {
      id: user_id,
      email: email,
      password: hashedPassword
    };
    users[newUser.id] = newUser;
    // console.log(users)
    req.session['user_id'] = user_id;
    res.redirect('/urls');
  }
});
