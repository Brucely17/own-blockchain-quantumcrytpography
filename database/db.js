

const mongoose=require('mongoose');

async function getDatabase(){

    mongoose.connect('mongodb+srv://purushoth170288:Bruce17@cluster0.yfliaq8.mongodb.net/?retryWrites=true&w=majority').then((
        console.log('database connected ')
    )).catch((err)=>{
        console.log('Database connection Error!',err)
    });



}

module.exports={
    getDatabase
    
}