const express = require("express");
const app = express();
const rootRouter = require("./routers/index.js");
const dotenv = require("dotenv");
dotenv.config();
const port = 3000;
app.use(express.json());
app.use("/", rootRouter);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
