const express = require('express');
const app = express();
const port = 3000;

console.log("Hello World!");

app.get('/', (req, res) => {
  res.send('hello hello!');
});
app.get('/test', (req, res) => {
  res.send('Hello World!!!!!');
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});