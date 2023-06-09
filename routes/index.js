var express = require('express');
var router = express.Router();
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt')
const cors = require('cors');
const OAuth = require('oauth');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
require("dotenv").config()
const mySecretURI = process.env["MONGO_URI"];
const nounKey = process.env["NOUN_KEY"];
const nounSecret = process.env["NOUN_SECRET"];
const initializeArray = require('../controllers/initArray.js')

// How many salt rounds to use for bcrypt
const saltRounds = 10;

// set strictQuery to false in order to deal with the deprecation warning
mongoose.set("strictQuery", false);
// Connect to Database
mongoose
  .connect(mySecretURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .catch((e) => console.log(e));

// Schema for storing information
const itemSchema = new Schema({
  text: String,
  type: String,
  visible: Boolean,
  image: String,
  background: String,
  page: String,
  user: String,
  profile: String,
  row: Number,
  column: Number,
  speak: Boolean,
  date: Date
})

// Model for storing items
const ItemData = mongoose.model('Item', itemSchema);

// Schema for storing username information
const userSchema = new Schema({
  username: String,
  email: String,
  password: String
})

// Model for storing username information
const UsernameData = mongoose.model('User', userSchema);

// Schema for storing bugs
const bugSchema = new Schema({
  bug: String,
  antecedent: String,
  date: Date
});

// Model for storing bug information
const BugsData = mongoose.model('Bug', bugSchema);

/* POST to get all information associated with a user */
router.post('/api/retrieve', async(req, res) => {
  console.log('I am in index.js POST /api/retrieve');
  try {
    let responseData = await ItemData.find({user: req.body.username})
    if (responseData.length == 0) {
      for (let i = 0; i < initializeArray.length; i++) {
        const dataBody = {
          text: initializeArray[i].text,
          type: initializeArray[i].type,
          visible: initializeArray[i].visible,
          image: initializeArray[i].image,
          background: initializeArray[i].background,
          page: initializeArray[i].page,
          user: req.body.username,
          profile: initializeArray[i].profile,
          row: initializeArray[i].row,
          column: initializeArray[i].column,
          speak: true,
          date: new Date()
        }
        const newItem = new ItemData(dataBody);
        const saveReponse = await newItem.save();
        if (!saveReponse['_id']) {
          throw new Error('Failed to save item ' + dataBody.text)
        }
      }
      responseData = await ItemData.find({user: req.body.username})
    };
    res.send(responseData);
  } catch (error) {
    console.log(error);
    res.json({ error: 'Error retrieving data' })
  }
});

router.put('/api/update', async (req, res) => {
  console.log('I am in PUT /api/update');
  if ( !req.body.text || !req.body.type || !req.body.image || !req.body.background || !req.body.id) {
    return res.json({ 'error': 'missing'})
  }

  try {
    const item = await ItemData.findById(req.body.id)
    if (!item) {
      throw new Error('Item not found')
    }
    item.text = req.body.text;
    item.type = req.body.type;
    item.visible = req.body.visible;
    item.image = req.body.image;
    item.background = req.body.background;
    item.speak = req.body.speak;
    const saveItem = await item.save();
    if (!saveItem['_id']) {
      throw new Error('Failed to save item');
    }
    res.json({'success': 'Item updated successfully'})
  } catch (error) {
    console.log(error);
    res.json({'error': 'Failed to save data'})
  }
})

router.post('/api/create', async (req, res) => {
  console.log('I am in POST /api/create');
  if (!req.body.text || !req.body.type || !req.body.image || !req.body.background ) {
    return res.json({'error': 'missing fields'});
  };
  try {
    const objectData = req.body;
    objectData.date = new Date();
    const newItem = new ItemData(objectData);
    const saveReponse = await newItem.save();
    if (!saveReponse['_id']) {
      throw new Error('Failed to save item ' + req.body.text)
    }
    res.json({'success': 'item saved successfully'});
  } catch (error) {
    console.log(error);
    res.json({'error': 'failed to save'});
  }
});

router.delete('/api/delete', async (req, res) => {
  console.log('I am in DELETE /api/delete');
  try {
    const deleteResponse = await ItemData.deleteOne({ '_id': req.body.id});
    if (deleteResponse.deletedCount != 1) {
      throw new Error ('DeletedCount was not 1')
    };
  
    res.json({'success': 'successfully deleted item ' + req.body.id})
  } catch (error) {
    console.log(error);
    res.json({'error': 'failed to delete ' + req.body.id})
  }
})

router.post('/api/login', async (req, res) => {
  console.log('I am in POST /api/login');
  if (!req.body.password || !req.body.username) {
    return res.json({'error': 'missing fields'})
  }
  try {
    const userResult = await UsernameData.findOne({ username: req.body.username })
    if (!userResult) {
      return res.json({ 'error': 'not found'})
    }

    const match = await bcrypt.compare(req.body.password, userResult.password);
    if (match) {
      res.json({'success': 'successfully logged in'})
    } else {
      res.json({'error': 'password fail'})
    }
  } catch (error) {
    console.log(error)
    res.json({'error': 'error occurred'})
  }
})

router.post('/api/register', async (req, res) => {
  console.log('I am in POST /api/register');
  if (!req.body.username || !req.body.email || !req.body.password) {
    return res.json({'error': 'missing fields'})
  }
  try {
    const userResult = await UsernameData.findOne({ username: req.body.username });
    const emailResult = await UsernameData.findOne({ email: req.body.email });
    if (emailResult) {
      console.log(emailResult)
      return res.json({'error': 'email taken'})
    } else if (userResult) {
      return res.json({'error': 'username taken'})
    }

    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
    const newUser = new UsernameData({
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword
    })

    const saveReponse = await newUser.save();
    if (!saveReponse['_id']) {
      throw new Error('Failed to save user ' + req.body.email + ' ' + req.body.username)
    }

    res.json({'success': 'User registered successfully'})
  } catch (error) {
    console.log(error);
    res.json({'error': 'failed'})
  }
})

router.post('/api/report', async (req, res) => {
  console.log('I am in POST /api/report');
  if (!req.body.bug || !req.body.antecedent) {
    return res.json({'error': 'fields missing'})
  }
  try {
    const newBug = new BugsData({
      bug: req.body.bug,
      antecedent: req.body.antecedent,
      date: new Date()
    })
    const savedBug = await newBug.save();
    if (!savedBug['_id']) {
      throw new Error('Failed to save bug ' + req.body.bug);
    };
    res.json({'success': 'reported'})
  } catch (error) {
    console.log(error);
    res.json({'error': 'failed'})
  }
})

// API endpoint for seraching images with the noun project
router.get('/api/search/images', (req, res) => {
  console.log("I am in /api/search/images")
  console.log(req.query);
  let oauth = new OAuth.OAuth(
    'https://api.thenounproject.com',
    'https://api.thenounproject.com',
    nounKey,
    nounSecret,
    '1.0',
    null,
    'HMAC-SHA1'
  )
  oauth.get(
    `https://api.thenounproject.com/v2/icon?query=${req.query.query}&limit=10`,
    null,
    null,
    function(e, data) {
      if (e) {
        console.log(e);
        res.json({"error": "Failed to authenticate"})
      }
      const parsedData = JSON.parse(data);
      res.json(parsedData);
    }
  )
})

module.exports = router;
