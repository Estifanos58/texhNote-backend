const User = require('../models/User');
const Note = require('../models/Note');
const bcrypt = require('bcrypt');

// @desc    Get all users
// @route   GET /users
// @access  Private

 const getAllUsers = async (req, res) => {
    try{
        const users = await User.find().select('-password').lean()
        if(!users?.length){
            return res.status(400).json({
                message : 'No users found'
            })
        }
        res.json(users)
    } catch(err){
        console.log(err)
    }
 }

 // @desc    create a new users
// @route   POST /users
// @access  Private

const createNewUser = async (req, res) => {

    try{
        const {username, roles, password} = req.body

        //Confirm data
        if(!username || !password) {
            return res.status(400).json({ message : 'All fields are required'})
        }
    
        //Check for duplicate
        const duplicate =  await User.findOne({username}).lean().exec() 
    
        if(duplicate) {
            return res.status(409).json({message: 'Duplicate username'})
        }
    
        //Hash password
        const hashedPwd = await bcrypt.hash(password, 10) //salt rounds
    
        const userObject = {
            username,
            roles,
            "password" : hashedPwd
        }
    
        // Create and store new user
        const user = await User.create(userObject)
    
        if(user){
            res.status(201).json({
                message : 'User created successfully',
            })
        } else {
            res.status(400).json({ message: 'Invalid user data received'})
        }
    } catch(err){
        console.log(err)
        res.status(400).json({message: 'Error has occured'})
    }
   
}

// @desc    Update new users
// @route   PUT /users
// @access  Private

const updateUser  = async (req, res) => {
 try{
    const {id, username, password, roles, active} = req.body

    //confirm data
    if(!id || !username || !Array.isArray(roles) || !roles.length || typeof(active) !== 'boolean') {
        return res.status(400).json({message : 'All fields are required'})
    }

    const user = await User.findById(id).exec()

    if(!user){
        return res.status(404).json({
            message : 'User not found'
        })
    }

    // Check for duplicate

    const duplicate =  await User.findOne({ username }).lean().exec()

    // Allow updates to the original user
    if(duplicate && duplicate?._id.toString() !== id){
        return res.status(409).json({message : 'Duplicate username'})
    }
    user.username = username
    user.roles = roles
    user.active = active

    if(password) {
        // hashed password
        user.password = await bcrypt.hash(password, 10)
    }

    const updatedUser = await user.save()

    res.json({message: `${updatedUser.username} updated`})
} catch(err) {
    console.log(err)
}
}


// @desc    Delete a users
// @route   DELETE /users
// @access  Private

const deleteUser = async (req, res) => {
    try{
        const {id} = req.body

        if(!id){
            return res.status(400).json({message : 'User ID is required'})
        }

        const note = await Note.findOne({ user: id}).lean().exec()

        if(note){
            return res.status(400).json({message : 'User has notes. Delete notes first'})
        }
        const user = await User.findById(id).exec()

        if(!user){
            return res.status(400).json({message: "User not found"})
        }

        const result = await User.deleteOne({_id: id}).exec()

        const reply = `Username ${result.username} deleted`

        res.json(reply)
    } catch(err) {
        console.log(err)
    }
}

module.exports = {
    getAllUsers,
    createNewUser,
    updateUser,
    deleteUser
}
