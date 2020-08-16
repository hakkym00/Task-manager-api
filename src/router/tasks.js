const express = require('express')
const router = new express.Router()
const auth = require('../middleware/auth.js')
const Tasks = require('../model/tasks.js')



router.post('/tasks', auth, async (req, res) => {

   const task = new Tasks({
        ...req.body,
        owner: req.user._id
   })

    try{
        await task.save()
        res.status(201).send(task)
    }
    catch(e){
        res.status(400).send()
    }
    
})

router.get('/tasks', auth, async (req,res) => {
   const match ={}
   const sort = {}

   if (req.query.completed){
       match.completed = req.query.completed === 'true'
   }
   if(req.query.sortBy){
       const part = req.query.sortBy.split(':')
       sort[part[0]] = part[1] === 'desc' ? -1 : 1
   }
   
    try {

        await req.user.populate({
            path: 'tasks',
            match: match,
            options:{
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()

        res.status(200).send(req.user.tasks)
    } catch (e) {
        res.status(500).send()
    }

})
router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id

    try{
        const task = await Tasks.findOne({_id, owner: req.user._id})
        if(!task) {
            return res.status(404).send()
        }
        res.status(200).send(task)

    } catch (e) {
        res.status(500).send()
    }
})

router.patch('/tasks/:id', auth, async(req, res) => {
    const updatedKeys = Object.keys(req.body)
    const validKeys = ['description', 'completed']
    const isValid = updatedKeys.every((key) => validKeys.includes(key))
    if(!isValid){
      return  res.status(400).send({error: 'Invalid Input'})
    }
    try{
        const task = await Tasks.findOne({_id: req.params.id, owner: req.user._id})
        if(!task){
           return res.status(404).send({error: 'Not found'})
        }

        updatedKeys.forEach((key) => task[key] = req.body[key])
        task.save()

     res.status(200).send(task)
    }
    catch(e){
        res.status(500).send()
    }
})

router.delete('/tasks/:id', auth, async(req, res) => {
    try {
        const task = await Tasks.findOneAndDelete({_id: req.params.id, owner: req.user._id})
        if(!task){
          return res.status(404).send()
        }
        res.send(task)
    } catch (e) {
        res.status(500).send()
    }
})


module.exports = router
