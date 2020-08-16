const express = require('express')
const router = new express.Router()
const auth = require('../middleware/auth.js')
const User = require('../model/user.js')
const multer = require('multer')
const sharp = require('sharp')


router.post('/users', async(req, res) => {
    const user = new User(req.body)
    try{
        await user.save()
        const token = await user.generateAuthToken()
        res.status(201).send({user, token})
    }
    catch(e){
        res.status(400).send()
    }
    
})

router.post('/users/login', async(req, res) => {
    try {
    const user = await  User.findByCredentials(req.body.email, req.body.password)
    const token = await user.generateAuthToken()

        res.send({user , token})
    } catch (e) { 
        res.status(400).send()
    }
})

router.post('/user/logout' , auth, async(req, res) => {
    try {
        console.log(req.user)
        req.user.tokens = req.user.tokens.filter((token) => {
           return token.token !== req.token
        })
        await req.user.save()

       res.send()
        
    } catch (e) {
        res.status(500).send()
    }
})

router.post('/user/logoutall', auth, async(req, res) => {

try {
    req.user.tokens = []
    await req.user.save()
    res.send()
} catch (e) {
    res.status(500).send()
}
})

router.get('/user/me', auth, async (req, res) => {
    res.send(req.user)
})

router.patch('/users/me', auth, async(req, res) => {
    const updatedKeys = Object.keys(req.body)
    const isAllowedKeys = ['name', 'age', 'email', 'password']
    const isValid = updatedKeys.every((key) => isAllowedKeys.includes(key))
    if(!isValid){
        return res.send({error: 'Input not allowed'})
    }

    try{
      
        updatedKeys.forEach((key) => req.user[key] = req.body[key])
        req.user.save()
        if(!req.user){
           return res.status(404).send({error: 'invalid'})
       }
       res.status(200).send(req.user)
    }
    catch(e) {
        res.status(500).send()

    }

})

router.delete('/users/me', auth, async(req, res) => {
    try {
        await req.user.remove()

        res.send(req.user)
    } catch (e) {
        res.status(500).send()
    }
})


const upload = multer({
    limits:{
        fileSize: 1000000
    },
    fileFilter:(req, file, cb) => {
        if(!file.originalname.match(/\.(jpg|jpeg|png)/)){
            return cb(new Error('please upload an image'))
        }
        cb(undefined, true)
    }
})

router.post('/user/me/avatar', auth, upload.single('avatar'), async(req, res) => {
    const buffer = await sharp(req.file.buffer).resize({width: 250, height: 250}).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
},(error, req, res, next) => {
    res.status(404).send({error: error.message})
})

router.delete('/user/me/avatar', auth, async(req, res) => {
   try{
        req.user.avatar = undefined
        await req.user.save()
        res.send()

   }catch(e) {
       res.status(404).send({error: "Image Not Found"})
   }
   
})

router.get('/user/:id/avatar', async(req, res) => {
    try {
        const user = await User.findById({_id: req.params.id})
        if(!user || !user.avatar) {
            throw new Error()
        }
        res.set('Content-Type' , 'image/jpg')
        res.send(user.avatar)
    } catch (e) {
        res.status(404).send()
    }
})


module.exports = router