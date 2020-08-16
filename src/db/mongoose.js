const mongoose = require('mongoose')

mongoose.connect(process.env.MONGO_COLLECTION,{
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
})
