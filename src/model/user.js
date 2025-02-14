const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('../model/tasks.js')

const userSchema = new mongoose.Schema({
    name : {
        type: String,
        trim: true
    },
    age : {
        type: Number,
        default: 0,
        validate:(value) => {
            if (value < 0) {
                throw new Error('Invalid age')
            }
        }
    },
    email:{
        type: String,
        trim: true,
        required:true,
        unique: true,
        lowercase: true,
        validate:(value) => {
            if(!validator.isEmail(value)) {
                throw new Error('Invalid Email')
            }
        }
        
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 7,
        validate:(value) => {
            if(value.toLowerCase().includes('password')){
                throw new Error('Invalid password. Avoid including "password" as your password')
            }
        }
    },
    tokens: [{
        token:{
            type: String,
            required: true
        }
    }],
    avatar:{
        type: Buffer
    }
},{
    timestamps: true
})

userSchema.virtual('tasks',{
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})

userSchema.methods.toJSON = function(){
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject
}

userSchema.methods.generateAuthToken = async function () {
    const user = this

    const token = jwt.sign({_id: user._id.toString()}, process.env.SECRET_KEY)
    user.tokens = user.tokens.concat({ token })
    await user.save()
    return token

}

userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({email})
    if(!user) {
        throw new Error('Invalid email and password')
    }
    const isValid= await bcrypt.compare(password, user.password)
    if(!isValid){
        throw new Error('Invalid email and password')
    }
    return user
}

userSchema.pre('save', async function (next) {
    const user = this
    if(user.isModified('password')){
      user.password =  await bcrypt.hash(user.password, 8)
    }
    next()
})

userSchema.pre('remove', async function (req, res, next){
    const user = this
    tasks = await Task.deleteMany({owner: user._id})
    next()
})

const User = mongoose.model('User', userSchema)

module.exports = User
