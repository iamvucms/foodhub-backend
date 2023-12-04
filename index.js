const express = require("express");
const app = express();
const rootRouter = require("./routers/index.js");
const port = 80;
app.use(express.json());
app.use("/", rootRouter);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
