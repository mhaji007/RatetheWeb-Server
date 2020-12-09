const express = require('express');

const app = express();

app.get("/api/register", (req, res) => {
  res.json({
    data: "RatetheWeb register endpoint"
  })
} )

const port = process.env.PORT || 8000
app.listen(port, () => console.log(`Server is running on port ${port}`));

