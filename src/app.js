const express = require("express");
const { adminAuth, userAuth } = require("./middlewares/auth.js");
const connectDB = require("./config/database.js");

const User = require("./models/user.js");

const app = express();
const port = 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/signup", async (req, res) => {
  console.log(req.body);
  const user = new User(req.body);

  try {
    await user.save();
    res.send("User added successfully");
  } catch (error) {
    console.error("Error saving user:", error);
    res.status(400).send("Error saving user");
  }
});

app.get("/user", async (req, res) => {
  const emailId = req.body.email;
  const users = await User.findOne({ email: emailId });
  if (!users) {
    return res.status(404).send("User not found");
  }
  console.log("Email found");
  res.send(users);
});

app.get("/feed", async (req, res) => {
  try {
    console.log("Fetching users for feed");
    const users = await User.find({});
    res.send(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).send("Error fetching users");
  }
});

app.delete("/user", async (req, res) => {
  const userId = req.body.userId;
  try {
    const result = await User.findByIdAndDelete(userId);
    if (!result) {
      return res.status(404).send("User not found");
    }
    console.log("User deleted successfully");
    res.send("User deleted successfully");
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).send("Error deleting user");
  }
});

app.patch("/user/:userId", async (req, res) => {
  const userId = req.params?.userId;
  const data = req.body;
  console.log("Patch called");
  try {
    const ALLOWED_UPDATES = ["photoUrl", "about", "skills", "gender", "age"];
    const isUpdateAllowed = Object.keys(data).every((update) =>
      ALLOWED_UPDATES.includes(update),
    );
    if (!isUpdateAllowed) {
      return res.status(400).send("Invalid updates");
    }
    const result = await User.findByIdAndUpdate(userId, data, {
      returnDocument: "after",
      runValidators: true,
    });
    console.log("User updated successfully");
    res.send(result);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).send("Error updating user");
  }
});

connectDB()
  .then(() => {
    console.log("Database connection established");
    app.listen(port, () => {
      console.log(`Example app listening at http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Database connection error:", error);
  });
