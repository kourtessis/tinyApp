const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require('cookie-parser');
const e = require("express");

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const generateRandomString = () => {
  return ((Math.random() + 1) * 0x10000).toString(36).substring(6);
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const findUserByEmail = (email) => {
  for (const user in users) {
    if (email === users[user].email) {
      return user;
    }
  }
  return null;
};

const emptyFields = (req, res) => {

  if (!req.body.email || !req.body.password) {
    //respond with an error
    res.status(400).send("400 Bad Request - ");
    return;
  }
}

const randomName = generateRandomString();
const users = {
  userRandomID: {
    id: "userRandomID",
    email: "a@a.com",
    password: "1234",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
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
  const user = req.cookies["user_id"];
  const templateVars = { urls: urlDatabase, user };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { urls: urlDatabase, user: users[req.cookies["user_id"]] };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  const randomName = generateRandomString();
  const newLongUrl = req.body.longURL;
  if (newLongUrl.slice(0, 8) === 'https://' || newLongUrl.slice(0, 7) === 'http://') {
    urlDatabase[randomName] = newLongUrl;  // check if contains http: already
  } else {
    urlDatabase[randomName] = `https://${newLongUrl}`;  // check if contains https: already
  }
  res.redirect(`/urls/${randomName}`);
  console.log(urlDatabase);
});

app.get("/urls/:id", (req, res) => { // redirect to summary ID page
  const id = req.params.id;
  const longURL = urlDatabase[id];
  const templateVars = { id, longURL, urls: urlDatabase, user: users[req.cookies["user_id"]] };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id];
  console.log(urlDatabase[id]);
  res.redirect(longURL);
});

app.post("/urls/:id/delete", (req, res) => {
  const shortUrl = req.params.id;
  delete urlDatabase[shortUrl];
  res.redirect(`/urls`);
});

app.post("/urls/:id/edit", (req, res) => {
  const shortUrl = req.params.id;
  const newLongUrl = req.body.longUrl;

  if (newLongUrl.slice(0, 8) === 'https://' || newLongUrl.slice(0, 7) === 'http://') {
    urlDatabase[shortUrl] = newLongUrl;  // adds http: into input feild so http not manually required
  } else {
    urlDatabase[shortUrl] = `https://${newLongUrl}`;  // check if contains https: already
  }
  res.redirect('/urls');
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  let userId = findUserByEmail(email); 
  emptyFields(req, res)
  // if client presses submit will now call emptyFields()
  // if (!email || !password) {
  //   //respond with an error
  //   res.status(400).send("400 Bad Request - ");
  // }
  if (!userId) {
    return res.status(400).send("User not found!")
  }
  if (password !== users[userId].password) {
    return res.status(400).send("Incorrect password")
  }

  const  cookieObj = {
    email,
    password,
    id: userId
  };
  console.log(cookieObj)
  res.cookie('user_id', cookieObj); 
  res.redirect('/urls');
});

app.get("/login", (req, res) => {
  const user = req.body.email;
  const templateVars = { user };
  res.render("urls_login", templateVars);
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/login');
});


app.get("/register", (req, res) => {
  const templateVars = { user: null };
  res.render("urls_register", templateVars);
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user_id = randomName;
  emptyFields(req, res);
  // if (!email || !password) {
  //   //respond with an error
  //   res.status(400).send("400 Bad Request - ");
  // }
  const foundUser = findUserByEmail(email);
  if (foundUser) {
    //respond with error email in use 
    res.status(400).send("400 Bad Request - email/username in use");
  } else {
    const newUser = {
      id: generateRandomString(),
      email: email,
      password: password
    };
    users[newUser.id] = newUser;
    // console.log(users)
    res.cookie('user_id', newUser);
    res.redirect('/urls');
  }
});

///why!