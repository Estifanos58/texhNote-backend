const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser')
const path = require('path');
require('dotenv').config()
const {logger, logEvents} = require('./middleware/logger.js')
const {errorHandler}  = require('./middleware/errorHandler.js')
const corsOptions = require('./config/corsOptions.js')
const connectDB = require('./config/dbConn.js')
const mongoose = require('mongoose')

const app = express();
const PORT = process.env.PORT || 3500;

// Connect to MongoDB
connectDB()


//3rd Party middleware
app.use(cookieParser())
//Custom middleware 
app.use(logger)


// Built in middleware
app.use(express.json());
app.use(cors(corsOptions));



app.use('/', express.static(path.join(__dirname, 'public')));

app.use('/' , require('./routes/root.js'));
app.use('/users', require('./routes/userRoutes.js'));
app.use('/auth', require('./routes/authRoutes.js'));
app.use('/notes', require('./routes/noteRoutes.js'))

app.all('*', (req, res)=>{
    res.status(404)
    if(req.accepts('html')){
        res.sendFile(path.join(__dirname, 'views', '404.html'));
    } else  if ( req.accepts('json')) {
        res.json({
            message : '404 Not Found'
        })
    } else {
        res.type('txt').send('404 Not Found');
    }
})


app.use(errorHandler)

mongoose.connection.once('open', ()=>{
    console.log('Connected to MongoDB')
    app.listen(PORT,()=> console.log(`Server is running on port ${PORT}`));
})

mongoose.connection.on('error', (err)=>{
    console.log(err)
    logEvents(`${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`, 'mongoErrLog.log')
})