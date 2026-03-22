const mongoose = require("mongoose");

console.log("hello");
const connectDB = async () => {
  await mongoose.connect(
    "mongodb+srv://user1:user1pass@tinderfordevelopers.57beob5.mongodb.net/TinderForDevelopers",
  );
};

module.exports = connectDB;




