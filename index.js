require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongo = require('mongodb');
const mongoose = require('mongoose');
let bodyParser = require('body-parser');
const dns = require('dns');

mongoose.connect(process.env.MONGO_URI,  { useNewUrlParser: true, useUnifiedTopology: true });

// Basic Configuration
const port = process.env.PORT || 3000;

const URLSchema = new mongoose.Schema({
  original_url: {type: String, required: true, unique: true},
  short_url: {type: String, required: true, unique: true}
});

let URLModel = mongoose.model("url", URLSchema);

app.use(bodyParser.urlencoded({ extended: false }));

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.get('/api/shorturl/:short_url', (req, res) => {
  let short_url = req.params.short_url;
  URLModel.findOne({short_url: short_url}).then((foundURL) => {
    console.log(foundURL);
    if (foundURL) {
      let original_url = foundURL.original_url;
      res.redirect(original_url)
    } else {
      res.json({ message: "The short url does not exist!" })
    }
  })
})

//POST a URL to /api/shorturl
app.post("/api/shorturl", (req, res) => {
  let url = req.body.url;
  console.log("url:", url);
  try {
    urlObj = new URL(url);
    console.log("urlObj:", urlObj);
    dns.lookup(urlObj.hostname, (err, address, family) => {
      console.log("Address:", address)
      if (!address) {
        res.json({ error: 'invalid url' })
      }
      else {
        let original_url = urlObj.href;
        let short_url = 1;
        URLModel.find({}).sort({short_url: "desc"}).limit(1).then(
          (latestURL) => {
            if (latestURL.length > 0) {
              short_url = parseInt(latestURL[0].short_url) + 1;

            } 
            resObj = {
              original_url: original_url, 
              short_url: short_url
            }

            let newURL = new URLModel(resObj);
            newURL.save();
            res.json(resObj);
          }
        )   
      }
    })
  }
  catch {
    res.json({ error: 'invalid url' })
  }
}) 

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
