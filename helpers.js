const generateRandomString = () => {
  return ((Math.random() + 1) * 0x10000).toString(36).substring(6);

};

const findUserByEmail = (email, users) => {
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

const loggedIn = (req, users) => {
  if (!req.session.user_id) {
    return false;
  }

  const emailCookie = req.session.user_id.email;
  const passwordCookie = req.session.user_id.password;

  if (!findUserByEmail(emailCookie, users)) {
    return false;
  }

  const userID = findUserByEmail(emailCookie, users);

  if (users[userID].password !== passwordCookie) {
    return false;
  }

  return true;
};

const urlsForUser = (id, urlDatabase) => {
  const filteredURLS = {};
  for (const urlId in urlDatabase) {
    if (id === urlDatabase[urlId].userID) {
      filteredURLS[urlId] = urlDatabase[urlId];
    }
  } return filteredURLS;
};

module.exports = {
  generateRandomString,
  findUserByEmail,
  emptyFields,
  loggedIn,
  urlsForUser,
};