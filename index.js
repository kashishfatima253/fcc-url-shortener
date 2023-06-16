require('dotenv').config();
const express = require('express');
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require('cors');
const dns = require('dns');
const urlparser = require('url');
const app = express();

let DB_URI = process.env['DB_URI']
mongoose.connect(DB_URI,{
  useNewUrlParser: true, 
  useUnifiedTopology: true 
}).then(success=>{
  console.log("MongoDB connected")
})

let urlSchema = new mongoose.Schema({
  url:String,
  short_url: Number
})

let urls = mongoose.model('urls', urlSchema)

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

var urlcount = 100
app.post('/api/shorturl', async (req, res) => {

    let originalurl = req.body.url
    let url = originalurl
    let hostname = new URL(url).hostname
    if(!hostname.includes("www.")){
      url = "www." + hostname
    }
    else{
      url = hostname
    }

    const articles = await urls.find({
        url: url
      });
    // res.send(articles);
    // console.log(articles)
    if(articles.length > 0){
      var shorturl = articles._id
      // console.log(shorturl); 
    }
  // else{
  //     console.log("article does not exist")
  // }
   
    dns.lookup(url, async (error,address)=>{
      // console.log(address)
      // console.log(error)
      if(address){
        // console.log("SUCCESS")
      if(articles.length > 0){
        // console.log("Url exist in db")
        res.json({
          original_url: originalurl,
          short_url: articles[0].short_url
        })
      }
      else{
      // console.log("Url does not exist in db")
      urlcount++
      var insertUrl = new urls({
        url: originalurl,
        short_url : urlcount
      });
      await insertUrl.save();

      // const findurl = await urls.find({
      //   url: url
      // });
        res.json({
          original_url: originalurl,
          short_url: urlcount
        })
        }
      }
      else{
        // console.log("FAILURE")
        res.json({
          error: 'invalid url'
        })
      }
  })
});

app.get('/api/shorturl/:short_url', async (req, res) => {
  let shorturl = req.params.short_url

  const url = await urls.findOne({
    short_url: shorturl
  })
  // console.log(url)
 res.redirect(url.url)
});


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
