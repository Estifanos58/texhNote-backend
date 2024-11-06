const User = require('../models/User');
const Note = require('../models/Note');

const getAllNotes = async (req,res)=>{
    try{
        // GET all notes from MongoDB
        const notes = await Note.find().lean().exec()

        // If no notes
        if(!notes?.length) {
            return res.status(404).json({
                message: "you have no Notes present."
            })
        }

        // Add userName to each note before sending the response
        // See Promise.all with map() here: https://youtu.be/41qJBBEpjRe
        // You could also do this with a for... of loop

        const notesWithUser = await Promise.all(notes.map(async (note)=>{
            const user = await User.findById(note.user).lean().exec()
            return {...note, username: user.username}
        }))

        res.json(notesWithUser)
    } catch(err){
        console.log(err)
        res.json({
            message: 'Unexpected error happend'
        })
    }
    
}

const createNewNote = async (req, res)=>{
    try{
        const { user, title, text } = req.body

        if(!user || !title || !text) {
            return res.status(404).json({
                message: "All inputs must be filled"
            })
        }

        // Check for duplicate title
        const duplicate = await Note.findOne({title}).lean().exec()

        if(duplicate) {
            return res.status(409).json({
                message: "Duplicate note title"
            })
        }

        const newNote = {
            user,
            title,
            text
        }

        const note = await Note.create(newNote)

        if(note){
            res.json({
                message: 'New Note created'
            })
        } else {
            res.status(400).json({ message: 'Invalid user data received'})
        }
    }catch(err){
        console.log(err)
        res.status(400).json({
            message: "Unexpected error happend"
        })
    }
}

const updateNotes = async (req, res)=>{
    try{
        const {id, user, title, text, completed} = req.body
        if(!id || !user || !title || !text ){
            return res.status(400).json({
                message : "All fields are required"
            })
        }
        const note = await Note.findOne({_id:id}) .exec()
    
        if(!note) {
            return res.status(404).json({
                message: 'Note not Found'
            })
        }
    
        // Check for duplicate title
        const duplicate = await Note.findOne({ title }).lean().exec()

        // Allow renaming of the original note 
        if (duplicate && duplicate?._id.toString() !== id) {
            return res.status(409).json({ message: 'Duplicate note title' })
        }

        note.user = user
        note.title = title
        note.text = text
        note.completed = completed

        const updatedNote = await note.save()

        res.json({message: `${updatedNote.title} updated`})
   
    }catch(err){
        console.log(err)
        res.status(400).json({
            message: "Error Has Occured"
        })
    }
    
}

const deleteNote = async (req,res)=>{
    try{
        const {id} = req.body
        if(!id) {
            return res.status(400).json({
                message: "Note Id Required"
            })
        }
        const result = await Note.deleteOne({_id: id}).exec() 

        const reply = `Note ${result.title} deleted`

        res.json(reply)
    }catch(err){
        console.log(err)
        res.status(400).json({
            message: "Error has Occured"
        })
    }
}

module.exports = {
    getAllNotes,
    createNewNote,
    updateNotes,
    deleteNote
}