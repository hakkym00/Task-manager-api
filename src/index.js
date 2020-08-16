const express = require('express')
require('./db/mongoose.js')
const userRouter = require('./router/user.js')
const taskRouter = require('./router/tasks.js')

const app = express()
const port = process.env.PORT


app.use(express.json())
app.use(userRouter)
app.use(taskRouter)


app.listen(port, () => {
    console.log('Your server is running on port ' + port)
})
