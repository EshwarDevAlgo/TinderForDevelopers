const adminAuth = (req, res, next) => {
  console.log("Admin auth middleware called");
  const token = "xyz";
  const isAdminAuthorized = token === "xyz";
  if (!isAdminAuthorized) {
    res.status(401).json({ message: "Unauthorized request" });
  } else {
    next();
  }
};
const userAuth = (req, res, next) => {
  console.log("User auth middleware called");
  const token = "xyz";
  const isUserAuthorized = token === "xyz";
  if (!isUserAuthorized) {
    res.status(401).json({ message: "Unauthorized request" });
  } else {
    next();
  }
};


module.exports = { adminAuth, userAuth };