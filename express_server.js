const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require('cookie-parser');
const { fileLoader } = require("ejs");
const bcrypt = require("bcryptjs");


app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const generateRandomString = () => {
  return ((Math.random() + 1) * 0x10000).toString(36).substring(6);
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
};

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

const loggedIn = (req) => {
  if (!req.cookies.user_id) {
    return false;
  }

  const emailCookie = req.cookies.user_id.email;
  const passwordCookie = req.cookies.user_id.password;

  if (!findUserByEmail(emailCookie)) {
    return false;
  }

  const userID = findUserByEmail(emailCookie);

  if (users[userID].password !== passwordCookie) {
    return false;
  }

  return true;
};

const urlsForUser = (id) => {
  const filteredURLS = {};
  for (const urlId in urlDatabase) {
    if (id === urlDatabase[urlId].userID) {
      filteredURLS[urlId] = urlDatabase[urlId];
    }
  } return filteredURLS;
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
  const userId = req.cookies["user_id"];
  if (!userId)
    return res.status(401).send("User not logged in");
  // filtering the URL based on user ID
  // console.log(user)
  const filteredUrlDatabase = urlsForUser(userId);
  console.log("checking", users.userId);
  
  const templateVars = { urls: filteredUrlDatabase, user: users[userId] };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (!req.cookies["user_id"]) {
    return res.redirect("/login");
  }
  const templateVars = { urls: urlDatabase, user: users[req.cookies["user_id"]] };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  // console.log(req.body); // Log the POST request body to the console
  if (!req.cookies["user_id"]) {
    return res.send("Sorry, only logged in users can have shorted URLs");
  }
  const randomName = generateRandomString();
  const newLongUrl = req.body.longURL;

  if (newLongUrl.slice(0, 8) === 'https://' || newLongUrl.slice(0, 7) === 'http://') {
    urlDatabase[randomName] = { longURL: newLongUrl, userID: req.cookies["user_id"] };  // check if contains http: already
  } else {
    urlDatabase[randomName] = { longURL: `https://${newLongUrl}`, userID: req.cookies["user_id"] };  // check if contains https: already
  }
  res.redirect(`/urls/${randomName}`);
  console.log(urlDatabase);
});


app.get("/urls/:id", (req, res) => {
  const id = req.params.id;
  const userId = req.cookies["user_id"];
  if (!userId) {
    return res.send("Please login to view this content.");
  }
  // need to chck filtered database
  const filteredUrlDatabase = urlsForUser(userId);
  console.log(filteredUrlDatabase);
  // const templateVars = { urls: filteredUrlDatabase, user: users.userId };

  if (filteredUrlDatabase[id] && req.cookies["user_id"] !== filteredUrlDatabase[id].userID) {
    return res.send("You do not own this ID, only owners can update URLS");
  }

  const longURL = filteredUrlDatabase[id].longURL;
  const templateVars = {
    id,
    longURL,
    urls: filteredUrlDatabase,
    user: users[req.cookies["user_id"]],
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
  const userId = req.cookies["user_id"];
  const deleteshortUrl = req.params.id;
  const filteredUrlDatabase = urlsForUser(userId);
  const doesExist = false; // the url does not belong to that obj 
  console.log(filteredUrlDatabase);
  if (!userId) {
    return res.status(400).send("User not found!");
  }
  if (!req.cookies.user_id) {
    return res.status(401).send("User is not logged in to TinyUrl");
  }
  // we want to check the deletedshort url exists in the list of filtered urls or not, owned by current user
  for (let shortUrl in filteredUrlDatabase) {
    if (shortUrl === deleteshortUrl) {
      doesExist = true; // if it does, then we change this to true
    }
  }
  if (doesExist === false) { // then send an error
    return res.status(402).send("Only Owners can delete URLs");
  }

  // if true then we can delete the url
  delete urlDatabase[shortUrl];
  res.redirect("/urls");
});


app.post("/urls/:id/edit", (req, res) => {
  const shortUrl = req.params.id;
  const newLongUrl = req.body.longUrl;
  if (!loggedIn(req)) {
    return res.status(400).send("Sorry you need to log in to edit");
  }

  if (newLongUrl.slice(0, 8) === 'https://' || newLongUrl.slice(0, 7) === 'http://') {
    urlDatabase[shortUrl] = { longURL: newLongUrl, userID: req.cookies["user_id"] };  // adds http: into input feild so http not manually required
  } else {
    urlDatabase[shortUrl] = { longURL: `https://${newLongUrl}`, userID: req.cookies["user_id"] };  // check if contains https: already
  }
  res.redirect('/urls');
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  let userId = findUserByEmail(email);
  emptyFields(req, res);
  if (!userId) {
    return res.status(400).send("User not found!");
  }
  console.log(users[userId].password)
  console.log(req.body.password)
  //comparing plain password to hash
  if (!bcrypt.compareSync(req.body.password, users[userId].password)) {

    return res.status(400).send("Incorrect password");
  }
  const cookieObj = {
    email,
    password,
    id: userId,
  };
  res.cookie("user_id", cookieObj);
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  const user = req.body.email;
  const templateVars = { user };

  if (loggedIn(req)) {
    return res.redirect('/urls');
  }

  res.render("urls_login", templateVars);
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/login');
});


app.get("/register", (req, res) => {
  const templateVars = { user: null };
  if (loggedIn(req)) {
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
  const foundUser = findUserByEmail(email);
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
    res.cookie('user_id', user_id);
    res.redirect('/urls');
  }
});
 


