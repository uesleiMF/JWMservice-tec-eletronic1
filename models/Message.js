const mongoose = require("mongoose");


const MessageSchema = new mongoose.Schema(
{

// ==========================
// CONVERSA
// ==========================

conversationId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Conversation",
    required:true,
    index:true
},



// ==========================
// PEDIDO RELACIONADO
// ==========================

orderId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Order",
    default:null
},




// ==========================
// USUÁRIOS
// ==========================

senderId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true,
    index:true
},


receiverId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true,
    index:true
},





// ==========================
// ID CLIENTE
// evita mensagem duplicada
// ==========================

clientMessageId:{
    type:String,
    default:null,
    index:true
},





// ==========================
// TIPO DA MENSAGEM
// ==========================

type:{
    type:String,

    enum:[
        "text",
        "image",
        "file",
        "audio",
        "location",
        "system"
    ],

    default:"text"
},





// ==========================
// TEXTO
// ==========================

text:{
    type:String,
    trim:true,
    default:""
},





// ==========================
// ANEXOS
// ==========================

attachment:{

    url:{
        type:String,
        default:null
    },


    fileName:{
        type:String,
        default:null
    },


    fileType:{
        type:String,
        default:null
    },


    fileSize:{
        type:Number,
        default:0
    }

},





// ==========================
// LOCALIZAÇÃO
// ==========================

location:{

    latitude:Number,

    longitude:Number

},





// ==========================
// ENTREGA
// ==========================

delivered:{
    type:Boolean,
    default:false
},


deliveredAt:{
    type:Date,
    default:null
},





// ==========================
// VISUALIZAÇÃO
// ==========================

isRead:{
    type:Boolean,
    default:false
},


readAt:{
    type:Date,
    default:null
},





// ==========================
// EDIÇÃO
// ==========================

edited:{
    type:Boolean,
    default:false
},


editedAt:{
    type:Date,
    default:null
},





// ==========================
// EXCLUSÃO
// ==========================

deleted:{
    type:Boolean,
    default:false
},


deletedAt:{
    type:Date,
    default:null
}



},
{

timestamps:true

}

);






// ==========================
// ÍNDICES
// ==========================

MessageSchema.index({

    conversationId:1,

    createdAt:1

});


MessageSchema.index({

    senderId:1

});


MessageSchema.index({

    receiverId:1

});


MessageSchema.index({

    clientMessageId:1

});


MessageSchema.index({

    orderId:1

});







// ==========================
// MÉTODOS
// ==========================


// marcar entregue

MessageSchema.methods.markAsDelivered =
function(){


this.delivered = true;

this.deliveredAt = new Date();


return this.save();


};





// marcar visualizada

MessageSchema.methods.markAsRead =
function(){


this.isRead = true;

this.readAt = new Date();


return this.save();


};





// editar

MessageSchema.methods.editMessage =
function(newText){


this.text = newText;

this.edited = true;

this.editedAt = new Date();


return this.save();


};





// excluir

MessageSchema.methods.deleteMessage =
function(){


this.deleted = true;

this.deletedAt = new Date();


return this.save();


};






module.exports =
mongoose.model(
"Message",
MessageSchema
);