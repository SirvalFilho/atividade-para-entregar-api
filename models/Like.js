import mongoose from "mongoose";

const likeSchema = new mongoose.Schema({
    curtidor: { 
        type: 'ObjectId', 
        ref: 'Users' 
    },
    curtido: { 
        type: 'ObjectId', 
        ref: 'Users' 
    },
});

const Like = mongoose.model("Likes", likeSchema);

export default Like;